"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _appiumSupport = require("appium-support");

var _teen_process = require("teen_process");

var _logger = _interopRequireDefault(require("../logger"));

var _utils = require("../utils");

var _asyncbox = require("asyncbox");

let commands = {};
exports.commands = commands;
const PERF_RECORD_FEAT_NAME = 'perf_record';
const PERF_RECORD_SECURITY_MESSAGE = 'Performance measurement requires relaxing security for simulator. ' + `Please set '--relaxed-security' or '--allow-insecure' with '${PERF_RECORD_FEAT_NAME}' ` + 'referencing https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/security.md for more details.';
const RECORDERS_CACHE = {};
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const STOP_TIMEOUT_MS = 3 * 60 * 1000;
const PROFILING_TIMEOUT_MS = 15 * 1000;
const DEFAULT_PROFILE_NAME = 'Activity Monitor';
const DEFAULT_EXT = '.trace';

async function finishPerfRecord(proc, stopGracefully = true) {
  if (!proc.isRunning) {
    return;
  }

  if (stopGracefully) {
    _logger.default.debug(`Sending SIGINT to the running instruments process`);

    return await proc.stop('SIGINT', STOP_TIMEOUT_MS);
  }

  _logger.default.debug(`Sending SIGTERM to the running instruments process`);

  await proc.stop();
}

async function uploadTrace(localFile, remotePath = null, uploadOptions = {}) {
  try {
    return await (0, _utils.encodeBase64OrUpload)(localFile, remotePath, uploadOptions);
  } finally {
    await _appiumSupport.fs.rimraf(localFile);
  }
}

commands.mobileStartPerfRecord = async function mobileStartPerfRecord(opts = {}) {
  if (!this.isFeatureEnabled(PERF_RECORD_FEAT_NAME) && !this.isRealDevice()) {
    _logger.default.errorAndThrow(PERF_RECORD_SECURITY_MESSAGE);
  }

  const {
    timeout = DEFAULT_TIMEOUT_MS,
    profileName = DEFAULT_PROFILE_NAME,
    pid
  } = opts;
  const runningRecorders = RECORDERS_CACHE[profileName];

  if (_lodash.default.isPlainObject(runningRecorders) && runningRecorders[this.opts.device.udid]) {
    const {
      proc,
      localPath
    } = runningRecorders[this.opts.device.udid];
    await finishPerfRecord(proc, false);

    if (await _appiumSupport.fs.exists(localPath)) {
      await _appiumSupport.fs.rimraf(localPath);
    }

    delete runningRecorders[this.opts.device.udid];
  }

  let instrumentsPath;

  try {
    instrumentsPath = await _appiumSupport.fs.which('instruments');
  } catch (e) {
    _logger.default.errorAndThrow(`Cannot start performance recording, because 'instruments' ` + `tool cannot be found in PATH. Are Xcode development tools installed?`);
  }

  const localPath = await _appiumSupport.tempDir.path({
    prefix: `appium_perf_${profileName}_${Date.now()}`.replace(/\W/g, '_'),
    suffix: DEFAULT_EXT
  });
  const args = ['-w', this.opts.device.udid, '-t', profileName, '-D', localPath, '-l', timeout];

  if (pid) {
    if (`${pid}`.toLowerCase() === 'current') {
      const appInfo = await this.proxyCommand('/wda/activeAppInfo', 'GET');
      args.push('-p', appInfo.pid);
    } else {
      args.push('-p', pid);
    }
  }

  const proc = new _teen_process.SubProcess(instrumentsPath, args);

  _logger.default.info(`Starting '${instrumentsPath}' with arguments: ${args.join(' ')}`);

  proc.on('exit', code => {
    const msg = `instruments exited with code '${code}'`;

    if (code) {
      _logger.default.warn(msg);
    } else {
      _logger.default.debug(msg);
    }
  });
  proc.on('output', (stdout, stderr) => {
    (stdout || stderr).split('\n').filter(x => x.length).map(x => _logger.default.debug(`[instruments] ${x}`));
  });
  await proc.start(0);

  try {
    await (0, _asyncbox.waitForCondition)(async () => await _appiumSupport.fs.exists(localPath), {
      waitMs: PROFILING_TIMEOUT_MS,
      intervalMs: 500
    });
  } catch (err) {
    try {
      await proc.stop('SIGKILL');
    } catch (ign) {}

    _logger.default.errorAndThrow(`Cannot start performance monitoring for '${profileName}' profile in ${PROFILING_TIMEOUT_MS}ms. ` + `Make sure you can execute the same command manually from Terminal and the profile name/path are correct.`);
  }

  RECORDERS_CACHE[profileName] = Object.assign({}, RECORDERS_CACHE[profileName] || {}, {
    [this.opts.device.udid]: {
      proc,
      localPath
    }
  });
};

commands.mobileStopPerfRecord = async function mobileStopPerfRecord(opts = {}) {
  if (!this.isFeatureEnabled(PERF_RECORD_FEAT_NAME) && !this.isRealDevice()) {
    _logger.default.errorAndThrow(PERF_RECORD_SECURITY_MESSAGE);
  }

  const {
    remotePath,
    user,
    pass,
    method,
    profileName = DEFAULT_PROFILE_NAME
  } = opts;
  const runningRecorders = RECORDERS_CACHE[profileName];

  if (!_lodash.default.isPlainObject(runningRecorders) || !runningRecorders[this.opts.device.udid]) {
    _logger.default.errorAndThrow(`There are no records for performance profile '${profileName}' ` + `and device ${this.opts.device.udid}. ` + `Have you started the profiling before?`);
  }

  const {
    proc,
    localPath
  } = runningRecorders[this.opts.device.udid];
  await finishPerfRecord(proc, true);

  if (!(await _appiumSupport.fs.exists(localPath))) {
    _logger.default.errorAndThrow(`There is no .trace file found for performance profile '${profileName}' ` + `and device ${this.opts.device.udid}. ` + `Make sure the profile is supported on this device. ` + `You can use 'instruments -s' command to see the list of all available profiles.`);
  }

  const zipPath = `${localPath}.zip`;
  const zipArgs = ['-9', '-r', zipPath, _path.default.basename(localPath)];

  _logger.default.info(`Found perf trace record '${localPath}'. Compressing it with 'zip ${zipArgs.join(' ')}'`);

  try {
    await (0, _teen_process.exec)('zip', zipArgs, {
      cwd: _path.default.dirname(localPath)
    });
    return await uploadTrace(zipPath, remotePath, {
      user,
      pass,
      method
    });
  } finally {
    delete runningRecorders[this.opts.device.udid];

    if (await _appiumSupport.fs.exists(localPath)) {
      await _appiumSupport.fs.rimraf(localPath);
    }
  }
};

