"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMostRecentChromedriver = getMostRecentChromedriver;
exports.default = exports.CD_VER = exports.CHROMEDRIVER_CHROME_MAPPING = exports.Chromedriver = void 0;

require("source-map-support/register");

var _events = _interopRequireDefault(require("events"));

var _appiumBaseDriver = require("appium-base-driver");

var _child_process = _interopRequireDefault(require("child_process"));

var _appiumSupport = require("appium-support");

var _asyncbox = require("asyncbox");

var _teen_process = require("teen_process");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _utils = require("./utils");

var _semver = _interopRequireDefault(require("semver"));

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _compareVersions = _interopRequireDefault(require("compare-versions"));

var _storageClient = _interopRequireDefault(require("./storage-client"));

var _protocolHelpers = require("./protocol-helpers");

const log = _appiumSupport.logger.getLogger('Chromedriver');

const NEW_CD_VERSION_FORMAT_MAJOR_VERSION = 73;
const DEFAULT_HOST = '127.0.0.1';
const MIN_CD_VERSION_WITH_W3C_SUPPORT = 75;
const DEFAULT_PORT = 9515;
const CHROMEDRIVER_CHROME_MAPPING = {
  '78.0.3904.70': '78.0.3904.70',
  '77.0.3865.40': '77.0.3865.40',
  '76.0.3809.126': '76.0.3809.126',
  '76.0.3809.68': '76.0.3809.68',
  '76.0.3809.25': '76.0.3809.25',
  '76.0.3809.12': '76.0.3809.12',
  '75.0.3770.140': '75.0.3770.140',
  '75.0.3770.90': '75.0.3770.90',
  '75.0.3770.8': '75.0.3770.8',
  '74.0.3729.6': '74.0.3729',
  '73.0.3683.68': '70.0.3538',
  '2.46': '71.0.3578',
  '2.45': '70.0.0',
  '2.44': '69.0.3497',
  '2.43': '69.0.3497',
  '2.42': '68.0.3440',
  '2.41': '67.0.3396',
  '2.40': '66.0.3359',
  '2.39': '66.0.3359',
  '2.38': '65.0.3325',
  '2.37': '64.0.3282',
  '2.36': '63.0.3239',
  '2.35': '62.0.3202',
  '2.34': '61.0.3163',
  '2.33': '60.0.3112',
  '2.32': '59.0.3071',
  '2.31': '58.0.3029',
  '2.30': '58.0.3029',
  '2.29': '57.0.2987',
  '2.28': '55.0.2883',
  '2.27': '54.0.2840',
  '2.26': '53.0.2785',
  '2.25': '53.0.2785',
  '2.24': '52.0.2743',
  '2.23': '51.0.2704',
  '2.22': '49.0.2623',
  '2.21': '46.0.2490',
  '2.20': '43.0.2357',
  '2.19': '43.0.2357',
  '2.18': '43.0.2357',
  '2.17': '42.0.2311',
  '2.16': '42.0.2311',
  '2.15': '40.0.2214',
  '2.14': '39.0.2171',
  '2.13': '38.0.2125',
  '2.12': '36.0.1985',
  '2.11': '36.0.1985',
  '2.10': '33.0.1751',
  '2.9': '31.0.1650',
  '2.8': '30.0.1573',
  '2.7': '30.0.1573',
  '2.6': '29.0.1545',
  '2.5': '29.0.1545',
  '2.4': '29.0.1545',
  '2.3': '28.0.1500',
  '2.2': '27.0.1453',
  '2.1': '27.0.1453',
  '2.0': '27.0.1453'
};
exports.CHROMEDRIVER_CHROME_MAPPING = CHROMEDRIVER_CHROME_MAPPING;
const CHROME_BUNDLE_ID = 'com.android.chrome';
const WEBVIEW_BUNDLE_IDS = ['com.google.android.webview', 'com.android.webview'];
const CHROMEDRIVER_TUTORIAL = 'https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/web/chromedriver.md';
const CD_VER = process.env.npm_config_chromedriver_version || process.env.CHROMEDRIVER_VERSION || getMostRecentChromedriver();
exports.CD_VER = CD_VER;
const CD_VERSION_TIMEOUT = 5000;

function getMostRecentChromedriver(mapping = CHROMEDRIVER_CHROME_MAPPING) {
  if (_lodash.default.isEmpty(mapping)) {
    throw new Error('Unable to get most recent Chromedriver from empty mapping');
  }

  return _lodash.default.last(_lodash.default.keys(mapping).sort(_compareVersions.default));
}

class Chromedriver extends _events.default.EventEmitter {
  constructor(args = {}) {
    super();
    const {
      host = DEFAULT_HOST,
      port = DEFAULT_PORT,
      useSystemExecutable = false,
      executable,
      executableDir = (0, _utils.getChromedriverDir)(),
      bundleId,
      mappingPath,
      cmdArgs,
      adb,
      verbose,
      logPath,
      disableBuildCheck,
      isAutodownloadEnabled = false
    } = args;
    this.proxyHost = host;
    this.proxyPort = port;
    this.adb = adb;
    this.cmdArgs = cmdArgs;
    this.proc = null;
    this.useSystemExecutable = useSystemExecutable;
    this.chromedriver = executable;
    this.executableDir = executableDir;
    this.mappingPath = mappingPath;
    this.bundleId = bundleId;
    this.executableVerified = false;
    this.state = Chromedriver.STATE_STOPPED;
    this.jwproxy = new _appiumBaseDriver.JWProxy({
      server: this.proxyHost,
      port: this.proxyPort
    });
    this.verbose = verbose;
    this.logPath = logPath;
    this.disableBuildCheck = !!disableBuildCheck;
    this.storageClient = isAutodownloadEnabled ? new _storageClient.default({
      chromedriverDir: this.executableDir
    }) : null;
    this.capabilities = {};
    this.desiredProtocol = _appiumBaseDriver.PROTOCOLS.MJSONWP;
  }

  async getMapping() {
    let mapping = CHROMEDRIVER_CHROME_MAPPING;

    if (this.mappingPath) {
      log.debug(`Attempting to use Chromedriver-Chrome mapping from '${this.mappingPath}'`);

      if (!(await _appiumSupport.fs.exists(this.mappingPath))) {
        log.warn(`No file found at '${this.mappingPath}'. Using default mapping`);
      } else {
        try {
          mapping = JSON.parse((await _appiumSupport.fs.readFile(this.mappingPath)));
        } catch (err) {
          log.error(`Error parsing mapping from '${this.mappingPath}': ${err.message}`);
          log.warn('Using default mapping');
        }
      }
    }

    for (const [cdVersion, chromeVersion] of _lodash.default.toPairs(mapping)) {
      mapping[cdVersion] = _semver.default.coerce(chromeVersion);
    }

    return mapping;
  }

  async getChromedrivers(mapping) {
    const executables = await _appiumSupport.fs.glob(`${this.executableDir}/*`);
    log.debug(`Found ${executables.length} executable${executables.length === 1 ? '' : 's'} ` + `in '${this.executableDir}'`);
    const cds = (await (0, _asyncbox.asyncmap)(executables, async function mapChromedriver(executable) {
      const logError = ({
        message,
        stdout = null,
        stderr = null
      }) => {
        let errMsg = `Cannot retrieve version number from '${_path.default.basename(executable)}' Chromedriver binary. ` + `Make sure it returns a valid version string in response to '--version' command line argument. ${message}`;

        if (stdout) {
          errMsg += `\nStdout: ${stdout}`;
        }

        if (stderr) {
          errMsg += `\nStderr: ${stderr}`;
        }

        log.warn(errMsg);
        return null;
      };

      let stdout;
      let stderr;

      try {
        ({
          stdout,
          stderr
        } = await (0, _teen_process.exec)(executable, ['--version'], {
          timeout: CD_VERSION_TIMEOUT
        }));
      } catch (err) {
        if (!(err.message || '').includes('timed out') && !(err.stdout || '').includes('Starting ChromeDriver')) {
          return logError(err);
        }

        stdout = err.stdout;
      }

      const match = /ChromeDriver\s+\(?v?([\d.]+)\)?/i.exec(stdout);

      if (!match) {
        return logError({
          message: 'Cannot parse the version string',
          stdout,
          stderr
        });
      }

      let version = match[1];

      const coercedVersion = _semver.default.coerce(version);

      if (coercedVersion) {
        if (coercedVersion.major < NEW_CD_VERSION_FORMAT_MAJOR_VERSION) {
          version = `${coercedVersion.major}.${coercedVersion.minor}`;
        }
      }

      return {
        executable,
        version,
        minChromeVersion: mapping[version]
      };
    })).filter(cd => !!cd).sort((a, b) => (0, _compareVersions.default)(b.version, a.version));

    if (_lodash.default.isEmpty(cds)) {
      log.info(`No Chromedrivers were found in '${this.executableDir}'`);
      return cds;
    }

    log.debug(`The following Chromedriver executables were found:`);

    for (const cd of cds) {
      log.debug(`    '${cd.executable}' (version '${cd.version}', minimum Chrome version '${cd.minChromeVersion ? cd.minChromeVersion : 'Unknown'}')`);
    }

    return cds;
  }

  async getChromeVersion() {
    let chromeVersion;

    if (this.adb && (await this.adb.getApiLevel()) >= 24) {
      this.bundleId = CHROME_BUNDLE_ID;
    }

    if (!this.bundleId) {
      this.bundleId = CHROME_BUNDLE_ID;

      for (const bundleId of WEBVIEW_BUNDLE_IDS) {
        chromeVersion = await (0, _utils.getChromeVersion)(this.adb, bundleId);

        if (chromeVersion) {
          this.bundleId = bundleId;
          break;
        }
      }
    }

    if (!chromeVersion) {
      chromeVersion = await (0, _utils.getChromeVersion)(this.adb, this.bundleId);
    }

    return chromeVersion ? _semver.default.coerce(chromeVersion) : null;
  }

