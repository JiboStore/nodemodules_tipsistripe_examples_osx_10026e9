"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

var _appiumIosDevice = require("appium-ios-device");

var _appiumSupport = require("appium-support");

var _logger = _interopRequireDefault(require("../logger"));

let commands = {};
exports.commands = commands;

commands.setGeoLocation = async function setGeoLocation(location) {
  let {
    latitude,
    longitude
  } = location;

  if (!_appiumSupport.util.hasValue(latitude) || !_appiumSupport.util.hasValue(longitude)) {
    _logger.default.errorAndThrow(`Both latitude and longitude should be set`);
  }

  if (this.isSimulator()) {
    await this.opts.device.setGeolocation(`${latitude}`, `${longitude}`);
    return;
  }

  const service = await _appiumIosDevice.services.startSimulateLocationService(this.opts.udid);

  try {
    service.setLocation(latitude, longitude);
  } catch (e) {
    _logger.default.errorAndThrow(`Can't set the location on device '${this.opts.udid}'. Original error: ${e.message}`);
  } finally {
    service.close();
  }
};

var _default = commands;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9sb2NhdGlvbi5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsInNldEdlb0xvY2F0aW9uIiwibG9jYXRpb24iLCJsYXRpdHVkZSIsImxvbmdpdHVkZSIsInV0aWwiLCJoYXNWYWx1ZSIsImxvZyIsImVycm9yQW5kVGhyb3ciLCJpc1NpbXVsYXRvciIsIm9wdHMiLCJkZXZpY2UiLCJzZXRHZW9sb2NhdGlvbiIsInNlcnZpY2UiLCJzZXJ2aWNlcyIsInN0YXJ0U2ltdWxhdGVMb2NhdGlvblNlcnZpY2UiLCJ1ZGlkIiwic2V0TG9jYXRpb24iLCJlIiwibWVzc2FnZSIsImNsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBLElBQUlBLFFBQVEsR0FBRyxFQUFmOzs7QUFFQUEsUUFBUSxDQUFDQyxjQUFULEdBQTBCLGVBQWVBLGNBQWYsQ0FBK0JDLFFBQS9CLEVBQXlDO0FBQ2pFLE1BQUk7QUFBQ0MsSUFBQUEsUUFBRDtBQUFXQyxJQUFBQTtBQUFYLE1BQXdCRixRQUE1Qjs7QUFFQSxNQUFJLENBQUNHLG9CQUFLQyxRQUFMLENBQWNILFFBQWQsQ0FBRCxJQUE0QixDQUFDRSxvQkFBS0MsUUFBTCxDQUFjRixTQUFkLENBQWpDLEVBQTJEO0FBQ3pERyxvQkFBSUMsYUFBSixDQUFtQiwyQ0FBbkI7QUFDRDs7QUFFRCxNQUFJLEtBQUtDLFdBQUwsRUFBSixFQUF3QjtBQUN0QixVQUFNLEtBQUtDLElBQUwsQ0FBVUMsTUFBVixDQUFpQkMsY0FBakIsQ0FBaUMsR0FBRVQsUUFBUyxFQUE1QyxFQUFnRCxHQUFFQyxTQUFVLEVBQTVELENBQU47QUFDQTtBQUNEOztBQUVELFFBQU1TLE9BQU8sR0FBRyxNQUFNQywwQkFBU0MsNEJBQVQsQ0FBc0MsS0FBS0wsSUFBTCxDQUFVTSxJQUFoRCxDQUF0Qjs7QUFDQSxNQUFJO0FBQ0ZILElBQUFBLE9BQU8sQ0FBQ0ksV0FBUixDQUFvQmQsUUFBcEIsRUFBOEJDLFNBQTlCO0FBQ0QsR0FGRCxDQUVFLE9BQU9jLENBQVAsRUFBVTtBQUNWWCxvQkFBSUMsYUFBSixDQUFtQixxQ0FBb0MsS0FBS0UsSUFBTCxDQUFVTSxJQUFLLHNCQUFxQkUsQ0FBQyxDQUFDQyxPQUFRLEVBQXJHO0FBQ0QsR0FKRCxTQUlVO0FBQ1JOLElBQUFBLE9BQU8sQ0FBQ08sS0FBUjtBQUNEO0FBQ0YsQ0FwQkQ7O2VBdUJlcEIsUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlcnZpY2VzIH0gZnJvbSAnYXBwaXVtLWlvcy1kZXZpY2UnO1xuaW1wb3J0IHsgdXRpbCB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCBsb2cgZnJvbSAnLi4vbG9nZ2VyJztcblxubGV0IGNvbW1hbmRzID0ge307XG5cbmNvbW1hbmRzLnNldEdlb0xvY2F0aW9uID0gYXN5bmMgZnVuY3Rpb24gc2V0R2VvTG9jYXRpb24gKGxvY2F0aW9uKSB7XG4gIGxldCB7bGF0aXR1ZGUsIGxvbmdpdHVkZX0gPSBsb2NhdGlvbjtcblxuICBpZiAoIXV0aWwuaGFzVmFsdWUobGF0aXR1ZGUpIHx8ICF1dGlsLmhhc1ZhbHVlKGxvbmdpdHVkZSkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgQm90aCBsYXRpdHVkZSBhbmQgbG9uZ2l0dWRlIHNob3VsZCBiZSBzZXRgKTtcbiAgfVxuXG4gIGlmICh0aGlzLmlzU2ltdWxhdG9yKCkpIHtcbiAgICBhd2FpdCB0aGlzLm9wdHMuZGV2aWNlLnNldEdlb2xvY2F0aW9uKGAke2xhdGl0dWRlfWAsIGAke2xvbmdpdHVkZX1gKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzZXJ2aWNlID0gYXdhaXQgc2VydmljZXMuc3RhcnRTaW11bGF0ZUxvY2F0aW9uU2VydmljZSh0aGlzLm9wdHMudWRpZCk7XG4gIHRyeSB7XG4gICAgc2VydmljZS5zZXRMb2NhdGlvbihsYXRpdHVkZSwgbG9uZ2l0dWRlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KGBDYW4ndCBzZXQgdGhlIGxvY2F0aW9uIG9uIGRldmljZSAnJHt0aGlzLm9wdHMudWRpZH0nLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2VydmljZS5jbG9zZSgpO1xuICB9XG59O1xuXG5leHBvcnQgeyBjb21tYW5kcyB9O1xuZXhwb3J0IGRlZmF1bHQgY29tbWFuZHM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9sb2NhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9