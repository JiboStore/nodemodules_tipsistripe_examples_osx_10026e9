"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _appiumBaseDriver = require("appium-base-driver");

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

commands.back = async function () {
  if (this.isWebContext()) {
    await this.mobileWebNav('back');
  } else {
    await this.uiAutoClient.sendCommand('au.back()');
  }
};

commands.forward = async function () {
  if (this.isWebContext()) {
    await this.mobileWebNav('forward');
  } else {
    throw new _appiumBaseDriver.errors.NotImplementedError();
  }
};

commands.closeWindow = async function () {
  if (this.isWebContext()) {
    let script = "return window.open('','_self').close();";
    return await this.executeAtom('execute_script', [script, []], true);
  } else {
    throw new _appiumBaseDriver.errors.NotImplementedError();
  }
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9uYXZpZ2F0aW9uLmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwiaGVscGVycyIsImV4dGVuc2lvbnMiLCJiYWNrIiwiaXNXZWJDb250ZXh0IiwibW9iaWxlV2ViTmF2IiwidWlBdXRvQ2xpZW50Iiwic2VuZENvbW1hbmQiLCJmb3J3YXJkIiwiZXJyb3JzIiwiTm90SW1wbGVtZW50ZWRFcnJvciIsImNsb3NlV2luZG93Iiwic2NyaXB0IiwiZXhlY3V0ZUF0b20iLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUdBLElBQUlBLFFBQVEsR0FBRyxFQUFmO0FBQUEsSUFBbUJDLE9BQU8sR0FBRyxFQUE3QjtBQUFBLElBQWlDQyxVQUFVLEdBQUcsRUFBOUM7Ozs7QUFFQUYsUUFBUSxDQUFDRyxJQUFULEdBQWdCLGtCQUFrQjtBQUNoQyxNQUFJLEtBQUtDLFlBQUwsRUFBSixFQUF5QjtBQUN2QixVQUFNLEtBQUtDLFlBQUwsQ0FBa0IsTUFBbEIsQ0FBTjtBQUNELEdBRkQsTUFFTztBQUNMLFVBQU0sS0FBS0MsWUFBTCxDQUFrQkMsV0FBbEIsQ0FBOEIsV0FBOUIsQ0FBTjtBQUNEO0FBQ0YsQ0FORDs7QUFRQVAsUUFBUSxDQUFDUSxPQUFULEdBQW1CLGtCQUFrQjtBQUNuQyxNQUFJLEtBQUtKLFlBQUwsRUFBSixFQUF5QjtBQUN2QixVQUFNLEtBQUtDLFlBQUwsQ0FBa0IsU0FBbEIsQ0FBTjtBQUNELEdBRkQsTUFFTztBQUNMLFVBQU0sSUFBSUkseUJBQU9DLG1CQUFYLEVBQU47QUFDRDtBQUNGLENBTkQ7O0FBUUFWLFFBQVEsQ0FBQ1csV0FBVCxHQUF1QixrQkFBa0I7QUFDdkMsTUFBSSxLQUFLUCxZQUFMLEVBQUosRUFBeUI7QUFDdkIsUUFBSVEsTUFBTSxHQUFHLHlDQUFiO0FBQ0EsV0FBTyxNQUFNLEtBQUtDLFdBQUwsQ0FBaUIsZ0JBQWpCLEVBQW1DLENBQUNELE1BQUQsRUFBUyxFQUFULENBQW5DLEVBQWlELElBQWpELENBQWI7QUFDRCxHQUhELE1BR087QUFDTCxVQUFNLElBQUlILHlCQUFPQyxtQkFBWCxFQUFOO0FBQ0Q7QUFDRixDQVBEOztBQVVBSSxNQUFNLENBQUNDLE1BQVAsQ0FBY2IsVUFBZCxFQUEwQkYsUUFBMUIsRUFBb0NDLE9BQXBDO2VBRWVDLFUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlcnJvcnMgfSBmcm9tICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuXG5cbmxldCBjb21tYW5kcyA9IHt9LCBoZWxwZXJzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuY29tbWFuZHMuYmFjayA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuaXNXZWJDb250ZXh0KCkpIHtcbiAgICBhd2FpdCB0aGlzLm1vYmlsZVdlYk5hdignYmFjaycpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHRoaXMudWlBdXRvQ2xpZW50LnNlbmRDb21tYW5kKCdhdS5iYWNrKCknKTtcbiAgfVxufTtcblxuY29tbWFuZHMuZm9yd2FyZCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuaXNXZWJDb250ZXh0KCkpIHtcbiAgICBhd2FpdCB0aGlzLm1vYmlsZVdlYk5hdignZm9yd2FyZCcpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBlcnJvcnMuTm90SW1wbGVtZW50ZWRFcnJvcigpO1xuICB9XG59O1xuXG5jb21tYW5kcy5jbG9zZVdpbmRvdyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuaXNXZWJDb250ZXh0KCkpIHtcbiAgICBsZXQgc2NyaXB0ID0gXCJyZXR1cm4gd2luZG93Lm9wZW4oJycsJ19zZWxmJykuY2xvc2UoKTtcIjtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlQXRvbSgnZXhlY3V0ZV9zY3JpcHQnLCBbc2NyaXB0LCBbXV0sIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBlcnJvcnMuTm90SW1wbGVtZW50ZWRFcnJvcigpO1xuICB9XG59O1xuXG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMsIGhlbHBlcnMpO1xuZXhwb3J0IHsgY29tbWFuZHMsIGhlbHBlcnMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9uYXZpZ2F0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
