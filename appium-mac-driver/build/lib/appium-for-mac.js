"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DEFAULT_A4M_PORT = exports.DEFAULT_A4M_HOST = exports.AppiumForMac = void 0;

require("source-map-support/register");

var _appiumBaseDriver = require("appium-base-driver");

var _logger = _interopRequireDefault(require("./logger"));

var _teen_process = require("teen_process");

var _appiumSupport = require("appium-support");

var _path = _interopRequireDefault(require("path"));

const DEFAULT_A4M_HOST = '127.0.0.1';
exports.DEFAULT_A4M_HOST = DEFAULT_A4M_HOST;
const DEFAULT_A4M_PORT = 4622;
exports.DEFAULT_A4M_PORT = DEFAULT_A4M_PORT;

const REQ_A4M_APP_PATH = _path.default.resolve('/Applications', 'AppiumForMac.app');

const a4mLog = _appiumSupport.logger.getLogger('Appium4Mac');

class AppiumForMac {
  constructor() {
    this.proxyHost = DEFAULT_A4M_HOST;
    this.proxyPort = DEFAULT_A4M_PORT;
    this.proc = null;
    this.jwproxy = new _appiumBaseDriver.JWProxy({
      server: this.proxyHost,
      port: this.proxyPort
    });
  }

  async start() {
    if (!(await _appiumSupport.fs.exists(REQ_A4M_APP_PATH))) {
      throw new Error('Could not verify AppiumForMacDriver install; please install to your /Applications folder');
    }

    const startDetector = (stdout, stderr) => {
      return stderr.indexOf('Started HTTP server') !== -1;
    };

    let processIsAlive = false;

    try {
      await this.killAll();

      const a4mBinary = _path.default.resolve(REQ_A4M_APP_PATH, 'Contents', 'MacOS', 'AppiumForMac');

      this.proc = new _teen_process.SubProcess(a4mBinary, []);
      processIsAlive = true;

      for (let stream of ['STDOUT', 'STDERR']) {
        this.proc.on(`lines-${stream.toLowerCase()}`, lines => {
          for (let l of lines) {
            a4mLog.info(`[${stream}] ${l.trim()}`);
          }
        });
      }

      this.proc.on('exit', (code, signal) => {
        processIsAlive = false;
        let msg = `AppiumForMac exited unexpectedly with code ${code}, ` + `signal ${signal}`;

        _logger.default.error(msg);
      });

      _logger.default.info(`Spawning AppiumForMac with: ${this.appium4macdriver}`);

      await this.proc.start(startDetector);
      await this.waitForOnline();
    } catch (e) {
      this.emit(AppiumForMac.EVENT_ERROR, e);

      if (processIsAlive) {
        await this.proc.stop();
      }

      _logger.default.errorAndThrow(e);
    }
  }

  sessionId() {
    if (this.state !== AppiumForMac.STATE_ONLINE) {
      return null;
    }

    return this.jwproxy.sessionId;
  }

  async waitForOnline() {
    return true;
  }

  async getStatus() {
    return await this.sendCommand('/status', 'GET');
  }

  async startSession(caps) {
    this.proxyReqRes = this.jwproxy.proxyReqRes.bind(this.jwproxy);
    await this.sendCommand('/session', 'POST', {
      desiredCapabilities: caps
    });
  }

  async stop() {
    try {
      if (this.proc) {
        await this.proc.stop();
      }
    } catch (e) {
      _logger.default.error(e);
    }
  }

  async sendCommand(url, method, body) {
    let res;

    try {
      res = await this.jwproxy.command(url, method, body);
    } catch (e) {
      if (e.message.indexOf('Did not get a valid response object') === -1 || e.message.indexOf('value') !== -1) {
        throw e;
      }
    }

    return res;
  }

  async proxyReq(req, res) {
    return await this.jwproxy.proxyReqRes(req, res);
  }

