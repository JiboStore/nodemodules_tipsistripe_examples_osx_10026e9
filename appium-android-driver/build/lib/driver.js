"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AndroidDriver = void 0;

require("source-map-support/register");

var _appiumBaseDriver = require("appium-base-driver");

var _desiredCaps = _interopRequireDefault(require("./desired-caps"));

var _index = _interopRequireDefault(require("./commands/index"));

var _androidHelpers = require("./android-helpers");

var _logger = _interopRequireDefault(require("./logger"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumAdb = require("appium-adb");

var _appiumSupport = require("appium-support");

var _asyncbox = require("asyncbox");

var _sharedPreferencesBuilder = require("shared-preferences-builder");

var _bluebird = _interopRequireDefault(require("bluebird"));

const APP_EXTENSION = '.apk';
const DEVICE_PORT = 4724;
const NO_PROXY = [['POST', new RegExp('^/session/[^/]+/context')], ['GET', new RegExp('^/session/[^/]+/context')], ['POST', new RegExp('^/session/[^/]+/appium')], ['GET', new RegExp('^/session/[^/]+/appium')], ['POST', new RegExp('^/session/[^/]+/touch/perform')], ['POST', new RegExp('^/session/[^/]+/touch/multi/perform')], ['POST', new RegExp('^/session/[^/]+/orientation')], ['GET', new RegExp('^/session/[^/]+/orientation')], ['POST', new RegExp('^/session/[^/]+/execute')], ['POST', new RegExp('^/session/[^/]+/execute/sync')], ['GET', new RegExp('^/session/[^/]+/network_connection')], ['POST', new RegExp('^/session/[^/]+/network_connection')]];

class AndroidDriver extends _appiumBaseDriver.BaseDriver {
  constructor(opts = {}, shouldValidateCaps = true) {
    super(opts, shouldValidateCaps);
    this.locatorStrategies = ['xpath', 'id', 'class name', 'accessibility id', '-android uiautomator'];
    this.desiredCapConstraints = _desiredCaps.default;
    this.sessionChromedrivers = {};
    this.jwpProxyActive = false;
    this.jwpProxyAvoid = _lodash.default.clone(NO_PROXY);
    this.settings = new _appiumBaseDriver.DeviceSettings({
      ignoreUnimportantViews: false
    }, this.onSettingsUpdate.bind(this));
    this.chromedriver = null;
    this.apkStrings = {};
    this.unlocker = _androidHelpers.helpers.unlocker;

    for (let [cmd, fn] of _lodash.default.toPairs(_index.default)) {
      AndroidDriver.prototype[cmd] = fn;
    }

    this.curContext = this.defaultContextName();
  }

  async createSession(...args) {
    try {
      let [sessionId, caps] = await super.createSession(...args);
      let serverDetails = {
        platform: 'LINUX',
        webStorageEnabled: false,
        takesScreenshot: true,
        javascriptEnabled: true,
        databaseEnabled: false,
        networkConnectionEnabled: true,
        locationContextEnabled: false,
        warnings: {},
        desired: this.caps
      };
      this.caps = Object.assign(serverDetails, this.caps);
      let defaultOpts = {
        action: 'android.intent.action.MAIN',
        category: 'android.intent.category.LAUNCHER',
        flags: '0x10200000',
        disableAndroidWatchers: false,
        tmpDir: await _appiumSupport.tempDir.staticDir(),
        fullReset: false,
        autoLaunch: true,
        adbPort: _appiumAdb.DEFAULT_ADB_PORT,
        bootstrapPort: DEVICE_PORT,
        androidInstallTimeout: 90000
      };

      _lodash.default.defaults(this.opts, defaultOpts);

      this.useUnlockHelperApp = _lodash.default.isUndefined(this.caps.unlockType);

      if (this.opts.noReset === true) {
        this.opts.fullReset = false;
      }

      if (this.opts.fullReset === true) {
        this.opts.noReset = false;
      }

      this.opts.fastReset = !this.opts.fullReset && !this.opts.noReset;
      this.opts.skipUninstall = this.opts.fastReset || this.opts.noReset;

      if (this.isChromeSession) {
        _logger.default.info("We're going to run a Chrome-based session");

        let {
          pkg,
          activity
        } = _androidHelpers.helpers.getChromePkg(this.opts.browserName);

        this.opts.appPackage = pkg;
        this.opts.appActivity = activity;

        _logger.default.info(`Chrome-type package and activity are ${pkg} and ${activity}`);
      }

      if (this.opts.nativeWebScreenshot) {
        this.jwpProxyAvoid.push(['GET', new RegExp('^/session/[^/]+/screenshot')]);
      }

      if (this.opts.reboot) {
        this.setAvdFromCapabilities(caps);
      }

      let {
        udid,
        emPort
      } = await _androidHelpers.helpers.getDeviceInfoFromCaps(this.opts);
      this.opts.udid = udid;
      this.opts.emPort = emPort;
      this.adb = await _androidHelpers.helpers.createADB({
        udid: this.opts.udid,
        emPort: this.opts.emPort,
        adbPort: this.opts.adbPort,
        suppressKillServer: this.opts.suppressKillServer,
        remoteAdbHost: this.opts.remoteAdbHost,
        clearDeviceLogsOnStart: this.opts.clearDeviceLogsOnStart,
        adbExecTimeout: this.opts.adbExecTimeout
      });

      if ((await this.adb.getApiLevel()) >= 23) {
        _logger.default.warn("Consider setting 'automationName' capability to " + "'uiautomator2' on Android >= 6, since UIAutomator framework " + 'is not maintained anymore by the OS vendor.');
      }

      if (this.helpers.isPackageOrBundle(this.opts.app)) {
        this.opts.appPackage = this.opts.app;
        this.opts.app = null;
      }

      if (this.opts.app) {
        this.opts.app = await this.helpers.configureApp(this.opts.app, APP_EXTENSION);
        this.opts.appIsTemp = this.opts.app && (await _appiumSupport.fs.exists(this.opts.app)) && !(await _appiumSupport.util.isSameDestination(caps.app, this.opts.app));
        await this.checkAppPresent();
      } else if (this.appOnDevice) {
        _logger.default.info(`App file was not listed, instead we're going to run ` + `${this.opts.appPackage} directly on the device`);

        await this.checkPackagePresent();
      }

      if (_appiumSupport.util.hasValue(this.opts.networkSpeed)) {
        if (!this.isEmulator()) {
          _logger.default.warn('Sorry, networkSpeed capability is only available for emulators');
        } else {
          let networkSpeed = _androidHelpers.helpers.ensureNetworkSpeed(this.adb, this.opts.networkSpeed);

          await this.adb.networkSpeed(networkSpeed);
        }
      }

      if (_appiumSupport.util.hasValue(this.opts.gpsEnabled)) {
        if (this.isEmulator()) {
          _logger.default.info(`Trying to ${this.opts.gpsEnabled ? 'enable' : 'disable'} gps location provider`);

          await this.adb.toggleGPSLocationProvider(this.opts.gpsEnabled);
        } else {
          _logger.default.warn('Sorry! gpsEnabled capability is only available for emulators');
        }
      }

      await this.startAndroidSession(this.opts);
      return [sessionId, this.caps];
    } catch (e) {
      try {
        await this.deleteSession();
      } catch (ign) {}

      throw e;
    }
  }

  isEmulator() {
    return !!(this.opts.avd || /emulator/.test(this.opts.udid));
  }

  setAvdFromCapabilities(caps) {
    if (this.opts.avd) {
      _logger.default.info('avd name defined, ignoring device name and platform version');
    } else {
      if (!caps.deviceName) {
        _logger.default.errorAndThrow('avd or deviceName should be specified when reboot option is enables');
      }

      if (!caps.platformVersion) {
        _logger.default.errorAndThrow('avd or platformVersion should be specified when reboot option is enabled');
      }

      let avdDevice = caps.deviceName.replace(/[^a-zA-Z0-9_.]/g, '-');
      this.opts.avd = `${avdDevice}__${caps.platformVersion}`;
    }
  }

  get appOnDevice() {
    return this.helpers.isPackageOrBundle(this.opts.app) || !this.opts.app && this.helpers.isPackageOrBundle(this.opts.appPackage);
  }

  get isChromeSession() {
    return _androidHelpers.helpers.isChromeBrowser(this.opts.browserName);
  }

  async onSettingsUpdate(key, value) {
    if (key === 'ignoreUnimportantViews') {
      await this.setCompressedLayoutHierarchy(value);
    }
  }

  async startAndroidSession() {
    _logger.default.info(`Starting Android session`);

    this.defaultIME = await _androidHelpers.helpers.initDevice(this.adb, this.opts);
    this.caps.deviceName = this.adb.curDeviceId;
    this.caps.deviceUDID = this.opts.udid;
    this.caps.platformVersion = await this.adb.getPlatformVersion();
    this.caps.deviceScreenSize = await this.adb.getScreenSize();
    this.caps.deviceModel = await this.adb.getModel();
    this.caps.deviceManufacturer = await this.adb.getManufacturer();

    if (this.opts.disableWindowAnimation) {
      if (await this.adb.isAnimationOn()) {
        if ((await this.adb.getApiLevel()) >= 28) {
          _logger.default.warn('Relaxing hidden api policy to manage animation scale');

          await this.adb.setHiddenApiPolicy('1');
        }

        _logger.default.info('Disabling window animation as it is requested by "disableWindowAnimation" capability');

        await this.adb.setAnimationState(false);
        this._wasWindowAnimationDisabled = true;
      } else {
        _logger.default.info('Window animation is already disabled');
      }
    }

    if (this.opts.autoLaunch) {
      await this.initAUT();
    }

    this.bootstrap = new _androidHelpers.helpers.bootstrap(this.adb, this.opts.bootstrapPort, this.opts.websocket);
    await this.bootstrap.start(this.opts.appPackage, this.opts.disableAndroidWatchers, this.opts.acceptSslCerts);
    this.bootstrap.onUnexpectedShutdown.catch(async err => {
      if (!this.bootstrap.ignoreUnexpectedShutdown) {
        await this.startUnexpectedShutdown(err);
      }
    });

    if (!this.opts.skipUnlock) {
      await _androidHelpers.helpers.unlock(this, this.adb, this.caps);
    }

    if (this.opts.ignoreUnimportantViews) {
      await this.settings.update({
        ignoreUnimportantViews: this.opts.ignoreUnimportantViews
      });
    }

    if (this.isChromeSession) {
      await this.startChromeSession();
    } else {
      if (this.opts.autoLaunch) {
        await this.startAUT();
      }
    }

    if (_appiumSupport.util.hasValue(this.opts.orientation)) {
      _logger.default.debug(`Setting initial orientation to '${this.opts.orientation}'`);

      await this.setOrientation(this.opts.orientation);
    }

    await this.initAutoWebview();
  }

  async initAutoWebview() {
    if (this.opts.autoWebview) {
      let viewName = this.defaultWebviewName();
      let timeout = this.opts.autoWebviewTimeout || 2000;

      _logger.default.info(`Setting auto webview to context '${viewName}' with timeout ${timeout}ms`);

      await (0, _asyncbox.retryInterval)(timeout / 500, 500, async () => {
        await this.setContext(viewName);
      });
    }
  }

  async initAUT() {
    let launchInfo = await _androidHelpers.helpers.getLaunchInfo(this.adb, this.opts);
    Object.assign(this.opts, launchInfo);
    Object.assign(this.caps, launchInfo);

    if (this.opts.uninstallOtherPackages) {
      _androidHelpers.helpers.validateDesiredCaps(this.opts);

      await _androidHelpers.helpers.uninstallOtherPackages(this.adb, _androidHelpers.helpers.parseArray(this.opts.uninstallOtherPackages), [_androidHelpers.SETTINGS_HELPER_PKG_ID]);
    }

    if (this.opts.otherApps) {
      let otherApps;

      try {
        otherApps = _androidHelpers.helpers.parseArray(this.opts.otherApps);
      } catch (e) {
        _logger.default.errorAndThrow(`Could not parse "otherApps" capability: ${e.message}`);
      }

      otherApps = await _bluebird.default.all(otherApps.map(app => this.helpers.configureApp(app, APP_EXTENSION)));
      await _androidHelpers.helpers.installOtherApks(otherApps, this.adb, this.opts);
    }

    if (!this.opts.app) {
      if (this.opts.fullReset) {
        _logger.default.errorAndThrow('Full reset requires an app capability, use fastReset if app is not provided');
      }

      _logger.default.debug('No app capability. Assuming it is already on the device');

      if (this.opts.fastReset) {
        await _androidHelpers.helpers.resetApp(this.adb, this.opts);
      }

      return;
    }

    if (!this.opts.skipUninstall) {
      await this.adb.uninstallApk(this.opts.appPackage);
    }

    await _androidHelpers.helpers.installApk(this.adb, this.opts);
    const apkStringsForLanguage = await _androidHelpers.helpers.pushStrings(this.opts.language, this.adb, this.opts);

    if (this.opts.language) {
      this.apkStrings[this.opts.language] = apkStringsForLanguage;
    }

    if (!_lodash.default.isUndefined(this.opts.sharedPreferences)) {
      await this.setSharedPreferences(this.opts);
    }
  }

  async checkAppPresent() {
    _logger.default.debug('Checking whether app is actually present');

    if (!(await _appiumSupport.fs.exists(this.opts.app))) {
      _logger.default.errorAndThrow(`Could not find app apk at ${this.opts.app}`);
    }
  }

  async checkPackagePresent() {
    _logger.default.debug('Checking whether package is present on the device');

    if (!(await this.adb.shell(['pm', 'list', 'packages', this.opts.appPackage]))) {
      _logger.default.errorAndThrow(`Could not find package ${this.opts.appPackage} on the device`);
    }
  }

  async setCompressedLayoutHierarchy(compress) {
    await this.bootstrap.sendAction('compressedLayoutHierarchy', {
      compressLayout: compress
    });
  }

  async deleteSession() {
    _logger.default.debug('Shutting down Android driver');

    await _androidHelpers.helpers.removeAllSessionWebSocketHandlers(this.server, this.sessionId);
    await super.deleteSession();

    if (this.bootstrap) {
      await this.stopChromedriverProxies();

      if (this.opts.unicodeKeyboard && this.opts.resetKeyboard && this.defaultIME) {
        _logger.default.debug(`Resetting IME to ${this.defaultIME}`);

        await this.adb.setIME(this.defaultIME);
      }

      if (!this.isChromeSession && !this.opts.dontStopAppOnReset) {
        await this.adb.forceStop(this.opts.appPackage);
      }

      await this.adb.goToHome();

      if (this.opts.fullReset && !this.opts.skipUninstall && !this.appOnDevice) {
        await this.adb.uninstallApk(this.opts.appPackage);
      }

      await this.bootstrap.shutdown();
      this.bootstrap = null;
    } else {
      _logger.default.debug("Called deleteSession but bootstrap wasn't active");
    }

    await this.adb.stopLogcat();

    if (this.useUnlockHelperApp) {
      await this.adb.forceStop('io.appium.unlock');
    }

    if (this._wasWindowAnimationDisabled) {
      _logger.default.info('Restoring window animation state');

      await this.adb.setAnimationState(true);

      if ((await this.adb.getApiLevel()) >= 28) {
        _logger.default.info('Restoring hidden api policy to the device default configuration');

        await this.adb.setDefaultHiddenApiPolicy();
      }
    }

    if (this.opts.reboot) {
      let avdName = this.opts.avd.replace('@', '');

      _logger.default.debug(`closing emulator '${avdName}'`);

      await this.adb.killEmulator(avdName);
    }

    if (this.opts.clearSystemFiles) {
      if (this.opts.appIsTemp) {
        _logger.default.debug(`Temporary copy of app was made: deleting '${this.opts.app}'`);

        try {
          await _appiumSupport.fs.rimraf(this.opts.app);
        } catch (err) {
          _logger.default.warn(`Unable to delete temporary app: ${err.message}`);
        }
      } else {
        _logger.default.debug('App was not copied, so not deleting');
      }
    } else {
      _logger.default.debug('Not cleaning generated files. Add `clearSystemFiles` capability if wanted.');
    }
  }

  async setSharedPreferences() {
    let sharedPrefs = this.opts.sharedPreferences;

    _logger.default.info('Trying to set shared preferences');

    let name = sharedPrefs.name;

    if (_lodash.default.isUndefined(name)) {
      _logger.default.warn(`Skipping setting Shared preferences, name is undefined: ${JSON.stringify(sharedPrefs)}`);

      return false;
    }

    let remotePath = `/data/data/${this.opts.appPackage}/shared_prefs`;
    let remoteFile = `${remotePath}/${name}.xml`;
    let localPath = `/tmp/${name}.xml`;
    let builder = this.getPrefsBuilder();
    builder.build(sharedPrefs.prefs);

    _logger.default.info(`Creating temporary shared preferences: ${localPath}`);

    builder.toFile(localPath);

    _logger.default.info(`Creating shared_prefs remote folder: ${remotePath}`);

    await this.adb.shell(['mkdir', '-p', remotePath]);

    _logger.default.info(`Pushing shared_prefs to ${remoteFile}`);

    await this.adb.push(localPath, remoteFile);

    try {
      _logger.default.info(`Trying to remove shared preferences temporary file`);

      if (await _appiumSupport.fs.exists(localPath)) {
        await _appiumSupport.fs.unlink(localPath);
      }
    } catch (e) {
      _logger.default.warn(`Error trying to remove temporary file ${localPath}`);
    }

    return true;
  }

  getPrefsBuilder() {
    return new _sharedPreferencesBuilder.SharedPrefsBuilder();
  }

  validateDesiredCaps(caps) {
    if (!super.validateDesiredCaps(caps)) {
      return false;
    }

    if ((!caps.browserName || !_androidHelpers.helpers.isChromeBrowser(caps.browserName)) && !caps.app && !caps.appPackage) {
      _logger.default.errorAndThrow('The desired capabilities must include either an app, appPackage or browserName');
    }

    return _androidHelpers.helpers.validateDesiredCaps(caps);
  }

  proxyActive(sessionId) {
    super.proxyActive(sessionId);
    return this.jwpProxyActive;
  }

  getProxyAvoidList(sessionId) {
    super.getProxyAvoidList(sessionId);
    return this.jwpProxyAvoid;
  }

  canProxy(sessionId) {
    super.canProxy(sessionId);
    return _lodash.default.isFunction(this.proxyReqRes);
  }

}

exports.AndroidDriver = AndroidDriver;
var _default = AndroidDriver;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kcml2ZXIuanMiXSwibmFtZXMiOlsiQVBQX0VYVEVOU0lPTiIsIkRFVklDRV9QT1JUIiwiTk9fUFJPWFkiLCJSZWdFeHAiLCJBbmRyb2lkRHJpdmVyIiwiQmFzZURyaXZlciIsImNvbnN0cnVjdG9yIiwib3B0cyIsInNob3VsZFZhbGlkYXRlQ2FwcyIsImxvY2F0b3JTdHJhdGVnaWVzIiwiZGVzaXJlZENhcENvbnN0cmFpbnRzIiwiZGVzaXJlZENvbnN0cmFpbnRzIiwic2Vzc2lvbkNocm9tZWRyaXZlcnMiLCJqd3BQcm94eUFjdGl2ZSIsImp3cFByb3h5QXZvaWQiLCJfIiwiY2xvbmUiLCJzZXR0aW5ncyIsIkRldmljZVNldHRpbmdzIiwiaWdub3JlVW5pbXBvcnRhbnRWaWV3cyIsIm9uU2V0dGluZ3NVcGRhdGUiLCJiaW5kIiwiY2hyb21lZHJpdmVyIiwiYXBrU3RyaW5ncyIsInVubG9ja2VyIiwiaGVscGVycyIsImNtZCIsImZuIiwidG9QYWlycyIsImNvbW1hbmRzIiwicHJvdG90eXBlIiwiY3VyQ29udGV4dCIsImRlZmF1bHRDb250ZXh0TmFtZSIsImNyZWF0ZVNlc3Npb24iLCJhcmdzIiwic2Vzc2lvbklkIiwiY2FwcyIsInNlcnZlckRldGFpbHMiLCJwbGF0Zm9ybSIsIndlYlN0b3JhZ2VFbmFibGVkIiwidGFrZXNTY3JlZW5zaG90IiwiamF2YXNjcmlwdEVuYWJsZWQiLCJkYXRhYmFzZUVuYWJsZWQiLCJuZXR3b3JrQ29ubmVjdGlvbkVuYWJsZWQiLCJsb2NhdGlvbkNvbnRleHRFbmFibGVkIiwid2FybmluZ3MiLCJkZXNpcmVkIiwiT2JqZWN0IiwiYXNzaWduIiwiZGVmYXVsdE9wdHMiLCJhY3Rpb24iLCJjYXRlZ29yeSIsImZsYWdzIiwiZGlzYWJsZUFuZHJvaWRXYXRjaGVycyIsInRtcERpciIsInRlbXBEaXIiLCJzdGF0aWNEaXIiLCJmdWxsUmVzZXQiLCJhdXRvTGF1bmNoIiwiYWRiUG9ydCIsIkRFRkFVTFRfQURCX1BPUlQiLCJib290c3RyYXBQb3J0IiwiYW5kcm9pZEluc3RhbGxUaW1lb3V0IiwiZGVmYXVsdHMiLCJ1c2VVbmxvY2tIZWxwZXJBcHAiLCJpc1VuZGVmaW5lZCIsInVubG9ja1R5cGUiLCJub1Jlc2V0IiwiZmFzdFJlc2V0Iiwic2tpcFVuaW5zdGFsbCIsImlzQ2hyb21lU2Vzc2lvbiIsImxvZyIsImluZm8iLCJwa2ciLCJhY3Rpdml0eSIsImdldENocm9tZVBrZyIsImJyb3dzZXJOYW1lIiwiYXBwUGFja2FnZSIsImFwcEFjdGl2aXR5IiwibmF0aXZlV2ViU2NyZWVuc2hvdCIsInB1c2giLCJyZWJvb3QiLCJzZXRBdmRGcm9tQ2FwYWJpbGl0aWVzIiwidWRpZCIsImVtUG9ydCIsImdldERldmljZUluZm9Gcm9tQ2FwcyIsImFkYiIsImNyZWF0ZUFEQiIsInN1cHByZXNzS2lsbFNlcnZlciIsInJlbW90ZUFkYkhvc3QiLCJjbGVhckRldmljZUxvZ3NPblN0YXJ0IiwiYWRiRXhlY1RpbWVvdXQiLCJnZXRBcGlMZXZlbCIsIndhcm4iLCJpc1BhY2thZ2VPckJ1bmRsZSIsImFwcCIsImNvbmZpZ3VyZUFwcCIsImFwcElzVGVtcCIsImZzIiwiZXhpc3RzIiwidXRpbCIsImlzU2FtZURlc3RpbmF0aW9uIiwiY2hlY2tBcHBQcmVzZW50IiwiYXBwT25EZXZpY2UiLCJjaGVja1BhY2thZ2VQcmVzZW50IiwiaGFzVmFsdWUiLCJuZXR3b3JrU3BlZWQiLCJpc0VtdWxhdG9yIiwiZW5zdXJlTmV0d29ya1NwZWVkIiwiZ3BzRW5hYmxlZCIsInRvZ2dsZUdQU0xvY2F0aW9uUHJvdmlkZXIiLCJzdGFydEFuZHJvaWRTZXNzaW9uIiwiZSIsImRlbGV0ZVNlc3Npb24iLCJpZ24iLCJhdmQiLCJ0ZXN0IiwiZGV2aWNlTmFtZSIsImVycm9yQW5kVGhyb3ciLCJwbGF0Zm9ybVZlcnNpb24iLCJhdmREZXZpY2UiLCJyZXBsYWNlIiwiaXNDaHJvbWVCcm93c2VyIiwia2V5IiwidmFsdWUiLCJzZXRDb21wcmVzc2VkTGF5b3V0SGllcmFyY2h5IiwiZGVmYXVsdElNRSIsImluaXREZXZpY2UiLCJjdXJEZXZpY2VJZCIsImRldmljZVVESUQiLCJnZXRQbGF0Zm9ybVZlcnNpb24iLCJkZXZpY2VTY3JlZW5TaXplIiwiZ2V0U2NyZWVuU2l6ZSIsImRldmljZU1vZGVsIiwiZ2V0TW9kZWwiLCJkZXZpY2VNYW51ZmFjdHVyZXIiLCJnZXRNYW51ZmFjdHVyZXIiLCJkaXNhYmxlV2luZG93QW5pbWF0aW9uIiwiaXNBbmltYXRpb25PbiIsInNldEhpZGRlbkFwaVBvbGljeSIsInNldEFuaW1hdGlvblN0YXRlIiwiX3dhc1dpbmRvd0FuaW1hdGlvbkRpc2FibGVkIiwiaW5pdEFVVCIsImJvb3RzdHJhcCIsIndlYnNvY2tldCIsInN0YXJ0IiwiYWNjZXB0U3NsQ2VydHMiLCJvblVuZXhwZWN0ZWRTaHV0ZG93biIsImNhdGNoIiwiZXJyIiwiaWdub3JlVW5leHBlY3RlZFNodXRkb3duIiwic3RhcnRVbmV4cGVjdGVkU2h1dGRvd24iLCJza2lwVW5sb2NrIiwidW5sb2NrIiwidXBkYXRlIiwic3RhcnRDaHJvbWVTZXNzaW9uIiwic3RhcnRBVVQiLCJvcmllbnRhdGlvbiIsImRlYnVnIiwic2V0T3JpZW50YXRpb24iLCJpbml0QXV0b1dlYnZpZXciLCJhdXRvV2VidmlldyIsInZpZXdOYW1lIiwiZGVmYXVsdFdlYnZpZXdOYW1lIiwidGltZW91dCIsImF1dG9XZWJ2aWV3VGltZW91dCIsInNldENvbnRleHQiLCJsYXVuY2hJbmZvIiwiZ2V0TGF1bmNoSW5mbyIsInVuaW5zdGFsbE90aGVyUGFja2FnZXMiLCJ2YWxpZGF0ZURlc2lyZWRDYXBzIiwicGFyc2VBcnJheSIsIlNFVFRJTkdTX0hFTFBFUl9QS0dfSUQiLCJvdGhlckFwcHMiLCJtZXNzYWdlIiwiQiIsImFsbCIsIm1hcCIsImluc3RhbGxPdGhlckFwa3MiLCJyZXNldEFwcCIsInVuaW5zdGFsbEFwayIsImluc3RhbGxBcGsiLCJhcGtTdHJpbmdzRm9yTGFuZ3VhZ2UiLCJwdXNoU3RyaW5ncyIsImxhbmd1YWdlIiwic2hhcmVkUHJlZmVyZW5jZXMiLCJzZXRTaGFyZWRQcmVmZXJlbmNlcyIsInNoZWxsIiwiY29tcHJlc3MiLCJzZW5kQWN0aW9uIiwiY29tcHJlc3NMYXlvdXQiLCJyZW1vdmVBbGxTZXNzaW9uV2ViU29ja2V0SGFuZGxlcnMiLCJzZXJ2ZXIiLCJzdG9wQ2hyb21lZHJpdmVyUHJveGllcyIsInVuaWNvZGVLZXlib2FyZCIsInJlc2V0S2V5Ym9hcmQiLCJzZXRJTUUiLCJkb250U3RvcEFwcE9uUmVzZXQiLCJmb3JjZVN0b3AiLCJnb1RvSG9tZSIsInNodXRkb3duIiwic3RvcExvZ2NhdCIsInNldERlZmF1bHRIaWRkZW5BcGlQb2xpY3kiLCJhdmROYW1lIiwia2lsbEVtdWxhdG9yIiwiY2xlYXJTeXN0ZW1GaWxlcyIsInJpbXJhZiIsInNoYXJlZFByZWZzIiwibmFtZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZW1vdGVQYXRoIiwicmVtb3RlRmlsZSIsImxvY2FsUGF0aCIsImJ1aWxkZXIiLCJnZXRQcmVmc0J1aWxkZXIiLCJidWlsZCIsInByZWZzIiwidG9GaWxlIiwidW5saW5rIiwiU2hhcmVkUHJlZnNCdWlsZGVyIiwicHJveHlBY3RpdmUiLCJnZXRQcm94eUF2b2lkTGlzdCIsImNhblByb3h5IiwiaXNGdW5jdGlvbiIsInByb3h5UmVxUmVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLGFBQWEsR0FBRyxNQUF0QjtBQUNBLE1BQU1DLFdBQVcsR0FBRyxJQUFwQjtBQUlBLE1BQU1DLFFBQVEsR0FBRyxDQUNmLENBQUMsTUFBRCxFQUFTLElBQUlDLE1BQUosQ0FBVyx5QkFBWCxDQUFULENBRGUsRUFFZixDQUFDLEtBQUQsRUFBUSxJQUFJQSxNQUFKLENBQVcseUJBQVgsQ0FBUixDQUZlLEVBR2YsQ0FBQyxNQUFELEVBQVMsSUFBSUEsTUFBSixDQUFXLHdC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LEtBQVA7QUFDRDs7QUFDRCxRQUFJLENBQUMsQ0FBQ0EsSUFBSSxDQUFDd0MsV0FBTixJQUFxQixDQUFDbkQsd0JBQVFpRyxlQUFSLENBQXdCdEYsSUFBSSxDQUFDd0MsV0FBN0IsQ0FBdkIsS0FBcUUsQ0FBQ3hDLElBQUksQ0FBQzJELEdBQTNFLElBQWtGLENBQUMzRCxJQUFJLENBQUN5QyxVQUE1RixFQUF3RztBQUN0R04sc0JBQUkrQyxhQUFKLENBQWtCLGdGQUFsQjtBQUNEOztBQUNELFdBQU83Rix3QkFBUWlKLG1CQUFSLENBQTRCdEksSUFBNUIsQ0FBUDtBQUNEOztBQUVEeUwsRUFBQUEsV0FBVyxDQUFFMUwsU0FBRixFQUFhO0FBQ3RCLFVBQU0wTCxXQUFOLENBQWtCMUwsU0FBbEI7QUFFQSxXQUFPLEtBQUt0QixjQUFaO0FBQ0Q7O0FBRURpTixFQUFBQSxpQkFBaUIsQ0FBRTNMLFNBQUYsRUFBYTtBQUM1QixVQUFNMkwsaUJBQU4sQ0FBd0IzTCxTQUF4QjtBQUVBLFdBQU8sS0FBS3JCLGFBQVo7QUFDRDs7QUFFRGlOLEVBQUFBLFFBQVEsQ0FBRTVMLFNBQUYsRUFBYTtBQUNuQixVQUFNNEwsUUFBTixDQUFlNUwsU0FBZjtBQUdBLFdBQU9wQixnQkFBRWlOLFVBQUYsQ0FBYSxLQUFLQyxXQUFsQixDQUFQO0FBQ0Q7O0FBMWVvQzs7O2VBOGV4QjdOLGEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlRHJpdmVyLCBEZXZpY2VTZXR0aW5ncyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgZGVzaXJlZENvbnN0cmFpbnRzIGZyb20gJy4vZGVzaXJlZC1jYXBzJztcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzL2luZGV4JztcbmltcG9ydCB7IGhlbHBlcnMsIFNFVFRJTkdTX0hFTFBFUl9QS0dfSUQgfSBmcm9tICcuL2FuZHJvaWQtaGVscGVycyc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBERUZBVUxUX0FEQl9QT1JUIH0gZnJvbSAnYXBwaXVtLWFkYic7XG5pbXBvcnQgeyBmcywgdGVtcERpciwgdXRpbCB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCB7IHJldHJ5SW50ZXJ2YWwgfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgeyBTaGFyZWRQcmVmc0J1aWxkZXIgfSBmcm9tICdzaGFyZWQtcHJlZmVyZW5jZXMtYnVpbGRlcic7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0IEFQUF9FWFRFTlNJT04gPSAnLmFwayc7XG5jb25zdCBERVZJQ0VfUE9SVCA9IDQ3MjQ7XG5cbi8vIFRoaXMgaXMgYSBzZXQgb2YgbWV0aG9kcyBhbmQgcGF0aHMgdGhhdCB3ZSBuZXZlciB3YW50IHRvIHByb3h5IHRvXG4vLyBDaHJvbWVkcml2ZXJcbmNvbnN0IE5PX1BST1hZID0gW1xuICBbJ1BPU1QnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvY29udGV4dCcpXSxcbiAgWydHRVQnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvY29udGV4dCcpXSxcbiAgWydQT1NUJywgbmV3IFJlZ0V4cCgnXi9zZXNzaW9uL1teL10rL2FwcGl1bScpXSxcbiAgWydHRVQnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvYXBwaXVtJyldLFxuICBbJ1BPU1QnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvdG91Y2gvcGVyZm9ybScpXSxcbiAgWydQT1NUJywgbmV3IFJlZ0V4cCgnXi9zZXNzaW9uL1teL10rL3RvdWNoL211bHRpL3BlcmZvcm0nKV0sXG4gIFsnUE9TVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy9vcmllbnRhdGlvbicpXSxcbiAgWydHRVQnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvb3JpZW50YXRpb24nKV0sXG4gIFsnUE9TVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy9leGVjdXRlJyldLFxuICBbJ1BPU1QnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvZXhlY3V0ZS9zeW5jJyldLFxuICBbJ0dFVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy9uZXR3b3JrX2Nvbm5lY3Rpb24nKV0sXG4gIFsnUE9TVCcsIG5ldyBSZWdFeHAoJ14vc2Vzc2lvbi9bXi9dKy9uZXR3b3JrX2Nvbm5lY3Rpb24nKV0sXG5dO1xuXG5jbGFzcyBBbmRyb2lkRHJpdmVyIGV4dGVuZHMgQmFzZURyaXZlciB7XG4gIGNvbnN0cnVjdG9yIChvcHRzID0ge30sIHNob3VsZFZhbGlkYXRlQ2FwcyA9IHRydWUpIHtcbiAgICBzdXBlcihvcHRzLCBzaG91bGRWYWxpZGF0ZUNhcHMpO1xuXG4gICAgdGhpcy5sb2NhdG9yU3RyYXRlZ2llcyA9IFtcbiAgICAgICd4cGF0aCcsXG4gICAgICAnaWQnLFxuICAgICAgJ2NsYXNzIG5hbWUnLFxuICAgICAgJ2FjY2Vzc2liaWxpdHkgaWQnLFxuICAgICAgJy1hbmRyb2lkIHVpYXV0b21hdG9yJ1xuICAgIF07XG4gICAgdGhpcy5kZXNpcmVkQ2FwQ29uc3RyYWludHMgPSBkZXNpcmVkQ29uc3RyYWludHM7XG4gICAgdGhpcy5zZXNzaW9uQ2hyb21lZHJpdmVycyA9IHt9O1xuICAgIHRoaXMuandwUHJveHlBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLmp3cFByb3h5QXZvaWQgPSBfLmNsb25lKE5PX1BST1hZKTtcbiAgICB0aGlzLnNldHRpbmdzID0gbmV3IERldmljZVNldHRpbmdzKHtpZ25vcmVVbmltcG9ydGFudFZpZXdzOiBmYWxzZX0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uU2V0dGluZ3NVcGRhdGUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jaHJvbWVkcml2ZXIgPSBudWxsO1xuICAgIHRoaXMuYXBrU3RyaW5ncyA9IHt9O1xuICAgIHRoaXMudW5sb2NrZXIgPSBoZWxwZXJzLnVubG9ja2VyO1xuXG4gICAgZm9yIChsZXQgW2NtZCwgZm5dIG9mIF8udG9QYWlycyhjb21tYW5kcykpIHtcbiAgICAgIEFuZHJvaWREcml2ZXIucHJvdG90eXBlW2NtZF0gPSBmbjtcbiAgICB9XG5cbiAgICAvLyBuZWVkcyB0byBiZSBhZnRlciB0aGUgbGluZSB3aGljaCBhc3NpZ25zIGNvbW1hbmRzIHRvIEFuZHJvaWREcml2ZXIucHJvdG90eXBlLCBzbyB0aGF0IGB0aGlzLmRlZmF1bHRDb250ZXh0TmFtZWAgaXMgZGVmaW5lZC5cbiAgICB0aGlzLmN1ckNvbnRleHQgPSB0aGlzLmRlZmF1bHRDb250ZXh0TmFtZSgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU2Vzc2lvbiAoLi4uYXJncykge1xuICAgIC8vIHRoZSB3aG9sZSBjcmVhdGVTZXNzaW9uIGZsb3cgaXMgc3Vycm91bmRlZCBpbiBhIHRyeS1jYXRjaCBzdGF0ZW1lbnRcbiAgICAvLyBpZiBjcmVhdGluZyBhIHNlc3Npb24gZmFpbHMgYXQgYW55IHBvaW50LCB3ZSB0ZWFyZG93biBldmVyeXRoaW5nIHdlXG4gICAgLy8gc2V0IHVwIGJlZm9yZSB0aHJvd2luZyB0aGUgZXJyb3IuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBbc2Vzc2lvbklkLCBjYXBzXSA9IGF3YWl0IHN1cGVyLmNyZWF0ZVNlc3Npb24oLi4uYXJncyk7XG5cbiAgICAgIGxldCBzZXJ2ZXJEZXRhaWxzID0ge1xuICAgICAgICBwbGF0Zm9ybTogJ0xJTlVYJyxcbiAgICAgICAgd2ViU3RvcmFnZUVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICB0YWtlc1NjcmVlbnNob3Q6IHRydWUsXG4gICAgICAgIGphdmFzY3JpcHRFbmFibGVkOiB0cnVlLFxuICAgICAgICBkYXRhYmFzZUVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBuZXR3b3JrQ29ubmVjdGlvbkVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGxvY2F0aW9uQ29udGV4dEVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICB3YXJuaW5nczoge30sXG4gICAgICAgIGRlc2lyZWQ6IHRoaXMuY2Fwc1xuICAgICAgfTtcblxuICAgICAgdGhpcy5jYXBzID0gT2JqZWN0LmFzc2lnbihzZXJ2ZXJEZXRhaWxzLCB0aGlzLmNhcHMpO1xuXG4gICAgICAvLyBhc3NpZ25pbmcgZGVmYXVsdHNcbiAgICAgIGxldCBkZWZhdWx0T3B0cyA9IHtcbiAgICAgICAgYWN0aW9uOiAnYW5kcm9pZC5pbnRlbnQuYWN0aW9uLk1BSU4nLFxuICAgICAgICBjYXRlZ29yeTogJ2FuZHJvaWQuaW50ZW50LmNhdGVnb3J5LkxBVU5DSEVSJyxcbiAgICAgICAgZmxhZ3M6ICcweDEwMjAwMDAwJyxcbiAgICAgICAgZGlzYWJsZUFuZHJvaWRXYXRjaGVyczogZmFsc2UsXG4gICAgICAgIHRtcERpcjogYXdhaXQgdGVtcERpci5zdGF0aWNEaXIoKSxcbiAgICAgICAgZnVsbFJlc2V0OiBmYWxzZSxcbiAgICAgICAgYXV0b0xhdW5jaDogdHJ1ZSxcbiAgICAgICAgYWRiUG9ydDogREVGQVVMVF9BREJfUE9SVCxcbiAgICAgICAgYm9vdHN0cmFwUG9ydDogREVWSUNFX1BPUlQsXG4gICAgICAgIGFuZHJvaWRJbnN0YWxsVGltZW91dDogOTAwMDAsXG4gICAgICB9O1xuICAgICAgXy5kZWZhdWx0cyh0aGlzLm9wdHMsIGRlZmF1bHRPcHRzKTtcbiAgICAgIHRoaXMudXNlVW5sb2NrSGVscGVyQXBwID0gXy5pc1VuZGVmaW5lZCh0aGlzLmNhcHMudW5sb2NrVHlwZSk7XG5cbiAgICAgIC8vIG5vdCB1c2VyIHZpc2libGUgdmlhIGNhcHNcbiAgICAgIGlmICh0aGlzLm9wdHMubm9SZXNldCA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLm9wdHMuZnVsbFJlc2V0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRzLmZ1bGxSZXNldCA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLm9wdHMubm9SZXNldCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRzLmZhc3RSZXNldCA9ICF0aGlzLm9wdHMuZnVsbFJlc2V0ICYmICF0aGlzLm9wdHMubm9SZXNldDtcbiAgICAgIHRoaXMub3B0cy5za2lwVW5pbnN0YWxsID0gdGhpcy5vcHRzLmZhc3RSZXNldCB8fCB0aGlzLm9wdHMubm9SZXNldDtcblxuICAgICAgaWYgKHRoaXMuaXNDaHJvbWVTZXNzaW9uKSB7XG4gICAgICAgIGxvZy5pbmZvKFwiV2UncmUgZ29pbmcgdG8gcnVuIGEgQ2hyb21lLWJhc2VkIHNlc3Npb25cIik7XG4gICAgICAgIGxldCB7cGtnLCBhY3Rpdml0eX0gPSBoZWxwZXJzLmdldENocm9tZVBrZyh0aGlzLm9wdHMuYnJvd3Nlck5hbWUpO1xuICAgICAgICB0aGlzLm9wdHMuYXBwUGFja2FnZSA9IHBrZztcbiAgICAgICAgdGhpcy5vcHRzLmFwcEFjdGl2aXR5ID0gYWN0aXZpdHk7XG4gICAgICAgIGxvZy5pbmZvKGBDaHJvbWUtdHlwZSBwYWNrYWdlIGFuZCBhY3Rpdml0eSBhcmUgJHtwa2d9IGFuZCAke2FjdGl2aXR5fWApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vcHRzLm5hdGl2ZVdlYlNjcmVlbnNob3QpIHtcbiAgICAgICAgdGhpcy5qd3BQcm94eUF2b2lkLnB1c2goWydHRVQnLCBuZXcgUmVnRXhwKCdeL3Nlc3Npb24vW14vXSsvc2NyZWVuc2hvdCcpXSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdHMucmVib290KSB7XG4gICAgICAgIHRoaXMuc2V0QXZkRnJvbUNhcGFiaWxpdGllcyhjYXBzKTtcbiAgICAgIH1cblxuICAgICAgLy8gZ2V0IGRldmljZSB1ZGlkIGZvciB0aGlzIHNlc3Npb25cbiAgICAgIGxldCB7dWRpZCwgZW1Qb3J0fSA9IGF3YWl0IGhlbHBlcnMuZ2V0RGV2aWNlSW5mb0Zyb21DYXBzKHRoaXMub3B0cyk7XG4gICAgICB0aGlzLm9wdHMudWRpZCA9IHVkaWQ7XG4gICAgICB0aGlzLm9wdHMuZW1Qb3J0ID0gZW1Qb3J0O1xuXG4gICAgICAvLyBzZXQgdXAgYW4gaW5zdGFuY2Ugb2YgQURCXG4gICAgICB0aGlzLmFkYiA9IGF3YWl0IGhlbHBlcnMuY3JlYXRlQURCKHtcbiAgICAgICAgdWRpZDogdGhpcy5vcHRzLnVkaWQsXG4gICAgICAgIGVtUG9ydDogdGhpcy5vcHRzLmVtUG9ydCxcbiAgICAgICAgYWRiUG9ydDogdGhpcy5vcHRzLmFkYlBvcnQsXG4gICAgICAgIHN1cHByZXNzS2lsbFNlcnZlcjogdGhpcy5vcHRzLnN1cHByZXNzS2lsbFNlcnZlcixcbiAgICAgICAgcmVtb3RlQWRiSG9zdDogdGhpcy5vcHRzLnJlbW90ZUFkYkhvc3QsXG4gICAgICAgIGNsZWFyRGV2aWNlTG9nc09uU3RhcnQ6IHRoaXMub3B0cy5jbGVhckRldmljZUxvZ3NPblN0YXJ0LFxuICAgICAgICBhZGJFeGVjVGltZW91dDogdGhpcy5vcHRzLmFkYkV4ZWNUaW1lb3V0LFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChhd2FpdCB0aGlzLmFkYi5nZXRBcGlMZXZlbCgpID49IDIzKSB7XG4gICAgICAgIGxvZy53YXJuKFwiQ29uc2lkZXIgc2V0dGluZyAnYXV0b21hdGlvbk5hbWUnIGNhcGFiaWxpdHkgdG8gXCIgK1xuICAgICAgICAgIFwiJ3VpYXV0b21hdG9yMicgb24gQW5kcm9pZCA+PSA2LCBzaW5jZSBVSUF1dG9tYXRvciBmcmFtZXdvcmsgXCIgK1xuICAgICAgICAgICdpcyBub3QgbWFpbnRhaW5lZCBhbnltb3JlIGJ5IHRoZSBPUyB2ZW5kb3IuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmhlbHBlcnMuaXNQYWNrYWdlT3JCdW5kbGUodGhpcy5vcHRzLmFwcCkpIHtcbiAgICAgICAgLy8gdXNlciBwcm92aWRlZCBwYWNrYWdlIGluc3RlYWQgb2YgYXBwIGZvciAnYXBwJyBjYXBhYmlsaXR5LCBtYXNzYWdlIG9wdGlvbnNcbiAgICAgICAgdGhpcy5vcHRzLmFwcFBhY2thZ2UgPSB0aGlzLm9wdHMuYXBwO1xuICAgICAgICB0aGlzLm9wdHMuYXBwID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0cy5hcHApIHtcbiAgICAgICAgLy8gZmluZCBhbmQgY29weSwgb3IgZG93bmxvYWQgYW5kIHVuemlwIGFuIGFwcCB1cmwgb3IgcGF0aFxuICAgICAgICB0aGlzLm9wdHMuYXBwID0gYXdhaXQgdGhpcy5oZWxwZXJzLmNvbmZpZ3VyZUFwcCh0aGlzLm9wdHMuYXBwLCBBUFBfRVhURU5TSU9OKTtcbiAgICAgICAgdGhpcy5vcHRzLmFwcElzVGVtcCA9IHRoaXMub3B0cy5hcHAgJiYgYXdhaXQgZnMuZXhpc3RzKHRoaXMub3B0cy5hcHApXG4gICAgICAgICAgJiYgIWF3YWl0IHV0aWwuaXNTYW1lRGVzdGluYXRpb24oY2Fwcy5hcHAsIHRoaXMub3B0cy5hcHApO1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrQXBwUHJlc2VudCgpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmFwcE9uRGV2aWNlKSB7XG4gICAgICAgIC8vIHRoZSBhcHAgaXNuJ3QgYW4gYWN0dWFsIGFwcCBmaWxlIGJ1dCByYXRoZXIgc29tZXRoaW5nIHdlIHdhbnQgdG9cbiAgICAgICAgLy8gYXNzdW1lIGlzIG9uIHRoZSBkZXZpY2UgYW5kIGp1c3QgbGF1bmNoIHZpYSB0aGUgYXBwUGFja2FnZVxuICAgICAgICBsb2cuaW5mbyhgQXBwIGZpbGUgd2FzIG5vdCBsaXN0ZWQsIGluc3RlYWQgd2UncmUgZ29pbmcgdG8gcnVuIGAgK1xuICAgICAgICAgICAgICAgICBgJHt0aGlzLm9wdHMuYXBwUGFja2FnZX0gZGlyZWN0bHkgb24gdGhlIGRldmljZWApO1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUGFja2FnZVByZXNlbnQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU29tZSBjbG91ZCBzZXJ2aWNlcyB1c2luZyBhcHBpdW0gbGF1bmNoIHRoZSBhdmQgdGhlbXNlbHZlcywgc28gd2UgZW5zdXJlIG5ldHNwZWVkXG4gICAgICAvLyBpcyBzZXQgZm9yIGVtdWxhdG9ycyBieSBjYWxsaW5nIGFkYi5uZXR3b3JrU3BlZWQgYmVmb3JlIHJ1bm5pbmcgdGhlIGFwcFxuICAgICAgaWYgKHV0aWwuaGFzVmFsdWUodGhpcy5vcHRzLm5ldHdvcmtTcGVlZCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzRW11bGF0b3IoKSkge1xuICAgICAgICAgIGxvZy53YXJuKCdTb3JyeSwgbmV0d29ya1NwZWVkIGNhcGFiaWxpdHkgaXMgb25seSBhdmFpbGFibGUgZm9yIGVtdWxhdG9ycycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBuZXR3b3JrU3BlZWQgPSBoZWxwZXJzLmVuc3VyZU5ldHdvcmtTcGVlZCh0aGlzLmFkYiwgdGhpcy5vcHRzLm5ldHdvcmtTcGVlZCk7XG4gICAgICAgICAgYXdhaXQgdGhpcy5hZGIubmV0d29ya1NwZWVkKG5ldHdvcmtTcGVlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGlmIHdlIGhhdmUgdG8gZW5hYmxlL2Rpc2FibGUgZ3BzIGJlZm9yZSBydW5uaW5nIHRoZSBhcHBsaWNhdGlvblxuICAgICAgaWYgKHV0aWwuaGFzVmFsdWUodGhpcy5vcHRzLmdwc0VuYWJsZWQpKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRW11bGF0b3IoKSkge1xuICAgICAgICAgIGxvZy5pbmZvKGBUcnlpbmcgdG8gJHt0aGlzLm9wdHMuZ3BzRW5hYmxlZCA/ICdlbmFibGUnIDogJ2Rpc2FibGUnfSBncHMgbG9jYXRpb24gcHJvdmlkZXJgKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmFkYi50b2dnbGVHUFNMb2NhdGlvblByb3ZpZGVyKHRoaXMub3B0cy5ncHNFbmFibGVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2cud2FybignU29ycnkhIGdwc0VuYWJsZWQgY2FwYWJpbGl0eSBpcyBvbmx5IGF2YWlsYWJsZSBmb3IgZW11bGF0b3JzJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5zdGFydEFuZHJvaWRTZXNzaW9uKHRoaXMub3B0cyk7XG4gICAgICByZXR1cm4gW3Nlc3Npb25JZCwgdGhpcy5jYXBzXTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBpZ25vcmluZyBkZWxldGUgc2Vzc2lvbiBleGNlcHRpb24gaWYgYW55IGFuZCB0aHJvdyB0aGUgcmVhbCBlcnJvclxuICAgICAgLy8gdGhhdCBoYXBwZW5lZCB3aGlsZSBjcmVhdGluZyB0aGUgc2Vzc2lvbi5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlU2Vzc2lvbigpO1xuICAgICAgfSBjYXRjaCAoaWduKSB7fVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBpc0VtdWxhdG9yICgpIHtcbiAgICByZXR1cm4gISEodGhpcy5vcHRzLmF2ZCB8fCAvZW11bGF0b3IvLnRlc3QodGhpcy5vcHRzLnVkaWQpKTtcbiAgfVxuXG4gIHNldEF2ZEZyb21DYXBhYmlsaXRpZXMgKGNhcHMpIHtcbiAgICBpZiAodGhpcy5vcHRzLmF2ZCkge1xuICAgICAgbG9nLmluZm8oJ2F2ZCBuYW1lIGRlZmluZWQsIGlnbm9yaW5nIGRldmljZSBuYW1lIGFuZCBwbGF0Zm9ybSB2ZXJzaW9uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghY2Fwcy5kZXZpY2VOYW1lKSB7XG4gICAgICAgIGxvZy5lcnJvckFuZFRocm93KCdhdmQgb3IgZGV2aWNlTmFtZSBzaG91bGQgYmUgc3BlY2lmaWVkIHdoZW4gcmVib290IG9wdGlvbiBpcyBlbmFibGVzJyk7XG4gICAgICB9XG4gICAgICBpZiAoIWNhcHMucGxhdGZvcm1WZXJzaW9uKSB7XG4gICAgICAgIGxvZy5lcnJvckFuZFRocm93KCdhdmQgb3IgcGxhdGZvcm1WZXJzaW9uIHNob3VsZCBiZSBzcGVjaWZpZWQgd2hlbiByZWJvb3Qgb3B0aW9uIGlzIGVuYWJsZWQnKTtcbiAgICAgIH1cbiAgICAgIGxldCBhdmREZXZpY2UgPSBjYXBzLmRldmljZU5hbWUucmVwbGFjZSgvW15hLXpBLVowLTlfLl0vZywgJy0nKTtcbiAgICAgIHRoaXMub3B0cy5hdmQgPSBgJHthdmREZXZpY2V9X18ke2NhcHMucGxhdGZvcm1WZXJzaW9ufWA7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGFwcE9uRGV2aWNlICgpIHtcbiAgICByZXR1cm4gdGhpcy5oZWxwZXJzLmlzUGFja2FnZU9yQnVuZGxlKHRoaXMub3B0cy5hcHApIHx8ICghdGhpcy5vcHRzLmFwcCAmJlxuICAgICAgICAgICB0aGlzLmhlbHBlcnMuaXNQYWNrYWdlT3JCdW5kbGUodGhpcy5vcHRzLmFwcFBhY2thZ2UpKTtcbiAgfVxuXG4gIGdldCBpc0Nocm9tZVNlc3Npb24gKCkge1xuICAgIHJldHVybiBoZWxwZXJzLmlzQ2hyb21lQnJvd3Nlcih0aGlzLm9wdHMuYnJvd3Nlck5hbWUpO1xuICB9XG5cbiAgYXN5bmMgb25TZXR0aW5nc1VwZGF0ZSAoa2V5LCB2YWx1ZSkge1xuICAgIGlmIChrZXkgPT09ICdpZ25vcmVVbmltcG9ydGFudFZpZXdzJykge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb21wcmVzc2VkTGF5b3V0SGllcmFyY2h5KHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzdGFydEFuZHJvaWRTZXNzaW9uICgpIHtcbiAgICBsb2cuaW5mbyhgU3RhcnRpbmcgQW5kcm9pZCBzZXNzaW9uYCk7XG4gICAgLy8gc2V0IHVwIHRoZSBkZXZpY2UgdG8gcnVuIG9uIChyZWFsIG9yIGVtdWxhdG9yLCBldGMpXG4gICAgdGhpcy5kZWZhdWx0SU1FID0gYXdhaXQgaGVscGVycy5pbml0RGV2aWNlKHRoaXMuYWRiLCB0aGlzLm9wdHMpO1xuXG4gICAgLy8gc2V0IGFjdHVhbCBkZXZpY2UgbmFtZSwgdWRpZCwgcGxhdGZvcm0gdmVyc2lvbiwgc2NyZWVuIHNpemUsIG1vZGVsIGFuZCBtYW51ZmFjdHVyZXIgZGV0YWlscy5cbiAgICB0aGlzLmNhcHMuZGV2aWNlTmFtZSA9IHRoaXMuYWRiLmN1ckRldmljZUlkO1xuICAgIHRoaXMuY2Fwcy5kZXZpY2VVRElEID0gdGhpcy5vcHRzLnVkaWQ7XG4gICAgdGhpcy5jYXBzLnBsYXRmb3JtVmVyc2lvbiA9IGF3YWl0IHRoaXMuYWRiLmdldFBsYXRmb3JtVmVyc2lvbigpO1xuICAgIHRoaXMuY2Fwcy5kZXZpY2VTY3JlZW5TaXplID0gYXdhaXQgdGhpcy5hZGIuZ2V0U2NyZWVuU2l6ZSgpO1xuICAgIHRoaXMuY2Fwcy5kZXZpY2VNb2RlbCA9IGF3YWl0IHRoaXMuYWRiLmdldE1vZGVsKCk7XG4gICAgdGhpcy5jYXBzLmRldmljZU1hbnVmYWN0dXJlciA9IGF3YWl0IHRoaXMuYWRiLmdldE1hbnVmYWN0dXJlcigpO1xuXG4gICAgaWYgKHRoaXMub3B0cy5kaXNhYmxlV2luZG93QW5pbWF0aW9uKSB7XG4gICAgICBpZiAoYXdhaXQgdGhpcy5hZGIuaXNBbmltYXRpb25PbigpKSB7XG4gICAgICAgIGlmIChhd2FpdCB0aGlzLmFkYi5nZXRBcGlMZXZlbCgpID49IDI4KSB7IC8vIEFQSSBsZXZlbCAyOCBpcyBBbmRyb2lkIFBcbiAgICAgICAgICAvLyBEb24ndCBmb3JnZXQgdG8gcmVzZXQgdGhlIHJlbGF4aW5nIGluIGRlbGV0ZSBzZXNzaW9uXG4gICAgICAgICAgbG9nLndhcm4oJ1JlbGF4aW5nIGhpZGRlbiBhcGkgcG9saWN5IHRvIG1hbmFnZSBhbmltYXRpb24gc2NhbGUnKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLmFkYi5zZXRIaWRkZW5BcGlQb2xpY3koJzEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5pbmZvKCdEaXNhYmxpbmcgd2luZG93IGFuaW1hdGlvbiBhcyBpdCBpcyByZXF1ZXN0ZWQgYnkgXCJkaXNhYmxlV2luZG93QW5pbWF0aW9uXCIgY2FwYWJpbGl0eScpO1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5zZXRBbmltYXRpb25TdGF0ZShmYWxzZSk7XG4gICAgICAgIHRoaXMuX3dhc1dpbmRvd0FuaW1hdGlvbkRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZy5pbmZvKCdXaW5kb3cgYW5pbWF0aW9uIGlzIGFscmVhZHkgZGlzYWJsZWQnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgdXNlciBzZXRzIGF1dG9MYXVuY2ggdG8gZmFsc2UsIHRoZXkgYXJlIHJlc3BvbnNpYmxlIGZvciBpbml0QVVUKCkgYW5kIHN0YXJ0QVVUKClcbiAgICBpZiAodGhpcy5vcHRzLmF1dG9MYXVuY2gpIHtcbiAgICAgIC8vIHNldCB1cCBhcHAgdW5kZXIgdGVzdFxuICAgICAgYXdhaXQgdGhpcy5pbml0QVVUKCk7XG4gICAgfVxuXG4gICAgLy8gc3RhcnQgVWlBdXRvbWF0b3JcbiAgICB0aGlzLmJvb3RzdHJhcCA9IG5ldyBoZWxwZXJzLmJvb3RzdHJhcCh0aGlzLmFkYiwgdGhpcy5vcHRzLmJvb3RzdHJhcFBvcnQsIHRoaXMub3B0cy53ZWJzb2NrZXQpO1xuICAgIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnN0YXJ0KHRoaXMub3B0cy5hcHBQYWNrYWdlLCB0aGlzLm9wdHMuZGlzYWJsZUFuZHJvaWRXYXRjaGVycywgdGhpcy5vcHRzLmFjY2VwdFNzbENlcnRzKTtcbiAgICAvLyBoYW5kbGluZyB1bmV4cGVjdGVkIHNodXRkb3duXG4gICAgdGhpcy5ib290c3RyYXAub25VbmV4cGVjdGVkU2h1dGRvd24uY2F0Y2goYXN5bmMgKGVycikgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHByb21pc2UvcHJlZmVyLWF3YWl0LXRvLWNhbGxiYWNrc1xuICAgICAgaWYgKCF0aGlzLmJvb3RzdHJhcC5pZ25vcmVVbmV4cGVjdGVkU2h1dGRvd24pIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zdGFydFVuZXhwZWN0ZWRTaHV0ZG93bihlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLm9wdHMuc2tpcFVubG9jaykge1xuICAgICAgLy8gTGV0J3MgdHJ5IHRvIHVubG9jayB0aGUgZGV2aWNlXG4gICAgICBhd2FpdCBoZWxwZXJzLnVubG9jayh0aGlzLCB0aGlzLmFkYiwgdGhpcy5jYXBzKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgQ29tcHJlc3NlZExheW91dEhpZXJhcmNoeSBvbiB0aGUgZGV2aWNlIGJhc2VkIG9uIGN1cnJlbnQgc2V0dGluZ3Mgb2JqZWN0XG4gICAgLy8gdGhpcyBoYXMgdG8gaGFwcGVuIF9hZnRlcl8gYm9vdHN0cmFwIGlzIGluaXRpYWxpemVkXG4gICAgaWYgKHRoaXMub3B0cy5pZ25vcmVVbmltcG9ydGFudFZpZXdzKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldHRpbmdzLnVwZGF0ZSh7aWdub3JlVW5pbXBvcnRhbnRWaWV3czogdGhpcy5vcHRzLmlnbm9yZVVuaW1wb3J0YW50Vmlld3N9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0Nocm9tZVNlc3Npb24pIHtcbiAgICAgIC8vIHN0YXJ0IGEgY2hyb21lZHJpdmVyIHNlc3Npb24gYW5kIHByb3h5IHRvIGl0XG4gICAgICBhd2FpdCB0aGlzLnN0YXJ0Q2hyb21lU2Vzc2lvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRzLmF1dG9MYXVuY2gpIHtcbiAgICAgICAgLy8gc3RhcnQgYXBwXG4gICAgICAgIGF3YWl0IHRoaXMuc3RhcnRBVVQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodXRpbC5oYXNWYWx1ZSh0aGlzLm9wdHMub3JpZW50YXRpb24pKSB7XG4gICAgICBsb2cuZGVidWcoYFNldHRpbmcgaW5pdGlhbCBvcmllbnRhdGlvbiB0byAnJHt0aGlzLm9wdHMub3JpZW50YXRpb259J2ApO1xuICAgICAgYXdhaXQgdGhpcy5zZXRPcmllbnRhdGlvbih0aGlzLm9wdHMub3JpZW50YXRpb24pO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuaW5pdEF1dG9XZWJ2aWV3KCk7XG4gIH1cblxuICBhc3luYyBpbml0QXV0b1dlYnZpZXcgKCkge1xuICAgIGlmICh0aGlzLm9wdHMuYXV0b1dlYnZpZXcpIHtcbiAgICAgIGxldCB2aWV3TmFtZSA9IHRoaXMuZGVmYXVsdFdlYnZpZXdOYW1lKCk7XG4gICAgICBsZXQgdGltZW91dCA9ICh0aGlzLm9wdHMuYXV0b1dlYnZpZXdUaW1lb3V0KSB8fCAyMDAwO1xuXG4gICAgICBsb2cuaW5mbyhgU2V0dGluZyBhdXRvIHdlYnZpZXcgdG8gY29udGV4dCAnJHt2aWV3TmFtZX0nIHdpdGggdGltZW91dCAke3RpbWVvdXR9bXNgKTtcblxuICAgICAgLy8gdHJ5IGV2ZXJ5IDUwMG1zIHVudGlsIHRpbWVvdXQgaXMgb3ZlclxuICAgICAgYXdhaXQgcmV0cnlJbnRlcnZhbCh0aW1lb3V0IC8gNTAwLCA1MDAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRDb250ZXh0KHZpZXdOYW1lKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGluaXRBVVQgKCkge1xuICAgIC8vIHBvcHVsYXRlIGFwcFBhY2thZ2UsIGFwcEFjdGl2aXR5LCBhcHBXYWl0UGFja2FnZSwgYXBwV2FpdEFjdGl2aXR5LFxuICAgIC8vIGFuZCB0aGUgZGV2aWNlIGJlaW5nIHVzZWRcbiAgICAvLyBpbiB0aGUgb3B0cyBhbmQgY2FwcyAoc28gaXQgZ2V0cyBiYWNrIHRvIHRoZSB1c2VyIG9uIHNlc3Npb24gY3JlYXRpb24pXG4gICAgbGV0IGxhdW5jaEluZm8gPSBhd2FpdCBoZWxwZXJzLmdldExhdW5jaEluZm8odGhpcy5hZGIsIHRoaXMub3B0cyk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLm9wdHMsIGxhdW5jaEluZm8pO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5jYXBzLCBsYXVuY2hJbmZvKTtcblxuICAgIC8vIFVuaW5zdGFsbCBhbnkgdW5pbnN0YWxsT3RoZXJQYWNrYWdlcyB3aGljaCB3ZXJlIHNwZWNpZmllZCBpbiBjYXBzXG4gICAgaWYgKHRoaXMub3B0cy51bmluc3RhbGxPdGhlclBhY2thZ2VzKSB7XG4gICAgICBoZWxwZXJzLnZhbGlkYXRlRGVzaXJlZENhcHModGhpcy5vcHRzKTtcbiAgICAgIC8vIE9ubHkgU0VUVElOR1NfSEVMUEVSX1BLR19JRCBwYWNrYWdlIGlzIHVzZWQgYnkgVUlBMVxuICAgICAgYXdhaXQgaGVscGVycy51bmluc3RhbGxPdGhlclBhY2thZ2VzKFxuICAgICAgICB0aGlzLmFkYixcbiAgICAgICAgaGVscGVycy5wYXJzZUFycmF5KHRoaXMub3B0cy51bmluc3RhbGxPdGhlclBhY2thZ2VzKSxcbiAgICAgICAgW1NFVFRJTkdTX0hFTFBFUl9QS0dfSURdXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEluc3RhbGwgYW55IFwib3RoZXJBcHBzXCIgdGhhdCB3ZXJlIHNwZWNpZmllZCBpbiBjYXBzXG4gICAgaWYgKHRoaXMub3B0cy5vdGhlckFwcHMpIHtcbiAgICAgIGxldCBvdGhlckFwcHM7XG4gICAgICB0cnkge1xuICAgICAgICBvdGhlckFwcHMgPSBoZWxwZXJzLnBhcnNlQXJyYXkodGhpcy5vcHRzLm90aGVyQXBwcyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZy5lcnJvckFuZFRocm93KGBDb3VsZCBub3QgcGFyc2UgXCJvdGhlckFwcHNcIiBjYXBhYmlsaXR5OiAke2UubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICAgIG90aGVyQXBwcyA9IGF3YWl0IEIuYWxsKG90aGVyQXBwcy5tYXAoKGFwcCkgPT4gdGhpcy5oZWxwZXJzLmNvbmZpZ3VyZUFwcChhcHAsIEFQUF9FWFRFTlNJT04pKSk7XG4gICAgICBhd2FpdCBoZWxwZXJzLmluc3RhbGxPdGhlckFwa3Mob3RoZXJBcHBzLCB0aGlzLmFkYiwgdGhpcy5vcHRzKTtcbiAgICB9XG5cbiAgICAvLyBpbnN0YWxsIGFwcFxuICAgIGlmICghdGhpcy5vcHRzLmFwcCkge1xuICAgICAgaWYgKHRoaXMub3B0cy5mdWxsUmVzZXQpIHtcbiAgICAgICAgbG9nLmVycm9yQW5kVGhyb3coJ0Z1bGwgcmVzZXQgcmVxdWlyZXMgYW4gYXBwIGNhcGFiaWxpdHksIHVzZSBmYXN0UmVzZXQgaWYgYXBwIGlzIG5vdCBwcm92aWRlZCcpO1xuICAgICAgfVxuICAgICAgbG9nLmRlYnVnKCdObyBhcHAgY2FwYWJpbGl0eS4gQXNzdW1pbmcgaXQgaXMgYWxyZWFkeSBvbiB0aGUgZGV2aWNlJyk7XG4gICAgICBpZiAodGhpcy5vcHRzLmZhc3RSZXNldCkge1xuICAgICAgICBhd2FpdCBoZWxwZXJzLnJlc2V0QXBwKHRoaXMuYWRiLCB0aGlzLm9wdHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0cy5za2lwVW5pbnN0YWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLmFkYi51bmluc3RhbGxBcGsodGhpcy5vcHRzLmFwcFBhY2thZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBoZWxwZXJzLmluc3RhbGxBcGsodGhpcy5hZGIsIHRoaXMub3B0cyk7XG4gICAgY29uc3QgYXBrU3RyaW5nc0Zvckxhbmd1YWdlID0gYXdhaXQgaGVscGVycy5wdXNoU3RyaW5ncyh0aGlzLm9wdHMubGFuZ3VhZ2UsIHRoaXMuYWRiLCB0aGlzLm9wdHMpO1xuICAgIGlmICh0aGlzLm9wdHMubGFuZ3VhZ2UpIHtcbiAgICAgIHRoaXMuYXBrU3RyaW5nc1t0aGlzLm9wdHMubGFuZ3VhZ2VdID0gYXBrU3RyaW5nc0Zvckxhbmd1YWdlO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbXVzdCBydW4gYWZ0ZXIgaW5zdGFsbGluZyB0aGUgYXBrLCBvdGhlcndpc2UgaXQgd291bGQgY2F1c2UgdGhlXG4gICAgLy8gaW5zdGFsbCB0byBmYWlsLiBBbmQgYmVmb3JlIHJ1bm5pbmcgdGhlIGFwcC5cbiAgICBpZiAoIV8uaXNVbmRlZmluZWQodGhpcy5vcHRzLnNoYXJlZFByZWZlcmVuY2VzKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRTaGFyZWRQcmVmZXJlbmNlcyh0aGlzLm9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrQXBwUHJlc2VudCAoKSB7XG4gICAgbG9nLmRlYnVnKCdDaGVja2luZyB3aGV0aGVyIGFwcCBpcyBhY3R1YWxseSBwcmVzZW50Jyk7XG4gICAgaWYgKCEoYXdhaXQgZnMuZXhpc3RzKHRoaXMub3B0cy5hcHApKSkge1xuICAgICAgbG9nLmVycm9yQW5kVGhyb3coYENvdWxkIG5vdCBmaW5kIGFwcCBhcGsgYXQgJHt0aGlzLm9wdHMuYXBwfWApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrUGFja2FnZVByZXNlbnQgKCkge1xuICAgIGxvZy5kZWJ1ZygnQ2hlY2tpbmcgd2hldGhlciBwYWNrYWdlIGlzIHByZXNlbnQgb24gdGhlIGRldmljZScpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuYWRiLnNoZWxsKFsncG0nLCAnbGlzdCcsICdwYWNrYWdlcycsIHRoaXMub3B0cy5hcHBQYWNrYWdlXSkpKSB7XG4gICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgQ291bGQgbm90IGZpbmQgcGFja2FnZSAke3RoaXMub3B0cy5hcHBQYWNrYWdlfSBvbiB0aGUgZGV2aWNlYCk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0IENvbXByZXNzZWRMYXlvdXRIaWVyYXJjaHkgb24gdGhlIGRldmljZVxuICBhc3luYyBzZXRDb21wcmVzc2VkTGF5b3V0SGllcmFyY2h5IChjb21wcmVzcykge1xuICAgIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ2NvbXByZXNzZWRMYXlvdXRIaWVyYXJjaHknLCB7Y29tcHJlc3NMYXlvdXQ6IGNvbXByZXNzfSk7XG4gIH1cblxuICBhc3luYyBkZWxldGVTZXNzaW9uICgpIHtcbiAgICBsb2cuZGVidWcoJ1NodXR0aW5nIGRvd24gQW5kcm9pZCBkcml2ZXInKTtcbiAgICBhd2FpdCBoZWxwZXJzLnJlbW92ZUFsbFNlc3Npb25XZWJTb2NrZXRIYW5kbGVycyh0aGlzLnNlcnZlciwgdGhpcy5zZXNzaW9uSWQpO1xuICAgIGF3YWl0IHN1cGVyLmRlbGV0ZVNlc3Npb24oKTtcbiAgICBpZiAodGhpcy5ib290c3RyYXApIHtcbiAgICAgIC8vIGNlcnRhaW4gY2xlYW51cCB3ZSBvbmx5IGNhcmUgdG8gZG8gaWYgdGhlIGJvb3RzdHJhcCB3YXMgZXZlciBydW5cbiAgICAgIGF3YWl0IHRoaXMuc3RvcENocm9tZWRyaXZlclByb3hpZXMoKTtcbiAgICAgIGlmICh0aGlzLm9wdHMudW5pY29kZUtleWJvYXJkICYmIHRoaXMub3B0cy5yZXNldEtleWJvYXJkICYmIHRoaXMuZGVmYXVsdElNRSkge1xuICAgICAgICBsb2cuZGVidWcoYFJlc2V0dGluZyBJTUUgdG8gJHt0aGlzLmRlZmF1bHRJTUV9YCk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRiLnNldElNRSh0aGlzLmRlZmF1bHRJTUUpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzQ2hyb21lU2Vzc2lvbiAmJiAhdGhpcy5vcHRzLmRvbnRTdG9wQXBwT25SZXNldCkge1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5mb3JjZVN0b3AodGhpcy5vcHRzLmFwcFBhY2thZ2UpO1xuICAgICAgfVxuICAgICAgYXdhaXQgdGhpcy5hZGIuZ29Ub0hvbWUoKTtcbiAgICAgIGlmICh0aGlzLm9wdHMuZnVsbFJlc2V0ICYmICF0aGlzLm9wdHMuc2tpcFVuaW5zdGFsbCAmJiAhdGhpcy5hcHBPbkRldmljZSkge1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi51bmluc3RhbGxBcGsodGhpcy5vcHRzLmFwcFBhY2thZ2UpO1xuICAgICAgfVxuICAgICAgYXdhaXQgdGhpcy5ib290c3RyYXAuc2h1dGRvd24oKTtcbiAgICAgIHRoaXMuYm9vdHN0cmFwID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLmRlYnVnKFwiQ2FsbGVkIGRlbGV0ZVNlc3Npb24gYnV0IGJvb3RzdHJhcCB3YXNuJ3QgYWN0aXZlXCIpO1xuICAgIH1cbiAgICAvLyBzb21lIGNsZWFudXAgd2Ugd2FudCB0byBkbyByZWdhcmRsZXNzLCBpbiBjYXNlIHdlIGFyZSBzaHV0dGluZyBkb3duXG4gICAgLy8gbWlkLXN0YXJ0dXBcbiAgICBhd2FpdCB0aGlzLmFkYi5zdG9wTG9nY2F0KCk7XG4gICAgaWYgKHRoaXMudXNlVW5sb2NrSGVscGVyQXBwKSB7XG4gICAgICBhd2FpdCB0aGlzLmFkYi5mb3JjZVN0b3AoJ2lvLmFwcGl1bS51bmxvY2snKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3dhc1dpbmRvd0FuaW1hdGlvbkRpc2FibGVkKSB7XG4gICAgICBsb2cuaW5mbygnUmVzdG9yaW5nIHdpbmRvdyBhbmltYXRpb24gc3RhdGUnKTtcbiAgICAgIGF3YWl0IHRoaXMuYWRiLnNldEFuaW1hdGlvblN0YXRlKHRydWUpO1xuXG4gICAgICAvLyBUaGlzIHdhcyBuZWNlc3NhcnkgdG8gY2hhbmdlIGFuaW1hdGlvbiBzY2FsZSBvdmVyIEFuZHJvaWQgUC4gV2UgbXVzdCByZXNldCB0aGUgcG9saWN5IGZvciB0aGUgc2VjdXJpdHkuXG4gICAgICBpZiAoYXdhaXQgdGhpcy5hZGIuZ2V0QXBpTGV2ZWwoKSA+PSAyOCkge1xuICAgICAgICBsb2cuaW5mbygnUmVzdG9yaW5nIGhpZGRlbiBhcGkgcG9saWN5IHRvIHRoZSBkZXZpY2UgZGVmYXVsdCBjb25maWd1cmF0aW9uJyk7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRiLnNldERlZmF1bHRIaWRkZW5BcGlQb2xpY3koKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRzLnJlYm9vdCkge1xuICAgICAgbGV0IGF2ZE5hbWUgPSB0aGlzLm9wdHMuYXZkLnJlcGxhY2UoJ0AnLCAnJyk7XG4gICAgICBsb2cuZGVidWcoYGNsb3NpbmcgZW11bGF0b3IgJyR7YXZkTmFtZX0nYCk7XG4gICAgICBhd2FpdCB0aGlzLmFkYi5raWxsRW11bGF0b3IoYXZkTmFtZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdHMuY2xlYXJTeXN0ZW1GaWxlcykge1xuICAgICAgaWYgKHRoaXMub3B0cy5hcHBJc1RlbXApIHtcbiAgICAgICAgbG9nLmRlYnVnKGBUZW1wb3JhcnkgY29weSBvZiBhcHAgd2FzIG1hZGU6IGRlbGV0aW5nICcke3RoaXMub3B0cy5hcHB9J2ApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGZzLnJpbXJhZih0aGlzLm9wdHMuYXBwKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgbG9nLndhcm4oYFVuYWJsZSB0byBkZWxldGUgdGVtcG9yYXJ5IGFwcDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nLmRlYnVnKCdBcHAgd2FzIG5vdCBjb3BpZWQsIHNvIG5vdCBkZWxldGluZycpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2cuZGVidWcoJ05vdCBjbGVhbmluZyBnZW5lcmF0ZWQgZmlsZXMuIEFkZCBgY2xlYXJTeXN0ZW1GaWxlc2AgY2FwYWJpbGl0eSBpZiB3YW50ZWQuJyk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgc2V0U2hhcmVkUHJlZmVyZW5jZXMgKCkge1xuICAgIGxldCBzaGFyZWRQcmVmcyA9IHRoaXMub3B0cy5zaGFyZWRQcmVmZXJlbmNlcztcbiAgICBsb2cuaW5mbygnVHJ5aW5nIHRvIHNldCBzaGFyZWQgcHJlZmVyZW5jZXMnKTtcbiAgICBsZXQgbmFtZSA9IHNoYXJlZFByZWZzLm5hbWU7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICAgIGxvZy53YXJuKGBTa2lwcGluZyBzZXR0aW5nIFNoYXJlZCBwcmVmZXJlbmNlcywgbmFtZSBpcyB1bmRlZmluZWQ6ICR7SlNPTi5zdHJpbmdpZnkoc2hhcmVkUHJlZnMpfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBsZXQgcmVtb3RlUGF0aCA9IGAvZGF0YS9kYXRhLyR7dGhpcy5vcHRzLmFwcFBhY2thZ2V9L3NoYXJlZF9wcmVmc2A7XG4gICAgbGV0IHJlbW90ZUZpbGUgPSBgJHtyZW1vdGVQYXRofS8ke25hbWV9LnhtbGA7XG4gICAgbGV0IGxvY2FsUGF0aCA9IGAvdG1wLyR7bmFtZX0ueG1sYDtcbiAgICBsZXQgYnVpbGRlciA9IHRoaXMuZ2V0UHJlZnNCdWlsZGVyKCk7XG4gICAgYnVpbGRlci5idWlsZChzaGFyZWRQcmVmcy5wcmVmcyk7XG4gICAgbG9nLmluZm8oYENyZWF0aW5nIHRlbXBvcmFyeSBzaGFyZWQgcHJlZmVyZW5jZXM6ICR7bG9jYWxQYXRofWApO1xuICAgIGJ1aWxkZXIudG9GaWxlKGxvY2FsUGF0aCk7XG4gICAgbG9nLmluZm8oYENyZWF0aW5nIHNoYXJlZF9wcmVmcyByZW1vdGUgZm9sZGVyOiAke3JlbW90ZVBhdGh9YCk7XG4gICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydta2RpcicsICctcCcsIHJlbW90ZVBhdGhdKTtcbiAgICBsb2cuaW5mbyhgUHVzaGluZyBzaGFyZWRfcHJlZnMgdG8gJHtyZW1vdGVGaWxlfWApO1xuICAgIGF3YWl0IHRoaXMuYWRiLnB1c2gobG9jYWxQYXRoLCByZW1vdGVGaWxlKTtcbiAgICB0cnkge1xuICAgICAgbG9nLmluZm8oYFRyeWluZyB0byByZW1vdmUgc2hhcmVkIHByZWZlcmVuY2VzIHRlbXBvcmFyeSBmaWxlYCk7XG4gICAgICBpZiAoYXdhaXQgZnMuZXhpc3RzKGxvY2FsUGF0aCkpIHtcbiAgICAgICAgYXdhaXQgZnMudW5saW5rKGxvY2FsUGF0aCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nLndhcm4oYEVycm9yIHRyeWluZyB0byByZW1vdmUgdGVtcG9yYXJ5IGZpbGUgJHtsb2NhbFBhdGh9YCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZ2V0UHJlZnNCdWlsZGVyICgpIHtcbiAgICAvKiBBZGQgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGEgbmV3IFNoYXJlZFByZWZzQnVpbGRlciBpbnN0ZWFkIG9mXG4gICAgICogZGlyZWN0bHkgY3JlYXRpbmcgdGhlIG9iamVjdCBvbiBzZXRTaGFyZWRQcmVmZXJlbmNlcyBmb3IgdGVzdGluZyBwdXJwb3Nlc1xuICAgICovXG4gICAgcmV0dXJuIG5ldyBTaGFyZWRQcmVmc0J1aWxkZXIoKTtcbiAgfVxuXG4gIHZhbGlkYXRlRGVzaXJlZENhcHMgKGNhcHMpIHtcbiAgICBpZiAoIXN1cGVyLnZhbGlkYXRlRGVzaXJlZENhcHMoY2FwcykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCghY2Fwcy5icm93c2VyTmFtZSB8fCAhaGVscGVycy5pc0Nocm9tZUJyb3dzZXIoY2Fwcy5icm93c2VyTmFtZSkpICYmICFjYXBzLmFwcCAmJiAhY2Fwcy5hcHBQYWNrYWdlKSB7XG4gICAgICBsb2cuZXJyb3JBbmRUaHJvdygnVGhlIGRlc2lyZWQgY2FwYWJpbGl0aWVzIG11c3QgaW5jbHVkZSBlaXRoZXIgYW4gYXBwLCBhcHBQYWNrYWdlIG9yIGJyb3dzZXJOYW1lJyk7XG4gICAgfVxuICAgIHJldHVybiBoZWxwZXJzLnZhbGlkYXRlRGVzaXJlZENhcHMoY2Fwcyk7XG4gIH1cblxuICBwcm94eUFjdGl2ZSAoc2Vzc2lvbklkKSB7XG4gICAgc3VwZXIucHJveHlBY3RpdmUoc2Vzc2lvbklkKTtcblxuICAgIHJldHVybiB0aGlzLmp3cFByb3h5QWN0aXZlO1xuICB9XG5cbiAgZ2V0UHJveHlBdm9pZExpc3QgKHNlc3Npb25JZCkge1xuICAgIHN1cGVyLmdldFByb3h5QXZvaWRMaXN0KHNlc3Npb25JZCk7XG5cbiAgICByZXR1cm4gdGhpcy5qd3BQcm94eUF2b2lkO1xuICB9XG5cbiAgY2FuUHJveHkgKHNlc3Npb25JZCkge1xuICAgIHN1cGVyLmNhblByb3h5KHNlc3Npb25JZCk7XG5cbiAgICAvLyB0aGlzIHdpbGwgY2hhbmdlIGRlcGVuZGluZyBvbiBDaHJvbWVEcml2ZXIgc3RhdHVzXG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih0aGlzLnByb3h5UmVxUmVzKTtcbiAgfVxufVxuXG5leHBvcnQgeyBBbmRyb2lkRHJpdmVyIH07XG5leHBvcnQgZGVmYXVsdCBBbmRyb2lkRHJpdmVyO1xuIl0sImZpbGUiOiJsaWIvZHJpdmVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
