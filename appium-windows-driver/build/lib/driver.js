"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.WindowsDriver = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

var _appiumSupport = require("appium-support");

var _winappdriver = require("./winappdriver");

var _logger = _interopRequireDefault(require("./logger"));

var _desiredCaps = require("./desired-caps");

const NO_PROXY = [['POST', new RegExp('^/session/[^/]+/appium/compare_images')]];

class WindowsDriver extends _appiumBaseDriver.BaseDriver {
  constructor(opts = {}, shouldValidateCaps = true) {
    super(opts, shouldValidateCaps);
    this.desiredCapConstraints = _desiredCaps.desiredCapConstraints;
    this.jwpProxyActive = false;
    this.jwpProxyAvoid = NO_PROXY;
    this.opts.address = opts.address || _winappdriver.DEFAULT_WAD_HOST;
  }

  async createSession(caps, reqCaps, curSessions) {
    if (!_appiumSupport.system.isWindows()) {
      throw new Error('WinAppDriver tests only run on Windows');
    }

    try {
      let sessionId;
      [sessionId] = await super.createSession(caps);
      await this.startWinAppDriverSession(curSessions);
      return [sessionId, caps];
    } catch (e) {
      await this.deleteSession();
      throw e;
    }
  }

  getNextAvailablePort(curSessions) {
    let newWADPort = _winappdriver.DEFAULT_WAD_PORT;

    while (_lodash.default.find(curSessions, o => o.WADPort === newWADPort)) {
      newWADPort++;
    }

    return newWADPort;
  }

  async startWinAppDriverSession(curSessions) {
    this.opts.port = this.getNextAvailablePort(curSessions);
    this.winAppDriver = new _winappdriver.WinAppDriver({
      app: this.opts.app,
      port: this.opts.port
    });
    await this.winAppDriver.start();
    await this.winAppDriver.startSession(this.caps);
    this.proxyReqRes = this.winAppDriver.proxyReqRes.bind(this.winAppDriver);
    this.jwpProxyActive = true;
  }

  async deleteSession() {
    _logger.default.debug('Deleting WinAppDriver session');

    if (this.winAppDriver && this.jwpProxyActive) {
      await this.winAppDriver.deleteSession();
      await this.winAppDriver.stop();
      this.winAppDriver = null;
    }

    this.jwpProxyActive = false;
    await super.deleteSession();
  }

  proxyActive() {
    return true;
  }

  canProxy() {
    return true;
  }

  getProxyAvoidList() {
    return this.jwpProxyAvoid;
  }

  get driverData() {
    return {
      WADPort: this.opts.port
    };
  }

}

