"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.install = install;
exports.needsInstall = needsInstall;
exports.SAFARI_LAUNCHER_BUNDLE = exports.SAFARI_LAUNCHER_APP_FILE = void 0;

require("source-map-support/register");

var _appiumXcode = _interopRequireDefault(require("appium-xcode"));

var _appiumSupport = require("appium-support");

var _teen_process = require("teen_process");

var _logger = _interopRequireDefault(require("./logger"));

var _path = _interopRequireDefault(require("path"));

const SAFARI_LAUNCHER_DIR = _path.default.resolve(__dirname, '..', '..', 'build', 'SafariLauncher');

const SAFARI_LAUNCHER_APP_FILE = _path.default.resolve(__dirname, '..', '..', 'build', 'SafariLauncher', 'SafariLauncher.app');

exports.SAFARI_LAUNCHER_APP_FILE = SAFARI_LAUNCHER_APP_FILE;

const SAFARI_LAUNCHER_REPO = _path.default.resolve(__dirname, '..', '..', 'node_modules', 'safari-launcher');

const SAFARI_LAUNCHER_CONFIG_FILE = _path.default.resolve(SAFARI_LAUNCHER_REPO, 'build.xcconfig');

const SAFARI_LAUNCHER_BUNDLE = 'com.bytearc.SafariLauncher';
exports.SAFARI_LAUNCHER_BUNDLE = SAFARI_LAUNCHER_BUNDLE;
const sdks = ['iphoneos'];

async function cleanApp(appRoot, sdk) {
  _logger.default.debug(`Cleaning SafariLauncher for ${sdk}`);

  try {
    await (0, _teen_process.exec)('xcodebuild', ['-sdk', sdk, 'clean'], {
      cwd: appRoot
    });
  } catch (err) {
    _logger.default.error(err);

    throw err;
  }
}

async function cleanAll() {
  _logger.default.info("Cleaning SafariLauncher");

  let sdkVer = await _appiumXcode.default.getMaxIOSSDK();

  for (let sdk of sdks) {
    let fullSdk = sdk + sdkVer;
    await cleanApp(SAFARI_LAUNCHER_REPO, fullSdk);
  }

  await _appiumSupport.fs.rimraf(SAFARI_LAUNCHER_DIR);

  _logger.default.info("Finished cleaning SafariLauncher");
}

async function buildApp(appRoot, sdk) {
  try {
    _logger.default.debug(`Building SafariLauncher for ${sdk}`);

    let args = ['-sdk', sdk, '-xcconfig', SAFARI_LAUNCHER_CONFIG_FILE];
    await (0, _teen_process.exec)('xcodebuild', args, {
      cwd: appRoot
    });
  } catch (err) {
    _logger.default.error(err);

    throw err;
  }
}

async function buildAll() {
  _logger.default.info("Building SafariLauncher");

  let sdkVer = await _appiumXcode.default.getMaxIOSSDK();

  for (let sdk of sdks) {
    let fullSdk = sdk + sdkVer;
    await buildApp(SAFARI_LAUNCHER_REPO, fullSdk);
  }

  _logger.default.info("Finished building SafariLauncher");
}

async function renameAll() {
  try {
    _logger.default.info("Renaming SafariLauncher");

    if (!(await _appiumSupport.fs.exists(SAFARI_LAUNCHER_DIR))) {
      await _appiumSupport.fs.mkdir(SAFARI_LAUNCHER_DIR);
    }

    let file = _path.default.resolve(SAFARI_LAUNCHER_REPO, 'build', 'Release-iphoneos', 'SafariLauncher.app');

    await _appiumSupport.fs.rename(file, SAFARI_LAUNCHER_APP_FILE);

    _logger.default.info("Finished renaming SafariLauncher");
  } catch (err) {
    _logger.default.warn("Could not rename SafariLauncher");

    _logger.default.errorAndThrow(err);
  }
}

async function updateConfig() {
  _logger.default.info('Updating config for Safari Launcher');

  let config = `BUNDLE_ID = ${SAFARI_LAUNCHER_BUNDLE}
IDENTITY_NAME = iPhone Developer
IDENTITY_CODE =`;
  await _appiumSupport.fs.writeFile(SAFARI_LAUNCHER_CONFIG_FILE, config);
}

