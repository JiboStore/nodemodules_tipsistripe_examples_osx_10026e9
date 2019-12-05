"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppiumDriver = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _config = require("./config");

var _appiumBaseDriver = require("appium-base-driver");

var _appiumFakeDriver = require("appium-fake-driver");

var _appiumAndroidDriver = require("appium-android-driver");

var _appiumIosDriver = require("appium-ios-driver");

var _appiumUiautomator2Driver = require("appium-uiautomator2-driver");

var _appiumSelendroidDriver = require("appium-selendroid-driver");

var _appiumXcuitestDriver = require("appium-xcuitest-driver");

var _appiumYouiengineDriver = require("appium-youiengine-driver");

var _appiumWindowsDriver = require("appium-windows-driver");

var _appiumMacDriver = require("appium-mac-driver");

var _appiumEspressoDriver = require("appium-espresso-driver");

var _appiumTizenDriver = require("appium-tizen-driver");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _asyncLock = _interopRequireDefault(require("async-lock"));

var _utils = require("./utils");

var _semver = _interopRequireDefault(require("semver"));

const AUTOMATION_NAMES = {
  APPIUM: 'Appium',
  SELENDROID: 'Selendroid',
  UIAUTOMATOR2: 'UiAutomator2',
  XCUITEST: 'XCUITest',
  YOUIENGINE: 'YouiEngine',
  ESPRESSO: 'Espresso',
  TIZEN: 'Tizen',
  FAKE: 'Fake'
};
const DRIVER_MAP = {
  SelendroidDriver: {
    driverClass: _appiumSelendroidDriver.SelendroidDriver,
    automationName: AUTOMATION_NAMES.SELENDROID,
    version: (0, _utils.getPackageVersion)('appium-selendroid-driver')
  },
  AndroidUiautomator2Driver: {
    driverClass: _appiumUiautomator2Driver.AndroidUiautomator2Driver,
    automationName: AUTOMATION_NAMES.UIAUTOMATOR2,
    version: (0, _utils.getPackageVersion)('appium-uiautomator2-driver')
  },
  XCUITestDriver: {
    driverClass: _appiumXcuitestDriver.XCUITestDriver,
    automationName: AUTOMATION_NAMES.XCUITEST,
    version: (0, _utils.getPackageVersion)('appium-xcuitest-driver')
  },
  YouiEngineDriver: {
    driverClass: _appiumYouiengineDriver.YouiEngineDriver,
    automationName: AUTOMATION_NAMES.YOUIENGINE,
    version: (0, _utils.getPackageVersion)('appium-youiengine-driver')
  },
  FakeDriver: {
    driverClass: _appiumFakeDriver.FakeDriver,
    version: (0, _utils.getPackageVersion)('appium-fake-driver')
  },
  AndroidDriver: {
    driverClass: _appiumAndroidDriver.AndroidDriver,
    version: (0, _utils.getPackageVersion)('appium-android-driver')
  },
  IosDriver: {
    driverClass: _appiumIosDriver.IosDriver,
    version: (0, _utils.getPackageVersion)('appium-ios-driver')
  },
  WindowsDriver: {
    driverClass: _appiumWindowsDriver.WindowsDriver,
    version: (0, _utils.getPackageVersion)('appium-windows-driver')
  },
  MacDriver: {
    driverClass: _appiumMacDriver.MacDriver,
    version: (0, _utils.getPackageVersion)('appium-mac-driver')
  },
  EspressoDriver: {
    driverClass: _appiumEspressoDriver.EspressoDriver,
    automationName: AUTOMATION_NAMES.ESPRESSO,
    version: (0, _utils.getPackageVersion)('appium-espresso-driver')
  },
  TizenDriver: {
    driverClass: _appiumTizenDriver.TizenDriver,
    automationName: AUTOMATION_NAMES.TIZEN,
    version: (0, _utils.getPackageVersion)('appium-tizen-driver')
  }
};
const PLATFORMS_MAP = {
  fake: () => _appiumFakeDriver.FakeDriver,
  android: caps => {
    const platformVersion = _semver.default.valid(_semver.default.coerce(caps.platformVersion));

    if (platformVersion && _semver.default.satisfies(platformVersion, '>=6.0.0')) {
      _logger.default.warn("Consider setting 'automationName' capability to " + `'${AUTOMATION_NAMES.UIAUTOMATOR2}' ` + "on Android >= 6, since UIAutomator framework " + "is not maintained anymore by the OS vendor.");
    }

    return _appiumAndroidDriver.AndroidDriver;
  },
  ios: caps => {
    const platformVersion = _semver.default.valid(_semver.default.coerce(caps.platformVersion));

    if (platformVersion && _semver.default.satisfies(platformVersion, '>=10.0.0')) {
      _logger.default.info("Requested iOS support with version >= 10, " + `using '${AUTOMATION_NAMES.XCUITEST}' ` + "driver instead of UIAutomation-based driver, since the " + "latter is unsupported on iOS 10 and up.");

      return _appiumXcuitestDriver.XCUITestDriver;
    }

    return _appiumIosDriver.IosDriver;
  },
  windows: () => _appiumWindowsDriver.WindowsDriver,
  mac: () => _appiumMacDriver.MacDriver,
  tizen: () => _appiumTizenDriver.TizenDriver
};
const desiredCapabilityConstraints = {
  automationName: {
    presence: false,
    isString: true,
    inclusionCaseInsensitive: _lodash.default.values(AUTOMATION_NAMES)
  },
  platformName: {
    presence: true,
    isString: true,
    inclusionCaseInsensitive: _lodash.default.keys(PLATFORMS_MAP)
  }
};
const sessionsListGuard = new _asyncLock.default();
const pendingDriversGuard = new _asyncLock.default();

class AppiumDriver extends _appiumBaseDriver.BaseDriver {
  constructor(args) {
    super();
    this.desiredCapConstraints = desiredCapabilityConstraints;
    this.newCommandTimeoutMs = 0;
    this.args = Object.assign({}, args);
    this.sessions = {};
    this.pendingDrivers = {};
    (0, _config.updateBuildInfo)();
  }

  get isCommandsQueueEnabled() {
    return false;
  }

  sessionExists(sessionId) {
    const dstSession = this.sessions[sessionId];
    return dstSession && dstSession.sessionId !== null;
  }

  driverForSession(sessionId) {
    return this.sessions[sessionId];
  }

  getDriverForCaps(caps) {
    if (!_lodash.default.isString(caps.platformName)) {
      throw new Error("You must include a platformName capability");
    }

    if (_lodash.default.isString(caps.automationName)) {
      for (const _ref of _lodash.default.values(DRIVER_MAP)) {
        const {
          automationName,
          driverClass
        } = _ref;

        if (_lodash.default.toLower(automationName) === caps.automationName.toLowerCase()) {
          return driverClass;
        }
      }
    }

    const driverSelector = PLATFORMS_MAP[caps.platformName.toLowerCase()];

    if (driverSelector) {
      return driverSelector(caps);
    }

    const msg = _lodash.default.isString(caps.automationName) ? `Could not find a driver for automationName '${caps.automationName}' and platformName ` + `'${caps.platformName}'.` : `Could not find a driver for platformName '${caps.platformName}'.`;
    throw new Error(`${msg} Please check your desired capabilities.`);
  }

  getDriverVersion(driver) {
    const {
      version
    } = DRIVER_MAP[driver.name] || {};

    if (version) {
      return version;
    }

    _logger.default.warn(`Unable to get version of driver '${driver.name}'`);
  }

  async getStatus() {
    return {
      build: _lodash.default.clone((0, _config.getBuildInfo)())
    };
  }

  async getSessions() {
    const sessions = await sessionsListGuard.acquire(AppiumDriver.name, () => this.sessions);
    return _lodash.default.toPairs(sessions).map(([id, driver]) => {
      return {
        id,
        capabilities: driver.caps
      };
    });
  }

  printNewSessionAnnouncement(driver, caps) {
    const driverVersion = this.getDriverVersion(driver);
    const introString = driverVersion ? `Creating new ${driver.name} (v${driverVersion}) session` : `Creating new ${driver.name} session`;

    _logger.default.info(introString);

    _logger.default.info('Capabilities:');

    (0, _utils.inspectObject)(caps);
  }

