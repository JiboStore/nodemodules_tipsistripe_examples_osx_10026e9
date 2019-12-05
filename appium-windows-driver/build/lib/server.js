"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startServer = startServer;

require("source-map-support/register");

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _driver = require("./driver");

async function startServer(port, address) {
  const driver = new _driver.WindowsDriver({
    port,
    address
  });
  const server = await (0, _appiumBaseDriver.server)({
    routeConfiguringFunction: (0, _appiumBaseDriver.routeConfiguringFunction)(driver),
    port,
    hostname: address
  });

  _logger.default.info(`WindowsDriver server listening on http://${address}:${port}`);

  return server;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIuanMiXSwibmFtZXMiOlsic3RhcnRTZXJ2ZXIiLCJwb3J0IiwiYWRkcmVzcyIsImRyaXZlciIsIldpbmRvd3NEcml2ZXIiLCJzZXJ2ZXIiLCJyb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24iLCJob3N0bmFtZSIsImxvZyIsImluZm8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBR0EsZUFBZUEsV0FBZixDQUE0QkMsSUFBNUIsRUFBa0NDLE9BQWxDLEVBQTJDO0FBQ3pDLFFBQU1DLE1BQU0sR0FBRyxJQUFJQyxxQkFBSixDQUFrQjtBQUFDSCxJQUFBQSxJQUFEO0FBQU9DLElBQUFBO0FBQVAsR0FBbEIsQ0FBZjtBQUNBLFFBQU1HLE1BQU0sR0FBRyxNQUFNLDhCQUFXO0FBQzlCQyxJQUFBQSx3QkFBd0IsRUFBRSxnREFBeUJILE1BQXpCLENBREk7QUFFOUJGLElBQUFBLElBRjhCO0FBRzlCTSxJQUFBQSxRQUFRLEVBQUVMO0FBSG9CLEdBQVgsQ0FBckI7O0FBS0FNLGtCQUFJQyxJQUFKLENBQVUsNENBQTJDUCxPQUFRLElBQUdELElBQUssRUFBckU7O0FBQ0EsU0FBT0ksTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgeyBzZXJ2ZXIgYXMgYmFzZVNlcnZlciwgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcbmltcG9ydCB7IFdpbmRvd3NEcml2ZXIgfSBmcm9tICcuL2RyaXZlcic7XG5cblxuYXN5bmMgZnVuY3Rpb24gc3RhcnRTZXJ2ZXIgKHBvcnQsIGFkZHJlc3MpIHtcbiAgY29uc3QgZHJpdmVyID0gbmV3IFdpbmRvd3NEcml2ZXIoe3BvcnQsIGFkZHJlc3N9KTtcbiAgY29uc3Qgc2VydmVyID0gYXdhaXQgYmFzZVNlcnZlcih7XG4gICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uOiByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24oZHJpdmVyKSxcbiAgICBwb3J0LFxuICAgIGhvc3RuYW1lOiBhZGRyZXNzLFxuICB9KTtcbiAgbG9nLmluZm8oYFdpbmRvd3NEcml2ZXIgc2VydmVyIGxpc3RlbmluZyBvbiBodHRwOi8vJHthZGRyZXNzfToke3BvcnR9YCk7XG4gIHJldHVybiBzZXJ2ZXI7XG59XG5cbmV4cG9ydCB7IHN0YXJ0U2VydmVyIH07XG4iXSwiZmlsZSI6ImxpYi9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==