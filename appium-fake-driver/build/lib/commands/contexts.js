"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

helpers.getRawContexts = function getRawContexts() {
  let contexts = {
    'NATIVE_APP': null
  };
  let wvs = this.appModel.getWebviews();

  for (let i = 1; i < wvs.length + 1; i++) {
    contexts[`WEBVIEW_${i}`] = wvs[i - 1];
  }

  return contexts;
};

helpers.assertWebviewContext = function assertWebviewContext() {
  if (this.curContext === 'NATIVE_APP') {
    throw new _appiumBaseDriver.errors.InvalidContextError();
  }
};

commands.getCurrentContext = async function getCurrentContext() {
  return this.curContext;
};

commands.getContexts = async function getContexts() {
  return _lodash.default.keys(this.getRawContexts());
};

commands.setContext = async function setContext(context) {
  let contexts = this.getRawContexts();

  if (_lodash.default.includes(_lodash.default.keys(contexts), context)) {
    this.curContext = context;

    if (context === 'NATIVE_APP') {
      this.appModel.deactivateWebview();
    } else {
      this.appModel.activateWebview(contexts[context]);
    }
  } else {
    throw new _appiumBaseDriver.errors.NoSuchContextError();
  }
};

commands.setFrame = async function setFrame(frameId) {
  this.assertWebviewContext();

  if (frameId === null) {
    this.appModel.deactivateFrame();
  } else {
    let nodes = this.appModel.xpathQuery(`//iframe[@id="${frameId}"]`);

    if (!nodes.length) {
      throw new _appiumBaseDriver.errors.NoSuchFrameError();
    }

    this.appModel.activateFrame(nodes[0]);
  }
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9jb250ZXh0cy5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsImhlbHBlcnMiLCJleHRlbnNpb25zIiwiZ2V0UmF3Q29udGV4dHMiLCJjb250ZXh0cyIsInd2cyIsImFwcE1vZGVsIiwiZ2V0V2Vidmlld3MiLCJpIiwibGVuZ3RoIiwiYXNzZXJ0V2Vidmlld0NvbnRleHQiLCJjdXJDb250ZXh0IiwiZXJyb3JzIiwiSW52YWxpZENvbnRleHRFcnJvciIsImdldEN1cnJlbnRDb250ZXh0IiwiZ2V0Q29udGV4dHMiLCJfIiwia2V5cyIsInNldENvbnRleHQiLCJjb250ZXh0IiwiaW5jbHVkZXMiLCJkZWFjdGl2YXRlV2VidmlldyIsImFjdGl2YXRlV2VidmlldyIsIk5vU3VjaENvbnRleHRFcnJvciIsInNldEZyYW1lIiwiZnJhbWVJZCIsImRlYWN0aXZhdGVGcmFtZSIsIm5vZGVzIiwieHBhdGhRdWVyeSIsIk5vU3VjaEZyYW1lRXJyb3IiLCJhY3RpdmF0ZUZyYW1lIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUVBLElBQUlBLFFBQVEsR0FBRyxFQUFmO0FBQUEsSUFBbUJDLE9BQU8sR0FBRyxFQUE3QjtBQUFBLElBQWlDQyxVQUFVLEdBQUcsRUFBOUM7Ozs7QUFFQUQsT0FBTyxDQUFDRSxjQUFSLEdBQXlCLFNBQVNBLGNBQVQsR0FBMkI7QUFDbEQsTUFBSUMsUUFBUSxHQUFHO0FBQUMsa0JBQWM7QUFBZixHQUFmO0FBQ0EsTUFBSUMsR0FBRyxHQUFHLEtBQUtDLFFBQUwsQ0FBY0MsV0FBZCxFQUFWOztBQUNBLE9BQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0gsR0FBRyxDQUFDSSxNQUFKLEdBQWEsQ0FBakMsRUFBb0NELENBQUMsRUFBckMsRUFBeUM7QUFDdkNKLElBQUFBLFFBQVEsQ0FBRSxXQUFVSSxDQUFFLEVBQWQsQ0FBUixHQUEyQkgsR0FBRyxDQUFDRyxDQUFDLEdBQUcsQ0FBTCxDQUE5QjtBQUNEOztBQUNELFNBQU9KLFFBQVA7QUFDRCxDQVBEOztBQVNBSCxPQUFPLENBQUNTLG9CQUFSLEdBQStCLFNBQVNBLG9CQUFULEdBQWlDO0FBQzlELE1BQUksS0FBS0MsVUFBTCxLQUFvQixZQUF4QixFQUFzQztBQUNwQyxVQUFNLElBQUlDLHlCQUFPQyxtQkFBWCxFQUFOO0FBQ0Q7QUFDRixDQUpEOztBQU1BYixRQUFRLENBQUNjLGlCQUFULEdBQTZCLGVBQWVBLGlCQUFmLEdBQW9DO0FBQy9ELFNBQU8sS0FBS0gsVUFBWjtBQUNELENBRkQ7O0FBSUFYLFFBQVEsQ0FBQ2UsV0FBVCxHQUF1QixlQUFlQSxXQUFmLEdBQThCO0FBQ25ELFNBQU9DLGdCQUFFQyxJQUFGLENBQU8sS0FBS2QsY0FBTCxFQUFQLENBQVA7QUFDRCxDQUZEOztBQUlBSCxRQUFRLENBQUNrQixVQUFULEdBQXNCLGVBQWVBLFVBQWYsQ0FBMkJDLE9BQTNCLEVBQW9DO0FBQ3hELE1BQUlmLFFBQVEsR0FBRyxLQUFLRCxjQUFMLEVBQWY7O0FBQ0EsTUFBSWEsZ0JBQUVJLFFBQUYsQ0FBV0osZ0JBQUVDLElBQUYsQ0FBT2IsUUFBUCxDQUFYLEVBQTZCZSxPQUE3QixDQUFKLEVBQTJDO0FBQ3pDLFNBQUtSLFVBQUwsR0FBa0JRLE9BQWxCOztBQUNBLFFBQUlBLE9BQU8sS0FBSyxZQUFoQixFQUE4QjtBQUM1QixXQUFLYixRQUFMLENBQWNlLGlCQUFkO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBS2YsUUFBTCxDQUFjZ0IsZUFBZCxDQUE4QmxCLFFBQVEsQ0FBQ2UsT0FBRCxDQUF0QztBQUNEO0FBQ0YsR0FQRCxNQU9PO0FBQ0wsVUFBTSxJQUFJUCx5QkFBT1csa0JBQVgsRUFBTjtBQUNEO0FBQ0YsQ0FaRDs7QUFjQXZCLFFBQVEsQ0FBQ3dCLFFBQVQsR0FBb0IsZUFBZUEsUUFBZixDQUF5QkMsT0FBekIsRUFBa0M7QUFDcEQsT0FBS2Ysb0JBQUw7O0FBQ0EsTUFBSWUsT0FBTyxLQUFLLElBQWhCLEVBQXNCO0FBQ3BCLFNBQUtuQixRQUFMLENBQWNvQixlQUFkO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsUUFBSUMsS0FBSyxHQUFHLEtBQUtyQixRQUFMLENBQWNzQixVQUFkLENBQTBCLGlCQUFnQkgsT0FBUSxJQUFsRCxDQUFaOztBQUNBLFFBQUksQ0FBQ0UsS0FBSyxDQUFDbEIsTUFBWCxFQUFtQjtBQUNqQixZQUFNLElBQUlHLHlCQUFPaUIsZ0JBQVgsRUFBTjtBQUNEOztBQUNELFNBQUt2QixRQUFMLENBQWN3QixhQUFkLENBQTRCSCxLQUFLLENBQUMsQ0FBRCxDQUFqQztBQUNEO0FBQ0YsQ0FYRDs7QUFhQUksTUFBTSxDQUFDQyxNQUFQLENBQWM5QixVQUFkLEVBQTBCRixRQUExQixFQUFvQ0MsT0FBcEM7ZUFFZUMsVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBlcnJvcnMgfSBmcm9tICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuXG5sZXQgY29tbWFuZHMgPSB7fSwgaGVscGVycyA9IHt9LCBleHRlbnNpb25zID0ge307XG5cbmhlbHBlcnMuZ2V0UmF3Q29udGV4dHMgPSBmdW5jdGlvbiBnZXRSYXdDb250ZXh0cyAoKSB7XG4gIGxldCBjb250ZXh0cyA9IHsnTkFUSVZFX0FQUCc6IG51bGx9O1xuICBsZXQgd3ZzID0gdGhpcy5hcHBNb2RlbC5nZXRXZWJ2aWV3cygpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHd2cy5sZW5ndGggKyAxOyBpKyspIHtcbiAgICBjb250ZXh0c1tgV0VCVklFV18ke2l9YF0gPSB3dnNbaSAtIDFdO1xuICB9XG4gIHJldHVybiBjb250ZXh0cztcbn07XG5cbmhlbHBlcnMuYXNzZXJ0V2Vidmlld0NvbnRleHQgPSBmdW5jdGlvbiBhc3NlcnRXZWJ2aWV3Q29udGV4dCAoKSB7XG4gIGlmICh0aGlzLmN1ckNvbnRleHQgPT09ICdOQVRJVkVfQVBQJykge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZENvbnRleHRFcnJvcigpO1xuICB9XG59O1xuXG5jb21tYW5kcy5nZXRDdXJyZW50Q29udGV4dCA9IGFzeW5jIGZ1bmN0aW9uIGdldEN1cnJlbnRDb250ZXh0ICgpIHtcbiAgcmV0dXJuIHRoaXMuY3VyQ29udGV4dDtcbn07XG5cbmNvbW1hbmRzLmdldENvbnRleHRzID0gYXN5bmMgZnVuY3Rpb24gZ2V0Q29udGV4dHMgKCkge1xuICByZXR1cm4gXy5rZXlzKHRoaXMuZ2V0UmF3Q29udGV4dHMoKSk7XG59O1xuXG5jb21tYW5kcy5zZXRDb250ZXh0ID0gYXN5bmMgZnVuY3Rpb24gc2V0Q29udGV4dCAoY29udGV4dCkge1xuICBsZXQgY29udGV4dHMgPSB0aGlzLmdldFJhd0NvbnRleHRzKCk7XG4gIGlmIChfLmluY2x1ZGVzKF8ua2V5cyhjb250ZXh0cyksIGNvbnRleHQpKSB7XG4gICAgdGhpcy5jdXJDb250ZXh0ID0gY29udGV4dDtcbiAgICBpZiAoY29udGV4dCA9PT0gJ05BVElWRV9BUFAnKSB7XG4gICAgICB0aGlzLmFwcE1vZGVsLmRlYWN0aXZhdGVXZWJ2aWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXBwTW9kZWwuYWN0aXZhdGVXZWJ2aWV3KGNvbnRleHRzW2NvbnRleHRdKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5Ob1N1Y2hDb250ZXh0RXJyb3IoKTtcbiAgfVxufTtcblxuY29tbWFuZHMuc2V0RnJhbWUgPSBhc3luYyBmdW5jdGlvbiBzZXRGcmFtZSAoZnJhbWVJZCkge1xuICB0aGlzLmFzc2VydFdlYnZpZXdDb250ZXh0KCk7XG4gIGlmIChmcmFtZUlkID09PSBudWxsKSB7XG4gICAgdGhpcy5hcHBNb2RlbC5kZWFjdGl2YXRlRnJhbWUoKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLmFwcE1vZGVsLnhwYXRoUXVlcnkoYC8vaWZyYW1lW0BpZD1cIiR7ZnJhbWVJZH1cIl1gKTtcbiAgICBpZiAoIW5vZGVzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5Ob1N1Y2hGcmFtZUVycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuYXBwTW9kZWwuYWN0aXZhdGVGcmFtZShub2Rlc1swXSk7XG4gIH1cbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMsIGhlbHBlcnMpO1xuZXhwb3J0IHsgY29tbWFuZHMsIGhlbHBlcnMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9jb250ZXh0cy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9