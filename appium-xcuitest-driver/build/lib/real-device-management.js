"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConnectedDevices = getConnectedDevices;
exports.getOSVersion = getOSVersion;
exports.runRealDeviceReset = runRealDeviceReset;
exports.installToRealDevice = installToRealDevice;
exports.getRealDeviceObj = getRealDeviceObj;

require("source-map-support/register");

var _appiumIosDevice = require("appium-ios-device");

var _iosDeploy = _interopRequireDefault(require("./ios-deploy"));

var _logger = _interopRequireDefault(require("./logger"));

async function getConnectedDevices() {
  return await _appiumIosDevice.utilities.getConnectedDevices();
}

async function getOSVersion(udid) {
  return await _appiumIosDevice.utilities.getOSVersion(udid);
}

async function resetRealDevice(device, opts) {
  if (!opts.bundleId || !opts.fullReset) {
    return;
  }

  let bundleId = opts.bundleId;

  _logger.default.debug(`Reset: fullReset requested. Will try to uninstall the app '${bundleId}'.`);

  if (!(await device.isAppInstalled(bundleId))) {
    _logger.default.debug('Reset: app not installed. No need to uninstall');

    return;
  }

  try {
    await device.remove(bundleId);
  } catch (err) {
    _logger.default.error(`Reset: could not remove '${bundleId}' from device: ${err.message}`);

    throw err;
  }

  _logger.default.debug(`Reset: removed '${bundleId}'`);
}

async function runRealDeviceReset(device, opts) {
  if (!opts.noReset || opts.fullReset) {
    _logger.default.debug('Reset: running ios real device reset flow');

    if (!opts.noReset) {
      await resetRealDevice(device, opts);
    }
  } else {
    _logger.default.debug('Reset: fullReset not set. Leaving as is');
  }
}

async function installToRealDevice(device, app, bundleId, noReset = true) {
  if (!device.udid || !app) {
    _logger.default.debug('No device id or app, not installing to real device.');

    return;
  }

  if (await device.isAppInstalled(bundleId)) {
    if (noReset) {
      _logger.default.debug(`App '${bundleId}' is already installed. No need to reinstall.`);

      return;
    }

    _logger.default.debug(`Reset requested. Removing app with id '${bundleId}' from the device`);

    await device.remove(bundleId);
  }

  _logger.default.debug(`Installing '${app}' on device with UUID '${device.udid}'...`);

  await device.install(app);

  _logger.default.debug('The app has been installed successfully.');
}

