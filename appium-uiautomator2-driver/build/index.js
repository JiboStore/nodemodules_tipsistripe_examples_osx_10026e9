"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.startServer = exports.AndroidUiautomator2Driver = exports.DEFAULT_PORT = exports.DEFAULT_HOST = void 0;

require("source-map-support/register");

var _yargs = _interopRequireDefault(require("yargs"));

var _asyncbox = require("asyncbox");

var driver = _interopRequireWildcard(require("./lib/driver"));

var server = _interopRequireWildcard(require("./lib/server"));

const {
  AndroidUiautomator2Driver
} = driver;
exports.AndroidUiautomator2Driver = AndroidUiautomator2Driver;
const {
  startServer
} = server;
exports.startServer = startServer;
const DEFAULT_HOST = 'localhost';
exports.DEFAULT_HOST = DEFAULT_HOST;
const DEFAULT_PORT = 4884;
exports.DEFAULT_PORT = DEFAULT_PORT;

async function main() {
  let port = _yargs.default.argv.port || DEFAULT_PORT;
  let host = _yargs.default.argv.host || _yargs.default.argv.address || DEFAULT_HOST;
  return await startServer(port, host);
}

if (require.main === module) {
  (0, _asyncbox.asyncify)(main);
}

var _default = AndroidUiautomator2Driver;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbIkFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXIiLCJkcml2ZXIiLCJzdGFydFNlcnZlciIsInNlcnZlciIsIkRFRkFVTFRfSE9TVCIsIkRFRkFVTFRfUE9SVCIsIm1haW4iLCJwb3J0IiwieWFyZ3MiLCJhcmd2IiwiaG9zdCIsImFkZHJlc3MiLCJyZXF1aXJlIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsTUFBTTtBQUFFQSxFQUFBQTtBQUFGLElBQWdDQyxNQUF0Qzs7QUFDQSxNQUFNO0FBQUVDLEVBQUFBO0FBQUYsSUFBa0JDLE1BQXhCOztBQUVPLE1BQU1DLFlBQVksR0FBRyxXQUFyQjs7QUFDQSxNQUFNQyxZQUFZLEdBQUcsSUFBckI7OztBQUVQLGVBQWVDLElBQWYsR0FBdUI7QUFDckIsTUFBSUMsSUFBSSxHQUFHQyxlQUFNQyxJQUFOLENBQVdGLElBQVgsSUFBbUJGLFlBQTlCO0FBQ0EsTUFBSUssSUFBSSxHQUFHRixlQUFNQyxJQUFOLENBQVdDLElBQVgsSUFBbUJGLGVBQU1DLElBQU4sQ0FBV0UsT0FBOUIsSUFBeUNQLFlBQXBEO0FBQ0EsU0FBTyxNQUFNRixXQUFXLENBQUNLLElBQUQsRUFBT0csSUFBUCxDQUF4QjtBQUNEOztBQUVELElBQUlFLE9BQU8sQ0FBQ04sSUFBUixLQUFpQk8sTUFBckIsRUFBNkI7QUFDM0IsMEJBQVNQLElBQVQ7QUFDRDs7ZUFHY04seUIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bWFpblxuXG5pbXBvcnQgeWFyZ3MgZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgYXN5bmNpZnkgfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgKiBhcyBkcml2ZXIgZnJvbSAnLi9saWIvZHJpdmVyJztcbmltcG9ydCAqIGFzIHNlcnZlciBmcm9tICcuL2xpYi9zZXJ2ZXInO1xuXG5cbmNvbnN0IHsgQW5kcm9pZFVpYXV0b21hdG9yMkRyaXZlciB9ID0gZHJpdmVyO1xuY29uc3QgeyBzdGFydFNlcnZlciB9ID0gc2VydmVyO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9IT1NUID0gJ2xvY2FsaG9zdCc7XG5leHBvcnQgY29uc3QgREVGQVVMVF9QT1JUID0gNDg4NDtcblxuYXN5bmMgZnVuY3Rpb24gbWFpbiAoKSB7XG4gIGxldCBwb3J0ID0geWFyZ3MuYXJndi5wb3J0IHx8IERFRkFVTFRfUE9SVDtcbiAgbGV0IGhvc3QgPSB5YXJncy5hcmd2Lmhvc3QgfHwgeWFyZ3MuYXJndi5hZGRyZXNzIHx8IERFRkFVTFRfSE9TVDtcbiAgcmV0dXJuIGF3YWl0IHN0YXJ0U2VydmVyKHBvcnQsIGhvc3QpO1xufVxuXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgYXN5bmNpZnkobWFpbik7XG59XG5cbmV4cG9ydCB7IEFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXIsIHN0YXJ0U2VydmVyIH07XG5leHBvcnQgZGVmYXVsdCBBbmRyb2lkVWlhdXRvbWF0b3IyRHJpdmVyO1xuIl0sImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZVJvb3QiOiIuLiJ9