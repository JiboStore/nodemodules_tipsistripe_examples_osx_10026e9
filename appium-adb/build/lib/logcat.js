"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _teen_process = require("teen_process");

var _appiumSupport = require("appium-support");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _events = _interopRequireDefault(require("events"));

const {
  EventEmitter
} = _events.default;

const log = _appiumSupport.logger.getLogger('Logcat');

const MAX_BUFFER_SIZE = 10000;
const LOGCAT_PROC_STARTUP_TIMEOUT = 10000;

class Logcat extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.adb = opts.adb;
    this.clearLogs = opts.clearDeviceLogsOnStart || false;
    this.debug = opts.debug;
    this.debugTrace = opts.debugTrace;
    this.maxBufferSize = opts.maxBufferSize || MAX_BUFFER_SIZE;
    this.logs = [];
    this.logIdxSinceLastRequest = 0;
  }

  async startCapture() {
    let started = false;
    return await new _bluebird.default(async (_resolve, _reject) => {
      const resolve = function (...args) {
        started = true;

        _resolve(...args);
      };

      const reject = function (...args) {
        started = true;

        _reject(...args);
      };

      if (this.clearLogs) {
        await this.clear();
      }

      log.debug('Starting logcat capture');
      this.proc = new _teen_process.SubProcess(this.adb.path, this.adb.defaultArgs.concat(['logcat', '-v', 'threadtime']));
      this.proc.on('exit', (code, signal) => {
        log.error(`Logcat terminated with code ${code}, signal ${signal}`);
        this.proc = null;

        if (!started) {
          log.warn('Logcat not started. Continuing');
          resolve();
        }
      });
      this.proc.on('lines-stderr', lines => {
        for (let line of lines) {
          if (/execvp\(\)/.test(line)) {
            log.error('Logcat process failed to start');
            reject(new Error(`Logcat process failed to start. stderr: ${line}`));
          }

          this.outputHandler(_lodash.default.trim(line), 'STDERR: ');
        }

        resolve();
      });
      this.proc.on('lines-stdout', lines => {
        resolve();

        for (let line of lines) {
          this.outputHandler(_lodash.default.trim(line));
        }
      });
      await this.proc.start(0);
      setTimeout(resolve, LOGCAT_PROC_STARTUP_TIMEOUT);
    });
  }

  outputHandler(output, prefix = '') {
    if (!output) {
      return;
    }

    if (this.logs.length >= this.maxBufferSize) {
      this.logs.shift();

      if (this.logIdxSinceLastRequest > 0) {
        --this.logIdxSinceLastRequest;
      }
    }

    const outputObj = {
      timestamp: Date.now(),
      level: 'ALL',
      message: output
    };
    this.logs.push(outputObj);
    this.emit('output', outputObj);
    const isTrace = /W\/Trace/.test(output);

    if (this.debug && (!isTrace || this.debugTrace)) {
      log.debug(prefix + output);
    }
  }

  async stopCapture() {
    log.debug('Stopping logcat capture');

    if (!this.proc || !this.proc.isRunning) {
      log.debug('Logcat already stopped');
      this.proc = null;
      return;
    }

    this.proc.removeAllListeners('exit');
    await this.proc.stop();
    this.proc = null;
  }

  getLogs() {
    if (this.logIdxSinceLastRequest < this.logs.length) {
      const result = this.logs.slice(this.logIdxSinceLastRequest);
      this.logIdxSinceLastRequest = this.logs.length;
      return result;
    }

    return [];
  }

  getAllLogs() {
    return this.logs;
  }

  async clear() {
    log.debug('Clearing logcat logs from device');

    try {
      const args = this.adb.defaultArgs.concat(['logcat', '-c']);
      log.debug(`Running '${this.adb.path} ${args.join(' ')}'`);
      await (0, _teen_process.exec)(this.adb.path, args);
    } catch (err) {
      log.warn(`Failed to clear logcat logs: ${err.message}`);
    }
  }

}

