"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startServer = startServer;

require("source-map-support/register");

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _driver = _interopRequireDefault(require("./driver"));

async function startServer(port, host) {
  let d = new _driver.default();
  let routeConfiguringFunction = (0, _appiumBaseDriver.routeConfiguringFunction)(d);
  let server = await (0, _appiumBaseDriver.server)({
    routeConfiguringFunction,
    port,
    hostname: host
  });

  _logger.default.info(`AndroidDriver server listening on http://${host}:${port}`);

  d.server = server;
  return server;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIuanMiXSwibmFtZXMiOlsic3RhcnRTZXJ2ZXIiLCJwb3J0IiwiaG9zdCIsImQiLCJBbmRyb2lkRHJpdmVyIiwicm91dGVDb25maWd1cmluZ0Z1bmN0aW9uIiwic2VydmVyIiwiaG9zdG5hbWUiLCJsb2ciLCJpbmZvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLGVBQWVBLFdBQWYsQ0FBNEJDLElBQTVCLEVBQWtDQyxJQUFsQyxFQUF3QztBQUN0QyxNQUFJQyxDQUFDLEdBQUcsSUFBSUMsZUFBSixFQUFSO0FBQ0EsTUFBSUMsd0JBQXdCLEdBQUcsZ0RBQVdGLENBQVgsQ0FBL0I7QUFDQSxNQUFJRyxNQUFNLEdBQUcsTUFBTSw4QkFBVztBQUFDRCxJQUFBQSx3QkFBRDtBQUEyQkosSUFBQUEsSUFBM0I7QUFBaUNNLElBQUFBLFFBQVEsRUFBRUw7QUFBM0MsR0FBWCxDQUFuQjs7QUFDQU0sa0JBQUlDLElBQUosQ0FBVSw0Q0FBMkNQLElBQUssSUFBR0QsSUFBSyxFQUFsRTs7QUFDQUUsRUFBQUEsQ0FBQyxDQUFDRyxNQUFGLEdBQVdBLE1BQVg7QUFDQSxTQUFPQSxNQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHNlcnZlciBhcyBiYXNlU2VydmVyLCByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24gYXMgbWFrZVJvdXRlciB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgQW5kcm9pZERyaXZlciBmcm9tICcuL2RyaXZlcic7XG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2VydmVyIChwb3J0LCBob3N0KSB7XG4gIGxldCBkID0gbmV3IEFuZHJvaWREcml2ZXIoKTtcbiAgbGV0IHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiA9IG1ha2VSb3V0ZXIoZCk7XG4gIGxldCBzZXJ2ZXIgPSBhd2FpdCBiYXNlU2VydmVyKHtyb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb24sIHBvcnQsIGhvc3RuYW1lOiBob3N0fSk7XG4gIGxvZy5pbmZvKGBBbmRyb2lkRHJpdmVyIHNlcnZlciBsaXN0ZW5pbmcgb24gaHR0cDovLyR7aG9zdH06JHtwb3J0fWApO1xuICBkLnNlcnZlciA9IHNlcnZlcjtcbiAgcmV0dXJuIHNlcnZlcjtcbn1cblxuZXhwb3J0IHsgc3RhcnRTZXJ2ZXIgfTtcbiJdLCJmaWxlIjoibGliL3NlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