function getRealDeviceObj(udid) {
  _logger.default.debug(`Creating iDevice object with udid '${udid}'`);

  return new _iosDeploy.default(udid);
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9yZWFsLWRldmljZS1tYW5hZ2VtZW50LmpzIl0sIm5hbWVzIjpbImdldENvbm5lY3RlZERldmljZXMiLCJ1dGlsaXRpZXMiLCJnZXRPU1ZlcnNpb24iLCJ1ZGlkIiwicmVzZXRSZWFsRGV2aWNlIiwiZGV2aWNlIiwib3B0cyIsImJ1bmRsZUlkIiwiZnVsbFJlc2V0IiwibG9nIiwiZGVidWciLCJpc0FwcEluc3RhbGxlZCIsInJlbW92ZSIsImVyciIsImVycm9yIiwibWVzc2FnZSIsInJ1blJlYWxEZXZpY2VSZXNldCIsIm5vUmVzZXQiLCJpbnN0YWxsVG9SZWFsRGV2aWNlIiwiYXBwIiwiaW5zdGFsbCIsImdldFJlYWxEZXZpY2VPYmoiLCJJT1NEZXBsb3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUdBLGVBQWVBLG1CQUFmLEdBQXNDO0FBQ3BDLFNBQU8sTUFBTUMsMkJBQVVELG1CQUFWLEVBQWI7QUFDRDs7QUFFRCxlQUFlRSxZQUFmLENBQTZCQyxJQUE3QixFQUFtQztBQUNqQyxTQUFPLE1BQU1GLDJCQUFVQyxZQUFWLENBQXVCQyxJQUF2QixDQUFiO0FBQ0Q7O0FBRUQsZUFBZUMsZUFBZixDQUFnQ0MsTUFBaEMsRUFBd0NDLElBQXhDLEVBQThDO0FBQzVDLE1BQUksQ0FBQ0EsSUFBSSxDQUFDQyxRQUFOLElBQWtCLENBQUNELElBQUksQ0FBQ0UsU0FBNUIsRUFBdUM7QUFDckM7QUFDRDs7QUFFRCxNQUFJRCxRQUFRLEdBQUdELElBQUksQ0FBQ0MsUUFBcEI7O0FBQ0FFLGtCQUFJQyxLQUFKLENBQVcsOERBQTZESCxRQUFTLElBQWpGOztBQUNBLE1BQUksRUFBQyxNQUFNRixNQUFNLENBQUNNLGNBQVAsQ0FBc0JKLFFBQXRCLENBQVAsQ0FBSixFQUE0QztBQUMxQ0Usb0JBQUlDLEtBQUosQ0FBVSxnREFBVjs7QUFDQTtBQUNEOztBQUNELE1BQUk7QUFDRixVQUFNTCxNQUFNLENBQUNPLE1BQVAsQ0FBY0wsUUFBZCxDQUFOO0FBQ0QsR0FGRCxDQUVFLE9BQU9NLEdBQVAsRUFBWTtBQUNaSixvQkFBSUssS0FBSixDQUFXLDRCQUEyQlAsUUFBUyxrQkFBaUJNLEdBQUcsQ0FBQ0UsT0FBUSxFQUE1RTs7QUFDQSxVQUFNRixHQUFOO0FBQ0Q7O0FBQ0RKLGtCQUFJQyxLQUFKLENBQVcsbUJBQWtCSCxRQUFTLEdBQXRDO0FBQ0Q7O0FBRUQsZUFBZVMsa0JBQWYsQ0FBbUNYLE1BQW5DLEVBQTJDQyxJQUEzQyxFQUFpRDtBQUMvQyxNQUFJLENBQUNBLElBQUksQ0FBQ1csT0FBTixJQUFpQlgsSUFBSSxDQUFDRSxTQUExQixFQUFxQztBQUNuQ0Msb0JBQUlDLEtBQUosQ0FBVSwyQ0FBVjs7QUFDQSxRQUFJLENBQUNKLElBQUksQ0FBQ1csT0FBVixFQUFtQjtBQUNqQixZQUFNYixlQUFlLENBQUNDLE1BQUQsRUFBU0MsSUFBVCxDQUFyQjtBQUNEO0FBQ0YsR0FMRCxNQUtPO0FBQ0xHLG9CQUFJQyxLQUFKLENBQVUseUNBQVY7QUFDRDtBQUNGOztBQUVELGVBQWVRLG1CQUFmLENBQW9DYixNQUFwQyxFQUE0Q2MsR0FBNUMsRUFBaURaLFFBQWpELEVBQTJEVSxPQUFPLEdBQUcsSUFBckUsRUFBMkU7QUFDekUsTUFBSSxDQUFDWixNQUFNLENBQUNGLElBQVIsSUFBZ0IsQ0FBQ2dCLEdBQXJCLEVBQTBCO0FBQ3hCVixvQkFBSUMsS0FBSixDQUFVLHFEQUFWOztBQUNBO0FBQ0Q7O0FBRUQsTUFBSSxNQUFNTCxNQUFNLENBQUNNLGNBQVAsQ0FBc0JKLFFBQXRCLENBQVYsRUFBMkM7QUFDekMsUUFBSVUsT0FBSixFQUFhO0FBQ1hSLHNCQUFJQyxLQUFKLENBQVcsUUFBT0gsUUFBUywrQ0FBM0I7O0FBQ0E7QUFDRDs7QUFDREUsb0JBQUlDLEtBQUosQ0FBVywwQ0FBeUNILFFBQVMsbUJBQTdEOztBQUNBLFVBQU1GLE1BQU0sQ0FBQ08sTUFBUCxDQUFjTCxRQUFkLENBQU47QUFDRDs7QUFDREUsa0JBQUlDLEtBQUosQ0FBVyxlQUFjUyxHQUFJLDBCQUF5QmQsTUFBTSxDQUFDRixJQUFLLE1BQWxFOztBQUNBLFFBQU1FLE1BQU0sQ0FBQ2UsT0FBUCxDQUFlRCxHQUFmLENBQU47O0FBQ0FWLGtCQUFJQyxLQUFKLENBQVUsMENBQVY7QUFDRDs7QUFFRCxTQUFTVyxnQkFBVCxDQUEyQmxCLElBQTNCLEVBQWlDO0FBQy9CTSxrQkFBSUMsS0FBSixDQUFXLHNDQUFxQ1AsSUFBSyxHQUFyRDs7QUFDQSxTQUFPLElBQUltQixrQkFBSixDQUFjbkIsSUFBZCxDQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlsaXRpZXMgfSBmcm9tICdhcHBpdW0taW9zLWRldmljZSc7XG5pbXBvcnQgSU9TRGVwbG95IGZyb20gJy4vaW9zLWRlcGxveSc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcblxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb25uZWN0ZWREZXZpY2VzICgpIHtcbiAgcmV0dXJuIGF3YWl0IHV0aWxpdGllcy5nZXRDb25uZWN0ZWREZXZpY2VzKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE9TVmVyc2lvbiAodWRpZCkge1xuICByZXR1cm4gYXdhaXQgdXRpbGl0aWVzLmdldE9TVmVyc2lvbih1ZGlkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzZXRSZWFsRGV2aWNlIChkZXZpY2UsIG9wdHMpIHtcbiAgaWYgKCFvcHRzLmJ1bmRsZUlkIHx8ICFvcHRzLmZ1bGxSZXNldCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBidW5kbGVJZCA9IG9wdHMuYnVuZGxlSWQ7XG4gIGxvZy5kZWJ1ZyhgUmVzZXQ6IGZ1bGxSZXNldCByZXF1ZXN0ZWQuIFdpbGwgdHJ5IHRvIHVuaW5zdGFsbCB0aGUgYXBwICcke2J1bmRsZUlkfScuYCk7XG4gIGlmICghYXdhaXQgZGV2aWNlLmlzQXBwSW5zdGFsbGVkKGJ1bmRsZUlkKSkge1xuICAgIGxvZy5kZWJ1ZygnUmVzZXQ6IGFwcCBub3QgaW5zdGFsbGVkLiBObyBuZWVkIHRvIHVuaW5zdGFsbCcpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IGRldmljZS5yZW1vdmUoYnVuZGxlSWQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2cuZXJyb3IoYFJlc2V0OiBjb3VsZCBub3QgcmVtb3ZlICcke2J1bmRsZUlkfScgZnJvbSBkZXZpY2U6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIGxvZy5kZWJ1ZyhgUmVzZXQ6IHJlbW92ZWQgJyR7YnVuZGxlSWR9J2ApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5SZWFsRGV2aWNlUmVzZXQgKGRldmljZSwgb3B0cykge1xuICBpZiAoIW9wdHMubm9SZXNldCB8fCBvcHRzLmZ1bGxSZXNldCkge1xuICAgIGxvZy5kZWJ1ZygnUmVzZXQ6IHJ1bm5pbmcgaW9zIHJlYWwgZGV2aWNlIHJlc2V0IGZsb3cnKTtcbiAgICBpZiAoIW9wdHMubm9SZXNldCkge1xuICAgICAgYXdhaXQgcmVzZXRSZWFsRGV2aWNlKGRldmljZSwgb3B0cyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxvZy5kZWJ1ZygnUmVzZXQ6IGZ1bGxSZXNldCBub3Qgc2V0LiBMZWF2aW5nIGFzIGlzJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFRvUmVhbERldmljZSAoZGV2aWNlLCBhcHAsIGJ1bmRsZUlkLCBub1Jlc2V0ID0gdHJ1ZSkge1xuICBpZiAoIWRldmljZS51ZGlkIHx8ICFhcHApIHtcbiAgICBsb2cuZGVidWcoJ05vIGRldmljZSBpZCBvciBhcHAsIG5vdCBpbnN0YWxsaW5nIHRvIHJlYWwgZGV2aWNlLicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChhd2FpdCBkZXZpY2UuaXNBcHBJbnN0YWxsZWQoYnVuZGxlSWQpKSB7XG4gICAgaWYgKG5vUmVzZXQpIHtcbiAgICAgIGxvZy5kZWJ1ZyhgQXBwICcke2J1bmRsZUlkfScgaXMgYWxyZWFkeSBpbnN0YWxsZWQuIE5vIG5lZWQgdG8gcmVpbnN0YWxsLmApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYFJlc2V0IHJlcXVlc3RlZC4gUmVtb3ZpbmcgYXBwIHdpdGggaWQgJyR7YnVuZGxlSWR9JyBmcm9tIHRoZSBkZXZpY2VgKTtcbiAgICBhd2FpdCBkZXZpY2UucmVtb3ZlKGJ1bmRsZUlkKTtcbiAgfVxuICBsb2cuZGVidWcoYEluc3RhbGxpbmcgJyR7YXBwfScgb24gZGV2aWNlIHdpdGggVVVJRCAnJHtkZXZpY2UudWRpZH0nLi4uYCk7XG4gIGF3YWl0IGRldmljZS5pbnN0YWxsKGFwcCk7XG4gIGxvZy5kZWJ1ZygnVGhlIGFwcCBoYXMgYmVlbiBpbnN0YWxsZWQgc3VjY2Vzc2Z1bGx5LicpO1xufVxuXG5mdW5jdGlvbiBnZXRSZWFsRGV2aWNlT2JqICh1ZGlkKSB7XG4gIGxvZy5kZWJ1ZyhgQ3JlYXRpbmcgaURldmljZSBvYmplY3Qgd2l0aCB1ZGlkICcke3VkaWR9J2ApO1xuICByZXR1cm4gbmV3IElPU0RlcGxveSh1ZGlkKTtcbn1cblxuZXhwb3J0IHsgZ2V0Q29ubmVjdGVkRGV2aWNlcywgZ2V0T1NWZXJzaW9uLCBydW5SZWFsRGV2aWNlUmVzZXQsIGluc3RhbGxUb1JlYWxEZXZpY2UsXG4gIGdldFJlYWxEZXZpY2VPYmogfTtcbiJdLCJmaWxlIjoibGliL3JlYWwtZGV2aWNlLW1hbmFnZW1lbnQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
