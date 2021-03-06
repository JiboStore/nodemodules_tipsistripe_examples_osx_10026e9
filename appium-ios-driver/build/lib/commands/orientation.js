"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _logger = _interopRequireDefault(require("../logger"));

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

commands.getOrientation = async function () {
  try {
    let res = await this.uiAutoClient.sendCommand('au.getScreenOrientation()');

    _logger.default.debug(`Setting internal orientation to '${res}'`);

    this.opts.curOrientation = res;
    return res;
  } catch (err) {
    _logger.default.error(`Device orientation is not supported.`);

    throw err;
  }
};

commands.setOrientation = async function (orientation) {
  orientation = orientation.toUpperCase();
  let cmd = `au.setScreenOrientation('${orientation}')`;

  try {
    let res = await this.uiAutoClient.sendCommand(cmd);
    this.opts.curOrientation = orientation;
    return res;
  } catch (err) {
    _logger.default.error(`Device orientation ${orientation} is not supported on this device.`);

    throw err;
  }
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9vcmllbnRhdGlvbi5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsImhlbHBlcnMiLCJleHRlbnNpb25zIiwiZ2V0T3JpZW50YXRpb24iLCJyZXMiLCJ1aUF1dG9DbGllbnQiLCJzZW5kQ29tbWFuZCIsImxvZ2dlciIsImRlYnVnIiwib3B0cyIsImN1ck9yaWVudGF0aW9uIiwiZXJyIiwiZXJyb3IiLCJzZXRPcmllbnRhdGlvbiIsIm9yaWVudGF0aW9uIiwidG9VcHBlckNhc2UiLCJjbWQiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBR0EsSUFBSUEsUUFBUSxHQUFHLEVBQWY7QUFBQSxJQUFtQkMsT0FBTyxHQUFHLEVBQTdCO0FBQUEsSUFBaUNDLFVBQVUsR0FBRyxFQUE5Qzs7OztBQUVBRixRQUFRLENBQUNHLGNBQVQsR0FBMEIsa0JBQWtCO0FBQzFDLE1BQUk7QUFDRixRQUFJQyxHQUFHLEdBQUcsTUFBTSxLQUFLQyxZQUFMLENBQWtCQyxXQUFsQixDQUE4QiwyQkFBOUIsQ0FBaEI7O0FBRUFDLG9CQUFPQyxLQUFQLENBQWMsb0NBQW1DSixHQUFJLEdBQXJEOztBQUNBLFNBQUtLLElBQUwsQ0FBVUMsY0FBVixHQUEyQk4sR0FBM0I7QUFDQSxXQUFPQSxHQUFQO0FBQ0QsR0FORCxDQU1FLE9BQU9PLEdBQVAsRUFBWTtBQUNaSixvQkFBT0ssS0FBUCxDQUFjLHNDQUFkOztBQUNBLFVBQU1ELEdBQU47QUFDRDtBQUNGLENBWEQ7O0FBYUFYLFFBQVEsQ0FBQ2EsY0FBVCxHQUEwQixnQkFBZ0JDLFdBQWhCLEVBQTZCO0FBQ3JEQSxFQUFBQSxXQUFXLEdBQUdBLFdBQVcsQ0FBQ0MsV0FBWixFQUFkO0FBQ0EsTUFBSUMsR0FBRyxHQUFJLDRCQUEyQkYsV0FBWSxJQUFsRDs7QUFDQSxNQUFJO0FBQ0YsUUFBSVYsR0FBRyxHQUFHLE1BQU0sS0FBS0MsWUFBTCxDQUFrQkMsV0FBbEIsQ0FBOEJVLEdBQTlCLENBQWhCO0FBQ0EsU0FBS1AsSUFBTCxDQUFVQyxjQUFWLEdBQTJCSSxXQUEzQjtBQUNBLFdBQU9WLEdBQVA7QUFDRCxHQUpELENBSUUsT0FBT08sR0FBUCxFQUFZO0FBQ1pKLG9CQUFPSyxLQUFQLENBQWMsc0JBQXFCRSxXQUFZLG1DQUEvQzs7QUFDQSxVQUFNSCxHQUFOO0FBQ0Q7QUFDRixDQVhEOztBQWNBTSxNQUFNLENBQUNDLE1BQVAsQ0FBY2hCLFVBQWQsRUFBMEJGLFFBQTFCLEVBQW9DQyxPQUFwQztlQUVlQyxVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9sb2dnZXInO1xuXG5cbmxldCBjb21tYW5kcyA9IHt9LCBoZWxwZXJzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuY29tbWFuZHMuZ2V0T3JpZW50YXRpb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgbGV0IHJlcyA9IGF3YWl0IHRoaXMudWlBdXRvQ2xpZW50LnNlbmRDb21tYW5kKCdhdS5nZXRTY3JlZW5PcmllbnRhdGlvbigpJyk7XG4gICAgLy8ga2VlcCB0cmFjayBvZiBvcmllbnRhdGlvbiBmb3Igb3VyIG93biBwdXJwb3Nlc1xuICAgIGxvZ2dlci5kZWJ1ZyhgU2V0dGluZyBpbnRlcm5hbCBvcmllbnRhdGlvbiB0byAnJHtyZXN9J2ApO1xuICAgIHRoaXMub3B0cy5jdXJPcmllbnRhdGlvbiA9IHJlcztcbiAgICByZXR1cm4gcmVzO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2dnZXIuZXJyb3IoYERldmljZSBvcmllbnRhdGlvbiBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuY29tbWFuZHMuc2V0T3JpZW50YXRpb24gPSBhc3luYyBmdW5jdGlvbiAob3JpZW50YXRpb24pIHtcbiAgb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbi50b1VwcGVyQ2FzZSgpO1xuICBsZXQgY21kID0gYGF1LnNldFNjcmVlbk9yaWVudGF0aW9uKCcke29yaWVudGF0aW9ufScpYDtcbiAgdHJ5IHtcbiAgICBsZXQgcmVzID0gYXdhaXQgdGhpcy51aUF1dG9DbGllbnQuc2VuZENvbW1hbmQoY21kKTtcbiAgICB0aGlzLm9wdHMuY3VyT3JpZW50YXRpb24gPSBvcmllbnRhdGlvbjtcbiAgICByZXR1cm4gcmVzO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2dnZXIuZXJyb3IoYERldmljZSBvcmllbnRhdGlvbiAke29yaWVudGF0aW9ufSBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgZGV2aWNlLmApO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuXG5PYmplY3QuYXNzaWduKGV4dGVuc2lvbnMsIGNvbW1hbmRzLCBoZWxwZXJzKTtcbmV4cG9ydCB7IGNvbW1hbmRzLCBoZWxwZXJzIH07XG5leHBvcnQgZGVmYXVsdCBleHRlbnNpb25zO1xuIl0sImZpbGUiOiJsaWIvY29tbWFuZHMvb3JpZW50YXRpb24uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