  async createSession(jsonwpCaps, reqCaps, w3cCapabilities) {
    const {
      defaultCapabilities
    } = this.args;
    let protocol;
    let innerSessionId, dCaps;

    try {
      const parsedCaps = (0, _utils.parseCapsForInnerDriver)(jsonwpCaps, w3cCapabilities, this.desiredCapConstraints, defaultCapabilities);
      let {
        desiredCaps,
        processedJsonwpCapabilities,
        processedW3CCapabilities,
        error
      } = parsedCaps;
      protocol = parsedCaps.protocol;

      if (error) {
        throw error;
      }

      const InnerDriver = this.getDriverForCaps(desiredCaps);
      this.printNewSessionAnnouncement(InnerDriver, desiredCaps);

      if (this.args.sessionOverride) {
        const sessionIdsToDelete = await sessionsListGuard.acquire(AppiumDriver.name, () => _lodash.default.keys(this.sessions));

        if (sessionIdsToDelete.length) {
          _logger.default.info(`Session override is on. Deleting other ${sessionIdsToDelete.length} active session${sessionIdsToDelete.length ? '' : 's'}.`);

          try {
            await _bluebird.default.map(sessionIdsToDelete, id => this.deleteSession(id));
          } catch (ign) {}
        }
      }

      let runningDriversData, otherPendingDriversData;
      const d = new InnerDriver(this.args);

      if (this.args.relaxedSecurityEnabled) {
        _logger.default.info(`Applying relaxed security to '${InnerDriver.name}' as per server command line argument`);

        d.relaxedSecurityEnabled = true;
      }

      d.server = this.server;

      try {
        runningDriversData = await this.curSessionDataForDriver(InnerDriver);
      } catch (e) {
        throw new _appiumBaseDriver.errors.SessionNotCreatedError(e.message);
      }

      await pendingDriversGuard.acquire(AppiumDriver.name, () => {
        this.pendingDrivers[InnerDriver.name] = this.pendingDrivers[InnerDriver.name] || [];
        otherPendingDriversData = this.pendingDrivers[InnerDriver.name].map(drv => drv.driverData);
        this.pendingDrivers[InnerDriver.name].push(d);
      });

      try {
        [innerSessionId, dCaps] = await d.createSession(processedJsonwpCapabilities, reqCaps, processedW3CCapabilities, [...runningDriversData, ...otherPendingDriversData]);
        protocol = d.protocol;
        await sessionsListGuard.acquire(AppiumDriver.name, () => {
          this.sessions[innerSessionId] = d;
        });
      } finally {
        await pendingDriversGuard.acquire(AppiumDriver.name, () => {
          _lodash.default.pull(this.pendingDrivers[InnerDriver.name], d);
        });
      }

      this.attachUnexpectedShutdownHandler(d, innerSessionId);

      _logger.default.info(`New ${InnerDriver.name} session created successfully, session ` + `${innerSessionId} added to master session list`);

      d.startNewCommandTimeout();
    } catch (error) {
      return {
        protocol,
        error
      };
    }

    return {
      protocol,
      value: [innerSessionId, dCaps, protocol]
    };
  }

  async attachUnexpectedShutdownHandler(driver, innerSessionId) {
    try {
      await driver.onUnexpectedShutdown;
      throw new Error('Unexpected shutdown');
    } catch (e) {
      if (e instanceof _bluebird.default.CancellationError) {
        return;
      }

      _logger.default.warn(`Closing session, cause was '${e.message}'`);

      _logger.default.info(`Removing session ${innerSessionId} from our master session list`);

      await sessionsListGuard.acquire(AppiumDriver.name, () => {
        delete this.sessions[innerSessionId];
      });
    }
  }

  async curSessionDataForDriver(InnerDriver) {
    const sessions = await sessionsListGuard.acquire(AppiumDriver.name, () => this.sessions);

    const data = _lodash.default.values(sessions).filter(s => s.constructor.name === InnerDriver.name).map(s => s.driverData);

    for (let datum of data) {
      if (!datum) {
        throw new Error(`Problem getting session data for driver type ` + `${InnerDriver.name}; does it implement 'get ` + `driverData'?`);
      }
    }

    return data;
  }

  async deleteSession(sessionId) {
    let protocol;

    try {
      let otherSessionsData = null;
      let dstSession = null;
      await sessionsListGuard.acquire(AppiumDriver.name, () => {
        if (!this.sessions[sessionId]) {
          return;
        }

        const curConstructorName = this.sessions[sessionId].constructor.name;
        otherSessionsData = _lodash.default.toPairs(this.sessions).filter(([key, value]) => value.constructor.name === curConstructorName && key !== sessionId).map(([, value]) => value.driverData);
        dstSession = this.sessions[sessionId];
        protocol = dstSession.protocol;

        _logger.default.info(`Removing session ${sessionId} from our master session list`);

        delete this.sessions[sessionId];
      });
      return {
        protocol,
        value: await dstSession.deleteSession(sessionId, otherSessionsData)
      };
    } catch (e) {
      _logger.default.error(`Had trouble ending session ${sessionId}: ${e.message}`);

      return {
        protocol,
        error: e
      };
    }
  }

  async executeCommand(cmd, ...args) {
    if (cmd === 'getStatus') {
      return await this.getStatus();
    }

    if (isAppiumDriverCommand(cmd)) {
      return await super.executeCommand(cmd, ...args);
    }

    const sessionId = _lodash.default.last(args);

    const dstSession = await sessionsListGuard.acquire(AppiumDriver.name, () => this.sessions[sessionId]);

    if (!dstSession) {
      throw new Error(`The session with id '${sessionId}' does not exist`);
    }

    let res = {
      protocol: dstSession.protocol
    };

    try {
      res.value = await dstSession.executeCommand(cmd, ...args);
    } catch (e) {
      res.error = e;
    }

    return res;
  }

  proxyActive(sessionId) {
    const dstSession = this.sessions[sessionId];
    return dstSession && _lodash.default.isFunction(dstSession.proxyActive) && dstSession.proxyActive(sessionId);
  }

  getProxyAvoidList(sessionId) {
    const dstSession = this.sessions[sessionId];
    return dstSession ? dstSession.getProxyAvoidList() : [];
  }

  canProxy(sessionId) {
    const dstSession = this.sessions[sessionId];
    return dstSession && dstSession.canProxy(sessionId);
  }

}

exports.AppiumDriver = AppiumDriver;

