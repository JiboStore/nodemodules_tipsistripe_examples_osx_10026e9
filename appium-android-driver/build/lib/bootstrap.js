"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.COMMAND_TYPES = exports.AndroidBootstrap = void 0;

require("source-map-support/register");

var _uiautomator = _interopRequireDefault(require("./uiautomator"));

var _net = _interopRequireDefault(require("net"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _appiumSupport = require("appium-support");

const log = _appiumSupport.logger.getLogger('AndroidBootstrap');

const COMMAND_TYPES = {
  ACTION: 'action',
  SHUTDOWN: 'shutdown'
};
exports.COMMAND_TYPES = COMMAND_TYPES;
const SEND_COMMAND_TIMEOUT = 1 * 60 * 1000;

class AndroidBootstrap {
  constructor(adb, systemPort = 4724, webSocket = undefined) {
    this.adb = adb;
    this.systemPort = systemPort;
    this.webSocket = webSocket;
    this.ignoreUnexpectedShutdown = false;
  }

  get onUnexpectedShutdown() {
    if (!this._onUnexpectedShutdownPromise) {
      let reject;
      this._onUnexpectedShutdownPromise = new _bluebird.default(function _onUnexpectedShutdownPromise(_resolve, _reject) {
        reject = _reject;
      });
      this._onUnexpectedShutdownPromise.cancel = reject;
    }

    return this._onUnexpectedShutdownPromise;
  }

  async start(appPackage, disableAndroidWatchers = false, acceptSslCerts = false) {
    try {
      const rootDir = _path.default.resolve(__dirname, '..', '..');

      const startDetector = s => {
        return /Appium Socket Server Ready/.test(s);
      };

      const bootstrapJar = _path.default.resolve(rootDir, 'bootstrap', 'bin', 'AppiumBootstrap.jar');

      await this.init();
      await this.adb.forwardPort(this.systemPort, 4724);
      this.process = await this.uiAutomator.start(bootstrapJar, 'io.appium.android.bootstrap.Bootstrap', startDetector, '-e', 'pkg', appPackage, '-e', 'disableAndroidWatchers', disableAndroidWatchers, '-e', 'acceptSslCerts', acceptSslCerts);
      this.process.on('output', (stdout, stderr) => {
        const alertRe = /Emitting system alert message/;

        if (alertRe.test(stdout)) {
          log.debug('Emitting alert message...');

          if (this.webSocket) {
            this.webSocket.sockets.emit('alert', {
              message: stdout
            });
          }
        }

        let stdoutLines = (stdout || '').split('\n');
        const uiautoLog = /\[APPIUM-UIAUTO\](.+)\[\/APPIUM-UIAUTO\]/;

        for (let line of stdoutLines) {
          if (line.trim()) {
            if (uiautoLog.test(line)) {
              let innerLine = uiautoLog.exec(line)[1].trim();
              let logMethod = log.info.bind(log);

              if (/\[debug\]/.test(innerLine)) {
                logMethod = log.debug.bind(log);
              }

              logMethod(`[BOOTSTRAP LOG] ${innerLine}`);
            } else {
              log.debug(`[UIAUTO STDOUT] ${line}`);
            }
          }
        }

        let stderrLines = (stderr || '').split('\n');

        for (let line of stderrLines) {
          if (line.trim()) {
            log.debug(`[UIAUTO STDERR] ${line}`);
          }
        }
      });
      return await new _bluebird.default((resolve, reject) => {
        try {
          this.socketClient = _net.default.connect(this.systemPort);
          this.socketClient.on('error', err => {
            if (!this.ignoreUnexpectedShutdown) {
              throw new Error(`Android bootstrap socket crashed: ${err}`);
            }
          });
          this.socketClient.once('connect', () => {
            log.info('Android bootstrap socket is now connected');
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      log.errorAndThrow(`Error occured while starting AndroidBootstrap. Original error: ${err}`);
    }
  }

  async sendCommand(type, extra = {}) {
    if (!this.socketClient) {
      throw new Error('Socket connection closed unexpectedly');
    }

    return await new _bluebird.default((resolve, reject) => {
      let cmd = Object.assign({
        cmd: type
      }, extra);
      let cmdJson = `${JSON.stringify(cmd)} \n`;
      log.debug(`Sending command to android: ${_lodash.default.truncate(cmdJson, {
        length: 1000
      }).trim()}`);
      this.socketClient.write(cmdJson);
      this.socketClient.setEncoding('utf8');
      let streamData = '';
      let sendCommandTimeoutHandler = null;
      this.socketClient.on('data', data => {
        if (sendCommandTimeoutHandler) {
          clearTimeout(sendCommandTimeoutHandler);
        }

        log.debug('Received command result from bootstrap');

        try {
          streamData = JSON.parse(streamData + data);
          this.socketClient.removeAllListeners('data');

          if (streamData.status === 0) {
            return resolve(streamData.value);
          }

          reject((0, _appiumBaseDriver.errorFromCode)(streamData.status, streamData.value));
        } catch (err) {
          if (!_lodash.default.isString(streamData)) {
            log.error('Got an unexpected error inside socket listener');
            log.error(err.stack);
            return reject((0, _appiumBaseDriver.errorFromCode)(13, err.message));
          }

          log.debug(`Stream still not complete, waiting up to ${SEND_COMMAND_TIMEOUT}ms for the data to arrive`);
          streamData += data;
          sendCommandTimeoutHandler = setTimeout(() => {
            const errMsg = `Server socket stopped responding. The recent response was '${streamData}'`;
            log.error(errMsg);
            this.socketClient.removeAllListeners('data');
            reject((0, _appiumBaseDriver.errorFromCode)(13, errMsg));
          }, SEND_COMMAND_TIMEOUT);
        }
      });
    });
  }

  async sendAction(action, params = {}) {
    let extra = {
      action,
      params
    };
    return await this.sendCommand(COMMAND_TYPES.ACTION, extra);
  }

  async shutdown() {
    if (!this.uiAutomator) {
      log.warn('Cannot shut down Android bootstrap; it has already shut down');
      return;
    }

    this.uiAutomator.removeAllListeners(_uiautomator.default.EVENT_CHANGED);

    if (this.socketClient) {
      await this.sendCommand(COMMAND_TYPES.SHUTDOWN);
    }

    await this.uiAutomator.shutdown();
    this.uiAutomator = null;
  }

  async init() {
    this.uiAutomator = new _uiautomator.default(this.adb);
    this.uiAutomator.on(_uiautomator.default.EVENT_CHANGED, msg => {
      if (msg.state === _uiautomator.default.STATE_STOPPED) {
        this.uiAutomator = null;
        this.onUnexpectedShutdown.cancel(new Error('UiAUtomator shut down unexpectedly'));
      }
    });
  }

  set ignoreUnexpectedShutdown(ignore) {
    log.debug(`${ignore ? 'Ignoring' : 'Watching for'} bootstrap disconnect`);
    this._ignoreUnexpectedShutdown = ignore;
  }

  get ignoreUnexpectedShutdown() {
    return this._ignoreUnexpectedShutdown;
  }

}

exports.AndroidBootstrap = AndroidBootstrap;
var _default = AndroidBootstrap;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9ib290c3RyYXAuanMiXSwibmFtZXMiOlsibG9nIiwibG9nZ2VyIiwiZ2V0TG9nZ2VyIiwiQ09NTUFORF9UWVBFUyIsIkFDVElPTiIsIlNIVVRET1dOIiwiU0VORF9DT01NQU5EX1RJTUVPVVQiLCJBbmRyb2lkQm9vdHN0cmFwIiwiY29uc3RydWN0b3IiLCJhZGIiLCJzeXN0ZW1Qb3J0Iiwid2ViU29ja2V0IiwidW5kZWZpbmVkIiwiaWdub3JlVW5leHBlY3RlZFNodXRkb3duIiwib25VbmV4cGVjdGVkU2h1dGRvd24iLCJfb25VbmV4cGVjdGVkU2h1dGRvd25Qcm9taXNlIiwicmVqZWN0IiwiQiIsIl9yZXNvbHZlIiwiX3JlamVjdCIsImNhbmNlbCIsInN0YXJ0IiwiYXBwUGFja2FnZSIsImRpc2FibGVBbmRyb2lkV2F0Y2hlcnMiLCJhY2NlcHRTc2xDZXJ0cyIsInJvb3REaXIiLCJwYXRoIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsInN0YXJ0RGV0ZWN0b3IiLCJzIiwidGVzdCIsImJvb3RzdHJhcEphciIsImluaXQiLCJmb3J3YXJkUG9ydCIsInByb2Nlc3MiLCJ1aUF1dG9tYXRvciIsIm9uIiwic3Rkb3V0Iiwic3RkZXJyIiwiYWxlcnRSZSIsImRlYnVnIiwic29ja2V0cyIsImVtaXQiLCJtZXNzYWdlIiwic3Rkb3V0TGluZXMiLCJzcGxpdCIsInVpYXV0b0xvZyIsImxpbmUiLCJ0cmltIiwiaW5uZXJMaW5lIiwiZXhlYyIsImxvZ01ldGhvZCIsImluZm8iLCJiaW5kIiwic3RkZXJyTGluZXMiLCJzb2NrZXRDbGllbnQiLCJuZXQiLCJjb25uZWN0IiwiZXJyIiwiRXJyb3IiLCJvbmNlIiwiZXJyb3JBbmRUaHJvdyIsInNlbmRDb21tYW5kIiwidHlwZSIsImV4dHJhIiwiY21kIiwiT2JqZWN0IiwiYXNzaWduIiwiY21kSnNvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJfIiwidHJ1bmNhdGUiLCJsZW5ndGgiLCJ3cml0ZSIsInNldEVuY29kaW5nIiwic3RyZWFtRGF0YSIsInNlbmRDb21tYW5kVGltZW91dEhhbmRsZXIiLCJkYXRhIiwiY2xlYXJUaW1lb3V0IiwicGFyc2UiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJzdGF0dXMiLCJ2YWx1ZSIsImlzU3RyaW5nIiwiZXJyb3IiLCJzdGFjayIsInNldFRpbWVvdXQiLCJlcnJNc2ciLCJzZW5kQWN0aW9uIiwiYWN0aW9uIiwicGFyYW1zIiwic2h1dGRvd24iLCJ3YXJuIiwiVWlBdXRvbWF0b3IiLCJFVkVOVF9DSEFOR0VEIiwibXNnIiwic3RhdGUiLCJTVEFURV9TVE9QUEVEIiwiaWdub3JlIiwiX2lnbm9yZVVuZXhwZWN0ZWRTaHV0ZG93biJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQSxNQUFNQSxHQUFHLEdBQUdDLHNCQUFPQyxTQUFQLENBQWlCLGtCQUFqQixDQUFaOztBQUNBLE1BQU1DLGFBQWEsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFLFFBRFk7QUFFcEJDLEVBQUFBLFFBQVEsRUFBRTtBQUZVLENBQXRCOztBQUlBLE1BQU1DLG9CQUFvQixHQUFHLElBQUksRUFBSixHQUFTLElBQXRDOztBQUVBLE1BQU1DLGdCQUFOLENBQXVCO0FBQ3JCQyxFQUFBQSxXQUFXLENBQUVDLEdBQUYsRUFBT0MsVUFBVSxHQUFHLElBQXBCLEVBQTBCQyxTQUFTLEdBQUdDLFNBQXRDLEVBQWlEO0FBQzFELFNBQUtILEdBQUwsR0FBV0EsR0FBWDtBQUNBLFNBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQkEsU0FBakI7QUFDQSxTQUFLRSx3QkFBTCxHQUFnQyxLQUFoQztBQUNEOztBQUVELE1BQUlDLG9CQUFKLEdBQTRCO0FBQzFCLFFBQUksQ0FBQyxLQUFLQyw0QkFBVixFQUF3QztBQUN0QyxVQUFJQyxNQUFKO0FBQ0EsV0FBS0QsNEJBQUwsR0FBb0MsSUFBSUUsaUJBQUosQ0FBTSxTQUFTRiw0QkFB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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVWlBdXRvbWF0b3IgZnJvbSAnLi91aWF1dG9tYXRvcic7XG5pbXBvcnQgbmV0IGZyb20gJ25ldCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBlcnJvckZyb21Db2RlIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcblxuXG5jb25zdCBsb2cgPSBsb2dnZXIuZ2V0TG9nZ2VyKCdBbmRyb2lkQm9vdHN0cmFwJyk7XG5jb25zdCBDT01NQU5EX1RZUEVTID0ge1xuICBBQ1RJT046ICdhY3Rpb24nLFxuICBTSFVURE9XTjogJ3NodXRkb3duJ1xufTtcbmNvbnN0IFNFTkRfQ09NTUFORF9USU1FT1VUID0gMSAqIDYwICogMTAwMDtcblxuY2xhc3MgQW5kcm9pZEJvb3RzdHJhcCB7XG4gIGNvbnN0cnVjdG9yIChhZGIsIHN5c3RlbVBvcnQgPSA0NzI0LCB3ZWJTb2NrZXQgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmFkYiA9IGFkYjtcbiAgICB0aGlzLnN5c3RlbVBvcnQgPSBzeXN0ZW1Qb3J0O1xuICAgIHRoaXMud2ViU29ja2V0ID0gd2ViU29ja2V0O1xuICAgIHRoaXMuaWdub3JlVW5leHBlY3RlZFNodXRkb3duID0gZmFsc2U7XG4gIH1cblxuICBnZXQgb25VbmV4cGVjdGVkU2h1dGRvd24gKCkge1xuICAgIGlmICghdGhpcy5fb25VbmV4cGVjdGVkU2h1dGRvd25Qcm9taXNlKSB7XG4gICAgICBsZXQgcmVqZWN0O1xuICAgICAgdGhpcy5fb25VbmV4cGVjdGVkU2h1dGRvd25Qcm9taXNlID0gbmV3IEIoZnVuY3Rpb24gX29uVW5leHBlY3RlZFNodXRkb3duUHJvbWlzZSAoX3Jlc29sdmUsIF9yZWplY3QpIHtcbiAgICAgICAgcmVqZWN0ID0gX3JlamVjdDtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fb25VbmV4cGVjdGVkU2h1dGRvd25Qcm9taXNlLmNhbmNlbCA9IHJlamVjdDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX29uVW5leHBlY3RlZFNodXRkb3duUHJvbWlzZTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0IChhcHBQYWNrYWdlLCBkaXNhYmxlQW5kcm9pZFdhdGNoZXJzID0gZmFsc2UsIGFjY2VwdFNzbENlcnRzID0gZmFsc2UpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgcm9vdERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicpO1xuICAgICAgY29uc3Qgc3RhcnREZXRlY3RvciA9IChzKSA9PiB7IHJldHVybiAvQXBwaXVtIFNvY2tldCBTZXJ2ZXIgUmVhZHkvLnRlc3Qocyk7IH07XG4gICAgICBjb25zdCBib290c3RyYXBKYXIgPSBwYXRoLnJlc29sdmUocm9vdERpciwgJ2Jvb3RzdHJhcCcsICdiaW4nLCAnQXBwaXVtQm9vdHN0cmFwLmphcicpO1xuXG4gICAgICBhd2FpdCB0aGlzLmluaXQoKTtcbiAgICAgIGF3YWl0IHRoaXMuYWRiLmZvcndhcmRQb3J0KHRoaXMuc3lzdGVtUG9ydCwgNDcyNCk7XG4gICAgICB0aGlzLnByb2Nlc3MgPSBhd2FpdCB0aGlzLnVpQXV0b21hdG9yLnN0YXJ0KFxuICAgICAgICAgICAgICAgICAgICAgICBib290c3RyYXBKYXIsICdpby5hcHBpdW0uYW5kcm9pZC5ib290c3RyYXAuQm9vdHN0cmFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREZXRlY3RvciwgJy1lJywgJ3BrZycsIGFwcFBhY2thZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICctZScsICdkaXNhYmxlQW5kcm9pZFdhdGNoZXJzJywgZGlzYWJsZUFuZHJvaWRXYXRjaGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgJy1lJywgJ2FjY2VwdFNzbENlcnRzJywgYWNjZXB0U3NsQ2VydHMpO1xuXG4gICAgICAvLyBwcm9jZXNzIHRoZSBvdXRwdXRcbiAgICAgIHRoaXMucHJvY2Vzcy5vbignb3V0cHV0JywgKHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICAgIGNvbnN0IGFsZXJ0UmUgPSAvRW1pdHRpbmcgc3lzdGVtIGFsZXJ0IG1lc3NhZ2UvO1xuICAgICAgICBpZiAoYWxlcnRSZS50ZXN0KHN0ZG91dCkpIHtcbiAgICAgICAgICBsb2cuZGVidWcoJ0VtaXR0aW5nIGFsZXJ0IG1lc3NhZ2UuLi4nKTtcbiAgICAgICAgICBpZiAodGhpcy53ZWJTb2NrZXQpIHtcbiAgICAgICAgICAgIHRoaXMud2ViU29ja2V0LnNvY2tldHMuZW1pdCgnYWxlcnQnLCB7bWVzc2FnZTogc3Rkb3V0fSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlIGJvb3RzdHJhcCBsb2dnZXIgd3JhcHMgaXRzIG93biBsb2cgbGluZXMgd2l0aFxuICAgICAgICAvLyBbQVBQSVVNLVVJQVVUT10gLi4uIFtBUFBJVU0tVUlBVVRPXVxuICAgICAgICAvLyBhbmQgbGVhdmVzIGFjdHVhbCBVaUF1dG9tYXRvciBsb2dzIGFzIHRoZXkgYXJlXG4gICAgICAgIGxldCBzdGRvdXRMaW5lcyA9IChzdGRvdXQgfHwgJycpLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgY29uc3QgdWlhdXRvTG9nID0gL1xcW0FQUElVTS1VSUFVVE9cXF0oLispXFxbXFwvQVBQSVVNLVVJQVVUT1xcXS87XG4gICAgICAgIGZvciAobGV0IGxpbmUgb2Ygc3Rkb3V0TGluZXMpIHtcbiAgICAgICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgICAgIGlmICh1aWF1dG9Mb2cudGVzdChsaW5lKSkge1xuICAgICAgICAgICAgICBsZXQgaW5uZXJMaW5lID0gdWlhdXRvTG9nLmV4ZWMobGluZSlbMV0udHJpbSgpO1xuICAgICAgICAgICAgICBsZXQgbG9nTWV0aG9kID0gbG9nLmluZm8uYmluZChsb2cpO1xuICAgICAgICAgICAgICAvLyBpZiB0aGUgYm9vdHN0cmFwIGxvZyBjb25zaWRlcnMgc29tZXRoaW5nIGRlYnVnLCBsb2cgdGhhdCBhc1xuICAgICAgICAgICAgICAvLyBkZWJ1ZyBhbmQgbm90IGluZm9cbiAgICAgICAgICAgICAgaWYgKC9cXFtkZWJ1Z1xcXS8udGVzdChpbm5lckxpbmUpKSB7XG4gICAgICAgICAgICAgICAgbG9nTWV0aG9kID0gbG9nLmRlYnVnLmJpbmQobG9nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsb2dNZXRob2QoYFtCT09UU1RSQVAgTE9HXSAke2lubmVyTGluZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxvZy5kZWJ1ZyhgW1VJQVVUTyBTVERPVVRdICR7bGluZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3RkZXJyTGluZXMgPSAoc3RkZXJyIHx8ICcnKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgIGZvciAobGV0IGxpbmUgb2Ygc3RkZXJyTGluZXMpIHtcbiAgICAgICAgICBpZiAobGluZS50cmltKCkpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgW1VJQVVUTyBTVERFUlJdICR7bGluZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBvbmx5IHJldHVybiB3aGVuIHRoZSBzb2NrZXQgY2xpZW50IGhhcyBjb25uZWN0ZWRcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgQigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy5zb2NrZXRDbGllbnQgPSBuZXQuY29ubmVjdCh0aGlzLnN5c3RlbVBvcnQpO1xuICAgICAgICAgIC8vIFdpbmRvd3M6IHRoZSBzb2NrZXQgZXJyb3JzIG91dCB3aGVuIEFEQiByZXN0YXJ0cy4gTGV0J3MgY2F0Y2ggaXQgdG8gYXZvaWQgY3Jhc2hpbmcuXG4gICAgICAgICAgdGhpcy5zb2NrZXRDbGllbnQub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlnbm9yZVVuZXhwZWN0ZWRTaHV0ZG93bikge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFuZHJvaWQgYm9vdHN0cmFwIHNvY2tldCBjcmFzaGVkOiAke2Vycn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLnNvY2tldENsaWVudC5vbmNlKCdjb25uZWN0JywgKCkgPT4ge1xuICAgICAgICAgICAgbG9nLmluZm8oJ0FuZHJvaWQgYm9vdHN0cmFwIHNvY2tldCBpcyBub3cgY29ubmVjdGVkJyk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZy5lcnJvckFuZFRocm93KGBFcnJvciBvY2N1cmVkIHdoaWxlIHN0YXJ0aW5nIEFuZHJvaWRCb290c3RyYXAuIE9yaWdpbmFsIGVycm9yOiAke2Vycn1gKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzZW5kQ29tbWFuZCAodHlwZSwgZXh0cmEgPSB7fSkge1xuICAgIGlmICghdGhpcy5zb2NrZXRDbGllbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkIHVuZXhwZWN0ZWRseScpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBuZXcgQigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY21kID0gT2JqZWN0LmFzc2lnbih7Y21kOiB0eXBlfSwgZXh0cmEpO1xuICAgICAgbGV0IGNtZEpzb24gPSBgJHtKU09OLnN0cmluZ2lmeShjbWQpfSBcXG5gO1xuICAgICAgbG9nLmRlYnVnKGBTZW5kaW5nIGNvbW1hbmQgdG8gYW5kcm9pZDogJHtfLnRydW5jYXRlKGNtZEpzb24sIHtsZW5ndGg6IDEwMDB9KS50cmltKCl9YCk7XG4gICAgICB0aGlzLnNvY2tldENsaWVudC53cml0ZShjbWRKc29uKTtcbiAgICAgIHRoaXMuc29ja2V0Q2xpZW50LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgICBsZXQgc3RyZWFtRGF0YSA9ICcnO1xuICAgICAgbGV0IHNlbmRDb21tYW5kVGltZW91dEhhbmRsZXIgPSBudWxsO1xuICAgICAgdGhpcy5zb2NrZXRDbGllbnQub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICBpZiAoc2VuZENvbW1hbmRUaW1lb3V0SGFuZGxlcikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChzZW5kQ29tbWFuZFRpbWVvdXRIYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBsb2cuZGVidWcoJ1JlY2VpdmVkIGNvbW1hbmQgcmVzdWx0IGZyb20gYm9vdHN0cmFwJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc3RyZWFtRGF0YSA9IEpTT04ucGFyc2Uoc3RyZWFtRGF0YSArIGRhdGEpO1xuICAgICAgICAgIC8vIHdlIHN1Y2Nlc3NmdWxseSBwYXJzZWQgSlNPTiBzbyB3ZSd2ZSBnb3QgYWxsIHRoZSBkYXRhLFxuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgc29ja2V0IGxpc3RlbmVyIGFuZCBldmFsdWF0ZVxuICAgICAgICAgIHRoaXMuc29ja2V0Q2xpZW50LnJlbW92ZUFsbExpc3RlbmVycygnZGF0YScpO1xuICAgICAgICAgIGlmIChzdHJlYW1EYXRhLnN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoc3RyZWFtRGF0YS52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlamVjdChlcnJvckZyb21Db2RlKHN0cmVhbURhdGEuc3RhdHVzLCBzdHJlYW1EYXRhLnZhbHVlKSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmICghXy5pc1N0cmluZyhzdHJlYW1EYXRhKSkge1xuICAgICAgICAgICAgbG9nLmVycm9yKCdHb3QgYW4gdW5leHBlY3RlZCBlcnJvciBpbnNpZGUgc29ja2V0IGxpc3RlbmVyJyk7XG4gICAgICAgICAgICBsb2cuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3JGcm9tQ29kZSgxMywgZXJyLm1lc3NhZ2UpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbG9nLmRlYnVnKGBTdHJlYW0gc3RpbGwgbm90IGNvbXBsZXRlLCB3YWl0aW5nIHVwIHRvICR7U0VORF9DT01NQU5EX1RJTUVPVVR9bXMgZm9yIHRoZSBkYXRhIHRvIGFycml2ZWApO1xuICAgICAgICAgIHN0cmVhbURhdGEgKz0gZGF0YTtcbiAgICAgICAgICBzZW5kQ29tbWFuZFRpbWVvdXRIYW5kbGVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlcnJNc2cgPSBgU2VydmVyIHNvY2tldCBzdG9wcGVkIHJlc3BvbmRpbmcuIFRoZSByZWNlbnQgcmVzcG9uc2Ugd2FzICcke3N0cmVhbURhdGF9J2A7XG4gICAgICAgICAgICBsb2cuZXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICAgIHRoaXMuc29ja2V0Q2xpZW50LnJlbW92ZUFsbExpc3RlbmVycygnZGF0YScpO1xuICAgICAgICAgICAgcmVqZWN0KGVycm9yRnJvbUNvZGUoMTMsIGVyck1zZykpO1xuICAgICAgICAgIH0sIFNFTkRfQ09NTUFORF9USU1FT1VUKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZW5kQWN0aW9uIChhY3Rpb24sIHBhcmFtcyA9IHt9KSB7XG4gICAgbGV0IGV4dHJhID0ge2FjdGlvbiwgcGFyYW1zfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZW5kQ29tbWFuZChDT01NQU5EX1RZUEVTLkFDVElPTiwgZXh0cmEpO1xuICB9XG5cbiAgYXN5bmMgc2h1dGRvd24gKCkge1xuICAgIGlmICghdGhpcy51aUF1dG9tYXRvcikge1xuICAgICAgbG9nLndhcm4oJ0Nhbm5vdCBzaHV0IGRvd24gQW5kcm9pZCBib290c3RyYXA7IGl0IGhhcyBhbHJlYWR5IHNodXQgZG93bicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBsaXN0bmVycyBzbyB3ZSBkb24ndCB0cmlnZ2VyIHVuZXhwZWN0ZWQgc2h1dGRvd25cbiAgICB0aGlzLnVpQXV0b21hdG9yLnJlbW92ZUFsbExpc3RlbmVycyhVaUF1dG9tYXRvci5FVkVOVF9DSEFOR0VEKTtcbiAgICBpZiAodGhpcy5zb2NrZXRDbGllbnQpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZENvbW1hbmQoQ09NTUFORF9UWVBFUy5TSFVURE9XTik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudWlBdXRvbWF0b3Iuc2h1dGRvd24oKTtcbiAgICB0aGlzLnVpQXV0b21hdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIHRoaXMgaGVscGVyIGZ1bmN0aW9uIG1ha2VzIHVuaXQgdGVzdGluZyBlYXNpZXIuXG4gIGFzeW5jIGluaXQgKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgICB0aGlzLnVpQXV0b21hdG9yID0gbmV3IFVpQXV0b21hdG9yKHRoaXMuYWRiKTtcblxuICAgIC8vIEhhbmRsZSB1bmV4cGVjdGVkIFVpQXV0b21hdG9yIHNodXRkb3duXG4gICAgdGhpcy51aUF1dG9tYXRvci5vbihVaUF1dG9tYXRvci5FVkVOVF9DSEFOR0VELCAobXNnKSA9PiB7XG4gICAgICBpZiAobXNnLnN0YXRlID09PSBVaUF1dG9tYXRvci5TVEFURV9TVE9QUEVEKSB7XG4gICAgICAgIHRoaXMudWlBdXRvbWF0b3IgPSBudWxsO1xuICAgICAgICB0aGlzLm9uVW5leHBlY3RlZFNodXRkb3duLmNhbmNlbChuZXcgRXJyb3IoJ1VpQVV0b21hdG9yIHNodXQgZG93biB1bmV4cGVjdGVkbHknKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZXQgaWdub3JlVW5leHBlY3RlZFNodXRkb3duIChpZ25vcmUpIHtcbiAgICBsb2cuZGVidWcoYCR7aWdub3JlID8gJ0lnbm9yaW5nJyA6ICdXYXRjaGluZyBmb3InfSBib290c3RyYXAgZGlzY29ubmVjdGApO1xuICAgIHRoaXMuX2lnbm9yZVVuZXhwZWN0ZWRTaHV0ZG93biA9IGlnbm9yZTtcbiAgfVxuXG4gIGdldCBpZ25vcmVVbmV4cGVjdGVkU2h1dGRvd24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pZ25vcmVVbmV4cGVjdGVkU2h1dGRvd247XG4gIH1cbn1cblxuZXhwb3J0IHsgQW5kcm9pZEJvb3RzdHJhcCwgQ09NTUFORF9UWVBFUyB9O1xuZXhwb3J0IGRlZmF1bHQgQW5kcm9pZEJvb3RzdHJhcDtcbiJdLCJmaWxlIjoibGliL2Jvb3RzdHJhcC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
