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

helpers.assertNoAlert = function assertNoAlert() {
  if (this.appModel.hasAlert()) {
    throw new _appiumBaseDriver.errors.UnexpectedAlertOpenError();
  }
};

helpers.assertAlert = function assertAlert() {
  if (!this.appModel.hasAlert()) {
    throw new _appiumBaseDriver.errors.NoAlertOpenError();
  }
};

commands.getAlertText = async function getAlertText() {
  this.assertAlert();
  return this.appModel.alertText();
};

commands.setAlertText = async function setAlertText(text) {
  this.assertAlert();

  try {
    this.appModel.setAlertText(text);
  } catch (e) {
    throw new _appiumBaseDriver.errors.InvalidElementStateError();
  }
};

commands.postAcceptAlert = async function postAcceptAlert() {
  this.assertAlert();
  this.appModel.handleAlert();
};

commands.postDismissAlert = commands.postAcceptAlert;
Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9hbGVydC5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsImhlbHBlcnMiLCJleHRlbnNpb25zIiwiYXNzZXJ0Tm9BbGVydCIsImFwcE1vZGVsIiwiaGFzQWxlcnQiLCJlcnJvcnMiLCJVbmV4cGVjdGVkQWxlcnRPcGVuRXJyb3IiLCJhc3NlcnRBbGVydCIsIk5vQWxlcnRPcGVuRXJyb3IiLCJnZXRBbGVydFRleHQiLCJhbGVydFRleHQiLCJzZXRBbGVydFRleHQiLCJ0ZXh0IiwiZSIsIkludmFsaWRFbGVtZW50U3RhdGVFcnJvciIsInBvc3RBY2NlcHRBbGVydCIsImhhbmRsZUFsZXJ0IiwicG9zdERpc21pc3NBbGVydCIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUEsSUFBSUEsUUFBUSxHQUFHLEVBQWY7QUFBQSxJQUFtQkMsT0FBTyxHQUFHLEVBQTdCO0FBQUEsSUFBaUNDLFVBQVUsR0FBRyxFQUE5Qzs7OztBQUVBRCxPQUFPLENBQUNFLGFBQVIsR0FBd0IsU0FBU0EsYUFBVCxHQUEwQjtBQUNoRCxNQUFJLEtBQUtDLFFBQUwsQ0FBY0MsUUFBZCxFQUFKLEVBQThCO0FBQzVCLFVBQU0sSUFBSUMseUJBQU9DLHdCQUFYLEVBQU47QUFDRDtBQUNGLENBSkQ7O0FBTUFOLE9BQU8sQ0FBQ08sV0FBUixHQUFzQixTQUFTQSxXQUFULEdBQXdCO0FBQzVDLE1BQUksQ0FBQyxLQUFLSixRQUFMLENBQWNDLFFBQWQsRUFBTCxFQUErQjtBQUM3QixVQUFNLElBQUlDLHlCQUFPRyxnQkFBWCxFQUFOO0FBQ0Q7QUFDRixDQUpEOztBQU1BVCxRQUFRLENBQUNVLFlBQVQsR0FBd0IsZUFBZUEsWUFBZixHQUErQjtBQUNyRCxPQUFLRixXQUFMO0FBQ0EsU0FBTyxLQUFLSixRQUFMLENBQWNPLFNBQWQsRUFBUDtBQUNELENBSEQ7O0FBS0FYLFFBQVEsQ0FBQ1ksWUFBVCxHQUF3QixlQUFlQSxZQUFmLENBQTZCQyxJQUE3QixFQUFtQztBQUN6RCxPQUFLTCxXQUFMOztBQUNBLE1BQUk7QUFDRixTQUFLSixRQUFMLENBQWNRLFlBQWQsQ0FBMkJDLElBQTNCO0FBQ0QsR0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWLFVBQU0sSUFBSVIseUJBQU9TLHdCQUFYLEVBQU47QUFDRDtBQUNGLENBUEQ7O0FBU0FmLFFBQVEsQ0FBQ2dCLGVBQVQsR0FBMkIsZUFBZUEsZUFBZixHQUFrQztBQUMzRCxPQUFLUixXQUFMO0FBQ0EsT0FBS0osUUFBTCxDQUFjYSxXQUFkO0FBQ0QsQ0FIRDs7QUFLQWpCLFFBQVEsQ0FBQ2tCLGdCQUFULEdBQTRCbEIsUUFBUSxDQUFDZ0IsZUFBckM7QUFFQUcsTUFBTSxDQUFDQyxNQUFQLENBQWNsQixVQUFkLEVBQTBCRixRQUExQixFQUFvQ0MsT0FBcEM7ZUFFZUMsVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVycm9ycyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5cbmxldCBjb21tYW5kcyA9IHt9LCBoZWxwZXJzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuaGVscGVycy5hc3NlcnROb0FsZXJ0ID0gZnVuY3Rpb24gYXNzZXJ0Tm9BbGVydCAoKSB7XG4gIGlmICh0aGlzLmFwcE1vZGVsLmhhc0FsZXJ0KCkpIHtcbiAgICB0aHJvdyBuZXcgZXJyb3JzLlVuZXhwZWN0ZWRBbGVydE9wZW5FcnJvcigpO1xuICB9XG59O1xuXG5oZWxwZXJzLmFzc2VydEFsZXJ0ID0gZnVuY3Rpb24gYXNzZXJ0QWxlcnQgKCkge1xuICBpZiAoIXRoaXMuYXBwTW9kZWwuaGFzQWxlcnQoKSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuTm9BbGVydE9wZW5FcnJvcigpO1xuICB9XG59O1xuXG5jb21tYW5kcy5nZXRBbGVydFRleHQgPSBhc3luYyBmdW5jdGlvbiBnZXRBbGVydFRleHQgKCkge1xuICB0aGlzLmFzc2VydEFsZXJ0KCk7XG4gIHJldHVybiB0aGlzLmFwcE1vZGVsLmFsZXJ0VGV4dCgpO1xufTtcblxuY29tbWFuZHMuc2V0QWxlcnRUZXh0ID0gYXN5bmMgZnVuY3Rpb24gc2V0QWxlcnRUZXh0ICh0ZXh0KSB7XG4gIHRoaXMuYXNzZXJ0QWxlcnQoKTtcbiAgdHJ5IHtcbiAgICB0aGlzLmFwcE1vZGVsLnNldEFsZXJ0VGV4dCh0ZXh0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuSW52YWxpZEVsZW1lbnRTdGF0ZUVycm9yKCk7XG4gIH1cbn07XG5cbmNvbW1hbmRzLnBvc3RBY2NlcHRBbGVydCA9IGFzeW5jIGZ1bmN0aW9uIHBvc3RBY2NlcHRBbGVydCAoKSB7XG4gIHRoaXMuYXNzZXJ0QWxlcnQoKTtcbiAgdGhpcy5hcHBNb2RlbC5oYW5kbGVBbGVydCgpO1xufTtcblxuY29tbWFuZHMucG9zdERpc21pc3NBbGVydCA9IGNvbW1hbmRzLnBvc3RBY2NlcHRBbGVydDtcblxuT2JqZWN0LmFzc2lnbihleHRlbnNpb25zLCBjb21tYW5kcywgaGVscGVycyk7XG5leHBvcnQgeyBjb21tYW5kcywgaGVscGVycyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2FsZXJ0LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=