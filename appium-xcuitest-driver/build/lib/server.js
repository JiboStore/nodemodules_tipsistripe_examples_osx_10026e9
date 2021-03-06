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
  const driver = new _driver.XCUITestDriver({
    port,
    address
  });
  const server = await (0, _appiumBaseDriver.server)({
    routeConfiguringFunction: (0, _appiumBaseDriver.routeConfiguringFunction)(driver),
    port,
    hostname: address,
    allowCors: false
  });
  server.driver = driver;

  _logger.default.info(`XCUITestDriver server listening on http://${address}:${port}`);

  return server;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIuanMiXSwibmFtZXMiOlsic3RhcnRTZXJ2ZXIiLCJwb3J0IiwiYWRkcmVzcyIsImRyaXZlciIsIlhDVUlUZXN0RHJpdmVyIiwic2VydmVyIiwicm91dGVDb25maWd1cmluZ0Z1bmN0aW9uIiwiaG9zdG5hbWUiLCJhbGxvd0NvcnMiLCJsb2ciLCJpbmZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUdBLGVBQWVBLFdBQWYsQ0FBNEJDLElBQTVCLEVBQWtDQyxPQUFsQyxFQUEyQztBQUN6QyxRQUFNQyxNQUFNLEdBQUcsSUFBSUMsc0JBQUosQ0FBbUI7QUFBQ0gsSUFBQUEsSUFBRDtBQUFPQyxJQUFBQTtBQUFQLEdBQW5CLENBQWY7QUFDQSxRQUFNRyxNQUFNLEdBQUcsTUFBTSw4QkFBVztBQUM5QkMsSUFBQUEsd0JBQXdCLEVBQUUsZ0RBQXlCSCxNQUF6QixDQURJO0FBRTlCRixJQUFBQSxJQUY4QjtBQUc5Qk0sSUFBQUEsUUFBUSxFQUFFTCxPQUhvQjtBQUk5Qk0sSUFBQUEsU0FBUyxFQUFFO0FBSm1CLEdBQVgsQ0FBckI7QUFPQUgsRUFBQUEsTUFBTSxDQUFDRixNQUFQLEdBQWdCQSxNQUFoQjs7QUFDQU0sa0JBQUlDLElBQUosQ0FBVSw2Q0FBNENSLE9BQVEsSUFBR0QsSUFBSyxFQUF0RTs7QUFDQSxTQUFPSSxNQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHNlcnZlciBhcyBiYXNlU2VydmVyLCByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24gfSBmcm9tICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuaW1wb3J0IHsgWENVSVRlc3REcml2ZXIgfSBmcm9tICcuL2RyaXZlcic7XG5cblxuYXN5bmMgZnVuY3Rpb24gc3RhcnRTZXJ2ZXIgKHBvcnQsIGFkZHJlc3MpIHtcbiAgY29uc3QgZHJpdmVyID0gbmV3IFhDVUlUZXN0RHJpdmVyKHtwb3J0LCBhZGRyZXNzfSk7XG4gIGNvbnN0IHNlcnZlciA9IGF3YWl0IGJhc2VTZXJ2ZXIoe1xuICAgIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbjogcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uKGRyaXZlciksXG4gICAgcG9ydCxcbiAgICBob3N0bmFtZTogYWRkcmVzcyxcbiAgICBhbGxvd0NvcnM6IGZhbHNlLFxuICB9KTtcbiAgLy8gbWFrZSB0aGUgZHJpdmVyIGF2YWlsYWJsZVxuICBzZXJ2ZXIuZHJpdmVyID0gZHJpdmVyO1xuICBsb2cuaW5mbyhgWENVSVRlc3REcml2ZXIgc2VydmVyIGxpc3RlbmluZyBvbiBodHRwOi8vJHthZGRyZXNzfToke3BvcnR9YCk7XG4gIHJldHVybiBzZXJ2ZXI7XG59XG5cbmV4cG9ydCB7IHN0YXJ0U2VydmVyIH07XG4iXSwiZmlsZSI6ImxpYi9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