var _default = commands;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9wZXJmb3JtYW5jZS5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsIlBFUkZfUkVDT1JEX0ZFQVRfTkFNRSIsIlBFUkZfUkVDT1JEX1NFQ1VSSVRZX01FU1NBR0UiLCJSRUNPUkRFUlNfQ0FDSEUiLCJERUZBVUxUX1RJTUVPVVRfTVMiLCJTVE9QX1RJTUVPVVRfTVMiLCJQUk9GSUxJTkdfVElNRU9VVF9NUyIsIkRFRkFVTFRfUFJPRklMRV9OQU1FIiwiREVGQVVMVF9FWFQiLCJmaW5pc2hQZXJmUmVjb3JkIiwicHJvYyIsInN0b3BHcmFjZWZ1bGx5IiwiaXNSdW5uaW5nIiwibG9nIiwiZGVidWciLCJzdG9wIiwidXBsb2FkVHJhY2UiLCJsb2NhbEZpbGUiLCJyZW1vdGVQYXRoIiwidXBsb2FkT3B0aW9ucyIsImZzIiwicmltcmFmIiwibW9iaWxlU3RhcnRQZXJmUmVjb3JkIiwib3B0cyIsImlzRmVhdHVyZUVuYWJsZWQiLCJpc1JlYWxEZXZpY2UiLCJlcnJvckFuZFRocm93IiwidGltZW91dCIsInByb2ZpbGVOYW1lIiwicGlkIiwicnVubmluZ1JlY29yZGVycyIsIl8iLCJpc1BsYWluT2JqZWN0IiwiZGV2aWNlIiwidWRpZCIsImxvY2FsUGF0aCIsImV4aXN0cyIsImluc3RydW1lbnRzUGF0aCIsIndoaWNoIiwiZSIsInRlbXBEaXIiLCJwYXRoIiwicHJlZml4IiwiRGF0ZSIsIm5vdyIsInJlcGxhY2UiLCJzdWZmaXgiLCJhcmdzIiwidG9Mb3dlckNhc2UiLCJhcHBJbmZvIiwicHJveHlDb21tYW5kIiwicHVzaCIsIlN1YlByb2Nlc3MiLCJpbmZvIiwiam9pbiIsIm9uIiwiY29kZSIsIm1zZyIsIndhcm4iLCJzdGRvdXQiLCJzdGRlcnIiLCJzcGxpdCIsImZpbHRlciIsIngiLCJsZW5ndGgiLCJtYXAiLCJzdGFydCIsIndhaXRNcyIsImludGVydmFsTXMiLCJlcnIiLCJpZ24iLCJPYmplY3QiLCJhc3NpZ24iLCJtb2JpbGVTdG9wUGVyZlJlY29yZCIsInVzZXIiLCJwYXNzIiwibWV0aG9kIiwiemlwUGF0aCIsInppcEFyZ3MiLCJiYXNlbmFtZSIsImN3ZCIsImRpcm5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsSUFBSUEsUUFBUSxHQUFHLEVBQWY7O0FBRUEsTUFBTUMscUJBQXFCLEdBQUcsYUFBOUI7QUFDQSxNQUFNQyw0QkFBNEIsR0FBRyx1RUFDbEMsK0RBQThERCxxQkFBc0IsSUFEbEQsR0FFbkMsdUhBRkY7QUFHQSxNQUFNRSxlQUFlLEdBQUcsRUFBeEI7QUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxJQUFJLEVBQUosR0FBUyxJQUFwQztBQUNBLE1BQU1DLGVBQWUsR0FBRyxJQUFJLEVBQUosR0FBUyxJQUFqQztBQUNBLE1BQU1DLG9CQUFvQixHQUFHLEtBQUssSUFBbEM7QUFDQSxNQUFNQyxvQkFBb0IsR0FBRyxrQkFBN0I7QUFDQSxNQUFNQyxXQUFXLEdBQUcsUUFBcEI7O0FBR0EsZUFBZUMsZ0JBQWYsQ0FBaUNDLElBQWpDLEVBQXVDQyxjQUFjLEdBQUcsSUFBeEQsRUFBOEQ7QUFDNUQsTUFBSSxDQUFDRCxJQUFJLENBQUNFLFNBQVYsRUFBcUI7QUFDbkI7QUFDRDs7QUFDRCxNQUFJRCxjQUFKLEVBQW9CO0FBQ2xCRSxvQkFBSUMsS0FBSixDQUFXLG1EQUFYOztBQUNBLFdBQU8sTUFBTUosSUFBSSxDQUFDSyxJQUFMLENBQVUsUUFBVixFQUFvQlYsZUFBcEIsQ0FBYjtBQUNEOztBQUNEUSxrQkFBSUMsS0FBSixDQUFXLG9EQUFYOztBQUNBLFFBQU1KLElBQUksQ0FBQ0ssSUFBTCxFQUFOO0FBQ0Q7O0FBRUQsZUFBZUMsV0FBZixDQUE0QkMsU0FBNUIsRUFBdUNDLFVBQVUsR0FBRyxJQUFwRCxFQUEwREMsYUFBYSxHQUFHLEVBQTFFLEVBQThFO0FBQzVFLE1BQUk7QUFDRixXQUFPLE1BQU0saUNBQXFCRixTQUFyQixFQUFnQ0MsVUFBaEMsRUFBNENDLGFBQTVDLENBQWI7QUFDRCxHQUZELFNBRVU7QUFDUixVQUFNQyxrQkFBR0MsTUFBSCxDQUFVSixTQUFWLENBQU47QUFDRDtBQUNGOztBQTZCRGpCLFFBQVEsQ0FBQ3NCLHFCQUFULEdBQWlDLGVBQWVBLHFCQUFmLENBQXNDQyxJQUFJLEdBQUcsRUFBN0MsRUFBaUQ7QUFDaEYsTUFBSSxDQUFDLEtBQUtDLGdCQUFMLENBQXNCdkIscUJBQXRCLENBQUQsSUFBaUQsQ0FBQyxLQUFLd0IsWUFBTCxFQUF0RCxFQUEyRTtBQUN6RVosb0JBQUlhLGFBQUosQ0FBa0J4Qiw0QkFBbEI7QUFDRDs7QUFFRCxRQUFNO0FBQ0p5QixJQUFBQSxPQUFPLEdBQUd2QixrQkFETjtBQUVKd0IsSUFBQUEsV0FBVyxHQUFHckIsb0JBRlY7QUFHSnNCLElBQUFBO0FBSEksTUFJRk4sSUFKSjtBQU9BLFFBQU1PLGdCQUFnQixHQUFHM0IsZUFBZSxDQUFDeUIsV0FBRCxDQUF4Qzs7QUFDQSxNQUFJRyxnQkFBRUMsYUFBRixDQUFnQkYsZ0JBQWhCLEtBQXFDQSxnQkFBZ0IsQ0FBQyxLQUFLUCxJQUFMLENBQVVVLE1BQVYsQ0FBaUJDLElBQWxCLENBQXpELEVBQWtGO0FBQ2hGLFVBQU07QUFBQ3hCLE1BQUFBLElBQUQ7QUFBT3lCLE1BQUFBO0FBQVAsUUFBb0JMLGdCQUFnQixDQUFDLEtBQUtQLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBbEIsQ0FBMUM7QUFDQSxVQUFNekIsZ0JBQWdCLENBQUNDLElBQUQsRUFBTyxLQUFQLENBQXRCOztBQUNBLFFBQUksTUFBTVUsa0JBQUdnQixNQUFILENBQVVELFNBQVYsQ0FBVixFQUFnQztBQUM5QixZQUFNZixrQkFBR0MsTUFBSCxDQUFVYyxTQUFWLENBQU47QUFDRDs7QUFDRCxXQUFPTCxnQkFBZ0IsQ0FBQyxLQUFLUCxJQUFMLENBQVVVLE1BQVYsQ0FBaUJDLElBQWxCLENBQXZCO0FBQ0Q7O0FBRUQsTUFBSUcsZUFBSjs7QUFDQSxNQUFJO0FBQ0ZBLElBQUFBLGVBQWUsR0FBRyxNQUFNakIsa0JBQUdrQixLQUFILENBQVMsYUFBVCxDQUF4QjtBQUNELEdBRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7QUFDVjFCLG9CQUFJYSxhQUFKLENBQW1CLDREQUFELEdBQ2Ysc0VBREg7QUFFRDs7QUFFRCxRQUFNUyxTQUFTLEdBQUcsTUFBTUssdUJBQVFDLElBQVIsQ0FBYTtBQUNuQ0MsSUFBQUEsTUFBTSxFQUFHLGVBQWNkLFdBQVksSUFBR2UsSUFBSSxDQUFDQyxHQUFMLEVBQVcsRUFBekMsQ0FBMkNDLE9BQTNDLENBQW1ELEtBQW5ELEVBQTBELEdBQTFELENBRDJCO0FBRW5DQyxJQUFBQSxNQUFNLEVBQUV0QztBQUYyQixHQUFiLENBQXhCO0FBS0EsUUFBTXVDLElBQUksR0FBRyxDQUNYLElBRFcsRUFDTCxLQUFLeEIsSUFBTCxDQUFVVSxNQUFWLENBQWlCQyxJQURaLEVBRVgsSUFGVyxFQUVMTixXQUZLLEVBR1gsSUFIVyxFQUdMTyxTQUhLLEVBSVgsSUFKVyxFQUlMUixPQUpLLENBQWI7O0FBTUEsTUFBSUUsR0FBSixFQUFTO0FBQ1AsUUFBSyxHQUFFQSxHQUFJLEVBQVAsQ0FBU21CLFdBQVQsT0FBMkIsU0FBL0IsRUFBMEM7QUFDeEMsWUFBTUMsT0FBTyxHQUFHLE1BQU0sS0FBS0MsWUFBTCxDQUFrQixvQkFBbEIsRUFBd0MsS0FBeEMsQ0FBdEI7QUFDQUgsTUFBQUEsSUFBSSxDQUFDSSxJQUFMLENBQVUsSUFBVixFQUFnQkYsT0FBTyxDQUFDcEIsR0FBeEI7QUFDRCxLQUhELE1BR087QUFDTGtCLE1BQUFBLElBQUksQ0FBQ0ksSUFBTCxDQUFVLElBQVYsRUFBZ0J0QixHQUFoQjtBQUNEO0FBQ0Y7O0FBQ0QsUUFBTW5CLElBQUksR0FBRyxJQUFJMEMsd0JBQUosQ0FBZWYsZUFBZixFQUFnQ1UsSUFBaEMsQ0FBYjs7QUFDQWxDLGtCQUFJd0MsSUFBSixDQUFVLGFBQVloQixlQUFnQixxQkFBb0JVLElBQUksQ0FBQ08sSUFBTCxDQUFVLEdBQVYsQ0FBZSxFQUF6RTs7QUFDQTVDLEVBQUFBLElBQUksQ0FBQzZDLEVBQUwsQ0FBUSxNQUFSLEVBQWlCQyxJQUFELElBQVU7QUFDeEIsVUFBTUMsR0FBRyxHQUFJLGlDQUFnQ0QsSUFBSyxHQUFsRDs7QUFDQSxRQUFJQSxJQUFKLEVBQVU7QUFDUjNDLHNCQUFJNkMsSUFBSixDQUFTRCxHQUFUO0FBQ0QsS0FGRCxNQUVPO0FBQ0w1QyxzQkFBSUMsS0FBSixDQUFVMkMsR0FBVjtBQUNEO0FBQ0YsR0FQRDtBQVFBL0MsRUFBQUEsSUFBSSxDQUFDNkMsRUFBTCxDQUFRLFFBQVIsRUFBa0IsQ0FBQ0ksTUFBRCxFQUFTQyxNQUFULEtBQW9CO0FBQ3BDLEtBQUNELE1BQU0sSUFBSUMsTUFBWCxFQUFtQkMsS0FBbkIsQ0FBeUIsSUFBekIsRUFDR0MsTUFESCxDQUNVQyxDQUFDLElBQUlBLENBQUMsQ0FBQ0MsTUFEakIsRUFFR0MsR0FGSCxDQUVPRixDQUFDLElBQUlsRCxnQkFBSUMsS0FBSixDQUFXLGlCQUFnQmlELENBQUUsRUFBN0IsQ0FGWjtBQUdELEdBSkQ7QUFNQSxRQUFNckQsSUFBSSxDQUFDd0QsS0FBTCxDQUFXLENBQVgsQ0FBTjs7QUFDQSxNQUFJO0FBQ0YsVUFBTSxnQ0FBaUIsWUFBWSxNQUFNOUMsa0JBQUdnQixNQUFILENBQVVELFNBQVYsQ0FBbkMsRUFBeUQ7QUFDN0RnQyxNQUFBQSxNQUFNLEVBQUU3RCxvQkFEcUQ7QUFFN0Q4RCxNQUFBQSxVQUFVLEVBQUU7QUFGaUQsS0FBekQsQ0FBTjtBQUlELEdBTEQsQ0FLRSxPQUFPQyxHQUFQLEVBQVk7QUFDWixRQUFJO0FBQ0YsWUFBTTNELElBQUksQ0FBQ0ssSUFBTCxDQUFVLFNBQVYsQ0FBTjtBQUNELEtBRkQsQ0FFRSxPQUFPdUQsR0FBUCxFQUFZLENBQUU7O0FBQ2hCekQsb0JBQUlhLGFBQUosQ0FBbUIsNENBQTJDRSxXQUFZLGdCQUFldEIsb0JBQXFCLE1BQTVGLEdBQ2YsMEdBREg7QUFFRDs7QUFDREgsRUFBQUEsZUFBZSxDQUFDeUIsV0FBRCxDQUFmLEdBQStCMkMsTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFtQnJFLGVBQWUsQ0FBQ3lCLFdBQUQsQ0FBZixJQUFnQyxFQUFuRCxFQUF3RDtBQUNyRixLQUFDLEtBQUtMLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBbEIsR0FBeUI7QUFBQ3hCLE1BQUFBLElBQUQ7QUFBT3lCLE1BQUFBO0FBQVA7QUFENEQsR0FBeEQsQ0FBL0I7QUFHRCxDQWpGRDs7QUErR0FuQyxRQUFRLENBQUN5RSxvQkFBVCxHQUFnQyxlQUFlQSxvQkFBZixDQUFxQ2xELElBQUksR0FBRyxFQUE1QyxFQUFnRDtBQUM5RSxNQUFJLENBQUMsS0FBS0MsZ0JBQUwsQ0FBc0J2QixxQkFBdEIsQ0FBRCxJQUFpRCxDQUFDLEtBQUt3QixZQUFMLEVBQXRELEVBQTJFO0FBQ3pFWixvQkFBSWEsYUFBSixDQUFrQnhCLDRCQUFsQjtBQUNEOztBQUVELFFBQU07QUFDSmdCLElBQUFBLFVBREk7QUFFSndELElBQUFBLElBRkk7QUFHSkMsSUFBQUEsSUFISTtBQUlKQyxJQUFBQSxNQUpJO0FBS0poRCxJQUFBQSxXQUFXLEdBQUdyQjtBQUxWLE1BTUZnQixJQU5KO0FBT0EsUUFBTU8sZ0JBQWdCLEdBQUczQixlQUFlLENBQUN5QixXQUFELENBQXhDOztBQUNBLE1BQUksQ0FBQ0csZ0JBQUVDLGFBQUYsQ0FBZ0JGLGdCQUFoQixDQUFELElBQXNDLENBQUNBLGdCQUFnQixDQUFDLEtBQUtQLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBbEIsQ0FBM0QsRUFBb0Y7QUFDbEZyQixvQkFBSWEsYUFBSixDQUFtQixpREFBZ0RFLFdBQVksSUFBN0QsR0FDQyxjQUFhLEtBQUtMLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBSyxJQURwQyxHQUVDLHdDQUZuQjtBQUdEOztBQUVELFFBQU07QUFBQ3hCLElBQUFBLElBQUQ7QUFBT3lCLElBQUFBO0FBQVAsTUFBb0JMLGdCQUFnQixDQUFDLEtBQUtQLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBbEIsQ0FBMUM7QUFDQSxRQUFNekIsZ0JBQWdCLENBQUNDLElBQUQsRUFBTyxJQUFQLENBQXRCOztBQUNBLE1BQUksRUFBQyxNQUFNVSxrQkFBR2dCLE1BQUgsQ0FBVUQsU0FBVixDQUFQLENBQUosRUFBaUM7QUFDL0J0QixvQkFBSWEsYUFBSixDQUFtQiwwREFBeURFLFdBQVksSUFBdEUsR0FDQyxjQUFhLEtBQUtMLElBQUwsQ0FBVVUsTUFBVixDQUFpQkMsSUFBSyxJQURwQyxHQUVDLHFEQUZELEdBR0MsaUZBSG5CO0FBSUQ7O0FBRUQsUUFBTTJDLE9BQU8sR0FBSSxHQUFFMUMsU0FBVSxNQUE3QjtBQUNBLFFBQU0yQyxPQUFPLEdBQUcsQ0FDZCxJQURjLEVBQ1IsSUFEUSxFQUNGRCxPQURFLEVBRWRwQyxjQUFLc0MsUUFBTCxDQUFjNUMsU0FBZCxDQUZjLENBQWhCOztBQUlBdEIsa0JBQUl3QyxJQUFKLENBQVUsNEJBQTJCbEIsU0FBVSwrQkFBOEIyQyxPQUFPLENBQUN4QixJQUFSLENBQWEsR0FBYixDQUFrQixHQUEvRjs7QUFDQSxNQUFJO0FBQ0YsVUFBTSx3QkFBSyxLQUFMLEVBQVl3QixPQUFaLEVBQXFCO0FBQ3pCRSxNQUFBQSxHQUFHLEVBQUV2QyxjQUFLd0MsT0FBTCxDQUFhOUMsU0FBYjtBQURvQixLQUFyQixDQUFOO0FBR0EsV0FBTyxNQUFNbkIsV0FBVyxDQUFDNkQsT0FBRCxFQUFVM0QsVUFBVixFQUFzQjtBQUFDd0QsTUFBQUEsSUFBRDtBQUFPQyxNQUFBQSxJQUFQO0FBQWFDLE1BQUFBO0FBQWIsS0FBdEIsQ0FBeEI7QUFDRCxHQUxELFNBS1U7QUFDUixXQUFPOUMsZ0JBQWdCLENBQUMsS0FBS1AsSUFBTCxDQUFVVSxNQUFWLENBQWlCQyxJQUFsQixDQUF2Qjs7QUFDQSxRQUFJLE1BQU1kLGtCQUFHZ0IsTUFBSCxDQUFVRCxTQUFWLENBQVYsRUFBZ0M7QUFDOUIsWUFBTWYsa0JBQUdDLE1BQUgsQ0FBVWMsU0FBVixDQUFOO0FBQ0Q7QUFDRjtBQUNGLENBN0NEOztlQWlEZW5DLFEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgdGVtcERpciB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCB7IFN1YlByb2Nlc3MsIGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXInO1xuaW1wb3J0IHsgZW5jb2RlQmFzZTY0T3JVcGxvYWQgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyB3YWl0Rm9yQ29uZGl0aW9uIH0gZnJvbSAnYXN5bmNib3gnO1xuXG5cbmxldCBjb21tYW5kcyA9IHt9O1xuXG5jb25zdCBQRVJGX1JFQ09SRF9GRUFUX05BTUUgPSAncGVyZl9yZWNvcmQnO1xuY29uc3QgUEVSRl9SRUNPUkRfU0VDVVJJVFlfTUVTU0FHRSA9ICdQZXJmb3JtYW5jZSBtZWFzdXJlbWVudCByZXF1aXJlcyByZWxheGluZyBzZWN1cml0eSBmb3Igc2ltdWxhdG9yLiAnICtcbiAgYFBsZWFzZSBzZXQgJy0tcmVsYXhlZC1zZWN1cml0eScgb3IgJy0tYWxsb3ctaW5zZWN1cmUnIHdpdGggJyR7UEVSRl9SRUNPUkRfRkVBVF9OQU1FfScgYCArXG4gICdyZWZlcmVuY2luZyBodHRwczovL2dpdGh1Yi5jb20vYXBwaXVtL2FwcGl1bS9ibG9iL21hc3Rlci9kb2NzL2VuL3dyaXRpbmctcnVubmluZy1hcHBpdW0vc2VjdXJpdHkubWQgZm9yIG1vcmUgZGV0YWlscy4nO1xuY29uc3QgUkVDT1JERVJTX0NBQ0hFID0ge307XG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSA1ICogNjAgKiAxMDAwO1xuY29uc3QgU1RPUF9USU1FT1VUX01TID0gMyAqIDYwICogMTAwMDtcbmNvbnN0IFBST0ZJTElOR19USU1FT1VUX01TID0gMTUgKiAxMDAwO1xuY29uc3QgREVGQVVMVF9QUk9GSUxFX05BTUUgPSAnQWN0aXZpdHkgTW9uaXRvcic7XG5jb25zdCBERUZBVUxUX0VYVCA9ICcudHJhY2UnO1xuXG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmlzaFBlcmZSZWNvcmQgKHByb2MsIHN0b3BHcmFjZWZ1bGx5ID0gdHJ1ZSkge1xuICBpZiAoIXByb2MuaXNSdW5uaW5nKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdG9wR3JhY2VmdWxseSkge1xuICAgIGxvZy5kZWJ1ZyhgU2VuZGluZyBTSUdJTlQgdG8gdGhlIHJ1bm5pbmcgaW5zdHJ1bWVudHMgcHJvY2Vzc2ApO1xuICAgIHJldHVybiBhd2FpdCBwcm9jLnN0b3AoJ1NJR0lOVCcsIFNUT1BfVElNRU9VVF9NUyk7XG4gIH1cbiAgbG9nLmRlYnVnKGBTZW5kaW5nIFNJR1RFUk0gdG8gdGhlIHJ1bm5pbmcgaW5zdHJ1bWVudHMgcHJvY2Vzc2ApO1xuICBhd2FpdCBwcm9jLnN0b3AoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBsb2FkVHJhY2UgKGxvY2FsRmlsZSwgcmVtb3RlUGF0aCA9IG51bGwsIHVwbG9hZE9wdGlvbnMgPSB7fSkge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBlbmNvZGVCYXNlNjRPclVwbG9hZChsb2NhbEZpbGUsIHJlbW90ZVBhdGgsIHVwbG9hZE9wdGlvbnMpO1xuICB9IGZpbmFsbHkge1xuICAgIGF3YWl0IGZzLnJpbXJhZihsb2NhbEZpbGUpO1xuICB9XG59XG5cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTdGFydFBlcmZSZWNvcmRPcHRpb25zXG4gKlxuICogQHByb3BlcnR5IHs/bnVtYmVyfHN0cmluZ30gdGltZW91dCBbMzAwMDAwXSAtIFRoZSBtYXhpbXVtIGNvdW50IG9mIG1pbGxpc2Vjb25kcyB0byByZWNvcmQgdGhlIHByb2ZpbGluZyBpbmZvcm1hdGlvbi5cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ30gcHJvZmlsZU5hbWUgW0FjdGl2aXR5IE1vbml0b3JdIC0gVGhlIG5hbWUgb2YgZXhpc3RpbmcgcGVyZm9ybWFuY2UgcHJvZmlsZSB0byBhcHBseS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhlY3V0ZSBgaW5zdHJ1bWVudHMgLXNgIHRvIHNob3cgdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIHByb2ZpbGVzLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDYW4gYWxzbyBjb250YWluIHRoZSBmdWxsIHBhdGggdG8gdGhlIGNob3NlbiB0ZW1wbGF0ZSBvbiB0aGUgc2VydmVyIGZpbGUgc3lzdGVtLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOb3RlLCB0aGF0IG5vdCBhbGwgcHJvZmlsZXMgYXJlIHN1cHBvcnRlZCBvbiBtb2JpbGUgZGV2aWNlcy5cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ3xudW1iZXJ9IHBpZCAtIFRoZSBJRCBvZiB0aGUgcHJvY2VzcyB0byBtZWFzdXJlIHRoZSBwZXJmb3JtYW5jZSBmb3IuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZXQgaXQgdG8gYGN1cnJlbnRgIGluIG9yZGVyIHRvIG1lYXN1cmUgdGhlIHBlcmZvcm1hbmNlIG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgcHJvY2Vzcywgd2hpY2ggYmVsb25ncyB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSBhcHBsaWNhdGlvbi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsbCBwcm9jZXNzZXMgcnVubmluZyBvbiB0aGUgZGV2aWNlIGFyZSBtZWFzdXJlZCBpZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlkIGlzIHVuc2V0ICh0aGUgZGVmYXVsdCBzZXR0aW5nKS5cbiAqL1xuXG4vKipcbiAqIFN0YXJ0cyBwZXJmb3JtYW5jZSBwcm9maWxpbmcgZm9yIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqIFJlbGF4aW5nIHNlY3VyaXR5IGlzIG1hbmRhdG9yeSBmb3Igc2ltdWxhdG9ycy4gSXQgY2FuIGFsd2F5cyB3b3JrIGZvciByZWFsIGRldmljZXMuXG4gKlxuICogVGhlIGBpbnN0cnVtZW50c2AgZGV2ZWxvcGVyIHV0aWxpdHkgaXMgdXNlZCBmb3IgdGhpcyBwdXJwb3NlIHVuZGVyIHRoZSBob29kLlxuICogSXQgaXMgcG9zc2libGUgdG8gcmVjb3JkIG11bHRpcGxlIHByb2ZpbGVzIGF0IHRoZSBzYW1lIHRpbWUuXG4gKiBSZWFkIGh0dHBzOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9saWJyYXJ5L2NvbnRlbnQvZG9jdW1lbnRhdGlvbi9EZXZlbG9wZXJUb29scy9Db25jZXB0dWFsL0luc3RydW1lbnRzVXNlckd1aWRlL1JlY29yZGluZyxQYXVzaW5nLGFuZFN0b3BwaW5nVHJhY2VzLmh0bWxcbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHBhcmFtIHs/U3RhcnRQZXJmUmVjb3JkT3B0aW9uc30gb3B0cyAtIFRoZSBzZXQgb2YgcG9zc2libGUgc3RhcnQgcmVjb3JkIG9wdGlvbnNcbiAqL1xuY29tbWFuZHMubW9iaWxlU3RhcnRQZXJmUmVjb3JkID0gYXN5bmMgZnVuY3Rpb24gbW9iaWxlU3RhcnRQZXJmUmVjb3JkIChvcHRzID0ge30pIHtcbiAgaWYgKCF0aGlzLmlzRmVhdHVyZUVuYWJsZWQoUEVSRl9SRUNPUkRfRkVBVF9OQU1FKSAmJiAhdGhpcy5pc1JlYWxEZXZpY2UoKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KFBFUkZfUkVDT1JEX1NFQ1VSSVRZX01FU1NBR0UpO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHRpbWVvdXQgPSBERUZBVUxUX1RJTUVPVVRfTVMsXG4gICAgcHJvZmlsZU5hbWUgPSBERUZBVUxUX1BST0ZJTEVfTkFNRSxcbiAgICBwaWQsXG4gIH0gPSBvcHRzO1xuXG4gIC8vIENsZWFudXAgdGhlIHByb2Nlc3MgaWYgaXQgaXMgYWxyZWFkeSBydW5uaW5nXG4gIGNvbnN0IHJ1bm5pbmdSZWNvcmRlcnMgPSBSRUNPUkRFUlNfQ0FDSEVbcHJvZmlsZU5hbWVdO1xuICBpZiAoXy5pc1BsYWluT2JqZWN0KHJ1bm5pbmdSZWNvcmRlcnMpICYmIHJ1bm5pbmdSZWNvcmRlcnNbdGhpcy5vcHRzLmRldmljZS51ZGlkXSkge1xuICAgIGNvbnN0IHtwcm9jLCBsb2NhbFBhdGh9ID0gcnVubmluZ1JlY29yZGVyc1t0aGlzLm9wdHMuZGV2aWNlLnVkaWRdO1xuICAgIGF3YWl0IGZpbmlzaFBlcmZSZWNvcmQocHJvYywgZmFsc2UpO1xuICAgIGlmIChhd2FpdCBmcy5leGlzdHMobG9jYWxQYXRoKSkge1xuICAgICAgYXdhaXQgZnMucmltcmFmKGxvY2FsUGF0aCk7XG4gICAgfVxuICAgIGRlbGV0ZSBydW5uaW5nUmVjb3JkZXJzW3RoaXMub3B0cy5kZXZpY2UudWRpZF07XG4gIH1cblxuICBsZXQgaW5zdHJ1bWVudHNQYXRoO1xuICB0cnkge1xuICAgIGluc3RydW1lbnRzUGF0aCA9IGF3YWl0IGZzLndoaWNoKCdpbnN0cnVtZW50cycpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nLmVycm9yQW5kVGhyb3coYENhbm5vdCBzdGFydCBwZXJmb3JtYW5jZSByZWNvcmRpbmcsIGJlY2F1c2UgJ2luc3RydW1lbnRzJyBgICtcbiAgICAgIGB0b29sIGNhbm5vdCBiZSBmb3VuZCBpbiBQQVRILiBBcmUgWGNvZGUgZGV2ZWxvcG1lbnQgdG9vbHMgaW5zdGFsbGVkP2ApO1xuICB9XG5cbiAgY29uc3QgbG9jYWxQYXRoID0gYXdhaXQgdGVtcERpci5wYXRoKHtcbiAgICBwcmVmaXg6IGBhcHBpdW1fcGVyZl8ke3Byb2ZpbGVOYW1lfV8ke0RhdGUubm93KCl9YC5yZXBsYWNlKC9cXFcvZywgJ18nKSxcbiAgICBzdWZmaXg6IERFRkFVTFRfRVhULFxuICB9KTtcbiAgLy8gaHR0cHM6Ly9oZWxwLmFwcGxlLmNvbS9pbnN0cnVtZW50cy9tYWMvY3VycmVudC8jL2RldmIxNGZmYWE1XG4gIGNvbnN0IGFyZ3MgPSBbXG4gICAgJy13JywgdGhpcy5vcHRzLmRldmljZS51ZGlkLFxuICAgICctdCcsIHByb2ZpbGVOYW1lLFxuICAgICctRCcsIGxvY2FsUGF0aCxcbiAgICAnLWwnLCB0aW1lb3V0LFxuICBdO1xuICBpZiAocGlkKSB7XG4gICAgaWYgKGAke3BpZH1gLnRvTG93ZXJDYXNlKCkgPT09ICdjdXJyZW50Jykge1xuICAgICAgY29uc3QgYXBwSW5mbyA9IGF3YWl0IHRoaXMucHJveHlDb21tYW5kKCcvd2RhL2FjdGl2ZUFwcEluZm8nLCAnR0VUJyk7XG4gICAgICBhcmdzLnB1c2goJy1wJywgYXBwSW5mby5waWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goJy1wJywgcGlkKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgcHJvYyA9IG5ldyBTdWJQcm9jZXNzKGluc3RydW1lbnRzUGF0aCwgYXJncyk7XG4gIGxvZy5pbmZvKGBTdGFydGluZyAnJHtpbnN0cnVtZW50c1BhdGh9JyB3aXRoIGFyZ3VtZW50czogJHthcmdzLmpvaW4oJyAnKX1gKTtcbiAgcHJvYy5vbignZXhpdCcsIChjb2RlKSA9PiB7XG4gICAgY29uc3QgbXNnID0gYGluc3RydW1lbnRzIGV4aXRlZCB3aXRoIGNvZGUgJyR7Y29kZX0nYDtcbiAgICBpZiAoY29kZSkge1xuICAgICAgbG9nLndhcm4obXNnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLmRlYnVnKG1zZyk7XG4gICAgfVxuICB9KTtcbiAgcHJvYy5vbignb3V0cHV0JywgKHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgKHN0ZG91dCB8fCBzdGRlcnIpLnNwbGl0KCdcXG4nKVxuICAgICAgLmZpbHRlcih4ID0+IHgubGVuZ3RoKVxuICAgICAgLm1hcCh4ID0+IGxvZy5kZWJ1ZyhgW2luc3RydW1lbnRzXSAke3h9YCkpO1xuICB9KTtcblxuICBhd2FpdCBwcm9jLnN0YXJ0KDApO1xuICB0cnkge1xuICAgIGF3YWl0IHdhaXRGb3JDb25kaXRpb24oYXN5bmMgKCkgPT4gYXdhaXQgZnMuZXhpc3RzKGxvY2FsUGF0aCksIHtcbiAgICAgIHdhaXRNczogUFJPRklMSU5HX1RJTUVPVVRfTVMsXG4gICAgICBpbnRlcnZhbE1zOiA1MDAsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwcm9jLnN0b3AoJ1NJR0tJTEwnKTtcbiAgICB9IGNhdGNoIChpZ24pIHt9XG4gICAgbG9nLmVycm9yQW5kVGhyb3coYENhbm5vdCBzdGFydCBwZXJmb3JtYW5jZSBtb25pdG9yaW5nIGZvciAnJHtwcm9maWxlTmFtZX0nIHByb2ZpbGUgaW4gJHtQUk9GSUxJTkdfVElNRU9VVF9NU31tcy4gYCArXG4gICAgICBgTWFrZSBzdXJlIHlvdSBjYW4gZXhlY3V0ZSB0aGUgc2FtZSBjb21tYW5kIG1hbnVhbGx5IGZyb20gVGVybWluYWwgYW5kIHRoZSBwcm9maWxlIG5hbWUvcGF0aCBhcmUgY29ycmVjdC5gKTtcbiAgfVxuICBSRUNPUkRFUlNfQ0FDSEVbcHJvZmlsZU5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgKFJFQ09SREVSU19DQUNIRVtwcm9maWxlTmFtZV0gfHwge30pLCB7XG4gICAgW3RoaXMub3B0cy5kZXZpY2UudWRpZF06IHtwcm9jLCBsb2NhbFBhdGh9LFxuICB9KTtcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gU3RvcFJlY29yZGluZ09wdGlvbnNcbiAqXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IHJlbW90ZVBhdGggLSBUaGUgcGF0aCB0byB0aGUgcmVtb3RlIGxvY2F0aW9uLCB3aGVyZSB0aGUgcmVzdWx0aW5nIHppcHBlZCAudHJhY2UgZmlsZSBzaG91bGQgYmUgdXBsb2FkZWQuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZm9sbG93aW5nIHByb3RvY29scyBhcmUgc3VwcG9ydGVkOiBodHRwL2h0dHBzLCBmdHAuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBOdWxsIG9yIGVtcHR5IHN0cmluZyB2YWx1ZSAodGhlIGRlZmF1bHQgc2V0dGluZykgbWVhbnMgdGhlIGNvbnRlbnQgb2YgcmVzdWx0aW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlIHNob3VsZCBiZSB6aXBwZWQsIGVuY29kZWQgYXMgQmFzZTY0IGFuZCBwYXNzZWQgYXMgdGhlIGVuZHBvaW50IHJlc3BvbnNlIHZhbHVlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duIGlmIHRoZSBnZW5lcmF0ZWQgZmlsZSBpcyB0b28gYmlnIHRvXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXQgaW50byB0aGUgYXZhaWxhYmxlIHByb2Nlc3MgbWVtb3J5LlxuICogQHByb3BlcnR5IHs/c3RyaW5nfSB1c2VyIC0gVGhlIG5hbWUgb2YgdGhlIHVzZXIgZm9yIHRoZSByZW1vdGUgYXV0aGVudGljYXRpb24uIE9ubHkgd29ya3MgaWYgYHJlbW90ZVBhdGhgIGlzIHByb3ZpZGVkLlxuICogQHByb3BlcnR5IHs/c3RyaW5nfSBwYXNzIC0gVGhlIHBhc3N3b3JkIGZvciB0aGUgcmVtb3RlIGF1dGhlbnRpY2F0aW9uLiBPbmx5IHdvcmtzIGlmIGByZW1vdGVQYXRoYCBpcyBwcm92aWRlZC5cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ30gbWV0aG9kIFtQVVRdIC0gVGhlIGh0dHAgbXVsdGlwYXJ0IHVwbG9hZCBtZXRob2QgbmFtZS4gT25seSB3b3JrcyBpZiBgcmVtb3RlUGF0aGAgaXMgcHJvdmlkZWQuXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IHByb2ZpbGVOYW1lIFtBY3Rpdml0eSBNb25pdG9yXSAtIFRoZSBuYW1lIG9mIGFuIGV4aXN0aW5nIHBlcmZvcm1hbmNlIHByb2ZpbGUgZm9yIHdoaWNoIHRoZSByZWNvcmRpbmcgaGFzIGJlZW4gbWFkZS5cbiAqL1xuXG4vKipcbiAqIFN0b3BzIHBlcmZvcm1hbmNlIHByb2ZpbGluZyBmb3IgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICogVGhlIHJlc3VsdGluZyBmaWxlIGluIC50cmFjZSBmb3JtYXQgY2FuIGJlIGVpdGhlciByZXR1cm5lZFxuICogZGlyZWN0bHkgYXMgYmFzZTY0LWVuY29kZWQgemlwIGFyY2hpdmUgb3IgdXBsb2FkZWQgdG8gYSByZW1vdGUgbG9jYXRpb25cbiAqIChzdWNoIGZpbGVzIGNhbiBiZSBwcmV0dHkgbGFyZ2UpLiBBZnRlcndhcmRzIGl0IGlzIHBvc3NpYmxlIHRvIHVuYXJjaGl2ZSBhbmRcbiAqIG9wZW4gc3VjaCBmaWxlIHdpdGggWGNvZGUgRGV2IFRvb2xzLlxuICpcbiAqIEBwYXJhbSB7P1N0b3BSZWNvcmRpbmdPcHRpb25zfSBvcHRzIC0gVGhlIHNldCBvZiBwb3NzaWJsZSBzdG9wIHJlY29yZCBvcHRpb25zXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEVpdGhlciBhbiBlbXB0eSBzdHJpbmcgaWYgdGhlIHVwbG9hZCB3YXMgc3VjY2Vzc2Z1bCBvciBiYXNlLTY0IGVuY29kZWRcbiAqIGNvbnRlbnQgb2YgemlwcGVkIC50cmFjZSBmaWxlLlxuICogQHRocm93cyB7RXJyb3J9IElmIG5vIHBlcmZvcm1hbmNlIHJlY29yZGluZyB3aXRoIGdpdmVuIHByb2ZpbGUgbmFtZS9kZXZpY2UgdWRpZCBjb21iaW5hdGlvblxuICogaGFzIGJlZW4gc3RhcnRlZCBiZWZvcmUgb3IgdGhlIHJlc3VsdGluZyAudHJhY2UgZmlsZSBoYXMgbm90IGJlZW4gZ2VuZXJhdGVkIHByb3Blcmx5LlxuICovXG5jb21tYW5kcy5tb2JpbGVTdG9wUGVyZlJlY29yZCA9IGFzeW5jIGZ1bmN0aW9uIG1vYmlsZVN0b3BQZXJmUmVjb3JkIChvcHRzID0ge30pIHtcbiAgaWYgKCF0aGlzLmlzRmVhdHVyZUVuYWJsZWQoUEVSRl9SRUNPUkRfRkVBVF9OQU1FKSAmJiAhdGhpcy5pc1JlYWxEZXZpY2UoKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KFBFUkZfUkVDT1JEX1NFQ1VSSVRZX01FU1NBR0UpO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHJlbW90ZVBhdGgsXG4gICAgdXNlcixcbiAgICBwYXNzLFxuICAgIG1ldGhvZCxcbiAgICBwcm9maWxlTmFtZSA9IERFRkFVTFRfUFJPRklMRV9OQU1FLFxuICB9ID0gb3B0cztcbiAgY29uc3QgcnVubmluZ1JlY29yZGVycyA9IFJFQ09SREVSU19DQUNIRVtwcm9maWxlTmFtZV07XG4gIGlmICghXy5pc1BsYWluT2JqZWN0KHJ1bm5pbmdSZWNvcmRlcnMpIHx8ICFydW5uaW5nUmVjb3JkZXJzW3RoaXMub3B0cy5kZXZpY2UudWRpZF0pIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgVGhlcmUgYXJlIG5vIHJlY29yZHMgZm9yIHBlcmZvcm1hbmNlIHByb2ZpbGUgJyR7cHJvZmlsZU5hbWV9JyBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgYW5kIGRldmljZSAke3RoaXMub3B0cy5kZXZpY2UudWRpZH0uIGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBIYXZlIHlvdSBzdGFydGVkIHRoZSBwcm9maWxpbmcgYmVmb3JlP2ApO1xuICB9XG5cbiAgY29uc3Qge3Byb2MsIGxvY2FsUGF0aH0gPSBydW5uaW5nUmVjb3JkZXJzW3RoaXMub3B0cy5kZXZpY2UudWRpZF07XG4gIGF3YWl0IGZpbmlzaFBlcmZSZWNvcmQocHJvYywgdHJ1ZSk7XG4gIGlmICghYXdhaXQgZnMuZXhpc3RzKGxvY2FsUGF0aCkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgVGhlcmUgaXMgbm8gLnRyYWNlIGZpbGUgZm91bmQgZm9yIHBlcmZvcm1hbmNlIHByb2ZpbGUgJyR7cHJvZmlsZU5hbWV9JyBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgYW5kIGRldmljZSAke3RoaXMub3B0cy5kZXZpY2UudWRpZH0uIGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBNYWtlIHN1cmUgdGhlIHByb2ZpbGUgaXMgc3VwcG9ydGVkIG9uIHRoaXMgZGV2aWNlLiBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgWW91IGNhbiB1c2UgJ2luc3RydW1lbnRzIC1zJyBjb21tYW5kIHRvIHNlZSB0aGUgbGlzdCBvZiBhbGwgYXZhaWxhYmxlIHByb2ZpbGVzLmApO1xuICB9XG5cbiAgY29uc3QgemlwUGF0aCA9IGAke2xvY2FsUGF0aH0uemlwYDtcbiAgY29uc3QgemlwQXJncyA9IFtcbiAgICAnLTknLCAnLXInLCB6aXBQYXRoLFxuICAgIHBhdGguYmFzZW5hbWUobG9jYWxQYXRoKSxcbiAgXTtcbiAgbG9nLmluZm8oYEZvdW5kIHBlcmYgdHJhY2UgcmVjb3JkICcke2xvY2FsUGF0aH0nLiBDb21wcmVzc2luZyBpdCB3aXRoICd6aXAgJHt6aXBBcmdzLmpvaW4oJyAnKX0nYCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZXhlYygnemlwJywgemlwQXJncywge1xuICAgICAgY3dkOiBwYXRoLmRpcm5hbWUobG9jYWxQYXRoKSxcbiAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgdXBsb2FkVHJhY2UoemlwUGF0aCwgcmVtb3RlUGF0aCwge3VzZXIsIHBhc3MsIG1ldGhvZH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGRlbGV0ZSBydW5uaW5nUmVjb3JkZXJzW3RoaXMub3B0cy5kZXZpY2UudWRpZF07XG4gICAgaWYgKGF3YWl0IGZzLmV4aXN0cyhsb2NhbFBhdGgpKSB7XG4gICAgICBhd2FpdCBmcy5yaW1yYWYobG9jYWxQYXRoKTtcbiAgICB9XG4gIH1cbn07XG5cblxuZXhwb3J0IHsgY29tbWFuZHMgfTtcbmV4cG9ydCBkZWZhdWx0IGNvbW1hbmRzO1xuIl0sImZpbGUiOiJsaWIvY29tbWFuZHMvcGVyZm9ybWFuY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