exports.WindowsDriver = WindowsDriver;
var _default = WindowsDriver;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kcml2ZXIuanMiXSwibmFtZXMiOlsiTk9fUFJPWFkiLCJSZWdFeHAiLCJXaW5kb3dzRHJpdmVyIiwiQmFzZURyaXZlciIsImNvbnN0cnVjdG9yIiwib3B0cyIsInNob3VsZFZhbGlkYXRlQ2FwcyIsImRlc2lyZWRDYXBDb25zdHJhaW50cyIsImp3cFByb3h5QWN0aXZlIiwiandwUHJveHlBdm9pZCIsImFkZHJlc3MiLCJERUZBVUxUX1dBRF9IT1NUIiwiY3JlYXRlU2Vzc2lvbiIsImNhcHMiLCJyZXFDYXBzIiwiY3VyU2Vzc2lvbnMiLCJzeXN0ZW0iLCJpc1dpbmRvd3MiLCJFcnJvciIsInNlc3Npb25JZCIsInN0YXJ0V2luQXBwRHJpdmVyU2Vzc2lvbiIsImUiLCJkZWxldGVTZXNzaW9uIiwiZ2V0TmV4dEF2YWlsYWJsZVBvcnQiLCJuZXdXQURQb3J0IiwiREVGQVVMVF9XQURfUE9SVCIsIl8iLCJmaW5kIiwibyIsIldBRFBvcnQiLCJwb3J0Iiwid2luQXBwRHJpdmVyIiwiV2luQXBwRHJpdmVyIiwiYXBwIiwic3RhcnQiLCJzdGFydFNlc3Npb24iLCJwcm94eVJlcVJlcyIsImJpbmQiLCJsb2dnZXIiLCJkZWJ1ZyIsInN0b3AiLCJwcm94eUFjdGl2ZSIsImNhblByb3h5IiwiZ2V0UHJveHlBdm9pZExpc3QiLCJkcml2ZXJEYXRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLFFBQVEsR0FBRyxDQUNmLENBQUMsTUFBRCxFQUFTLElBQUlDLE1BQUosQ0FBVyx1Q0FBWCxDQUFULENBRGUsQ0FBakI7O0FBS0EsTUFBTUMsYUFBTixTQUE0QkMsNEJBQTVCLENBQXVDO0FBQ3JDQyxFQUFBQSxXQUFXLENBQUVDLElBQUksR0FBRyxFQUFULEVBQWFDLGtCQUFrQixHQUFHLElBQWxDLEVBQXdDO0FBQ2pELFVBQU1ELElBQU4sRUFBWUMsa0JBQVo7QUFDQSxTQUFLQyxxQkFB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ICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuaW1wb3J0IHsgc3lzdGVtIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IHsgV2luQXBwRHJpdmVyLCBERUZBVUxUX1dBRF9IT1NULCBERUZBVUxUX1dBRF9QT1JUIH0gZnJvbSAnLi93aW5hcHBkcml2ZXInO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgeyBkZXNpcmVkQ2FwQ29uc3RyYWludHMgfSBmcm9tICcuL2Rlc2lyZWQtY2Fwcyc7XG5cbmNvbnN0IE5PX1BST1hZID0gW1xuICBbJ1BPU1QnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvYXBwaXVtL2NvbXBhcmVfaW1hZ2VzJyldLFxuXTtcblxuLy8gQXBwaXVtIGluc3RhbnRpYXRlcyB0aGlzIGNsYXNzXG5jbGFzcyBXaW5kb3dzRHJpdmVyIGV4dGVuZHMgQmFzZURyaXZlciB7XG4gIGNvbnN0cnVjdG9yIChvcHRzID0ge30sIHNob3VsZFZhbGlkYXRlQ2FwcyA9IHRydWUpIHtcbiAgICBzdXBlcihvcHRzLCBzaG91bGRWYWxpZGF0ZUNhcHMpO1xuICAgIHRoaXMuZGVzaXJlZENhcENvbnN0cmFpbnRzID0gZGVzaXJlZENhcENvbnN0cmFpbnRzO1xuICAgIHRoaXMuandwUHJveHlBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLmp3cFByb3h5QXZvaWQgPSBOT19QUk9YWTtcbiAgICB0aGlzLm9wdHMuYWRkcmVzcyA9IG9wdHMuYWRkcmVzcyB8fCBERUZBVUxUX1dBRF9IT1NUO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbiAoY2FwcywgcmVxQ2FwcywgY3VyU2Vzc2lvbnMpIHtcblxuICAgIGlmICghc3lzdGVtLmlzV2luZG93cygpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dpbkFwcERyaXZlciB0ZXN0cyBvbmx5IHJ1biBvbiBXaW5kb3dzJyk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBsZXQgc2Vzc2lvbklkO1xuICAgICAgW3Nlc3Npb25JZF0gPSBhd2FpdCBzdXBlci5jcmVhdGVTZXNzaW9uKGNhcHMpO1xuICAgICAgYXdhaXQgdGhpcy5zdGFydFdpbkFwcERyaXZlclNlc3Npb24oY3VyU2Vzc2lvbnMpO1xuICAgICAgcmV0dXJuIFtzZXNzaW9uSWQsIGNhcHNdO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGF3YWl0IHRoaXMuZGVsZXRlU2Vzc2lvbigpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBnZXROZXh0QXZhaWxhYmxlUG9ydCAoY3VyU2Vzc2lvbnMpIHtcbiAgICBsZXQgbmV3V0FEUG9ydCA9IERFRkFVTFRfV0FEX1BPUlQ7XG5cbiAgICAvLyBzdGFydCBhdCA0NzI0IGFuZCBnbyB1cCB0aWxsIHdlIGZpbmQgYSBwb3J0IHRoYXQgaXNuJ3QgaW4gdXNlXG4gICAgd2hpbGUgKF8uZmluZChjdXJTZXNzaW9ucywgKG8pID0+IG8uV0FEUG9ydCA9PT0gbmV3V0FEUG9ydCkpIHtcbiAgICAgIG5ld1dBRFBvcnQrKztcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3V0FEUG9ydDtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0V2luQXBwRHJpdmVyU2Vzc2lvbiAoY3VyU2Vzc2lvbnMpIHtcblxuICAgIHRoaXMub3B0cy5wb3J0ID0gdGhpcy5nZXROZXh0QXZhaWxhYmxlUG9ydChjdXJTZXNzaW9ucyk7XG4gICAgdGhpcy53aW5BcHBEcml2ZXIgPSBuZXcgV2luQXBwRHJpdmVyKHtcbiAgICAgIGFwcDogdGhpcy5vcHRzLmFwcCxcbiAgICAgIHBvcnQ6IHRoaXMub3B0cy5wb3J0XG4gICAgfSk7XG5cbiAgICBhd2FpdCB0aGlzLndpbkFwcERyaXZlci5zdGFydCgpO1xuICAgIGF3YWl0IHRoaXMud2luQXBwRHJpdmVyLnN0YXJ0U2Vzc2lvbih0aGlzLmNhcHMpO1xuICAgIHRoaXMucHJveHlSZXFSZXMgPSB0aGlzLndpbkFwcERyaXZlci5wcm94eVJlcVJlcy5iaW5kKHRoaXMud2luQXBwRHJpdmVyKTtcbiAgICAvLyBub3cgdGhhdCBldmVyeXRoaW5nIGhhcyBzdGFydGVkIHN1Y2Nlc3NmdWxseSwgdHVybiBvbiBwcm94eWluZyBzbyBhbGxcbiAgICAvLyBzdWJzZXF1ZW50IHNlc3Npb24gcmVxdWVzdHMgZ28gc3RyYWlnaHQgdG8vZnJvbSBXaW5BcHBEcml2ZXJcbiAgICB0aGlzLmp3cFByb3h5QWN0aXZlID0gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZVNlc3Npb24gKCkge1xuICAgIGxvZ2dlci5kZWJ1ZygnRGVsZXRpbmcgV2luQXBwRHJpdmVyIHNlc3Npb24nKTtcblxuICAgIGlmICh0aGlzLndpbkFwcERyaXZlciAmJiB0aGlzLmp3cFByb3h5QWN0aXZlKSB7XG4gICAgICBhd2FpdCB0aGlzLndpbkFwcERyaXZlci5kZWxldGVTZXNzaW9uKCk7XG4gICAgICBhd2FpdCB0aGlzLndpbkFwcERyaXZlci5zdG9wKCk7XG4gICAgICB0aGlzLndpbkFwcERyaXZlciA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuandwUHJveHlBY3RpdmUgPSBmYWxzZTtcbiAgICBhd2FpdCBzdXBlci5kZWxldGVTZXNzaW9uKCk7XG4gIH1cblxuICBwcm94eUFjdGl2ZSAoKSB7XG4gICAgLy8gd2UgYWx3YXlzIGhhdmUgYW4gYWN0aXZlIHByb3h5IHRvIHRoZSBXaW5BcHBEcml2ZXIgc2VydmVyXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjYW5Qcm94eSAoKSB7XG4gICAgLy8gd2UgY2FuIGFsd2F5cyBwcm94eSB0byB0aGUgV2luQXBwRHJpdmVyIHNlcnZlclxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZ2V0UHJveHlBdm9pZExpc3QgKC8qc2Vzc2lvbklkKi8pIHtcbiAgICByZXR1cm4gdGhpcy5qd3BQcm94eUF2b2lkO1xuICB9XG5cbiAgZ2V0IGRyaXZlckRhdGEgKCkge1xuICAgIHJldHVybiB7V0FEUG9ydDogdGhpcy5vcHRzLnBvcnR9O1xuICB9XG59XG5cbmV4cG9ydCB7IFdpbmRvd3NEcml2ZXIgfTtcbmV4cG9ydCBkZWZhdWx0IFdpbmRvd3NEcml2ZXI7XG4iXSwiZmlsZSI6ImxpYi9kcml2ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
