"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _simulatorXcode = _interopRequireDefault(require("./simulator-xcode-8"));

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _appiumSupport = require("appium-support");

var _asyncLock = _interopRequireDefault(require("async-lock"));

var _logger = _interopRequireDefault(require("./logger"));

var _nodeSimctl = require("node-simctl");

var _asyncbox = require("asyncbox");

var _utils = require("./utils.js");

const SIMULATOR_SHUTDOWN_TIMEOUT = 15 * 1000;
const startupLock = new _asyncLock.default();
const preferencesPlistGuard = new _asyncLock.default();
const ENROLLMENT_NOTIFICATION_RECEIVER = 'com.apple.BiometricKit.enrollmentChanged';

class SimulatorXcode9 extends _simulatorXcode.default {
  constructor(udid, xcodeVersion) {
    super(udid, xcodeVersion);
  }

  async run(opts = {}) {
    opts = Object.assign({
      devicePreferences: {},
      isHeadless: false,
      startupTimeout: this.startupTimeout
    }, opts);

    if (opts.scaleFactor) {
      opts.devicePreferences.SimulatorWindowLastScale = parseFloat(opts.scaleFactor);
    }

    const commonPreferences = {
      RotateWindowWhenSignaledByGuest: true
    };

    if (_lodash.default.isBoolean(opts.connectHardwareKeyboard)) {
      opts.devicePreferences.ConnectHardwareKeyboard = opts.connectHardwareKeyboard;
      commonPreferences.ConnectHardwareKeyboard = opts.connectHardwareKeyboard;
    }

    if (!_lodash.default.isEmpty(opts.devicePreferences) || !_lodash.default.isEmpty(commonPreferences)) {
      await this.updatePreferences(opts.devicePreferences, commonPreferences);
    }

    const bootSimulator = async () => {
      try {
        await (0, _asyncbox.retryInterval)(3, 2000, async () => await (0, _nodeSimctl.bootDevice)(this.udid));
      } catch (err) {
        _logger.default.warn(`'xcrun simctl boot ${this.udid}' command has returned non-zero code. The problem was: ${err.stderr}`);
      }
    };

    const waitForShutdown = async (waitMs = SIMULATOR_SHUTDOWN_TIMEOUT) => {
      try {
        await (0, _asyncbox.waitForCondition)(async () => {
          const {
            state
          } = await this.stat();
          return state === 'Shutdown';
        }, {
          waitMs,
          intervalMs: 500
        });
      } catch (err) {
        throw new Error(`Simulator is not in 'Shutdown' state after ${waitMs}ms`);
      }
    };

    const startTime = process.hrtime();
    const shouldWaitForBoot = await startupLock.acquire(this.uiClientBundleId, async () => {
      const {
        state: serverState
      } = await this.stat();
      const isServerRunning = serverState === 'Booted';
      const uiClientPid = await this.getUIClientPid();

      if (opts.isHeadless) {
        if (isServerRunning && !uiClientPid) {
          _logger.default.info(`Simulator with UDID ${this.udid} is already booted in headless mode.`);

          return false;
        }

        if (await this.killUIClient({
          pid: uiClientPid
        })) {
          _logger.default.info(`Detected the Simulator UI client was running and killed it. Verifying the current Simulator state...`);
        }

        try {
          await waitForShutdown(3000);
        } catch (e) {
          const {
            state
          } = await this.stat();

          if (state !== 'Booted') {
            throw new Error(`Simulator with UDID ${this.udid} cannot be transitioned to headless mode. ` + `The recent state is '${state}'`);
          }

          return false;
        }

        _logger.default.info(`Booting Simulator with UDID ${this.udid} in headless mode. All UI-related capabilities are going to be ignored`);

        await bootSimulator();
      } else {
        if (isServerRunning && uiClientPid) {
          _logger.default.info(`Both Simulator with UDID ${this.udid} and the UI client are currently running`);

          return false;
        }

        if (!['Shutdown', 'Booted'].includes(serverState)) {
          if (serverState !== 'Shutting Down') {
            _logger.default.info(`Simulator ${this.udid} is in '${serverState}' state. Trying to shutdown...`);

            try {
              await this.shutdown();
            } catch (err) {
              _logger.default.warn(`Error on Simulator shutdown: ${err.message}`);
            }
          }

          await waitForShutdown();
        }

        _logger.default.info(`Booting Simulator with UDID ${this.udid}...`);

        await bootSimulator();

        if (!uiClientPid) {
          await this.startUIClient(opts);
        }
      }

      return true;
    });

    if (shouldWaitForBoot) {
      await this.waitForBoot(opts.startupTimeout);

      _logger.default.info(`Simulator with UDID ${this.udid} booted in ${process.hrtime(startTime)[0]} seconds`);
    }
  }

  verifyDevicePreferences(prefs = {}) {
    if (_lodash.default.isEmpty(prefs)) {
      return;
    }

    if (!_lodash.default.isUndefined(prefs.SimulatorWindowLastScale)) {
      if (!_lodash.default.isNumber(prefs.SimulatorWindowLastScale) || prefs.SimulatorWindowLastScale <= 0) {
        _logger.default.errorAndThrow(`SimulatorWindowLastScale is expected to be a positive float value. ` + `'${prefs.SimulatorWindowLastScale}' is assigned instead.`);
      }
    }

    if (!_lodash.default.isUndefined(prefs.SimulatorWindowCenter)) {
      const verificationPattern = /{-?\d+(\.\d+)?,-?\d+(\.\d+)?}/;

      if (!_lodash.default.isString(prefs.SimulatorWindowCenter) || !verificationPattern.test(prefs.SimulatorWindowCenter)) {
        _logger.default.errorAndThrow(`SimulatorWindowCenter is expected to match "{floatXPosition,floatYPosition}" format (without spaces). ` + `'${prefs.SimulatorWindowCenter}' is assigned instead.`);
      }
    }

    if (!_lodash.default.isUndefined(prefs.SimulatorWindowOrientation)) {
      const acceptableValues = ['Portrait', 'LandscapeLeft', 'PortraitUpsideDown', 'LandscapeRight'];

      if (acceptableValues.indexOf(prefs.SimulatorWindowOrientation) === -1) {
        _logger.default.errorAndThrow(`SimulatorWindowOrientation is expected to be one of ${acceptableValues}. ` + `'${prefs.SimulatorWindowOrientation}' is assigned instead.`);
      }
    }

    if (!_lodash.default.isUndefined(prefs.SimulatorWindowRotationAngle)) {
      if (!_lodash.default.isNumber(prefs.SimulatorWindowRotationAngle)) {
        _logger.default.errorAndThrow(`SimulatorWindowRotationAngle is expected to be a valid number. ` + `'${prefs.SimulatorWindowRotationAngle}' is assigned instead.`);
      }
    }
  }