function isAppiumDriverCommand(cmd) {
  return !(0, _appiumBaseDriver.isSessionCommand)(cmd) || cmd === "deleteSession";
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hcHBpdW0uanMiXSwibmFtZXMiOlsiQVVUT01BVElPTl9OQU1FUyIsIkFQUElVTSIsIlNFTEVORFJPSUQiLCJVSUFVVE9NQVRPUjIiLCJYQ1VJVEVTVCIsIllPVUlFTkdJTkUiLCJFU1BSRVNTTyIsIlRJWkVOIiwiRkFLRSIsIkRSSVZFUl9NQVAiLCJTZWxlbmRyb2lkRHJpdmVyIiwiZHJpdmVyQ2xhc3MiLCJhdXRvbWF0aW9uTmFtZSIsInZlcnNpb24iLCJBbmRyb2lkVWlhdXRvbWF0b3IyRHJpdmVyIiwiWENVSVRlc3REcml2ZXIiLCJZb3VpRW5naW5lRHJpdmVyIiwiRmFrZURyaXZlciIsIkFuZHJvaWREcml2ZXIiLCJJb3NEcml2ZXIiLCJXaW5kb3dzRHJpdmVyIiwiTWFjRHJpdmVyIiwiRXNwcmVzc29Ecml2ZXIiLCJUaXplbkRyaXZlciIsIlBMQVRGT1JNU19NQVAiLCJmYWtlIiwiYW5kcm9pZCIsImNhcHMiLCJwbGF0Zm9ybVZlcnNpb24iLCJzZW12ZXIiLCJ2YWxpZCIsImNvZXJjZSIsInNhdGlzZmllcyIsImxvZyIsIndhcm4iLCJpb3MiLCJpbmZvIiwid2luZG93cyIsIm1hYyIsInRpemVuIiwiZGVzaXJlZENhcGFiaWxpdHlDb25zdHJhaW50cyIsInByZXNlbmNlIiwiaXNTdHJpbmciLCJpbmNsdXNpb25DYXNlSW5zZW5zaXRpdmUiLCJfIiwidmFsdWVzIiwicGxhdGZvcm1OYW1lIiwia2V5cyIsInNlc3Npb25zTGlzdEd1YXJkIiwiQXN5bmNMb2NrIiwicGVuZGluZ0RyaXZlcnNHdWFyZCIsIkFwcGl1bURyaXZlciIsIkJhc2VEcml2ZXIiLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJkZXNpcmVkQ2FwQ29uc3RyYWludHMiLCJuZXdDb21tYW5kVGltZW91dE1zIiwiT2JqZWN0IiwiYXNzaWduIiwic2Vzc2lvbnMiLCJwZW5kaW5nRHJpdmVycyIsImlzQ29tbWFuZHNRdWV1ZUVuYWJsZWQiLCJzZXNzaW9uRXhpc3RzIiwic2Vzc2lvbklkIiwiZHN0U2Vzc2lvbiIsImRyaXZlckZvclNlc3Npb24iLCJnZXREcml2ZXJGb3JDYXBzIiwiRXJyb3IiLCJ0b0xvd2VyIiwidG9Mb3dlckNhc2UiLCJkcml2ZXJTZWxlY3RvciIsIm1zZyIsImdldERyaXZlclZlcnNpb24iLCJkcml2ZXIiLCJuYW1lIiwiZ2V0U3RhdHVzIiwiYnVpbGQiLCJjbG9uZSIsImdldFNlc3Npb25zIiwiYWNxdWlyZSIsInRvUGFpcnMiLCJtYXAiLCJpZCIsImNhcGFiaWxpdGllcyIsInByaW50TmV3U2Vzc2lvbkFubm91bmNlbWVudCIsImRyaXZlclZlcnNpb24iLCJpbnRyb1N0cmluZyIsImNyZWF0ZVNlc3Npb24iLCJqc29ud3BDYXBzIiwicmVxQ2FwcyIsInczY0NhcGFiaWxpdGllcyIsImRlZmF1bHRDYXBhYmlsaXRpZXMiLCJwcm90b2NvbCIsImlubmVyU2Vzc2lvbklkIiwiZENhcHMiLCJwYXJzZWRDYXBzIiwiZGVzaXJlZENhcHMiLCJwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMiLCJwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMiLCJlcnJvciIsIklubmVyRHJpdmVyIiwic2Vzc2lvbk92ZXJyaWRlIiwic2Vzc2lvbklkc1RvRGVsZXRlIiwibGVuZ3RoIiwiQiIsImRlbGV0ZVNlc3Npb24iLCJpZ24iLCJydW5uaW5nRHJpdmVyc0RhdGEiLCJvdGhlclBlbmRpbmdEcml2ZXJzRGF0YSIsImQiLCJyZWxheGVkU2VjdXJpdHlFbmFibGVkIiwic2VydmVyIiwiY3VyU2Vzc2lvbkRhdGFGb3JEcml2ZXIiLCJlIiwiZXJyb3JzIiwiU2Vzc2lvbk5vdENyZWF0ZWRFcnJvciIsIm1lc3NhZ2UiLCJkcnYiLCJkcml2ZXJEYXRhIiwicHVzaCIsInB1bGwiLCJhdHRhY2hVbmV4cGVjdGVkU2h1dGRvd25IYW5kbGVyIiwic3RhcnROZXdDb21tYW5kVGltZW91dCIsInZhbHVlIiwib25VbmV4cGVjdGVkU2h1dGRvd24iLCJDYW5jZWxsYXRpb25FcnJvciIsImRhdGEiLCJmaWx0ZXIiLCJzIiwiZGF0dW0iLCJvdGhlclNlc3Npb25zRGF0YSIsImN1ckNvbnN0cnVjdG9yTmFtZSIsImtleSIsImV4ZWN1dGVDb21tYW5kIiwiY21kIiwiaXNBcHBpdW1Ecml2ZXJDb21tYW5kIiwibGFzdCIsInJlcyIsInByb3h5QWN0aXZlIiwiaXNGdW5jdGlvbiIsImdldFByb3h5QXZvaWRMaXN0IiwiY2FuUHJveHkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsTUFBTUEsZ0JBQWdCLEdBQUc7QUFDdkJDLEVBQUFBLE1BQU0sRUFBRSxRQURlO0FBRXZCQyxFQUFBQSxVQUFVLEVBQUUsWUFGVztBQUd2QkMsRUFBQUEsWUFBWSxFQUFFLGNBSFM7QUFJdkJDLEVBQUFBLFFBQVEsRUFBRSxVQUphO0FBS3ZCQyxFQUFBQSxVQUFVLEVBQUUsWUFMVztBQU12QkMsRUFBQUEsUUFBUSxFQUFFLFVBTmE7QUFPdkJDLEVBQUFBLEtBQUssRUFBRSxPQVBnQjtBQVF2QkMsRUFBQUEsSUFBSSxFQUFFO0FBUmlCLENBQXpCO0FBVUEsTUFBTUMsVUFBVSxHQUFHO0FBQ2pCQyxFQUFBQSxnQkFBZ0IsRUFBRTtBQUNoQkMsSUFBQUEsV0FBVyxFQUFFRCx3Q0FERztBQUVoQkUsSUFBQUEsY0FBYyxFQUFFWixnQkFBZ0IsQ0FBQ0UsVUFGakI7QUFHaEJXLElBQUFBLE9BQU8sRUFBRSw4QkFBa0IsMEJBQWxCO0FBSE8sR0FERDtBQU1qQkMsRUFBQUEseUJBQXlCLEVBQUU7QUFDekJILElBQUFBLFdBQVcsRUFBRUcsbURBRFk7QUFFekJGLElBQUFBLGNBQWMsRUFBRVosZ0JBQWdCLENBQUNHLFlBRlI7QUFHekJVLElBQUFBLE9BQU8sRUFBRSw4QkFBa0IsNEJBQWxCO0FBSGdCLEdBTlY7QUFXakJFLEVBQUFBLGNB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R2hGLElBQWxDLENBQWxCO0FBQ0QsS0FGRCxDQUVFLE9BQU8yRCxDQUFQLEVBQVU7QUFDVndCLE1BQUFBLEdBQUcsQ0FBQ3RDLEtBQUosR0FBWWMsQ0FBWjtBQUNEOztBQUNELFdBQU93QixHQUFQO0FBQ0Q7O0FBRURDLEVBQUFBLFdBQVcsQ0FBRTNFLFNBQUYsRUFBYTtBQUN0QixVQUFNQyxVQUFVLEdBQUcsS0FBS0wsUUFBTCxDQUFjSSxTQUFkLENBQW5CO0FBQ0EsV0FBT0MsVUFBVSxJQUFJcEIsZ0JBQUUrRixVQUFGLENBQWEzRSxVQUFVLENBQUMwRSxXQUF4QixDQUFkLElBQXNEMUUsVUFBVSxDQUFDMEUsV0FBWCxDQUF1QjNFLFNBQXZCLENBQTdEO0FBQ0Q7O0FBRUQ2RSxFQUFBQSxpQkFBaUIsQ0FBRTdFLFNBQUYsRUFBYTtBQUM1QixVQUFNQyxVQUFVLEdBQUcsS0FBS0wsUUFBTCxDQUFjSSxTQUFkLENBQW5CO0FBQ0EsV0FBT0MsVUFBVSxHQUFHQSxVQUFVLENBQUM0RSxpQkFBWCxFQUFILEdBQW9DLEVBQXJEO0FBQ0Q7O0FBRURDLEVBQUFBLFFBQVEsQ0FBRTlFLFNBQUYsRUFBYTtBQUNuQixVQUFNQyxVQUFVLEdBQUcsS0FBS0wsUUFBTCxDQUFjSSxTQUFkLENBQW5CO0FBQ0EsV0FBT0MsVUFBVSxJQUFJQSxVQUFVLENBQUM2RSxRQUFYLENBQW9COUUsU0FBcEIsQ0FBckI7QUFDRDs7QUExVG1DOzs7O0FBK1R0QyxTQUFTd0UscUJBQVQsQ0FBZ0NELEdBQWhDLEVBQXFDO0FBQ25DLFNBQU8sQ0FBQyx3Q0FBaUJBLEdBQWpCLENBQUQsSUFBMEJBLEdBQUcsS0FBSyxlQUF6QztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgZ2V0QnVpbGRJbmZvLCB1cGRhdGVCdWlsZEluZm8gfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBCYXNlRHJpdmVyLCBlcnJvcnMsIGlzU2Vzc2lvbkNvbW1hbmQgfSBmcm9tICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuaW1wb3J0IHsgRmFrZURyaXZlciB9IGZyb20gJ2FwcGl1bS1mYWtlLWRyaXZlcic7XG5pbXBvcnQgeyBBbmRyb2lkRHJpdmVyIH0gZnJvbSAnYXBwaXVtLWFuZHJvaWQtZHJpdmVyJztcbmltcG9ydCB7IElvc0RyaXZlciB9IGZyb20gJ2FwcGl1bS1pb3MtZHJpdmVyJztcbmltcG9ydCB7IEFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXIgfSBmcm9tICdhcHBpdW0tdWlhdXRvbWF0b3IyLWRyaXZlcic7XG5pbXBvcnQgeyBTZWxlbmRyb2lkRHJpdmVyIH0gZnJvbSAnYXBwaXVtLXNlbGVuZHJvaWQtZHJpdmVyJztcbmltcG9ydCB7IFhDVUlUZXN0RHJpdmVyIH0gZnJvbSAnYXBwaXVtLXhjdWl0ZXN0LWRyaXZlcic7XG5pbXBvcnQgeyBZb3VpRW5naW5lRHJpdmVyIH0gZnJvbSAnYXBwaXVtLXlvdWllbmdpbmUtZHJpdmVyJztcbmltcG9ydCB7IFdpbmRvd3NEcml2ZXIgfSBmcm9tICdhcHBpdW0td2luZG93cy1kcml2ZXInO1xuaW1wb3J0IHsgTWFjRHJpdmVyIH0gZnJvbSAnYXBwaXVtLW1hYy1kcml2ZXInO1xuaW1wb3J0IHsgRXNwcmVzc29Ecml2ZXIgfSBmcm9tICdhcHBpdW0tZXNwcmVzc28tZHJpdmVyJztcbmltcG9ydCB7IFRpemVuRHJpdmVyIH0gZnJvbSAnYXBwaXVtLXRpemVuLWRyaXZlcic7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgQXN5bmNMb2NrIGZyb20gJ2FzeW5jLWxvY2snO1xuaW1wb3J0IHsgaW5zcGVjdE9iamVjdCwgcGFyc2VDYXBzRm9ySW5uZXJEcml2ZXIsIGdldFBhY2thZ2VWZXJzaW9uIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5cblxuY29uc3QgQVVUT01BVElPTl9OQU1FUyA9IHtcbiAgQVBQSVVNOiAnQXBwaXVtJyxcbiAgU0VMRU5EUk9JRDogJ1NlbGVuZHJvaWQnLFxuICBVSUFVVE9NQVRPUjI6ICdVaUF1dG9tYXRvcjInLFxuICBYQ1VJVEVTVDogJ1hDVUlUZXN0JyxcbiAgWU9VSUVOR0lORTogJ1lvdWlFbmdpbmUnLFxuICBFU1BSRVNTTzogJ0VzcHJlc3NvJyxcbiAgVElaRU46ICdUaXplbicsXG4gIEZBS0U6ICdGYWtlJyxcbn07XG5jb25zdCBEUklWRVJfTUFQID0ge1xuICBTZWxlbmRyb2lkRHJpdmVyOiB7XG4gICAgZHJpdmVyQ2xhc3M6IFNlbGVuZHJvaWREcml2ZXIsXG4gICAgYXV0b21hdGlvbk5hbWU6IEFVVE9NQVRJT05fTkFNRVMuU0VMRU5EUk9JRCxcbiAgICB2ZXJzaW9uOiBnZXRQYWNrYWdlVmVyc2lvbignYXBwaXVtLXNlbGVuZHJvaWQtZHJpdmVyJyksXG4gIH0sXG4gIEFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXI6IHtcbiAgICBkcml2ZXJDbGFzczogQW5kcm9pZFVpYXV0b21hdG9yMkRyaXZlcixcbiAgICBhdXRvbWF0aW9uTmFtZTogQVVUT01BVElPTl9OQU1FUy5VSUFVVE9NQVRPUjIsXG4gICAgdmVyc2lvbjogZ2V0UGFja2FnZVZlcnNpb24oJ2FwcGl1bS11aWF1dG9tYXRvcjItZHJpdmVyJyksXG4gIH0sXG4gIFhDVUlUZXN0RHJpdmVyOiB7XG4gICAgZHJpdmVyQ2xhc3M6IFhDVUlUZXN0RHJpdmVyLFxuICAgIGF1dG9tYXRpb25OYW1lOiBBVVRPTUFUSU9OX05BTUVTLlhDVUlURVNULFxuICAgIHZlcnNpb246IGdldFBhY2thZ2VWZXJzaW9uKCdhcHBpdW0teGN1aXRlc3QtZHJpdmVyJyksXG4gIH0sXG4gIFlvdWlFbmdpbmVEcml2ZXI6IHtcbiAgICBkcml2ZXJDbGFzczogWW91aUVuZ2luZURyaXZlcixcbiAgICBhdXRvbWF0aW9uTmFtZTogQVVUT01BVElPTl9OQU1FUy5ZT1VJRU5HSU5FLFxuICAgIHZlcnNpb246IGdldFBhY2thZ2VWZXJzaW9uKCdhcHBpdW0teW91aWVuZ2luZS1kcml2ZXInKSxcbiAgfSxcbiAgRmFrZURyaXZlcjoge1xuICAgIGRyaXZlckNsYXNzOiBGYWtlRHJpdmVyLFxuICAgIHZlcnNpb246IGdldFBhY2thZ2VWZXJzaW9uKCdhcHBpdW0tZmFrZS1kcml2ZXInKSxcbiAgfSxcbiAgQW5kcm9pZERyaXZlcjoge1xuICAgIGRyaXZlckNsYXNzOiBBbmRyb2lkRHJpdmVyLFxuICAgIHZlcnNpb246IGdldFBhY2thZ2VWZXJzaW9uKCdhcHBpdW0tYW5kcm9pZC1kcml2ZXInKSxcbiAgfSxcbiAgSW9zRHJpdmVyOiB7XG4gICAgZHJpdmVyQ2xhc3M6IElvc0RyaXZlcixcbiAgICB2ZXJzaW9uOiBnZXRQYWNrYWdlVmVyc2lvbignYXBwaXVtLWlvcy1kcml2ZXInKSxcbiAgfSxcbiAgV2luZG93c0RyaXZlcjoge1xuICAgIGRyaXZlckNsYXNzOiBXaW5kb3dzRHJpdmVyLFxuICAgIHZlcnNpb246IGdldFBhY2thZ2VWZXJzaW9uKCdhcHBpdW0td2luZG93cy1kcml2ZXInKSxcbiAgfSxcbiAgTWFjRHJpdmVyOiB7XG4gICAgZHJpdmVyQ2xhc3M6IE1hY0RyaXZlcixcbiAgICB2ZXJzaW9uOiBnZXRQYWNrYWdlVmVyc2lvbignYXBwaXVtLW1hYy1kcml2ZXInKSxcbiAgfSxcbiAgRXNwcmVzc29Ecml2ZXI6IHtcbiAgICBkcml2ZXJDbGFzczogRXNwcmVzc29Ecml2ZXIsXG4gICAgYXV0b21hdGlvbk5hbWU6IEFVVE9NQVRJT05fTkFNRVMuRVNQUkVTU08sXG4gICAgdmVyc2lvbjogZ2V0UGFja2FnZVZlcnNpb24oJ2FwcGl1bS1lc3ByZXNzby1kcml2ZXInKSxcbiAgfSxcbiAgVGl6ZW5Ecml2ZXI6IHtcbiAgICBkcml2ZXJDbGFzczogVGl6ZW5Ecml2ZXIsXG4gICAgYXV0b21hdGlvbk5hbWU6IEFVVE9NQVRJT05fTkFNRVMuVElaRU4sXG4gICAgdmVyc2lvbjogZ2V0UGFja2FnZVZlcnNpb24oJ2FwcGl1bS10aXplbi1kcml2ZXInKSxcbiAgfSxcbn07XG5cbmNvbnN0IFBMQVRGT1JNU19NQVAgPSB7XG4gIGZha2U6ICgpID0+IEZha2VEcml2ZXIsXG4gIGFuZHJvaWQ6IChjYXBzKSA9PiB7XG4gICAgY29uc3QgcGxhdGZvcm1WZXJzaW9uID0gc2VtdmVyLnZhbGlkKHNlbXZlci5jb2VyY2UoY2Fwcy5wbGF0Zm9ybVZlcnNpb24pKTtcbiAgICBpZiAocGxhdGZvcm1WZXJzaW9uICYmIHNlbXZlci5zYXRpc2ZpZXMocGxhdGZvcm1WZXJzaW9uLCAnPj02LjAuMCcpKSB7XG4gICAgICBsb2cud2FybihcIkNvbnNpZGVyIHNldHRpbmcgJ2F1dG9tYXRpb25OYW1lJyBjYXBhYmlsaXR5IHRvIFwiICtcbiAgICAgICAgYCcke0FVVE9NQVRJT05fTkFNRVMuVUlBVVRPTUFUT1IyfScgYCArXG4gICAgICAgIFwib24gQW5kcm9pZCA+PSA2LCBzaW5jZSBVSUF1dG9tYXRvciBmcmFtZXdvcmsgXCIgK1xuICAgICAgICBcImlzIG5vdCBtYWludGFpbmVkIGFueW1vcmUgYnkgdGhlIE9TIHZlbmRvci5cIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIEFuZHJvaWREcml2ZXI7XG4gIH0sXG4gIGlvczogKGNhcHMpID0+IHtcbiAgICBjb25zdCBwbGF0Zm9ybVZlcnNpb24gPSBzZW12ZXIudmFsaWQoc2VtdmVyLmNvZXJjZShjYXBzLnBsYXRmb3JtVmVyc2lvbikpO1xuICAgIGlmIChwbGF0Zm9ybVZlcnNpb24gJiYgc2VtdmVyLnNhdGlzZmllcyhwbGF0Zm9ybVZlcnNpb24sICc+PTEwLjAuMCcpKSB7XG4gICAgICBsb2cuaW5mbyhcIlJlcXVlc3RlZCBpT1Mgc3VwcG9ydCB3aXRoIHZlcnNpb24gPj0gMTAsIFwiICtcbiAgICAgICAgYHVzaW5nICcke0FVVE9NQVRJT05fTkFNRVMuWENVSVRFU1R9JyBgICtcbiAgICAgICAgXCJkcml2ZXIgaW5zdGVhZCBvZiBVSUF1dG9tYXRpb24tYmFzZWQgZHJpdmVyLCBzaW5jZSB0aGUgXCIgK1xuICAgICAgICBcImxhdHRlciBpcyB1bnN1cHBvcnRlZCBvbiBpT1MgMTAgYW5kIHVwLlwiKTtcbiAgICAgIHJldHVybiBYQ1VJVGVzdERyaXZlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gSW9zRHJpdmVyO1xuICB9LFxuICB3aW5kb3dzOiAoKSA9PiBXaW5kb3dzRHJpdmVyLFxuICBtYWM6ICgpID0+IE1hY0RyaXZlcixcbiAgdGl6ZW46ICgpID0+IFRpemVuRHJpdmVyLFxufTtcblxuY29uc3QgZGVzaXJlZENhcGFiaWxpdHlDb25zdHJhaW50cyA9IHtcbiAgYXV0b21hdGlvbk5hbWU6IHtcbiAgICBwcmVzZW5jZTogZmFsc2UsXG4gICAgaXNTdHJpbmc6IHRydWUsXG4gICAgaW5jbHVzaW9uQ2FzZUluc2Vuc2l0aXZlOiBfLnZhbHVlcyhBVVRPTUFUSU9OX05BTUVTKSxcbiAgfSxcbiAgcGxhdGZvcm1OYW1lOiB7XG4gICAgcHJlc2VuY2U6IHRydWUsXG4gICAgaXNTdHJpbmc6IHRydWUsXG4gICAgaW5jbHVzaW9uQ2FzZUluc2Vuc2l0aXZlOiBfLmtleXMoUExBVEZPUk1TX01BUCksXG4gIH0sXG59O1xuXG5jb25zdCBzZXNzaW9uc0xpc3RHdWFyZCA9IG5ldyBBc3luY0xvY2soKTtcbmNvbnN0IHBlbmRpbmdEcml2ZXJzR3VhcmQgPSBuZXcgQXN5bmNMb2NrKCk7XG5cbmNsYXNzIEFwcGl1bURyaXZlciBleHRlbmRzIEJhc2VEcml2ZXIge1xuICBjb25zdHJ1Y3RvciAoYXJncykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmRlc2lyZWRDYXBDb25zdHJhaW50cyA9IGRlc2lyZWRDYXBhYmlsaXR5Q29uc3RyYWludHM7XG5cbiAgICAvLyB0aGUgbWFpbiBBcHBpdW0gRHJpdmVyIGhhcyBubyBuZXcgY29tbWFuZCB0aW1lb3V0XG4gICAgdGhpcy5uZXdDb21tYW5kVGltZW91dE1zID0gMDtcblxuICAgIHRoaXMuYXJncyA9IE9iamVjdC5hc3NpZ24oe30sIGFyZ3MpO1xuXG4gICAgLy8gQWNjZXNzIHRvIHNlc3Npb25zIGxpc3QgbXVzdCBiZSBndWFyZGVkIHdpdGggYSBTZW1hcGhvcmUsIGJlY2F1c2VcbiAgICAvLyBpdCBtaWdodCBiZSBjaGFuZ2VkIGJ5IG90aGVyIGFzeW5jIGNhbGxzIGF0IGFueSB0aW1lXG4gICAgLy8gSXQgaXMgbm90IHJlY29tbWVuZGVkIHRvIGFjY2VzcyB0aGlzIHByb3BlcnR5IGRpcmVjdGx5IGZyb20gdGhlIG91dHNpZGVcbiAgICB0aGlzLnNlc3Npb25zID0ge307XG5cbiAgICAvLyBBY2Nlc3MgdG8gcGVuZGluZyBkcml2ZXJzIGxpc3QgbXVzdCBiZSBndWFyZGVkIHdpdGggYSBTZW1hcGhvcmUsIGJlY2F1c2VcbiAgICAvLyBpdCBtaWdodCBiZSBjaGFuZ2VkIGJ5IG90aGVyIGFzeW5jIGNhbGxzIGF0IGFueSB0aW1lXG4gICAgLy8gSXQgaXMgbm90IHJlY29tbWVuZGVkIHRvIGFjY2VzcyB0aGlzIHByb3BlcnR5IGRpcmVjdGx5IGZyb20gdGhlIG91dHNpZGVcbiAgICB0aGlzLnBlbmRpbmdEcml2ZXJzID0ge307XG5cbiAgICAvLyBhbGxvdyB0aGlzIHRvIGhhcHBlbiBpbiB0aGUgYmFja2dyb3VuZCwgc28gbm8gYGF3YWl0YFxuICAgIHVwZGF0ZUJ1aWxkSW5mbygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbmNlbCBjb21tYW5kcyBxdWV1ZWluZyBmb3IgdGhlIHVtYnJlbGxhIEFwcGl1bSBkcml2ZXJcbiAgICovXG4gIGdldCBpc0NvbW1hbmRzUXVldWVFbmFibGVkICgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzZXNzaW9uRXhpc3RzIChzZXNzaW9uSWQpIHtcbiAgICBjb25zdCBkc3RTZXNzaW9uID0gdGhpcy5zZXNzaW9uc1tzZXNzaW9uSWRdO1xuICAgIHJldHVybiBkc3RTZXNzaW9uICYmIGRzdFNlc3Npb24uc2Vzc2lvbklkICE9PSBudWxsO1xuICB9XG5cbiAgZHJpdmVyRm9yU2Vzc2lvbiAoc2Vzc2lvbklkKSB7XG4gICAgcmV0dXJuIHRoaXMuc2Vzc2lvbnNbc2Vzc2lvbklkXTtcbiAgfVxuXG4gIGdldERyaXZlckZvckNhcHMgKGNhcHMpIHtcbiAgICBpZiAoIV8uaXNTdHJpbmcoY2Fwcy5wbGF0Zm9ybU5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBpbmNsdWRlIGEgcGxhdGZvcm1OYW1lIGNhcGFiaWxpdHlcIik7XG4gICAgfVxuXG4gICAgLy8gd2UgZG9uJ3QgbmVjZXNzYXJpbHkgaGF2ZSBhbiBgYXV0b21hdGlvbk5hbWVgIGNhcGFiaWxpdHksXG4gICAgaWYgKF8uaXNTdHJpbmcoY2Fwcy5hdXRvbWF0aW9uTmFtZSkpIHtcbiAgICAgIGZvciAoY29uc3Qge2F1dG9tYXRpb25OYW1lLCBkcml2ZXJDbGFzc30gb2YgXy52YWx1ZXMoRFJJVkVSX01BUCkpIHtcbiAgICAgICAgaWYgKF8udG9Mb3dlcihhdXRvbWF0aW9uTmFtZSkgPT09IGNhcHMuYXV0b21hdGlvbk5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIHJldHVybiBkcml2ZXJDbGFzcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGRyaXZlclNlbGVjdG9yID0gUExBVEZPUk1TX01BUFtjYXBzLnBsYXRmb3JtTmFtZS50b0xvd2VyQ2FzZSgpXTtcbiAgICBpZiAoZHJpdmVyU2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiBkcml2ZXJTZWxlY3RvcihjYXBzKTtcbiAgICB9XG5cbiAgICBjb25zdCBtc2cgPSBfLmlzU3RyaW5nKGNhcHMuYXV0b21hdGlvbk5hbWUpXG4gICAgICA/IGBDb3VsZCBub3QgZmluZCBhIGRyaXZlciBmb3IgYXV0b21hdGlvbk5hbWUgJyR7Y2Fwcy5hdXRvbWF0aW9uTmFtZX0nIGFuZCBwbGF0Zm9ybU5hbWUgYCArXG4gICAgICAgICAgICBgJyR7Y2Fwcy5wbGF0Zm9ybU5hbWV9Jy5gXG4gICAgICA6IGBDb3VsZCBub3QgZmluZCBhIGRyaXZlciBmb3IgcGxhdGZvcm1OYW1lICcke2NhcHMucGxhdGZvcm1OYW1lfScuYDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bXNnfSBQbGVhc2UgY2hlY2sgeW91ciBkZXNpcmVkIGNhcGFiaWxpdGllcy5gKTtcbiAgfVxuXG4gIGdldERyaXZlclZlcnNpb24gKGRyaXZlcikge1xuICAgIGNvbnN0IHt2ZXJzaW9ufSA9IERSSVZFUl9NQVBbZHJpdmVyLm5hbWVdIHx8IHt9O1xuICAgIGlmICh2ZXJzaW9uKSB7XG4gICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICB9XG4gICAgbG9nLndhcm4oYFVuYWJsZSB0byBnZXQgdmVyc2lvbiBvZiBkcml2ZXIgJyR7ZHJpdmVyLm5hbWV9J2ApO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3RhdHVzICgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLWF3YWl0XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1aWxkOiBfLmNsb25lKGdldEJ1aWxkSW5mbygpKSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgZ2V0U2Vzc2lvbnMgKCkge1xuICAgIGNvbnN0IHNlc3Npb25zID0gYXdhaXQgc2Vzc2lvbnNMaXN0R3VhcmQuYWNxdWlyZShBcHBpdW1Ecml2ZXIubmFtZSwgKCkgPT4gdGhpcy5zZXNzaW9ucyk7XG4gICAgcmV0dXJuIF8udG9QYWlycyhzZXNzaW9ucylcbiAgICAgICAgLm1hcCgoW2lkLCBkcml2ZXJdKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtpZCwgY2FwYWJpbGl0aWVzOiBkcml2ZXIuY2Fwc307XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcHJpbnROZXdTZXNzaW9uQW5ub3VuY2VtZW50IChkcml2ZXIsIGNhcHMpIHtcbiAgICBjb25zdCBkcml2ZXJWZXJzaW9uID0gdGhpcy5nZXREcml2ZXJWZXJzaW9uKGRyaXZlcik7XG4gICAgY29uc3QgaW50cm9TdHJpbmcgPSBkcml2ZXJWZXJzaW9uXG4gICAgICA/IGBDcmVhdGluZyBuZXcgJHtkcml2ZXIubmFtZX0gKHYke2RyaXZlclZlcnNpb259KSBzZXNzaW9uYFxuICAgICAgOiBgQ3JlYXRpbmcgbmV3ICR7ZHJpdmVyLm5hbWV9IHNlc3Npb25gO1xuICAgIGxvZy5pbmZvKGludHJvU3RyaW5nKTtcbiAgICBsb2cuaW5mbygnQ2FwYWJpbGl0aWVzOicpO1xuICAgIGluc3BlY3RPYmplY3QoY2Fwcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGpzb253cENhcHMgSlNPTldQIGZvcm1hdHRlZCBkZXNpcmVkIGNhcGFiaWxpdGllc1xuICAgKiBAcGFyYW0ge09iamVjdH0gcmVxQ2FwcyBSZXF1aXJlZCBjYXBhYmlsaXRpZXMgKEpTT05XUCBzdGFuZGFyZClcbiAgICogQHBhcmFtIHtPYmplY3R9IHczY0NhcGFiaWxpdGllcyBXM0MgY2FwYWJpbGl0aWVzXG4gICAqIEByZXR1cm4ge0FycmF5fSBVbmlxdWUgc2Vzc2lvbiBJRCBhbmQgY2FwYWJpbGl0aWVzXG4gICAqL1xuICBhc3luYyBjcmVhdGVTZXNzaW9uIChqc29ud3BDYXBzLCByZXFDYXBzLCB3M2NDYXBhYmlsaXRpZXMpIHtcbiAgICBjb25zdCB7ZGVmYXVsdENhcGFiaWxpdGllc30gPSB0aGlzLmFyZ3M7XG4gICAgbGV0IHByb3RvY29sO1xuICAgIGxldCBpbm5lclNlc3Npb25JZCwgZENhcHM7XG5cbiAgICB0cnkge1xuICAgICAgLy8gUGFyc2UgdGhlIGNhcHMgaW50byBhIGZvcm1hdCB0aGF0IHRoZSBJbm5lckRyaXZlciB3aWxsIGFjY2VwdFxuICAgICAgY29uc3QgcGFyc2VkQ2FwcyA9IHBhcnNlQ2Fwc0ZvcklubmVyRHJpdmVyKFxuICAgICAgICBqc29ud3BDYXBzLFxuICAgICAgICB3M2NDYXBhYmlsaXRpZXMsXG4gICAgICAgIHRoaXMuZGVzaXJlZENhcENvbnN0cmFpbnRzLFxuICAgICAgICBkZWZhdWx0Q2FwYWJpbGl0aWVzXG4gICAgICApO1xuXG4gICAgICBsZXQge2Rlc2lyZWRDYXBzLCBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcywgZXJyb3J9ID0gcGFyc2VkQ2FwcztcbiAgICAgIHByb3RvY29sID0gcGFyc2VkQ2Fwcy5wcm90b2NvbDtcblxuICAgICAgLy8gSWYgdGhlIHBhcnNpbmcgb2YgdGhlIGNhcHMgcHJvZHVjZWQgYW4gZXJyb3IsIHRocm93IGl0IGluIGhlcmVcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgSW5uZXJEcml2ZXIgPSB0aGlzLmdldERyaXZlckZvckNhcHMoZGVzaXJlZENhcHMpO1xuICAgICAgdGhpcy5wcmludE5ld1Nlc3Npb25Bbm5vdW5jZW1lbnQoSW5uZXJEcml2ZXIsIGRlc2lyZWRDYXBzKTtcblxuICAgICAgaWYgKHRoaXMuYXJncy5zZXNzaW9uT3ZlcnJpZGUpIHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbklkc1RvRGVsZXRlID0gYXdhaXQgc2Vzc2lvbnNMaXN0R3VhcmQuYWNxdWlyZShBcHBpdW1Ecml2ZXIubmFtZSwgKCkgPT4gXy5rZXlzKHRoaXMuc2Vzc2lvbnMpKTtcbiAgICAgICAgaWYgKHNlc3Npb25JZHNUb0RlbGV0ZS5sZW5ndGgpIHtcbiAgICAgICAgICBsb2cuaW5mbyhgU2Vzc2lvbiBvdmVycmlkZSBpcyBvbi4gRGVsZXRpbmcgb3RoZXIgJHtzZXNzaW9uSWRzVG9EZWxldGUubGVuZ3RofSBhY3RpdmUgc2Vzc2lvbiR7c2Vzc2lvbklkc1RvRGVsZXRlLmxlbmd0aCA/ICcnIDogJ3MnfS5gKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgQi5tYXAoc2Vzc2lvbklkc1RvRGVsZXRlLCAoaWQpID0+IHRoaXMuZGVsZXRlU2Vzc2lvbihpZCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbikge31cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgcnVubmluZ0RyaXZlcnNEYXRhLCBvdGhlclBlbmRpbmdEcml2ZXJzRGF0YTtcbiAgICAgIGNvbnN0IGQgPSBuZXcgSW5uZXJEcml2ZXIodGhpcy5hcmdzKTtcbiAgICAgIGlmICh0aGlzLmFyZ3MucmVsYXhlZFNlY3VyaXR5RW5hYmxlZCkge1xuICAgICAgICBsb2cuaW5mbyhgQXBwbHlpbmcgcmVsYXhlZCBzZWN1cml0eSB0byAnJHtJbm5lckRyaXZlci5uYW1lfScgYXMgcGVyIHNlcnZlciBjb21tYW5kIGxpbmUgYXJndW1lbnRgKTtcbiAgICAgICAgZC5yZWxheGVkU2VjdXJpdHlFbmFibGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8vIFRoaXMgYXNzaWdubWVudCBpcyByZXF1aXJlZCBmb3IgY29ycmVjdCB3ZWIgc29ja2V0cyBmdW5jdGlvbmFsaXR5IGluc2lkZSB0aGUgZHJpdmVyXG4gICAgICBkLnNlcnZlciA9IHRoaXMuc2VydmVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcnVubmluZ0RyaXZlcnNEYXRhID0gYXdhaXQgdGhpcy5jdXJTZXNzaW9uRGF0YUZvckRyaXZlcihJbm5lckRyaXZlcik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBlcnJvcnMuU2Vzc2lvbk5vdENyZWF0ZWRFcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgYXdhaXQgcGVuZGluZ0RyaXZlcnNHdWFyZC5hY3F1aXJlKEFwcGl1bURyaXZlci5uYW1lLCAoKSA9PiB7XG4gICAgICAgIHRoaXMucGVuZGluZ0RyaXZlcnNbSW5uZXJEcml2ZXIubmFtZV0gPSB0aGlzLnBlbmRpbmdEcml2ZXJzW0lubmVyRHJpdmVyLm5hbWVdIHx8IFtdO1xuICAgICAgICBvdGhlclBlbmRpbmdEcml2ZXJzRGF0YSA9IHRoaXMucGVuZGluZ0RyaXZlcnNbSW5uZXJEcml2ZXIubmFtZV0ubWFwKChkcnYpID0+IGRydi5kcml2ZXJEYXRhKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nRHJpdmVyc1tJbm5lckRyaXZlci5uYW1lXS5wdXNoKGQpO1xuICAgICAgfSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIFtpbm5lclNlc3Npb25JZCwgZENhcHNdID0gYXdhaXQgZC5jcmVhdGVTZXNzaW9uKFxuICAgICAgICAgIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyxcbiAgICAgICAgICByZXFDYXBzLFxuICAgICAgICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcyxcbiAgICAgICAgICBbLi4ucnVubmluZ0RyaXZlcnNEYXRhLCAuLi5vdGhlclBlbmRpbmdEcml2ZXJzRGF0YV1cbiAgICAgICAgKTtcbiAgICAgICAgcHJvdG9jb2wgPSBkLnByb3RvY29sO1xuICAgICAgICBhd2FpdCBzZXNzaW9uc0xpc3RHdWFyZC5hY3F1aXJlKEFwcGl1bURyaXZlci5uYW1lLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zZXNzaW9uc1tpbm5lclNlc3Npb25JZF0gPSBkO1xuICAgICAgICB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGF3YWl0IHBlbmRpbmdEcml2ZXJzR3VhcmQuYWNxdWlyZShBcHBpdW1Ecml2ZXIubmFtZSwgKCkgPT4ge1xuICAgICAgICAgIF8ucHVsbCh0aGlzLnBlbmRpbmdEcml2ZXJzW0lubmVyRHJpdmVyLm5hbWVdLCBkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHRoaXMgaXMgYW4gYXN5bmMgZnVuY3Rpb24gYnV0IHdlIGRvbid0IGF3YWl0IGl0IGJlY2F1c2UgaXQgaGFuZGxlc1xuICAgICAgLy8gYW4gb3V0LW9mLWJhbmQgcHJvbWlzZSB3aGljaCBpcyBmdWxmaWxsZWQgaWYgdGhlIGlubmVyIGRyaXZlclxuICAgICAgLy8gdW5leHBlY3RlZGx5IHNodXRzIGRvd25cbiAgICAgIHRoaXMuYXR0YWNoVW5leHBlY3RlZFNodXRkb3duSGFuZGxlcihkLCBpbm5lclNlc3Npb25JZCk7XG5cblxuICAgICAgbG9nLmluZm8oYE5ldyAke0lubmVyRHJpdmVyLm5hbWV9IHNlc3Npb24gY3JlYXRlZCBzdWNjZXNzZnVsbHksIHNlc3Npb24gYCArXG4gICAgICAgICAgICAgIGAke2lubmVyU2Vzc2lvbklkfSBhZGRlZCB0byBtYXN0ZXIgc2Vzc2lvbiBsaXN0YCk7XG5cbiAgICAgIC8vIHNldCB0aGUgTmV3IENvbW1hbmQgVGltZW91dCBmb3IgdGhlIGlubmVyIGRyaXZlclxuICAgICAgZC5zdGFydE5ld0NvbW1hbmRUaW1lb3V0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByb3RvY29sLFxuICAgICAgICBlcnJvcixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3RvY29sLFxuICAgICAgdmFsdWU6IFtpbm5lclNlc3Npb25JZCwgZENhcHMsIHByb3RvY29sXVxuICAgIH07XG4gIH1cblxuICBhc3luYyBhdHRhY2hVbmV4cGVjdGVkU2h1dGRvd25IYW5kbGVyIChkcml2ZXIsIGlubmVyU2Vzc2lvbklkKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSBzZXNzaW9uIG9uIHVuZXhwZWN0ZWQgc2h1dGRvd24sIHNvIHRoYXQgd2UgYXJlIGluIGEgcG9zaXRpb25cbiAgICAvLyB0byBvcGVuIGFub3RoZXIgc2Vzc2lvbiBsYXRlciBvbi5cbiAgICAvLyBUT0RPOiB0aGlzIHNob3VsZCBiZSByZW1vdmVkIGFuZCByZXBsYWNlZCBieSBhIG9uU2h1dGRvd24gY2FsbGJhY2suXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGRyaXZlci5vblVuZXhwZWN0ZWRTaHV0ZG93bjsgLy8gdGhpcyBpcyBhIGNhbmNlbGxhYmxlIHByb21pc2VcbiAgICAgIC8vIGlmIHdlIGdldCBoZXJlLCB3ZSd2ZSBoYWQgYW4gdW5leHBlY3RlZCBzaHV0ZG93biwgc28gZXJyb3JcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBzaHV0ZG93bicpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgQi5DYW5jZWxsYXRpb25FcnJvcikge1xuICAgICAgICAvLyBpZiB3ZSBjYW5jZWxsZWQgdGhlIHVuZXhwZWN0ZWQgc2h1dGRvd24gcHJvbWlzZSwgdGhhdCBtZWFucyB3ZVxuICAgICAgICAvLyBubyBsb25nZXIgY2FyZSBhYm91dCBpdCwgYW5kIGNhbiBzYWZlbHkgaWdub3JlIGl0XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZy53YXJuKGBDbG9zaW5nIHNlc3Npb24sIGNhdXNlIHdhcyAnJHtlLm1lc3NhZ2V9J2ApO1xuICAgICAgbG9nLmluZm8oYFJlbW92aW5nIHNlc3Npb24gJHtpbm5lclNlc3Npb25JZH0gZnJvbSBvdXIgbWFzdGVyIHNlc3Npb24gbGlzdGApO1xuICAgICAgYXdhaXQgc2Vzc2lvbnNMaXN0R3VhcmQuYWNxdWlyZShBcHBpdW1Ecml2ZXIubmFtZSwgKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy5zZXNzaW9uc1tpbm5lclNlc3Npb25JZF07XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjdXJTZXNzaW9uRGF0YUZvckRyaXZlciAoSW5uZXJEcml2ZXIpIHtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGF3YWl0IHNlc3Npb25zTGlzdEd1YXJkLmFjcXVpcmUoQXBwaXVtRHJpdmVyLm5hbWUsICgpID0+IHRoaXMuc2Vzc2lvbnMpO1xuICAgIGNvbnN0IGRhdGEgPSBfLnZhbHVlcyhzZXNzaW9ucylcbiAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChzKSA9PiBzLmNvbnN0cnVjdG9yLm5hbWUgPT09IElubmVyRHJpdmVyLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgLm1hcCgocykgPT4gcy5kcml2ZXJEYXRhKTtcbiAgICBmb3IgKGxldCBkYXR1bSBvZiBkYXRhKSB7XG4gICAgICBpZiAoIWRhdHVtKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUHJvYmxlbSBnZXR0aW5nIHNlc3Npb24gZGF0YSBmb3IgZHJpdmVyIHR5cGUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgJHtJbm5lckRyaXZlci5uYW1lfTsgZG9lcyBpdCBpbXBsZW1lbnQgJ2dldCBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGBkcml2ZXJEYXRhJz9gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBhc3luYyBkZWxldGVTZXNzaW9uIChzZXNzaW9uSWQpIHtcbiAgICBsZXQgcHJvdG9jb2w7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBvdGhlclNlc3Npb25zRGF0YSA9IG51bGw7XG4gICAgICBsZXQgZHN0U2Vzc2lvbiA9IG51bGw7XG4gICAgICBhd2FpdCBzZXNzaW9uc0xpc3RHdWFyZC5hY3F1aXJlKEFwcGl1bURyaXZlci5uYW1lLCAoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zZXNzaW9uc1tzZXNzaW9uSWRdKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1ckNvbnN0cnVjdG9yTmFtZSA9IHRoaXMuc2Vzc2lvbnNbc2Vzc2lvbklkXS5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICBvdGhlclNlc3Npb25zRGF0YSA9IF8udG9QYWlycyh0aGlzLnNlc3Npb25zKVxuICAgICAgICAgICAgICAuZmlsdGVyKChba2V5LCB2YWx1ZV0pID0+IHZhbHVlLmNvbnN0cnVjdG9yLm5hbWUgPT09IGN1ckNvbnN0cnVjdG9yTmFtZSAmJiBrZXkgIT09IHNlc3Npb25JZClcbiAgICAgICAgICAgICAgLm1hcCgoWywgdmFsdWVdKSA9PiB2YWx1ZS5kcml2ZXJEYXRhKTtcbiAgICAgICAgZHN0U2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbnNbc2Vzc2lvbklkXTtcbiAgICAgICAgcHJvdG9jb2wgPSBkc3RTZXNzaW9uLnByb3RvY29sO1xuICAgICAgICBsb2cuaW5mbyhgUmVtb3Zpbmcgc2Vzc2lvbiAke3Nlc3Npb25JZH0gZnJvbSBvdXIgbWFzdGVyIHNlc3Npb24gbGlzdGApO1xuICAgICAgICAvLyByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIGRlbGV0ZVNlc3Npb24gY29tcGxldGVzIHN1Y2Nlc3NmdWxseSBvciBub3RcbiAgICAgICAgLy8gbWFrZSB0aGUgc2Vzc2lvbiB1bmF2YWlsYWJsZSwgYmVjYXVzZSB3aG8ga25vd3Mgd2hhdCBzdGF0ZSBpdCBtaWdodFxuICAgICAgICAvLyBiZSBpbiBvdGhlcndpc2VcbiAgICAgICAgZGVsZXRlIHRoaXMuc2Vzc2lvbnNbc2Vzc2lvbklkXTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcHJvdG9jb2wsXG4gICAgICAgIHZhbHVlOiBhd2FpdCBkc3RTZXNzaW9uLmRlbGV0ZVNlc3Npb24oc2Vzc2lvbklkLCBvdGhlclNlc3Npb25zRGF0YSksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZy5lcnJvcihgSGFkIHRyb3VibGUgZW5kaW5nIHNlc3Npb24gJHtzZXNzaW9uSWR9OiAke2UubWVzc2FnZX1gKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByb3RvY29sLFxuICAgICAgICBlcnJvcjogZSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZUNvbW1hbmQgKGNtZCwgLi4uYXJncykge1xuICAgIC8vIGdldFN0YXR1cyBjb21tYW5kIHNob3VsZCBub3QgYmUgcHV0IGludG8gcXVldWUuIElmIHdlIGRvIGl0IGFzIHBhcnQgb2Ygc3VwZXIuZXhlY3V0ZUNvbW1hbmQsIGl0IHdpbGwgYmUgYWRkZWQgdG8gcXVldWUuXG4gICAgLy8gVGhlcmUgd2lsbCBiZSBsb3Qgb2Ygc3RhdHVzIGNvbW1hbmRzIGluIHF1ZXVlIGR1cmluZyBjcmVhdGVTZXNzaW9uIGNvbW1hbmQsIGFzIGNyZWF0ZVNlc3Npb24gY2FuIHRha2UgdXAgdG8gb3IgbW9yZSB0aGFuIGEgbWludXRlLlxuICAgIGlmIChjbWQgPT09ICdnZXRTdGF0dXMnKSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRTdGF0dXMoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNBcHBpdW1Ecml2ZXJDb21tYW5kKGNtZCkpIHtcbiAgICAgIHJldHVybiBhd2FpdCBzdXBlci5leGVjdXRlQ29tbWFuZChjbWQsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIGNvbnN0IHNlc3Npb25JZCA9IF8ubGFzdChhcmdzKTtcbiAgICBjb25zdCBkc3RTZXNzaW9uID0gYXdhaXQgc2Vzc2lvbnNMaXN0R3VhcmQuYWNxdWlyZShBcHBpdW1Ecml2ZXIubmFtZSwgKCkgPT4gdGhpcy5zZXNzaW9uc1tzZXNzaW9uSWRdKTtcbiAgICBpZiAoIWRzdFNlc3Npb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHNlc3Npb24gd2l0aCBpZCAnJHtzZXNzaW9uSWR9JyBkb2VzIG5vdCBleGlzdGApO1xuICAgIH1cblxuICAgIGxldCByZXMgPSB7XG4gICAgICBwcm90b2NvbDogZHN0U2Vzc2lvbi5wcm90b2NvbFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgcmVzLnZhbHVlID0gYXdhaXQgZHN0U2Vzc2lvbi5leGVjdXRlQ29tbWFuZChjbWQsIC4uLmFyZ3MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJlcy5lcnJvciA9IGU7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBwcm94eUFjdGl2ZSAoc2Vzc2lvbklkKSB7XG4gICAgY29uc3QgZHN0U2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbnNbc2Vzc2lvbklkXTtcbiAgICByZXR1cm4gZHN0U2Vzc2lvbiAmJiBfLmlzRnVuY3Rpb24oZHN0U2Vzc2lvbi5wcm94eUFjdGl2ZSkgJiYgZHN0U2Vzc2lvbi5wcm94eUFjdGl2ZShzZXNzaW9uSWQpO1xuICB9XG5cbiAgZ2V0UHJveHlBdm9pZExpc3QgKHNlc3Npb25JZCkge1xuICAgIGNvbnN0IGRzdFNlc3Npb24gPSB0aGlzLnNlc3Npb25zW3Nlc3Npb25JZF07XG4gICAgcmV0dXJuIGRzdFNlc3Npb24gPyBkc3RTZXNzaW9uLmdldFByb3h5QXZvaWRMaXN0KCkgOiBbXTtcbiAgfVxuXG4gIGNhblByb3h5IChzZXNzaW9uSWQpIHtcbiAgICBjb25zdCBkc3RTZXNzaW9uID0gdGhpcy5zZXNzaW9uc1tzZXNzaW9uSWRdO1xuICAgIHJldHVybiBkc3RTZXNzaW9uICYmIGRzdFNlc3Npb24uY2FuUHJveHkoc2Vzc2lvbklkKTtcbiAgfVxufVxuXG4vLyBoZWxwIGRlY2lkZSB3aGljaCBjb21tYW5kcyBzaG91bGQgYmUgcHJveGllZCB0byBzdWItZHJpdmVycyBhbmQgd2hpY2hcbi8vIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHRoaXMsIG91ciB1bWJyZWxsYSBkcml2ZXJcbmZ1bmN0aW9uIGlzQXBwaXVtRHJpdmVyQ29tbWFuZCAoY21kKSB7XG4gIHJldHVybiAhaXNTZXNzaW9uQ29tbWFuZChjbWQpIHx8IGNtZCA9PT0gXCJkZWxldGVTZXNzaW9uXCI7XG59XG5cbmV4cG9ydCB7IEFwcGl1bURyaXZlciB9O1xuIl0sImZpbGUiOiJsaWIvYXBwaXVtLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