  async killAll() {
    const processName = 'AppiumForMac';

    _logger.default.info(`Killing any old AppiumForMac`);

    await _appiumSupport.process.killProcess(processName);

    _logger.default.info('Successfully cleaned up old Appium4Mac servers');
  }

  async deleteSession() {
    _logger.default.debug('Deleting AppiumForMac server session');

    try {
      await this.sendCommand('/', 'DELETE');
    } catch (err) {
      _logger.default.warn(`Did not get confirmation AppiumForMac deleteSession worked; ` + `Error was: ${err}`);
    }
  }

}

exports.AppiumForMac = AppiumForMac;
var _default = AppiumForMac;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hcHBpdW0tZm9yLW1hYy5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX0E0TV9IT1NUIiwiREVGQVVMVF9BNE1fUE9SVCIsIlJFUV9BNE1fQVBQX1BBVEgiLCJwYXRoIiwicmVzb2x2ZSIsImE0bUxvZyIsImxvZ2dlciIsImdldExvZ2dlciIsIkFwcGl1bUZvck1hYyIsImNvbnN0cnVjdG9yIiwicHJveHlIb3N0IiwicHJveHlQb3J0IiwicHJvYyIsImp3cHJveHkiLCJKV1Byb3h5Iiwic2VydmVyIiwicG9ydCIsInN0YXJ0IiwiZnMiLCJleGlzdHMiLCJFcnJvciIsInN0YXJ0RGV0ZWN0b3IiLCJzdGRvdXQiLCJzdGRlcnIiLCJpbmRleE9mIiwicHJvY2Vzc0lzQWxpdmUiLCJraWxsQWxsIiwiYTRtQmluYXJ5IiwiU3ViUHJvY2VzcyIsInN0cmVhbSIsIm9uIiwidG9Mb3dlckNhc2UiLCJsaW5lcyIsImwiLCJpbmZvIiwidHJpbSIsImNvZGUiLCJzaWduYWwiLCJtc2ciLCJsb2ciLCJlcnJvciIsImFwcGl1bTRtYWNkcml2ZXIiLCJ3YWl0Rm9yT25saW5lIiwiZSIsImVtaXQiLCJFVkVOVF9FUlJPUiIsInN0b3AiLCJlcnJvckFuZFRocm93Iiwic2Vzc2lvbklkIiwic3RhdGUiLCJTVEFURV9PTkxJTkUiLCJnZXRTdGF0dXMiLCJzZW5kQ29tbWFuZCIsInN0YXJ0U2Vzc2lvbiIsImNhcHMiLCJwcm94eVJlcVJlcyIsImJpbmQiLCJkZXNpcmVkQ2FwYWJpbGl0aWVzIiwidXJsIiwibWV0aG9kIiwiYm9keSIsInJlcyIsImNvbW1hbmQiLCJtZXNzYWdlIiwicHJveHlSZXEiLCJyZXEiLCJwcm9jZXNzTmFtZSIsInByb2Nlc3MiLCJraWxsUHJvY2VzcyIsImRlbGV0ZVNlc3Npb24iLCJkZWJ1ZyIsImVyciIsIndhcm4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsZ0JBQWdCLEdBQUcs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QWxCLE1BQStCLENBQUMsQ0FEcEMsRUFDdUM7QUFDckMsY0FBTW1CLENBQU47QUFDRDtBQUNGOztBQUNELFdBQU9rQixHQUFQO0FBQ0Q7O0FBRUQsUUFBTUcsUUFBTixDQUFnQkMsR0FBaEIsRUFBcUJKLEdBQXJCLEVBQTBCO0FBQ3hCLFdBQU8sTUFBTSxLQUFLaEQsT0FBTCxDQUFhMEMsV0FBYixDQUF5QlUsR0FBekIsRUFBOEJKLEdBQTlCLENBQWI7QUFDRDs7QUFFRCxRQUFNbkMsT0FBTixHQUFpQjtBQUNmLFVBQU13QyxXQUFXLEdBQUcsY0FBcEI7O0FBRUEzQixvQkFBSUwsSUFBSixDQUFVLDhCQUFWOztBQUNBLFVBQU1pQyx1QkFBUUMsV0FBUixDQUFvQkYsV0FBcEIsQ0FBTjs7QUFDQTNCLG9CQUFJTCxJQUFKLENBQVMsZ0RBQVQ7QUFDRDs7QUFFRCxRQUFNbUMsYUFBTixHQUF1QjtBQUNyQjlCLG9CQUFJK0IsS0FBSixDQUFVLHNDQUFWOztBQUdBLFFBQUk7QUFDRixZQUFNLEtBQUtsQixXQUFMLENBQWlCLEdBQWpCLEVBQXNCLFFBQXRCLENBQU47QUFDRCxLQUZELENBRUUsT0FBT21CLEdBQVAsRUFBWTtBQUNaaEMsc0JBQUlpQyxJQUFKLENBQVUsOERBQUQsR0FDTixjQUFhRCxHQUFJLEVBRHBCO0FBRUQ7QUFDRjs7QUFsSWdCOzs7ZUFzSUovRCxZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSldQcm94eSB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IFN1YlByb2Nlc3MgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZnMsIGxvZ2dlciwgcHJvY2VzcyB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCBERUZBVUxUX0E0TV9IT1NUID0gJzEyNy4wLjAuMSc7XG5jb25zdCBERUZBVUxUX0E0TV9QT1JUID0gNDYyMjtcblxuY29uc3QgUkVRX0E0TV9BUFBfUEFUSCA9IHBhdGgucmVzb2x2ZSgnL0FwcGxpY2F0aW9ucycsICdBcHBpdW1Gb3JNYWMuYXBwJyk7XG5cbmNvbnN0IGE0bUxvZyA9IGxvZ2dlci5nZXRMb2dnZXIoJ0FwcGl1bTRNYWMnKTtcblxuY2xhc3MgQXBwaXVtRm9yTWFjIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMucHJveHlIb3N0ID0gREVGQVVMVF9BNE1fSE9TVDtcbiAgICB0aGlzLnByb3h5UG9ydCA9IERFRkFVTFRfQTRNX1BPUlQ7XG4gICAgdGhpcy5wcm9jID0gbnVsbDtcbiAgICB0aGlzLmp3cHJveHkgPSBuZXcgSldQcm94eSh7c2VydmVyOiB0aGlzLnByb3h5SG9zdCwgcG9ydDogdGhpcy5wcm94eVBvcnR9KTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0ICgpIHtcbiAgICBpZiAoIWF3YWl0IGZzLmV4aXN0cyhSRVFfQTRNX0FQUF9QQVRIKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgdmVyaWZ5IEFwcGl1bUZvck1hY0RyaXZlciBpbnN0YWxsOyBwbGVhc2UgaW5zdGFsbCB0byB5b3VyIC9BcHBsaWNhdGlvbnMgZm9sZGVyJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhcnREZXRlY3RvciA9IChzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgcmV0dXJuIHN0ZGVyci5pbmRleE9mKCdTdGFydGVkIEhUVFAgc2VydmVyJykgIT09IC0xO1xuICAgIH07XG5cbiAgICBsZXQgcHJvY2Vzc0lzQWxpdmUgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5raWxsQWxsKCk7XG5cbiAgICAgIC8vIHNldCB1cCBvdXIgc3VicHJvY2VzcyBvYmplY3RcbiAgICAgIGNvbnN0IGE0bUJpbmFyeSA9IHBhdGgucmVzb2x2ZShSRVFfQTRNX0FQUF9QQVRILCAnQ29udGVudHMnLCAnTWFjT1MnLCAnQXBwaXVtRm9yTWFjJyk7XG4gICAgICB0aGlzLnByb2MgPSBuZXcgU3ViUHJvY2VzcyhhNG1CaW5hcnksIFtdKTtcbiAgICAgIHByb2Nlc3NJc0FsaXZlID0gdHJ1ZTtcblxuICAgICAgLy8gaGFuZGxlIGxvZyBvdXRwdXRcbiAgICAgIGZvciAobGV0IHN0cmVhbSBvZiBbJ1NURE9VVCcsICdTVERFUlInXSkge1xuICAgICAgICB0aGlzLnByb2Mub24oYGxpbmVzLSR7c3RyZWFtLnRvTG93ZXJDYXNlKCl9YCwgKGxpbmVzKSA9PiB7XG4gICAgICAgICAgZm9yIChsZXQgbCBvZiBsaW5lcykge1xuICAgICAgICAgICAgYTRtTG9nLmluZm8oYFske3N0cmVhbX1dICR7bC50cmltKCl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gaGFuZGxlIG91dC1vZi1ib3VuZCBleGl0IGJ5IHNpbXBseSBsb2dnaW5nXG4gICAgICAvLyBUT0RPIGFkZCBhYmlsaXR5IGZvciBkcml2ZXIgdG8gaGFuZGxlIHRoaXMgZ3JhY2VmdWxseSBhbmQgbWF5YmVcbiAgICAgIC8vIHJlc3RhcnRcbiAgICAgIHRoaXMucHJvYy5vbignZXhpdCcsIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICAgICAgcHJvY2Vzc0lzQWxpdmUgPSBmYWxzZTtcbiAgICAgICAgbGV0IG1zZyA9IGBBcHBpdW1Gb3JNYWMgZXhpdGVkIHVuZXhwZWN0ZWRseSB3aXRoIGNvZGUgJHtjb2RlfSwgYCArXG4gICAgICAgICAgICAgICAgICBgc2lnbmFsICR7c2lnbmFsfWA7XG4gICAgICAgIGxvZy5lcnJvcihtc2cpO1xuICAgICAgfSk7XG4gICAgICBsb2cuaW5mbyhgU3Bhd25pbmcgQXBwaXVtRm9yTWFjIHdpdGg6ICR7dGhpcy5hcHBpdW00bWFjZHJpdmVyfWApO1xuXG4gICAgICAvLyBzdGFydCBzdWJwcm9jIGFuZCB3YWl0IGZvciBzdGFydERldGVjdG9yXG4gICAgICBhd2FpdCB0aGlzLnByb2Muc3RhcnQoc3RhcnREZXRlY3Rvcik7XG5cbiAgICAgIGF3YWl0IHRoaXMud2FpdEZvck9ubGluZSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuZW1pdChBcHBpdW1Gb3JNYWMuRVZFTlRfRVJST1IsIGUpO1xuICAgICAgLy8ganVzdCBiZWNhdXNlIHdlIGhhZCBhbiBlcnJvciBkb2Vzbid0IG1lYW4gdGhlIHdpbmFwcGRyaXZlciBwcm9jZXNzXG4gICAgICAvLyBmaW5pc2hlZDsgd2Ugc2hvdWxkIGNsZWFuIHVwIGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKHByb2Nlc3NJc0FsaXZlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucHJvYy5zdG9wKCk7XG4gICAgICB9XG4gICAgICBsb2cuZXJyb3JBbmRUaHJvdyhlKTtcbiAgICB9XG4gIH1cblxuICBzZXNzaW9uSWQgKCkge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSBBcHBpdW1Gb3JNYWMuU1RBVEVfT05MSU5FKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5qd3Byb3h5LnNlc3Npb25JZDtcbiAgfVxuXG4gIGFzeW5jIHdhaXRGb3JPbmxpbmUgKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgICAvLyBUT0RPOiBBY3R1YWxseSBjaGVjayB2aWEgSFRUUFxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3RhdHVzICgpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zZW5kQ29tbWFuZCgnL3N0YXR1cycsICdHRVQnKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0U2Vzc2lvbiAoY2Fwcykge1xuICAgIHRoaXMucHJveHlSZXFSZXMgPSB0aGlzLmp3cHJveHkucHJveHlSZXFSZXMuYmluZCh0aGlzLmp3cHJveHkpO1xuICAgIGF3YWl0IHRoaXMuc2VuZENvbW1hbmQoJy9zZXNzaW9uJywgJ1BPU1QnLCB7ZGVzaXJlZENhcGFiaWxpdGllczogY2Fwc30pO1xuICB9XG5cbiAgYXN5bmMgc3RvcCAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLnByb2MpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wcm9jLnN0b3AoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuZXJyb3IoZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2VuZENvbW1hbmQgKHVybCwgbWV0aG9kLCBib2R5KSB7XG4gICAgbGV0IHJlcztcbiAgICAvLyBuZWVkIHRvIGNvdmVyIG92ZXIgQTRNJ3MgYmFkIGhhbmRsaW5nIG9mIHJlc3BvbnNlcywgd2hpY2ggc29tZXRpbWVzXG4gICAgLy8gZG9uJ3QgaGF2ZSAndmFsdWUnIHByb3BlcnRpZXNcbiAgICB0cnkge1xuICAgICAgcmVzID0gYXdhaXQgdGhpcy5qd3Byb3h5LmNvbW1hbmQodXJsLCBtZXRob2QsIGJvZHkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5kZXhPZignRGlkIG5vdCBnZXQgYSB2YWxpZCByZXNwb25zZSBvYmplY3QnKSA9PT0gLTEgfHxcbiAgICAgICAgICBlLm1lc3NhZ2UuaW5kZXhPZigndmFsdWUnKSAhPT0gLTEpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIGFzeW5jIHByb3h5UmVxIChyZXEsIHJlcykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmp3cHJveHkucHJveHlSZXFSZXMocmVxLCByZXMpO1xuICB9XG5cbiAgYXN5bmMga2lsbEFsbCAoKSB7XG4gICAgY29uc3QgcHJvY2Vzc05hbWUgPSAnQXBwaXVtRm9yTWFjJztcbiAgICAvLyBqcyBoaW50IGNhbm5vdCBoYW5kbGUgYmFja3RpY2tzLCBldmVuIGVzY2FwZWQsIHdpdGhpbiB0ZW1wbGF0ZSBsaXRlcmFsc1xuICAgIGxvZy5pbmZvKGBLaWxsaW5nIGFueSBvbGQgQXBwaXVtRm9yTWFjYCk7XG4gICAgYXdhaXQgcHJvY2Vzcy5raWxsUHJvY2Vzcyhwcm9jZXNzTmFtZSk7XG4gICAgbG9nLmluZm8oJ1N1Y2Nlc3NmdWxseSBjbGVhbmVkIHVwIG9sZCBBcHBpdW00TWFjIHNlcnZlcnMnKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZVNlc3Npb24gKCkge1xuICAgIGxvZy5kZWJ1ZygnRGVsZXRpbmcgQXBwaXVtRm9yTWFjIHNlcnZlciBzZXNzaW9uJyk7XG4gICAgLy8gcmVseSBvbiBqd3Byb3h5J3MgaW50ZWxsaWdlbmNlIHRvIGtub3cgd2hhdCB3ZSdyZSB0YWxraW5nIGFib3V0IGFuZFxuICAgIC8vIGRlbGV0ZSB0aGUgY3VycmVudCBzZXNzaW9uXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZENvbW1hbmQoJy8nLCAnREVMRVRFJyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2cud2FybihgRGlkIG5vdCBnZXQgY29uZmlybWF0aW9uIEFwcGl1bUZvck1hYyBkZWxldGVTZXNzaW9uIHdvcmtlZDsgYCArXG4gICAgICAgIGBFcnJvciB3YXM6ICR7ZXJyfWApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBBcHBpdW1Gb3JNYWMsIERFRkFVTFRfQTRNX0hPU1QsIERFRkFVTFRfQTRNX1BPUlR9O1xuZXhwb3J0IGRlZmF1bHQgQXBwaXVtRm9yTWFjO1xuIl0sImZpbGUiOiJsaWIvYXBwaXVtLWZvci1tYWMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