  async updatePreferences(devicePrefs = {}, commonPrefs = {}) {
    if (!_lodash.default.isEmpty(devicePrefs)) {
      _logger.default.debug(`Setting preferences of ${this.udid} Simulator to ${JSON.stringify(devicePrefs)}`);
    }

    if (!_lodash.default.isEmpty(commonPrefs)) {
      _logger.default.debug(`Setting common Simulator preferences to ${JSON.stringify(commonPrefs)}`);
    }

    const homeFolderPath = process.env.HOME;

    if (!homeFolderPath) {
      _logger.default.warn(`Cannot get the path to HOME folder from the process environment. ` + `Ignoring Simulator preferences update.`);

      return false;
    }

    this.verifyDevicePreferences(devicePrefs);

    const plistPath = _path.default.resolve(homeFolderPath, 'Library', 'Preferences', 'com.apple.iphonesimulator.plist');

    if (!(await _appiumSupport.fs.hasAccess(plistPath))) {
      _logger.default.warn(`Simulator preferences file '${plistPath}' is not accessible. ` + `Ignoring Simulator preferences update.`);

      return false;
    }

    let newPrefs = {};

    if (!_lodash.default.isEmpty(devicePrefs)) {
      newPrefs.DevicePreferences = {
        [this.udid.toUpperCase()]: devicePrefs
      };
    }

    newPrefs = _lodash.default.merge(newPrefs, commonPrefs);
    return await preferencesPlistGuard.acquire(SimulatorXcode9.name, async () => {
      try {
        const currentPlistContent = await _appiumSupport.plist.parsePlistFile(plistPath);
        await _appiumSupport.plist.updatePlistFile(plistPath, _lodash.default.merge(currentPlistContent, newPrefs), true);

        _logger.default.debug(`Updated ${this.udid} Simulator preferences at '${plistPath}' with ${JSON.stringify(newPrefs)}`);

        return true;
      } catch (e) {
        _logger.default.warn(`Cannot update ${this.udid} Simulator preferences at '${plistPath}'. ` + `Try to delete the file manually in order to reset it. Original error: ${e.message}`);

        return false;
      }
    });
  }

  async shutdown() {
    const {
      state
    } = await this.stat();

    if (state === 'Shutdown') {
      return;
    }

    await (0, _asyncbox.retryInterval)(5, 500, _nodeSimctl.shutdown, this.udid);
  }

  async clean() {
    _logger.default.info(`Cleaning simulator ${this.udid}`);

    await (0, _nodeSimctl.eraseDevice)(this.udid, 10000);
  }

  async _activateWindow() {
    if (this.idb) {
      return await this.idb.focusSimulator();
    }

    _logger.default.warn(`Cannot focus Simulator window with idb. Defaulting to AppleScript`);

    const {
      name,
      sdk
    } = await this.stat();
    return `
      tell application "System Events"
        tell process "Simulator"
          set frontmost to false
          set frontmost to true
          click (menu item 1 where (its name contains "${name} " and its name contains "${sdk}")) of menu 1 of menu bar item "Window" of menu bar 1
        end tell
      end tell
    `;
  }

  async isBiometricEnrolled() {
    const {
      stdout
    } = await (0, _nodeSimctl.spawn)(this.udid, ['notifyutil', '-g', ENROLLMENT_NOTIFICATION_RECEIVER]);
    const match = new RegExp(`${_lodash.default.escapeRegExp(ENROLLMENT_NOTIFICATION_RECEIVER)}\\s+([01])`).exec(stdout);

    if (!match) {
      throw new Error(`Cannot parse biometric enrollment state from '${stdout}'`);
    }

    _logger.default.info(`Current biometric enrolled state for ${this.udid} Simulator: ${match[1]}`);

    return match[1] === '1';
  }

  async enrollBiometric(isEnabled = true) {
    _logger.default.debug(`Setting biometric enrolled state for ${this.udid} Simulator to '${isEnabled ? 'enabled' : 'disabled'}'`);

    await (0, _nodeSimctl.spawn)(this.udid, ['notifyutil', '-s', ENROLLMENT_NOTIFICATION_RECEIVER, isEnabled ? '1' : '0']);
    await (0, _nodeSimctl.spawn)(this.udid, ['notifyutil', '-p', ENROLLMENT_NOTIFICATION_RECEIVER]);

    if ((await this.isBiometricEnrolled()) !== isEnabled) {
      throw new Error(`Cannot set biometric enrolled state for ${this.udid} Simulator to '${isEnabled ? 'enabled' : 'disabled'}'`);
    }
  }

  async sendBiometricMatch(shouldMatch = true, biometricName = 'touchId') {
    const domainComponent = (0, _utils.toBiometricDomainComponent)(biometricName);
    const domain = `com.apple.BiometricKit_Sim.${domainComponent}.${shouldMatch ? '' : 'no'}match`;
    await (0, _nodeSimctl.spawn)(this.udid, ['notifyutil', '-p', domain]);

    _logger.default.info(`Sent notification ${domain} to ${shouldMatch ? 'match' : 'not match'} ${biometricName} biometric ` + `for ${this.udid} Simulator`);
  }

  async getLaunchDaemonsRoot() {
    const devRoot = await (0, _utils.getDeveloperRoot)();
    return _path.default.resolve(devRoot, 'Platforms/iPhoneOS.platform/Developer/Library/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot/System/Library/LaunchDaemons');
  }

}

