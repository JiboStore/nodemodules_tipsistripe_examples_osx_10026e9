"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.REMOTE_CACHE_ROOT = void 0;

require("source-map-support/register");

var _helpers = require("../helpers.js");

var _teen_process = require("teen_process");

var _logger = _interopRequireDefault(require("../logger.js"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _asyncbox = require("asyncbox");

var _appiumSupport = require("appium-support");

var _semver = _interopRequireDefault(require("semver"));

var _os = _interopRequireDefault(require("os"));

var _lruCache = _interopRequireDefault(require("lru-cache"));

var _adbkitApkreader = _interopRequireDefault(require("adbkit-apkreader"));

let apkUtilsMethods = {};
const ACTIVITIES_TROUBLESHOOTING_LINK = 'https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/android/activity-startup.md';
apkUtilsMethods.APP_INSTALL_STATE = {
  UNKNOWN: 'unknown',
  NOT_INSTALLED: 'notInstalled',
  NEWER_VERSION_INSTALLED: 'newerVersionInstalled',
  SAME_VERSION_INSTALLED: 'sameVersionInstalled',
  OLDER_VERSION_INSTALLED: 'olderVersionInstalled'
};
const REMOTE_CACHE_ROOT = '/data/local/tmp/appium_cache';
exports.REMOTE_CACHE_ROOT = REMOTE_CACHE_ROOT;

apkUtilsMethods.isAppInstalled = async function isAppInstalled(pkg) {
  _logger.default.debug(`Getting install status for ${pkg}`);

  const installedPattern = new RegExp(`^\\s*Package\\s+\\[${_lodash.default.escapeRegExp(pkg)}\\][^:]+:$`, 'm');

  try {
    const stdout = await this.shell(['dumpsys', 'package', pkg]);
    const isInstalled = installedPattern.test(stdout);

    _logger.default.debug(`'${pkg}' is${!isInstalled ? ' not' : ''} installed`);

    return isInstalled;
  } catch (e) {
    throw new Error(`Error finding if '${pkg}' is installed. Original error: ${e.message}`);
  }
};

apkUtilsMethods.startUri = async function startUri(uri, pkg) {
  if (!uri || !pkg) {
    throw new Error('URI and package arguments are required');
  }

  const args = ['am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', uri.replace(/&/g, '\\&'), pkg];

  try {
    const res = await this.shell(args);

    if (res.toLowerCase().includes('unable to resolve intent')) {
      throw new Error(res);
    }
  } catch (e) {
    throw new Error(`Error attempting to start URI. Original error: ${e}`);
  }
};

apkUtilsMethods.startApp = async function startApp(startAppOptions = {}) {
  if (!startAppOptions.activity || !startAppOptions.pkg) {
    throw new Error('activity and pkg are required to start an application');
  }

  startAppOptions = _lodash.default.clone(startAppOptions);
  startAppOptions.activity = startAppOptions.activity.replace('$', '\\$');

  _lodash.default.defaults(startAppOptions, {
    waitPkg: startAppOptions.pkg,
    waitForLaunch: true,
    waitActivity: false,
    retry: true,
    stopApp: true
  });

  startAppOptions.waitPkg = startAppOptions.waitPkg || startAppOptions.pkg;
  const apiLevel = await this.getApiLevel();
  const cmd = (0, _helpers.buildStartCmd)(startAppOptions, apiLevel);

  try {
    const shellOpts = {};

    if (_lodash.default.isInteger(startAppOptions.waitDuration) && startAppOptions.waitDuration > 20000) {
      shellOpts.timeout = startAppOptions.waitDuration;
    }

    const stdout = await this.shell(cmd, shellOpts);

    if (stdout.includes('Error: Activity class') && stdout.includes('does not exist')) {
      if (startAppOptions.retry && !startAppOptions.activity.startsWith('.')) {
        _logger.default.debug(`We tried to start an activity that doesn't exist, ` + `retrying with '.${startAppOptions.activity}' activity name`);

        startAppOptions.activity = `.${startAppOptions.activity}`;
        startAppOptions.retry = false;
        return await this.startApp(startAppOptions);
      }

      throw new Error(`Activity name '${startAppOptions.activity}' used to start the app doesn't ` + `exist or cannot be launched! Make sure it exists and is a launchable activity`);
    } else if (stdout.includes('java.lang.SecurityException')) {
      throw new Error(`The permission to start '${startAppOptions.activity}' activity has been denied.` + `Make sure the activity/package names are correct.`);
    }

    if (startAppOptions.waitActivity) {
      await this.waitForActivity(startAppOptions.waitPkg, startAppOptions.waitActivity, startAppOptions.waitDuration);
    }

    return stdout;
  } catch (e) {
    throw new Error(`Cannot start the '${startAppOptions.pkg}' application. ` + `Visit ${ACTIVITIES_TROUBLESHOOTING_LINK} for troubleshooting. ` + `Original error: ${e.message}`);
  }
};

apkUtilsMethods.dumpWindows = async function dumpWindows() {
  const apiLevel = await this.getApiLevel();
  const dumpsysArg = apiLevel >= 29 ? 'displays' : 'windows';
  const cmd = ['dumpsys', 'window', dumpsysArg];
  return await this.shell(cmd);
};

apkUtilsMethods.getFocusedPackageAndActivity = async function getFocusedPackageAndActivity() {
  _logger.default.debug('Getting focused package and activity');

  const nullFocusedAppRe = new RegExp(/^\s*mFocusedApp=null/, 'm');
  const focusedAppRe = new RegExp('^\\s*mFocusedApp.+Record\\{.*\\s([^\\s\\/\\}]+)' + '\\/([^\\s\\/\\}\\,]+)\\,?(\\s[^\\s\\/\\}]+)*\\}', 'm');
  const nullCurrentFocusRe = new RegExp(/^\s*mCurrentFocus=null/, 'm');
  const currentFocusAppRe = new RegExp('^\\s*mCurrentFocus.+\\{.+\\s([^\\s\\/]+)\\/([^\\s]+)\\b', 'm');

  try {
    const stdout = await this.dumpWindows();

    for (const pattern of [focusedAppRe, currentFocusAppRe]) {
      const match = pattern.exec(stdout);

      if (match) {
        return {
          appPackage: match[1].trim(),
          appActivity: match[2].trim()
        };
      }
    }

    for (const pattern of [nullFocusedAppRe, nullCurrentFocusRe]) {
      if (pattern.exec(stdout)) {
        return {
          appPackage: null,
          appActivity: null
        };
      }
    }

    throw new Error('Could not parse activity from dumpsys');
  } catch (e) {
    throw new Error(`Could not get focusPackageAndActivity. Original error: ${e.message}`);
  }
};

apkUtilsMethods.waitForActivityOrNot = async function waitForActivityOrNot(pkg, activity, waitForStop, waitMs = 20000) {
  if (!pkg || !activity) {
    throw new Error('Package and activity required.');
  }

  _logger.default.debug(`Waiting up to ${waitMs}ms for activity matching pkg: '${pkg}' and ` + `activity: '${activity}' to${waitForStop ? ' not' : ''} be focused`);

  const splitNames = names => names.split(',').map(name => name.trim());

  const allPackages = splitNames(pkg);
  const allActivities = splitNames(activity);
  let possibleActivityNames = [];

  for (let oneActivity of allActivities) {
    if (oneActivity.startsWith('.')) {
      for (let currentPkg of allPackages) {
        possibleActivityNames.push(`${currentPkg}${oneActivity}`.replace(/\.+/g, '.'));
      }
    } else {
      possibleActivityNames.push(oneActivity);
      possibleActivityNames.push(`${pkg}.${oneActivity}`);
    }
  }

  _logger.default.debug(`Possible activities, to be checked: ${possibleActivityNames.map(name => `'${name}'`).join(', ')}`);

  let possibleActivityPatterns = possibleActivityNames.map(possibleActivityName => new RegExp(`^${possibleActivityName.replace(/\./g, '\\.').replace(/\*/g, '.*?').replace(/\$/g, '\\$')}$`));
  let retries = parseInt(waitMs / 750, 10) || 1;
  retries = isNaN(retries) ? 30 : retries;
  await (0, _asyncbox.retryInterval)(retries, 750, async () => {
    let {
      appPackage,
      appActivity
    } = await this.getFocusedPackageAndActivity();

    if (appActivity && appPackage) {
      let fullyQualifiedActivity = appActivity.startsWith('.') ? `${appPackage}${appActivity}` : appActivity;

      _logger.default.debug(`Found package: '${appPackage}' and fully qualified activity name : '${fullyQualifiedActivity}'`);

      let foundAct = _lodash.default.includes(allPackages, appPackage) && _lodash.default.findIndex(possibleActivityPatterns, possiblePattern => possiblePattern.test(fullyQualifiedActivity)) !== -1;

      if (!waitForStop && foundAct || waitForStop && !foundAct) {
        return;
      }
    }

    _logger.default.debug('Incorrect package and activity. Retrying.');

    throw new Error(`${possibleActivityNames.map(name => `'${name}'`).join(' or ')} never ${waitForStop ? 'stopped' : 'started'}. ` + `Visit ${ACTIVITIES_TROUBLESHOOTING_LINK} for troubleshooting`);
  });
};

apkUtilsMethods.waitForActivity = async function waitForActivity(pkg, act, waitMs = 20000) {
  await this.waitForActivityOrNot(pkg, act, false, waitMs);
};

apkUtilsMethods.waitForNotActivity = async function waitForNotActivity(pkg, act, waitMs = 20000) {
  await this.waitForActivityOrNot(pkg, act, true, waitMs);
};

apkUtilsMethods.uninstallApk = async function uninstallApk(pkg, options = {}) {
  _logger.default.debug(`Uninstalling ${pkg}`);

  if (!(await this.isAppInstalled(pkg))) {
    _logger.default.info(`${pkg} was not uninstalled, because it was not present on the device`);

    return false;
  }

  const cmd = ['uninstall'];

  if (options.keepData) {
    cmd.push('-k');
  }

  cmd.push(pkg);
  let stdout;

  try {
    await this.forceStop(pkg);
    stdout = (await this.adbExec(cmd, {
      timeout: options.timeout
    })).trim();
  } catch (e) {
    throw new Error(`Unable to uninstall APK. Original error: ${e.message}`);
  }

  _logger.default.debug(`'adb ${cmd.join(' ')}' command output: ${stdout}`);

  if (stdout.includes('Success')) {
    _logger.default.info(`${pkg} was successfully uninstalled`);

    return true;
  }

  _logger.default.info(`${pkg} was not uninstalled`);

  return false;
};

apkUtilsMethods.installFromDevicePath = async function installFromDevicePath(apkPathOnDevice, opts = {}) {
  let stdout = await this.shell(['pm', 'install', '-r', apkPathOnDevice], opts);

  if (stdout.indexOf('Failure') !== -1) {
    throw new Error(`Remote install failed: ${stdout}`);
  }
};

apkUtilsMethods.cacheApk = async function cacheApk(apkPath, options = {}) {
  const appHash = await _appiumSupport.fs.hash(apkPath);

  const remotePath = _path.default.posix.join(REMOTE_CACHE_ROOT, `${appHash}.apk`);

  const remoteCachedFiles = [];

  try {
    const errorMarker = '_ERROR_';
    let lsOutput = null;

    if (this._areExtendedLsOptionsSupported === true || !_lodash.default.isBoolean(this._areExtendedLsOptionsSupported)) {
      lsOutput = await this.shell([`ls -t -1 ${REMOTE_CACHE_ROOT} 2>&1 || echo ${errorMarker}`]);
    }

    if (!_lodash.default.isString(lsOutput) || lsOutput.includes(errorMarker) && !lsOutput.includes(REMOTE_CACHE_ROOT)) {
      if (!_lodash.default.isBoolean(this._areExtendedLsOptionsSupported)) {
        _logger.default.debug('The current Android API does not support extended ls options. ' + 'Defaulting to no-options call');
      }

      lsOutput = await this.shell([`ls ${REMOTE_CACHE_ROOT} 2>&1 || echo ${errorMarker}`]);
      this._areExtendedLsOptionsSupported = false;
    } else {
      this._areExtendedLsOptionsSupported = true;
    }

    if (lsOutput.includes(errorMarker)) {
      throw new Error(lsOutput.substring(0, lsOutput.indexOf(errorMarker)));
    }

    remoteCachedFiles.push(...lsOutput.split('\n').map(x => x.trim()).filter(Boolean));
  } catch (e) {
    _logger.default.debug(`Got an error '${e.message.trim()}' while getting the list of files in the cache. ` + `Assuming the cache does not exist yet`);

    await this.shell(['mkdir', '-p', REMOTE_CACHE_ROOT]);
  }

  _logger.default.debug(`The count of applications in the cache: ${remoteCachedFiles.length}`);

  const toHash = remotePath => _path.default.posix.parse(remotePath).name;

  if (remoteCachedFiles.find(x => toHash(x) === appHash)) {
    _logger.default.info(`The application at '${apkPath}' is already cached to '${remotePath}'`);
  } else {
    _logger.default.info(`Caching the application at '${apkPath}' to '${remotePath}'`);

    const started = process.hrtime();
    await this.push(apkPath, remotePath, {
      timeout: options.timeout
    });
    const [seconds, nanos] = process.hrtime(started);
    const {
      size
    } = await _appiumSupport.fs.stat(apkPath);

    _logger.default.info(`The upload of '${_path.default.basename(apkPath)}' (${_appiumSupport.util.toReadableSizeString(size)}) ` + `took ${(seconds + nanos / 1e9).toFixed(3)}s`);
  }

  if (!this.remoteAppsCache) {
    this.remoteAppsCache = new _lruCache.default({
      max: this.remoteAppsCacheLimit
    });
  }

  _lodash.default.difference(this.remoteAppsCache.keys(), remoteCachedFiles.map(toHash)).forEach(hash => this.remoteAppsCache.del(hash));

  this.remoteAppsCache.set(appHash, remotePath);
  const entriesToCleanup = remoteCachedFiles.map(x => _path.default.posix.join(REMOTE_CACHE_ROOT, x)).filter(x => !this.remoteAppsCache.has(toHash(x))).slice(this.remoteAppsCacheLimit - this.remoteAppsCache.keys().length);

  if (!_lodash.default.isEmpty(entriesToCleanup)) {
    try {
      await this.shell(['rm', '-f', ...entriesToCleanup]);

      _logger.default.debug(`Deleted ${entriesToCleanup.length} expired application cache entries`);
    } catch (e) {
      _logger.default.warn(`Cannot delete ${entriesToCleanup.length} expired application cache entries. ` + `Original error: ${e.message}`);
    }
  }

  return remotePath;
};

apkUtilsMethods.install = async function install(appPath, options = {}) {
  if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
    return await this.installApks(appPath, options);
  }

  options = _lodash.default.cloneDeep(options);

  _lodash.default.defaults(options, {
    replace: true,
    timeout: this.adbExecTimeout === _helpers.DEFAULT_ADB_EXEC_TIMEOUT ? _helpers.APK_INSTALL_TIMEOUT : this.adbExecTimeout,
    timeoutCapName: 'androidInstallTimeout'
  });

  const installArgs = (0, _helpers.buildInstallArgs)((await this.getApiLevel()), options);
  const installOpts = {
    timeout: options.timeout,
    timeoutCapName: options.timeoutCapName
  };

  let performAppInstall = async () => await this.adbExec(['install', ...installArgs, appPath], installOpts);

  if (this.remoteAppsCacheLimit > 0) {
    const cachedRemotePath = await this.cacheApk(appPath, {
      timeout: options.timeout
    });

    performAppInstall = async () => await this.shell(['pm', 'install', ...installArgs, cachedRemotePath], installOpts);
  }

  try {
    const started = process.hrtime();
    const output = await performAppInstall();
    const [seconds, nanos] = process.hrtime(started);

    _logger.default.info(`The installation of '${_path.default.basename(appPath)}' took ${(seconds + nanos / 1e9).toFixed(3)}s`);

    const truncatedOutput = !_lodash.default.isString(output) || output.length <= 300 ? output : `${output.substr(0, 150)}...${output.substr(output.length - 150)}`;

    _logger.default.debug(`Install command stdout: ${truncatedOutput}`);

    if (/\[INSTALL[A-Z_]+FAILED[A-Z_]+\]/.test(output)) {
      if (this.isTestPackageOnlyError(output)) {
        const msg = `Set 'allowTestPackages' capability to true in order to allow test packages installation.`;

        _logger.default.warn(msg);

        throw new Error(`${output}\n${msg}`);
      }

      throw new Error(output);
    }
  } catch (err) {
    if (!err.message.includes('INSTALL_FAILED_ALREADY_EXISTS')) {
      throw err;
    }

    _logger.default.debug(`Application '${appPath}' already installed. Continuing.`);
  }
};

apkUtilsMethods.getApplicationInstallState = async function getApplicationInstallState(appPath, pkg = null) {
  let apkInfo = null;

  if (!pkg) {
    apkInfo = await this.getApkInfo(appPath);
    pkg = apkInfo.name;
  }

  if (!pkg) {
    _logger.default.warn(`Cannot read the package name of '${appPath}'`);

    return this.APP_INSTALL_STATE.UNKNOWN;
  }

  if (!(await this.isAppInstalled(pkg))) {
    _logger.default.debug(`App '${appPath}' is not installed`);

    return this.APP_INSTALL_STATE.NOT_INSTALLED;
  }

  const {
    versionCode: pkgVersionCode,
    versionName: pkgVersionNameStr
  } = await this.getPackageInfo(pkg);

  const pkgVersionName = _semver.default.valid(_semver.default.coerce(pkgVersionNameStr));

  if (!apkInfo) {
    apkInfo = await this.getApkInfo(appPath);
  }

  const {
    versionCode: apkVersionCode,
    versionName: apkVersionNameStr
  } = apkInfo;

  const apkVersionName = _semver.default.valid(_semver.default.coerce(apkVersionNameStr));

  if (!_lodash.default.isInteger(apkVersionCode) || !_lodash.default.isInteger(pkgVersionCode)) {
    _logger.default.warn(`Cannot read version codes of '${appPath}' and/or '${pkg}'`);

    if (!_lodash.default.isString(apkVersionName) || !_lodash.default.isString(pkgVersionName)) {
      _logger.default.warn(`Cannot read version names of '${appPath}' and/or '${pkg}'`);

      return this.APP_INSTALL_STATE.UNKNOWN;
    }
  }

  if (_lodash.default.isInteger(apkVersionCode) && _lodash.default.isInteger(pkgVersionCode)) {
    if (pkgVersionCode > apkVersionCode) {
      _logger.default.debug(`The version code of the installed '${pkg}' is greater than the application version code (${pkgVersionCode} > ${apkVersionCode})`);

      return this.APP_INSTALL_STATE.NEWER_VERSION_INSTALLED;
    }

    if (pkgVersionCode === apkVersionCode) {
      if (_lodash.default.isString(apkVersionName) && _lodash.default.isString(pkgVersionName) && _semver.default.satisfies(pkgVersionName, `>=${apkVersionName}`)) {
        _logger.default.debug(`The version name of the installed '${pkg}' is greater or equal to the application version name ('${pkgVersionName}' >= '${apkVersionName}')`);

        return _semver.default.satisfies(pkgVersionName, `>${apkVersionName}`) ? this.APP_INSTALL_STATE.NEWER_VERSION_INSTALLED : this.APP_INSTALL_STATE.SAME_VERSION_INSTALLED;
      }

      if (!_lodash.default.isString(apkVersionName) || !_lodash.default.isString(pkgVersionName)) {
        _logger.default.debug(`The version name of the installed '${pkg}' is equal to application version name (${pkgVersionCode} === ${apkVersionCode})`);

        return this.APP_INSTALL_STATE.SAME_VERSION_INSTALLED;
      }
    }
  } else if (_lodash.default.isString(apkVersionName) && _lodash.default.isString(pkgVersionName) && _semver.default.satisfies(pkgVersionName, `>=${apkVersionName}`)) {
    _logger.default.debug(`The version name of the installed '${pkg}' is greater or equal to the application version name ('${pkgVersionName}' >= '${apkVersionName}')`);

    return _semver.default.satisfies(pkgVersionName, `>${apkVersionName}`) ? this.APP_INSTALL_STATE.NEWER_VERSION_INSTALLED : this.APP_INSTALL_STATE.SAME_VERSION_INSTALLED;
  }

  _logger.default.debug(`The installed '${pkg}' package is older than '${appPath}' (${pkgVersionCode} < ${apkVersionCode} or '${pkgVersionName}' < '${apkVersionName}')'`);

  return this.APP_INSTALL_STATE.OLDER_VERSION_INSTALLED;
};

apkUtilsMethods.installOrUpgrade = async function installOrUpgrade(appPath, pkg = null, options = {}) {
  if (!pkg) {
    const apkInfo = await this.getApkInfo(appPath);
    pkg = apkInfo.name;
  }

  const {
    enforceCurrentBuild
  } = options;
  const appState = await this.getApplicationInstallState(appPath, pkg);
  let wasUninstalled = false;

  const uninstallPackage = async () => {
    if (!(await this.uninstallApk(pkg))) {
      throw new Error(`'${pkg}' package cannot be uninstalled`);
    }

    wasUninstalled = true;
  };

  switch (appState) {
    case this.APP_INSTALL_STATE.NOT_INSTALLED:
      _logger.default.debug(`Installing '${appPath}'`);

      await this.install(appPath, Object.assign({}, options, {
        replace: false
      }));
      return {
        appState,
        wasUninstalled
      };

    case this.APP_INSTALL_STATE.NEWER_VERSION_INSTALLED:
      if (enforceCurrentBuild) {
        _logger.default.info(`Downgrading '${pkg}' as requested`);

        await uninstallPackage();
        break;
      }

      _logger.default.debug(`There is no need to downgrade '${pkg}'`);

      return {
        appState,
        wasUninstalled
      };

    case this.APP_INSTALL_STATE.SAME_VERSION_INSTALLED:
      if (enforceCurrentBuild) {
        break;
      }

      _logger.default.debug(`There is no need to install/upgrade '${appPath}'`);

      return {
        appState,
        wasUninstalled
      };

    case this.APP_INSTALL_STATE.OLDER_VERSION_INSTALLED:
      _logger.default.debug(`Executing upgrade of '${appPath}'`);

      break;

    default:
      _logger.default.debug(`The current install state of '${appPath}' is unknown. Installing anyway`);

      break;
  }

  try {
    await this.install(appPath, Object.assign({}, options, {
      replace: true
    }));
  } catch (err) {
    _logger.default.warn(`Cannot install/upgrade '${pkg}' because of '${err.message}'. Trying full reinstall`);

    await uninstallPackage();
    await this.install(appPath, Object.assign({}, options, {
      replace: false
    }));
  }

  return {
    appState,
    wasUninstalled
  };
};

apkUtilsMethods.extractStringsFromApk = async function extractStringsFromApk(appPath, language, out) {
  _logger.default.debug(`Extracting strings from for language: ${language || 'default'}`);

  const originalAppPath = appPath;

  if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
    appPath = await this.extractLanguageApk(appPath, language);
  }

  let apkStrings = {};
  let configMarker;

  try {
    await this.initAapt();
    configMarker = await (0, _helpers.formatConfigMarker)(async () => {
      const {
        stdout
      } = await (0, _teen_process.exec)(this.binaries.aapt, ['d', 'configurations', appPath]);
      return stdout.split(_os.default.EOL);
    }, language, '(default)');
    const {
      stdout
    } = await (0, _teen_process.exec)(this.binaries.aapt, ['d', '--values', 'resources', appPath]);
    apkStrings = (0, _helpers.parseAaptStrings)(stdout, configMarker);
  } catch (e) {
    _logger.default.debug('Cannot extract resources using aapt. Trying aapt2. ' + `Original error: ${e.stderr || e.message}`);

    await this.initAapt2();
    configMarker = await (0, _helpers.formatConfigMarker)(async () => {
      const apkanalyzerPath = await (0, _helpers.getApkanalyzerForOs)(this);
      const {
        stdout
      } = await (0, _teen_process.exec)(apkanalyzerPath, ['resources', 'configs', '--type', 'string', appPath], {
        shell: true,
        cwd: _path.default.dirname(apkanalyzerPath)
      });
      return stdout.split(_os.default.EOL);
    }, language, '');

    try {
      const {
        stdout
      } = await (0, _teen_process.exec)(this.binaries.aapt2, ['dump', appPath]);
      apkStrings = (0, _helpers.parseAapt2Strings)(stdout, configMarker);
    } catch (e) {
      throw new Error(`Cannot extract resources from '${originalAppPath}'. ` + `Original error: ${e.message}`);
    }
  }

  if (_lodash.default.isEmpty(apkStrings)) {
    _logger.default.warn(`No strings have been found in '${originalAppPath}' resources ` + `for '${configMarker || 'default'}' configuration`);
  } else {
    _logger.default.info(`Successfully extracted ${_lodash.default.keys(apkStrings).length} strings from ` + `'${originalAppPath}' resources for '${configMarker || 'default'}' configuration`);
  }

  const localPath = _path.default.resolve(out, 'strings.json');

  await (0, _appiumSupport.mkdirp)(out);
  await _appiumSupport.fs.writeFile(localPath, JSON.stringify(apkStrings, null, 2), 'utf-8');
  return {
    apkStrings,
    localPath
  };
};

