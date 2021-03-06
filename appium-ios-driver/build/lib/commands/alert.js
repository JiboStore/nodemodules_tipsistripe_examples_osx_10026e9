"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _appiumSupport = require("appium-support");

var _appiumBaseDriver = require("appium-base-driver");

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

function handleError(err) {
  if (err.message && err.message.match(/not open/)) {
    throw new _appiumBaseDriver.errors.NoAlertOpenError();
  } else {
    throw err;
  }
}

commands.getAlertText = async function () {
  try {
    let ret = await this.uiAutoClient.sendCommand("au.getAlertText()");
    return ret;
  } catch (err) {
    handleError(err);
  }
};

commands.setAlertText = async function (text) {
  try {
    text = _appiumSupport.util.escapeSpecialChars(text, "'");
    await this.uiAutoClient.sendCommand(`au.setAlertText('${text}')`);
  } catch (err) {
    handleError(err);
  }
};

commands.postAcceptAlert = async function () {
  try {
    await this.uiAutoClient.sendCommand("au.acceptAlert()");
  } catch (err) {
    handleError(err);
  }
};

commands.postDismissAlert = async function () {
  try {
    await this.uiAutoClient.sendCommand("au.dismissAlert()");
  } catch (err) {
    handleError(err);
  }
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9hbGVydC5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsImhlbHBlcnMiLCJleHRlbnNpb25zIiwiaGFuZGxlRXJyb3IiLCJlcnIiLCJtZXNzYWdlIiwibWF0Y2giLCJlcnJvcnMiLCJOb0FsZXJ0T3BlbkVycm9yIiwiZ2V0QWxlcnRUZXh0IiwicmV0IiwidWlBdXRvQ2xpZW50Iiwic2VuZENvbW1hbmQiLCJzZXRBbGVydFRleHQiLCJ0ZXh0IiwidXRpbCIsImVzY2FwZVNwZWNpYWxDaGFycyIsInBvc3RBY2NlcHRBbGVydCIsInBvc3REaXNtaXNzQWxlcnQiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUlBOztBQURBLElBQUlBLFFBQVEsR0FBRyxFQUFmO0FBQUEsSUFBbUJDLE9BQU8sR0FBRyxFQUE3QjtBQUFBLElBQWlDQyxVQUFVLEdBQUcsRUFBOUM7Ozs7QUFHQSxTQUFTQyxXQUFULENBQXNCQyxHQUF0QixFQUEyQjtBQUN6QixNQUFJQSxHQUFHLENBQUNDLE9BQUosSUFBZUQsR0FBRyxDQUFDQyxPQUFKLENBQVlDLEtBQVosQ0FBa0IsVUFBbEIsQ0FBbkIsRUFBa0Q7QUFDaEQsVUFBTSxJQUFJQyx5QkFBT0MsZ0JBQVgsRUFBTjtBQUNELEdBRkQsTUFFTztBQUNMLFVBQU1KLEdBQU47QUFDRDtBQUNGOztBQUVESixRQUFRLENBQUNTLFlBQVQsR0FBd0Isa0JBQWtCO0FBQ3hDLE1BQUk7QUFDRixRQUFJQyxHQUFHLEdBQUcsTUFBTSxLQUFLQyxZQUFMLENBQWtCQyxXQUFsQixDQUE4QixtQkFBOUIsQ0FBaEI7QUFDQSxXQUFPRixHQUFQO0FBQ0QsR0FIRCxDQUdFLE9BQU9OLEdBQVAsRUFBWTtBQUNaRCxJQUFBQSxXQUFXLENBQUNDLEdBQUQsQ0FBWDtBQUNEO0FBQ0YsQ0FQRDs7QUFTQUosUUFBUSxDQUFDYSxZQUFULEdBQXdCLGdCQUFnQkMsSUFBaEIsRUFBc0I7QUFDNUMsTUFBSTtBQUNGQSxJQUFBQSxJQUFJLEdBQUdDLG9CQUFLQyxrQkFBTCxDQUF3QkYsSUFBeEIsRUFBOEIsR0FBOUIsQ0FBUDtBQUNBLFVBQU0sS0FBS0gsWUFBTCxDQUFrQkMsV0FBbEIsQ0FBK0Isb0JBQW1CRSxJQUFLLElBQXZELENBQU47QUFDRCxHQUhELENBR0UsT0FBT1YsR0FBUCxFQUFZO0FBQ1pELElBQUFBLFdBQVcsQ0FBQ0MsR0FBRCxDQUFYO0FBQ0Q7QUFDRixDQVBEOztBQVNBSixRQUFRLENBQUNpQixlQUFULEdBQTJCLGtCQUFrQjtBQUMzQyxNQUFJO0FBQ0YsVUFBTSxLQUFLTixZQUFMLENBQWtCQyxXQUFsQixDQUE4QixrQkFBOUIsQ0FBTjtBQUNELEdBRkQsQ0FFRSxPQUFPUixHQUFQLEVBQVk7QUFDWkQsSUFBQUEsV0FBVyxDQUFDQyxHQUFELENBQVg7QUFDRDtBQUNGLENBTkQ7O0FBUUFKLFFBQVEsQ0FBQ2tCLGdCQUFULEdBQTRCLGtCQUFrQjtBQUM1QyxNQUFJO0FBQ0YsVUFBTSxLQUFLUCxZQUFMLENBQWtCQyxXQUFsQixDQUE4QixtQkFBOUIsQ0FBTjtBQUNELEdBRkQsQ0FFRSxPQUFPUixHQUFQLEVBQVk7QUFDWkQsSUFBQUEsV0FBVyxDQUFDQyxHQUFELENBQVg7QUFDRDtBQUNGLENBTkQ7O0FBUUFlLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjbEIsVUFBZCxFQUEwQkYsUUFBMUIsRUFBb0NDLE9BQXBDO2VBRWVDLFUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlsIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuXG5cbmxldCBjb21tYW5kcyA9IHt9LCBoZWxwZXJzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yIChlcnIpIHtcbiAgaWYgKGVyci5tZXNzYWdlICYmIGVyci5tZXNzYWdlLm1hdGNoKC9ub3Qgb3Blbi8pKSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5Ob0FsZXJ0T3BlbkVycm9yKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmNvbW1hbmRzLmdldEFsZXJ0VGV4dCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBsZXQgcmV0ID0gYXdhaXQgdGhpcy51aUF1dG9DbGllbnQuc2VuZENvbW1hbmQoXCJhdS5nZXRBbGVydFRleHQoKVwiKTtcbiAgICByZXR1cm4gcmV0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBoYW5kbGVFcnJvcihlcnIpO1xuICB9XG59O1xuXG5jb21tYW5kcy5zZXRBbGVydFRleHQgPSBhc3luYyBmdW5jdGlvbiAodGV4dCkge1xuICB0cnkge1xuICAgIHRleHQgPSB1dGlsLmVzY2FwZVNwZWNpYWxDaGFycyh0ZXh0LCBcIidcIik7XG4gICAgYXdhaXQgdGhpcy51aUF1dG9DbGllbnQuc2VuZENvbW1hbmQoYGF1LnNldEFsZXJ0VGV4dCgnJHt0ZXh0fScpYCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGhhbmRsZUVycm9yKGVycik7XG4gIH1cbn07XG5cbmNvbW1hbmRzLnBvc3RBY2NlcHRBbGVydCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLnVpQXV0b0NsaWVudC5zZW5kQ29tbWFuZChcImF1LmFjY2VwdEFsZXJ0KClcIik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGhhbmRsZUVycm9yKGVycik7XG4gIH1cbn07XG5cbmNvbW1hbmRzLnBvc3REaXNtaXNzQWxlcnQgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy51aUF1dG9DbGllbnQuc2VuZENvbW1hbmQoXCJhdS5kaXNtaXNzQWxlcnQoKVwiKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaGFuZGxlRXJyb3IoZXJyKTtcbiAgfVxufTtcblxuT2JqZWN0LmFzc2lnbihleHRlbnNpb25zLCBjb21tYW5kcywgaGVscGVycyk7XG5leHBvcnQgeyBjb21tYW5kcywgaGVscGVycyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2FsZXJ0LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