var _default = Logcat;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9sb2djYXQuanMiXSwibmFtZXMiOlsiRXZlbnRFbWl0dGVyIiwiZXZlbnRzIiwibG9nIiwibG9nZ2VyIiwiZ2V0TG9nZ2VyIiwiTUFYX0JVRkZFUl9TSVpFIiwiTE9HQ0FUX1BST0NfU1RBUlRVUF9USU1FT1VUIiwiTG9nY2F0IiwiY29uc3RydWN0b3IiLCJvcHRzIiwiYWRiIiwiY2xlYXJMb2dzIiwiY2xlYXJEZXZpY2VMb2dzT25TdGFydCIsImRlYnVnIiwiZGVidWdUcmFjZSIsIm1heEJ1ZmZlclNpemUiLCJsb2dzIiwibG9nSWR4U2luY2VMYXN0UmVxdWVzdCIsInN0YXJ0Q2FwdHVyZSIsInN0YXJ0ZWQiLCJCIiwiX3Jlc29sdmUiLCJfcmVqZWN0IiwicmVzb2x2ZSIsImFyZ3MiLCJyZWplY3QiLCJjbGVhciIsInByb2MiLCJTdWJQcm9jZXNzIiwicGF0aCIsImRlZmF1bHRBcmdzIiwiY29uY2F0Iiwib24iLCJjb2RlIiwic2lnbmFsIiwiZXJyb3IiLCJ3YXJuIiwibGluZXMiLCJsaW5lIiwidGVzdCIsIkVycm9yIiwib3V0cHV0SGFuZGxlciIsIl8iLCJ0cmltIiwic3RhcnQiLCJzZXRUaW1lb3V0Iiwib3V0cHV0IiwicHJlZml4IiwibGVuZ3RoIiwic2hpZnQiLCJvdXRwdXRPYmoiLCJ0aW1lc3RhbXAiLCJEYXRlIiwibm93IiwibGV2ZWwiLCJtZXNzYWdlIiwicHVzaCIsImVtaXQiLCJpc1RyYWNlIiwic3RvcENhcHR1cmUiLCJpc1J1bm5pbmciLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJzdG9wIiwiZ2V0TG9ncyIsInJlc3VsdCIsInNsaWNlIiwiZ2V0QWxsTG9ncyIsImpvaW4iLCJlcnIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0EsTUFBTTtBQUFFQSxFQUFBQTtBQUFGLElBQW1CQyxlQUF6Qjs7QUFHQSxNQUFNQyxHQUFHLEdBQUdDLHNCQUFPQyxTQUFQLENBQWlCLFFBQWpC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RSxNQUFBQSxHQUFHLENBQUNrQyxJQUFKLENBQVUsZ0NBQStCZ0MsR0FBRyxDQUFDYixPQUFRLEVBQXJEO0FBQ0Q7QUFDRjs7QUF0SCtCOztlQXlIbkJoRCxNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IFN1YlByb2Nlc3MsIGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGV2ZW50cyBmcm9tICdldmVudHMnO1xuY29uc3QgeyBFdmVudEVtaXR0ZXIgfSA9IGV2ZW50cztcblxuXG5jb25zdCBsb2cgPSBsb2dnZXIuZ2V0TG9nZ2VyKCdMb2djYXQnKTtcbmNvbnN0IE1BWF9CVUZGRVJfU0laRSA9IDEwMDAwO1xuY29uc3QgTE9HQ0FUX1BST0NfU1RBUlRVUF9USU1FT1VUID0gMTAwMDA7XG5cbmNsYXNzIExvZ2NhdCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yIChvcHRzID0ge30pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYWRiID0gb3B0cy5hZGI7XG4gICAgdGhpcy5jbGVhckxvZ3MgPSBvcHRzLmNsZWFyRGV2aWNlTG9nc09uU3RhcnQgfHwgZmFsc2U7XG4gICAgdGhpcy5kZWJ1ZyA9IG9wdHMuZGVidWc7XG4gICAgdGhpcy5kZWJ1Z1RyYWNlID0gb3B0cy5kZWJ1Z1RyYWNlO1xuICAgIHRoaXMubWF4QnVmZmVyU2l6ZSA9IG9wdHMubWF4QnVmZmVyU2l6ZSB8fCBNQVhfQlVGRkVSX1NJWkU7XG4gICAgdGhpcy5sb2dzID0gW107XG4gICAgdGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0ID0gMDtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0Q2FwdHVyZSAoKSB7XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gYXdhaXQgbmV3IEIoYXN5bmMgKF9yZXNvbHZlLCBfcmVqZWN0KSA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgcHJvbWlzZS9wYXJhbS1uYW1lc1xuICAgICAgY29uc3QgcmVzb2x2ZSA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICBfcmVzb2x2ZSguLi5hcmdzKTtcbiAgICAgIH07XG4gICAgICBjb25zdCByZWplY3QgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgX3JlamVjdCguLi5hcmdzKTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLmNsZWFyTG9ncykge1xuICAgICAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgICB9XG5cbiAgICAgIGxvZy5kZWJ1ZygnU3RhcnRpbmcgbG9nY2F0IGNhcHR1cmUnKTtcbiAgICAgIHRoaXMucHJvYyA9IG5ldyBTdWJQcm9jZXNzKHRoaXMuYWRiLnBhdGgsIHRoaXMuYWRiLmRlZmF1bHRBcmdzLmNvbmNhdChbJ2xvZ2NhdCcsICctdicsICd0aHJlYWR0aW1lJ10pKTtcbiAgICAgIHRoaXMucHJvYy5vbignZXhpdCcsIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICAgICAgbG9nLmVycm9yKGBMb2djYXQgdGVybWluYXRlZCB3aXRoIGNvZGUgJHtjb2RlfSwgc2lnbmFsICR7c2lnbmFsfWApO1xuICAgICAgICB0aGlzLnByb2MgPSBudWxsO1xuICAgICAgICBpZiAoIXN0YXJ0ZWQpIHtcbiAgICAgICAgICBsb2cud2FybignTG9nY2F0IG5vdCBzdGFydGVkLiBDb250aW51aW5nJyk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMucHJvYy5vbignbGluZXMtc3RkZXJyJywgKGxpbmVzKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgICBpZiAoL2V4ZWN2cFxcKFxcKS8udGVzdChsaW5lKSkge1xuICAgICAgICAgICAgbG9nLmVycm9yKCdMb2djYXQgcHJvY2VzcyBmYWlsZWQgdG8gc3RhcnQnKTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYExvZ2NhdCBwcm9jZXNzIGZhaWxlZCB0byBzdGFydC4gc3RkZXJyOiAke2xpbmV9YCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm91dHB1dEhhbmRsZXIoXy50cmltKGxpbmUpLCAnU1RERVJSOiAnKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMucHJvYy5vbignbGluZXMtc3Rkb3V0JywgKGxpbmVzKSA9PiB7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xuICAgICAgICAgIHRoaXMub3V0cHV0SGFuZGxlcihfLnRyaW0obGluZSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHRoaXMucHJvYy5zdGFydCgwKTtcbiAgICAgIC8vIHJlc29sdmUgYWZ0ZXIgYSB0aW1lb3V0LCBldmVuIGlmIG5vIG91dHB1dCB3YXMgcmVjb3JkZWRcbiAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgTE9HQ0FUX1BST0NfU1RBUlRVUF9USU1FT1VUKTtcbiAgICB9KTtcbiAgfVxuXG4gIG91dHB1dEhhbmRsZXIgKG91dHB1dCwgcHJlZml4ID0gJycpIHtcbiAgICBpZiAoIW91dHB1dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmxvZ3MubGVuZ3RoID49IHRoaXMubWF4QnVmZmVyU2l6ZSkge1xuICAgICAgdGhpcy5sb2dzLnNoaWZ0KCk7XG4gICAgICBpZiAodGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0ID4gMCkge1xuICAgICAgICAtLXRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgb3V0cHV0T2JqID0ge1xuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgbGV2ZWw6ICdBTEwnLFxuICAgICAgbWVzc2FnZTogb3V0cHV0LFxuICAgIH07XG4gICAgdGhpcy5sb2dzLnB1c2gob3V0cHV0T2JqKTtcbiAgICB0aGlzLmVtaXQoJ291dHB1dCcsIG91dHB1dE9iaik7XG4gICAgY29uc3QgaXNUcmFjZSA9IC9XXFwvVHJhY2UvLnRlc3Qob3V0cHV0KTtcbiAgICBpZiAodGhpcy5kZWJ1ZyAmJiAoIWlzVHJhY2UgfHwgdGhpcy5kZWJ1Z1RyYWNlKSkge1xuICAgICAgbG9nLmRlYnVnKHByZWZpeCArIG91dHB1dCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc3RvcENhcHR1cmUgKCkge1xuICAgIGxvZy5kZWJ1ZygnU3RvcHBpbmcgbG9nY2F0IGNhcHR1cmUnKTtcbiAgICBpZiAoIXRoaXMucHJvYyB8fCAhdGhpcy5wcm9jLmlzUnVubmluZykge1xuICAgICAgbG9nLmRlYnVnKCdMb2djYXQgYWxyZWFkeSBzdG9wcGVkJyk7XG4gICAgICB0aGlzLnByb2MgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnByb2MucmVtb3ZlQWxsTGlzdGVuZXJzKCdleGl0Jyk7XG4gICAgYXdhaXQgdGhpcy5wcm9jLnN0b3AoKTtcbiAgICB0aGlzLnByb2MgPSBudWxsO1xuICB9XG5cbiAgZ2V0TG9ncyAoKSB7XG4gICAgaWYgKHRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdCA8IHRoaXMubG9ncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMubG9ncy5zbGljZSh0aGlzLmxvZ0lkeFNpbmNlTGFzdFJlcXVlc3QpO1xuICAgICAgdGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0ID0gdGhpcy5sb2dzLmxlbmd0aDtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldEFsbExvZ3MgKCkge1xuICAgIHJldHVybiB0aGlzLmxvZ3M7XG4gIH1cblxuICBhc3luYyBjbGVhciAoKSB7XG4gICAgbG9nLmRlYnVnKCdDbGVhcmluZyBsb2djYXQgbG9ncyBmcm9tIGRldmljZScpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcmdzID0gdGhpcy5hZGIuZGVmYXVsdEFyZ3MuY29uY2F0KFsnbG9nY2F0JywgJy1jJ10pO1xuICAgICAgbG9nLmRlYnVnKGBSdW5uaW5nICcke3RoaXMuYWRiLnBhdGh9ICR7YXJncy5qb2luKCcgJyl9J2ApO1xuICAgICAgYXdhaXQgZXhlYyh0aGlzLmFkYi5wYXRoLCBhcmdzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZy53YXJuKGBGYWlsZWQgdG8gY2xlYXIgbG9nY2F0IGxvZ3M6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExvZ2NhdDtcbiJdLCJmaWxlIjoibGliL2xvZ2NhdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