apkUtilsMethods.getDeviceLanguage = async function getDeviceLanguage() {
  let language;

  if ((await this.getApiLevel()) < 23) {
    language = await this.getDeviceSysLanguage();

    if (!language) {
      language = await this.getDeviceProductLanguage();
    }
  } else {
    language = (await this.getDeviceLocale()).split('-')[0];
  }

  return language;
};

apkUtilsMethods.getDeviceCountry = async function getDeviceCountry() {
  let country = await this.getDeviceSysCountry();

  if (!country) {
    country = await this.getDeviceProductCountry();
  }

  return country;
};

apkUtilsMethods.getDeviceLocale = async function getDeviceLocale() {
  let locale = await this.getDeviceSysLocale();

  if (!locale) {
    locale = await this.getDeviceProductLocale();
  }

  return locale;
};

apkUtilsMethods.setDeviceLocale = async function setDeviceLocale(locale) {
  const validateLocale = new RegExp(/[a-zA-Z]+-[a-zA-Z0-9]+/);

  if (!validateLocale.test(locale)) {
    _logger.default.warn(`setDeviceLocale requires the following format: en-US or ja-JP`);

    return;
  }

  let split_locale = locale.split('-');
  await this.setDeviceLanguageCountry(split_locale[0], split_locale[1]);
};

apkUtilsMethods.ensureCurrentLocale = async function ensureCurrentLocale(language, country, script = null) {
  const hasLanguage = _lodash.default.isString(language);

  const hasCountry = _lodash.default.isString(country);

  if (!hasLanguage && !hasCountry) {
    _logger.default.warn('ensureCurrentLocale requires language or country');

    return false;
  }

  language = (language || '').toLowerCase();
  country = (country || '').toLowerCase();
  const apiLevel = await this.getApiLevel();
  return await (0, _asyncbox.retryInterval)(5, 1000, async () => {
    try {
      if (apiLevel < 23) {
        let curLanguage, curCountry;

        if (hasLanguage) {
          curLanguage = (await this.getDeviceLanguage()).toLowerCase();

          if (!hasCountry && language === curLanguage) {
            return true;
          }
        }

        if (hasCountry) {
          curCountry = (await this.getDeviceCountry()).toLowerCase();

          if (!hasLanguage && country === curCountry) {
            return true;
          }
        }

        if (language === curLanguage && country === curCountry) {
          return true;
        }
      } else {
        const curLocale = (await this.getDeviceLocale()).toLowerCase();
        const localeCode = script ? `${language}-${script.toLowerCase()}-${country}` : `${language}-${country}`;

        if (localeCode === curLocale) {
          _logger.default.debug(`Requested locale is equal to current locale: '${curLocale}'`);

          return true;
        }
      }

      return false;
    } catch (err) {
      _logger.default.error(`Unable to check device localization: ${err.message}`);

      _logger.default.debug('Restarting ADB and retrying...');

      await this.restartAdb();
      throw err;
    }
  });
};

apkUtilsMethods.setDeviceLanguageCountry = async function setDeviceLanguageCountry(language, country, script = null) {
  let hasLanguage = language && _lodash.default.isString(language);

  let hasCountry = country && _lodash.default.isString(country);

  if (!hasLanguage || !hasCountry) {
    _logger.default.warn(`setDeviceLanguageCountry requires language and country at least`);

    _logger.default.warn(`Got language: '${language}' and country: '${country}'`);

    return;
  }

  let apiLevel = await this.getApiLevel();
  language = (language || '').toLowerCase();
  country = (country || '').toUpperCase();

  if (apiLevel < 23) {
    let curLanguage = (await this.getDeviceLanguage()).toLowerCase();
    let curCountry = (await this.getDeviceCountry()).toUpperCase();

    if (language !== curLanguage || country !== curCountry) {
      await this.setDeviceSysLocaleViaSettingApp(language, country);
    }
  } else {
    let curLocale = await this.getDeviceLocale();
    const localeCode = script ? `${language}-${script}-${country}` : `${language}-${country}`;

    _logger.default.debug(`Current locale: '${curLocale}'; requested locale: '${localeCode}'`);

    if (localeCode.toLowerCase() !== curLocale.toLowerCase()) {
      await this.setDeviceSysLocaleViaSettingApp(language, country, script);
    }
  }
};

apkUtilsMethods.getApkInfo = async function getApkInfo(appPath) {
  if (!(await _appiumSupport.fs.exists(appPath))) {
    throw new Error(`The file at path ${appPath} does not exist or is not accessible`);
  }

  if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
    appPath = await this.extractBaseApk(appPath);
  }

  try {
    const apkReader = await _adbkitApkreader.default.open(appPath);
    const manifest = await apkReader.readManifest();
    const {
      pkg,
      versionName,
      versionCode
    } = (0, _helpers.parseManifest)(manifest);
    return {
      name: pkg,
      versionCode,
      versionName
    };
  } catch (e) {
    _logger.default.warn(`Error '${e.message}' while getting badging info`);
  }

  return {};
};

apkUtilsMethods.getPackageInfo = async function getPackageInfo(pkg) {
  _logger.default.debug(`Getting package info for '${pkg}'`);

  let result = {
    name: pkg
  };

  try {
    const stdout = await this.shell(['dumpsys', 'package', pkg]);
    const versionNameMatch = new RegExp(/versionName=([\d+.]+)/).exec(stdout);

    if (versionNameMatch) {
      result.versionName = versionNameMatch[1];
    }

    const versionCodeMatch = new RegExp(/versionCode=(\d+)/).exec(stdout);

    if (versionCodeMatch) {
      result.versionCode = parseInt(versionCodeMatch[1], 10);
    }

    return result;
  } catch (err) {
    _logger.default.warn(`Error '${err.message}' while dumping package info`);
  }

  return result;
};

apkUtilsMethods.pullApk = async function pullApk(pkg, tmpDir) {
  const pkgPath = (await this.adbExec(['shell', 'pm', 'path', pkg])).replace('package:', '');

  const tmpApp = _path.default.resolve(tmpDir, `${pkg}.apk`);

  await this.pull(pkgPath, tmpApp);

  _logger.default.debug(`Pulled app for package '${pkg}' to '${tmpApp}'`);

  return tmpApp;
};