  async getCompatibleChromedriver() {
    if (!this.adb) {
      return await (0, _utils.getChromedriverBinaryPath)();
    }

    const mapping = await this.getMapping();
    let didStorageSync = false;

    const syncChromedrivers = async chromeVersion => {
      didStorageSync = true;
      const retrievedMapping = await this.storageClient.retrieveMapping();
      log.debug('Got chromedrivers mapping from the storage: ' + JSON.stringify(retrievedMapping, null, 2));
      const driverKeys = await this.storageClient.syncDrivers({
        minBrowserVersion: chromeVersion.major
      });

      if (_lodash.default.isEmpty(driverKeys)) {
        return false;
      }

      const synchronizedDriversMapping = driverKeys.reduce((acc, x) => {
        const {
          version,
          minBrowserVersion
        } = retrievedMapping[x];
        acc[version] = minBrowserVersion;
        return acc;
      }, {});
      Object.assign(mapping, synchronizedDriversMapping);
      let shouldUpdateGlobalMapping = true;

      if (await _appiumSupport.fs.exists(this.mappingPath)) {
        try {
          await _appiumSupport.fs.writeFile(this.mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
          shouldUpdateGlobalMapping = false;
        } catch (e) {
          log.warn(`Cannot store the updated chromedrivers mapping into '${this.mappingPath}'. ` + `This may reduce the performance of further executions. Original error: ${e.message}`);
        }
      }

      if (shouldUpdateGlobalMapping) {
        Object.assign(CHROMEDRIVER_CHROME_MAPPING, mapping);
      }

      return true;
    };

    do {
      const cds = await this.getChromedrivers(mapping);

      if (this.disableBuildCheck) {
        if (_lodash.default.isEmpty(cds)) {
          log.errorAndThrow(`There must be at least one Chromedriver executable available for use if ` + `'chromedriverDisableBuildCheck' capability is set to 'true'`);
        }

        const {
          version,
          executable
        } = cds[0];
        log.warn(`Chrome build check disabled. Using most recent Chromedriver version (${version}, at '${executable}')`);
        log.warn(`If this is wrong, set 'chromedriverDisableBuildCheck' capability to 'false'`);
        return executable;
      }

      const chromeVersion = await this.getChromeVersion();

      if (!chromeVersion) {
        if (_lodash.default.isEmpty(cds)) {
          log.errorAndThrow(`There must be at least one Chromedriver executable available for use if ` + `the current Chrome version cannot be determined`);
        }

        const {
          version,
          executable
        } = cds[0];
        log.warn(`Unable to discover Chrome version. Using Chromedriver ${version} at '${executable}'`);
        return executable;
      }

      log.debug(`Found Chrome bundle '${this.bundleId}' version '${chromeVersion}'`);
      const autodownloadMsg = this.storageClient && didStorageSync ? '' : '. You could also try to enable automated chromedrivers download server feature';

      if (_lodash.default.isEmpty(mapping) || _semver.default.gt(chromeVersion, _lodash.default.values(mapping)[0])) {
        if (this.storageClient && !didStorageSync) {
          try {
            if (await syncChromedrivers(chromeVersion)) {
              continue;
            }
          } catch (e) {
            log.warn(e.stack);
          }
        }

        if (!_lodash.default.isEmpty(cds) && !cds[0].minChromeVersion) {
          const {
            version,
            executable
          } = cds[0];
          log.warn(`No known Chromedriver available to automate Chrome version '${chromeVersion}'`);
          log.warn(`Using Chromedriver version '${version}', which has not been tested with Appium` + autodownloadMsg);
          return executable;
        }
      }

      const workingCds = cds.filter(cd => {
        const versionObj = _semver.default.coerce(cd.minChromeVersion);

        return versionObj && chromeVersion.major === versionObj.major;
      });

      if (_lodash.default.isEmpty(workingCds)) {
        if (this.storageClient && !didStorageSync) {
          try {
            if (await syncChromedrivers(chromeVersion)) {
              continue;
            }
          } catch (e) {
            log.warn(e.stack);
          }
        }

        log.errorAndThrow(`No Chromedriver found that can automate Chrome '${chromeVersion}'. ` + `See ${CHROMEDRIVER_TUTORIAL} for more details` + autodownloadMsg);
      }

      const binPath = workingCds[0].executable;
      log.debug(`Found ${workingCds.length} Chromedriver executable${workingCds.length === 1 ? '' : 's'} ` + `capable of automating Chrome '${chromeVersion}'.\nChoosing the most recent, '${binPath}'.`);
      log.debug('If a specific version is required, specify it with the `chromedriverExecutable`' + 'desired capability.');
      return binPath;
    } while (true);
  }

  async initChromedriverPath() {
    if (this.executableVerified) return;

    if (!this.chromedriver) {
      this.chromedriver = this.useSystemExecutable ? await (0, _utils.getChromedriverBinaryPath)() : await this.getCompatibleChromedriver();
    }

    if (!(await _appiumSupport.fs.exists(this.chromedriver))) {
      throw new Error(`Trying to use a chromedriver binary at the path ` + `${this.chromedriver}, but it doesn't exist!`);
    }

    this.executableVerified = true;
    log.info(`Set chromedriver binary as: ${this.chromedriver}`);
  }

  syncProtocol(cdVersion = null) {
    const coercedVersion = _semver.default.coerce(cdVersion);

    if (!coercedVersion || coercedVersion.major < MIN_CD_VERSION_WITH_W3C_SUPPORT) {
      log.debug(`Chromedriver v. ${cdVersion} does not fully support ${_appiumBaseDriver.PROTOCOLS.W3C} protocol. ` + `Defaulting to ${_appiumBaseDriver.PROTOCOLS.MJSONWP}`);
      return;
    }

    const chromeOptions = (0, _protocolHelpers.getCapValue)(this.capabilities, 'chromeOptions', {});

    if (chromeOptions.w3c === false) {
      log.info(`Chromedriver v. ${cdVersion} supports ${_appiumBaseDriver.PROTOCOLS.W3C} protocol, ` + `but ${_appiumBaseDriver.PROTOCOLS.MJSONWP} one has been explicitly requested`);
      return;
    }

    this.desiredProtocol = _appiumBaseDriver.PROTOCOLS.W3C;
    this.capabilities = (0, _protocolHelpers.toW3cCapNames)(this.capabilities);
  }

  async start(caps, emitStartingState = true) {
    this.capabilities = _lodash.default.cloneDeep(caps);
    this.capabilities.loggingPrefs = _lodash.default.cloneDeep((0, _protocolHelpers.getCapValue)(caps, 'loggingPrefs', {}));

    if (_lodash.default.isEmpty(this.capabilities.loggingPrefs.browser)) {
      this.capabilities.loggingPrefs.browser = 'ALL';
    }

    if (emitStartingState) {
      this.changeState(Chromedriver.STATE_STARTING);
    }

    const args = ['--url-base=wd/hub', `--port=${this.proxyPort}`];

    if (this.adb && this.adb.adbPort) {
      args.push(`--adb-port=${this.adb.adbPort}`);
    }

    if (_lodash.default.isArray(this.cmdArgs)) {
      args.push(...this.cmdArgs);
    }

    if (this.logPath) {
      args.push(`--log-path=${this.logPath}`);
    }

    if (this.disableBuildCheck) {
      args.push('--disable-build-check');
    }

    args.push('--verbose');

    const startDetector = stdout => {
      return stdout.indexOf('Starting ') === 0;
    };

    let processIsAlive = false;
    let webviewVersion;

    try {
      await this.initChromedriverPath();
      await this.killAll();
      this.proc = new _teen_process.SubProcess(this.chromedriver, args);
      processIsAlive = true;
      this.proc.on('output', (stdout, stderr) => {
        const out = stdout + stderr;
        let match = /"Browser": "(.*)"/.exec(out);

        if (match) {
          webviewVersion = match[1];
          log.debug(`Webview version: '${webviewVersion}'`);
        }

        match = /Starting ChromeDriver ([.\d]+)/.exec(out);

        if (match) {
          log.debug(`Chromedriver version: '${match[1]}'`);
          this.syncProtocol(match[1]);
        }

        if (this.verbose) {
          for (let line of (stdout || '').trim().split('\n')) {
            if (!line.trim().length) continue;
            log.debug(`[STDOUT] ${line}`);
          }

          for (let line of (stderr || '').trim().split('\n')) {
            if (!line.trim().length) continue;
            log.error(`[STDERR] ${line}`);
          }
        }
      });
      this.proc.on('exit', (code, signal) => {
        processIsAlive = false;

        if (this.state !== Chromedriver.STATE_STOPPED && this.state !== Chromedriver.STATE_STOPPING && this.state !== Chromedriver.STATE_RESTARTING) {
          let msg = `Chromedriver exited unexpectedly with code ${code}, ` + `signal ${signal}`;
          log.error(msg);
          this.changeState(Chromedriver.STATE_STOPPED);
        }
      });
      log.info(`Spawning chromedriver with: ${this.chromedriver} ` + `${args.join(' ')}`);
      await this.proc.start(startDetector);
      await this.waitForOnline();
      await this.startSession();
    } catch (e) {
      this.emit(Chromedriver.EVENT_ERROR, e);

      if (processIsAlive) {
        await this.proc.stop();
      }

      let message = '';

      if (e.message.includes('Chrome version must be')) {
        message += 'Unable to automate Chrome version because it is too old for this version of Chromedriver.\n';

        if (webviewVersion) {
          message += `Chrome version on the device: ${webviewVersion}\n`;
        }

        message += `Visit '${CHROMEDRIVER_TUTORIAL}' to troubleshoot the problem.\n`;
      }

      message += e.message;
      log.errorAndThrow(message);
    }
  }

  sessionId() {
    if (this.state !== Chromedriver.STATE_ONLINE) {
      return null;
    }

    return this.jwproxy.sessionId;
  }

  async restart() {
    log.info('Restarting chromedriver');

    if (this.state !== Chromedriver.STATE_ONLINE) {
      throw new Error("Can't restart when we're not online");
    }

    this.changeState(Chromedriver.STATE_RESTARTING);
    await this.stop(false);
    await this.start(this.capabilities, false);
  }

  async waitForOnline() {
    let chromedriverStopped = false;
    await (0, _asyncbox.retryInterval)(20, 200, async () => {
      if (this.state === Chromedriver.STATE_STOPPED) {
        chromedriverStopped = true;
        return;
      }

      await this.getStatus();
    });

    if (chromedriverStopped) {
      throw new Error('ChromeDriver crashed during startup.');
    }
  }

  async getStatus() {
    return await this.jwproxy.command('/status', 'GET');
  }

  async startSession() {
    const sessionCaps = this.desiredProtocol === _appiumBaseDriver.PROTOCOLS.W3C ? {
      capabilities: {
        alwaysMatch: this.capabilities
      }
    } : {
      desiredCapabilities: this.capabilities
    };
    log.info(`Starting ${this.desiredProtocol} Chromedriver session with capabilities: ` + JSON.stringify(sessionCaps, null, 2));
    await (0, _asyncbox.retryInterval)(4, 200, async () => {
      try {
        await this.jwproxy.command('/session', 'POST', sessionCaps);
      } catch (err) {
        log.warn(`Failed to start Chromedriver session: ${err.message}`);
        throw err;
      }
    });
    this.changeState(Chromedriver.STATE_ONLINE);
  }

  async stop(emitStates = true) {
    if (emitStates) {
      this.changeState(Chromedriver.STATE_STOPPING);
    }

    try {
      await this.jwproxy.command('', 'DELETE');
      await this.proc.stop('SIGTERM', 20000);

      if (emitStates) {
        this.changeState(Chromedriver.STATE_STOPPED);
      }
    } catch (e) {
      log.error(e);
    }
  }

  changeState(state) {
    this.state = state;
    log.debug(`Changed state to '${state}'`);
    this.emit(Chromedriver.EVENT_CHANGED, {
      state
    });
  }

  async sendCommand(url, method, body) {
    return await this.jwproxy.command(url, method, body);
  }

  async proxyReq(req, res) {
    return await this.jwproxy.proxyReqRes(req, res);
  }

  async killAll() {
    let cmd = _appiumSupport.system.isWindows() ? `wmic process where "commandline like '%chromedriver.exe%--port=${this.proxyPort}%'" delete` : `pkill -15 -f "${this.chromedriver}.*--port=${this.proxyPort}"`;
    log.debug(`Killing any old chromedrivers, running: ${cmd}`);

    try {
      await _bluebird.default.promisify(_child_process.default.exec)(cmd);
      log.debug('Successfully cleaned up old chromedrivers');
    } catch (err) {
      log.warn('No old chromedrivers seem to exist');
    }

    if (this.adb) {
      log.debug(`Cleaning any old adb forwarded port socket connections`);

      try {
        for (let conn of await this.adb.getForwardList()) {
          if (conn.indexOf('webview_devtools') !== -1) {
            let params = conn.split(/\s+/);

            if (params.length > 1) {
              await this.adb.removePortForward(params[1].replace(/[\D]*/, ''));
            }
          }
        }
      } catch (err) {
        log.warn(`Unable to clean forwarded ports. Error: '${err.message}'. Continuing.`);
      }
    }
  }

  async hasWorkingWebview() {
    try {
      await this.jwproxy.command('/url', 'GET');
      return true;
    } catch (e) {
      return false;
    }
  }

}

exports.Chromedriver = Chromedriver;
Chromedriver.EVENT_ERROR = 'chromedriver_error';
Chromedriver.EVENT_CHANGED = 'stateChanged';
Chromedriver.STATE_STOPPED = 'stopped';
Chromedriver.STATE_STARTING = 'starting';
Chromedriver.STATE_ONLINE = 'online';
Chromedriver.STATE_STOPPING = 'stopping';
Chromedriver.STATE_RESTARTING = 'restarting';
var _default = Chromedriver;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jaHJvbWVkcml2ZXIuanMiXSwibmFtZXMiOlsibG9nIiwibG9nZ2VyIiwiZ2V0TG9nZ2VyIiwiTkVXX0NEX1ZFUlNJT05fRk9STUFUX01BSk9SX1ZFUlNJT04iLCJERUZBVUxUX0hPU1QiLCJNSU5fQ0RfVkVSU0lPTl9XSVRIX1czQ19TVVBQT1JUIiwiREVGQVVMVF9QT1JUIiwiQ0hST01FRFJJVkVSX0NIUk9NRV9NQVBQSU5HIiwiQ0hST01FX0JVTkRMRV9JRCIsIldFQlZJRVdfQlVORExFX0lEUyIsIkNIUk9NRURSSVZFUl9UVVRPUklBTCIsIkNEX1ZFUiIsInByb2Nlc3MiLCJlbnYiLCJucG1fY29uZmlnX2Nocm9tZWRyaXZlcl92ZXJzaW9uIiwiQ0hST01FRFJJVkVSX1ZFUlNJT04iLCJnZXRNb3N0UmVjZW50Q2hyb21lZHJpdmVyIiwiQ0RfVkVSU0lPTl9USU1FT1VUIiwibWFwcGluZyIsIl8iLCJpc0VtcHR5IiwiRXJyb3IiLCJsYXN0Iiwia2V5cyIsInNvcnQiLCJjb21wYXJlVmVyc2lvbnMiLCJDaHJvbWVkcml2ZXIiLCJldmVudHMiLCJFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJob3N0IiwicG9ydCIsInVzZVN5c3RlbUV4ZWN1dGFibGUiLCJleGVjdXRhYmxlIiwiZXhlY3V0YWJsZURpciIsImJ1bmRsZUlkIiwibWFwcGluZ1BhdGgiLCJjbWRBcmdzIiwiYWRiIiwidmVyYm9zZSIsImxvZ1BhdGgiLCJkaXNhYmxlQnVpbGRDaGVjayIsImlzQXV0b2Rvd25sb2FkRW5hYmxlZCIsInByb3h5SG9zdCIsInByb3h5UG9ydCIsInByb2MiLCJjaHJvbWVkcml2ZXIiLCJleGVjdXRhYmxlVmVyaWZpZWQiLCJzdGF0ZSIsIlNUQVRFX1NUT1BQRUQiLCJqd3Byb3h5IiwiSldQcm94eSIsInNlcnZlciIsInN0b3JhZ2VDbGllbnQiLCJDaHJvbWVkcml2ZXJTdG9yYWdlQ2xpZW50IiwiY2hyb21lZHJpdmVyRGlyIiwiY2FwYWJpbGl0aWVzIiwiZGVzaXJlZFByb3RvY29sIiwiUFJPVE9DT0xTIiwiTUpTT05XUCIsImdldE1hcHBpbmciLCJkZWJ1ZyIsImZzIiwiZXhpc3RzIiwid2FybiIsIkpTT04iLCJwYXJzZSIsInJlYWRGaWxlIiwiZXJyIiwiZXJyb3IiLCJtZXNzYWdlIiwiY2RWZXJzaW9uIiwiY2hyb21lVmVyc2lvbiIsInRvUGFpcnMiLCJzZW12ZXIiLCJjb2VyY2UiLCJnZXRDaHJvbWVkcml2ZXJzIiwiZXhlY3V0YWJsZXMiLCJnbG9iIiwibGVuZ3RoIiwiY2RzIiwibWFwQ2hyb21lZHJpdmVyIiwibG9nRXJyb3IiLCJzdGRvdXQiLCJzdGRlcnIiLCJlcnJNc2ciLCJwYXRoIiwiYmFzZW5hbWUiLCJ0aW1lb3V0IiwiaW5jbHVkZXMiLCJtYXRjaCIsImV4ZWMiLCJ2ZXJzaW9uIiwiY29lcmNlZFZlcnNpb24iLCJtYWpvciIsIm1pbm9yIiwibWluQ2hyb21lVmVyc2lvbiIsImZpbHRlciIsImNkIiwiYSIsImIiLCJpbmZvIiwiZ2V0Q2hyb21lVmVyc2lvbiIsImdldEFwaUxldmVsIiwiZ2V0Q29tcGF0aWJsZUNocm9tZWRyaXZlciIsImRpZFN0b3JhZ2VTeW5jIiwic3luY0Nocm9tZWRyaXZlcnMiLCJyZXRyaWV2ZWRNYXBwaW5nIiwicmV0cmlldmVNYXBwaW5nIiwic3RyaW5naWZ5IiwiZHJpdmVyS2V5cyIsInN5bmNEcml2ZXJzIiwibWluQnJvd3NlclZlcnNpb24iLCJzeW5jaHJvbml6ZWREcml2ZXJzTWFwcGluZyIsInJlZHVjZSIsImFjYyIsIngiLCJPYmplY3QiLCJhc3NpZ24iLCJzaG91bGRVcGRhdGVHbG9iYWxNYXBwaW5nIiwid3JpdGVGaWxlIiwiZSIsImVycm9yQW5kVGhyb3ciLCJhdXRvZG93bmxvYWRNc2ciLCJndCIsInZhbHVlcyIsInN0YWNrIiwid29ya2luZ0NkcyIsInZlcnNpb25PYmoiLCJiaW5QYXRoIiwiaW5pdENocm9tZWRyaXZlclBhdGgiLCJzeW5jUHJvdG9jb2wiLCJXM0MiLCJjaHJvbWVPcHRpb25zIiwidzNjIiwic3RhcnQiLCJjYXBzIiwiZW1pdFN0YXJ0aW5nU3RhdGUiLCJjbG9uZURlZXAiLCJsb2dnaW5nUHJlZnMiLCJicm93c2VyIiwiY2hhbmdlU3RhdGUiLCJTVEFURV9TVEFSVElORyIsImFkYlBvcnQiLCJwdXNoIiwiaXNBcnJheSIsInN0YXJ0RGV0ZWN0b3IiLCJpbmRleE9mIiwicHJvY2Vzc0lzQWxpdmUiLCJ3ZWJ2aWV3VmVyc2lvbiIsImtpbGxBbGwiLCJTdWJQcm9jZXNzIiwib24iLCJvdXQiLCJsaW5lIiwidHJpbSIsInNwbGl0IiwiY29kZSIsInNpZ25hbCIsIlNUQVRFX1NUT1BQSU5HIiwiU1RBVEVfUkVTVEFSVElORyIsIm1zZyIsImpvaW4iLCJ3YWl0Rm9yT25saW5lIiwic3RhcnRTZXNzaW9uIiwiZW1pdCIsIkVWRU5UX0VSUk9SIiwic3RvcCIsInNlc3Npb25JZCIsIlNUQVRFX09OTElORSIsInJlc3RhcnQiLCJjaHJvbWVkcml2ZXJTdG9wcGVkIiwiZ2V0U3RhdHVzIiwiY29tbWFuZCIsInNlc3Npb25DYXBzIiwiYWx3YXlzTWF0Y2giLCJkZXNpcmVkQ2FwYWJpbGl0aWVzIiwiZW1pdFN0YXRlcyIsIkVWRU5UX0NIQU5HRUQiLCJzZW5kQ29tbWFuZCIsInVybCIsIm1ldGhvZCIsImJvZHkiLCJwcm94eVJlcSIsInJlcSIsInJlcyIsInByb3h5UmVxUmVzIiwiY21kIiwic3lzdGVtIiwiaXNXaW5kb3dzIiwiQiIsInByb21pc2lmeSIsImNwIiwiY29ubiIsImdldEZvcndhcmRMaXN0IiwicGFyYW1zIiwicmVtb3ZlUG9ydEZvcndhcmQiLCJyZXBsYWNlIiwiaGFzV29ya2luZ1dlYnZpZXciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBLE1BQU1BLEdBQUcsR0FBR0Msc0JBQU9DLFNBQVAsQ0FBaUIsY0FB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NENBQTJDSSxHQUFHLENBQUNFLE9BQVEsZ0JBQWpFO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFFBQU1nSSxpQkFBTixHQUEyQjtBQUd6QixRQUFJO0FBQ0YsWUFBTSxLQUFLcEosT0FBTCxDQUFhMkgsT0FBYixDQUFxQixNQUFyQixFQUE2QixLQUE3QixDQUFOO0FBQ0EsYUFBTyxJQUFQO0FBQ0QsS0FIRCxDQUdFLE9BQU9wRCxDQUFQLEVBQVU7QUFDVixhQUFPLEtBQVA7QUFDRDtBQUNGOztBQTdqQjRDOzs7QUFna0IvQ2hHLFlBQVksQ0FBQzZJLFdBQWIsR0FBMkIsb0JBQTNCO0FBQ0E3SSxZQUFZLENBQUN5SixhQUFiLEdBQTZCLGNBQTdCO0FBQ0F6SixZQUFZLENBQUN3QixhQUFiLEdBQTZCLFNBQTdCO0FBQ0F4QixZQUFZLENBQUNxSCxjQUFiLEdBQThCLFVBQTlCO0FBQ0FySCxZQUFZLENBQUNnSixZQUFiLEdBQTRCLFFBQTVCO0FBQ0FoSixZQUFZLENBQUNzSSxjQUFiLEdBQThCLFVBQTlCO0FBQ0F0SSxZQUFZLENBQUN1SSxnQkFBYixHQUFnQyxZQUFoQztlQUtldkksWSIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptYWluXG5cbmltcG9ydCBldmVudHMgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IEpXUHJveHksIFBST1RPQ09MUyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgY3AgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBzeXN0ZW0sIGZzLCBsb2dnZXIgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgeyByZXRyeUludGVydmFsLCBhc3luY21hcCB9IGZyb20gJ2FzeW5jYm94JztcbmltcG9ydCB7IFN1YlByb2Nlc3MsIGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHtcbiAgZ2V0Q2hyb21lVmVyc2lvbiwgZ2V0Q2hyb21lZHJpdmVyRGlyLCBnZXRDaHJvbWVkcml2ZXJCaW5hcnlQYXRoXG59IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNvbXBhcmVWZXJzaW9ucyBmcm9tICdjb21wYXJlLXZlcnNpb25zJztcbmltcG9ydCBDaHJvbWVkcml2ZXJTdG9yYWdlQ2xpZW50IGZyb20gJy4vc3RvcmFnZS1jbGllbnQnO1xuaW1wb3J0IHsgdG9XM2NDYXBOYW1lcywgZ2V0Q2FwVmFsdWUgfSBmcm9tICcuL3Byb3RvY29sLWhlbHBlcnMnO1xuXG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5nZXRMb2dnZXIoJ0Nocm9tZWRyaXZlcicpO1xuXG5jb25zdCBORVdfQ0RfVkVSU0lPTl9GT1JNQVRfTUFKT1JfVkVSU0lPTiA9IDczO1xuY29uc3QgREVGQVVMVF9IT1NUID0gJzEyNy4wLjAuMSc7XG5jb25zdCBNSU5fQ0RfVkVSU0lPTl9XSVRIX1czQ19TVVBQT1JUID0gNzU7XG5jb25zdCBERUZBVUxUX1BPUlQgPSA5NTE1O1xuY29uc3QgQ0hST01FRFJJVkVSX0NIUk9NRV9NQVBQSU5HID0ge1xuICAvLyBDaHJvbWVkcml2ZXIgdmVyc2lvbjogbWluaW11bSBDaHJvbWUgdmVyc2lvblxuICAnNzguMC4zOTA0LjcwJzogJzc4LjAuMzkwNC43MCcsXG4gICc3Ny4wLjM4NjUuNDAnOiAnNzcuMC4zODY1LjQwJyxcbiAgJzc2LjAuMzgwOS4xMjYnOiAnNzYuMC4zODA5LjEyNicsXG4gICc3Ni4wLjM4MDkuNjgnOiAnNzYuMC4zODA5LjY4JyxcbiAgJzc2LjAuMzgwOS4yNSc6ICc3Ni4wLjM4MDkuMjUnLFxuICAnNzYuMC4zODA5LjEyJzogJzc2LjAuMzgwOS4xMicsXG4gICc3NS4wLjM3NzAuMTQwJzogJzc1LjAuMzc3MC4xNDAnLFxuICAnNzUuMC4zNzcwLjkwJzogJzc1LjAuMzc3MC45MCcsXG4gICc3NS4wLjM3NzAuOCc6ICc3NS4wLjM3NzAuOCcsXG4gICc3NC4wLjM3MjkuNic6ICc3NC4wLjM3MjknLFxuICAnNzMuMC4zNjgzLjY4JzogJzcwLjAuMzUzOCcsXG4gICcyLjQ2JzogJzcxLjAuMzU3OCcsXG4gICcyLjQ1JzogJzcwLjAuMCcsXG4gICcyLjQ0JzogJzY5LjAuMzQ5NycsXG4gICcyLjQzJzogJzY5LjAuMzQ5NycsXG4gICcyLjQyJzogJzY4LjAuMzQ0MCcsXG4gICcyLjQxJzogJzY3LjAuMzM5NicsXG4gICcyLjQwJzogJzY2LjAuMzM1OScsXG4gICcyLjM5JzogJzY2LjAuMzM1OScsXG4gICcyLjM4JzogJzY1LjAuMzMyNScsXG4gICcyLjM3JzogJzY0LjAuMzI4MicsXG4gICcyLjM2JzogJzYzLjAuMzIzOScsXG4gICcyLjM1JzogJzYyLjAuMzIwMicsXG4gICcyLjM0JzogJzYxLjAuMzE2MycsXG4gICcyLjMzJzogJzYwLjAuMzExMicsXG4gICcyLjMyJzogJzU5LjAuMzA3MScsXG4gICcyLjMxJzogJzU4LjAuMzAyOScsXG4gICcyLjMwJzogJzU4LjAuMzAyOScsXG4gICcyLjI5JzogJzU3LjAuMjk4NycsXG4gICcyLjI4JzogJzU1LjAuMjg4MycsXG4gICcyLjI3JzogJzU0LjAuMjg0MCcsXG4gICcyLjI2JzogJzUzLjAuMjc4NScsXG4gICcyLjI1JzogJzUzLjAuMjc4NScsXG4gICcyLjI0JzogJzUyLjAuMjc0MycsXG4gICcyLjIzJzogJzUxLjAuMjcwNCcsXG4gICcyLjIyJzogJzQ5LjAuMjYyMycsXG4gICcyLjIxJzogJzQ2LjAuMjQ5MCcsXG4gICcyLjIwJzogJzQzLjAuMjM1NycsXG4gICcyLjE5JzogJzQzLjAuMjM1NycsXG4gICcyLjE4JzogJzQzLjAuMjM1NycsXG4gICcyLjE3JzogJzQyLjAuMjMxMScsXG4gICcyLjE2JzogJzQyLjAuMjMxMScsXG4gICcyLjE1JzogJzQwLjAuMjIxNCcsXG4gICcyLjE0JzogJzM5LjAuMjE3MScsXG4gICcyLjEzJzogJzM4LjAuMjEyNScsXG4gICcyLjEyJzogJzM2LjAuMTk4NScsXG4gICcyLjExJzogJzM2LjAuMTk4NScsXG4gICcyLjEwJzogJzMzLjAuMTc1MScsXG4gICcyLjknOiAnMzEuMC4xNjUwJyxcbiAgJzIuOCc6ICczMC4wLjE1NzMnLFxuICAnMi43JzogJzMwLjAuMTU3MycsXG4gICcyLjYnOiAnMjkuMC4xNTQ1JyxcbiAgJzIuNSc6ICcyOS4wLjE1NDUnLFxuICAnMi40JzogJzI5LjAuMTU0NScsXG4gICcyLjMnOiAnMjguMC4xNTAwJyxcbiAgJzIuMic6ICcyNy4wLjE0NTMnLFxuICAnMi4xJzogJzI3LjAuMTQ1MycsXG4gICcyLjAnOiAnMjcuMC4xNDUzJyxcbn07XG5jb25zdCBDSFJPTUVfQlVORExFX0lEID0gJ2NvbS5hbmRyb2lkLmNocm9tZSc7XG5jb25zdCBXRUJWSUVXX0JVTkRMRV9JRFMgPSBbXG4gICdjb20uZ29vZ2xlLmFuZHJvaWQud2VidmlldycsXG4gICdjb20uYW5kcm9pZC53ZWJ2aWV3Jyxcbl07XG5jb25zdCBDSFJPTUVEUklWRVJfVFVUT1JJQUwgPSAnaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vYmxvYi9tYXN0ZXIvZG9jcy9lbi93cml0aW5nLXJ1bm5pbmctYXBwaXVtL3dlYi9jaHJvbWVkcml2ZXIubWQnO1xuXG5jb25zdCBDRF9WRVIgPSBwcm9jZXNzLmVudi5ucG1fY29uZmlnX2Nocm9tZWRyaXZlcl92ZXJzaW9uIHx8XG4gICAgICAgICAgICAgICBwcm9jZXNzLmVudi5DSFJPTUVEUklWRVJfVkVSU0lPTiB8fFxuICAgICAgICAgICAgICAgZ2V0TW9zdFJlY2VudENocm9tZWRyaXZlcigpO1xuXG5jb25zdCBDRF9WRVJTSU9OX1RJTUVPVVQgPSA1MDAwO1xuXG5mdW5jdGlvbiBnZXRNb3N0UmVjZW50Q2hyb21lZHJpdmVyIChtYXBwaW5nID0gQ0hST01FRFJJVkVSX0NIUk9NRV9NQVBQSU5HKSB7XG4gIGlmIChfLmlzRW1wdHkobWFwcGluZykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBnZXQgbW9zdCByZWNlbnQgQ2hyb21lZHJpdmVyIGZyb20gZW1wdHkgbWFwcGluZycpO1xuICB9XG4gIHJldHVybiBfLmxhc3QoXy5rZXlzKG1hcHBpbmcpLnNvcnQoY29tcGFyZVZlcnNpb25zKSk7XG59XG5cbmNsYXNzIENocm9tZWRyaXZlciBleHRlbmRzIGV2ZW50cy5FdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvciAoYXJncyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGNvbnN0IHtcbiAgICAgIGhvc3QgPSBERUZBVUxUX0hPU1QsXG4gICAgICBwb3J0ID0gREVGQVVMVF9QT1JULFxuICAgICAgdXNlU3lzdGVtRXhlY3V0YWJsZSA9IGZhbHNlLFxuICAgICAgZXhlY3V0YWJsZSxcbiAgICAgIGV4ZWN1dGFibGVEaXIgPSBnZXRDaHJvbWVkcml2ZXJEaXIoKSxcbiAgICAgIGJ1bmRsZUlkLFxuICAgICAgbWFwcGluZ1BhdGgsXG4gICAgICBjbWRBcmdzLFxuICAgICAgYWRiLFxuICAgICAgdmVyYm9zZSxcbiAgICAgIGxvZ1BhdGgsXG4gICAgICBkaXNhYmxlQnVpbGRDaGVjayxcbiAgICAgIGlzQXV0b2Rvd25sb2FkRW5hYmxlZCA9IGZhbHNlLFxuICAgIH0gPSBhcmdzO1xuXG4gICAgdGhpcy5wcm94eUhvc3QgPSBob3N0O1xuICAgIHRoaXMucHJveHlQb3J0ID0gcG9ydDtcbiAgICB0aGlzLmFkYiA9IGFkYjtcbiAgICB0aGlzLmNtZEFyZ3MgPSBjbWRBcmdzO1xuICAgIHRoaXMucHJvYyA9IG51bGw7XG4gICAgdGhpcy51c2VTeXN0ZW1FeGVjdXRhYmxlID0gdXNlU3lzdGVtRXhlY3V0YWJsZTtcbiAgICB0aGlzLmNocm9tZWRyaXZlciA9IGV4ZWN1dGFibGU7XG4gICAgdGhpcy5leGVjdXRhYmxlRGlyID0gZXhlY3V0YWJsZURpcjtcbiAgICB0aGlzLm1hcHBpbmdQYXRoID0gbWFwcGluZ1BhdGg7XG4gICAgdGhpcy5idW5kbGVJZCA9IGJ1bmRsZUlkO1xuICAgIHRoaXMuZXhlY3V0YWJsZVZlcmlmaWVkID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0ZSA9IENocm9tZWRyaXZlci5TVEFURV9TVE9QUEVEO1xuICAgIHRoaXMuandwcm94eSA9IG5ldyBKV1Byb3h5KHtzZXJ2ZXI6IHRoaXMucHJveHlIb3N0LCBwb3J0OiB0aGlzLnByb3h5UG9ydH0pO1xuICAgIHRoaXMudmVyYm9zZSA9IHZlcmJvc2U7XG4gICAgdGhpcy5sb2dQYXRoID0gbG9nUGF0aDtcbiAgICB0aGlzLmRpc2FibGVCdWlsZENoZWNrID0gISFkaXNhYmxlQnVpbGRDaGVjaztcbiAgICB0aGlzLnN0b3JhZ2VDbGllbnQgPSBpc0F1dG9kb3dubG9hZEVuYWJsZWRcbiAgICAgID8gbmV3IENocm9tZWRyaXZlclN0b3JhZ2VDbGllbnQoeyBjaHJvbWVkcml2ZXJEaXI6IHRoaXMuZXhlY3V0YWJsZURpciB9KVxuICAgICAgOiBudWxsO1xuICAgIHRoaXMuY2FwYWJpbGl0aWVzID0ge307XG4gICAgdGhpcy5kZXNpcmVkUHJvdG9jb2wgPSBQUk9UT0NPTFMuTUpTT05XUDtcbiAgfVxuXG4gIGFzeW5jIGdldE1hcHBpbmcgKCkge1xuICAgIGxldCBtYXBwaW5nID0gQ0hST01FRFJJVkVSX0NIUk9NRV9NQVBQSU5HO1xuICAgIGlmICh0aGlzLm1hcHBpbmdQYXRoKSB7XG4gICAgICBsb2cuZGVidWcoYEF0dGVtcHRpbmcgdG8gdXNlIENocm9tZWRyaXZlci1DaHJvbWUgbWFwcGluZyBmcm9tICcke3RoaXMubWFwcGluZ1BhdGh9J2ApO1xuICAgICAgaWYgKCFhd2FpdCBmcy5leGlzdHModGhpcy5tYXBwaW5nUGF0aCkpIHtcbiAgICAgICAgbG9nLndhcm4oYE5vIGZpbGUgZm91bmQgYXQgJyR7dGhpcy5tYXBwaW5nUGF0aH0nLiBVc2luZyBkZWZhdWx0IG1hcHBpbmdgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWFwcGluZyA9IEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUodGhpcy5tYXBwaW5nUGF0aCkpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBsb2cuZXJyb3IoYEVycm9yIHBhcnNpbmcgbWFwcGluZyBmcm9tICcke3RoaXMubWFwcGluZ1BhdGh9JzogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICBsb2cud2FybignVXNpbmcgZGVmYXVsdCBtYXBwaW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgdmFsdWVzIGZvciBtaW5pbXVtIGNocm9tZSB2ZXJzaW9uIGFyZSBzZW12ZXIgY29tcGxpYW50XG4gICAgZm9yIChjb25zdCBbY2RWZXJzaW9uLCBjaHJvbWVWZXJzaW9uXSBvZiBfLnRvUGFpcnMobWFwcGluZykpIHtcbiAgICAgIG1hcHBpbmdbY2RWZXJzaW9uXSA9IHNlbXZlci5jb2VyY2UoY2hyb21lVmVyc2lvbik7XG4gICAgfVxuICAgIHJldHVybiBtYXBwaW5nO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q2hyb21lZHJpdmVycyAobWFwcGluZykge1xuICAgIC8vIGdvIHRocm91Z2ggdGhlIHZlcnNpb25zIGF2YWlsYWJsZVxuICAgIGNvbnN0IGV4ZWN1dGFibGVzID0gYXdhaXQgZnMuZ2xvYihgJHt0aGlzLmV4ZWN1dGFibGVEaXJ9LypgKTtcbiAgICBsb2cuZGVidWcoYEZvdW5kICR7ZXhlY3V0YWJsZXMubGVuZ3RofSBleGVjdXRhYmxlJHtleGVjdXRhYmxlcy5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30gYCArXG4gICAgICBgaW4gJyR7dGhpcy5leGVjdXRhYmxlRGlyfSdgKTtcbiAgICBjb25zdCBjZHMgPSAoYXdhaXQgYXN5bmNtYXAoZXhlY3V0YWJsZXMsIGFzeW5jIGZ1bmN0aW9uIG1hcENocm9tZWRyaXZlciAoZXhlY3V0YWJsZSkge1xuICAgICAgY29uc3QgbG9nRXJyb3IgPSAoe21lc3NhZ2UsIHN0ZG91dCA9IG51bGwsIHN0ZGVyciA9IG51bGx9KSA9PiB7XG4gICAgICAgIGxldCBlcnJNc2cgPSBgQ2Fubm90IHJldHJpZXZlIHZlcnNpb24gbnVtYmVyIGZyb20gJyR7cGF0aC5iYXNlbmFtZShleGVjdXRhYmxlKX0nIENocm9tZWRyaXZlciBiaW5hcnkuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgaXQgcmV0dXJucyBhIHZhbGlkIHZlcnNpb24gc3RyaW5nIGluIHJlc3BvbnNlIHRvICctLXZlcnNpb24nIGNvbW1hbmQgbGluZSBhcmd1bWVudC4gJHttZXNzYWdlfWA7XG4gICAgICAgIGlmIChzdGRvdXQpIHtcbiAgICAgICAgICBlcnJNc2cgKz0gYFxcblN0ZG91dDogJHtzdGRvdXR9YDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RkZXJyKSB7XG4gICAgICAgICAgZXJyTXNnICs9IGBcXG5TdGRlcnI6ICR7c3RkZXJyfWA7XG4gICAgICAgIH1cbiAgICAgICAgbG9nLndhcm4oZXJyTXNnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9O1xuXG4gICAgICBsZXQgc3Rkb3V0O1xuICAgICAgbGV0IHN0ZGVycjtcbiAgICAgIHRyeSB7XG4gICAgICAgICh7c3Rkb3V0LCBzdGRlcnJ9ID0gYXdhaXQgZXhlYyhleGVjdXRhYmxlLCBbJy0tdmVyc2lvbiddLCB7XG4gICAgICAgICAgdGltZW91dDogQ0RfVkVSU0lPTl9USU1FT1VULFxuICAgICAgICB9KSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKCEoZXJyLm1lc3NhZ2UgfHwgJycpLmluY2x1ZGVzKCd0aW1lZCBvdXQnKSAmJiAhKGVyci5zdGRvdXQgfHwgJycpLmluY2x1ZGVzKCdTdGFydGluZyBDaHJvbWVEcml2ZXInKSkge1xuICAgICAgICAgIHJldHVybiBsb2dFcnJvcihlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhpcyBoYXMgdGltZWQgb3V0LCBpdCBoYXMgYWN0dWFsbHkgc3RhcnRlZCBDaHJvbWVkcml2ZXIsXG4gICAgICAgIC8vIGluIHdoaWNoIGNhc2UgdGhlcmUgd2lsbCBhbHNvIGJlIHRoZSB2ZXJzaW9uIHN0cmluZyBpbiB0aGUgb3V0cHV0XG4gICAgICAgIHN0ZG91dCA9IGVyci5zdGRvdXQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hdGNoID0gL0Nocm9tZURyaXZlclxccytcXCg/dj8oW1xcZC5dKylcXCk/L2kuZXhlYyhzdGRvdXQpOyAvLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yL3pwajV3QS8xXG4gICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgIHJldHVybiBsb2dFcnJvcih7bWVzc2FnZTogJ0Nhbm5vdCBwYXJzZSB0aGUgdmVyc2lvbiBzdHJpbmcnLCBzdGRvdXQsIHN0ZGVycn0pO1xuICAgICAgfVxuICAgICAgbGV0IHZlcnNpb24gPSBtYXRjaFsxXTtcbiAgICAgIGNvbnN0IGNvZXJjZWRWZXJzaW9uID0gc2VtdmVyLmNvZXJjZSh2ZXJzaW9uKTtcbiAgICAgIGlmIChjb2VyY2VkVmVyc2lvbikge1xuICAgICAgICAvLyBiZWZvcmUgMjAxOS0wMy0wNiB2ZXJzaW9ucyB3ZXJlIG9mIHRoZSBmb3JtIG1ham9yLm1pbm9yXG4gICAgICAgIGlmIChjb2VyY2VkVmVyc2lvbi5tYWpvciA8IE5FV19DRF9WRVJTSU9OX0ZPUk1BVF9NQUpPUl9WRVJTSU9OKSB7XG4gICAgICAgICAgdmVyc2lvbiA9IGAke2NvZXJjZWRWZXJzaW9uLm1ham9yfS4ke2NvZXJjZWRWZXJzaW9uLm1pbm9yfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4ZWN1dGFibGUsXG4gICAgICAgIHZlcnNpb24sXG4gICAgICAgIG1pbkNocm9tZVZlcnNpb246IG1hcHBpbmdbdmVyc2lvbl0sXG4gICAgICB9O1xuICAgIH0pKVxuICAgICAgLmZpbHRlcigoY2QpID0+ICEhY2QpXG4gICAgICAuc29ydCgoYSwgYikgPT4gY29tcGFyZVZlcnNpb25zKGIudmVyc2lvbiwgYS52ZXJzaW9uKSk7XG4gICAgaWYgKF8uaXNFbXB0eShjZHMpKSB7XG4gICAgICBsb2cuaW5mbyhgTm8gQ2hyb21lZHJpdmVycyB3ZXJlIGZvdW5kIGluICcke3RoaXMuZXhlY3V0YWJsZURpcn0nYCk7XG4gICAgICByZXR1cm4gY2RzO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYFRoZSBmb2xsb3dpbmcgQ2hyb21lZHJpdmVyIGV4ZWN1dGFibGVzIHdlcmUgZm91bmQ6YCk7XG4gICAgZm9yIChjb25zdCBjZCBvZiBjZHMpIHtcbiAgICAgIGxvZy5kZWJ1ZyhgICAgICcke2NkLmV4ZWN1dGFibGV9JyAodmVyc2lvbiAnJHtjZC52ZXJzaW9ufScsIG1pbmltdW0gQ2hyb21lIHZlcnNpb24gJyR7Y2QubWluQ2hyb21lVmVyc2lvbiA/IGNkLm1pbkNocm9tZVZlcnNpb24gOiAnVW5rbm93bid9JylgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNkcztcbiAgfVxuXG4gIGFzeW5jIGdldENocm9tZVZlcnNpb24gKCkge1xuICAgIGxldCBjaHJvbWVWZXJzaW9uO1xuXG4gICAgLy8gb24gQW5kcm9pZCA3KyB3ZWJ2aWV3cyBhcmUgYmFja2VkIGJ5IHRoZSBtYWluIENocm9tZSwgbm90IHRoZSBzeXN0ZW0gd2Vidmlld1xuICAgIGlmICh0aGlzLmFkYiAmJiBhd2FpdCB0aGlzLmFkYi5nZXRBcGlMZXZlbCgpID49IDI0KSB7XG4gICAgICB0aGlzLmJ1bmRsZUlkID0gQ0hST01FX0JVTkRMRV9JRDtcbiAgICB9XG5cbiAgICAvLyB0cnkgb3V0IHdlYnZpZXdzIHdoZW4gbm8gYnVuZGxlIGlkIGlzIHNlbnQgaW5cbiAgICBpZiAoIXRoaXMuYnVuZGxlSWQpIHtcbiAgICAgIC8vIGRlZmF1bHQgdG8gdGhlIGdlbmVyaWMgQ2hyb21lIGJ1bmRsZVxuICAgICAgdGhpcy5idW5kbGVJZCA9IENIUk9NRV9CVU5ETEVfSUQ7XG5cbiAgICAgIC8vIHdlIGhhdmUgYSB3ZWJ2aWV3IG9mIHNvbWUgc29ydCwgc28gdHJ5IHRvIGZpbmQgdGhlIGJ1bmRsZSB2ZXJzaW9uXG4gICAgICBmb3IgKGNvbnN0IGJ1bmRsZUlkIG9mIFdFQlZJRVdfQlVORExFX0lEUykge1xuICAgICAgICBjaHJvbWVWZXJzaW9uID0gYXdhaXQgZ2V0Q2hyb21lVmVyc2lvbih0aGlzLmFkYiwgYnVuZGxlSWQpO1xuICAgICAgICBpZiAoY2hyb21lVmVyc2lvbikge1xuICAgICAgICAgIHRoaXMuYnVuZGxlSWQgPSBidW5kbGVJZDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIHdlIGRvIG5vdCBoYXZlIGEgY2hyb21lIHZlcnNpb24sIGl0IG11c3Qgbm90IGJlIGEgd2Vidmlld1xuICAgIGlmICghY2hyb21lVmVyc2lvbikge1xuICAgICAgY2hyb21lVmVyc2lvbiA9IGF3YWl0IGdldENocm9tZVZlcnNpb24odGhpcy5hZGIsIHRoaXMuYnVuZGxlSWQpO1xuICAgIH1cblxuICAgIC8vIG1ha2Ugc3VyZSBpdCBpcyBzZW12ZXIsIHNvIGxhdGVyIGNoZWNrcyB3b24ndCBmYWlsXG4gICAgcmV0dXJuIGNocm9tZVZlcnNpb24gPyBzZW12ZXIuY29lcmNlKGNocm9tZVZlcnNpb24pIDogbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGdldENvbXBhdGlibGVDaHJvbWVkcml2ZXIgKCkge1xuICAgIGlmICghdGhpcy5hZGIpIHtcbiAgICAgIHJldHVybiBhd2FpdCBnZXRDaHJvbWVkcml2ZXJCaW5hcnlQYXRoKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwcGluZyA9IGF3YWl0IHRoaXMuZ2V0TWFwcGluZygpO1xuICAgIGxldCBkaWRTdG9yYWdlU3luYyA9IGZhbHNlO1xuICAgIGNvbnN0IHN5bmNDaHJvbWVkcml2ZXJzID0gYXN5bmMgKGNocm9tZVZlcnNpb24pID0+IHtcbiAgICAgIGRpZFN0b3JhZ2VTeW5jID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHJldHJpZXZlZE1hcHBpbmcgPSBhd2FpdCB0aGlzLnN0b3JhZ2VDbGllbnQucmV0cmlldmVNYXBwaW5nKCk7XG4gICAgICBsb2cuZGVidWcoJ0dvdCBjaHJvbWVkcml2ZXJzIG1hcHBpbmcgZnJvbSB0aGUgc3RvcmFnZTogJyArXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHJldHJpZXZlZE1hcHBpbmcsIG51bGwsIDIpKTtcbiAgICAgIGNvbnN0IGRyaXZlcktleXMgPSBhd2FpdCB0aGlzLnN0b3JhZ2VDbGllbnQuc3luY0RyaXZlcnMoe1xuICAgICAgICBtaW5Ccm93c2VyVmVyc2lvbjogY2hyb21lVmVyc2lvbi5tYWpvcixcbiAgICAgIH0pO1xuICAgICAgaWYgKF8uaXNFbXB0eShkcml2ZXJLZXlzKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCBzeW5jaHJvbml6ZWREcml2ZXJzTWFwcGluZyA9IGRyaXZlcktleXMucmVkdWNlKChhY2MsIHgpID0+IHtcbiAgICAgICAgY29uc3Qge3ZlcnNpb24sIG1pbkJyb3dzZXJWZXJzaW9ufSA9IHJldHJpZXZlZE1hcHBpbmdbeF07XG4gICAgICAgIGFjY1t2ZXJzaW9uXSA9IG1pbkJyb3dzZXJWZXJzaW9uO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSwge30pO1xuICAgICAgT2JqZWN0LmFzc2lnbihtYXBwaW5nLCBzeW5jaHJvbml6ZWREcml2ZXJzTWFwcGluZyk7XG4gICAgICBsZXQgc2hvdWxkVXBkYXRlR2xvYmFsTWFwcGluZyA9IHRydWU7XG4gICAgICBpZiAoYXdhaXQgZnMuZXhpc3RzKHRoaXMubWFwcGluZ1BhdGgpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHRoaXMubWFwcGluZ1BhdGgsIEpTT04uc3RyaW5naWZ5KG1hcHBpbmcsIG51bGwsIDIpLCAndXRmOCcpO1xuICAgICAgICAgIHNob3VsZFVwZGF0ZUdsb2JhbE1hcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGxvZy53YXJuKGBDYW5ub3Qgc3RvcmUgdGhlIHVwZGF0ZWQgY2hyb21lZHJpdmVycyBtYXBwaW5nIGludG8gJyR7dGhpcy5tYXBwaW5nUGF0aH0nLiBgICtcbiAgICAgICAgICAgIGBUaGlzIG1heSByZWR1Y2UgdGhlIHBlcmZvcm1hbmNlIG9mIGZ1cnRoZXIgZXhlY3V0aW9ucy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkVXBkYXRlR2xvYmFsTWFwcGluZykge1xuICAgICAgICBPYmplY3QuYXNzaWduKENIUk9NRURSSVZFUl9DSFJPTUVfTUFQUElORywgbWFwcGluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgZG8ge1xuICAgICAgY29uc3QgY2RzID0gYXdhaXQgdGhpcy5nZXRDaHJvbWVkcml2ZXJzKG1hcHBpbmcpO1xuXG4gICAgICBpZiAodGhpcy5kaXNhYmxlQnVpbGRDaGVjaykge1xuICAgICAgICBpZiAoXy5pc0VtcHR5KGNkcykpIHtcbiAgICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgVGhlcmUgbXVzdCBiZSBhdCBsZWFzdCBvbmUgQ2hyb21lZHJpdmVyIGV4ZWN1dGFibGUgYXZhaWxhYmxlIGZvciB1c2UgaWYgYCArXG4gICAgICAgICAgICBgJ2Nocm9tZWRyaXZlckRpc2FibGVCdWlsZENoZWNrJyBjYXBhYmlsaXR5IGlzIHNldCB0byAndHJ1ZSdgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7dmVyc2lvbiwgZXhlY3V0YWJsZX0gPSBjZHNbMF07XG4gICAgICAgIGxvZy53YXJuKGBDaHJvbWUgYnVpbGQgY2hlY2sgZGlzYWJsZWQuIFVzaW5nIG1vc3QgcmVjZW50IENocm9tZWRyaXZlciB2ZXJzaW9uICgke3ZlcnNpb259LCBhdCAnJHtleGVjdXRhYmxlfScpYCk7XG4gICAgICAgIGxvZy53YXJuKGBJZiB0aGlzIGlzIHdyb25nLCBzZXQgJ2Nocm9tZWRyaXZlckRpc2FibGVCdWlsZENoZWNrJyBjYXBhYmlsaXR5IHRvICdmYWxzZSdgKTtcbiAgICAgICAgcmV0dXJuIGV4ZWN1dGFibGU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNocm9tZVZlcnNpb24gPSBhd2FpdCB0aGlzLmdldENocm9tZVZlcnNpb24oKTtcbiAgICAgIGlmICghY2hyb21lVmVyc2lvbikge1xuICAgICAgICAvLyB1bmFibGUgdG8gZ2V0IHRoZSBjaHJvbWUgdmVyc2lvblxuICAgICAgICBpZiAoXy5pc0VtcHR5KGNkcykpIHtcbiAgICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgVGhlcmUgbXVzdCBiZSBhdCBsZWFzdCBvbmUgQ2hyb21lZHJpdmVyIGV4ZWN1dGFibGUgYXZhaWxhYmxlIGZvciB1c2UgaWYgYCArXG4gICAgICAgICAgICBgdGhlIGN1cnJlbnQgQ2hyb21lIHZlcnNpb24gY2Fubm90IGJlIGRldGVybWluZWRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7dmVyc2lvbiwgZXhlY3V0YWJsZX0gPSBjZHNbMF07XG4gICAgICAgIGxvZy53YXJuKGBVbmFibGUgdG8gZGlzY292ZXIgQ2hyb21lIHZlcnNpb24uIFVzaW5nIENocm9tZWRyaXZlciAke3ZlcnNpb259IGF0ICcke2V4ZWN1dGFibGV9J2ApO1xuICAgICAgICByZXR1cm4gZXhlY3V0YWJsZTtcbiAgICAgIH1cblxuICAgICAgbG9nLmRlYnVnKGBGb3VuZCBDaHJvbWUgYnVuZGxlICcke3RoaXMuYnVuZGxlSWR9JyB2ZXJzaW9uICcke2Nocm9tZVZlcnNpb259J2ApO1xuXG4gICAgICBjb25zdCBhdXRvZG93bmxvYWRNc2cgPSB0aGlzLnN0b3JhZ2VDbGllbnQgJiYgZGlkU3RvcmFnZVN5bmNcbiAgICAgICAgPyAnJ1xuICAgICAgICA6ICcuIFlvdSBjb3VsZCBhbHNvIHRyeSB0byBlbmFibGUgYXV0b21hdGVkIGNocm9tZWRyaXZlcnMgZG93bmxvYWQgc2VydmVyIGZlYXR1cmUnO1xuICAgICAgaWYgKF8uaXNFbXB0eShtYXBwaW5nKSB8fCBzZW12ZXIuZ3QoY2hyb21lVmVyc2lvbiwgXy52YWx1ZXMobWFwcGluZylbMF0pKSB7XG4gICAgICAgIGlmICh0aGlzLnN0b3JhZ2VDbGllbnQgJiYgIWRpZFN0b3JhZ2VTeW5jKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChhd2FpdCBzeW5jQ2hyb21lZHJpdmVycyhjaHJvbWVWZXJzaW9uKSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBsb2cud2FybihlLnN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhpcyBpcyBhIGNocm9tZSBhYm92ZSB0aGUgbGF0ZXN0IHZlcnNpb24gd2Uga25vdyBhYm91dCxcbiAgICAgICAgLy8gYW5kIHdlIGhhdmUgYSBjaHJvbWVkcml2ZXIgdGhhdCBpcyBiZXlvbmQgd2hhdCB3ZSBrbm93LFxuICAgICAgICAvLyBzbyB1c2VlIHRoZSBtb3N0IHJlY2VudCBjaHJvbWVkcml2ZXIgdGhhdCB3ZSBmb3VuZFxuICAgICAgICBpZiAoIV8uaXNFbXB0eShjZHMpICYmICFjZHNbMF0ubWluQ2hyb21lVmVyc2lvbikge1xuICAgICAgICAgIGNvbnN0IHt2ZXJzaW9uLCBleGVjdXRhYmxlfSA9IGNkc1swXTtcbiAgICAgICAgICBsb2cud2FybihgTm8ga25vd24gQ2hyb21lZHJpdmVyIGF2YWlsYWJsZSB0byBhdXRvbWF0ZSBDaHJvbWUgdmVyc2lvbiAnJHtjaHJvbWVWZXJzaW9ufSdgKTtcbiAgICAgICAgICBsb2cud2FybihgVXNpbmcgQ2hyb21lZHJpdmVyIHZlcnNpb24gJyR7dmVyc2lvbn0nLCB3aGljaCBoYXMgbm90IGJlZW4gdGVzdGVkIHdpdGggQXBwaXVtYCArXG4gICAgICAgICAgICBhdXRvZG93bmxvYWRNc2cpO1xuICAgICAgICAgIHJldHVybiBleGVjdXRhYmxlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdvcmtpbmdDZHMgPSBjZHMuZmlsdGVyKChjZCkgPT4ge1xuICAgICAgICBjb25zdCB2ZXJzaW9uT2JqID0gc2VtdmVyLmNvZXJjZShjZC5taW5DaHJvbWVWZXJzaW9uKTtcbiAgICAgICAgcmV0dXJuIHZlcnNpb25PYmogJiYgY2hyb21lVmVyc2lvbi5tYWpvciA9PT0gdmVyc2lvbk9iai5tYWpvcjtcbiAgICAgIH0pO1xuICAgICAgaWYgKF8uaXNFbXB0eSh3b3JraW5nQ2RzKSkge1xuICAgICAgICBpZiAodGhpcy5zdG9yYWdlQ2xpZW50ICYmICFkaWRTdG9yYWdlU3luYykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoYXdhaXQgc3luY0Nocm9tZWRyaXZlcnMoY2hyb21lVmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbG9nLndhcm4oZS5zdGFjayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxvZy5lcnJvckFuZFRocm93KGBObyBDaHJvbWVkcml2ZXIgZm91bmQgdGhhdCBjYW4gYXV0b21hdGUgQ2hyb21lICcke2Nocm9tZVZlcnNpb259Jy4gYCArXG4gICAgICAgICAgYFNlZSAke0NIUk9NRURSSVZFUl9UVVRPUklBTH0gZm9yIG1vcmUgZGV0YWlsc2AgKyBhdXRvZG93bmxvYWRNc2cpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBiaW5QYXRoID0gd29ya2luZ0Nkc1swXS5leGVjdXRhYmxlO1xuICAgICAgbG9nLmRlYnVnKGBGb3VuZCAke3dvcmtpbmdDZHMubGVuZ3RofSBDaHJvbWVkcml2ZXIgZXhlY3V0YWJsZSR7d29ya2luZ0Nkcy5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30gYCArXG4gICAgICAgIGBjYXBhYmxlIG9mIGF1dG9tYXRpbmcgQ2hyb21lICcke2Nocm9tZVZlcnNpb259Jy5cXG5DaG9vc2luZyB0aGUgbW9zdCByZWNlbnQsICcke2JpblBhdGh9Jy5gKTtcbiAgICAgIGxvZy5kZWJ1ZygnSWYgYSBzcGVjaWZpYyB2ZXJzaW9uIGlzIHJlcXVpcmVkLCBzcGVjaWZ5IGl0IHdpdGggdGhlIGBjaHJvbWVkcml2ZXJFeGVjdXRhYmxlYCcgK1xuICAgICAgICAnZGVzaXJlZCBjYXBhYmlsaXR5LicpO1xuICAgICAgcmV0dXJuIGJpblBhdGg7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICAgIH0gd2hpbGUgKHRydWUpO1xuICB9XG5cbiAgYXN5bmMgaW5pdENocm9tZWRyaXZlclBhdGggKCkge1xuICAgIGlmICh0aGlzLmV4ZWN1dGFibGVWZXJpZmllZCkgcmV0dXJuOyAvL2VzbGludC1kaXNhYmxlLWxpbmUgY3VybHlcblxuICAgIC8vIHRoZSBleGVjdXRhYmxlIG1pZ2h0IGJlIHNldCAoaWYgcGFzc2VkIGluKVxuICAgIC8vIG9yIHdlIG1pZ2h0IHdhbnQgdG8gdXNlIHRoZSBiYXNpYyBvbmUgaW5zdGFsbGVkIHdpdGggdGhpcyBkcml2ZXJcbiAgICAvLyBvciB3ZSB3YW50IHRvIGZpZ3VyZSBvdXQgdGhlIGJlc3Qgb25lXG4gICAgaWYgKCF0aGlzLmNocm9tZWRyaXZlcikge1xuICAgICAgdGhpcy5jaHJvbWVkcml2ZXIgPSB0aGlzLnVzZVN5c3RlbUV4ZWN1dGFibGVcbiAgICAgICAgPyBhd2FpdCBnZXRDaHJvbWVkcml2ZXJCaW5hcnlQYXRoKClcbiAgICAgICAgOiBhd2FpdCB0aGlzLmdldENvbXBhdGlibGVDaHJvbWVkcml2ZXIoKTtcbiAgICB9XG5cbiAgICBpZiAoIWF3YWl0IGZzLmV4aXN0cyh0aGlzLmNocm9tZWRyaXZlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVHJ5aW5nIHRvIHVzZSBhIGNocm9tZWRyaXZlciBiaW5hcnkgYXQgdGhlIHBhdGggYCArXG4gICAgICAgICAgICAgICAgICAgICAgYCR7dGhpcy5jaHJvbWVkcml2ZXJ9LCBidXQgaXQgZG9lc24ndCBleGlzdCFgKTtcbiAgICB9XG4gICAgdGhpcy5leGVjdXRhYmxlVmVyaWZpZWQgPSB0cnVlO1xuICAgIGxvZy5pbmZvKGBTZXQgY2hyb21lZHJpdmVyIGJpbmFyeSBhczogJHt0aGlzLmNocm9tZWRyaXZlcn1gKTtcbiAgfVxuXG4gIHN5bmNQcm90b2NvbCAoY2RWZXJzaW9uID0gbnVsbCkge1xuICAgIGNvbnN0IGNvZXJjZWRWZXJzaW9uID0gc2VtdmVyLmNvZXJjZShjZFZlcnNpb24pO1xuICAgIGlmICghY29lcmNlZFZlcnNpb24gfHwgY29lcmNlZFZlcnNpb24ubWFqb3IgPCBNSU5fQ0RfVkVSU0lPTl9XSVRIX1czQ19TVVBQT1JUKSB7XG4gICAgICBsb2cuZGVidWcoYENocm9tZWRyaXZlciB2LiAke2NkVmVyc2lvbn0gZG9lcyBub3QgZnVsbHkgc3VwcG9ydCAke1BST1RPQ09MUy5XM0N9IHByb3RvY29sLiBgICtcbiAgICAgICAgYERlZmF1bHRpbmcgdG8gJHtQUk9UT0NPTFMuTUpTT05XUH1gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2hyb21lT3B0aW9ucyA9IGdldENhcFZhbHVlKHRoaXMuY2FwYWJpbGl0aWVzLCAnY2hyb21lT3B0aW9ucycsIHt9KTtcbiAgICBpZiAoY2hyb21lT3B0aW9ucy53M2MgPT09IGZhbHNlKSB7XG4gICAgICBsb2cuaW5mbyhgQ2hyb21lZHJpdmVyIHYuICR7Y2RWZXJzaW9ufSBzdXBwb3J0cyAke1BST1RPQ09MUy5XM0N9IHByb3RvY29sLCBgICtcbiAgICAgICAgYGJ1dCAke1BST1RPQ09MUy5NSlNPTldQfSBvbmUgaGFzIGJlZW4gZXhwbGljaXRseSByZXF1ZXN0ZWRgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kZXNpcmVkUHJvdG9jb2wgPSBQUk9UT0NPTFMuVzNDO1xuICAgIC8vIGdpdmVuIGNhcHMgbWlnaHQgbm90IGJlIHByb3Blcmx5IHByZWZpeGVkXG4gICAgLy8gc28gd2UgdHJ5IHRvIGZpeCB0aGVtIGluIG9yZGVyIHRvIHByb3Blcmx5IGluaXRcbiAgICAvLyB0aGUgbmV3IFczQyBzZXNzaW9uXG4gICAgdGhpcy5jYXBhYmlsaXRpZXMgPSB0b1czY0NhcE5hbWVzKHRoaXMuY2FwYWJpbGl0aWVzKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0IChjYXBzLCBlbWl0U3RhcnRpbmdTdGF0ZSA9IHRydWUpIHtcbiAgICB0aGlzLmNhcGFiaWxpdGllcyA9IF8uY2xvbmVEZWVwKGNhcHMpO1xuXG4gICAgLy8gc2V0IHRoZSBsb2dnaW5nIHByZWZlcmVuY2VzIHRvIEFMTCB0aGUgY29uc29sZSBsb2dzXG4gICAgdGhpcy5jYXBhYmlsaXRpZXMubG9nZ2luZ1ByZWZzID0gXy5jbG9uZURlZXAoZ2V0Q2FwVmFsdWUoY2FwcywgJ2xvZ2dpbmdQcmVmcycsIHt9KSk7XG4gICAgaWYgKF8uaXNFbXB0eSh0aGlzLmNhcGFiaWxpdGllcy5sb2dnaW5nUHJlZnMuYnJvd3NlcikpIHtcbiAgICAgIHRoaXMuY2FwYWJpbGl0aWVzLmxvZ2dpbmdQcmVmcy5icm93c2VyID0gJ0FMTCc7XG4gICAgfVxuXG4gICAgaWYgKGVtaXRTdGFydGluZ1N0YXRlKSB7XG4gICAgICB0aGlzLmNoYW5nZVN0YXRlKENocm9tZWRyaXZlci5TVEFURV9TVEFSVElORyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXJncyA9IFsnLS11cmwtYmFzZT13ZC9odWInLCBgLS1wb3J0PSR7dGhpcy5wcm94eVBvcnR9YF07XG4gICAgaWYgKHRoaXMuYWRiICYmIHRoaXMuYWRiLmFkYlBvcnQpIHtcbiAgICAgIGFyZ3MucHVzaChgLS1hZGItcG9ydD0ke3RoaXMuYWRiLmFkYlBvcnR9YCk7XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkodGhpcy5jbWRBcmdzKSkge1xuICAgICAgYXJncy5wdXNoKC4uLnRoaXMuY21kQXJncyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmxvZ1BhdGgpIHtcbiAgICAgIGFyZ3MucHVzaChgLS1sb2ctcGF0aD0ke3RoaXMubG9nUGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZGlzYWJsZUJ1aWxkQ2hlY2spIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1kaXNhYmxlLWJ1aWxkLWNoZWNrJyk7XG4gICAgfVxuICAgIGFyZ3MucHVzaCgnLS12ZXJib3NlJyk7XG4gICAgLy8gd2hhdCBhcmUgdGhlIHByb2Nlc3Mgc3Rkb3V0L3N0ZGVyciBjb25kaXRpb25zIHdoZXJlaW4gd2Uga25vdyB0aGF0XG4gICAgLy8gdGhlIHByb2Nlc3MgaGFzIHN0YXJ0ZWQgdG8gb3VyIHNhdGlzZmFjdGlvbj9cbiAgICBjb25zdCBzdGFydERldGVjdG9yID0gKHN0ZG91dCkgPT4ge1xuICAgICAgcmV0dXJuIHN0ZG91dC5pbmRleE9mKCdTdGFydGluZyAnKSA9PT0gMDtcbiAgICB9O1xuXG4gICAgbGV0IHByb2Nlc3NJc0FsaXZlID0gZmFsc2U7XG4gICAgbGV0IHdlYnZpZXdWZXJzaW9uO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRDaHJvbWVkcml2ZXJQYXRoKCk7XG4gICAgICBhd2FpdCB0aGlzLmtpbGxBbGwoKTtcblxuICAgICAgLy8gc2V0IHVwIG91ciBzdWJwcm9jZXNzIG9iamVjdFxuICAgICAgdGhpcy5wcm9jID0gbmV3IFN1YlByb2Nlc3ModGhpcy5jaHJvbWVkcml2ZXIsIGFyZ3MpO1xuICAgICAgcHJvY2Vzc0lzQWxpdmUgPSB0cnVlO1xuXG4gICAgICAvLyBoYW5kbGUgbG9nIG91dHB1dFxuICAgICAgdGhpcy5wcm9jLm9uKCdvdXRwdXQnLCAoc3Rkb3V0LCBzdGRlcnIpID0+IHtcbiAgICAgICAgLy8gaWYgdGhlIGNkIG91dHB1dCBpcyBub3QgcHJpbnRlZCwgZmluZCB0aGUgY2hyb21lIHZlcnNpb24gYW5kIHByaW50XG4gICAgICAgIC8vIHdpbGwgZ2V0IGEgcmVzcG9uc2UgbGlrZVxuICAgICAgICAvLyAgIERldlRvb2xzIHJlc3BvbnNlOiB7XG4gICAgICAgIC8vICAgICAgXCJBbmRyb2lkLVBhY2thZ2VcIjogXCJpby5hcHBpdW0uc2FtcGxlYXBwXCIsXG4gICAgICAgIC8vICAgICAgXCJCcm93c2VyXCI6IFwiQ2hyb21lLzU1LjAuMjg4My45MVwiLFxuICAgICAgICAvLyAgICAgIFwiUHJvdG9jb2wtVmVyc2lvblwiOiBcIjEuMlwiLFxuICAgICAgICAvLyAgICAgIFwiVXNlci1BZ2VudFwiOiBcIi4uLlwiLFxuICAgICAgICAvLyAgICAgIFwiV2ViS2l0LVZlcnNpb25cIjogXCI1MzcuMzZcIlxuICAgICAgICAvLyAgIH1cbiAgICAgICAgY29uc3Qgb3V0ID0gc3Rkb3V0ICsgc3RkZXJyO1xuICAgICAgICBsZXQgbWF0Y2ggPSAvXCJCcm93c2VyXCI6IFwiKC4qKVwiLy5leGVjKG91dCk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHdlYnZpZXdWZXJzaW9uID0gbWF0Y2hbMV07XG4gICAgICAgICAgbG9nLmRlYnVnKGBXZWJ2aWV3IHZlcnNpb246ICcke3dlYnZpZXdWZXJzaW9ufSdgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFsc28gcHJpbnQgY2hyb21lZHJpdmVyIHZlcnNpb24gdG8gbG9nc1xuICAgICAgICAvLyB3aWxsIG91dHB1dCBzb21ldGhpbmcgbGlrZVxuICAgICAgICAvLyAgU3RhcnRpbmcgQ2hyb21lRHJpdmVyIDIuMzMuNTA2MTA2ICg4YTA2YzM5YzQ1ODJmYmZiYWI2OTY2ZGJiMWMzOGE5MTczYmZiMWEyKSBvbiBwb3J0IDk1MTVcbiAgICAgICAgbWF0Y2ggPSAvU3RhcnRpbmcgQ2hyb21lRHJpdmVyIChbLlxcZF0rKS8uZXhlYyhvdXQpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBsb2cuZGVidWcoYENocm9tZWRyaXZlciB2ZXJzaW9uOiAnJHttYXRjaFsxXX0nYCk7XG4gICAgICAgICAgdGhpcy5zeW5jUHJvdG9jb2wobWF0Y2hbMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2l2ZSB0aGUgb3V0cHV0IGlmIGl0IGlzIHJlcXVlc3RlZFxuICAgICAgICBpZiAodGhpcy52ZXJib3NlKSB7XG4gICAgICAgICAgZm9yIChsZXQgbGluZSBvZiAoc3Rkb3V0IHx8ICcnKS50cmltKCkuc3BsaXQoJ1xcbicpKSB7XG4gICAgICAgICAgICBpZiAoIWxpbmUudHJpbSgpLmxlbmd0aCkgY29udGludWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY3VybHlcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgW1NURE9VVF0gJHtsaW5lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGxldCBsaW5lIG9mIChzdGRlcnIgfHwgJycpLnRyaW0oKS5zcGxpdCgnXFxuJykpIHtcbiAgICAgICAgICAgIGlmICghbGluZS50cmltKCkubGVuZ3RoKSBjb250aW51ZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjdXJseVxuICAgICAgICAgICAgbG9nLmVycm9yKGBbU1RERVJSXSAke2xpbmV9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gaGFuZGxlIG91dC1vZi1ib3VuZCBleGl0IGJ5IHNpbXBseSBlbWl0dGluZyBhIHN0b3BwZWQgc3RhdGVcbiAgICAgIHRoaXMucHJvYy5vbignZXhpdCcsIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICAgICAgcHJvY2Vzc0lzQWxpdmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IENocm9tZWRyaXZlci5TVEFURV9TVE9QUEVEICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlICE9PSBDaHJvbWVkcml2ZXIuU1RBVEVfU1RPUFBJTkcgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgIT09IENocm9tZWRyaXZlci5TVEFURV9SRVNUQVJUSU5HKSB7XG4gICAgICAgICAgbGV0IG1zZyA9IGBDaHJvbWVkcml2ZXIgZXhpdGVkIHVuZXhwZWN0ZWRseSB3aXRoIGNvZGUgJHtjb2RlfSwgYCArXG4gICAgICAgICAgICAgICAgICAgIGBzaWduYWwgJHtzaWduYWx9YDtcbiAgICAgICAgICBsb2cuZXJyb3IobXNnKTtcbiAgICAgICAgICB0aGlzLmNoYW5nZVN0YXRlKENocm9tZWRyaXZlci5TVEFURV9TVE9QUEVEKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBsb2cuaW5mbyhgU3Bhd25pbmcgY2hyb21lZHJpdmVyIHdpdGg6ICR7dGhpcy5jaHJvbWVkcml2ZXJ9IGAgK1xuICAgICAgICAgICAgICAgYCR7YXJncy5qb2luKCcgJyl9YCk7XG4gICAgICAvLyBzdGFydCBzdWJwcm9jIGFuZCB3YWl0IGZvciBzdGFydERldGVjdG9yXG4gICAgICBhd2FpdCB0aGlzLnByb2Muc3RhcnQoc3RhcnREZXRlY3Rvcik7XG4gICAgICBhd2FpdCB0aGlzLndhaXRGb3JPbmxpbmUoKTtcbiAgICAgIGF3YWl0IHRoaXMuc3RhcnRTZXNzaW9uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5lbWl0KENocm9tZWRyaXZlci5FVkVOVF9FUlJPUiwgZSk7XG4gICAgICAvLyBqdXN0IGJlY2F1c2Ugd2UgaGFkIGFuIGVycm9yIGRvZXNuJ3QgbWVhbiB0aGUgY2hyb21lZHJpdmVyIHByb2Nlc3NcbiAgICAgIC8vIGZpbmlzaGVkOyB3ZSBzaG91bGQgY2xlYW4gdXAgaWYgbmVjZXNzYXJ5XG4gICAgICBpZiAocHJvY2Vzc0lzQWxpdmUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wcm9jLnN0b3AoKTtcbiAgICAgIH1cblxuICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICAgIC8vIG9mdGVuIHRoZSB1c2VyJ3MgQ2hyb21lIHZlcnNpb24gaXMgdG9vIGxvdyBmb3IgdGhlIHZlcnNpb24gb2YgQ2hyb21lZHJpdmVyXG4gICAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdDaHJvbWUgdmVyc2lvbiBtdXN0IGJlJykpIHtcbiAgICAgICAgbWVzc2FnZSArPSAnVW5hYmxlIHRvIGF1dG9tYXRlIENocm9tZSB2ZXJzaW9uIGJlY2F1c2UgaXQgaXMgdG9vIG9sZCBmb3IgdGhpcyB2ZXJzaW9uIG9mIENocm9tZWRyaXZlci5cXG4nO1xuICAgICAgICBpZiAod2Vidmlld1ZlcnNpb24pIHtcbiAgICAgICAgICBtZXNzYWdlICs9IGBDaHJvbWUgdmVyc2lvbiBvbiB0aGUgZGV2aWNlOiAke3dlYnZpZXdWZXJzaW9ufVxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZSArPSBgVmlzaXQgJyR7Q0hST01FRFJJVkVSX1RVVE9SSUFMfScgdG8gdHJvdWJsZXNob290IHRoZSBwcm9ibGVtLlxcbmA7XG4gICAgICB9XG5cbiAgICAgIG1lc3NhZ2UgKz0gZS5tZXNzYWdlO1xuICAgICAgbG9nLmVycm9yQW5kVGhyb3cobWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgc2Vzc2lvbklkICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gQ2hyb21lZHJpdmVyLlNUQVRFX09OTElORSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuandwcm94eS5zZXNzaW9uSWQ7XG4gIH1cblxuICBhc3luYyByZXN0YXJ0ICgpIHtcbiAgICBsb2cuaW5mbygnUmVzdGFydGluZyBjaHJvbWVkcml2ZXInKTtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gQ2hyb21lZHJpdmVyLlNUQVRFX09OTElORSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcmVzdGFydCB3aGVuIHdlJ3JlIG5vdCBvbmxpbmVcIik7XG4gICAgfVxuICAgIHRoaXMuY2hhbmdlU3RhdGUoQ2hyb21lZHJpdmVyLlNUQVRFX1JFU1RBUlRJTkcpO1xuICAgIGF3YWl0IHRoaXMuc3RvcChmYWxzZSk7XG4gICAgYXdhaXQgdGhpcy5zdGFydCh0aGlzLmNhcGFiaWxpdGllcywgZmFsc2UpO1xuICB9XG5cbiAgYXN5bmMgd2FpdEZvck9ubGluZSAoKSB7XG4gICAgLy8gd2UgbmVlZCB0byBtYWtlIHN1cmUgdGhhdCBDRCBoYXNuJ3QgY3Jhc2hlZFxuICAgIGxldCBjaHJvbWVkcml2ZXJTdG9wcGVkID0gZmFsc2U7XG4gICAgYXdhaXQgcmV0cnlJbnRlcnZhbCgyMCwgMjAwLCBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gQ2hyb21lZHJpdmVyLlNUQVRFX1NUT1BQRUQpIHtcbiAgICAgICAgLy8gd2UgYXJlIGVpdGhlciBzdG9wcGVkIG9yIHN0b3BwaW5nLCBzbyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgICBjaHJvbWVkcml2ZXJTdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXdhaXQgdGhpcy5nZXRTdGF0dXMoKTtcbiAgICB9KTtcbiAgICBpZiAoY2hyb21lZHJpdmVyU3RvcHBlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaHJvbWVEcml2ZXIgY3Jhc2hlZCBkdXJpbmcgc3RhcnR1cC4nKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRTdGF0dXMgKCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmp3cHJveHkuY29tbWFuZCgnL3N0YXR1cycsICdHRVQnKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0U2Vzc2lvbiAoKSB7XG4gICAgY29uc3Qgc2Vzc2lvbkNhcHMgPSB0aGlzLmRlc2lyZWRQcm90b2NvbCA9PT0gUFJPVE9DT0xTLlczQ1xuICAgICAgPyB7Y2FwYWJpbGl0aWVzOiB7YWx3YXlzTWF0Y2g6IHRoaXMuY2FwYWJpbGl0aWVzfX1cbiAgICAgIDoge2Rlc2lyZWRDYXBhYmlsaXRpZXM6IHRoaXMuY2FwYWJpbGl0aWVzfTtcbiAgICBsb2cuaW5mbyhgU3RhcnRpbmcgJHt0aGlzLmRlc2lyZWRQcm90b2NvbH0gQ2hyb21lZHJpdmVyIHNlc3Npb24gd2l0aCBjYXBhYmlsaXRpZXM6IGAgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbkNhcHMsIG51bGwsIDIpKTtcbiAgICAvLyByZXRyeSBzZXNzaW9uIHN0YXJ0IDQgdGltZXMsIHNvbWV0aW1lcyB0aGlzIGZhaWxzIGR1ZSB0byBhZGJcbiAgICBhd2FpdCByZXRyeUludGVydmFsKDQsIDIwMCwgYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5qd3Byb3h5LmNvbW1hbmQoJy9zZXNzaW9uJywgJ1BPU1QnLCBzZXNzaW9uQ2Fwcyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLndhcm4oYEZhaWxlZCB0byBzdGFydCBDaHJvbWVkcml2ZXIgc2Vzc2lvbjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuY2hhbmdlU3RhdGUoQ2hyb21lZHJpdmVyLlNUQVRFX09OTElORSk7XG4gIH1cblxuICBhc3luYyBzdG9wIChlbWl0U3RhdGVzID0gdHJ1ZSkge1xuICAgIGlmIChlbWl0U3RhdGVzKSB7XG4gICAgICB0aGlzLmNoYW5nZVN0YXRlKENocm9tZWRyaXZlci5TVEFURV9TVE9QUElORyk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmp3cHJveHkuY29tbWFuZCgnJywgJ0RFTEVURScpO1xuICAgICAgYXdhaXQgdGhpcy5wcm9jLnN0b3AoJ1NJR1RFUk0nLCAyMDAwMCk7XG4gICAgICBpZiAoZW1pdFN0YXRlcykge1xuICAgICAgICB0aGlzLmNoYW5nZVN0YXRlKENocm9tZWRyaXZlci5TVEFURV9TVE9QUEVEKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuZXJyb3IoZSk7XG4gICAgfVxuICB9XG5cbiAgY2hhbmdlU3RhdGUgKHN0YXRlKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIGxvZy5kZWJ1ZyhgQ2hhbmdlZCBzdGF0ZSB0byAnJHtzdGF0ZX0nYCk7XG4gICAgdGhpcy5lbWl0KENocm9tZWRyaXZlci5FVkVOVF9DSEFOR0VELCB7c3RhdGV9KTtcbiAgfVxuXG4gIGFzeW5jIHNlbmRDb21tYW5kICh1cmwsIG1ldGhvZCwgYm9keSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmp3cHJveHkuY29tbWFuZCh1cmwsIG1ldGhvZCwgYm9keSk7XG4gIH1cblxuICBhc3luYyBwcm94eVJlcSAocmVxLCByZXMpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5qd3Byb3h5LnByb3h5UmVxUmVzKHJlcSwgcmVzKTtcbiAgfVxuXG4gIGFzeW5jIGtpbGxBbGwgKCkge1xuICAgIGxldCBjbWQgPSBzeXN0ZW0uaXNXaW5kb3dzKClcbiAgICAgID8gYHdtaWMgcHJvY2VzcyB3aGVyZSBcImNvbW1hbmRsaW5lIGxpa2UgJyVjaHJvbWVkcml2ZXIuZXhlJS0tcG9ydD0ke3RoaXMucHJveHlQb3J0fSUnXCIgZGVsZXRlYFxuICAgICAgOiBgcGtpbGwgLTE1IC1mIFwiJHt0aGlzLmNocm9tZWRyaXZlcn0uKi0tcG9ydD0ke3RoaXMucHJveHlQb3J0fVwiYDtcbiAgICBsb2cuZGVidWcoYEtpbGxpbmcgYW55IG9sZCBjaHJvbWVkcml2ZXJzLCBydW5uaW5nOiAke2NtZH1gKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgKEIucHJvbWlzaWZ5KGNwLmV4ZWMpKShjbWQpO1xuICAgICAgbG9nLmRlYnVnKCdTdWNjZXNzZnVsbHkgY2xlYW5lZCB1cCBvbGQgY2hyb21lZHJpdmVycycpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nLndhcm4oJ05vIG9sZCBjaHJvbWVkcml2ZXJzIHNlZW0gdG8gZXhpc3QnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hZGIpIHtcbiAgICAgIGxvZy5kZWJ1ZyhgQ2xlYW5pbmcgYW55IG9sZCBhZGIgZm9yd2FyZGVkIHBvcnQgc29ja2V0IGNvbm5lY3Rpb25zYCk7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGxldCBjb25uIG9mIGF3YWl0IHRoaXMuYWRiLmdldEZvcndhcmRMaXN0KCkpIHtcbiAgICAgICAgICAvLyBjaHJvbWVkcml2ZXIgd2lsbCBhc2sgQURCIHRvIGZvcndhcmQgYSBwb3J0IGxpa2UgXCJkZXZpY2VJZCB0Y3A6cG9ydCBsb2NhbGFic3RyYWN0OndlYnZpZXdfZGV2dG9vbHNfcmVtb3RlX3BvcnRcIlxuICAgICAgICAgIGlmIChjb25uLmluZGV4T2YoJ3dlYnZpZXdfZGV2dG9vbHMnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGxldCBwYXJhbXMgPSBjb25uLnNwbGl0KC9cXHMrLyk7XG4gICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGIucmVtb3ZlUG9ydEZvcndhcmQocGFyYW1zWzFdLnJlcGxhY2UoL1tcXERdKi8sICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLndhcm4oYFVuYWJsZSB0byBjbGVhbiBmb3J3YXJkZWQgcG9ydHMuIEVycm9yOiAnJHtlcnIubWVzc2FnZX0nLiBDb250aW51aW5nLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGhhc1dvcmtpbmdXZWJ2aWV3ICgpIHtcbiAgICAvLyBzb21ldGltZXMgY2hyb21lZHJpdmVyIHN0b3BzIGF1dG9tYXRpbmcgd2Vidmlld3MuIHRoaXMgbWV0aG9kIHJ1bnMgYVxuICAgIC8vIHNpbXBsZSBjb21tYW5kIHRvIGRldGVybWluZSBvdXIgc3RhdGUsIGFuZCByZXNwb25kcyBhY2NvcmRpbmdseVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmp3cHJveHkuY29tbWFuZCgnL3VybCcsICdHRVQnKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuQ2hyb21lZHJpdmVyLkVWRU5UX0VSUk9SID0gJ2Nocm9tZWRyaXZlcl9lcnJvcic7XG5DaHJvbWVkcml2ZXIuRVZFTlRfQ0hBTkdFRCA9ICdzdGF0ZUNoYW5nZWQnO1xuQ2hyb21lZHJpdmVyLlNUQVRFX1NUT1BQRUQgPSAnc3RvcHBlZCc7XG5DaHJvbWVkcml2ZXIuU1RBVEVfU1RBUlRJTkcgPSAnc3RhcnRpbmcnO1xuQ2hyb21lZHJpdmVyLlNUQVRFX09OTElORSA9ICdvbmxpbmUnO1xuQ2hyb21lZHJpdmVyLlNUQVRFX1NUT1BQSU5HID0gJ3N0b3BwaW5nJztcbkNocm9tZWRyaXZlci5TVEFURV9SRVNUQVJUSU5HID0gJ3Jlc3RhcnRpbmcnO1xuXG5leHBvcnQge1xuICBDaHJvbWVkcml2ZXIsIENIUk9NRURSSVZFUl9DSFJPTUVfTUFQUElORywgZ2V0TW9zdFJlY2VudENocm9tZWRyaXZlciwgQ0RfVkVSLFxufTtcbmV4cG9ydCBkZWZhdWx0IENocm9tZWRyaXZlcjtcbiJdLCJmaWxlIjoibGliL2Nocm9tZWRyaXZlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