async function install() {
  await cleanAll();
  await updateConfig();
  await buildAll();
  await renameAll();
}

async function needsInstall() {
  _logger.default.debug(`Checking for presence of SafariLauncher at '${SAFARI_LAUNCHER_APP_FILE}'`);

  let exists = await _appiumSupport.fs.exists(SAFARI_LAUNCHER_APP_FILE);

  _logger.default.debug(`SafariLauncher ${exists ? 'exists' : 'does not exist'}`);

  return !exists;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zYWZhcmktbGF1bmNoZXIuanMiXSwibmFtZXMiOlsiU0FGQVJJX0xBVU5DSEVSX0RJUiIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwiU0FGQVJJX0xBVU5DSEVSX0FQUF9GSUxFIiwiU0FGQVJJX0xBVU5DSEVSX1JFUE8iLCJTQUZBUklfTEFVTkNIRVJfQ09ORklHX0ZJTEUiLCJTQUZBUklfTEFVTkNIRVJfQlVORExFIiwic2RrcyIsImNsZWFuQXBwIiwiYXBwUm9vdCIsInNkayIsImxvZ2dlciIsImRlYnVnIiwiY3dkIiwiZXJyIiwiZXJyb3IiLCJjbGVhbkFsbCIsImluZm8iLCJzZGtWZXIiLCJ4Y29kZSIsImdldE1heElPU1NESyIsImZ1bGxTZGsiLCJmcyIsInJpbXJhZiIsImJ1aWxkQXBwIiwiYXJncyIsImJ1aWxkQWxsIiwicmVuYW1lQWxsIiwiZXhpc3RzIiwibWtkaXIiLCJmaWxlIiwicmVuYW1lIiwid2FybiIsImVycm9yQW5kVGhyb3ciLCJ1cGRhdGVDb25maWciLCJjb25maWciLCJ3cml0ZUZpbGUiLCJpbnN0YWxsIiwibmVlZHNJbnN0YWxsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsTUFBTUEsbUJBQW1CLEdBQUdDLGNBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUNrQixPQURsQixFQUMyQixnQkFEM0IsQ0FBNUI7O0FBRUEsTUFBTUMsd0JBQXdCLEdBQUdILGNBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUNhLE9BRGIsRUFDc0IsZ0JBRHRCLEVBRWEsb0JBRmIsQ0FBakM7Ozs7QUFHQSxNQUFNRSxvQkFBb0IsR0FBR0osY0FBS0MsT0FBTCxDQUFhQyxTQUFiLEVBQXdCLElBQXhCLEVBQThCLElBQTlCLEVBQ2EsY0FEYixFQUM2QixpQkFEN0IsQ0FBN0I7O0FBRUEsTUFBTUcs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QUVELGVBQWVvQixZQUFmLEdBQStCO0FBQzdCdkIsa0JBQU9NLElBQVAsQ0FBWSxxQ0FBWjs7QUFDQSxNQUFJa0IsTUFBTSxHQUFJLGVBQWM3QixzQkFBdUI7O2dCQUFuRDtBQUdBLFFBQU1nQixrQkFBR2MsU0FBSCxDQUFhL0IsMkJBQWIsRUFBMEM4QixNQUExQyxDQUFOO0FBQ0Q7O0FBRUQsZUFBZUUsT0FBZixHQUEwQjtBQUN4QixRQUFNckIsUUFBUSxFQUFkO0FBQ0EsUUFBTWtCLFlBQVksRUFBbEI7QUFDQSxRQUFNUixRQUFRLEVBQWQ7QUFDQSxRQUFNQyxTQUFTLEVBQWY7QUFDRDs7QUFFRCxlQUFlVyxZQUFmLEdBQStCO0FBQzdCM0Isa0JBQU9DLEtBQVAsQ0FBYywrQ0FBOENULHdCQUF5QixHQUFyRjs7QUFDQSxNQUFJeUIsTUFBTSxHQUFHLE1BQU1OLGtCQUFHTSxNQUFILENBQVV6Qix3QkFBVixDQUFuQjs7QUFDQVEsa0JBQU9DLEtBQVAsQ0FBYyxrQkFBaUJnQixNQUFNLEdBQUcsUUFBSCxHQUFjLGdCQUFpQixFQUFwRTs7QUFDQSxTQUFPLENBQUNBLE1BQVI7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB4Y29kZSBmcm9tICdhcHBpdW0teGNvZGUnO1xuaW1wb3J0IHsgZnMgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cblxuY29uc3QgU0FGQVJJX0xBVU5DSEVSX0RJUiA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2J1aWxkJywgJ1NhZmFyaUxhdW5jaGVyJyk7XG5jb25zdCBTQUZBUklfTEFVTkNIRVJfQVBQX0ZJTEUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdidWlsZCcsICdTYWZhcmlMYXVuY2hlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1NhZmFyaUxhdW5jaGVyLmFwcCcpO1xuY29uc3QgU0FGQVJJX0xBVU5DSEVSX1JFUE8gPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25vZGVfbW9kdWxlcycsICdzYWZhcmktbGF1bmNoZXInKTtcbmNvbnN0IFNBRkFSSV9MQVVOQ0hFUl9DT05GSUdfRklMRSA9IHBhdGgucmVzb2x2ZShTQUZBUklfTEFVTkNIRVJfUkVQTywgJ2J1aWxkLnhjY29uZmlnJyk7XG5jb25zdCBTQUZBUklfTEFVTkNIRVJfQlVORExFID0gJ2NvbS5ieXRlYXJjLlNhZmFyaUxhdW5jaGVyJztcblxuY29uc3Qgc2RrcyA9IFsnaXBob25lb3MnXTtcblxuYXN5bmMgZnVuY3Rpb24gY2xlYW5BcHAgKGFwcFJvb3QsIHNkaykge1xuICBsb2dnZXIuZGVidWcoYENsZWFuaW5nIFNhZmFyaUxhdW5jaGVyIGZvciAke3Nka31gKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBleGVjKCd4Y29kZWJ1aWxkJywgWyctc2RrJywgc2RrLCAnY2xlYW4nXSwge2N3ZDogYXBwUm9vdH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2dnZXIuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2xlYW5BbGwgKCkge1xuICBsb2dnZXIuaW5mbyhcIkNsZWFuaW5nIFNhZmFyaUxhdW5jaGVyXCIpO1xuICBsZXQgc2RrVmVyID0gYXdhaXQgeGNvZGUuZ2V0TWF4SU9TU0RLKCk7XG4gIGZvciAobGV0IHNkayBvZiBzZGtzKSB7XG4gICAgbGV0IGZ1bGxTZGsgPSBzZGsgKyBzZGtWZXI7XG4gICAgYXdhaXQgY2xlYW5BcHAoU0FGQVJJX0xBVU5DSEVSX1JFUE8sIGZ1bGxTZGspO1xuICB9XG4gIGF3YWl0IGZzLnJpbXJhZihTQUZBUklfTEFVTkNIRVJfRElSKTtcbiAgbG9nZ2VyLmluZm8oXCJGaW5pc2hlZCBjbGVhbmluZyBTYWZhcmlMYXVuY2hlclwiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRBcHAgKGFwcFJvb3QsIHNkaykge1xuICB0cnkge1xuICAgIGxvZ2dlci5kZWJ1ZyhgQnVpbGRpbmcgU2FmYXJpTGF1bmNoZXIgZm9yICR7c2RrfWApO1xuICAgIGxldCBhcmdzID0gWyctc2RrJywgc2RrLCAnLXhjY29uZmlnJywgU0FGQVJJX0xBVU5DSEVSX0NPTkZJR19GSUxFXTtcbiAgICBhd2FpdCBleGVjKCd4Y29kZWJ1aWxkJywgYXJncywge1xuICAgICAgY3dkOiBhcHBSb290XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZ2dlci5lcnJvcihlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBidWlsZEFsbCAoKSB7XG4gIGxvZ2dlci5pbmZvKFwiQnVpbGRpbmcgU2FmYXJpTGF1bmNoZXJcIik7XG4gIGxldCBzZGtWZXIgPSBhd2FpdCB4Y29kZS5nZXRNYXhJT1NTREsoKTtcbiAgZm9yIChsZXQgc2RrIG9mIHNka3MpIHtcbiAgICBsZXQgZnVsbFNkayA9IHNkayArIHNka1ZlcjtcbiAgICBhd2FpdCBidWlsZEFwcChTQUZBUklfTEFVTkNIRVJfUkVQTywgZnVsbFNkayk7XG4gIH1cbiAgbG9nZ2VyLmluZm8oXCJGaW5pc2hlZCBidWlsZGluZyBTYWZhcmlMYXVuY2hlclwiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVuYW1lQWxsICgpIHtcbiAgdHJ5IHtcbiAgICBsb2dnZXIuaW5mbyhcIlJlbmFtaW5nIFNhZmFyaUxhdW5jaGVyXCIpO1xuICAgIGlmICghYXdhaXQgZnMuZXhpc3RzKFNBRkFSSV9MQVVOQ0hFUl9ESVIpKSB7XG4gICAgICBhd2FpdCBmcy5ta2RpcihTQUZBUklfTEFVTkNIRVJfRElSKTtcbiAgICB9XG5cbiAgICBsZXQgZmlsZSA9IHBhdGgucmVzb2x2ZShTQUZBUklfTEFVTkNIRVJfUkVQTywgJ2J1aWxkJywgJ1JlbGVhc2UtaXBob25lb3MnLCAnU2FmYXJpTGF1bmNoZXIuYXBwJyk7XG4gICAgYXdhaXQgZnMucmVuYW1lKFxuICAgICAgZmlsZSxcbiAgICAgIFNBRkFSSV9MQVVOQ0hFUl9BUFBfRklMRSk7XG4gICAgbG9nZ2VyLmluZm8oXCJGaW5pc2hlZCByZW5hbWluZyBTYWZhcmlMYXVuY2hlclwiKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nZ2VyLndhcm4oXCJDb3VsZCBub3QgcmVuYW1lIFNhZmFyaUxhdW5jaGVyXCIpO1xuICAgIGxvZ2dlci5lcnJvckFuZFRocm93KGVycik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICgpIHtcbiAgbG9nZ2VyLmluZm8oJ1VwZGF0aW5nIGNvbmZpZyBmb3IgU2FmYXJpIExhdW5jaGVyJyk7XG4gIGxldCBjb25maWcgPSBgQlVORExFX0lEID0gJHtTQUZBUklfTEFVTkNIRVJfQlVORExFfVxuSURFTlRJVFlfTkFNRSA9IGlQaG9uZSBEZXZlbG9wZXJcbklERU5USVRZX0NPREUgPWA7XG4gIGF3YWl0IGZzLndyaXRlRmlsZShTQUZBUklfTEFVTkNIRVJfQ09ORklHX0ZJTEUsIGNvbmZpZyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwgKCkge1xuICBhd2FpdCBjbGVhbkFsbCgpO1xuICBhd2FpdCB1cGRhdGVDb25maWcoKTtcbiAgYXdhaXQgYnVpbGRBbGwoKTtcbiAgYXdhaXQgcmVuYW1lQWxsKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG5lZWRzSW5zdGFsbCAoKSB7XG4gIGxvZ2dlci5kZWJ1ZyhgQ2hlY2tpbmcgZm9yIHByZXNlbmNlIG9mIFNhZmFyaUxhdW5jaGVyIGF0ICcke1NBRkFSSV9MQVVOQ0hFUl9BUFBfRklMRX0nYCk7XG4gIGxldCBleGlzdHMgPSBhd2FpdCBmcy5leGlzdHMoU0FGQVJJX0xBVU5DSEVSX0FQUF9GSUxFKTtcbiAgbG9nZ2VyLmRlYnVnKGBTYWZhcmlMYXVuY2hlciAke2V4aXN0cyA/ICdleGlzdHMnIDogJ2RvZXMgbm90IGV4aXN0J31gKTtcbiAgcmV0dXJuICFleGlzdHM7XG59XG5cblxuZXhwb3J0IHsgaW5zdGFsbCwgbmVlZHNJbnN0YWxsLCBTQUZBUklfTEFVTkNIRVJfQVBQX0ZJTEUsIFNBRkFSSV9MQVVOQ0hFUl9CVU5ETEUgfTtcbiJdLCJmaWxlIjoibGliL3NhZmFyaS1sYXVuY2hlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9