var _default = apkUtilsMethods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9hcGstdXRpbHMuanMiXSwibmFtZXMiOlsiYXBrVXRpbHNNZXRob2RzIiwiQUNUSVZJVElFU19UUk9VQkxFU0hPT1RJTkdfTElOSyIsIkFQUF9JTlNUQUxMX1NUQVRFIiwiVU5LTk9XTiIsIk5PVF9JTlNUQUxMRUQiLCJORVdFUl9WRVJTSU9OX0lOU1RBTExFRCIsIlNBTUVfVkVSU0lPTl9JTlNUQUxMRUQiLCJPTERFUl9WRVJTSU9OX0lOU1RBTExFRCIsIlJFTU9URV9DQUNIRV9ST09UIiwiaXNBcHBJbnN0YWxsZWQiLCJwa2ciLCJsb2ciLCJkZWJ1ZyIsImluc3RhbGxlZFBhdHRlcm4iLCJSZWdFeHAiLCJfIiwiZXNjYXBlUmVnRXhwIiwic3Rkb3V0Iiwic2hlbGwiLCJpc0luc3RhbGxlZCIsInRlc3QiLCJlIiwiRXJyb3IiLCJtZXNzYWdlIiwic3RhcnRVcmkiLCJ1cmkiLCJhcmdzIiwicmVwbGFjZSIsInJlcyIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJzdGFydEFwcCIsInN0YXJ0QXBwT3B0aW9ucyIsImFjdGl2aXR5IiwiY2xvbmUiLCJkZWZhdWx0cyIsIndhaXRQa2ciLCJ3YWl0Rm9yTGF1bmNoIiwid2FpdEFjdGl2aXR5IiwicmV0cnkiLCJzdG9wQXBwIiwiYXBpTGV2ZWwiLCJnZXRBcGlMZXZlbCIsImNtZCIsInNoZWxsT3B0cyIsImlzSW50ZWdlciIsIndhaXREdXJhdGlvbiIsInRpbWVvdXQiLCJzdGFydHNXaXRoIiwid2FpdEZvckFjdGl2aXR5IiwiZHVtcFdpbmRvd3MiLCJkdW1wc3lzQXJnIiwiZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eSIsIm51bGxGb2N1c2VkQXBwUmUiLCJmb2N1c2VkQXBwUmUiLCJudWxsQ3VycmVudEZvY3VzUmUiLCJjdXJyZW50Rm9jdXNBcHBSZSIsInBhdHRlcm4iLCJtYXRjaCIsImV4ZWMiLCJhcHBQYWNrYWdlIiwidHJpbSIsImFwcEFjdGl2aXR5Iiwid2FpdEZvckFjdGl2aXR5T3JOb3QiLCJ3YWl0Rm9yU3RvcCIsIndhaXRNcyIsInNwbGl0TmFtZXMiLCJuYW1lcyIsInNwbGl0IiwibWFwIiwibmFtZSIsImFsbFBhY2thZ2VzIiwiYWxsQWN0aXZpdGllcyIsInBvc3NpYmxlQWN0aXZpdHlOYW1lcyIsIm9uZUFjdGl2aXR5IiwiY3VycmVudFBrZyIsInB1c2giLCJqb2luIiwicG9zc2libGVBY3Rpdml0eVBhdHRlcm5zIiwicG9zc2libGVBY3Rpdml0eU5hbWUiLCJyZXRyaWVzIiwicGFyc2VJbnQiLCJpc05hTiIsImZ1bGx5UXVhbGlmaWVkQWN0aXZpdHkiLCJmb3VuZEFjdCIsImZpbmRJbmRleCIsInBvc3NpYmxlUGF0dGVybiIsImFjdCIsIndhaXRGb3JOb3RBY3Rpdml0eSIsInVuaW5zdGFsbEFwayIsIm9wdGlvbnMiLCJpbmZvIiwia2VlcERhdGEiLCJmb3JjZVN0b3AiLCJhZGJFeGVjIiwiaW5zdGFsbEZyb21EZXZpY2VQYXRoIiwiYXBrUGF0aE9uRGV2aWNlIiwib3B0cyIsImluZGV4T2YiLCJjYWNoZUFwayIsImFwa1BhdGgiLCJhcHBIYXNoIiwiZnMiLCJoYXNoIiwicmVtb3RlUGF0aCIsInBhdGgiLCJwb3NpeCIsInJlbW90ZUNhY2hlZEZpbGVzIiwiZXJyb3JNYXJrZXIiLCJsc091dHB1dCIsIl9hcmVFeHRlbmRlZExzT3B0aW9uc1N1cHBvcnRlZCIsImlzQm9vbGVhbiIsImlzU3RyaW5nIiwic3Vic3RyaW5nIiwieCIsImZpbHRlciIsIkJvb2xlYW4iLCJsZW5ndGgiLCJ0b0hhc2giLCJwYXJzZSIsImZpbmQiLCJzdGFydGVkIiwicHJvY2VzcyIsImhydGltZSIsInNlY29uZHMiLCJuYW5vcyIsInNpemUiLCJzdGF0IiwiYmFzZW5hbWUiLCJ1dGlsIiwidG9SZWFkYWJsZVNpemVTdHJpbmciLCJ0b0ZpeGVkIiwicmVtb3RlQXBwc0NhY2hlIiwiTFJVIiwibWF4IiwicmVtb3RlQXBwc0NhY2hlTGltaXQiLCJkaWZmZXJlbmNlIiwia2V5cyIsImZvckVhY2giLCJkZWwiLCJzZXQiLCJlbnRyaWVzVG9DbGVhbnVwIiwiaGFzIiwic2xpY2UiLCJpc0VtcHR5Iiwid2FybiIsImluc3RhbGwiLCJhcHBQYXRoIiwiZW5kc1dpdGgiLCJBUEtTX0VYVEVOU0lPTiIsImluc3RhbGxBcGtzIiwiY2xvbmVEZWVwIiwiYWRiRXhlY1RpbWVvdXQiLCJERUZBVUxUX0FEQl9FWEVDX1RJTUVPVVQiLCJBUEtfSU5TVEFMTF9USU1FT1VUIiwidGltZW91dENhcE5hbWUiLCJpbnN0YWxsQXJncyIsImluc3RhbGxPcHRzIiwicGVyZm9ybUFwcEluc3RhbGwiLCJjYWNoZWRSZW1vdGVQYXRoIiwib3V0cHV0IiwidHJ1bmNhdGVkT3V0cHV0Iiwic3Vic3RyIiwiaXNUZXN0UGFja2FnZU9ubHlFcnJvciIsIm1zZyIsImVyciIsImdldEFwcGxpY2F0aW9uSW5zdGFsbFN0YXRlIiwiYXBrSW5mbyIsImdldEFwa0luZm8iLCJ2ZXJzaW9uQ29kZSIsInBrZ1ZlcnNpb25Db2RlIiwidmVyc2lvbk5hbWUiLCJwa2dWZXJzaW9uTmFtZVN0ciIsImdldFBhY2thZ2VJbmZvIiwicGtnVmVyc2lvbk5hbWUiLCJzZW12ZXIiLCJ2YWxpZCIsImNvZXJjZSIsImFwa1ZlcnNpb25Db2RlIiwiYXBrVmVyc2lvbk5hbWVTdHIiLCJhcGtWZXJzaW9uTmFtZSIsInNhdGlzZmllcyIsImluc3RhbGxPclVwZ3JhZGUiLCJlbmZvcmNlQ3VycmVudEJ1aWxkIiwiYXBwU3RhdGUiLCJ3YXNVbmluc3RhbGxlZCIsInVuaW5zdGFsbFBhY2thZ2UiLCJPYmplY3QiLCJhc3NpZ24iLCJleHRyYWN0U3RyaW5nc0Zyb21BcGsiLCJsYW5ndWFnZSIsIm91dCIsIm9yaWdpbmFsQXBwUGF0aCIsImV4dHJhY3RMYW5ndWFnZUFwayIsImFwa1N0cmluZ3MiLCJjb25maWdNYXJrZXIiLCJpbml0QWFwdCIsImJpbmFyaWVzIiwiYWFwdCIsIm9zIiwiRU9MIiwic3RkZXJyIiwiaW5pdEFhcHQyIiwiYXBrYW5hbHl6ZXJQYXRoIiwiY3dkIiwiZGlybmFtZSIsImFhcHQyIiwibG9jYWxQYXRoIiwicmVzb2x2ZSIsIndyaXRlRmlsZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJnZXREZXZpY2VMYW5ndWFnZSIsImdldERldmljZVN5c0xhbmd1YWdlIiwiZ2V0RGV2aWNlUHJvZHVjdExhbmd1YWdlIiwiZ2V0RGV2aWNlTG9jYWxlIiwiZ2V0RGV2aWNlQ291bnRyeSIsImNvdW50cnkiLCJnZXREZXZpY2VTeXNDb3VudHJ5IiwiZ2V0RGV2aWNlUHJvZHVjdENvdW50cnkiLCJsb2NhbGUiLCJnZXREZXZpY2VTeXNMb2NhbGUiLCJnZXREZXZpY2VQcm9kdWN0TG9jYWxlIiwic2V0RGV2aWNlTG9jYWxlIiwidmFsaWRhdGVMb2NhbGUiLCJzcGxpdF9sb2NhbGUiLCJzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkiLCJlbnN1cmVDdXJyZW50TG9jYWxlIiwic2NyaXB0IiwiaGFzTGFuZ3VhZ2UiLCJoYXNDb3VudHJ5IiwiY3VyTGFuZ3VhZ2UiLCJjdXJDb3VudHJ5IiwiY3VyTG9jYWxlIiwibG9jYWxlQ29kZSIsImVycm9yIiwicmVzdGFydEFkYiIsInRvVXBwZXJDYXNlIiwic2V0RGV2aWNlU3lzTG9jYWxlVmlhU2V0dGluZ0FwcCIsImV4aXN0cyIsImV4dHJhY3RCYXNlQXBrIiwiYXBrUmVhZGVyIiwiQXBrUmVhZGVyIiwib3BlbiIsIm1hbmlmZXN0IiwicmVhZE1hbmlmZXN0IiwicmVzdWx0IiwidmVyc2lvbk5hbWVNYXRjaCIsInZlcnNpb25Db2RlTWF0Y2giLCJwdWxsQXBrIiwidG1wRGlyIiwicGtnUGF0aCIsInRtcEFwcCIsInB1bGwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBSUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsSUFBSUEsZUFBZSxHQUFHLEVBQXRCO0FBRUEsTUFBTUMsK0JBQStCLEdBQ25DLHlHQURGO0FBRUFELGVBQWUsQ0FBQ0UsaUJBQWhCLEdBQW9DO0FB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QUcsQ0FBQzlJLE9BQVEsOEJBQS9CO0FBQ0Q7O0FBQ0QsU0FBTytOLE1BQVA7QUFDRCxDQWxCRDs7QUFvQkF0UCxlQUFlLENBQUN5UCxPQUFoQixHQUEwQixlQUFlQSxPQUFmLENBQXdCL08sR0FBeEIsRUFBNkJnUCxNQUE3QixFQUFxQztBQUM3RCxRQUFNQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUs3SixPQUFMLENBQWEsQ0FBQyxPQUFELEVBQVUsSUFBVixFQUFnQixNQUFoQixFQUF3QnBGLEdBQXhCLENBQWIsQ0FBUCxFQUFtRGlCLE9BQW5ELENBQTJELFVBQTNELEVBQXVFLEVBQXZFLENBQWhCOztBQUNBLFFBQU1pTyxNQUFNLEdBQUduSixjQUFLdUcsT0FBTCxDQUFhMEMsTUFBYixFQUFzQixHQUFFaFAsR0FBSSxNQUE1QixDQUFmOztBQUNBLFFBQU0sS0FBS21QLElBQUwsQ0FBVUYsT0FBVixFQUFtQkMsTUFBbkIsQ0FBTjs7QUFDQWpQLGtCQUFJQyxLQUFKLENBQVcsMkJBQTBCRixHQUFJLFNBQVFrUCxNQUFPLEdBQXhEOztBQUNBLFNBQU9BLE1BQVA7QUFDRCxDQU5EOztlQVNlNVAsZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIGJ1aWxkU3RhcnRDbWQsIEFQS1NfRVhURU5TSU9OLCBidWlsZEluc3RhbGxBcmdzLFxuICBBUEtfSU5TVEFMTF9USU1FT1VULCBERUZBVUxUX0FEQl9FWEVDX1RJTUVPVVQsIGdldEFwa2FuYWx5emVyRm9yT3MsXG4gIHBhcnNlTWFuaWZlc3QsIHBhcnNlQWFwdFN0cmluZ3MsIHBhcnNlQWFwdDJTdHJpbmdzLCBmb3JtYXRDb25maWdNYXJrZXIgfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXIuanMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmV0cnlJbnRlcnZhbCB9IGZyb20gJ2FzeW5jYm94JztcbmltcG9ydCB7IGZzLCB1dGlsLCBta2RpcnAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IExSVSBmcm9tICdscnUtY2FjaGUnO1xuaW1wb3J0IEFwa1JlYWRlciBmcm9tICdhZGJraXQtYXBrcmVhZGVyJztcblxuXG5sZXQgYXBrVXRpbHNNZXRob2RzID0ge307XG5cbmNvbnN0IEFDVElWSVRJRVNfVFJPVUJMRVNIT09USU5HX0xJTksgPVxuICAnaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vYmxvYi9tYXN0ZXIvZG9jcy9lbi93cml0aW5nLXJ1bm5pbmctYXBwaXVtL2FuZHJvaWQvYWN0aXZpdHktc3RhcnR1cC5tZCc7XG5hcGtVdGlsc01ldGhvZHMuQVBQX0lOU1RBTExfU1RBVEUgPSB7XG4gIFVOS05PV046ICd1bmtub3duJyxcbiAgTk9UX0lOU1RBTExFRDogJ25vdEluc3RhbGxlZCcsXG4gIE5FV0VSX1ZFUlNJT05fSU5TVEFMTEVEOiAnbmV3ZXJWZXJzaW9uSW5zdGFsbGVkJyxcbiAgU0FNRV9WRVJTSU9OX0lOU1RBTExFRDogJ3NhbWVWZXJzaW9uSW5zdGFsbGVkJyxcbiAgT0xERVJfVkVSU0lPTl9JTlNUQUxMRUQ6ICdvbGRlclZlcnNpb25JbnN0YWxsZWQnLFxufTtcbmNvbnN0IFJFTU9URV9DQUNIRV9ST09UID0gJy9kYXRhL2xvY2FsL3RtcC9hcHBpdW1fY2FjaGUnO1xuXG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgcGFydGljdWxhciBwYWNrYWdlIGlzIHByZXNlbnQgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhY2thZ2UgaXMgaW5zdGFsbGVkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBkZXRlY3RpbmcgYXBwbGljYXRpb24gc3RhdGVcbiAqL1xuYXBrVXRpbHNNZXRob2RzLmlzQXBwSW5zdGFsbGVkID0gYXN5bmMgZnVuY3Rpb24gaXNBcHBJbnN0YWxsZWQgKHBrZykge1xuICBsb2cuZGVidWcoYEdldHRpbmcgaW5zdGFsbCBzdGF0dXMgZm9yICR7cGtnfWApO1xuICBjb25zdCBpbnN0YWxsZWRQYXR0ZXJuID0gbmV3IFJlZ0V4cChgXlxcXFxzKlBhY2thZ2VcXFxccytcXFxcWyR7Xy5lc2NhcGVSZWdFeHAocGtnKX1cXFxcXVteOl0rOiRgLCAnbScpO1xuICB0cnkge1xuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgICBjb25zdCBpc0luc3RhbGxlZCA9IGluc3RhbGxlZFBhdHRlcm4udGVzdChzdGRvdXQpO1xuICAgIGxvZy5kZWJ1ZyhgJyR7cGtnfScgaXMkeyFpc0luc3RhbGxlZCA/ICcgbm90JyA6ICcnfSBpbnN0YWxsZWRgKTtcbiAgICByZXR1cm4gaXNJbnN0YWxsZWQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGZpbmRpbmcgaWYgJyR7cGtnfScgaXMgaW5zdGFsbGVkLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU3RhcnQgdGhlIHBhcnRpY3VsYXIgVVJJIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gVGhlIG5hbWUgb2YgVVJJIHRvIHN0YXJ0LlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIHN0YXJ0IHRoZSBVUkkgd2l0aC5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLnN0YXJ0VXJpID0gYXN5bmMgZnVuY3Rpb24gc3RhcnRVcmkgKHVyaSwgcGtnKSB7XG4gIGlmICghdXJpIHx8ICFwa2cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VSSSBhbmQgcGFja2FnZSBhcmd1bWVudHMgYXJlIHJlcXVpcmVkJyk7XG4gIH1cblxuICBjb25zdCBhcmdzID0gW1xuICAgICdhbScsICdzdGFydCcsXG4gICAgJy1XJyxcbiAgICAnLWEnLCAnYW5kcm9pZC5pbnRlbnQuYWN0aW9uLlZJRVcnLFxuICAgICctZCcsIHVyaS5yZXBsYWNlKC8mL2csICdcXFxcJicpLFxuICAgIHBrZyxcbiAgXTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnNoZWxsKGFyZ3MpO1xuICAgIGlmIChyZXMudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndW5hYmxlIHRvIHJlc29sdmUgaW50ZW50JykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihyZXMpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgYXR0ZW1wdGluZyB0byBzdGFydCBVUkkuIE9yaWdpbmFsIGVycm9yOiAke2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gU3RhcnRBcHBPcHRpb25zXG4gKiBAcHJvcGVydHkgeyFzdHJpbmd9IGFjdGl2aXR5IC0gVGhlIG5hbWUgb2YgdGhlIG1haW4gYXBwbGljYXRpb24gYWN0aXZpdHlcbiAqIEBwcm9wZXJ0eSB7IXN0cmluZ30gcGtnIC0gVGhlIG5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uIHBhY2thZ2VcbiAqIEBwcm9wZXJ0eSB7P2Jvb2xlYW59IHJldHJ5IFt0cnVlXSAtIElmIHRoaXMgcHJvcGVydHkgaXMgc2V0IHRvIGB0cnVlYFxuICogYW5kIHRoZSBhY3Rpdml0eSBuYW1lIGRvZXMgbm90IHN0YXJ0IHdpdGggJy4nIHRoZW4gdGhlIG1ldGhvZFxuICogd2lsbCB0cnkgdG8gYWRkIHRoZSBtaXNzaW5nIGRvdCBhbmQgc3RhcnQgdGhlIGFjdGl2aXR5IG9uY2UgbW9yZVxuICogaWYgdGhlIGZpcnN0IHN0YXJ0dXAgdHJ5IGZhaWxzLlxuICogQHByb3BlcnR5IHs/Ym9vbGVhbn0gc3RvcEFwcCBbdHJ1ZV0gLSBTZXQgaXQgdG8gYHRydWVgIGluIG9yZGVyIHRvIGZvcmNlZnVsbHlcbiAqIHN0b3AgdGhlIGFjdGl2aXR5IGlmIGl0IGlzIGFscmVhZHkgcnVubmluZy5cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ30gd2FpdFBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIHdhaXQgdG8gb25cbiAqIHN0YXJ0dXAgKHRoaXMgb25seSBtYWtlcyBzZW5zZSBpZiB0aGlzIG5hbWUgaXMgZGlmZmVyZW50IGZyb20gdGhlIG9uZSwgd2hpY2ggaXMgc2V0IGFzIGBwa2dgKVxuICogQHByb3BlcnR5IHs/c3RyaW5nfSB3YWl0QWN0aXZpdHkgLSBUaGUgbmFtZSBvZiB0aGUgYWN0aXZpdHkgdG8gd2FpdCB0byBvblxuICogc3RhcnR1cCAodGhpcyBvbmx5IG1ha2VzIHNlbnNlIGlmIHRoaXMgbmFtZSBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgb25lLCB3aGljaCBpcyBzZXQgYXMgYGFjdGl2aXR5YClcbiAqIEBwcm9wZXJ0eSB7P251bWJlcn0gd2FpdER1cmF0aW9uIC0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCB1bnRpbCB0aGVcbiAqIGB3YWl0QWN0aXZpdHlgIGlzIGZvY3VzZWRcbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ3xudW1iZXJ9IHVzZXIgLSBUaGUgbnVtYmVyIG9mIHRoZSB1c2VyIHByb2ZpbGUgdG8gc3RhcnRcbiAqIHRoZSBnaXZlbiBhY3Rpdml0eSB3aXRoLiBUaGUgZGVmYXVsdCBPUyB1c2VyIHByb2ZpbGUgKHVzdWFsbHkgemVybykgaXMgdXNlZFxuICogd2hlbiB0aGlzIHByb3BlcnR5IGlzIHVuc2V0XG4gKiBAcHJvcGVydHkgez9ib29sZWFufSB3YWl0Rm9yTGF1bmNoIFt0cnVlXSAtIGlmIGBmYWxzZWAgdGhlbiBhZGIgd29uJ3Qgd2FpdFxuICogZm9yIHRoZSBzdGFydGVkIGFjdGl2aXR5IHRvIHJldHVybiB0aGUgY29udHJvbFxuICovXG5cbi8qKlxuICogU3RhcnQgdGhlIHBhcnRpY3VsYXIgcGFja2FnZS9hY3Rpdml0eSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtTdGFydEFwcE9wdGlvbnN9IHN0YXJ0QXBwT3B0aW9ucyBbe31dIC0gU3RhcnR1cCBvcHRpb25zIG1hcHBpbmcuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBvdXRwdXQgb2YgdGhlIGNvcnJlc3BvbmRpbmcgYWRiIGNvbW1hbmQuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgaXMgYW4gZXJyb3Igd2hpbGUgZXhlY3V0aW5nIHRoZSBhY3Rpdml0eVxuICovXG5hcGtVdGlsc01ldGhvZHMuc3RhcnRBcHAgPSBhc3luYyBmdW5jdGlvbiBzdGFydEFwcCAoc3RhcnRBcHBPcHRpb25zID0ge30pIHtcbiAgaWYgKCFzdGFydEFwcE9wdGlvbnMuYWN0aXZpdHkgfHwgIXN0YXJ0QXBwT3B0aW9ucy5wa2cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FjdGl2aXR5IGFuZCBwa2cgYXJlIHJlcXVpcmVkIHRvIHN0YXJ0IGFuIGFwcGxpY2F0aW9uJyk7XG4gIH1cblxuICBzdGFydEFwcE9wdGlvbnMgPSBfLmNsb25lKHN0YXJ0QXBwT3B0aW9ucyk7XG4gIHN0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eSA9IHN0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eS5yZXBsYWNlKCckJywgJ1xcXFwkJyk7XG4gIC8vIGluaXRpYWxpemluZyBkZWZhdWx0c1xuICBfLmRlZmF1bHRzKHN0YXJ0QXBwT3B0aW9ucywge1xuICAgIHdhaXRQa2c6IHN0YXJ0QXBwT3B0aW9ucy5wa2csXG4gICAgd2FpdEZvckxhdW5jaDogdHJ1ZSxcbiAgICB3YWl0QWN0aXZpdHk6IGZhbHNlLFxuICAgIHJldHJ5OiB0cnVlLFxuICAgIHN0b3BBcHA6IHRydWVcbiAgfSk7XG4gIC8vIHByZXZlbnRpbmcgbnVsbCB3YWl0cGtnXG4gIHN0YXJ0QXBwT3B0aW9ucy53YWl0UGtnID0gc3RhcnRBcHBPcHRpb25zLndhaXRQa2cgfHwgc3RhcnRBcHBPcHRpb25zLnBrZztcblxuICBjb25zdCBhcGlMZXZlbCA9IGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKTtcbiAgY29uc3QgY21kID0gYnVpbGRTdGFydENtZChzdGFydEFwcE9wdGlvbnMsIGFwaUxldmVsKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBzaGVsbE9wdHMgPSB7fTtcbiAgICBpZiAoXy5pc0ludGVnZXIoc3RhcnRBcHBPcHRpb25zLndhaXREdXJhdGlvbikgJiYgc3RhcnRBcHBPcHRpb25zLndhaXREdXJhdGlvbiA+IDIwMDAwKSB7XG4gICAgICBzaGVsbE9wdHMudGltZW91dCA9IHN0YXJ0QXBwT3B0aW9ucy53YWl0RHVyYXRpb247XG4gICAgfVxuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoY21kLCBzaGVsbE9wdHMpO1xuICAgIGlmIChzdGRvdXQuaW5jbHVkZXMoJ0Vycm9yOiBBY3Rpdml0eSBjbGFzcycpICYmIHN0ZG91dC5pbmNsdWRlcygnZG9lcyBub3QgZXhpc3QnKSkge1xuICAgICAgaWYgKHN0YXJ0QXBwT3B0aW9ucy5yZXRyeSAmJiAhc3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5LnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICBsb2cuZGVidWcoYFdlIHRyaWVkIHRvIHN0YXJ0IGFuIGFjdGl2aXR5IHRoYXQgZG9lc24ndCBleGlzdCwgYCArXG4gICAgICAgICAgICAgICAgICBgcmV0cnlpbmcgd2l0aCAnLiR7c3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5fScgYWN0aXZpdHkgbmFtZWApO1xuICAgICAgICBzdGFydEFwcE9wdGlvbnMuYWN0aXZpdHkgPSBgLiR7c3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5fWA7XG4gICAgICAgIHN0YXJ0QXBwT3B0aW9ucy5yZXRyeSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zdGFydEFwcChzdGFydEFwcE9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBY3Rpdml0eSBuYW1lICcke3N0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eX0nIHVzZWQgdG8gc3RhcnQgdGhlIGFwcCBkb2Vzbid0IGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBleGlzdCBvciBjYW5ub3QgYmUgbGF1bmNoZWQhIE1ha2Ugc3VyZSBpdCBleGlzdHMgYW5kIGlzIGEgbGF1bmNoYWJsZSBhY3Rpdml0eWApO1xuICAgIH0gZWxzZSBpZiAoc3Rkb3V0LmluY2x1ZGVzKCdqYXZhLmxhbmcuU2VjdXJpdHlFeGNlcHRpb24nKSkge1xuICAgICAgLy8gaWYgdGhlIGFwcCBpcyBkaXNhYmxlZCBvbiBhIHJlYWwgZGV2aWNlIGl0IHdpbGwgdGhyb3cgYSBzZWN1cml0eSBleGNlcHRpb25cbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHBlcm1pc3Npb24gdG8gc3RhcnQgJyR7c3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5fScgYWN0aXZpdHkgaGFzIGJlZW4gZGVuaWVkLmAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBNYWtlIHN1cmUgdGhlIGFjdGl2aXR5L3BhY2thZ2UgbmFtZXMgYXJlIGNvcnJlY3QuYCk7XG4gICAgfVxuICAgIGlmIChzdGFydEFwcE9wdGlvbnMud2FpdEFjdGl2aXR5KSB7XG4gICAgICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eShzdGFydEFwcE9wdGlvbnMud2FpdFBrZywgc3RhcnRBcHBPcHRpb25zLndhaXRBY3Rpdml0eSwgc3RhcnRBcHBPcHRpb25zLndhaXREdXJhdGlvbik7XG4gICAgfVxuICAgIHJldHVybiBzdGRvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzdGFydCB0aGUgJyR7c3RhcnRBcHBPcHRpb25zLnBrZ30nIGFwcGxpY2F0aW9uLiBgICtcbiAgICAgIGBWaXNpdCAke0FDVElWSVRJRVNfVFJPVUJMRVNIT09USU5HX0xJTkt9IGZvciB0cm91Ymxlc2hvb3RpbmcuIGAgK1xuICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBIZWxwZXIgbWV0aG9kIHRvIGNhbGwgYGFkYiBkdW1wc3lzIHdpbmRvdyB3aW5kb3dzL2Rpc3BsYXlzYFxuICovXG5hcGtVdGlsc01ldGhvZHMuZHVtcFdpbmRvd3MgPSBhc3luYyBmdW5jdGlvbiBkdW1wV2luZG93cyAoKSB7XG4gIGNvbnN0IGFwaUxldmVsID0gYXdhaXQgdGhpcy5nZXRBcGlMZXZlbCgpO1xuXG4gIC8vIFdpdGggdmVyc2lvbiAyOSwgQW5kcm9pZCBjaGFuZ2VkIHRoZSBkdW1wc3lzIHN5bnRheFxuICBjb25zdCBkdW1wc3lzQXJnID0gYXBpTGV2ZWwgPj0gMjkgPyAnZGlzcGxheXMnIDogJ3dpbmRvd3MnO1xuICBjb25zdCBjbWQgPSBbJ2R1bXBzeXMnLCAnd2luZG93JywgZHVtcHN5c0FyZ107XG5cbiAgcmV0dXJuIGF3YWl0IHRoaXMuc2hlbGwoY21kKTtcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gUGFja2FnZUFjdGl2aXR5SW5mb1xuICogQHByb3BlcnR5IHs/c3RyaW5nfSBhcHBQYWNrYWdlIC0gVGhlIG5hbWUgb2YgYXBwbGljYXRpb24gcGFja2FnZSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBleGFtcGxlICdjb20uYWNtZS5hcHAnLlxuICogQHByb3BlcnR5IHs/c3RyaW5nfSBhcHBBY3Rpdml0eSAtIFRoZSBuYW1lIG9mIG1haW4gYXBwbGljYXRpb24gYWN0aXZpdHkuXG4gKi9cblxuLyoqXG4gKiBHZXQgdGhlIG5hbWUgb2YgY3VycmVudGx5IGZvY3VzZWQgcGFja2FnZSBhbmQgYWN0aXZpdHkuXG4gKlxuICogQHJldHVybiB7UGFja2FnZUFjdGl2aXR5SW5mb30gVGhlIG1hcHBpbmcsIHdoZXJlIHByb3BlcnR5IG5hbWVzIGFyZSAnYXBwUGFja2FnZScgYW5kICdhcHBBY3Rpdml0eScuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgaXMgYW4gZXJyb3Igd2hpbGUgcGFyc2luZyB0aGUgZGF0YS5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLmdldEZvY3VzZWRQYWNrYWdlQW5kQWN0aXZpdHkgPSBhc3luYyBmdW5jdGlvbiBnZXRGb2N1c2VkUGFja2FnZUFuZEFjdGl2aXR5ICgpIHtcbiAgbG9nLmRlYnVnKCdHZXR0aW5nIGZvY3VzZWQgcGFja2FnZSBhbmQgYWN0aXZpdHknKTtcbiAgY29uc3QgbnVsbEZvY3VzZWRBcHBSZSA9IG5ldyBSZWdFeHAoL15cXHMqbUZvY3VzZWRBcHA9bnVsbC8sICdtJyk7XG4gIC8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IveFo4dkY3LzFcbiAgY29uc3QgZm9jdXNlZEFwcFJlID0gbmV3IFJlZ0V4cCgnXlxcXFxzKm1Gb2N1c2VkQXBwLitSZWNvcmRcXFxcey4qXFxcXHMoW15cXFxcc1xcXFwvXFxcXH1dKyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFxcXC8oW15cXFxcc1xcXFwvXFxcXH1cXFxcLF0rKVxcXFwsPyhcXFxcc1teXFxcXHNcXFxcL1xcXFx9XSspKlxcXFx9JywgJ20nKTtcbiAgY29uc3QgbnVsbEN1cnJlbnRGb2N1c1JlID0gbmV3IFJlZ0V4cCgvXlxccyptQ3VycmVudEZvY3VzPW51bGwvLCAnbScpO1xuICBjb25zdCBjdXJyZW50Rm9jdXNBcHBSZSA9IG5ldyBSZWdFeHAoJ15cXFxccyptQ3VycmVudEZvY3VzLitcXFxcey4rXFxcXHMoW15cXFxcc1xcXFwvXSspXFxcXC8oW15cXFxcc10rKVxcXFxiJywgJ20nKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuZHVtcFdpbmRvd3MoKTtcbiAgICAvLyBUaGUgb3JkZXIgbWF0dGVycyBoZXJlXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIFtmb2N1c2VkQXBwUmUsIGN1cnJlbnRGb2N1c0FwcFJlXSkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoc3Rkb3V0KTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGFwcFBhY2thZ2U6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgICAgICBhcHBBY3Rpdml0eTogbWF0Y2hbMl0udHJpbSgpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIFtudWxsRm9jdXNlZEFwcFJlLCBudWxsQ3VycmVudEZvY3VzUmVdKSB7XG4gICAgICBpZiAocGF0dGVybi5leGVjKHN0ZG91dCkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhcHBQYWNrYWdlOiBudWxsLFxuICAgICAgICAgIGFwcEFjdGl2aXR5OiBudWxsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcGFyc2UgYWN0aXZpdHkgZnJvbSBkdW1wc3lzJyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBnZXQgZm9jdXNQYWNrYWdlQW5kQWN0aXZpdHkuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBXYWl0IGZvciB0aGUgZ2l2ZW4gYWN0aXZpdHkgdG8gYmUgZm9jdXNlZC9ub24tZm9jdXNlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIG5hbWUgb2YgdGhlIHBhY2thZ2UgdG8gd2FpdCBmb3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aXZpdHkgLSBUaGUgbmFtZSBvZiB0aGUgYWN0aXZpdHksIGJlbG9uZ2luZyB0byB0aGF0IHBhY2thZ2UsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB3YWl0IGZvci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gd2FpdEZvclN0b3AgLSBXaGV0aGVyIHRvIHdhaXQgdW50aWwgdGhlIGFjdGl2aXR5IGlzIGZvY3VzZWQgKHRydWUpXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgaXMgbm90IGZvY3VzZWQgKGZhbHNlKS5cbiAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0TXMgWzIwMDAwXSAtIE51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgdGltZW91dCBvY2N1cnMuXG4gKiBAdGhyb3dzIHtlcnJvcn0gSWYgdGltZW91dCBoYXBwZW5zLlxuICovXG5hcGtVdGlsc01ldGhvZHMud2FpdEZvckFjdGl2aXR5T3JOb3QgPSBhc3luYyBmdW5jdGlvbiB3YWl0Rm9yQWN0aXZpdHlPck5vdCAocGtnLCBhY3Rpdml0eSwgd2FpdEZvclN0b3AsIHdhaXRNcyA9IDIwMDAwKSB7XG4gIGlmICghcGtnIHx8ICFhY3Rpdml0eSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGFja2FnZSBhbmQgYWN0aXZpdHkgcmVxdWlyZWQuJyk7XG4gIH1cbiAgbG9nLmRlYnVnKGBXYWl0aW5nIHVwIHRvICR7d2FpdE1zfW1zIGZvciBhY3Rpdml0eSBtYXRjaGluZyBwa2c6ICcke3BrZ30nIGFuZCBgICtcbiAgICAgICAgICAgIGBhY3Rpdml0eTogJyR7YWN0aXZpdHl9JyB0byR7d2FpdEZvclN0b3AgPyAnIG5vdCcgOiAnJ30gYmUgZm9jdXNlZGApO1xuXG4gIGNvbnN0IHNwbGl0TmFtZXMgPSAobmFtZXMpID0+IG5hbWVzLnNwbGl0KCcsJykubWFwKChuYW1lKSA9PiBuYW1lLnRyaW0oKSk7XG5cbiAgY29uc3QgYWxsUGFja2FnZXMgPSBzcGxpdE5hbWVzKHBrZyk7XG4gIGNvbnN0IGFsbEFjdGl2aXRpZXMgPSBzcGxpdE5hbWVzKGFjdGl2aXR5KTtcblxuICBsZXQgcG9zc2libGVBY3Rpdml0eU5hbWVzID0gW107XG4gIGZvciAobGV0IG9uZUFjdGl2aXR5IG9mIGFsbEFjdGl2aXRpZXMpIHtcbiAgICBpZiAob25lQWN0aXZpdHkuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAvLyBhZGQgdGhlIHBhY2thZ2UgbmFtZSBpZiBhY3Rpdml0eSBpcyBub3QgZnVsbCBxdWFsaWZpZWRcbiAgICAgIGZvciAobGV0IGN1cnJlbnRQa2cgb2YgYWxsUGFja2FnZXMpIHtcbiAgICAgICAgcG9zc2libGVBY3Rpdml0eU5hbWVzLnB1c2goYCR7Y3VycmVudFBrZ30ke29uZUFjdGl2aXR5fWAucmVwbGFjZSgvXFwuKy9nLCAnLicpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYWNjZXB0IGZ1bGx5IHF1YWxpZmllZCBhY3Rpdml0eSBuYW1lLlxuICAgICAgcG9zc2libGVBY3Rpdml0eU5hbWVzLnB1c2gob25lQWN0aXZpdHkpO1xuICAgICAgcG9zc2libGVBY3Rpdml0eU5hbWVzLnB1c2goYCR7cGtnfS4ke29uZUFjdGl2aXR5fWApO1xuICAgIH1cbiAgfVxuICBsb2cuZGVidWcoYFBvc3NpYmxlIGFjdGl2aXRpZXMsIHRvIGJlIGNoZWNrZWQ6ICR7cG9zc2libGVBY3Rpdml0eU5hbWVzLm1hcCgobmFtZSkgPT4gYCcke25hbWV9J2ApLmpvaW4oJywgJyl9YCk7XG5cbiAgbGV0IHBvc3NpYmxlQWN0aXZpdHlQYXR0ZXJucyA9IHBvc3NpYmxlQWN0aXZpdHlOYW1lcy5tYXAoKHBvc3NpYmxlQWN0aXZpdHlOYW1lKSA9PlxuICAgIG5ldyBSZWdFeHAoYF4ke3Bvc3NpYmxlQWN0aXZpdHlOYW1lLnJlcGxhY2UoL1xcLi9nLCAnXFxcXC4nKS5yZXBsYWNlKC9cXCovZywgJy4qPycpLnJlcGxhY2UoL1xcJC9nLCAnXFxcXCQnKX0kYClcbiAgKTtcblxuICAvLyBmaWd1cmUgb3V0IHRoZSBudW1iZXIgb2YgcmV0cmllcy4gVHJ5IG9uY2UgaWYgd2FpdE1zIGlzIGxlc3MgdGhhdCA3NTBcbiAgLy8gMzAgdGltZXMgaWYgcGFyc2luZyBpcyBub3QgcG9zc2libGVcbiAgbGV0IHJldHJpZXMgPSBwYXJzZUludCh3YWl0TXMgLyA3NTAsIDEwKSB8fCAxO1xuICByZXRyaWVzID0gaXNOYU4ocmV0cmllcykgPyAzMCA6IHJldHJpZXM7XG4gIGF3YWl0IHJldHJ5SW50ZXJ2YWwocmV0cmllcywgNzUwLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IHthcHBQYWNrYWdlLCBhcHBBY3Rpdml0eX0gPSBhd2FpdCB0aGlzLmdldEZvY3VzZWRQYWNrYWdlQW5kQWN0aXZpdHkoKTtcbiAgICBpZiAoYXBwQWN0aXZpdHkgJiYgYXBwUGFja2FnZSkge1xuICAgICAgbGV0IGZ1bGx5UXVhbGlmaWVkQWN0aXZpdHkgPSBhcHBBY3Rpdml0eS5zdGFydHNXaXRoKCcuJykgPyBgJHthcHBQYWNrYWdlfSR7YXBwQWN0aXZpdHl9YCA6IGFwcEFjdGl2aXR5O1xuICAgICAgbG9nLmRlYnVnKGBGb3VuZCBwYWNrYWdlOiAnJHthcHBQYWNrYWdlfScgYW5kIGZ1bGx5IHF1YWxpZmllZCBhY3Rpdml0eSBuYW1lIDogJyR7ZnVsbHlRdWFsaWZpZWRBY3Rpdml0eX0nYCk7XG4gICAgICBsZXQgZm91bmRBY3QgPSAoXy5pbmNsdWRlcyhhbGxQYWNrYWdlcywgYXBwUGFja2FnZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICBfLmZpbmRJbmRleChwb3NzaWJsZUFjdGl2aXR5UGF0dGVybnMsIChwb3NzaWJsZVBhdHRlcm4pID0+IHBvc3NpYmxlUGF0dGVybi50ZXN0KGZ1bGx5UXVhbGlmaWVkQWN0aXZpdHkpKSAhPT0gLTEpO1xuICAgICAgaWYgKCghd2FpdEZvclN0b3AgJiYgZm91bmRBY3QpIHx8ICh3YWl0Rm9yU3RvcCAmJiAhZm91bmRBY3QpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgbG9nLmRlYnVnKCdJbmNvcnJlY3QgcGFja2FnZSBhbmQgYWN0aXZpdHkuIFJldHJ5aW5nLicpO1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtwb3NzaWJsZUFjdGl2aXR5TmFtZXMubWFwKChuYW1lKSA9PiBgJyR7bmFtZX0nYCkuam9pbignIG9yICcpfSBuZXZlciAke3dhaXRGb3JTdG9wID8gJ3N0b3BwZWQnIDogJ3N0YXJ0ZWQnfS4gYCArXG4gICAgICBgVmlzaXQgJHtBQ1RJVklUSUVTX1RST1VCTEVTSE9PVElOR19MSU5LfSBmb3IgdHJvdWJsZXNob290aW5nYCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBXYWl0IGZvciB0aGUgZ2l2ZW4gYWN0aXZpdHkgdG8gYmUgZm9jdXNlZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSB0byB3YWl0IGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpdml0eSAtIFRoZSBuYW1lIG9mIHRoZSBhY3Rpdml0eSwgYmVsb25naW5nIHRvIHRoYXQgcGFja2FnZSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIHdhaXQgZm9yLlxuICogQHBhcmFtIHtudW1iZXJ9IHdhaXRNcyBbMjAwMDBdIC0gTnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSB0aW1lb3V0IG9jY3Vycy5cbiAqIEB0aHJvd3Mge2Vycm9yfSBJZiB0aW1lb3V0IGhhcHBlbnMuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy53YWl0Rm9yQWN0aXZpdHkgPSBhc3luYyBmdW5jdGlvbiB3YWl0Rm9yQWN0aXZpdHkgKHBrZywgYWN0LCB3YWl0TXMgPSAyMDAwMCkge1xuICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYWN0LCBmYWxzZSwgd2FpdE1zKTtcbn07XG5cbi8qKlxuICogV2FpdCBmb3IgdGhlIGdpdmVuIGFjdGl2aXR5IHRvIGJlIG5vbi1mb2N1c2VkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSB0byB3YWl0IGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpdml0eSAtIFRoZSBuYW1lIG9mIHRoZSBhY3Rpdml0eSwgYmVsb25naW5nIHRvIHRoYXQgcGFja2FnZSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIHdhaXQgZm9yLlxuICogQHBhcmFtIHtudW1iZXJ9IHdhaXRNcyBbMjAwMDBdIC0gTnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSB0aW1lb3V0IG9jY3Vycy5cbiAqIEB0aHJvd3Mge2Vycm9yfSBJZiB0aW1lb3V0IGhhcHBlbnMuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy53YWl0Rm9yTm90QWN0aXZpdHkgPSBhc3luYyBmdW5jdGlvbiB3YWl0Rm9yTm90QWN0aXZpdHkgKHBrZywgYWN0LCB3YWl0TXMgPSAyMDAwMCkge1xuICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYWN0LCB0cnVlLCB3YWl0TXMpO1xufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBVbmluc3RhbGxPcHRpb25zXG4gKiBAcHJvcGVydHkge251bWJlcn0gdGltZW91dCBbYWRiRXhlY1RpbWVvdXRdIC0gVGhlIGNvdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHVudGlsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcCBpcyB1bmluc3RhbGxlZC5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0ga2VlcERhdGEgW2ZhbHNlXSAtIFNldCB0byB0cnVlIGluIG9yZGVyIHRvIGtlZXAgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbiBkYXRhIGFuZCBjYWNoZSBmb2xkZXJzIGFmdGVyIHVuaW5zdGFsbC5cbiAqL1xuXG4vKipcbiAqIFVuaW5zdGFsbCB0aGUgZ2l2ZW4gcGFja2FnZSBmcm9tIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIG5hbWUgb2YgdGhlIHBhY2thZ2UgdG8gYmUgdW5pbnN0YWxsZWQuXG4gKiBAcGFyYW0gez9Vbmluc3RhbGxPcHRpb25zfSBvcHRpb25zIC0gVGhlIHNldCBvZiB1bmluc3RhbGwgb3B0aW9ucy5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhY2thZ2Ugd2FzIGZvdW5kIG9uIHRoZSBkZXZpY2UgYW5kXG4gKiAgICAgICAgICAgICAgICAgICBzdWNjZXNzZnVsbHkgdW5pbnN0YWxsZWQuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy51bmluc3RhbGxBcGsgPSBhc3luYyBmdW5jdGlvbiB1bmluc3RhbGxBcGsgKHBrZywgb3B0aW9ucyA9IHt9KSB7XG4gIGxvZy5kZWJ1ZyhgVW5pbnN0YWxsaW5nICR7cGtnfWApO1xuICBpZiAoIWF3YWl0IHRoaXMuaXNBcHBJbnN0YWxsZWQocGtnKSkge1xuICAgIGxvZy5pbmZvKGAke3BrZ30gd2FzIG5vdCB1bmluc3RhbGxlZCwgYmVjYXVzZSBpdCB3YXMgbm90IHByZXNlbnQgb24gdGhlIGRldmljZWApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGNtZCA9IFsndW5pbnN0YWxsJ107XG4gIGlmIChvcHRpb25zLmtlZXBEYXRhKSB7XG4gICAgY21kLnB1c2goJy1rJyk7XG4gIH1cbiAgY21kLnB1c2gocGtnKTtcblxuICBsZXQgc3Rkb3V0O1xuICB0cnkge1xuICAgIGF3YWl0IHRoaXMuZm9yY2VTdG9wKHBrZyk7XG4gICAgc3Rkb3V0ID0gKGF3YWl0IHRoaXMuYWRiRXhlYyhjbWQsIHt0aW1lb3V0OiBvcHRpb25zLnRpbWVvdXR9KSkudHJpbSgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gdW5pbnN0YWxsIEFQSy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG4gIGxvZy5kZWJ1ZyhgJ2FkYiAke2NtZC5qb2luKCcgJyl9JyBjb21tYW5kIG91dHB1dDogJHtzdGRvdXR9YCk7XG4gIGlmIChzdGRvdXQuaW5jbHVkZXMoJ1N1Y2Nlc3MnKSkge1xuICAgIGxvZy5pbmZvKGAke3BrZ30gd2FzIHN1Y2Nlc3NmdWxseSB1bmluc3RhbGxlZGApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGxvZy5pbmZvKGAke3BrZ30gd2FzIG5vdCB1bmluc3RhbGxlZGApO1xuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEluc3RhbGwgdGhlIHBhY2thZ2UgYWZ0ZXIgaXQgd2FzIHB1c2hlZCB0byB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwa1BhdGhPbkRldmljZSAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIHBhY2thZ2Ugb24gdGhlIGRldmljZSBmaWxlIHN5c3RlbS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIFt7fV0gLSBBZGRpdGlvbmFsIGV4ZWMgb3B0aW9ucy4gU2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYXBwaXVtL25vZGUtdGVlbl9wcm9jZXNzfVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBtb3JlIGRldGFpbHMgb24gdGhpcyBwYXJhbWV0ZXIuXG4gKiBAdGhyb3dzIHtlcnJvcn0gSWYgdGhlcmUgd2FzIGEgZmFpbHVyZSBkdXJpbmcgYXBwbGljYXRpb24gaW5zdGFsbC5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLmluc3RhbGxGcm9tRGV2aWNlUGF0aCA9IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxGcm9tRGV2aWNlUGF0aCAoYXBrUGF0aE9uRGV2aWNlLCBvcHRzID0ge30pIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydwbScsICdpbnN0YWxsJywgJy1yJywgYXBrUGF0aE9uRGV2aWNlXSwgb3B0cyk7XG4gIGlmIChzdGRvdXQuaW5kZXhPZignRmFpbHVyZScpICE9PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgUmVtb3RlIGluc3RhbGwgZmFpbGVkOiAke3N0ZG91dH1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDYWNoaW5nT3B0aW9uc1xuICogQHByb3BlcnR5IHs/bnVtYmVyfSB0aW1lb3V0IFthZGJFeGVjVGltZW91dF0gLSBUaGUgY291bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgdW50aWwgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcCBpcyB1cGxvYWRlZCB0byB0aGUgcmVtb3RlIGxvY2F0aW9uLlxuICovXG5cbi8qKlxuICogQ2FjaGVzIHRoZSBnaXZlbiBBUEsgYXQgYSByZW1vdGUgbG9jYXRpb24gdG8gc3BlZWQgdXAgZnVydGhlciBBUEsgZGVwbG95bWVudHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwa1BhdGggLSBGdWxsIHBhdGggdG8gdGhlIGFwayBvbiB0aGUgbG9jYWwgRlNcbiAqIEBwYXJhbSB7P0NhY2hpbmdPcHRpb25zfSBvcHRpb25zIC0gQ2FjaGluZyBvcHRpb25zXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIEZ1bGwgcGF0aCB0byB0aGUgY2FjaGVkIGFwayBvbiB0aGUgcmVtb3RlIGZpbGUgc3lzdGVtXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5jYWNoZUFwayA9IGFzeW5jIGZ1bmN0aW9uIGNhY2hlQXBrIChhcGtQYXRoLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgYXBwSGFzaCA9IGF3YWl0IGZzLmhhc2goYXBrUGF0aCk7XG4gIGNvbnN0IHJlbW90ZVBhdGggPSBwYXRoLnBvc2l4LmpvaW4oUkVNT1RFX0NBQ0hFX1JPT1QsIGAke2FwcEhhc2h9LmFwa2ApO1xuICBjb25zdCByZW1vdGVDYWNoZWRGaWxlcyA9IFtdO1xuICAvLyBHZXQgY3VycmVudCBjb250ZW50cyBvZiB0aGUgcmVtb3RlIGNhY2hlIG9yIGNyZWF0ZSBpdCBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgdHJ5IHtcbiAgICBjb25zdCBlcnJvck1hcmtlciA9ICdfRVJST1JfJztcbiAgICBsZXQgbHNPdXRwdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLl9hcmVFeHRlbmRlZExzT3B0aW9uc1N1cHBvcnRlZCA9PT0gdHJ1ZSB8fCAhXy5pc0Jvb2xlYW4odGhpcy5fYXJlRXh0ZW5kZWRMc09wdGlvbnNTdXBwb3J0ZWQpKSB7XG4gICAgICBsc091dHB1dCA9IGF3YWl0IHRoaXMuc2hlbGwoW2BscyAtdCAtMSAke1JFTU9URV9DQUNIRV9ST09UfSAyPiYxIHx8IGVjaG8gJHtlcnJvck1hcmtlcn1gXSk7XG4gICAgfVxuICAgIGlmICghXy5pc1N0cmluZyhsc091dHB1dCkgfHwgKGxzT3V0cHV0LmluY2x1ZGVzKGVycm9yTWFya2VyKSAmJiAhbHNPdXRwdXQuaW5jbHVkZXMoUkVNT1RFX0NBQ0hFX1JPT1QpKSkge1xuICAgICAgaWYgKCFfLmlzQm9vbGVhbih0aGlzLl9hcmVFeHRlbmRlZExzT3B0aW9uc1N1cHBvcnRlZCkpIHtcbiAgICAgICAgbG9nLmRlYnVnKCdUaGUgY3VycmVudCBBbmRyb2lkIEFQSSBkb2VzIG5vdCBzdXBwb3J0IGV4dGVuZGVkIGxzIG9wdGlvbnMuICcgK1xuICAgICAgICAgICdEZWZhdWx0aW5nIHRvIG5vLW9wdGlvbnMgY2FsbCcpO1xuICAgICAgfVxuICAgICAgbHNPdXRwdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFtgbHMgJHtSRU1PVEVfQ0FDSEVfUk9PVH0gMj4mMSB8fCBlY2hvICR7ZXJyb3JNYXJrZXJ9YF0pO1xuICAgICAgdGhpcy5fYXJlRXh0ZW5kZWRMc09wdGlvbnNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXJlRXh0ZW5kZWRMc09wdGlvbnNTdXBwb3J0ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobHNPdXRwdXQuaW5jbHVkZXMoZXJyb3JNYXJrZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobHNPdXRwdXQuc3Vic3RyaW5nKDAsIGxzT3V0cHV0LmluZGV4T2YoZXJyb3JNYXJrZXIpKSk7XG4gICAgfVxuICAgIHJlbW90ZUNhY2hlZEZpbGVzLnB1c2goLi4uKFxuICAgICAgbHNPdXRwdXQuc3BsaXQoJ1xcbicpXG4gICAgICAgIC5tYXAoKHgpID0+IHgudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cuZGVidWcoYEdvdCBhbiBlcnJvciAnJHtlLm1lc3NhZ2UudHJpbSgpfScgd2hpbGUgZ2V0dGluZyB0aGUgbGlzdCBvZiBmaWxlcyBpbiB0aGUgY2FjaGUuIGAgK1xuICAgICAgYEFzc3VtaW5nIHRoZSBjYWNoZSBkb2VzIG5vdCBleGlzdCB5ZXRgKTtcbiAgICBhd2FpdCB0aGlzLnNoZWxsKFsnbWtkaXInLCAnLXAnLCBSRU1PVEVfQ0FDSEVfUk9PVF0pO1xuICB9XG4gIGxvZy5kZWJ1ZyhgVGhlIGNvdW50IG9mIGFwcGxpY2F0aW9ucyBpbiB0aGUgY2FjaGU6ICR7cmVtb3RlQ2FjaGVkRmlsZXMubGVuZ3RofWApO1xuICBjb25zdCB0b0hhc2ggPSAocmVtb3RlUGF0aCkgPT4gcGF0aC5wb3NpeC5wYXJzZShyZW1vdGVQYXRoKS5uYW1lO1xuICAvLyBQdXNoIHRoZSBhcGsgdG8gdGhlIHJlbW90ZSBjYWNoZSBpZiBuZWVkZWRcbiAgaWYgKHJlbW90ZUNhY2hlZEZpbGVzLmZpbmQoKHgpID0+IHRvSGFzaCh4KSA9PT0gYXBwSGFzaCkpIHtcbiAgICBsb2cuaW5mbyhgVGhlIGFwcGxpY2F0aW9uIGF0ICcke2Fwa1BhdGh9JyBpcyBhbHJlYWR5IGNhY2hlZCB0byAnJHtyZW1vdGVQYXRofSdgKTtcbiAgfSBlbHNlIHtcbiAgICBsb2cuaW5mbyhgQ2FjaGluZyB0aGUgYXBwbGljYXRpb24gYXQgJyR7YXBrUGF0aH0nIHRvICcke3JlbW90ZVBhdGh9J2ApO1xuICAgIGNvbnN0IHN0YXJ0ZWQgPSBwcm9jZXNzLmhydGltZSgpO1xuICAgIGF3YWl0IHRoaXMucHVzaChhcGtQYXRoLCByZW1vdGVQYXRoLCB7dGltZW91dDogb3B0aW9ucy50aW1lb3V0fSk7XG4gICAgY29uc3QgW3NlY29uZHMsIG5hbm9zXSA9IHByb2Nlc3MuaHJ0aW1lKHN0YXJ0ZWQpO1xuICAgIGNvbnN0IHtzaXplfSA9IGF3YWl0IGZzLnN0YXQoYXBrUGF0aCk7XG4gICAgbG9nLmluZm8oYFRoZSB1cGxvYWQgb2YgJyR7cGF0aC5iYXNlbmFtZShhcGtQYXRoKX0nICgke3V0aWwudG9SZWFkYWJsZVNpemVTdHJpbmcoc2l6ZSl9KSBgICtcbiAgICAgIGB0b29rICR7KHNlY29uZHMgKyBuYW5vcyAvIDFlOSkudG9GaXhlZCgzKX1zYCk7XG4gIH1cbiAgaWYgKCF0aGlzLnJlbW90ZUFwcHNDYWNoZSkge1xuICAgIHRoaXMucmVtb3RlQXBwc0NhY2hlID0gbmV3IExSVSh7XG4gICAgICBtYXg6IHRoaXMucmVtb3RlQXBwc0NhY2hlTGltaXQsXG4gICAgfSk7XG4gIH1cbiAgLy8gQ2xlYW51cCB0aGUgaW52YWxpZCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlXG4gIF8uZGlmZmVyZW5jZSh0aGlzLnJlbW90ZUFwcHNDYWNoZS5rZXlzKCksIHJlbW90ZUNhY2hlZEZpbGVzLm1hcCh0b0hhc2gpKVxuICAgIC5mb3JFYWNoKChoYXNoKSA9PiB0aGlzLnJlbW90ZUFwcHNDYWNoZS5kZWwoaGFzaCkpO1xuICAvLyBCdW1wIHRoZSBjYWNoZSByZWNvcmQgZm9yIHRoZSByZWNlbnRseSBjYWNoZWQgaXRlbVxuICB0aGlzLnJlbW90ZUFwcHNDYWNoZS5zZXQoYXBwSGFzaCwgcmVtb3RlUGF0aCk7XG4gIC8vIElmIHRoZSByZW1vdGUgY2FjaGUgZXhjZWVkcyB0aGlzLnJlbW90ZUFwcHNDYWNoZUxpbWl0LCByZW1vdmUgdGhlIGxlYXN0IHJlY2VudGx5IHVzZWQgZW50cmllc1xuICBjb25zdCBlbnRyaWVzVG9DbGVhbnVwID0gcmVtb3RlQ2FjaGVkRmlsZXNcbiAgICAubWFwKCh4KSA9PiBwYXRoLnBvc2l4LmpvaW4oUkVNT1RFX0NBQ0hFX1JPT1QsIHgpKVxuICAgIC5maWx0ZXIoKHgpID0+ICF0aGlzLnJlbW90ZUFwcHNDYWNoZS5oYXModG9IYXNoKHgpKSlcbiAgICAuc2xpY2UodGhpcy5yZW1vdGVBcHBzQ2FjaGVMaW1pdCAtIHRoaXMucmVtb3RlQXBwc0NhY2hlLmtleXMoKS5sZW5ndGgpO1xuICBpZiAoIV8uaXNFbXB0eShlbnRyaWVzVG9DbGVhbnVwKSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnNoZWxsKFsncm0nLCAnLWYnLCAuLi5lbnRyaWVzVG9DbGVhbnVwXSk7XG4gICAgICBsb2cuZGVidWcoYERlbGV0ZWQgJHtlbnRyaWVzVG9DbGVhbnVwLmxlbmd0aH0gZXhwaXJlZCBhcHBsaWNhdGlvbiBjYWNoZSBlbnRyaWVzYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nLndhcm4oYENhbm5vdCBkZWxldGUgJHtlbnRyaWVzVG9DbGVhbnVwLmxlbmd0aH0gZXhwaXJlZCBhcHBsaWNhdGlvbiBjYWNoZSBlbnRyaWVzLiBgICtcbiAgICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlbW90ZVBhdGg7XG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEluc3RhbGxPcHRpb25zXG4gKiBAcHJvcGVydHkge251bWJlcn0gdGltZW91dCBbNjAwMDBdIC0gVGhlIGNvdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHVudGlsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcCBpcyBpbnN0YWxsZWQuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdGltZW91dENhcE5hbWUgW2FuZHJvaWRJbnN0YWxsVGltZW91dF0gLSBUaGUgdGltZW91dCBvcHRpb24gbmFtZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnMgY2FuIGluY3JlYXNlIHRoZSB0aW1lb3V0LlxuICogQHByb3BlcnR5IHtib29sZWFufSBhbGxvd1Rlc3RQYWNrYWdlcyBbZmFsc2VdIC0gU2V0IHRvIHRydWUgaW4gb3JkZXIgdG8gYWxsb3cgdGVzdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZXMgaW5zdGFsbGF0aW9uLlxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VTZGNhcmQgW2ZhbHNlXSAtIFNldCB0byB0cnVlIHRvIGluc3RhbGwgdGhlIGFwcCBvbiBzZGNhcmRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0ZWFkIG9mIHRoZSBkZXZpY2UgbWVtb3J5LlxuICogQHByb3BlcnR5IHtib29sZWFufSBncmFudFBlcm1pc3Npb25zIFtmYWxzZV0gLSBTZXQgdG8gdHJ1ZSBpbiBvcmRlciB0byBncmFudCBhbGwgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zIHJlcXVlc3RlZCBpbiB0aGUgYXBwbGljYXRpb24ncyBtYW5pZmVzdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvbWF0aWNhbGx5IGFmdGVyIHRoZSBpbnN0YWxsYXRpb24gaXMgY29tcGxldGVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVyIEFuZHJvaWQgNisuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHJlcGxhY2UgW3RydWVdIC0gU2V0IGl0IHRvIGZhbHNlIGlmIHlvdSBkb24ndCB3YW50XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHVwZ3JhZGVkL3JlaW5zdGFsbGVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgaXQgaXMgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBkZXZpY2UuXG4gKi9cblxuLyoqXG4gKiBJbnN0YWxsIHRoZSBwYWNrYWdlIGZyb20gdGhlIGxvY2FsIGZpbGUgc3lzdGVtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcHBQYXRoIC0gVGhlIGZ1bGwgcGF0aCB0byB0aGUgbG9jYWwgcGFja2FnZS5cbiAqIEBwYXJhbSB7P0luc3RhbGxPcHRpb25zfSBvcHRpb25zIC0gVGhlIHNldCBvZiBpbnN0YWxsYXRpb24gb3B0aW9ucy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBhbiB1bmV4cGVjdGVkIGVycm9yIGhhcHBlbnMgZHVyaW5nIGluc3RhbGwuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5pbnN0YWxsID0gYXN5bmMgZnVuY3Rpb24gaW5zdGFsbCAoYXBwUGF0aCwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmIChhcHBQYXRoLmVuZHNXaXRoKEFQS1NfRVhURU5TSU9OKSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmluc3RhbGxBcGtzKGFwcFBhdGgsIG9wdGlvbnMpO1xuICB9XG5cbiAgb3B0aW9ucyA9IF8uY2xvbmVEZWVwKG9wdGlvbnMpO1xuICBfLmRlZmF1bHRzKG9wdGlvbnMsIHtcbiAgICByZXBsYWNlOiB0cnVlLFxuICAgIHRpbWVvdXQ6IHRoaXMuYWRiRXhlY1RpbWVvdXQgPT09IERFRkFVTFRfQURCX0VYRUNfVElNRU9VVCA/IEFQS19JTlNUQUxMX1RJTUVPVVQgOiB0aGlzLmFkYkV4ZWNUaW1lb3V0LFxuICAgIHRpbWVvdXRDYXBOYW1lOiAnYW5kcm9pZEluc3RhbGxUaW1lb3V0JyxcbiAgfSk7XG5cbiAgY29uc3QgaW5zdGFsbEFyZ3MgPSBidWlsZEluc3RhbGxBcmdzKGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKSwgb3B0aW9ucyk7XG4gIGNvbnN0IGluc3RhbGxPcHRzID0ge1xuICAgIHRpbWVvdXQ6IG9wdGlvbnMudGltZW91dCxcbiAgICB0aW1lb3V0Q2FwTmFtZTogb3B0aW9ucy50aW1lb3V0Q2FwTmFtZSxcbiAgfTtcbiAgbGV0IHBlcmZvcm1BcHBJbnN0YWxsID0gYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5hZGJFeGVjKFtcbiAgICAnaW5zdGFsbCcsXG4gICAgLi4uaW5zdGFsbEFyZ3MsXG4gICAgYXBwUGF0aFxuICBdLCBpbnN0YWxsT3B0cyk7XG4gIC8vIHRoaXMucmVtb3RlQXBwc0NhY2hlTGltaXQgPD0gMCBtZWFucyBubyBjYWNoaW5nIHNob3VsZCBiZSBhcHBsaWVkXG4gIGlmICh0aGlzLnJlbW90ZUFwcHNDYWNoZUxpbWl0ID4gMCkge1xuICAgIGNvbnN0IGNhY2hlZFJlbW90ZVBhdGggPSBhd2FpdCB0aGlzLmNhY2hlQXBrKGFwcFBhdGgsIHtcbiAgICAgIHRpbWVvdXQ6IG9wdGlvbnMudGltZW91dCxcbiAgICB9KTtcbiAgICBwZXJmb3JtQXBwSW5zdGFsbCA9IGFzeW5jICgpID0+IGF3YWl0IHRoaXMuc2hlbGwoW1xuICAgICAgJ3BtJyxcbiAgICAgICdpbnN0YWxsJyxcbiAgICAgIC4uLmluc3RhbGxBcmdzLFxuICAgICAgY2FjaGVkUmVtb3RlUGF0aFxuICAgIF0sIGluc3RhbGxPcHRzKTtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHN0YXJ0ZWQgPSBwcm9jZXNzLmhydGltZSgpO1xuICAgIGNvbnN0IG91dHB1dCA9IGF3YWl0IHBlcmZvcm1BcHBJbnN0YWxsKCk7XG4gICAgY29uc3QgW3NlY29uZHMsIG5hbm9zXSA9IHByb2Nlc3MuaHJ0aW1lKHN0YXJ0ZWQpO1xuICAgIGxvZy5pbmZvKGBUaGUgaW5zdGFsbGF0aW9uIG9mICcke3BhdGguYmFzZW5hbWUoYXBwUGF0aCl9JyB0b29rICR7KHNlY29uZHMgKyBuYW5vcyAvIDFlOSkudG9GaXhlZCgzKX1zYCk7XG4gICAgY29uc3QgdHJ1bmNhdGVkT3V0cHV0ID0gKCFfLmlzU3RyaW5nKG91dHB1dCkgfHwgb3V0cHV0Lmxlbmd0aCA8PSAzMDApID9cbiAgICAgIG91dHB1dCA6IGAke291dHB1dC5zdWJzdHIoMCwgMTUwKX0uLi4ke291dHB1dC5zdWJzdHIob3V0cHV0Lmxlbmd0aCAtIDE1MCl9YDtcbiAgICBsb2cuZGVidWcoYEluc3RhbGwgY29tbWFuZCBzdGRvdXQ6ICR7dHJ1bmNhdGVkT3V0cHV0fWApO1xuICAgIGlmICgvXFxbSU5TVEFMTFtBLVpfXStGQUlMRURbQS1aX10rXFxdLy50ZXN0KG91dHB1dCkpIHtcbiAgICAgIGlmICh0aGlzLmlzVGVzdFBhY2thZ2VPbmx5RXJyb3Iob3V0cHV0KSkge1xuICAgICAgICBjb25zdCBtc2cgPSBgU2V0ICdhbGxvd1Rlc3RQYWNrYWdlcycgY2FwYWJpbGl0eSB0byB0cnVlIGluIG9yZGVyIHRvIGFsbG93IHRlc3QgcGFja2FnZXMgaW5zdGFsbGF0aW9uLmA7XG4gICAgICAgIGxvZy53YXJuKG1zZyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtvdXRwdXR9XFxuJHttc2d9YCk7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3Iob3V0cHV0KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIG9uIHNvbWUgc3lzdGVtcyB0aGlzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGFwcCBhbHJlYWR5XG4gICAgLy8gZXhpc3RzXG4gICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnSU5TVEFMTF9GQUlMRURfQUxSRUFEWV9FWElTVFMnKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYEFwcGxpY2F0aW9uICcke2FwcFBhdGh9JyBhbHJlYWR5IGluc3RhbGxlZC4gQ29udGludWluZy5gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgaW5zdGFsbGF0aW9uIHN0YXRlIG9mIHRoZSBwYXJ0aWN1bGFyIGFwcGxpY2F0aW9uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBGdWxsIHBhdGggdG8gdGhlIGFwcGxpY2F0aW9uXG4gKiBAcGFyYW0gez9zdHJpbmd9IHBrZyAtIFBhY2thZ2UgaWRlbnRpZmllci4gSWYgb21pdHRlZCB0aGVuIHRoZSBzY3JpcHQgd2lsbFxuICogICAgICAgICAgICAgICAgICAgICAgICB0cnkgdG8gZXh0cmFjdCBpdCBvbiBpdHMgb3duXG4gKiBAcmV0dXJucyB7c3RyaW5nfV1PbmUgb2YgYEFQUF9JTlNUQUxMX1NUQVRFYCBjb25zdGFudHNcbiAqL1xuYXBrVXRpbHNNZXRob2RzLmdldEFwcGxpY2F0aW9uSW5zdGFsbFN0YXRlID0gYXN5bmMgZnVuY3Rpb24gZ2V0QXBwbGljYXRpb25JbnN0YWxsU3RhdGUgKGFwcFBhdGgsIHBrZyA9IG51bGwpIHtcbiAgbGV0IGFwa0luZm8gPSBudWxsO1xuICBpZiAoIXBrZykge1xuICAgIGFwa0luZm8gPSBhd2FpdCB0aGlzLmdldEFwa0luZm8oYXBwUGF0aCk7XG4gICAgcGtnID0gYXBrSW5mby5uYW1lO1xuICB9XG4gIGlmICghcGtnKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCByZWFkIHRoZSBwYWNrYWdlIG5hbWUgb2YgJyR7YXBwUGF0aH0nYCk7XG4gICAgcmV0dXJuIHRoaXMuQVBQX0lOU1RBTExfU1RBVEUuVU5LTk9XTjtcbiAgfVxuXG4gIGlmICghYXdhaXQgdGhpcy5pc0FwcEluc3RhbGxlZChwa2cpKSB7XG4gICAgbG9nLmRlYnVnKGBBcHAgJyR7YXBwUGF0aH0nIGlzIG5vdCBpbnN0YWxsZWRgKTtcbiAgICByZXR1cm4gdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5OT1RfSU5TVEFMTEVEO1xuICB9XG5cbiAgY29uc3Qge3ZlcnNpb25Db2RlOiBwa2dWZXJzaW9uQ29kZSwgdmVyc2lvbk5hbWU6IHBrZ1ZlcnNpb25OYW1lU3RyfSA9IGF3YWl0IHRoaXMuZ2V0UGFja2FnZUluZm8ocGtnKTtcbiAgY29uc3QgcGtnVmVyc2lvbk5hbWUgPSBzZW12ZXIudmFsaWQoc2VtdmVyLmNvZXJjZShwa2dWZXJzaW9uTmFtZVN0cikpO1xuICBpZiAoIWFwa0luZm8pIHtcbiAgICBhcGtJbmZvID0gYXdhaXQgdGhpcy5nZXRBcGtJbmZvKGFwcFBhdGgpO1xuICB9XG4gIGNvbnN0IHt2ZXJzaW9uQ29kZTogYXBrVmVyc2lvbkNvZGUsIHZlcnNpb25OYW1lOiBhcGtWZXJzaW9uTmFtZVN0cn0gPSBhcGtJbmZvO1xuICBjb25zdCBhcGtWZXJzaW9uTmFtZSA9IHNlbXZlci52YWxpZChzZW12ZXIuY29lcmNlKGFwa1ZlcnNpb25OYW1lU3RyKSk7XG5cbiAgaWYgKCFfLmlzSW50ZWdlcihhcGtWZXJzaW9uQ29kZSkgfHwgIV8uaXNJbnRlZ2VyKHBrZ1ZlcnNpb25Db2RlKSkge1xuICAgIGxvZy53YXJuKGBDYW5ub3QgcmVhZCB2ZXJzaW9uIGNvZGVzIG9mICcke2FwcFBhdGh9JyBhbmQvb3IgJyR7cGtnfSdgKTtcbiAgICBpZiAoIV8uaXNTdHJpbmcoYXBrVmVyc2lvbk5hbWUpIHx8ICFfLmlzU3RyaW5nKHBrZ1ZlcnNpb25OYW1lKSkge1xuICAgICAgbG9nLndhcm4oYENhbm5vdCByZWFkIHZlcnNpb24gbmFtZXMgb2YgJyR7YXBwUGF0aH0nIGFuZC9vciAnJHtwa2d9J2ApO1xuICAgICAgcmV0dXJuIHRoaXMuQVBQX0lOU1RBTExfU1RBVEUuVU5LTk9XTjtcbiAgICB9XG4gIH1cbiAgaWYgKF8uaXNJbnRlZ2VyKGFwa1ZlcnNpb25Db2RlKSAmJiBfLmlzSW50ZWdlcihwa2dWZXJzaW9uQ29kZSkpIHtcbiAgICBpZiAocGtnVmVyc2lvbkNvZGUgPiBhcGtWZXJzaW9uQ29kZSkge1xuICAgICAgbG9nLmRlYnVnKGBUaGUgdmVyc2lvbiBjb2RlIG9mIHRoZSBpbnN0YWxsZWQgJyR7cGtnfScgaXMgZ3JlYXRlciB0aGFuIHRoZSBhcHBsaWNhdGlvbiB2ZXJzaW9uIGNvZGUgKCR7cGtnVmVyc2lvbkNvZGV9ID4gJHthcGtWZXJzaW9uQ29kZX0pYCk7XG4gICAgICByZXR1cm4gdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5ORVdFUl9WRVJTSU9OX0lOU1RBTExFRDtcbiAgICB9XG4gICAgLy8gVmVyc2lvbiBjb2RlcyBtaWdodCBub3QgYmUgbWFpbnRhaW5lZC4gQ2hlY2sgdmVyc2lvbiBuYW1lcy5cbiAgICBpZiAocGtnVmVyc2lvbkNvZGUgPT09IGFwa1ZlcnNpb25Db2RlKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyhhcGtWZXJzaW9uTmFtZSkgJiYgXy5pc1N0cmluZyhwa2dWZXJzaW9uTmFtZSkgJiYgc2VtdmVyLnNhdGlzZmllcyhwa2dWZXJzaW9uTmFtZSwgYD49JHthcGtWZXJzaW9uTmFtZX1gKSkge1xuICAgICAgICBsb2cuZGVidWcoYFRoZSB2ZXJzaW9uIG5hbWUgb2YgdGhlIGluc3RhbGxlZCAnJHtwa2d9JyBpcyBncmVhdGVyIG9yIGVxdWFsIHRvIHRoZSBhcHBsaWNhdGlvbiB2ZXJzaW9uIG5hbWUgKCcke3BrZ1ZlcnNpb25OYW1lfScgPj0gJyR7YXBrVmVyc2lvbk5hbWV9JylgKTtcbiAgICAgICAgcmV0dXJuIHNlbXZlci5zYXRpc2ZpZXMocGtnVmVyc2lvbk5hbWUsIGA+JHthcGtWZXJzaW9uTmFtZX1gKVxuICAgICAgICAgID8gdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5ORVdFUl9WRVJTSU9OX0lOU1RBTExFRFxuICAgICAgICAgIDogdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5TQU1FX1ZFUlNJT05fSU5TVEFMTEVEO1xuICAgICAgfVxuICAgICAgaWYgKCFfLmlzU3RyaW5nKGFwa1ZlcnNpb25OYW1lKSB8fCAhXy5pc1N0cmluZyhwa2dWZXJzaW9uTmFtZSkpIHtcbiAgICAgICAgbG9nLmRlYnVnKGBUaGUgdmVyc2lvbiBuYW1lIG9mIHRoZSBpbnN0YWxsZWQgJyR7cGtnfScgaXMgZXF1YWwgdG8gYXBwbGljYXRpb24gdmVyc2lvbiBuYW1lICgke3BrZ1ZlcnNpb25Db2RlfSA9PT0gJHthcGtWZXJzaW9uQ29kZX0pYCk7XG4gICAgICAgIHJldHVybiB0aGlzLkFQUF9JTlNUQUxMX1NUQVRFLlNBTUVfVkVSU0lPTl9JTlNUQUxMRUQ7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcoYXBrVmVyc2lvbk5hbWUpICYmIF8uaXNTdHJpbmcocGtnVmVyc2lvbk5hbWUpICYmIHNlbXZlci5zYXRpc2ZpZXMocGtnVmVyc2lvbk5hbWUsIGA+PSR7YXBrVmVyc2lvbk5hbWV9YCkpIHtcbiAgICBsb2cuZGVidWcoYFRoZSB2ZXJzaW9uIG5hbWUgb2YgdGhlIGluc3RhbGxlZCAnJHtwa2d9JyBpcyBncmVhdGVyIG9yIGVxdWFsIHRvIHRoZSBhcHBsaWNhdGlvbiB2ZXJzaW9uIG5hbWUgKCcke3BrZ1ZlcnNpb25OYW1lfScgPj0gJyR7YXBrVmVyc2lvbk5hbWV9JylgKTtcbiAgICByZXR1cm4gc2VtdmVyLnNhdGlzZmllcyhwa2dWZXJzaW9uTmFtZSwgYD4ke2Fwa1ZlcnNpb25OYW1lfWApXG4gICAgICA/IHRoaXMuQVBQX0lOU1RBTExfU1RBVEUuTkVXRVJfVkVSU0lPTl9JTlNUQUxMRURcbiAgICAgIDogdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5TQU1FX1ZFUlNJT05fSU5TVEFMTEVEO1xuICB9XG5cbiAgbG9nLmRlYnVnKGBUaGUgaW5zdGFsbGVkICcke3BrZ30nIHBhY2thZ2UgaXMgb2xkZXIgdGhhbiAnJHthcHBQYXRofScgKCR7cGtnVmVyc2lvbkNvZGV9IDwgJHthcGtWZXJzaW9uQ29kZX0gb3IgJyR7cGtnVmVyc2lvbk5hbWV9JyA8ICcke2Fwa1ZlcnNpb25OYW1lfScpJ2ApO1xuICByZXR1cm4gdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5PTERFUl9WRVJTSU9OX0lOU1RBTExFRDtcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSW5zdGFsbE9yVXBncmFkZU9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0aW1lb3V0IFs2MDAwMF0gLSBUaGUgY291bnQgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgdW50aWwgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwIGlzIGluc3RhbGxlZC5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWxsb3dUZXN0UGFja2FnZXMgW2ZhbHNlXSAtIFNldCB0byB0cnVlIGluIG9yZGVyIHRvIGFsbG93IHRlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzIGluc3RhbGxhdGlvbi5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlU2RjYXJkIFtmYWxzZV0gLSBTZXQgdG8gdHJ1ZSB0byBpbnN0YWxsIHRoZSBhcHAgb24gU0RDYXJkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGVhZCBvZiB0aGUgZGV2aWNlIG1lbW9yeS5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZ3JhbnRQZXJtaXNzaW9ucyBbZmFsc2VdIC0gU2V0IHRvIHRydWUgaW4gb3JkZXIgdG8gZ3JhbnQgYWxsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJtaXNzaW9ucyByZXF1ZXN0ZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgbWFuaWZlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b21hdGljYWxseSBhZnRlciB0aGUgaW5zdGFsbGF0aW9uIGlzIGNvbXBsZXRlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlciBBbmRyb2lkIDYrLlxuICogQHByb3BlcnR5IHtib29sZWFufSBlbmZvcmNlQ3VycmVudEJ1aWxkIFtmYWxzZV0gLSBTZXQgdG8gYHRydWVgIGluIG9yZGVyIHRvIGFsd2F5cyBwcmVmZXJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGN1cnJlbnQgYnVpbGQgb3ZlciBhbnkgaW5zdGFsbGVkIHBhY2thZ2VzIGhhdmluZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgc2FtZSBpZGVudGlmaWVyXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJbnN0YWxsT3JVcGdyYWRlUmVzdWx0XG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHdhc1VuaW5zdGFsbGVkIC0gRXF1YWxzIHRvIGB0cnVlYCBpZiB0aGUgdGFyZ2V0IGFwcCBoYXMgYmVlbiB1bmluc3RhbGxlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZSBiZWluZyBpbnN0YWxsZWRcbiAqIEBwcm9wZXJ0eSB7QVBQX0lOU1RBTExfU1RBVEV9IGFwcFN0YXRlIC0gT25lIG9mIGBhZGIuQVBQX0lOU1RBTExfU1RBVEVgIHN0YXRlcywgd2hpY2ggcmVmbGVjdHNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHN0YXRlIG9mIHRoZSBhcHBsaWNhdGlvbiBiZWZvcmUgYmVpbmcgaW5zdGFsbGVkLlxuICovXG5cbi8qKlxuICogSW5zdGFsbCB0aGUgcGFja2FnZSBmcm9tIHRoZSBsb2NhbCBmaWxlIHN5c3RlbSBvciB1cGdyYWRlIGl0IGlmIGFuIG9sZGVyXG4gKiB2ZXJzaW9uIG9mIHRoZSBzYW1lIHBhY2thZ2UgaXMgYWxyZWFkeSBpbnN0YWxsZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBsb2NhbCBwYWNrYWdlLlxuICogQHBhcmFtIHs/c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgaW5zdGFsbGVkIHBhY2thZ2UuIFRoZSBtZXRob2Qgd2lsbFxuICogICAgICAgICAgICAgICAgICAgICAgICBwZXJmb3JtIGZhc3RlciBpZiBpdCBpcyBzZXQuXG4gKiBAcGFyYW0gez9JbnN0YWxsT3JVcGdyYWRlT3B0aW9uc30gb3B0aW9ucyAtIFNldCBvZiBpbnN0YWxsIG9wdGlvbnMuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgYW4gdW5leHBlY3RlZCBlcnJvciBoYXBwZW5zIGR1cmluZyBpbnN0YWxsLlxuICogQHJldHVybnMge0luc3RhbGxPclVwZ3JhZGVSZXN1bHR9XG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5pbnN0YWxsT3JVcGdyYWRlID0gYXN5bmMgZnVuY3Rpb24gaW5zdGFsbE9yVXBncmFkZSAoYXBwUGF0aCwgcGtnID0gbnVsbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmICghcGtnKSB7XG4gICAgY29uc3QgYXBrSW5mbyA9IGF3YWl0IHRoaXMuZ2V0QXBrSW5mbyhhcHBQYXRoKTtcbiAgICBwa2cgPSBhcGtJbmZvLm5hbWU7XG4gIH1cblxuICBjb25zdCB7XG4gICAgZW5mb3JjZUN1cnJlbnRCdWlsZCxcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGFwcFN0YXRlID0gYXdhaXQgdGhpcy5nZXRBcHBsaWNhdGlvbkluc3RhbGxTdGF0ZShhcHBQYXRoLCBwa2cpO1xuICBsZXQgd2FzVW5pbnN0YWxsZWQgPSBmYWxzZTtcbiAgY29uc3QgdW5pbnN0YWxsUGFja2FnZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWF3YWl0IHRoaXMudW5pbnN0YWxsQXBrKHBrZykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJyR7cGtnfScgcGFja2FnZSBjYW5ub3QgYmUgdW5pbnN0YWxsZWRgKTtcbiAgICB9XG4gICAgd2FzVW5pbnN0YWxsZWQgPSB0cnVlO1xuICB9O1xuICBzd2l0Y2ggKGFwcFN0YXRlKSB7XG4gICAgY2FzZSB0aGlzLkFQUF9JTlNUQUxMX1NUQVRFLk5PVF9JTlNUQUxMRUQ6XG4gICAgICBsb2cuZGVidWcoYEluc3RhbGxpbmcgJyR7YXBwUGF0aH0nYCk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RhbGwoYXBwUGF0aCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge3JlcGxhY2U6IGZhbHNlfSkpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXBwU3RhdGUsXG4gICAgICAgIHdhc1VuaW5zdGFsbGVkLFxuICAgICAgfTtcbiAgICBjYXNlIHRoaXMuQVBQX0lOU1RBTExfU1RBVEUuTkVXRVJfVkVSU0lPTl9JTlNUQUxMRUQ6XG4gICAgICBpZiAoZW5mb3JjZUN1cnJlbnRCdWlsZCkge1xuICAgICAgICBsb2cuaW5mbyhgRG93bmdyYWRpbmcgJyR7cGtnfScgYXMgcmVxdWVzdGVkYCk7XG4gICAgICAgIGF3YWl0IHVuaW5zdGFsbFBhY2thZ2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsb2cuZGVidWcoYFRoZXJlIGlzIG5vIG5lZWQgdG8gZG93bmdyYWRlICcke3BrZ30nYCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhcHBTdGF0ZSxcbiAgICAgICAgd2FzVW5pbnN0YWxsZWQsXG4gICAgICB9O1xuICAgIGNhc2UgdGhpcy5BUFBfSU5TVEFMTF9TVEFURS5TQU1FX1ZFUlNJT05fSU5TVEFMTEVEOlxuICAgICAgaWYgKGVuZm9yY2VDdXJyZW50QnVpbGQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsb2cuZGVidWcoYFRoZXJlIGlzIG5vIG5lZWQgdG8gaW5zdGFsbC91cGdyYWRlICcke2FwcFBhdGh9J2ApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXBwU3RhdGUsXG4gICAgICAgIHdhc1VuaW5zdGFsbGVkLFxuICAgICAgfTtcbiAgICBjYXNlIHRoaXMuQVBQX0lOU1RBTExfU1RBVEUuT0xERVJfVkVSU0lPTl9JTlNUQUxMRUQ6XG4gICAgICBsb2cuZGVidWcoYEV4ZWN1dGluZyB1cGdyYWRlIG9mICcke2FwcFBhdGh9J2ApO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGxvZy5kZWJ1ZyhgVGhlIGN1cnJlbnQgaW5zdGFsbCBzdGF0ZSBvZiAnJHthcHBQYXRofScgaXMgdW5rbm93bi4gSW5zdGFsbGluZyBhbnl3YXlgKTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLmluc3RhbGwoYXBwUGF0aCwgT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge3JlcGxhY2U6IHRydWV9KSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZy53YXJuKGBDYW5ub3QgaW5zdGFsbC91cGdyYWRlICcke3BrZ30nIGJlY2F1c2Ugb2YgJyR7ZXJyLm1lc3NhZ2V9Jy4gVHJ5aW5nIGZ1bGwgcmVpbnN0YWxsYCk7XG4gICAgYXdhaXQgdW5pbnN0YWxsUGFja2FnZSgpO1xuICAgIGF3YWl0IHRoaXMuaW5zdGFsbChhcHBQYXRoLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7cmVwbGFjZTogZmFsc2V9KSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBhcHBTdGF0ZSxcbiAgICB3YXNVbmluc3RhbGxlZCxcbiAgfTtcbn07XG5cbi8qKlxuICogRXh0cmFjdCBzdHJpbmcgcmVzb3VyY2VzIGZyb20gdGhlIGdpdmVuIHBhY2thZ2Ugb24gbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSAuYXBrKHMpIHBhY2thZ2UuXG4gKiBAcGFyYW0gez9zdHJpbmd9IGxhbmd1YWdlIC0gVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHRvIGV4dHJhY3QgdGhlIHJlc291cmNlcyBmb3IuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGRlZmF1bHQgbGFuZ3VhZ2UgaXMgdXNlZCBpZiB0aGlzIGVxdWFscyB0byBgbnVsbGAvYHVuZGVmaW5lZGBcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXQgLSBUaGUgbmFtZSBvZiB0aGUgZGVzdGluYXRpb24gZm9sZGVyIG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbSB0b1xuICogICAgICAgICAgICAgICAgICAgICAgIHN0b3JlIHRoZSBleHRyYWN0ZWQgZmlsZSB0by5cbiAqIEByZXR1cm4ge09iamVjdH0gQSBtYXBwaW5nIG9iamVjdCwgd2hlcmUgcHJvcGVydGllcyBhcmU6ICdhcGtTdHJpbmdzJywgY29udGFpbmluZ1xuICogICAgICAgICAgICAgICAgICBwYXJzZWQgcmVzb3VyY2UgZmlsZSByZXByZXNlbnRlZCBhcyBKU09OIG9iamVjdCwgYW5kICdsb2NhbFBhdGgnLFxuICogICAgICAgICAgICAgICAgICBjb250YWluaW5nIHRoZSBwYXRoIHRvIHRoZSBleHRyYWN0ZWQgZmlsZSBvbiB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5leHRyYWN0U3RyaW5nc0Zyb21BcGsgPSBhc3luYyBmdW5jdGlvbiBleHRyYWN0U3RyaW5nc0Zyb21BcGsgKGFwcFBhdGgsIGxhbmd1YWdlLCBvdXQpIHtcbiAgbG9nLmRlYnVnKGBFeHRyYWN0aW5nIHN0cmluZ3MgZnJvbSBmb3IgbGFuZ3VhZ2U6ICR7bGFuZ3VhZ2UgfHwgJ2RlZmF1bHQnfWApO1xuICBjb25zdCBvcmlnaW5hbEFwcFBhdGggPSBhcHBQYXRoO1xuICBpZiAoYXBwUGF0aC5lbmRzV2l0aChBUEtTX0VYVEVOU0lPTikpIHtcbiAgICBhcHBQYXRoID0gYXdhaXQgdGhpcy5leHRyYWN0TGFuZ3VhZ2VBcGsoYXBwUGF0aCwgbGFuZ3VhZ2UpO1xuICB9XG5cbiAgbGV0IGFwa1N0cmluZ3MgPSB7fTtcbiAgbGV0IGNvbmZpZ01hcmtlcjtcbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLmluaXRBYXB0KCk7XG5cbiAgICBjb25maWdNYXJrZXIgPSBhd2FpdCBmb3JtYXRDb25maWdNYXJrZXIoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgW1xuICAgICAgICAnZCcsXG4gICAgICAgICdjb25maWd1cmF0aW9ucycsXG4gICAgICAgIGFwcFBhdGgsXG4gICAgICBdKTtcbiAgICAgIHJldHVybiBzdGRvdXQuc3BsaXQob3MuRU9MKTtcbiAgICB9LCBsYW5ndWFnZSwgJyhkZWZhdWx0KScpO1xuXG4gICAgY29uc3Qge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgW1xuICAgICAgJ2QnLFxuICAgICAgJy0tdmFsdWVzJyxcbiAgICAgICdyZXNvdXJjZXMnLFxuICAgICAgYXBwUGF0aCxcbiAgICBdKTtcbiAgICBhcGtTdHJpbmdzID0gcGFyc2VBYXB0U3RyaW5ncyhzdGRvdXQsIGNvbmZpZ01hcmtlcik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cuZGVidWcoJ0Nhbm5vdCBleHRyYWN0IHJlc291cmNlcyB1c2luZyBhYXB0LiBUcnlpbmcgYWFwdDIuICcgK1xuICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2Uuc3RkZXJyIHx8IGUubWVzc2FnZX1gKTtcblxuICAgIGF3YWl0IHRoaXMuaW5pdEFhcHQyKCk7XG5cbiAgICBjb25maWdNYXJrZXIgPSBhd2FpdCBmb3JtYXRDb25maWdNYXJrZXIoYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXBrYW5hbHl6ZXJQYXRoID0gYXdhaXQgZ2V0QXBrYW5hbHl6ZXJGb3JPcyh0aGlzKTtcbiAgICAgIGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYyhhcGthbmFseXplclBhdGgsIFtcbiAgICAgICAgJ3Jlc291cmNlcycsICdjb25maWdzJyxcbiAgICAgICAgJy0tdHlwZScsICdzdHJpbmcnLFxuICAgICAgICBhcHBQYXRoLFxuICAgICAgXSwge1xuICAgICAgICBzaGVsbDogdHJ1ZSxcbiAgICAgICAgY3dkOiBwYXRoLmRpcm5hbWUoYXBrYW5hbHl6ZXJQYXRoKSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHN0ZG91dC5zcGxpdChvcy5FT0wpO1xuICAgIH0sIGxhbmd1YWdlLCAnJyk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdDIsIFtcbiAgICAgICAgJ2R1bXAnLCBhcHBQYXRoLFxuICAgICAgXSk7XG4gICAgICBhcGtTdHJpbmdzID0gcGFyc2VBYXB0MlN0cmluZ3Moc3Rkb3V0LCBjb25maWdNYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGV4dHJhY3QgcmVzb3VyY2VzIGZyb20gJyR7b3JpZ2luYWxBcHBQYXRofScuIGAgK1xuICAgICAgICBgT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChfLmlzRW1wdHkoYXBrU3RyaW5ncykpIHtcbiAgICBsb2cud2FybihgTm8gc3RyaW5ncyBoYXZlIGJlZW4gZm91bmQgaW4gJyR7b3JpZ2luYWxBcHBQYXRofScgcmVzb3VyY2VzIGAgK1xuICAgICAgYGZvciAnJHtjb25maWdNYXJrZXIgfHwgJ2RlZmF1bHQnfScgY29uZmlndXJhdGlvbmApO1xuICB9IGVsc2Uge1xuICAgIGxvZy5pbmZvKGBTdWNjZXNzZnVsbHkgZXh0cmFjdGVkICR7Xy5rZXlzKGFwa1N0cmluZ3MpLmxlbmd0aH0gc3RyaW5ncyBmcm9tIGAgK1xuICAgICAgYCcke29yaWdpbmFsQXBwUGF0aH0nIHJlc291cmNlcyBmb3IgJyR7Y29uZmlnTWFya2VyIHx8ICdkZWZhdWx0J30nIGNvbmZpZ3VyYXRpb25gKTtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsUGF0aCA9IHBhdGgucmVzb2x2ZShvdXQsICdzdHJpbmdzLmpzb24nKTtcbiAgYXdhaXQgbWtkaXJwKG91dCk7XG4gIGF3YWl0IGZzLndyaXRlRmlsZShsb2NhbFBhdGgsIEpTT04uc3RyaW5naWZ5KGFwa1N0cmluZ3MsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgcmV0dXJuIHthcGtTdHJpbmdzLCBsb2NhbFBhdGh9O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxhbmd1YWdlIG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5hbWUgb2YgZGV2aWNlIGxhbmd1YWdlLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZ2V0RGV2aWNlTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbiBnZXREZXZpY2VMYW5ndWFnZSAoKSB7XG4gIGxldCBsYW5ndWFnZTtcbiAgaWYgKGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKSA8IDIzKSB7XG4gICAgbGFuZ3VhZ2UgPSBhd2FpdCB0aGlzLmdldERldmljZVN5c0xhbmd1YWdlKCk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgbGFuZ3VhZ2UgPSBhd2FpdCB0aGlzLmdldERldmljZVByb2R1Y3RMYW5ndWFnZSgpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsYW5ndWFnZSA9IChhd2FpdCB0aGlzLmdldERldmljZUxvY2FsZSgpKS5zcGxpdCgnLScpWzBdO1xuICB9XG4gIHJldHVybiBsYW5ndWFnZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjb3VudHJ5IG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5hbWUgb2YgZGV2aWNlIGNvdW50cnkuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5nZXREZXZpY2VDb3VudHJ5ID0gYXN5bmMgZnVuY3Rpb24gZ2V0RGV2aWNlQ291bnRyeSAoKSB7XG4gIC8vIHRoaXMgbWV0aG9kIGlzIG9ubHkgdXNlZCBpbiBBUEkgPCAyM1xuICBsZXQgY291bnRyeSA9IGF3YWl0IHRoaXMuZ2V0RGV2aWNlU3lzQ291bnRyeSgpO1xuICBpZiAoIWNvdW50cnkpIHtcbiAgICBjb3VudHJ5ID0gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9kdWN0Q291bnRyeSgpO1xuICB9XG4gIHJldHVybiBjb3VudHJ5O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxvY2FsZSBuYW1lIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBuYW1lIG9mIGRldmljZSBsb2NhbGUuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5nZXREZXZpY2VMb2NhbGUgPSBhc3luYyBmdW5jdGlvbiBnZXREZXZpY2VMb2NhbGUgKCkge1xuICAvLyB0aGlzIG1ldGhvZCBpcyBvbmx5IHVzZWQgaW4gQVBJID49IDIzXG4gIGxldCBsb2NhbGUgPSBhd2FpdCB0aGlzLmdldERldmljZVN5c0xvY2FsZSgpO1xuICBpZiAoIWxvY2FsZSkge1xuICAgIGxvY2FsZSA9IGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvZHVjdExvY2FsZSgpO1xuICB9XG4gIHJldHVybiBsb2NhbGU7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgbG9jYWxlIG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0IGFuZCB0aGUgZm9ybWF0IG9mIHRoZSBsb2NhbGUgaXMgZW4tVVMsIGZvciBleGFtcGxlLlxuICogVGhpcyBtZXRob2QgY2FsbCBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnksIHNvLCBwbGVhc2UgdXNlIHNldERldmljZUxhbmd1YWdlQ291bnRyeSBhcyBwb3NzaWJsZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlIC0gTmFtZXMgb2YgdGhlIGRldmljZSBsYW5ndWFnZSBhbmQgdGhlIGNvdW50cnkgY29ubmVjdGVkIHdpdGggYC1gLiBlLmcuIGVuLVVTLlxuICovXG5hcGtVdGlsc01ldGhvZHMuc2V0RGV2aWNlTG9jYWxlID0gYXN5bmMgZnVuY3Rpb24gc2V0RGV2aWNlTG9jYWxlIChsb2NhbGUpIHtcbiAgY29uc3QgdmFsaWRhdGVMb2NhbGUgPSBuZXcgUmVnRXhwKC9bYS16QS1aXSstW2EtekEtWjAtOV0rLyk7XG4gIGlmICghdmFsaWRhdGVMb2NhbGUudGVzdChsb2NhbGUpKSB7XG4gICAgbG9nLndhcm4oYHNldERldmljZUxvY2FsZSByZXF1aXJlcyB0aGUgZm9sbG93aW5nIGZvcm1hdDogZW4tVVMgb3IgamEtSlBgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgc3BsaXRfbG9jYWxlID0gbG9jYWxlLnNwbGl0KCctJyk7XG4gIGF3YWl0IHRoaXMuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5KHNwbGl0X2xvY2FsZVswXSwgc3BsaXRfbG9jYWxlWzFdKTtcbn07XG5cbi8qKlxuICogTWFrZSBzdXJlIGN1cnJlbnQgZGV2aWNlIGxvY2FsZSBpcyBleHBlY3RlZCBvciBub3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlIC0gTGFuZ3VhZ2UuIFRoZSBsYW5ndWFnZSBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlLCBidXQgTG9jYWxlIGFsd2F5cyBjYW5vbmljYWxpemVzIHRvIGxvd2VyIGNhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gY291bnRyeSAtIENvdW50cnkuIFRoZSBsYW5ndWFnZSBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlLCBidXQgTG9jYWxlIGFsd2F5cyBjYW5vbmljYWxpemVzIHRvIGxvd2VyIGNhc2UuXG4gKiBAcGFyYW0gez9zdHJpbmd9IHNjcmlwdCAtIFNjcmlwdC4gVGhlIHNjcmlwdCBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlIGJ1dCBMb2NhbGUgYWx3YXlzIGNhbm9uaWNhbGl6ZXMgdG8gdGl0bGUgY2FzZS5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBJZiBjdXJyZW50IGxvY2FsZSBpcyBsYW5ndWFnZSBhbmQgY291bnRyeSBhcyBhcmd1bWVudHMsIHJldHVybiB0cnVlLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZW5zdXJlQ3VycmVudExvY2FsZSA9IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUN1cnJlbnRMb2NhbGUgKGxhbmd1YWdlLCBjb3VudHJ5LCBzY3JpcHQgPSBudWxsKSB7XG4gIGNvbnN0IGhhc0xhbmd1YWdlID0gXy5pc1N0cmluZyhsYW5ndWFnZSk7XG4gIGNvbnN0IGhhc0NvdW50cnkgPSBfLmlzU3RyaW5nKGNvdW50cnkpO1xuXG4gIGlmICghaGFzTGFuZ3VhZ2UgJiYgIWhhc0NvdW50cnkpIHtcbiAgICBsb2cud2FybignZW5zdXJlQ3VycmVudExvY2FsZSByZXF1aXJlcyBsYW5ndWFnZSBvciBjb3VudHJ5Jyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gZ2V0IGxvd2VyIGNhc2UgdmVyc2lvbnMgb2YgdGhlIHN0cmluZ3NcbiAgbGFuZ3VhZ2UgPSAobGFuZ3VhZ2UgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gIGNvdW50cnkgPSAoY291bnRyeSB8fCAnJykudG9Mb3dlckNhc2UoKTtcblxuICBjb25zdCBhcGlMZXZlbCA9IGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKTtcblxuICByZXR1cm4gYXdhaXQgcmV0cnlJbnRlcnZhbCg1LCAxMDAwLCBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChhcGlMZXZlbCA8IDIzKSB7XG4gICAgICAgIGxldCBjdXJMYW5ndWFnZSwgY3VyQ291bnRyeTtcbiAgICAgICAgaWYgKGhhc0xhbmd1YWdlKSB7XG4gICAgICAgICAgY3VyTGFuZ3VhZ2UgPSAoYXdhaXQgdGhpcy5nZXREZXZpY2VMYW5ndWFnZSgpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmICghaGFzQ291bnRyeSAmJiBsYW5ndWFnZSA9PT0gY3VyTGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFzQ291bnRyeSkge1xuICAgICAgICAgIGN1ckNvdW50cnkgPSAoYXdhaXQgdGhpcy5nZXREZXZpY2VDb3VudHJ5KCkpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKCFoYXNMYW5ndWFnZSAmJiBjb3VudHJ5ID09PSBjdXJDb3VudHJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhbmd1YWdlID09PSBjdXJMYW5ndWFnZSAmJiBjb3VudHJ5ID09PSBjdXJDb3VudHJ5KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGN1ckxvY2FsZSA9IChhd2FpdCB0aGlzLmdldERldmljZUxvY2FsZSgpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAvLyB6aC1oYW5zLWNuIDogemgtY25cbiAgICAgICAgY29uc3QgbG9jYWxlQ29kZSA9IHNjcmlwdCA/IGAke2xhbmd1YWdlfS0ke3NjcmlwdC50b0xvd2VyQ2FzZSgpfS0ke2NvdW50cnl9YCA6IGAke2xhbmd1YWdlfS0ke2NvdW50cnl9YDtcblxuICAgICAgICBpZiAobG9jYWxlQ29kZSA9PT0gY3VyTG9jYWxlKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKGBSZXF1ZXN0ZWQgbG9jYWxlIGlzIGVxdWFsIHRvIGN1cnJlbnQgbG9jYWxlOiAnJHtjdXJMb2NhbGV9J2ApO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBpZiB0aGVyZSBoYXMgYmVlbiBhbiBlcnJvciwgcmVzdGFydCBhZGIgYW5kIHJldHJ5XG4gICAgICBsb2cuZXJyb3IoYFVuYWJsZSB0byBjaGVjayBkZXZpY2UgbG9jYWxpemF0aW9uOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgbG9nLmRlYnVnKCdSZXN0YXJ0aW5nIEFEQiBhbmQgcmV0cnlpbmcuLi4nKTtcbiAgICAgIGF3YWl0IHRoaXMucmVzdGFydEFkYigpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgbG9jYWxlIG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAtIExhbmd1YWdlLiBUaGUgbGFuZ3VhZ2UgZmllbGQgaXMgY2FzZSBpbnNlbnNpdGl2ZSwgYnV0IExvY2FsZSBhbHdheXMgY2Fub25pY2FsaXplcyB0byBsb3dlciBjYXNlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBbYS16QS1aXXsyLDh9LiBlLmcuIGVuLCBqYSA6IGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9qYXZhL3V0aWwvTG9jYWxlLmh0bWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb3VudHJ5IC0gQ291bnRyeS4gVGhlIGNvdW50cnkgKHJlZ2lvbikgZmllbGQgaXMgY2FzZSBpbnNlbnNpdGl2ZSwgYnV0IExvY2FsZSBhbHdheXMgY2Fub25pY2FsaXplcyB0byB1cHBlciBjYXNlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBbYS16QS1aXXsyfSB8IFswLTldezN9LiBlLmcuIFVTLCBKUCA6IGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9qYXZhL3V0aWwvTG9jYWxlLmh0bWxcbiAqIEBwYXJhbSB7P3N0cmluZ30gc2NyaXB0IC0gU2NyaXB0LiBUaGUgc2NyaXB0IGZpZWxkIGlzIGNhc2UgaW5zZW5zaXRpdmUgYnV0IExvY2FsZSBhbHdheXMgY2Fub25pY2FsaXplcyB0byB0aXRsZSBjYXNlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBbYS16QS1aXXs0fS4gZS5nLiBIYW5zIGluIHpoLUhhbnMtQ04gOiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvamF2YS91dGlsL0xvY2FsZS5odG1sXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5zZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgPSBhc3luYyBmdW5jdGlvbiBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgKGxhbmd1YWdlLCBjb3VudHJ5LCBzY3JpcHQgPSBudWxsKSB7XG4gIGxldCBoYXNMYW5ndWFnZSA9IGxhbmd1YWdlICYmIF8uaXNTdHJpbmcobGFuZ3VhZ2UpO1xuICBsZXQgaGFzQ291bnRyeSA9IGNvdW50cnkgJiYgXy5pc1N0cmluZyhjb3VudHJ5KTtcbiAgaWYgKCFoYXNMYW5ndWFnZSB8fCAhaGFzQ291bnRyeSkge1xuICAgIGxvZy53YXJuKGBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgcmVxdWlyZXMgbGFuZ3VhZ2UgYW5kIGNvdW50cnkgYXQgbGVhc3RgKTtcbiAgICBsb2cud2FybihgR290IGxhbmd1YWdlOiAnJHtsYW5ndWFnZX0nIGFuZCBjb3VudHJ5OiAnJHtjb3VudHJ5fSdgKTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGFwaUxldmVsID0gYXdhaXQgdGhpcy5nZXRBcGlMZXZlbCgpO1xuXG4gIGxhbmd1YWdlID0gKGxhbmd1YWdlIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBjb3VudHJ5ID0gKGNvdW50cnkgfHwgJycpLnRvVXBwZXJDYXNlKCk7XG5cbiAgaWYgKGFwaUxldmVsIDwgMjMpIHtcbiAgICBsZXQgY3VyTGFuZ3VhZ2UgPSAoYXdhaXQgdGhpcy5nZXREZXZpY2VMYW5ndWFnZSgpKS50b0xvd2VyQ2FzZSgpO1xuICAgIGxldCBjdXJDb3VudHJ5ID0gKGF3YWl0IHRoaXMuZ2V0RGV2aWNlQ291bnRyeSgpKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgaWYgKGxhbmd1YWdlICE9PSBjdXJMYW5ndWFnZSB8fCBjb3VudHJ5ICE9PSBjdXJDb3VudHJ5KSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERldmljZVN5c0xvY2FsZVZpYVNldHRpbmdBcHAobGFuZ3VhZ2UsIGNvdW50cnkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgY3VyTG9jYWxlID0gYXdhaXQgdGhpcy5nZXREZXZpY2VMb2NhbGUoKTtcblxuICAgIC8vIHpoLUhhbnMtQ04gOiB6aC1DTlxuICAgIGNvbnN0IGxvY2FsZUNvZGUgPSBzY3JpcHQgPyBgJHtsYW5ndWFnZX0tJHtzY3JpcHR9LSR7Y291bnRyeX1gIDogYCR7bGFuZ3VhZ2V9LSR7Y291bnRyeX1gO1xuICAgIGxvZy5kZWJ1ZyhgQ3VycmVudCBsb2NhbGU6ICcke2N1ckxvY2FsZX0nOyByZXF1ZXN0ZWQgbG9jYWxlOiAnJHtsb2NhbGVDb2RlfSdgKTtcbiAgICBpZiAobG9jYWxlQ29kZS50b0xvd2VyQ2FzZSgpICE9PSBjdXJMb2NhbGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwKGxhbmd1YWdlLCBjb3VudHJ5LCBzY3JpcHQpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBcHBJbmZvXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSAtIFBhY2thZ2UgbmFtZSwgZm9yIGV4YW1wbGUgJ2NvbS5hY21lLmFwcCcuXG4gKiBAcHJvcGVydHkge251bWJlcn0gdmVyc2lvbkNvZGUgLSBWZXJzaW9uIGNvZGUuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmVyc2lvbk5hbWUgLSBWZXJzaW9uIG5hbWUsIGZvciBleGFtcGxlICcxLjAnLlxuICovXG5cbi8qKlxuICogR2V0IHRoZSBwYWNrYWdlIGluZm8gZnJvbSBsb2NhbCBhcGsgZmlsZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gZXhpc3RpbmcgLmFwayhzKSBwYWNrYWdlIG9uIHRoZSBsb2NhbFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlIHN5c3RlbS5cbiAqIEByZXR1cm4gez9BcHBJbmZvfSBUaGUgcGFyc2VkIGFwcGxpY2F0aW9uIGluZm9ybWF0aW9uLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZ2V0QXBrSW5mbyA9IGFzeW5jIGZ1bmN0aW9uIGdldEFwa0luZm8gKGFwcFBhdGgpIHtcbiAgaWYgKCFhd2FpdCBmcy5leGlzdHMoYXBwUGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBmaWxlIGF0IHBhdGggJHthcHBQYXRofSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgYWNjZXNzaWJsZWApO1xuICB9XG5cbiAgaWYgKGFwcFBhdGguZW5kc1dpdGgoQVBLU19FWFRFTlNJT04pKSB7XG4gICAgYXBwUGF0aCA9IGF3YWl0IHRoaXMuZXh0cmFjdEJhc2VBcGsoYXBwUGF0aCk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGFwa1JlYWRlciA9IGF3YWl0IEFwa1JlYWRlci5vcGVuKGFwcFBhdGgpO1xuICAgIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgYXBrUmVhZGVyLnJlYWRNYW5pZmVzdCgpO1xuICAgIGNvbnN0IHtwa2csIHZlcnNpb25OYW1lLCB2ZXJzaW9uQ29kZX0gPSBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0KTtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcGtnLFxuICAgICAgdmVyc2lvbkNvZGUsXG4gICAgICB2ZXJzaW9uTmFtZSxcbiAgICB9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nLndhcm4oYEVycm9yICcke2UubWVzc2FnZX0nIHdoaWxlIGdldHRpbmcgYmFkZ2luZyBpbmZvYCk7XG4gIH1cbiAgcmV0dXJuIHt9O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHBhY2thZ2UgaW5mbyBmcm9tIHRoZSBpbnN0YWxsZWQgYXBwbGljYXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBpbnN0YWxsZWQgcGFja2FnZS5cbiAqIEByZXR1cm4gez9BcHBJbmZvfSBUaGUgcGFyc2VkIGFwcGxpY2F0aW9uIGluZm9ybWF0aW9uLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZ2V0UGFja2FnZUluZm8gPSBhc3luYyBmdW5jdGlvbiBnZXRQYWNrYWdlSW5mbyAocGtnKSB7XG4gIGxvZy5kZWJ1ZyhgR2V0dGluZyBwYWNrYWdlIGluZm8gZm9yICcke3BrZ30nYCk7XG4gIGxldCByZXN1bHQgPSB7bmFtZTogcGtnfTtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICdwYWNrYWdlJywgcGtnXSk7XG4gICAgY29uc3QgdmVyc2lvbk5hbWVNYXRjaCA9IG5ldyBSZWdFeHAoL3ZlcnNpb25OYW1lPShbXFxkKy5dKykvKS5leGVjKHN0ZG91dCk7XG4gICAgaWYgKHZlcnNpb25OYW1lTWF0Y2gpIHtcbiAgICAgIHJlc3VsdC52ZXJzaW9uTmFtZSA9IHZlcnNpb25OYW1lTWF0Y2hbMV07XG4gICAgfVxuICAgIGNvbnN0IHZlcnNpb25Db2RlTWF0Y2ggPSBuZXcgUmVnRXhwKC92ZXJzaW9uQ29kZT0oXFxkKykvKS5leGVjKHN0ZG91dCk7XG4gICAgaWYgKHZlcnNpb25Db2RlTWF0Y2gpIHtcbiAgICAgIHJlc3VsdC52ZXJzaW9uQ29kZSA9IHBhcnNlSW50KHZlcnNpb25Db2RlTWF0Y2hbMV0sIDEwKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYEVycm9yICcke2Vyci5tZXNzYWdlfScgd2hpbGUgZHVtcGluZyBwYWNrYWdlIGluZm9gKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuYXBrVXRpbHNNZXRob2RzLnB1bGxBcGsgPSBhc3luYyBmdW5jdGlvbiBwdWxsQXBrIChwa2csIHRtcERpcikge1xuICBjb25zdCBwa2dQYXRoID0gKGF3YWl0IHRoaXMuYWRiRXhlYyhbJ3NoZWxsJywgJ3BtJywgJ3BhdGgnLCBwa2ddKSkucmVwbGFjZSgncGFja2FnZTonLCAnJyk7XG4gIGNvbnN0IHRtcEFwcCA9IHBhdGgucmVzb2x2ZSh0bXBEaXIsIGAke3BrZ30uYXBrYCk7XG4gIGF3YWl0IHRoaXMucHVsbChwa2dQYXRoLCB0bXBBcHApO1xuICBsb2cuZGVidWcoYFB1bGxlZCBhcHAgZm9yIHBhY2thZ2UgJyR7cGtnfScgdG8gJyR7dG1wQXBwfSdgKTtcbiAgcmV0dXJuIHRtcEFwcDtcbn07XG5cbmV4cG9ydCB7IFJFTU9URV9DQUNIRV9ST09UIH07XG5leHBvcnQgZGVmYXVsdCBhcGtVdGlsc01ldGhvZHM7XG4iXSwiZmlsZSI6ImxpYi90b29scy9hcGstdXRpbHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