var _default = SimulatorXcode9;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zaW11bGF0b3IteGNvZGUtOS5qcyJdLCJuYW1lcyI6WyJTSU1VTEFUT1JfU0hVVERPV05fVElNRU9VVCIsInN0YXJ0dXBMb2NrIiwiQXN5bmNMb2NrIiwicHJlZmVyZW5jZXNQbGlzdEd1YXJkIiwiRU5ST0xMTUVOVF9OT1RJRklDQVRJT05fUkVDRUlWRVIiLCJTaW11bGF0b3JYY29kZTkiLCJTaW11bGF0b3JYY29kZTgiLCJjb25zdHJ1Y3RvciIsInVkaWQiLCJ4Y29kZVZlcnNpb24iLCJydW4iLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwiZGV2aWNlUHJlZmVyZW5jZXMiLCJpc0hlYWRsZXNzIiwic3RhcnR1cFRpbWVvdXQiLCJzY2FsZUZhY3RvciIsIlNpbXVsYXRvcldpbmRvd0xhc3RTY2FsZSIsInBhcnNlRmxvYXQiLCJjb21tb25QcmVmZXJlbmNlcyIsIlJvdGF0ZVdpbmRvd1doZW5TaWduYWxlZEJ5R3Vlc3QiLCJfIiwiaXNCb29sZWFuIiwiY29ubmVjdEhhcmR3YXJlS2V5Ym9hcmQiLCJDb25uZWN0SGFyZHdhcmVLZXlib2FyZCIsImlzRW1wdHkiLCJ1cGRhdGVQcmVmZXJlbmNlcyIsImJvb3RTaW11bGF0b3IiLCJlcnIiLCJsb2ciLCJ3YXJuIiwic3RkZXJyIiwid2FpdEZvclNodXRkb3duIiwid2FpdE1zIiwic3RhdGUiLCJzdGF0IiwiaW50ZXJ2YWxNcyIsIkVycm9yIiwic3RhcnRUaW1lIiwicHJvY2VzcyIsImhydGltZSIsInNob3VsZFdhaXRGb3JCb290IiwiYWNxdWlyZSIsInVpQ2xpZW50QnVuZGxlSWQiLCJzZXJ2ZXJTdGF0ZSIsImlzU2VydmVyUnVubmluZyIsInVpQ2xpZW50UGlkIiwiZ2V0VUlDbGllbnRQaWQiLCJpbmZvIiwia2lsbFVJQ2xpZW50IiwicGlkIiwiZSIsImluY2x1ZGVzIiwic2h1dGRvd24iLCJtZXNzYWdlIiwic3RhcnRVSUNsaWVudCIsIndhaXRGb3JCb290IiwidmVyaWZ5RGV2aWNlUHJlZmVyZW5jZXMiLCJwcmVmcyIsImlzVW5kZWZpbmVkIiwiaXNOdW1iZXIiLCJlcnJvckFuZFRocm93IiwiU2ltdWxhdG9yV2luZG93Q2VudGVyIiwidmVyaWZpY2F0aW9uUGF0dGVybiIsImlzU3RyaW5nIiwidGVzdCIsIlNpbXVsYXRvcldpbmRvd09yaWVudGF0aW9uIiwiYWNjZXB0YWJsZVZhbHVlcyIsImluZGV4T2YiLCJTaW11bGF0b3JXaW5kb3dSb3RhdGlvbkFuZ2xlIiwiZGV2aWNlUHJlZnMiLCJjb21tb25QcmVmcyIsImRlYnVnIiwiSlNPTiIsInN0cmluZ2lmeSIsImhvbWVGb2xkZXJQYXRoIiwiZW52IiwiSE9NRSIsInBsaXN0UGF0aCIsInBhdGgiLCJyZXNvbHZlIiwiZnMiLCJoYXNBY2Nlc3MiLCJuZXdQcmVmcyIsIkRldmljZVByZWZlcmVuY2VzIiwidG9VcHBlckNhc2UiLCJtZXJnZSIsIm5hbWUiLCJjdXJyZW50UGxpc3RDb250ZW50IiwicGxpc3QiLCJwYXJzZVBsaXN0RmlsZSIsInVwZGF0ZVBsaXN0RmlsZSIsInNpbWN0bFNodXRkb3duIiwiY2xlYW4iLCJfYWN0aXZhdGVXaW5kb3ciLCJpZGIiLCJmb2N1c1NpbXVsYXRvciIsInNkayIsImlzQmlvbWV0cmljRW5yb2xsZWQiLCJzdGRvdXQiLCJtYXRjaCIsIlJlZ0V4cCIsImVzY2FwZVJlZ0V4cCIsImV4ZWMiLCJlbnJvbGxCaW9tZXRyaWMiLCJpc0VuYWJsZWQiLCJzZW5kQmlvbWV0cmljTWF0Y2giLCJzaG91bGRNYXRjaCIsImJpb21ldHJpY05hbWUiLCJkb21haW5Db21wb25lbnQiLCJkb21haW4iLCJnZXRMYXVuY2hEYWVtb25zUm9vdCIsImRldlJvb3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsMEJBQTBCLEdBQUcsS0FBSyxJQUF4QztBQUNBLE1BQU1DLFdBQVcsR0FBRyxJQUFJQyxrQkFBSixFQUFwQjtBQUNB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SUFGcUIsRUFFZkosZ0NBRmUsRUFFbUJzRyxTQUFTLEdBQUcsR0FBSCxHQUFTLEdBRnJDLENBQWpCLENBQU47QUFJQSxVQUFNLHVCQUFNLEtBQUtsRyxJQUFYLEVBQWlCLENBQ3JCLFlBRHFCLEVBRXJCLElBRnFCLEVBRWZKLGdDQUZlLENBQWpCLENBQU47O0FBSUEsUUFBSSxPQUFNLEtBQUsrRixtQkFBTCxFQUFOLE1BQXFDTyxTQUF6QyxFQUFvRDtBQUNsRCxZQUFNLElBQUlwRSxLQUFKLENBQVcsMkNBQTBDLEtBQUs5QixJQUFLLGtCQUFpQmtHLFNBQVMsR0FBRyxTQUFILEdBQWUsVUFBVyxHQUFuSCxDQUFOO0FBQ0Q7QUFDRjs7QUFVRCxRQUFNQyxrQkFBTixDQUEwQkMsV0FBVyxHQUFHLElBQXhDLEVBQThDQyxhQUFhLEdBQUcsU0FBOUQsRUFBeUU7QUFDdkUsVUFBTUMsZUFBZSxHQUFHLHVDQUEyQkQsYUFBM0IsQ0FBeEI7QUFDQSxVQUFNRSxNQUFNLEdBQUksOEJBQTZCRCxlQUFnQixJQUFHRixXQUFXLEdBQUcsRUFBSCxHQUFRLElBQUssT0FBeEY7QUFDQSxVQUFNLHVCQUFNLEtBQUtwRyxJQUFYLEVBQWlCLENBQ3JCLFlBRHFCLEVBRXJCLElBRnFCLEVBRWZ1RyxNQUZlLENBQWpCLENBQU47O0FBSUFqRixvQkFBSW1CLElBQUosQ0FBVSxxQkFBb0I4RCxNQUFPLE9BQU1ILFdBQVcsR0FBRyxPQUFILEdBQWEsV0FBWSxJQUFHQyxhQUFjLGFBQXZGLEdBQ04sT0FBTSxLQUFLckcsSUFBSyxZQURuQjtBQUVEOztBQUtELFFBQU13RyxvQkFBTixHQUE4QjtBQUM1QixVQUFNQyxPQUFPLEdBQUcsTUFBTSw4QkFBdEI7QUFDQSxXQUFPakMsY0FBS0MsT0FBTCxDQUFhZ0MsT0FBYixFQUNMLDBKQURLLENBQVA7QUFFRDs7QUFwVjJDOztlQXdWL0I1RyxlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFNpbXVsYXRvclhjb2RlOCBmcm9tICcuL3NpbXVsYXRvci14Y29kZS04JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBwbGlzdCB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCBBc3luY0xvY2sgZnJvbSAnYXN5bmMtbG9jayc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHNodXRkb3duIGFzIHNpbWN0bFNodXRkb3duLCBib290RGV2aWNlLCBlcmFzZURldmljZSwgc3Bhd24gfSBmcm9tICdub2RlLXNpbWN0bCc7XG5pbXBvcnQgeyB3YWl0Rm9yQ29uZGl0aW9uLCByZXRyeUludGVydmFsIH0gZnJvbSAnYXN5bmNib3gnO1xuaW1wb3J0IHsgdG9CaW9tZXRyaWNEb21haW5Db21wb25lbnQsIGdldERldmVsb3BlclJvb3QgfSBmcm9tICcuL3V0aWxzLmpzJztcblxuY29uc3QgU0lNVUxBVE9SX1NIVVRET1dOX1RJTUVPVVQgPSAxNSAqIDEwMDA7XG5jb25zdCBzdGFydHVwTG9jayA9IG5ldyBBc3luY0xvY2soKTtcbmNvbnN0IHByZWZlcmVuY2VzUGxpc3RHdWFyZCA9IG5ldyBBc3luY0xvY2soKTtcbmNvbnN0IEVOUk9MTE1FTlRfTk9USUZJQ0FUSU9OX1JFQ0VJVkVSID0gJ2NvbS5hcHBsZS5CaW9tZXRyaWNLaXQuZW5yb2xsbWVudENoYW5nZWQnO1xuXG5jbGFzcyBTaW11bGF0b3JYY29kZTkgZXh0ZW5kcyBTaW11bGF0b3JYY29kZTgge1xuICBjb25zdHJ1Y3RvciAodWRpZCwgeGNvZGVWZXJzaW9uKSB7XG4gICAgc3VwZXIodWRpZCwgeGNvZGVWZXJzaW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBEZXZpY2VQcmVmZXJlbmNlc1xuICAgKiBAcHJvcGVydHkgez9udW1iZXJ9IFNpbXVsYXRvckV4dGVybmFsRGlzcGxheSAtIFRCRC4gRXhhbXBsZSB2YWx1ZTogMi4xMTRcbiAgICogQHByb3BlcnR5IHs/c3RyaW5nfSBDaHJvbWVUaW50IC0gVEJELiBFeGFtcGxlIHZhbHVlOiAnJ1xuICAgKiBAcHJvcGVydHkgez9udW1iZXJ9IFNpbXVsYXRvcldpbmRvd0xhc3RTY2FsZSAtIFNjYWxlIHZhbHVlIGZvciB0aGUgcGFydGljdWxhciBTaW11bGF0b3Igd2luZG93LlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEuMCBtZWFucyAxMDAlIHNjYWxlLlxuICAgKiBAcHJvcGVydHkgez9zdHJpbmd9IFNpbXVsYXRvcldpbmRvd09yaWVudGF0aW9uIC0gU2ltdWxhdG9yIHdpbmRvdyBvcmllbnRhdGlvbi4gUG9zc2libGUgdmFsdWVzIGFyZTpcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQb3J0cmFpdCcsICdMYW5kc2NhcGVMZWZ0JywgJ1BvcnRyYWl0VXBzaWRlRG93bicgYW5kICdMYW5kc2NhcGVSaWdodCcuXG4gICAqIEBwcm9wZXJ0eSB7P251bWJlcn0gU2ltdWxhdG9yV2luZG93Um90YXRpb25BbmdsZSAtIFdpbmRvdyByb3RhdGlvbiBhbmdsZS4gVGhpcyB2YWx1ZSBpcyBleHBlY3RlZCB0byBiZSBpbiBzeW5jXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGggX1NpbXVsYXRvcldpbmRvd09yaWVudGF0aW9uXy4gVGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzIGFyZTpcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCwgOTAsIDE4MCBhbmQgMjcwLlxuICAgKiBAcHJvcGVydHkgez9zdHJpbmd9IFNpbXVsYXRvcldpbmRvd0NlbnRlciAtIFRoZSBjb29yZGluYXRlcyBvZiBTaW11bGF0b3IncyB3aW5kb3cgY2VudGVyIGluIHBpeGVscyxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgZXhhbXBsZSAney0xMjk0LjUsIDc3NS41fScuXG4gICAqIEBwcm9wZXJ0eSB7P2Jvb2xlYW59IENvbm5lY3RIYXJkd2FyZUtleWJvYXJkIC0gRXF1YWxzIHRvIDEgaWYgaGFyZHdhcmUga2V5Ym9hcmQgc2hvdWxkIGJlIGNvbm5lY3RlZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPdGhlcndpc2UgMC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IENvbW1vblByZWZlcmVuY2VzXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gQ29ubmVjdEhhcmR3YXJlS2V5Ym9hcmQgLSBXaGV0aGVyIHRvIGNvbm5lY3QgaGFyZHdhcmUga2V5Ym9hcmRcbiAgICovXG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGdpdmVuIFNpbXVsYXRvciB3aXRoIG9wdGlvbnMuIFRoZSBTaW11bGF0b3Igd2lsbCBub3QgYmUgcmVzdGFydGVkIGlmXG4gICAqIGl0IGlzIGFscmVhZHkgcnVubmluZyBhbmQgdGhlIGN1cnJlbnQgVUkgc3RhdGUgbWF0Y2hlcyB0byBgaXNIZWFkbGVzc2Agb3B0aW9uLlxuICAgKiBAb3ZlcnJpZGVcbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBPbmUgb3IgbW9yZSBvZiBhdmFpbGFibGUgU2ltdWxhdG9yIG9wdGlvbnM6XG4gICAqICAgLSB7c3RyaW5nfSBzY2FsZUZhY3RvcjogQW55IHBvc2l0aXZlIGZsb2F0IHZhbHVlLiAxLjAgbWVhbnMgMToxIHNjYWxlLlxuICAgKiAgIERlZmluZXMgdGhlIHdpbmRvdyBzY2FsZSB2YWx1ZSBmb3IgdGhlIFVJIGNsaWVudCB3aW5kb3cgZm9yIHRoZSBjdXJyZW50IFNpbXVsYXRvci5cbiAgICogICBFcXVhbHMgdG8gYG51bGxgIGJ5IGRlZmF1bHQsIHdoaWNoIGtlZXBzIHRoZSBjdXJyZW50IHNjYWxlIHVuY2hhbmdlZC5cbiAgICogICAtIHtib29sZWFufSBjb25uZWN0SGFyZHdhcmVLZXlib2FyZDogd2hldGhlciB0byBjb25uZWN0IHRoZSBoYXJkd2FyZSBrZXlib2FyZCB0byB0aGVcbiAgICogICBTaW11bGF0b3IgVUkgY2xpZW50LiBFcXVhbHMgdG8gYGZhbHNlYCBieSBkZWZhdWx0LlxuICAgKiAgIC0ge251bWJlcn0gc3RhcnR1cFRpbWVvdXQ6IG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCB1bnRpbCBTaW11bGF0b3IgYm9vdGluZ1xuICAgKiAgIHByb2Nlc3MgaXMgY29tcGxldGVkLiBUaGUgZGVmYXVsdCB0aW1lb3V0IHdpbGwgYmUgdXNlZCBpZiBub3Qgc2V0IGV4cGxpY2l0bHkuXG4gICAqICAgLSB7Ym9vbGVhbn0gaXNIZWFkbGVzczogd2hldGhlciB0byBzdGFydCB0aGUgU2ltdWxhdG9yIGluIGhlYWRsZXNzIG1vZGUgKHdpdGggVUlcbiAgICogICBjbGllbnQgaW52aXNpYmxlKS4gYGZhbHNlYCBieSBkZWZhdWx0LlxuICAgKiAgIC0ge0RldmljZVByZWZlcmVuY2VzfSBkZXZpY2VQcmVmZXJlbmNlczogcHJlZmVyZW5jZXMgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgU2ltdWxhdG9yXG4gICAqICAgZGV2aWNlXG4gICAqL1xuICBhc3luYyBydW4gKG9wdHMgPSB7fSkge1xuICAgIG9wdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGRldmljZVByZWZlcmVuY2VzOiB7fSxcbiAgICAgIGlzSGVhZGxlc3M6IGZhbHNlLFxuICAgICAgc3RhcnR1cFRpbWVvdXQ6IHRoaXMuc3RhcnR1cFRpbWVvdXQsXG4gICAgfSwgb3B0cyk7XG4gICAgaWYgKG9wdHMuc2NhbGVGYWN0b3IpIHtcbiAgICAgIG9wdHMuZGV2aWNlUHJlZmVyZW5jZXMuU2ltdWxhdG9yV2luZG93TGFzdFNjYWxlID0gcGFyc2VGbG9hdChvcHRzLnNjYWxlRmFjdG9yKTtcbiAgICB9XG4gICAgLy8gVGhpcyBvcHRpb24gaXMgbmVjZXNzYXJ5IHRvIG1ha2UgdGhlIFNpbXVsYXRvciB3aW5kb3cgZm9sbG93XG4gICAgLy8gdGhlIGFjdHVhbCBYQ1VJRGV2aWNlIG9yaWVudGF0aW9uXG4gICAgY29uc3QgY29tbW9uUHJlZmVyZW5jZXMgPSB7XG4gICAgICBSb3RhdGVXaW5kb3dXaGVuU2lnbmFsZWRCeUd1ZXN0OiB0cnVlXG4gICAgfTtcbiAgICBpZiAoXy5pc0Jvb2xlYW4ob3B0cy5jb25uZWN0SGFyZHdhcmVLZXlib2FyZCkpIHtcbiAgICAgIG9wdHMuZGV2aWNlUHJlZmVyZW5jZXMuQ29ubmVjdEhhcmR3YXJlS2V5Ym9hcmQgPSBvcHRzLmNvbm5lY3RIYXJkd2FyZUtleWJvYXJkO1xuICAgICAgY29tbW9uUHJlZmVyZW5jZXMuQ29ubmVjdEhhcmR3YXJlS2V5Ym9hcmQgPSBvcHRzLmNvbm5lY3RIYXJkd2FyZUtleWJvYXJkO1xuICAgIH1cbiAgICBpZiAoIV8uaXNFbXB0eShvcHRzLmRldmljZVByZWZlcmVuY2VzKSB8fCAhXy5pc0VtcHR5KGNvbW1vblByZWZlcmVuY2VzKSkge1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVQcmVmZXJlbmNlcyhvcHRzLmRldmljZVByZWZlcmVuY2VzLCBjb21tb25QcmVmZXJlbmNlcyk7XG4gICAgfVxuICAgIGNvbnN0IGJvb3RTaW11bGF0b3IgPSBhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZXRyeUludGVydmFsKDMsIDIwMDAsIGFzeW5jICgpID0+IGF3YWl0IGJvb3REZXZpY2UodGhpcy51ZGlkKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLndhcm4oYCd4Y3J1biBzaW1jdGwgYm9vdCAke3RoaXMudWRpZH0nIGNvbW1hbmQgaGFzIHJldHVybmVkIG5vbi16ZXJvIGNvZGUuIFRoZSBwcm9ibGVtIHdhczogJHtlcnIuc3RkZXJyfWApO1xuICAgICAgfVxuICAgIH07XG4gICAgY29uc3Qgd2FpdEZvclNodXRkb3duID0gYXN5bmMgKHdhaXRNcyA9IFNJTVVMQVRPUl9TSFVURE9XTl9USU1FT1VUKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB3YWl0Rm9yQ29uZGl0aW9uKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCB7c3RhdGV9ID0gYXdhaXQgdGhpcy5zdGF0KCk7XG4gICAgICAgICAgcmV0dXJuIHN0YXRlID09PSAnU2h1dGRvd24nO1xuICAgICAgICB9LCB7d2FpdE1zLCBpbnRlcnZhbE1zOiA1MDB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNpbXVsYXRvciBpcyBub3QgaW4gJ1NodXRkb3duJyBzdGF0ZSBhZnRlciAke3dhaXRNc31tc2ApO1xuICAgICAgfVxuICAgIH07XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgICBjb25zdCBzaG91bGRXYWl0Rm9yQm9vdCA9IGF3YWl0IHN0YXJ0dXBMb2NrLmFjcXVpcmUodGhpcy51aUNsaWVudEJ1bmRsZUlkLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB7c3RhdGU6IHNlcnZlclN0YXRlfSA9IGF3YWl0IHRoaXMuc3RhdCgpO1xuICAgICAgY29uc3QgaXNTZXJ2ZXJSdW5uaW5nID0gc2VydmVyU3RhdGUgPT09ICdCb290ZWQnO1xuICAgICAgY29uc3QgdWlDbGllbnRQaWQgPSBhd2FpdCB0aGlzLmdldFVJQ2xpZW50UGlkKCk7XG4gICAgICBpZiAob3B0cy5pc0hlYWRsZXNzKSB7XG4gICAgICAgIGlmIChpc1NlcnZlclJ1bm5pbmcgJiYgIXVpQ2xpZW50UGlkKSB7XG4gICAgICAgICAgbG9nLmluZm8oYFNpbXVsYXRvciB3aXRoIFVESUQgJHt0aGlzLnVkaWR9IGlzIGFscmVhZHkgYm9vdGVkIGluIGhlYWRsZXNzIG1vZGUuYCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhd2FpdCB0aGlzLmtpbGxVSUNsaWVudCh7cGlkOiB1aUNsaWVudFBpZH0pKSB7XG4gICAgICAgICAgbG9nLmluZm8oYERldGVjdGVkIHRoZSBTaW11bGF0b3IgVUkgY2xpZW50IHdhcyBydW5uaW5nIGFuZCBraWxsZWQgaXQuIFZlcmlmeWluZyB0aGUgY3VycmVudCBTaW11bGF0b3Igc3RhdGUuLi5gKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFN0b3BwaW5nIHRoZSBVSSBjbGllbnQga2lsbHMgYWxsIHJ1bm5pbmcgc2VydmVycyBmb3Igc29tZSBlYXJseSBYQ29kZSB2ZXJzaW9ucy4gVGhpcyBpcyBhIGtub3duIGJ1Z1xuICAgICAgICAgIGF3YWl0IHdhaXRGb3JTaHV0ZG93bigzMDAwKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnN0IHtzdGF0ZX0gPSBhd2FpdCB0aGlzLnN0YXQoKTtcbiAgICAgICAgICBpZiAoc3RhdGUgIT09ICdCb290ZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFNpbXVsYXRvciB3aXRoIFVESUQgJHt0aGlzLnVkaWR9IGNhbm5vdCBiZSB0cmFuc2l0aW9uZWQgdG8gaGVhZGxlc3MgbW9kZS4gYCArXG4gICAgICAgICAgICAgIGBUaGUgcmVjZW50IHN0YXRlIGlzICcke3N0YXRlfSdgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxvZy5pbmZvKGBCb290aW5nIFNpbXVsYXRvciB3aXRoIFVESUQgJHt0aGlzLnVkaWR9IGluIGhlYWRsZXNzIG1vZGUuIEFsbCBVSS1yZWxhdGVkIGNhcGFiaWxpdGllcyBhcmUgZ29pbmcgdG8gYmUgaWdub3JlZGApO1xuICAgICAgICBhd2FpdCBib290U2ltdWxhdG9yKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNTZXJ2ZXJSdW5uaW5nICYmIHVpQ2xpZW50UGlkKSB7XG4gICAgICAgICAgbG9nLmluZm8oYEJvdGggU2ltdWxhdG9yIHdpdGggVURJRCAke3RoaXMudWRpZH0gYW5kIHRoZSBVSSBjbGllbnQgYXJlIGN1cnJlbnRseSBydW5uaW5nYCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghWydTaHV0ZG93bicsICdCb290ZWQnXS5pbmNsdWRlcyhzZXJ2ZXJTdGF0ZSkpIHtcbiAgICAgICAgICBpZiAoc2VydmVyU3RhdGUgIT09ICdTaHV0dGluZyBEb3duJykge1xuICAgICAgICAgICAgbG9nLmluZm8oYFNpbXVsYXRvciAke3RoaXMudWRpZH0gaXMgaW4gJyR7c2VydmVyU3RhdGV9JyBzdGF0ZS4gVHJ5aW5nIHRvIHNodXRkb3duLi4uYCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNodXRkb3duKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgbG9nLndhcm4oYEVycm9yIG9uIFNpbXVsYXRvciBzaHV0ZG93bjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgd2FpdEZvclNodXRkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nLmluZm8oYEJvb3RpbmcgU2ltdWxhdG9yIHdpdGggVURJRCAke3RoaXMudWRpZH0uLi5gKTtcbiAgICAgICAgYXdhaXQgYm9vdFNpbXVsYXRvcigpO1xuICAgICAgICBpZiAoIXVpQ2xpZW50UGlkKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zdGFydFVJQ2xpZW50KG9wdHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGlmIChzaG91bGRXYWl0Rm9yQm9vdCkge1xuICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yQm9vdChvcHRzLnN0YXJ0dXBUaW1lb3V0KTtcbiAgICAgIGxvZy5pbmZvKGBTaW11bGF0b3Igd2l0aCBVRElEICR7dGhpcy51ZGlkfSBib290ZWQgaW4gJHtwcm9jZXNzLmhydGltZShzdGFydFRpbWUpWzBdfSBzZWNvbmRzYCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gdmVyaWZpY2F0aW9uIG9mIGRldmljZSBwcmVmZXJlbmNlcyBjb3JyZWN0bmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHtEZXZpY2VQcmVmZXJlbmNlc30gcHJlZnMgW3t9XSAtIFRoZSBwcmVmZXJlbmNlcyB0byBiZSB2ZXJpZmllZFxuICAgKiBAdGhyb3dzIHtFcnJvcn0gSWYgYW55IG9mIHRoZSBnaXZlbiBwcmVmZXJlbmNlIHZhbHVlcyBkb2VzIG5vdCBtYXRjaCB0aGUgZXhwZWN0ZWRcbiAgICogZm9ybWF0LlxuICAgKi9cbiAgdmVyaWZ5RGV2aWNlUHJlZmVyZW5jZXMgKHByZWZzID0ge30pIHtcbiAgICBpZiAoXy5pc0VtcHR5KHByZWZzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghXy5pc1VuZGVmaW5lZChwcmVmcy5TaW11bGF0b3JXaW5kb3dMYXN0U2NhbGUpKSB7XG4gICAgICBpZiAoIV8uaXNOdW1iZXIocHJlZnMuU2ltdWxhdG9yV2luZG93TGFzdFNjYWxlKSB8fCBwcmVmcy5TaW11bGF0b3JXaW5kb3dMYXN0U2NhbGUgPD0gMCkge1xuICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgU2ltdWxhdG9yV2luZG93TGFzdFNjYWxlIGlzIGV4cGVjdGVkIHRvIGJlIGEgcG9zaXRpdmUgZmxvYXQgdmFsdWUuIGAgK1xuICAgICAgICAgIGAnJHtwcmVmcy5TaW11bGF0b3JXaW5kb3dMYXN0U2NhbGV9JyBpcyBhc3NpZ25lZCBpbnN0ZWFkLmApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghXy5pc1VuZGVmaW5lZChwcmVmcy5TaW11bGF0b3JXaW5kb3dDZW50ZXIpKSB7XG4gICAgICAvLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yLzJaWE9pai8yXG4gICAgICBjb25zdCB2ZXJpZmljYXRpb25QYXR0ZXJuID0gL3stP1xcZCsoXFwuXFxkKyk/LC0/XFxkKyhcXC5cXGQrKT99LztcbiAgICAgIGlmICghXy5pc1N0cmluZyhwcmVmcy5TaW11bGF0b3JXaW5kb3dDZW50ZXIpIHx8ICF2ZXJpZmljYXRpb25QYXR0ZXJuLnRlc3QocHJlZnMuU2ltdWxhdG9yV2luZG93Q2VudGVyKSkge1xuICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgU2ltdWxhdG9yV2luZG93Q2VudGVyIGlzIGV4cGVjdGVkIHRvIG1hdGNoIFwie2Zsb2F0WFBvc2l0aW9uLGZsb2F0WVBvc2l0aW9ufVwiIGZvcm1hdCAod2l0aG91dCBzcGFjZXMpLiBgICtcbiAgICAgICAgICBgJyR7cHJlZnMuU2ltdWxhdG9yV2luZG93Q2VudGVyfScgaXMgYXNzaWduZWQgaW5zdGVhZC5gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQocHJlZnMuU2ltdWxhdG9yV2luZG93T3JpZW50YXRpb24pKSB7XG4gICAgICBjb25zdCBhY2NlcHRhYmxlVmFsdWVzID0gWydQb3J0cmFpdCcsICdMYW5kc2NhcGVMZWZ0JywgJ1BvcnRyYWl0VXBzaWRlRG93bicsICdMYW5kc2NhcGVSaWdodCddO1xuICAgICAgaWYgKGFjY2VwdGFibGVWYWx1ZXMuaW5kZXhPZihwcmVmcy5TaW11bGF0b3JXaW5kb3dPcmllbnRhdGlvbikgPT09IC0xKSB7XG4gICAgICAgIGxvZy5lcnJvckFuZFRocm93KGBTaW11bGF0b3JXaW5kb3dPcmllbnRhdGlvbiBpcyBleHBlY3RlZCB0byBiZSBvbmUgb2YgJHthY2NlcHRhYmxlVmFsdWVzfS4gYCArXG4gICAgICAgICAgYCcke3ByZWZzLlNpbXVsYXRvcldpbmRvd09yaWVudGF0aW9ufScgaXMgYXNzaWduZWQgaW5zdGVhZC5gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQocHJlZnMuU2ltdWxhdG9yV2luZG93Um90YXRpb25BbmdsZSkpIHtcbiAgICAgIGlmICghXy5pc051bWJlcihwcmVmcy5TaW11bGF0b3JXaW5kb3dSb3RhdGlvbkFuZ2xlKSkge1xuICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgU2ltdWxhdG9yV2luZG93Um90YXRpb25BbmdsZSBpcyBleHBlY3RlZCB0byBiZSBhIHZhbGlkIG51bWJlci4gYCArXG4gICAgICAgICAgYCcke3ByZWZzLlNpbXVsYXRvcldpbmRvd1JvdGF0aW9uQW5nbGV9JyBpcyBhc3NpZ25lZCBpbnN0ZWFkLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGNvbW1vbiBpT1MgU2ltdWxhdG9yIHByZWZlcmVuY2VzIGZpbGUgd2l0aCBuZXcgdmFsdWVzLlxuICAgKiBJdCBpcyBuZWNlc3NhcnkgdG8gcmVzdGFydCB0aGUgY29ycmVzcG9uZGluZyBTaW11bGF0b3IgYmVmb3JlXG4gICAqIHRoZXNlIGNoYW5nZXMgYXJlIGFwcGxpZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7RGV2aWNlUHJlZmVyZW5jZXN9IGRldmljZVByZWZzIFt7fV0gLSBUaGUgbWFwcGluZywgd2hpY2ggcmVwcmVzZW50cyBuZXcgZGV2aWNlIHByZWZlcmVuY2UgdmFsdWVzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdGhlIGdpdmVuIFNpbXVsYXRvci5cbiAgICogQHBhcmFtIHtDb21tb25QcmVmZXJlbmNlc30gY29tbW9uUHJlZnMgW3t9XSAtIFRoZSBtYXBwaW5nLCB3aGljaCByZXByZXNlbnRzIG5ldyBjb21tb24gcHJlZmVyZW5jZSB2YWx1ZXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhbGwgU2ltdWxhdG9ycy5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgcHJlZmVyZW5jZXMgd2VyZSBzdWNjZXNzZnVsbHkgdXBkYXRlZC5cbiAgICovXG4gIGFzeW5jIHVwZGF0ZVByZWZlcmVuY2VzIChkZXZpY2VQcmVmcyA9IHt9LCBjb21tb25QcmVmcyA9IHt9KSB7XG4gICAgaWYgKCFfLmlzRW1wdHkoZGV2aWNlUHJlZnMpKSB7XG4gICAgICBsb2cuZGVidWcoYFNldHRpbmcgcHJlZmVyZW5jZXMgb2YgJHt0aGlzLnVkaWR9IFNpbXVsYXRvciB0byAke0pTT04uc3RyaW5naWZ5KGRldmljZVByZWZzKX1gKTtcbiAgICB9XG4gICAgaWYgKCFfLmlzRW1wdHkoY29tbW9uUHJlZnMpKSB7XG4gICAgICBsb2cuZGVidWcoYFNldHRpbmcgY29tbW9uIFNpbXVsYXRvciBwcmVmZXJlbmNlcyB0byAke0pTT04uc3RyaW5naWZ5KGNvbW1vblByZWZzKX1gKTtcbiAgICB9XG4gICAgY29uc3QgaG9tZUZvbGRlclBhdGggPSBwcm9jZXNzLmVudi5IT01FO1xuICAgIGlmICghaG9tZUZvbGRlclBhdGgpIHtcbiAgICAgIGxvZy53YXJuKGBDYW5ub3QgZ2V0IHRoZSBwYXRoIHRvIEhPTUUgZm9sZGVyIGZyb20gdGhlIHByb2Nlc3MgZW52aXJvbm1lbnQuIGAgK1xuICAgICAgICBgSWdub3JpbmcgU2ltdWxhdG9yIHByZWZlcmVuY2VzIHVwZGF0ZS5gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy52ZXJpZnlEZXZpY2VQcmVmZXJlbmNlcyhkZXZpY2VQcmVmcyk7XG4gICAgY29uc3QgcGxpc3RQYXRoID0gcGF0aC5yZXNvbHZlKGhvbWVGb2xkZXJQYXRoLCAnTGlicmFyeScsICdQcmVmZXJlbmNlcycsICdjb20uYXBwbGUuaXBob25lc2ltdWxhdG9yLnBsaXN0Jyk7XG4gICAgaWYgKCFhd2FpdCBmcy5oYXNBY2Nlc3MocGxpc3RQYXRoKSkge1xuICAgICAgbG9nLndhcm4oYFNpbXVsYXRvciBwcmVmZXJlbmNlcyBmaWxlICcke3BsaXN0UGF0aH0nIGlzIG5vdCBhY2Nlc3NpYmxlLiBgICtcbiAgICAgICAgYElnbm9yaW5nIFNpbXVsYXRvciBwcmVmZXJlbmNlcyB1cGRhdGUuYCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBuZXdQcmVmcyA9IHt9O1xuICAgIGlmICghXy5pc0VtcHR5KGRldmljZVByZWZzKSkge1xuICAgICAgbmV3UHJlZnMuRGV2aWNlUHJlZmVyZW5jZXMgPSB7W3RoaXMudWRpZC50b1VwcGVyQ2FzZSgpXTogZGV2aWNlUHJlZnN9O1xuICAgIH1cbiAgICBuZXdQcmVmcyA9IF8ubWVyZ2UobmV3UHJlZnMsIGNvbW1vblByZWZzKTtcbiAgICByZXR1cm4gYXdhaXQgcHJlZmVyZW5jZXNQbGlzdEd1YXJkLmFjcXVpcmUoU2ltdWxhdG9yWGNvZGU5Lm5hbWUsIGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRQbGlzdENvbnRlbnQgPSBhd2FpdCBwbGlzdC5wYXJzZVBsaXN0RmlsZShwbGlzdFBhdGgpO1xuICAgICAgICBhd2FpdCBwbGlzdC51cGRhdGVQbGlzdEZpbGUocGxpc3RQYXRoLCBfLm1lcmdlKGN1cnJlbnRQbGlzdENvbnRlbnQsIG5ld1ByZWZzKSwgdHJ1ZSk7XG4gICAgICAgIGxvZy5kZWJ1ZyhgVXBkYXRlZCAke3RoaXMudWRpZH0gU2ltdWxhdG9yIHByZWZlcmVuY2VzIGF0ICcke3BsaXN0UGF0aH0nIHdpdGggJHtKU09OLnN0cmluZ2lmeShuZXdQcmVmcyl9YCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBsb2cud2FybihgQ2Fubm90IHVwZGF0ZSAke3RoaXMudWRpZH0gU2ltdWxhdG9yIHByZWZlcmVuY2VzIGF0ICcke3BsaXN0UGF0aH0nLiBgICtcbiAgICAgICAgICAgICAgICAgYFRyeSB0byBkZWxldGUgdGhlIGZpbGUgbWFudWFsbHkgaW4gb3JkZXIgdG8gcmVzZXQgaXQuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY3VycmVudCBTaW11bGF0b3IuXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYXN5bmMgc2h1dGRvd24gKCkge1xuICAgIGNvbnN0IHtzdGF0ZX0gPSBhd2FpdCB0aGlzLnN0YXQoKTtcbiAgICBpZiAoc3RhdGUgPT09ICdTaHV0ZG93bicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgcmV0cnlJbnRlcnZhbCg1LCA1MDAsIHNpbWN0bFNodXRkb3duLCB0aGlzLnVkaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBjdXJyZW50IFNpbXVsYXRvciB0byB0aGUgY2xlYW4gc3RhdGUuXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYXN5bmMgY2xlYW4gKCkge1xuICAgIGxvZy5pbmZvKGBDbGVhbmluZyBzaW11bGF0b3IgJHt0aGlzLnVkaWR9YCk7XG4gICAgYXdhaXQgZXJhc2VEZXZpY2UodGhpcy51ZGlkLCAxMDAwMCk7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICogQG92ZXJyaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhc3luYyBfYWN0aXZhdGVXaW5kb3cgKCkge1xuICAgIGlmICh0aGlzLmlkYikge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaWRiLmZvY3VzU2ltdWxhdG9yKCk7XG4gICAgfVxuICAgIGxvZy53YXJuKGBDYW5ub3QgZm9jdXMgU2ltdWxhdG9yIHdpbmRvdyB3aXRoIGlkYi4gRGVmYXVsdGluZyB0byBBcHBsZVNjcmlwdGApO1xuICAgIGNvbnN0IHtuYW1lLCBzZGt9ID0gYXdhaXQgdGhpcy5zdGF0KCk7XG4gICAgcmV0dXJuIGBcbiAgICAgIHRlbGwgYXBwbGljYXRpb24gXCJTeXN0ZW0gRXZlbnRzXCJcbiAgICAgICAgdGVsbCBwcm9jZXNzIFwiU2ltdWxhdG9yXCJcbiAgICAgICAgICBzZXQgZnJvbnRtb3N0IHRvIGZhbHNlXG4gICAgICAgICAgc2V0IGZyb250bW9zdCB0byB0cnVlXG4gICAgICAgICAgY2xpY2sgKG1lbnUgaXRlbSAxIHdoZXJlIChpdHMgbmFtZSBjb250YWlucyBcIiR7bmFtZX0gXCIgYW5kIGl0cyBuYW1lIGNvbnRhaW5zIFwiJHtzZGt9XCIpKSBvZiBtZW51IDEgb2YgbWVudSBiYXIgaXRlbSBcIldpbmRvd1wiIG9mIG1lbnUgYmFyIDFcbiAgICAgICAgZW5kIHRlbGxcbiAgICAgIGVuZCB0ZWxsXG4gICAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGFzeW5jIGlzQmlvbWV0cmljRW5yb2xsZWQgKCkge1xuICAgIGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgc3Bhd24odGhpcy51ZGlkLCBbXG4gICAgICAnbm90aWZ5dXRpbCcsXG4gICAgICAnLWcnLCBFTlJPTExNRU5UX05PVElGSUNBVElPTl9SRUNFSVZFUlxuICAgIF0pO1xuICAgIGNvbnN0IG1hdGNoID0gKG5ldyBSZWdFeHAoYCR7Xy5lc2NhcGVSZWdFeHAoRU5ST0xMTUVOVF9OT1RJRklDQVRJT05fUkVDRUlWRVIpfVxcXFxzKyhbMDFdKWApKVxuICAgICAgLmV4ZWMoc3Rkb3V0KTtcbiAgICBpZiAoIW1hdGNoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBwYXJzZSBiaW9tZXRyaWMgZW5yb2xsbWVudCBzdGF0ZSBmcm9tICcke3N0ZG91dH0nYCk7XG4gICAgfVxuICAgIGxvZy5pbmZvKGBDdXJyZW50IGJpb21ldHJpYyBlbnJvbGxlZCBzdGF0ZSBmb3IgJHt0aGlzLnVkaWR9IFNpbXVsYXRvcjogJHttYXRjaFsxXX1gKTtcbiAgICByZXR1cm4gbWF0Y2hbMV0gPT09ICcxJztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGFzeW5jIGVucm9sbEJpb21ldHJpYyAoaXNFbmFibGVkID0gdHJ1ZSkge1xuICAgIGxvZy5kZWJ1ZyhgU2V0dGluZyBiaW9tZXRyaWMgZW5yb2xsZWQgc3RhdGUgZm9yICR7dGhpcy51ZGlkfSBTaW11bGF0b3IgdG8gJyR7aXNFbmFibGVkID8gJ2VuYWJsZWQnIDogJ2Rpc2FibGVkJ30nYCk7XG4gICAgYXdhaXQgc3Bhd24odGhpcy51ZGlkLCBbXG4gICAgICAnbm90aWZ5dXRpbCcsXG4gICAgICAnLXMnLCBFTlJPTExNRU5UX05PVElGSUNBVElPTl9SRUNFSVZFUiwgaXNFbmFibGVkID8gJzEnIDogJzAnXG4gICAgXSk7XG4gICAgYXdhaXQgc3Bhd24odGhpcy51ZGlkLCBbXG4gICAgICAnbm90aWZ5dXRpbCcsXG4gICAgICAnLXAnLCBFTlJPTExNRU5UX05PVElGSUNBVElPTl9SRUNFSVZFUlxuICAgIF0pO1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQmlvbWV0cmljRW5yb2xsZWQoKSAhPT0gaXNFbmFibGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzZXQgYmlvbWV0cmljIGVucm9sbGVkIHN0YXRlIGZvciAke3RoaXMudWRpZH0gU2ltdWxhdG9yIHRvICcke2lzRW5hYmxlZCA/ICdlbmFibGVkJyA6ICdkaXNhYmxlZCd9J2ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyBhIG5vdGlmaWNhdGlvbiB0byBtYXRjaC9ub3QgbWF0Y2ggdGhlIHBhcnRpY3VsYXIgYmlvbWV0cmljLlxuICAgKiBAb3ZlcnJpZGVcbiAgICpcbiAgICogQHBhcmFtIHs/Ym9vbGVhbn0gc2hvdWxkTWF0Y2ggW3RydWVdIC0gU2V0IGl0IHRvIHRydWUgb3IgZmFsc2UgaW4gb3JkZXIgdG8gZW11bGF0ZVxuICAgKiBtYXRjaGluZy9ub3QgbWF0Y2hpbmcgdGhlIGNvcnJlc3BvbmRpbmcgYmlvbWV0cmljXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gYmlvbWV0cmljTmFtZSBbdG91Y2hJZF0gLSBFaXRoZXIgdG91Y2hJZCBvciBmYWNlSWQgKGZhY2VJZCBpcyBvbmx5IGF2YWlsYWJsZSBzaW5jZSBpT1MgMTEpXG4gICAqL1xuICBhc3luYyBzZW5kQmlvbWV0cmljTWF0Y2ggKHNob3VsZE1hdGNoID0gdHJ1ZSwgYmlvbWV0cmljTmFtZSA9ICd0b3VjaElkJykge1xuICAgIGNvbnN0IGRvbWFpbkNvbXBvbmVudCA9IHRvQmlvbWV0cmljRG9tYWluQ29tcG9uZW50KGJpb21ldHJpY05hbWUpO1xuICAgIGNvbnN0IGRvbWFpbiA9IGBjb20uYXBwbGUuQmlvbWV0cmljS2l0X1NpbS4ke2RvbWFpbkNvbXBvbmVudH0uJHtzaG91bGRNYXRjaCA/ICcnIDogJ25vJ31tYXRjaGA7XG4gICAgYXdhaXQgc3Bhd24odGhpcy51ZGlkLCBbXG4gICAgICAnbm90aWZ5dXRpbCcsXG4gICAgICAnLXAnLCBkb21haW5cbiAgICBdKTtcbiAgICBsb2cuaW5mbyhgU2VudCBub3RpZmljYXRpb24gJHtkb21haW59IHRvICR7c2hvdWxkTWF0Y2ggPyAnbWF0Y2gnIDogJ25vdCBtYXRjaCd9ICR7YmlvbWV0cmljTmFtZX0gYmlvbWV0cmljIGAgK1xuICAgICAgYGZvciAke3RoaXMudWRpZH0gU2ltdWxhdG9yYCk7XG4gIH1cblxuICAvKipcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBhc3luYyBnZXRMYXVuY2hEYWVtb25zUm9vdCAoKSB7XG4gICAgY29uc3QgZGV2Um9vdCA9IGF3YWl0IGdldERldmVsb3BlclJvb3QoKTtcbiAgICByZXR1cm4gcGF0aC5yZXNvbHZlKGRldlJvb3QsXG4gICAgICAnUGxhdGZvcm1zL2lQaG9uZU9TLnBsYXRmb3JtL0RldmVsb3Blci9MaWJyYXJ5L0NvcmVTaW11bGF0b3IvUHJvZmlsZXMvUnVudGltZXMvaU9TLnNpbXJ1bnRpbWUvQ29udGVudHMvUmVzb3VyY2VzL1J1bnRpbWVSb290L1N5c3RlbS9MaWJyYXJ5L0xhdW5jaERhZW1vbnMnKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IFNpbXVsYXRvclhjb2RlOTtcbiJdLCJmaWxlIjoibGliL3NpbXVsYXRvci14Y29kZS05LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
