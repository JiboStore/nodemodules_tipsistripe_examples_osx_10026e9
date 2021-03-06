"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IOSDeviceLog = void 0;

require("source-map-support/register");

var _appiumSupport = require("appium-support");

var _iosLog = require("./ios-log");

var _appiumIosDevice = require("appium-ios-device");

const log = _appiumSupport.logger.getLogger('IOSDeviceLog');

class IOSDeviceLog extends _iosLog.IOSLog {
  constructor(opts) {
    super();
    this.udid = opts.udid;
    this.showLogs = !!opts.showLogs;
    this.service = null;
  }

  async startCapture() {
    if (this.service) {
      return;
    }

    this.service = await _appiumIosDevice.services.startSyslogService(this.udid);
    this.service.start(this.onLog.bind(this));
  }

  onLog(logLine) {
    this.broadcast(logLine);

    if (this.showLogs) {
      log.info(logLine);
    }
  }

  get isCapturing() {
    return !!this.service;
  }

  stopCapture() {
    if (!this.service) {
      return;
    }

    this.service.close();
    this.service = null;
  }

}

exports.IOSDeviceLog = IOSDeviceLog;
var _default = IOSDeviceLog;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kZXZpY2UtbG9nL2lvcy1kZXZpY2UtbG9nLmpzIl0sIm5hbWVzIjpbImxvZyIsImxvZ2dlciIsImdldExvZ2dlciIsIklPU0RldmljZUxvZyIsIklPU0xvZyIsImNvbnN0cnVjdG9yIiwib3B0cyIsInVkaWQiLCJzaG93TG9ncyIsInNlcnZpY2UiLCJzdGFydENhcHR1cmUiLCJzZXJ2aWNlcyIsInN0YXJ0U3lzbG9nU2VydmljZSIsInN0YXJ0Iiwib25Mb2ciLCJiaW5kIiwibG9nTGluZSIsImJyb2FkY2FzdCIsImluZm8iLCJpc0NhcHR1cmluZyIsInN0b3BDYXB0dXJlIiwiY2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLEdBQUcsR0FBR0Msc0JBQU9DLFNBQVAsQ0FBaUIsY0FBakIsQ0FBWjs7QUFFQSxNQUFNQyxZQUFOLFNBQTJCQyxjQUEzQixDQUFrQztBQUVoQ0MsRUFBQUEsV0FBVyxDQUFFQyxJQUFGLEVBQVE7QUFDakI7QUFDQSxTQUFLQyxJQUFMLEdBQVlELElBQUksQ0FBQ0MsSUFBakI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLENBQUMsQ0FBQ0YsSUFBSSxDQUFDRSxRQUF2QjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxJQUFmO0FBQ0Q7O0FBRUQsUUFBTUMsWUFBTixHQUFzQjtBQUNwQixRQUFJLEtBQUtELE9BQVQsRUFBa0I7QUFDaEI7QUFDRDs7QUFDRCxTQUFLQSxPQUFMLEdBQWUsTUFBTUUsMEJBQVNDLGtCQUFULENBQTRCLEtBQUtMLElBQWpDLENBQXJCO0FBQ0EsU0FBS0UsT0FBTCxDQUFhSSxLQUFiLENBQW1CLEtBQUtDLEtBQUwsQ0FBV0MsSUFBWCxDQUFnQixJQUFoQixDQUFuQjtBQUNEOztBQUVERCxFQUFBQSxLQUFLLENBQUVFLE9BQUYsRUFBVztBQUNkLFNBQUtDLFNBQUwsQ0FBZUQsT0FBZjs7QUFDQSxRQUFJLEtBQUtSLFFBQVQsRUFBbUI7QUFDakJSLE1BQUFBLEdBQUcsQ0FBQ2tCLElBQUosQ0FBU0YsT0FBVDtBQUNEO0FBQ0Y7O0FBRUQsTUFBSUcsV0FBSixHQUFtQjtBQUNqQixXQUFPLENBQUMsQ0FBQyxLQUFLVixPQUFkO0FBQ0Q7O0FBRURXLEVBQUFBLFdBQVcsR0FBSTtBQUNiLFFBQUksQ0FBQyxLQUFLWCxPQUFWLEVBQW1CO0FBQ2pCO0FBQ0Q7O0FBQ0QsU0FBS0EsT0FBTCxDQUFhWSxLQUFiO0FBQ0EsU0FBS1osT0FBTCxHQUFlLElBQWY7QUFDRDs7QUFsQytCOzs7ZUFzQ25CTixZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IHsgSU9TTG9nIH0gZnJvbSAnLi9pb3MtbG9nJztcbmltcG9ydCB7IHNlcnZpY2VzIH0gZnJvbSAnYXBwaXVtLWlvcy1kZXZpY2UnO1xuXG5jb25zdCBsb2cgPSBsb2dnZXIuZ2V0TG9nZ2VyKCdJT1NEZXZpY2VMb2cnKTtcblxuY2xhc3MgSU9TRGV2aWNlTG9nIGV4dGVuZHMgSU9TTG9nIHtcblxuICBjb25zdHJ1Y3RvciAob3B0cykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy51ZGlkID0gb3B0cy51ZGlkO1xuICAgIHRoaXMuc2hvd0xvZ3MgPSAhIW9wdHMuc2hvd0xvZ3M7XG4gICAgdGhpcy5zZXJ2aWNlID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0Q2FwdHVyZSAoKSB7XG4gICAgaWYgKHRoaXMuc2VydmljZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNlcnZpY2UgPSBhd2FpdCBzZXJ2aWNlcy5zdGFydFN5c2xvZ1NlcnZpY2UodGhpcy51ZGlkKTtcbiAgICB0aGlzLnNlcnZpY2Uuc3RhcnQodGhpcy5vbkxvZy5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIG9uTG9nIChsb2dMaW5lKSB7XG4gICAgdGhpcy5icm9hZGNhc3QobG9nTGluZSk7XG4gICAgaWYgKHRoaXMuc2hvd0xvZ3MpIHtcbiAgICAgIGxvZy5pbmZvKGxvZ0xpbmUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpc0NhcHR1cmluZyAoKSB7XG4gICAgcmV0dXJuICEhdGhpcy5zZXJ2aWNlO1xuICB9XG5cbiAgc3RvcENhcHR1cmUgKCkge1xuICAgIGlmICghdGhpcy5zZXJ2aWNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2VydmljZS5jbG9zZSgpO1xuICAgIHRoaXMuc2VydmljZSA9IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IHsgSU9TRGV2aWNlTG9nIH07XG5leHBvcnQgZGVmYXVsdCBJT1NEZXZpY2VMb2c7XG4iXSwiZmlsZSI6ImxpYi9kZXZpY2UtbG9nL2lvcy1kZXZpY2UtbG9nLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
