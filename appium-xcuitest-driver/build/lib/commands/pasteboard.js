"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

var _nodeSimctl = require("node-simctl");

let commands = {};
exports.commands = commands;

commands.mobileSetPasteboard = async function mobileSetPasteboard(opts = {}) {
  if (!this.isSimulator()) {
    throw new Error('Setting pasteboard content is not supported on real devices');
  }

  const {
    content,
    encoding
  } = opts;

  if (!content) {
    throw new Error('Pasteboard content is mandatory to set');
  }

  return await (0, _nodeSimctl.setPasteboard)(this.opts.udid, content, encoding);
};

commands.mobileGetPasteboard = async function mobileGetPasteboard(opts = {}) {
  if (!this.isSimulator()) {
    throw new Error('Getting pasteboard content is not supported on real devices');
  }

  return await (0, _nodeSimctl.getPasteboard)(this.opts.udid, opts.encoding);
};

var _default = commands;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9wYXN0ZWJvYXJkLmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwibW9iaWxlU2V0UGFzdGVib2FyZCIsIm9wdHMiLCJpc1NpbXVsYXRvciIsIkVycm9yIiwiY29udGVudCIsImVuY29kaW5nIiwidWRpZCIsIm1vYmlsZUdldFBhc3RlYm9hcmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVBLElBQUlBLFFBQVEsR0FBRyxFQUFmOzs7QUFFQUEsUUFBUSxDQUFDQyxtQkFBVCxHQUErQixlQUFlQSxtQkFBZixDQUFvQ0MsSUFBSSxHQUFHLEVBQTNDLEVBQStDO0FBQzVFLE1BQUksQ0FBQyxLQUFLQyxXQUFMLEVBQUwsRUFBeUI7QUFDdkIsVUFBTSxJQUFJQyxLQUFKLENBQVUsNkRBQVYsQ0FBTjtBQUNEOztBQUNELFFBQU07QUFBQ0MsSUFBQUEsT0FBRDtBQUFVQyxJQUFBQTtBQUFWLE1BQXNCSixJQUE1Qjs7QUFDQSxNQUFJLENBQUNHLE9BQUwsRUFBYztBQUNaLFVBQU0sSUFBSUQsS0FBSixDQUFVLHdDQUFWLENBQU47QUFDRDs7QUFDRCxTQUFPLE1BQU0sK0JBQWMsS0FBS0YsSUFBTCxDQUFVSyxJQUF4QixFQUE4QkYsT0FBOUIsRUFBdUNDLFFBQXZDLENBQWI7QUFDRCxDQVREOztBQVdBTixRQUFRLENBQUNRLG1CQUFULEdBQStCLGVBQWVBLG1CQUFmLENBQW9DTixJQUFJLEdBQUcsRUFBM0MsRUFBK0M7QUFDNUUsTUFBSSxDQUFDLEtBQUtDLFdBQUwsRUFBTCxFQUF5QjtBQUN2QixVQUFNLElBQUlDLEtBQUosQ0FBVSw2REFBVixDQUFOO0FBQ0Q7O0FBQ0QsU0FBTyxNQUFNLCtCQUFjLEtBQUtGLElBQUwsQ0FBVUssSUFBeEIsRUFBOEJMLElBQUksQ0FBQ0ksUUFBbkMsQ0FBYjtBQUNELENBTEQ7O2VBUWVOLFEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZXRQYXN0ZWJvYXJkLCBnZXRQYXN0ZWJvYXJkIH0gZnJvbSAnbm9kZS1zaW1jdGwnO1xuXG5sZXQgY29tbWFuZHMgPSB7fTtcblxuY29tbWFuZHMubW9iaWxlU2V0UGFzdGVib2FyZCA9IGFzeW5jIGZ1bmN0aW9uIG1vYmlsZVNldFBhc3RlYm9hcmQgKG9wdHMgPSB7fSkge1xuICBpZiAoIXRoaXMuaXNTaW11bGF0b3IoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignU2V0dGluZyBwYXN0ZWJvYXJkIGNvbnRlbnQgaXMgbm90IHN1cHBvcnRlZCBvbiByZWFsIGRldmljZXMnKTtcbiAgfVxuICBjb25zdCB7Y29udGVudCwgZW5jb2Rpbmd9ID0gb3B0cztcbiAgaWYgKCFjb250ZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXN0ZWJvYXJkIGNvbnRlbnQgaXMgbWFuZGF0b3J5IHRvIHNldCcpO1xuICB9XG4gIHJldHVybiBhd2FpdCBzZXRQYXN0ZWJvYXJkKHRoaXMub3B0cy51ZGlkLCBjb250ZW50LCBlbmNvZGluZyk7XG59O1xuXG5jb21tYW5kcy5tb2JpbGVHZXRQYXN0ZWJvYXJkID0gYXN5bmMgZnVuY3Rpb24gbW9iaWxlR2V0UGFzdGVib2FyZCAob3B0cyA9IHt9KSB7XG4gIGlmICghdGhpcy5pc1NpbXVsYXRvcigpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdHZXR0aW5nIHBhc3RlYm9hcmQgY29udGVudCBpcyBub3Qgc3VwcG9ydGVkIG9uIHJlYWwgZGV2aWNlcycpO1xuICB9XG4gIHJldHVybiBhd2FpdCBnZXRQYXN0ZWJvYXJkKHRoaXMub3B0cy51ZGlkLCBvcHRzLmVuY29kaW5nKTtcbn07XG5cbmV4cG9ydCB7IGNvbW1hbmRzIH07XG5leHBvcnQgZGVmYXVsdCBjb21tYW5kcztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL3Bhc3RlYm9hcmQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==