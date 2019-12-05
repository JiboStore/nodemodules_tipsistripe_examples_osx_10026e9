"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

var _bluebird = _interopRequireDefault(require("bluebird"));

let commands = {};
exports.commands = commands;

commands.lock = async function lock(seconds) {
  await this.proxyCommand('/wda/lock', 'POST');

  if (isNaN(seconds)) {
    return;
  }

  const floatSeconds = parseFloat(seconds);

  if (floatSeconds <= 0) {
    return;
  }

  await _bluebird.default.delay(floatSeconds * 1000);
  await this.proxyCommand('/wda/unlock', 'POST');
};

commands.unlock = async function unlock() {
  await this.proxyCommand('/wda/unlock', 'POST');
};

commands.isLocked = async function isLocked() {
  return await this.proxyCommand('/wda/locked', 'GET');
};

var _default = commands;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9sb2NrLmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwibG9jayIsInNlY29uZHMiLCJwcm94eUNvbW1hbmQiLCJpc05hTiIsImZsb2F0U2Vjb25kcyIsInBhcnNlRmxvYXQiLCJCIiwiZGVsYXkiLCJ1bmxvY2siLCJpc0xvY2tlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQSxJQUFJQSxRQUFRLEdBQUcsRUFBZjs7O0FBRUFBLFFBQVEsQ0FBQ0MsSUFBVCxHQUFnQixlQUFlQSxJQUFmLENBQXFCQyxPQUFyQixFQUE4QjtBQUM1QyxRQUFNLEtBQUtDLFlBQUwsQ0FBa0IsV0FBbEIsRUFBK0IsTUFBL0IsQ0FBTjs7QUFDQSxNQUFJQyxLQUFLLENBQUNGLE9BQUQsQ0FBVCxFQUFvQjtBQUNsQjtBQUNEOztBQUVELFFBQU1HLFlBQVksR0FBR0MsVUFBVSxDQUFDSixPQUFELENBQS9COztBQUNBLE1BQUlHLFlBQVksSUFBSSxDQUFwQixFQUF1QjtBQUNyQjtBQUNEOztBQUVELFFBQU1FLGtCQUFFQyxLQUFGLENBQVFILFlBQVksR0FBRyxJQUF2QixDQUFOO0FBQ0EsUUFBTSxLQUFLRixZQUFMLENBQWtCLGFBQWxCLEVBQWlDLE1BQWpDLENBQU47QUFDRCxDQWJEOztBQWVBSCxRQUFRLENBQUNTLE1BQVQsR0FBa0IsZUFBZUEsTUFBZixHQUF5QjtBQUN6QyxRQUFNLEtBQUtOLFlBQUwsQ0FBa0IsYUFBbEIsRUFBaUMsTUFBakMsQ0FBTjtBQUNELENBRkQ7O0FBSUFILFFBQVEsQ0FBQ1UsUUFBVCxHQUFvQixlQUFlQSxRQUFmLEdBQTJCO0FBQzdDLFNBQU8sTUFBTSxLQUFLUCxZQUFMLENBQWtCLGFBQWxCLEVBQWlDLEtBQWpDLENBQWI7QUFDRCxDQUZEOztlQUtlSCxRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuXG5sZXQgY29tbWFuZHMgPSB7fTtcblxuY29tbWFuZHMubG9jayA9IGFzeW5jIGZ1bmN0aW9uIGxvY2sgKHNlY29uZHMpIHtcbiAgYXdhaXQgdGhpcy5wcm94eUNvbW1hbmQoJy93ZGEvbG9jaycsICdQT1NUJyk7XG4gIGlmIChpc05hTihzZWNvbmRzKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGZsb2F0U2Vjb25kcyA9IHBhcnNlRmxvYXQoc2Vjb25kcyk7XG4gIGlmIChmbG9hdFNlY29uZHMgPD0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGF3YWl0IEIuZGVsYXkoZmxvYXRTZWNvbmRzICogMTAwMCk7XG4gIGF3YWl0IHRoaXMucHJveHlDb21tYW5kKCcvd2RhL3VubG9jaycsICdQT1NUJyk7XG59O1xuXG5jb21tYW5kcy51bmxvY2sgPSBhc3luYyBmdW5jdGlvbiB1bmxvY2sgKCkge1xuICBhd2FpdCB0aGlzLnByb3h5Q29tbWFuZCgnL3dkYS91bmxvY2snLCAnUE9TVCcpO1xufTtcblxuY29tbWFuZHMuaXNMb2NrZWQgPSBhc3luYyBmdW5jdGlvbiBpc0xvY2tlZCAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLnByb3h5Q29tbWFuZCgnL3dkYS9sb2NrZWQnLCAnR0VUJyk7XG59O1xuXG5leHBvcnQgeyBjb21tYW5kcyB9O1xuZXhwb3J0IGRlZmF1bHQgY29tbWFuZHM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9sb2NrLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=