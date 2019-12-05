"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultArgs = getDefaultArgs;
exports.getParser = getParser;
exports.default = void 0;

require("source-map-support/register");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _argparse = require("argparse");

var _utils = require("./utils");

const args = [[['--shell'], {
  required: false,
  defaultValue: null,
  help: 'Enter REPL mode',
  nargs: 0,
  dest: 'shell'
}], [['--allow-cors'], {
  required: false,
  defaultValue: false,
  action: 'storeTrue',
  help: 'Whether the Appium server should allow web browser connections from any host',
  nargs: 0,
  dest: 'allowCors'
}], [['--reboot'], {
  defaultValue: false,
  dest: 'reboot',
  action: 'storeTrue',
  required: false,
  help: '(Android-only) reboot emulator after each session and kill it at the end',
  nargs: 0
}], [['--ipa'], {
  required: false,
  defaultValue: null,
  help: '(IOS-only) abs path to compiled .ipa file',
  example: '/abs/path/to/my.ipa',
  dest: 'ipa'
}], [['-a', '--address'], {
  defaultValue: '0.0.0.0',
  required: false,
  example: '0.0.0.0',
  help: 'IP Address to listen on',
  dest: 'address'
}], [['-p', '--port'], {
  defaultValue: 4723,
  required: false,
  type: 'int',
  example: '4723',
  help: 'port to listen on',
  dest: 'port'
}], [['-ca', '--callback-address'], {
  required: false,
  dest: 'callbackAddress',
  defaultValue: null,
  example: '127.0.0.1',
  help: 'callback IP Address (default: same as --address)'
}], [['-cp', '--callback-port'], {
  required: false,
  dest: 'callbackPort',
  defaultValue: null,
  type: 'int',
  example: '4723',
  help: 'callback port (default: same as port)'
}], [['-bp', '--bootstrap-port'], {
  defaultValue: 4724,
  dest: 'bootstrapPort',
  required: false,
  type: 'int',
  example: '4724',
  help: '(Android-only) port to use on device to talk to Appium'
}], [['-r', '--backend-retries'], {
  defaultValue: 3,
  dest: 'backendRetries',
  required: false,
  type: 'int',
  example: '3',
  help: '(iOS-only) How many times to retry launching Instruments ' + 'before saying it crashed or timed out'
}], [['--session-override'], {
  defaultValue: false,
  dest: 'sessionOverride',
  action: 'storeTrue',
  required: false,
  help: 'Enables session override (clobbering)',
  nargs: 0
}], [['-l', '--pre-launch'], {
  defaultValue: false,
  dest: 'launch',
  action: 'storeTrue',
  required: false,
  help: 'Pre-launch the application before allowing the first session ' + '(Requires --app and, for Android, --app-pkg and --app-activity)',
  nargs: 0
}], [['-g', '--log'], {
  defaultValue: null,
  dest: 'logFile',
  required: false,
  example: '/path/to/appium.log',
  help: 'Also send log output to this file'
}], [['--log-level'], {
  choices: ['info', 'info:debug', 'info:info', 'info:warn', 'info:error', 'warn', 'warn:debug', 'warn:info', 'warn:warn', 'warn:error', 'error', 'error:debug', 'error:info', 'error:warn', 'error:error', 'debug', 'debug:debug', 'debug:info', 'debug:warn', 'debug:error'],
  defaultValue: 'debug',
  dest: 'loglevel',
  required: false,
  example: 'debug',
  help: 'log level; default (console[:file]): debug[:debug]'
}], [['--log-timestamp'], {
  defaultValue: false,
  required: false,
  help: 'Show timestamps in console output',
  nargs: 0,
  action: 'storeTrue',
  dest: 'logTimestamp'
}], [['--local-timezone'], {
  defaultValue: false,
  required: false,
  help: 'Use local timezone for timestamps',
  nargs: 0,
  action: 'storeTrue',
  dest: 'localTimezone'
}], [['--log-no-colors'], {
  defaultValue: false,
  required: false,
  help: 'Do not use colors in console output',
  nargs: 0,
  action: 'storeTrue',
  dest: 'logNoColors'
}], [['-G', '--webhook'], {
  defaultValue: null,
  required: false,
  example: 'localhost:9876',
  dest: 'webhook',
  help: 'Also send log output to this HTTP listener'
}], [['--safari'], {
  defaultValue: false,
  action: 'storeTrue',
  dest: 'safari',
  required: false,
  help: '(IOS-Only) Use the safari app',
  nargs: 0
}], [['--default-device', '-dd'], {
  dest: 'defaultDevice',
  defaultValue: false,
  action: 'storeTrue',
  required: false,
  help: '(IOS-Simulator-only) use the default simulator that instruments ' + 'launches on its own'
}], [['--force-iphone'], {
  defaultValue: false,
  dest: 'forceIphone',
  action: 'storeTrue',
  required: false,
  help: '(IOS-only) Use the iPhone Simulator no matter what the app wants',
  nargs: 0
}], [['--force-ipad'], {
  defaultValue: false,
  dest: 'forceIpad',
  action: 'storeTrue',
  required: false,
  help: '(IOS-only) Use the iPad Simulator no matter what the app wants',
  nargs: 0
}], [['--tracetemplate'], {
  defaultValue: null,
  dest: 'automationTraceTemplatePath',
  required: false,
  example: '/Users/me/Automation.tracetemplate',
  help: '(IOS-only) .tracetemplate file to use with Instruments'
}], [['--instruments'], {
  defaultValue: null,
  dest: 'instrumentsPath',
  require: false,
  example: '/path/to/instruments',
  help: '(IOS-only) path to instruments binary'
}], [['--nodeconfig'], {
  required: false,
  defaultValue: null,
  dest: 'nodeconfig',
  help: 'Configuration JSON file to register appium with selenium grid',
  example: '/abs/path/to/nodeconfig.json'
}], [['-ra', '--robot-address'], {
  defaultValue: '0.0.0.0',
  dest: 'robotAddress',
  required: false,
  example: '0.0.0.0',
  help: 'IP Address of robot'
}], [['-rp', '--robot-port'], {
  defaultValue: -1,
  dest: 'robotPort',
  required: false,
  type: 'int',
  example: '4242',
  help: 'port for robot'
}], [['--selendroid-port'], {
  defaultValue: 8080,
  dest: 'selendroidPort',
  required: false,
  type: 'int',
  example: '8080',
  help: 'Local port used for communication with Selendroid'
}], [['--chromedriver-port'], {
  defaultValue: null,
  dest: 'chromeDriverPort',
  required: false,
  type: 'int',
  example: '9515',
  help: 'Port upon which ChromeDriver will run. If not given, Android driver will pick a random available port.'
}], [['--chromedriver-executable'], {
  defaultValue: null,
  dest: 'chromedriverExecutable',
  required: false,
  help: 'ChromeDriver executable full path'
}], [['--show-config'], {
  defaultValue: false,
  dest: 'showConfig',
  action: 'storeTrue',
  required: false,
  help: 'Show info about the appium server configuration and exit'
}], [['--no-perms-check'], {
  defaultValue: false,
  dest: 'noPermsCheck',
  action: 'storeTrue',
  required: false,
  help: 'Bypass Appium\'s checks to ensure we can read/write necessary files'
}], [['--strict-caps'], {
  defaultValue: false,
  dest: 'enforceStrictCaps',
  action: 'storeTrue',
  required: false,
  help: 'Cause sessions to fail if desired caps are sent in that Appium ' + 'does not recognize as valid for the selected device',
  nargs: 0
}], [['--isolate-sim-device'], {
  defaultValue: false,
  dest: 'isolateSimDevice',
  action: 'storeTrue',
  required: false,
  help: 'Xcode 6 has a bug on some platforms where a certain simulator ' + 'can only be launched without error if all other simulator devices ' + 'are first deleted. This option causes Appium to delete all ' + 'devices other than the one being used by Appium. Note that this ' + 'is a permanent deletion, and you are responsible for using simctl ' + 'or xcode to manage the categories of devices used with Appium.',
  nargs: 0
}], [['--tmp'], {
  defaultValue: null,
  dest: 'tmpDir',
  required: false,
  help: 'Absolute path to directory Appium can use to manage temporary ' + 'files, like built-in iOS apps it needs to move around. On *nix/Mac ' + 'defaults to /tmp, on Windows defaults to C:\\Windows\\Temp'
}], [['--trace-dir'], {
  defaultValue: null,
  dest: 'traceDir',
  required: false,
  help: 'Absolute path to directory Appium use to save ios instruments ' + 'traces, defaults to <tmp dir>/appium-instruments'
}], [['--debug-log-spacing'], {
  dest: 'debugLogSpacing',
  defaultValue: false,
  action: 'storeTrue',
  required: false,
  help: 'Add exaggerated spacing in logs to help with visual inspection'
}], [['--suppress-adb-kill-server'], {
  dest: 'suppressKillServer',
  defaultValue: false,
  action: 'storeTrue',
  required: false,
  help: '(Android-only) If set, prevents Appium from killing the adb server instance',
  nargs: 0
}], [['--long-stacktrace'], {
  dest: 'longStacktrace',
  defaultValue: false,
  required: false,
  action: 'storeTrue',
  help: 'Add long stack traces to log entries. Recommended for debugging only.'
}], [['--webkit-debug-proxy-port'], {
  defaultValue: 27753,
  dest: 'webkitDebugProxyPort',
  required: false,
  type: 'int',
  example: "27753",
  help: '(IOS-only) Local port used for communication with ios-webkit-debug-proxy'
}], [['--webdriveragent-port'], {
  defaultValue: 8100,
  dest: 'wdaLocalPort',
  required: false,
  type: 'int',
  example: "8100",
  help: '(IOS-only, XCUITest-only) Local port used for communication with WebDriverAgent'
}], [['-dc', '--default-capabilities'], {
  dest: 'defaultCapabilities',
  defaultValue: {},
  type: parseDefaultCaps,
  required: false,
  example: '[ \'{"app": "myapp.app", "deviceName": "iPhone Simulator"}\' ' + '| /path/to/caps.json ]',
  help: 'Set the default desired capabilities, which will be set on each ' + 'session unless overridden by received capabilities.'
}], [['--enable-heapdump'], {
  defaultValue: false,
  dest: 'heapdumpEnabled',
  action: 'storeTrue',
  required: false,
  help: 'Enable collection of NodeJS memory heap dumps. This is useful for memory leaks lookup',
  nargs: 0
}], [['--relaxed-security'], {
  defaultValue: false,
  dest: 'relaxedSecurityEnabled',
  action: 'storeTrue',
  required: false,
  help: 'Disable additional security checks, so it is possible to use some advanced features, provided ' + 'by drivers supporting this option. Only enable it if all the ' + 'clients are in the trusted network and it\'s not the case if a client could potentially ' + 'break out of the session sandbox.',
  nargs: 0
}]];
const deprecatedArgs = [[['--command-timeout'], {
  defaultValue: 60,
  dest: 'defaultCommandTimeout',
  type: 'int',
  required: false,
  help: '[DEPRECATED] No effect. This used to be the default command ' + 'timeout for the server to use for all sessions (in seconds and ' + 'should be less than 2147483). Use newCommandTimeout cap instead'
}], [['-k', '--keep-artifacts'], {
  defaultValue: false,
  dest: 'keepArtifacts',
  action: 'storeTrue',
  required: false,
  help: '[DEPRECATED] - no effect, trace is now in tmp dir by default and is ' + 'cleared before each run. Please also refer to the --trace-dir flag.',
  nargs: 0
}], [['--platform-name'], {
  dest: 'platformName',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: 'iOS',
  help: '[DEPRECATED] - Name of the mobile platform: iOS, Android, or FirefoxOS'
}], [['--platform-version'], {
  dest: 'platformVersion',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: '7.1',
  help: '[DEPRECATED] - Version of the mobile platform'
}], [['--automation-name'], {
  dest: 'automationName',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: 'Appium',
  help: '[DEPRECATED] - Name of the automation tool: Appium or Selendroid'
}], [['--device-name'], {
  dest: 'deviceName',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: 'iPhone Retina (4-inch), Android Emulator',
  help: '[DEPRECATED] - Name of the mobile device to use'
}], [['--browser-name'], {
  dest: 'browserName',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: 'Safari',
  help: '[DEPRECATED] - Name of the mobile browser: Safari or Chrome'
}], [['--app'], {
  dest: 'app',
  required: false,
  defaultValue: null,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - IOS: abs path to simulator-compiled .app file or the bundle_id of the desired target on device; Android: abs path to .apk file',
  example: '/abs/path/to/my.app'
}], [['-lt', '--launch-timeout'], {
  defaultValue: 90000,
  dest: 'launchTimeout',
  type: 'int',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (iOS-only) how long in ms to wait for Instruments to launch'
}], [['--language'], {
  defaultValue: null,
  dest: 'language',
  required: false,
  example: 'en',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - Language for the iOS simulator / Android Emulator'
}], [['--locale'], {
  defaultValue: null,
  dest: 'locale',
  required: false,
  example: 'en_US',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - Locale for the iOS simulator / Android Emulator'
}], [['-U', '--udid'], {
  dest: 'udid',
  required: false,
  defaultValue: null,
  example: '1adsf-sdfas-asdf-123sdf',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - Unique device identifier of the connected physical device'
}], [['--orientation'], {
  dest: 'orientation',
  defaultValue: null,
  required: false,
  example: 'LANDSCAPE',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (IOS-only) use LANDSCAPE or PORTRAIT to initialize all requests ' + 'to this orientation'
}], [['--no-reset'], {
  defaultValue: false,
  dest: 'noReset',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - Do not reset app state between sessions (IOS: do not delete app ' + 'plist files; Android: do not uninstall app before new session)',
  nargs: 0
}], [['--full-reset'], {
  defaultValue: false,
  dest: 'fullReset',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (iOS) Delete the entire simulator folder. (Android) Reset app ' + 'state by uninstalling app instead of clearing app data. On ' + 'Android, this will also remove the app after the session is complete.',
  nargs: 0
}], [['--app-pkg'], {
  dest: 'appPackage',
  defaultValue: null,
  required: false,
  deprecatedFor: '--default-capabilities',
  example: 'com.example.android.myApp',
  help: '[DEPRECATED] - (Android-only) Java package of the Android app you want to run ' + '(e.g., com.example.android.myApp)'
}], [['--app-activity'], {
  dest: 'appActivity',
  defaultValue: null,
  required: false,
  example: 'MainActivity',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Activity name for the Android activity you want ' + 'to launch from your package (e.g., MainActivity)'
}], [['--app-wait-package'], {
  dest: 'appWaitPackage',
  defaultValue: false,
  required: false,
  example: 'com.example.android.myApp',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Package name for the Android activity you want ' + 'to wait for (e.g., com.example.android.myApp)'
}], [['--app-wait-activity'], {
  dest: 'appWaitActivity',
  defaultValue: false,
  required: false,
  example: 'SplashActivity',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Activity name for the Android activity you want ' + 'to wait for (e.g., SplashActivity)'
}], [['--device-ready-timeout'], {
  dest: 'deviceReadyTimeout',
  defaultValue: 5,
  required: false,
  type: 'int',
  example: '5',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Timeout in seconds while waiting for device to become ready'
}], [['--android-coverage'], {
  dest: 'androidCoverage',
  defaultValue: false,
  required: false,
  example: 'com.my.Pkg/com.my.Pkg.instrumentation.MyInstrumentation',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Fully qualified instrumentation class. Passed to -w in ' + 'adb shell am instrument -e coverage true -w '
}], [['--avd'], {
  dest: 'avd',
  defaultValue: null,
  required: false,
  example: '@default',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Name of the avd to launch'
}], [['--avd-args'], {
  dest: 'avdArgs',
  defaultValue: null,
  required: false,
  example: '-no-snapshot-load',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Additional emulator arguments to launch the avd'
}], [['--use-keystore'], {
  defaultValue: false,
  dest: 'useKeystore',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) When set the keystore will be used to sign apks.'
}], [['--keystore-path'], {
  defaultValue: _path.default.resolve(process.env.HOME || process.env.USERPROFILE || '', '.android', 'debug.keystore'),
  dest: 'keystorePath',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Path to keystore'
}], [['--keystore-password'], {
  defaultValue: 'android',
  dest: 'keystorePassword',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Password to keystore'
}], [['--key-alias'], {
  defaultValue: 'androiddebugkey',
  dest: 'keyAlias',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Key alias'
}], [['--key-password'], {
  defaultValue: 'android',
  dest: 'keyPassword',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Key password'
}], [['--intent-action'], {
  dest: 'intentAction',
  defaultValue: 'android.intent.action.MAIN',
  required: false,
  example: 'android.intent.action.MAIN',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Intent action which will be used to start activity'
}], [['--intent-category'], {
  dest: 'intentCategory',
  defaultValue: 'android.intent.category.LAUNCHER',
  required: false,
  example: 'android.intent.category.APP_CONTACTS',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Intent category which will be used to start activity'
}], [['--intent-flags'], {
  dest: 'intentFlags',
  defaultValue: '0x10200000',
  required: false,
  example: '0x10200000',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Flags that will be used to start activity'
}], [['--intent-args'], {
  dest: 'optionalIntentArguments',
  defaultValue: null,
  required: false,
  example: '0x10200000',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) Additional intent arguments that will be used to ' + 'start activity'
}], [['--dont-stop-app-on-reset'], {
  dest: 'dontStopAppOnReset',
  defaultValue: false,
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (Android-only) When included, refrains from stopping the app before restart'
}], [['--calendar-format'], {
  defaultValue: null,
  dest: 'calendarFormat',
  required: false,
  example: 'gregorian',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (IOS-only) calendar format for the iOS simulator'
}], [['--native-instruments-lib'], {
  defaultValue: false,
  dest: 'nativeInstrumentsLib',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (IOS-only) IOS has a weird built-in unavoidable ' + 'delay. We patch this in appium. If you do not want it patched, ' + 'pass in this flag.',
  nargs: 0
}], [['--keep-keychains'], {
  defaultValue: false,
  dest: 'keepKeyChains',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (iOS-only) Whether to keep keychains (Library/Keychains) when reset app between sessions',
  nargs: 0
}], [['--localizable-strings-dir'], {
  required: false,
  dest: 'localizableStringsDir',
  defaultValue: 'en.lproj',
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (IOS-only) the relative path of the dir where Localizable.strings file resides ',
  example: 'en.lproj'
}], [['--show-ios-log'], {
  defaultValue: false,
  dest: 'showIOSLog',
  action: 'storeTrue',
  required: false,
  deprecatedFor: '--default-capabilities',
  help: '[DEPRECATED] - (IOS-only) if set, the iOS system log will be written to the console',
  nargs: 0
}], [['--async-trace'], {
  dest: 'longStacktrace',
  defaultValue: false,
  required: false,
  action: 'storeTrue',
  deprecatedFor: '--long-stacktrace',
  help: '[DEPRECATED] - Add long stack traces to log entries. Recommended for debugging only.'
}]];

function updateParseArgsForDefaultCapabilities(parser) {
  parser._parseArgs = parser.parseArgs;

  parser.parseArgs = function (args) {
    let parsedArgs = parser._parseArgs(args);

    parsedArgs.defaultCapabilities = parsedArgs.defaultCapabilities || {};

    for (let argEntry of deprecatedArgs) {
      let arg = argEntry[1].dest;

      if (argEntry[1].deprecatedFor === '--default-capabilities') {
        if (arg in parsedArgs && parsedArgs[arg] !== argEntry[1].defaultValue) {
          parsedArgs.defaultCapabilities[arg] = parsedArgs[arg];
          let capDict = {
            [arg]: parsedArgs[arg]
          };
          argEntry[1].deprecatedFor = `--default-capabilities ` + `'${JSON.stringify(capDict)}'`;
        }
      }
    }

    return parsedArgs;
  };
}

function parseDefaultCaps(caps) {
  try {
    if (_fs.default.statSync(caps).isFile()) {
      caps = _fs.default.readFileSync(caps, 'utf8');
    }
  } catch (err) {}

  caps = JSON.parse(caps);

  if (!_lodash.default.isPlainObject(caps)) {
    throw 'Invalid format for default capabilities';
  }

  return caps;
}

function getParser() {
  let parser = new _argparse.ArgumentParser({
    version: require(_path.default.resolve(_utils.rootDir, 'package.json')).version,
    addHelp: true,
    description: 'A webdriver-compatible server for use with native and hybrid iOS and Android applications.',
    prog: process.argv[1] || 'Appium'
  });

  let allArgs = _lodash.default.union(args, deprecatedArgs);

  parser.rawArgs = allArgs;

  for (let arg of allArgs) {
    parser.addArgument(arg[0], arg[1]);
  }

  updateParseArgsForDefaultCapabilities(parser);
  return parser;
}

function getDefaultArgs() {
  let defaults = {};

  for (let [, arg] of args) {
    defaults[arg.dest] = arg.defaultValue;
  }

  return defaults;
}

var _default = getParser;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wYXJzZXIuanMiXSwibmFtZXMiOlsiYXJncyIsInJlcXVpcmVkIiwiZGVmYXVsdFZhbHVlIiwiaGVscCIsIm5hcmdzIiwiZGVzdCIsImFjdGlvbiIsImV4YW1wbGUiLCJ0eXBlIiwiY2hvaWNlcyIsInJlcXVpcmUiLCJwYXJzZURlZmF1bHRDYXBzIiwiZGVwcmVjYXRlZEFyZ3MiLCJkZXByZWNhdGVkRm9yIiwicGF0aCIsInJlc29sdmUiLCJwcm9jZXNzIiwiZW52IiwiSE9NRSIsIlVTRVJQUk9GSUxFIiwidXBkYXRlUGFyc2VBcmdzRm9yRGVmYXVsdENhcGFiaWxpdGllcyIsInBhcnNlciIsIl9wYXJzZUFyZ3MiLCJwYXJzZUFyZ3MiLCJwYXJzZWRBcmdzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImFyZ0VudHJ5IiwiYXJnIiwiY2FwRGljdCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjYXBzIiwiZnMiLCJzdGF0U3luYyIsImlzRmlsZSIsInJlYWRGaWxlU3luYyIsImVyciIsInBhcnNlIiwiXyIsImlzUGxhaW5PYmplY3QiLCJnZXRQYXJzZXIiLCJBcmd1bWVudFBhcnNlciIsInZlcnNpb24iLCJyb290RGlyIiwiYWRkSGVscCIsImRlc2NyaXB0aW9uIiwicHJvZyIsImFyZ3YiLCJhbGxBcmdzIiwidW5pb24iLCJyYXdBcmdzIiwiYWRkQXJndW1lbnQiLCJnZXREZWZhdWx0QXJncyIsImRlZmF1bHRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsSUFBSSxHQUFHLENBQ1gsQ0FBQyxDQUFDLFNBQUQsQ0FBRCxFQUFjO0FBQ1pDLEVBQUFBLFFBQVEsRUFBRSxLQURFO0FBRVpDLEVBQUFBLFlBQVksRUFBRSxJQUZGO0FBR1pDLEVBQUFBLElBQUksRUFBRSxpQkFITTtBQUlaQyxFQUFBQSxLQUFLLEVBQUUsQ0FKSztBQUtaQyxFQUFBQSxJQUFJLEVBQUU7QUFMTSxDQUFkLENB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QW9CM0IsSUFBcEIsRUFBMEI7QUFDeEJxRCxJQUFBQSxRQUFRLENBQUMxQixHQUFHLENBQUN0QixJQUFMLENBQVIsR0FBcUJzQixHQUFHLENBQUN6QixZQUF6QjtBQUNEOztBQUNELFNBQU9tRCxRQUFQO0FBQ0Q7O2VBRWNiLFMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgQXJndW1lbnRQYXJzZXIgfSBmcm9tICdhcmdwYXJzZSc7XG5pbXBvcnQgeyByb290RGlyIH0gZnJvbSAnLi91dGlscyc7XG5cbmNvbnN0IGFyZ3MgPSBbXG4gIFtbJy0tc2hlbGwnXSwge1xuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgaGVscDogJ0VudGVyIFJFUEwgbW9kZScsXG4gICAgbmFyZ3M6IDAsXG4gICAgZGVzdDogJ3NoZWxsJyxcbiAgfV0sXG5cbiAgW1snLS1hbGxvdy1jb3JzJ10sIHtcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIGhlbHA6ICdXaGV0aGVyIHRoZSBBcHBpdW0gc2VydmVyIHNob3VsZCBhbGxvdyB3ZWIgYnJvd3NlciBjb25uZWN0aW9ucyBmcm9tIGFueSBob3N0JyxcbiAgICBuYXJnczogMCxcbiAgICBkZXN0OiAnYWxsb3dDb3JzJyxcbiAgfV0sXG5cbiAgW1snLS1yZWJvb3QnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGVzdDogJ3JlYm9vdCcsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJyhBbmRyb2lkLW9ubHkpIHJlYm9vdCBlbXVsYXRvciBhZnRlciBlYWNoIHNlc3Npb24gYW5kIGtpbGwgaXQgYXQgdGhlIGVuZCcsXG4gICAgbmFyZ3M6IDAsXG4gIH1dLFxuXG4gIFtbJy0taXBhJ10sIHtcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIGhlbHA6ICcoSU9TLW9ubHkpIGFicyBwYXRoIHRvIGNvbXBpbGVkIC5pcGEgZmlsZScsXG4gICAgZXhhbXBsZTogJy9hYnMvcGF0aC90by9teS5pcGEnLFxuICAgIGRlc3Q6ICdpcGEnLFxuICB9XSxcblxuICBbWyctYScsICctLWFkZHJlc3MnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogJzAuMC4wLjAnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnMC4wLjAuMCcsXG4gICAgaGVscDogJ0lQIEFkZHJlc3MgdG8gbGlzdGVuIG9uJyxcbiAgICBkZXN0OiAnYWRkcmVzcycsXG4gIH1dLFxuXG4gIFtbJy1wJywgJy0tcG9ydCddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiA0NzIzLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICB0eXBlOiAnaW50JyxcbiAgICBleGFtcGxlOiAnNDcyMycsXG4gICAgaGVscDogJ3BvcnQgdG8gbGlzdGVuIG9uJyxcbiAgICBkZXN0OiAncG9ydCcsXG4gIH1dLFxuXG4gIFtbJy1jYScsICctLWNhbGxiYWNrLWFkZHJlc3MnXSwge1xuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXN0OiAnY2FsbGJhY2tBZGRyZXNzJyxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZXhhbXBsZTogJzEyNy4wLjAuMScsXG4gICAgaGVscDogJ2NhbGxiYWNrIElQIEFkZHJlc3MgKGRlZmF1bHQ6IHNhbWUgYXMgLS1hZGRyZXNzKScsXG4gIH1dLFxuXG4gIFtbJy1jcCcsICctLWNhbGxiYWNrLXBvcnQnXSwge1xuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXN0OiAnY2FsbGJhY2tQb3J0JyxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgdHlwZTogJ2ludCcsXG4gICAgZXhhbXBsZTogJzQ3MjMnLFxuICAgIGhlbHA6ICdjYWxsYmFjayBwb3J0IChkZWZhdWx0OiBzYW1lIGFzIHBvcnQpJyxcbiAgfV0sXG5cbiAgW1snLWJwJywgJy0tYm9vdHN0cmFwLXBvcnQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogNDcyNCxcbiAgICBkZXN0OiAnYm9vdHN0cmFwUG9ydCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIHR5cGU6ICdpbnQnLFxuICAgIGV4YW1wbGU6ICc0NzI0JyxcbiAgICBoZWxwOiAnKEFuZHJvaWQtb25seSkgcG9ydCB0byB1c2Ugb24gZGV2aWNlIHRvIHRhbGsgdG8gQXBwaXVtJyxcbiAgfV0sXG5cbiAgW1snLXInLCAnLS1iYWNrZW5kLXJldHJpZXMnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogMyxcbiAgICBkZXN0OiAnYmFja2VuZFJldHJpZXMnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICB0eXBlOiAnaW50JyxcbiAgICBleGFtcGxlOiAnMycsXG4gICAgaGVscDogJyhpT1Mtb25seSkgSG93IG1hbnkgdGltZXMgdG8gcmV0cnkgbGF1bmNoaW5nIEluc3RydW1lbnRzICcgK1xuICAgICAgICAgICdiZWZvcmUgc2F5aW5nIGl0IGNyYXNoZWQgb3IgdGltZWQgb3V0JyxcbiAgfV0sXG5cbiAgW1snLS1zZXNzaW9uLW92ZXJyaWRlJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdzZXNzaW9uT3ZlcnJpZGUnLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdFbmFibGVzIHNlc3Npb24gb3ZlcnJpZGUgKGNsb2JiZXJpbmcpJyxcbiAgICBuYXJnczogMCxcbiAgfV0sXG5cbiAgW1snLWwnLCAnLS1wcmUtbGF1bmNoJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdsYXVuY2gnLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdQcmUtbGF1bmNoIHRoZSBhcHBsaWNhdGlvbiBiZWZvcmUgYWxsb3dpbmcgdGhlIGZpcnN0IHNlc3Npb24gJyArXG4gICAgICAgICAgJyhSZXF1aXJlcyAtLWFwcCBhbmQsIGZvciBBbmRyb2lkLCAtLWFwcC1wa2cgYW5kIC0tYXBwLWFjdGl2aXR5KScsXG4gICAgbmFyZ3M6IDAsXG4gIH1dLFxuXG4gIFtbJy1nJywgJy0tbG9nJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZGVzdDogJ2xvZ0ZpbGUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnL3BhdGgvdG8vYXBwaXVtLmxvZycsXG4gICAgaGVscDogJ0Fsc28gc2VuZCBsb2cgb3V0cHV0IHRvIHRoaXMgZmlsZScsXG4gIH1dLFxuXG4gIFtbJy0tbG9nLWxldmVsJ10sIHtcbiAgICBjaG9pY2VzOiBbXG4gICAgICAnaW5mbycsICdpbmZvOmRlYnVnJywgJ2luZm86aW5mbycsICdpbmZvOndhcm4nLCAnaW5mbzplcnJvcicsXG4gICAgICAnd2FybicsICd3YXJuOmRlYnVnJywgJ3dhcm46aW5mbycsICd3YXJuOndhcm4nLCAnd2FybjplcnJvcicsXG4gICAgICAnZXJyb3InLCAnZXJyb3I6ZGVidWcnLCAnZXJyb3I6aW5mbycsICdlcnJvcjp3YXJuJywgJ2Vycm9yOmVycm9yJyxcbiAgICAgICdkZWJ1ZycsICdkZWJ1ZzpkZWJ1ZycsICdkZWJ1ZzppbmZvJywgJ2RlYnVnOndhcm4nLCAnZGVidWc6ZXJyb3InLFxuICAgIF0sXG4gICAgZGVmYXVsdFZhbHVlOiAnZGVidWcnLFxuICAgIGRlc3Q6ICdsb2dsZXZlbCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdkZWJ1ZycsXG4gICAgaGVscDogJ2xvZyBsZXZlbDsgZGVmYXVsdCAoY29uc29sZVs6ZmlsZV0pOiBkZWJ1Z1s6ZGVidWddJyxcbiAgfV0sXG5cbiAgW1snLS1sb2ctdGltZXN0YW1wJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnU2hvdyB0aW1lc3RhbXBzIGluIGNvbnNvbGUgb3V0cHV0JyxcbiAgICBuYXJnczogMCxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIGRlc3Q6ICdsb2dUaW1lc3RhbXAnLFxuICB9XSxcblxuICBbWyctLWxvY2FsLXRpbWV6b25lJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnVXNlIGxvY2FsIHRpbWV6b25lIGZvciB0aW1lc3RhbXBzJyxcbiAgICBuYXJnczogMCxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIGRlc3Q6ICdsb2NhbFRpbWV6b25lJyxcbiAgfV0sXG5cbiAgW1snLS1sb2ctbm8tY29sb3JzJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnRG8gbm90IHVzZSBjb2xvcnMgaW4gY29uc29sZSBvdXRwdXQnLFxuICAgIG5hcmdzOiAwLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgZGVzdDogJ2xvZ05vQ29sb3JzJyxcbiAgfV0sXG5cbiAgW1snLUcnLCAnLS13ZWJob29rJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdsb2NhbGhvc3Q6OTg3NicsXG4gICAgZGVzdDogJ3dlYmhvb2snLFxuICAgIGhlbHA6ICdBbHNvIHNlbmQgbG9nIG91dHB1dCB0byB0aGlzIEhUVFAgbGlzdGVuZXInLFxuICB9XSxcblxuICBbWyctLXNhZmFyaSddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIGRlc3Q6ICdzYWZhcmknLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnKElPUy1Pbmx5KSBVc2UgdGhlIHNhZmFyaSBhcHAnLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWRlZmF1bHQtZGV2aWNlJywgJy1kZCddLCB7XG4gICAgZGVzdDogJ2RlZmF1bHREZXZpY2UnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJyhJT1MtU2ltdWxhdG9yLW9ubHkpIHVzZSB0aGUgZGVmYXVsdCBzaW11bGF0b3IgdGhhdCBpbnN0cnVtZW50cyAnICtcbiAgICAgICAgICAnbGF1bmNoZXMgb24gaXRzIG93bicsXG4gIH1dLFxuXG4gIFtbJy0tZm9yY2UtaXBob25lJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdmb3JjZUlwaG9uZScsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJyhJT1Mtb25seSkgVXNlIHRoZSBpUGhvbmUgU2ltdWxhdG9yIG5vIG1hdHRlciB3aGF0IHRoZSBhcHAgd2FudHMnLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWZvcmNlLWlwYWQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGVzdDogJ2ZvcmNlSXBhZCcsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJyhJT1Mtb25seSkgVXNlIHRoZSBpUGFkIFNpbXVsYXRvciBubyBtYXR0ZXIgd2hhdCB0aGUgYXBwIHdhbnRzJyxcbiAgICBuYXJnczogMCxcbiAgfV0sXG5cbiAgW1snLS10cmFjZXRlbXBsYXRlJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZGVzdDogJ2F1dG9tYXRpb25UcmFjZVRlbXBsYXRlUGF0aCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICcvVXNlcnMvbWUvQXV0b21hdGlvbi50cmFjZXRlbXBsYXRlJyxcbiAgICBoZWxwOiAnKElPUy1vbmx5KSAudHJhY2V0ZW1wbGF0ZSBmaWxlIHRvIHVzZSB3aXRoIEluc3RydW1lbnRzJyxcbiAgfV0sXG5cbiAgW1snLS1pbnN0cnVtZW50cyddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIGRlc3Q6ICdpbnN0cnVtZW50c1BhdGgnLFxuICAgIHJlcXVpcmU6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICcvcGF0aC90by9pbnN0cnVtZW50cycsXG4gICAgaGVscDogJyhJT1Mtb25seSkgcGF0aCB0byBpbnN0cnVtZW50cyBiaW5hcnknLFxuICB9XSxcblxuICBbWyctLW5vZGVjb25maWcnXSwge1xuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZGVzdDogJ25vZGVjb25maWcnLFxuICAgIGhlbHA6ICdDb25maWd1cmF0aW9uIEpTT04gZmlsZSB0byByZWdpc3RlciBhcHBpdW0gd2l0aCBzZWxlbml1bSBncmlkJyxcbiAgICBleGFtcGxlOiAnL2Ficy9wYXRoL3RvL25vZGVjb25maWcuanNvbicsXG4gIH1dLFxuXG4gIFtbJy1yYScsICctLXJvYm90LWFkZHJlc3MnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogJzAuMC4wLjAnLFxuICAgIGRlc3Q6ICdyb2JvdEFkZHJlc3MnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnMC4wLjAuMCcsXG4gICAgaGVscDogJ0lQIEFkZHJlc3Mgb2Ygcm9ib3QnLFxuICB9XSxcblxuICBbWyctcnAnLCAnLS1yb2JvdC1wb3J0J10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IC0xLFxuICAgIGRlc3Q6ICdyb2JvdFBvcnQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICB0eXBlOiAnaW50JyxcbiAgICBleGFtcGxlOiAnNDI0MicsXG4gICAgaGVscDogJ3BvcnQgZm9yIHJvYm90JyxcbiAgfV0sXG5cbiAgW1snLS1zZWxlbmRyb2lkLXBvcnQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogODA4MCxcbiAgICBkZXN0OiAnc2VsZW5kcm9pZFBvcnQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICB0eXBlOiAnaW50JyxcbiAgICBleGFtcGxlOiAnODA4MCcsXG4gICAgaGVscDogJ0xvY2FsIHBvcnQgdXNlZCBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIFNlbGVuZHJvaWQnLFxuICB9XSxcblxuICBbWyctLWNocm9tZWRyaXZlci1wb3J0J10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZGVzdDogJ2Nocm9tZURyaXZlclBvcnQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICB0eXBlOiAnaW50JyxcbiAgICBleGFtcGxlOiAnOTUxNScsXG4gICAgaGVscDogJ1BvcnQgdXBvbiB3aGljaCBDaHJvbWVEcml2ZXIgd2lsbCBydW4uIElmIG5vdCBnaXZlbiwgQW5kcm9pZCBkcml2ZXIgd2lsbCBwaWNrIGEgcmFuZG9tIGF2YWlsYWJsZSBwb3J0LicsXG4gIH1dLFxuXG4gIFtbJy0tY2hyb21lZHJpdmVyLWV4ZWN1dGFibGUnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICBkZXN0OiAnY2hyb21lZHJpdmVyRXhlY3V0YWJsZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdDaHJvbWVEcml2ZXIgZXhlY3V0YWJsZSBmdWxsIHBhdGgnLFxuICB9XSxcblxuICBbWyctLXNob3ctY29uZmlnJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdzaG93Q29uZmlnJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnU2hvdyBpbmZvIGFib3V0IHRoZSBhcHBpdW0gc2VydmVyIGNvbmZpZ3VyYXRpb24gYW5kIGV4aXQnLFxuICB9XSxcblxuICBbWyctLW5vLXBlcm1zLWNoZWNrJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdub1Blcm1zQ2hlY2snLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdCeXBhc3MgQXBwaXVtXFwncyBjaGVja3MgdG8gZW5zdXJlIHdlIGNhbiByZWFkL3dyaXRlIG5lY2Vzc2FyeSBmaWxlcycsXG4gIH1dLFxuXG4gIFtbJy0tc3RyaWN0LWNhcHMnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGVzdDogJ2VuZm9yY2VTdHJpY3RDYXBzJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnQ2F1c2Ugc2Vzc2lvbnMgdG8gZmFpbCBpZiBkZXNpcmVkIGNhcHMgYXJlIHNlbnQgaW4gdGhhdCBBcHBpdW0gJyArXG4gICAgICAgICAgJ2RvZXMgbm90IHJlY29nbml6ZSBhcyB2YWxpZCBmb3IgdGhlIHNlbGVjdGVkIGRldmljZScsXG4gICAgbmFyZ3M6IDAsXG4gIH1dLFxuXG4gIFtbJy0taXNvbGF0ZS1zaW0tZGV2aWNlJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdpc29sYXRlU2ltRGV2aWNlJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnWGNvZGUgNiBoYXMgYSBidWcgb24gc29tZSBwbGF0Zm9ybXMgd2hlcmUgYSBjZXJ0YWluIHNpbXVsYXRvciAnICtcbiAgICAgICAgICAnY2FuIG9ubHkgYmUgbGF1bmNoZWQgd2l0aG91dCBlcnJvciBpZiBhbGwgb3RoZXIgc2ltdWxhdG9yIGRldmljZXMgJyArXG4gICAgICAgICAgJ2FyZSBmaXJzdCBkZWxldGVkLiBUaGlzIG9wdGlvbiBjYXVzZXMgQXBwaXVtIHRvIGRlbGV0ZSBhbGwgJyArXG4gICAgICAgICAgJ2RldmljZXMgb3RoZXIgdGhhbiB0aGUgb25lIGJlaW5nIHVzZWQgYnkgQXBwaXVtLiBOb3RlIHRoYXQgdGhpcyAnICtcbiAgICAgICAgICAnaXMgYSBwZXJtYW5lbnQgZGVsZXRpb24sIGFuZCB5b3UgYXJlIHJlc3BvbnNpYmxlIGZvciB1c2luZyBzaW1jdGwgJyArXG4gICAgICAgICAgJ29yIHhjb2RlIHRvIG1hbmFnZSB0aGUgY2F0ZWdvcmllcyBvZiBkZXZpY2VzIHVzZWQgd2l0aCBBcHBpdW0uJyxcbiAgICBuYXJnczogMCxcbiAgfV0sXG5cbiAgW1snLS10bXAnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICBkZXN0OiAndG1wRGlyJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJ0Fic29sdXRlIHBhdGggdG8gZGlyZWN0b3J5IEFwcGl1bSBjYW4gdXNlIHRvIG1hbmFnZSB0ZW1wb3JhcnkgJyArXG4gICAgICAgICAgJ2ZpbGVzLCBsaWtlIGJ1aWx0LWluIGlPUyBhcHBzIGl0IG5lZWRzIHRvIG1vdmUgYXJvdW5kLiBPbiAqbml4L01hYyAnICtcbiAgICAgICAgICAnZGVmYXVsdHMgdG8gL3RtcCwgb24gV2luZG93cyBkZWZhdWx0cyB0byBDOlxcXFxXaW5kb3dzXFxcXFRlbXAnLFxuICB9XSxcblxuICBbWyctLXRyYWNlLWRpciddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIGRlc3Q6ICd0cmFjZURpcicsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdBYnNvbHV0ZSBwYXRoIHRvIGRpcmVjdG9yeSBBcHBpdW0gdXNlIHRvIHNhdmUgaW9zIGluc3RydW1lbnRzICcgK1xuICAgICAgICAgICd0cmFjZXMsIGRlZmF1bHRzIHRvIDx0bXAgZGlyPi9hcHBpdW0taW5zdHJ1bWVudHMnLFxuICB9XSxcblxuICBbWyctLWRlYnVnLWxvZy1zcGFjaW5nJ10sIHtcbiAgICBkZXN0OiAnZGVidWdMb2dTcGFjaW5nJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdBZGQgZXhhZ2dlcmF0ZWQgc3BhY2luZyBpbiBsb2dzIHRvIGhlbHAgd2l0aCB2aXN1YWwgaW5zcGVjdGlvbicsXG4gIH1dLFxuXG4gIFtbJy0tc3VwcHJlc3MtYWRiLWtpbGwtc2VydmVyJ10sIHtcbiAgICBkZXN0OiAnc3VwcHJlc3NLaWxsU2VydmVyJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICcoQW5kcm9pZC1vbmx5KSBJZiBzZXQsIHByZXZlbnRzIEFwcGl1bSBmcm9tIGtpbGxpbmcgdGhlIGFkYiBzZXJ2ZXIgaW5zdGFuY2UnLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWxvbmctc3RhY2t0cmFjZSddLCB7XG4gICAgZGVzdDogJ2xvbmdTdGFja3RyYWNlJyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIGhlbHA6ICdBZGQgbG9uZyBzdGFjayB0cmFjZXMgdG8gbG9nIGVudHJpZXMuIFJlY29tbWVuZGVkIGZvciBkZWJ1Z2dpbmcgb25seS4nLFxuICB9XSxcblxuICBbWyctLXdlYmtpdC1kZWJ1Zy1wcm94eS1wb3J0J10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IDI3NzUzLFxuICAgIGRlc3Q6ICd3ZWJraXREZWJ1Z1Byb3h5UG9ydCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIHR5cGU6ICdpbnQnLFxuICAgIGV4YW1wbGU6IFwiMjc3NTNcIixcbiAgICBoZWxwOiAnKElPUy1vbmx5KSBMb2NhbCBwb3J0IHVzZWQgZm9yIGNvbW11bmljYXRpb24gd2l0aCBpb3Mtd2Via2l0LWRlYnVnLXByb3h5J1xuICB9XSxcblxuICBbWyctLXdlYmRyaXZlcmFnZW50LXBvcnQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogODEwMCxcbiAgICBkZXN0OiAnd2RhTG9jYWxQb3J0JyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgdHlwZTogJ2ludCcsXG4gICAgZXhhbXBsZTogXCI4MTAwXCIsXG4gICAgaGVscDogJyhJT1Mtb25seSwgWENVSVRlc3Qtb25seSkgTG9jYWwgcG9ydCB1c2VkIGZvciBjb21tdW5pY2F0aW9uIHdpdGggV2ViRHJpdmVyQWdlbnQnXG4gIH1dLFxuXG4gIFtbJy1kYycsICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJ10sIHtcbiAgICBkZXN0OiAnZGVmYXVsdENhcGFiaWxpdGllcycsXG4gICAgZGVmYXVsdFZhbHVlOiB7fSxcbiAgICB0eXBlOiBwYXJzZURlZmF1bHRDYXBzLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnWyBcXCd7XCJhcHBcIjogXCJteWFwcC5hcHBcIiwgXCJkZXZpY2VOYW1lXCI6IFwiaVBob25lIFNpbXVsYXRvclwifVxcJyAnICtcbiAgICAgICAgICAgICAnfCAvcGF0aC90by9jYXBzLmpzb24gXScsXG4gICAgaGVscDogJ1NldCB0aGUgZGVmYXVsdCBkZXNpcmVkIGNhcGFiaWxpdGllcywgd2hpY2ggd2lsbCBiZSBzZXQgb24gZWFjaCAnICtcbiAgICAgICAgICAnc2Vzc2lvbiB1bmxlc3Mgb3ZlcnJpZGRlbiBieSByZWNlaXZlZCBjYXBhYmlsaXRpZXMuJ1xuICB9XSxcblxuICBbWyctLWVuYWJsZS1oZWFwZHVtcCddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkZXN0OiAnaGVhcGR1bXBFbmFibGVkJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnRW5hYmxlIGNvbGxlY3Rpb24gb2YgTm9kZUpTIG1lbW9yeSBoZWFwIGR1bXBzLiBUaGlzIGlzIHVzZWZ1bCBmb3IgbWVtb3J5IGxlYWtzIGxvb2t1cCcsXG4gICAgbmFyZ3M6IDBcbiAgfV0sXG5cbiAgW1snLS1yZWxheGVkLXNlY3VyaXR5J10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdyZWxheGVkU2VjdXJpdHlFbmFibGVkJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBoZWxwOiAnRGlzYWJsZSBhZGRpdGlvbmFsIHNlY3VyaXR5IGNoZWNrcywgc28gaXQgaXMgcG9zc2libGUgdG8gdXNlIHNvbWUgYWR2YW5jZWQgZmVhdHVyZXMsIHByb3ZpZGVkICcgK1xuICAgICAgICAgICdieSBkcml2ZXJzIHN1cHBvcnRpbmcgdGhpcyBvcHRpb24uIE9ubHkgZW5hYmxlIGl0IGlmIGFsbCB0aGUgJyArXG4gICAgICAgICAgJ2NsaWVudHMgYXJlIGluIHRoZSB0cnVzdGVkIG5ldHdvcmsgYW5kIGl0XFwncyBub3QgdGhlIGNhc2UgaWYgYSBjbGllbnQgY291bGQgcG90ZW50aWFsbHkgJyArXG4gICAgICAgICAgJ2JyZWFrIG91dCBvZiB0aGUgc2Vzc2lvbiBzYW5kYm94LicsXG4gICAgbmFyZ3M6IDBcbiAgfV0sXG5dO1xuXG5jb25zdCBkZXByZWNhdGVkQXJncyA9IFtcbiAgW1snLS1jb21tYW5kLXRpbWVvdXQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogNjAsXG4gICAgZGVzdDogJ2RlZmF1bHRDb21tYW5kVGltZW91dCcsXG4gICAgdHlwZTogJ2ludCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gTm8gZWZmZWN0LiBUaGlzIHVzZWQgdG8gYmUgdGhlIGRlZmF1bHQgY29tbWFuZCAnICtcbiAgICAgICAgICAndGltZW91dCBmb3IgdGhlIHNlcnZlciB0byB1c2UgZm9yIGFsbCBzZXNzaW9ucyAoaW4gc2Vjb25kcyBhbmQgJyArXG4gICAgICAgICAgJ3Nob3VsZCBiZSBsZXNzIHRoYW4gMjE0NzQ4MykuIFVzZSBuZXdDb21tYW5kVGltZW91dCBjYXAgaW5zdGVhZCdcbiAgfV0sXG5cbiAgW1snLWsnLCAnLS1rZWVwLWFydGlmYWN0cyddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkZXN0OiAna2VlcEFydGlmYWN0cycsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIG5vIGVmZmVjdCwgdHJhY2UgaXMgbm93IGluIHRtcCBkaXIgYnkgZGVmYXVsdCBhbmQgaXMgJyArXG4gICAgICAgICAgJ2NsZWFyZWQgYmVmb3JlIGVhY2ggcnVuLiBQbGVhc2UgYWxzbyByZWZlciB0byB0aGUgLS10cmFjZS1kaXIgZmxhZy4nLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLXBsYXRmb3JtLW5hbWUnXSwge1xuICAgIGRlc3Q6ICdwbGF0Zm9ybU5hbWUnLFxuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGV4YW1wbGU6ICdpT1MnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSBOYW1lIG9mIHRoZSBtb2JpbGUgcGxhdGZvcm06IGlPUywgQW5kcm9pZCwgb3IgRmlyZWZveE9TJyxcbiAgfV0sXG5cbiAgW1snLS1wbGF0Zm9ybS12ZXJzaW9uJ10sIHtcbiAgICBkZXN0OiAncGxhdGZvcm1WZXJzaW9uJyxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBleGFtcGxlOiAnNy4xJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gVmVyc2lvbiBvZiB0aGUgbW9iaWxlIHBsYXRmb3JtJyxcbiAgfV0sXG5cbiAgW1snLS1hdXRvbWF0aW9uLW5hbWUnXSwge1xuICAgIGRlc3Q6ICdhdXRvbWF0aW9uTmFtZScsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgZXhhbXBsZTogJ0FwcGl1bScsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIE5hbWUgb2YgdGhlIGF1dG9tYXRpb24gdG9vbDogQXBwaXVtIG9yIFNlbGVuZHJvaWQnLFxuICB9XSxcblxuICBbWyctLWRldmljZS1uYW1lJ10sIHtcbiAgICBkZXN0OiAnZGV2aWNlTmFtZScsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgZXhhbXBsZTogJ2lQaG9uZSBSZXRpbmEgKDQtaW5jaCksIEFuZHJvaWQgRW11bGF0b3InLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSBOYW1lIG9mIHRoZSBtb2JpbGUgZGV2aWNlIHRvIHVzZScsXG4gIH1dLFxuXG4gIFtbJy0tYnJvd3Nlci1uYW1lJ10sIHtcbiAgICBkZXN0OiAnYnJvd3Nlck5hbWUnLFxuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGV4YW1wbGU6ICdTYWZhcmknLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSBOYW1lIG9mIHRoZSBtb2JpbGUgYnJvd3NlcjogU2FmYXJpIG9yIENocm9tZScsXG4gIH1dLFxuXG4gIFtbJy0tYXBwJ10sIHtcbiAgICBkZXN0OiAnYXBwJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gSU9TOiBhYnMgcGF0aCB0byBzaW11bGF0b3ItY29tcGlsZWQgLmFwcCBmaWxlIG9yIHRoZSBidW5kbGVfaWQgb2YgdGhlIGRlc2lyZWQgdGFyZ2V0IG9uIGRldmljZTsgQW5kcm9pZDogYWJzIHBhdGggdG8gLmFwayBmaWxlJyxcbiAgICBleGFtcGxlOiAnL2Ficy9wYXRoL3RvL215LmFwcCcsXG4gIH1dLFxuXG4gIFtbJy1sdCcsICctLWxhdW5jaC10aW1lb3V0J10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IDkwMDAwLFxuICAgIGRlc3Q6ICdsYXVuY2hUaW1lb3V0JyxcbiAgICB0eXBlOiAnaW50JyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoaU9TLW9ubHkpIGhvdyBsb25nIGluIG1zIHRvIHdhaXQgZm9yIEluc3RydW1lbnRzIHRvIGxhdW5jaCcsXG4gIH1dLFxuXG4gIFtbJy0tbGFuZ3VhZ2UnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICBkZXN0OiAnbGFuZ3VhZ2UnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnZW4nLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gTGFuZ3VhZ2UgZm9yIHRoZSBpT1Mgc2ltdWxhdG9yIC8gQW5kcm9pZCBFbXVsYXRvcicsXG4gIH1dLFxuXG4gIFtbJy0tbG9jYWxlJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZGVzdDogJ2xvY2FsZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdlbl9VUycsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSBMb2NhbGUgZm9yIHRoZSBpT1Mgc2ltdWxhdG9yIC8gQW5kcm9pZCBFbXVsYXRvcicsXG4gIH1dLFxuXG4gIFtbJy1VJywgJy0tdWRpZCddLCB7XG4gICAgZGVzdDogJ3VkaWQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgZXhhbXBsZTogJzFhZHNmLXNkZmFzLWFzZGYtMTIzc2RmJyxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIFVuaXF1ZSBkZXZpY2UgaWRlbnRpZmllciBvZiB0aGUgY29ubmVjdGVkIHBoeXNpY2FsIGRldmljZScsXG4gIH1dLFxuXG4gIFtbJy0tb3JpZW50YXRpb24nXSwge1xuICAgIGRlc3Q6ICdvcmllbnRhdGlvbicsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnTEFORFNDQVBFJyxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChJT1Mtb25seSkgdXNlIExBTkRTQ0FQRSBvciBQT1JUUkFJVCB0byBpbml0aWFsaXplIGFsbCByZXF1ZXN0cyAnICtcbiAgICAgICAgICAndG8gdGhpcyBvcmllbnRhdGlvbicsXG4gIH1dLFxuXG4gIFtbJy0tbm8tcmVzZXQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGVzdDogJ25vUmVzZXQnLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gRG8gbm90IHJlc2V0IGFwcCBzdGF0ZSBiZXR3ZWVuIHNlc3Npb25zIChJT1M6IGRvIG5vdCBkZWxldGUgYXBwICcgK1xuICAgICAgICAgICdwbGlzdCBmaWxlczsgQW5kcm9pZDogZG8gbm90IHVuaW5zdGFsbCBhcHAgYmVmb3JlIG5ldyBzZXNzaW9uKScsXG4gICAgbmFyZ3M6IDAsXG4gIH1dLFxuXG4gIFtbJy0tZnVsbC1yZXNldCddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkZXN0OiAnZnVsbFJlc2V0JyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChpT1MpIERlbGV0ZSB0aGUgZW50aXJlIHNpbXVsYXRvciBmb2xkZXIuIChBbmRyb2lkKSBSZXNldCBhcHAgJyArXG4gICAgICAgICAgJ3N0YXRlIGJ5IHVuaW5zdGFsbGluZyBhcHAgaW5zdGVhZCBvZiBjbGVhcmluZyBhcHAgZGF0YS4gT24gJyArXG4gICAgICAgICAgJ0FuZHJvaWQsIHRoaXMgd2lsbCBhbHNvIHJlbW92ZSB0aGUgYXBwIGFmdGVyIHRoZSBzZXNzaW9uIGlzIGNvbXBsZXRlLicsXG4gICAgbmFyZ3M6IDAsXG4gIH1dLFxuXG4gIFtbJy0tYXBwLXBrZyddLCB7XG4gICAgZGVzdDogJ2FwcFBhY2thZ2UnLFxuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGV4YW1wbGU6ICdjb20uZXhhbXBsZS5hbmRyb2lkLm15QXBwJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgSmF2YSBwYWNrYWdlIG9mIHRoZSBBbmRyb2lkIGFwcCB5b3Ugd2FudCB0byBydW4gJyArXG4gICAgICAgICAgJyhlLmcuLCBjb20uZXhhbXBsZS5hbmRyb2lkLm15QXBwKScsXG4gIH1dLFxuXG4gIFtbJy0tYXBwLWFjdGl2aXR5J10sIHtcbiAgICBkZXN0OiAnYXBwQWN0aXZpdHknLFxuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZXhhbXBsZTogJ01haW5BY3Rpdml0eScsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBBY3Rpdml0eSBuYW1lIGZvciB0aGUgQW5kcm9pZCBhY3Rpdml0eSB5b3Ugd2FudCAnICtcbiAgICAgICAgICAndG8gbGF1bmNoIGZyb20geW91ciBwYWNrYWdlIChlLmcuLCBNYWluQWN0aXZpdHkpJyxcbiAgfV0sXG5cbiAgW1snLS1hcHAtd2FpdC1wYWNrYWdlJ10sIHtcbiAgICBkZXN0OiAnYXBwV2FpdFBhY2thZ2UnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdjb20uZXhhbXBsZS5hbmRyb2lkLm15QXBwJyxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChBbmRyb2lkLW9ubHkpIFBhY2thZ2UgbmFtZSBmb3IgdGhlIEFuZHJvaWQgYWN0aXZpdHkgeW91IHdhbnQgJyArXG4gICAgICAgICAgJ3RvIHdhaXQgZm9yIChlLmcuLCBjb20uZXhhbXBsZS5hbmRyb2lkLm15QXBwKScsXG4gIH1dLFxuXG4gIFtbJy0tYXBwLXdhaXQtYWN0aXZpdHknXSwge1xuICAgIGRlc3Q6ICdhcHBXYWl0QWN0aXZpdHknLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdTcGxhc2hBY3Rpdml0eScsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBBY3Rpdml0eSBuYW1lIGZvciB0aGUgQW5kcm9pZCBhY3Rpdml0eSB5b3Ugd2FudCAnICtcbiAgICAgICAgICAndG8gd2FpdCBmb3IgKGUuZy4sIFNwbGFzaEFjdGl2aXR5KScsXG4gIH1dLFxuXG4gIFtbJy0tZGV2aWNlLXJlYWR5LXRpbWVvdXQnXSwge1xuICAgIGRlc3Q6ICdkZXZpY2VSZWFkeVRpbWVvdXQnLFxuICAgIGRlZmF1bHRWYWx1ZTogNSxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgdHlwZTogJ2ludCcsXG4gICAgZXhhbXBsZTogJzUnLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgVGltZW91dCBpbiBzZWNvbmRzIHdoaWxlIHdhaXRpbmcgZm9yIGRldmljZSB0byBiZWNvbWUgcmVhZHknLFxuICB9XSxcblxuICBbWyctLWFuZHJvaWQtY292ZXJhZ2UnXSwge1xuICAgIGRlc3Q6ICdhbmRyb2lkQ292ZXJhZ2UnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdjb20ubXkuUGtnL2NvbS5teS5Qa2cuaW5zdHJ1bWVudGF0aW9uLk15SW5zdHJ1bWVudGF0aW9uJyxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChBbmRyb2lkLW9ubHkpIEZ1bGx5IHF1YWxpZmllZCBpbnN0cnVtZW50YXRpb24gY2xhc3MuIFBhc3NlZCB0byAtdyBpbiAnICtcbiAgICAgICAgICAnYWRiIHNoZWxsIGFtIGluc3RydW1lbnQgLWUgY292ZXJhZ2UgdHJ1ZSAtdyAnLFxuICB9XSxcblxuICBbWyctLWF2ZCddLCB7XG4gICAgZGVzdDogJ2F2ZCcsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnQGRlZmF1bHQnLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgTmFtZSBvZiB0aGUgYXZkIHRvIGxhdW5jaCcsXG4gIH1dLFxuXG4gIFtbJy0tYXZkLWFyZ3MnXSwge1xuICAgIGRlc3Q6ICdhdmRBcmdzJyxcbiAgICBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICctbm8tc25hcHNob3QtbG9hZCcsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBBZGRpdGlvbmFsIGVtdWxhdG9yIGFyZ3VtZW50cyB0byBsYXVuY2ggdGhlIGF2ZCcsXG4gIH1dLFxuXG4gIFtbJy0tdXNlLWtleXN0b3JlJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICd1c2VLZXlzdG9yZScsXG4gICAgYWN0aW9uOiAnc3RvcmVUcnVlJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBXaGVuIHNldCB0aGUga2V5c3RvcmUgd2lsbCBiZSB1c2VkIHRvIHNpZ24gYXBrcy4nLFxuICB9XSxcblxuICBbWyctLWtleXN0b3JlLXBhdGgnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogcGF0aC5yZXNvbHZlKHByb2Nlc3MuZW52LkhPTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUlBST0ZJTEUgfHwgJycsICcuYW5kcm9pZCcsICdkZWJ1Zy5rZXlzdG9yZScpLFxuICAgIGRlc3Q6ICdrZXlzdG9yZVBhdGgnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChBbmRyb2lkLW9ubHkpIFBhdGggdG8ga2V5c3RvcmUnLFxuICB9XSxcblxuICBbWyctLWtleXN0b3JlLXBhc3N3b3JkJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6ICdhbmRyb2lkJyxcbiAgICBkZXN0OiAna2V5c3RvcmVQYXNzd29yZCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgUGFzc3dvcmQgdG8ga2V5c3RvcmUnLFxuICB9XSxcblxuICBbWyctLWtleS1hbGlhcyddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiAnYW5kcm9pZGRlYnVna2V5JyxcbiAgICBkZXN0OiAna2V5QWxpYXMnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChBbmRyb2lkLW9ubHkpIEtleSBhbGlhcycsXG4gIH1dLFxuXG4gIFtbJy0ta2V5LXBhc3N3b3JkJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6ICdhbmRyb2lkJyxcbiAgICBkZXN0OiAna2V5UGFzc3dvcmQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChBbmRyb2lkLW9ubHkpIEtleSBwYXNzd29yZCcsXG4gIH1dLFxuXG4gIFtbJy0taW50ZW50LWFjdGlvbiddLCB7XG4gICAgZGVzdDogJ2ludGVudEFjdGlvbicsXG4gICAgZGVmYXVsdFZhbHVlOiAnYW5kcm9pZC5pbnRlbnQuYWN0aW9uLk1BSU4nLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnYW5kcm9pZC5pbnRlbnQuYWN0aW9uLk1BSU4nLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgSW50ZW50IGFjdGlvbiB3aGljaCB3aWxsIGJlIHVzZWQgdG8gc3RhcnQgYWN0aXZpdHknLFxuICB9XSxcblxuICBbWyctLWludGVudC1jYXRlZ29yeSddLCB7XG4gICAgZGVzdDogJ2ludGVudENhdGVnb3J5JyxcbiAgICBkZWZhdWx0VmFsdWU6ICdhbmRyb2lkLmludGVudC5jYXRlZ29yeS5MQVVOQ0hFUicsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGV4YW1wbGU6ICdhbmRyb2lkLmludGVudC5jYXRlZ29yeS5BUFBfQ09OVEFDVFMnLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgSW50ZW50IGNhdGVnb3J5IHdoaWNoIHdpbGwgYmUgdXNlZCB0byBzdGFydCBhY3Rpdml0eScsXG4gIH1dLFxuXG4gIFtbJy0taW50ZW50LWZsYWdzJ10sIHtcbiAgICBkZXN0OiAnaW50ZW50RmxhZ3MnLFxuICAgIGRlZmF1bHRWYWx1ZTogJzB4MTAyMDAwMDAnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnMHgxMDIwMDAwMCcsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBGbGFncyB0aGF0IHdpbGwgYmUgdXNlZCB0byBzdGFydCBhY3Rpdml0eScsXG4gIH1dLFxuXG4gIFtbJy0taW50ZW50LWFyZ3MnXSwge1xuICAgIGRlc3Q6ICdvcHRpb25hbEludGVudEFyZ3VtZW50cycsXG4gICAgZGVmYXVsdFZhbHVlOiBudWxsLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnMHgxMDIwMDAwMCcsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLFxuICAgIGhlbHA6ICdbREVQUkVDQVRFRF0gLSAoQW5kcm9pZC1vbmx5KSBBZGRpdGlvbmFsIGludGVudCBhcmd1bWVudHMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gJyArXG4gICAgICAgICAgJ3N0YXJ0IGFjdGl2aXR5JyxcbiAgfV0sXG5cbiAgW1snLS1kb250LXN0b3AtYXBwLW9uLXJlc2V0J10sIHtcbiAgICBkZXN0OiAnZG9udFN0b3BBcHBPblJlc2V0JyxcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKEFuZHJvaWQtb25seSkgV2hlbiBpbmNsdWRlZCwgcmVmcmFpbnMgZnJvbSBzdG9wcGluZyB0aGUgYXBwIGJlZm9yZSByZXN0YXJ0JyxcbiAgfV0sXG5cbiAgW1snLS1jYWxlbmRhci1mb3JtYXQnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogbnVsbCxcbiAgICBkZXN0OiAnY2FsZW5kYXJGb3JtYXQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBleGFtcGxlOiAnZ3JlZ29yaWFuJyxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChJT1Mtb25seSkgY2FsZW5kYXIgZm9ybWF0IGZvciB0aGUgaU9TIHNpbXVsYXRvcicsXG4gIH1dLFxuXG4gIFtbJy0tbmF0aXZlLWluc3RydW1lbnRzLWxpYiddLCB7XG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBkZXN0OiAnbmF0aXZlSW5zdHJ1bWVudHNMaWInLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKElPUy1vbmx5KSBJT1MgaGFzIGEgd2VpcmQgYnVpbHQtaW4gdW5hdm9pZGFibGUgJyArXG4gICAgICAgICAgJ2RlbGF5LiBXZSBwYXRjaCB0aGlzIGluIGFwcGl1bS4gSWYgeW91IGRvIG5vdCB3YW50IGl0IHBhdGNoZWQsICcgK1xuICAgICAgICAgICdwYXNzIGluIHRoaXMgZmxhZy4nLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWtlZXAta2V5Y2hhaW5zJ10sIHtcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGRlc3Q6ICdrZWVwS2V5Q2hhaW5zJyxcbiAgICBhY3Rpb246ICdzdG9yZVRydWUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBkZXByZWNhdGVkRm9yOiAnLS1kZWZhdWx0LWNhcGFiaWxpdGllcycsXG4gICAgaGVscDogJ1tERVBSRUNBVEVEXSAtIChpT1Mtb25seSkgV2hldGhlciB0byBrZWVwIGtleWNoYWlucyAoTGlicmFyeS9LZXljaGFpbnMpIHdoZW4gcmVzZXQgYXBwIGJldHdlZW4gc2Vzc2lvbnMnLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWxvY2FsaXphYmxlLXN0cmluZ3MtZGlyJ10sIHtcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgZGVzdDogJ2xvY2FsaXphYmxlU3RyaW5nc0RpcicsXG4gICAgZGVmYXVsdFZhbHVlOiAnZW4ubHByb2onLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKElPUy1vbmx5KSB0aGUgcmVsYXRpdmUgcGF0aCBvZiB0aGUgZGlyIHdoZXJlIExvY2FsaXphYmxlLnN0cmluZ3MgZmlsZSByZXNpZGVzICcsXG4gICAgZXhhbXBsZTogJ2VuLmxwcm9qJyxcbiAgfV0sXG5cbiAgW1snLS1zaG93LWlvcy1sb2cnXSwge1xuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgZGVzdDogJ3Nob3dJT1NMb2cnLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGRlcHJlY2F0ZWRGb3I6ICctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gKElPUy1vbmx5KSBpZiBzZXQsIHRoZSBpT1Mgc3lzdGVtIGxvZyB3aWxsIGJlIHdyaXR0ZW4gdG8gdGhlIGNvbnNvbGUnLFxuICAgIG5hcmdzOiAwLFxuICB9XSxcblxuICBbWyctLWFzeW5jLXRyYWNlJ10sIHtcbiAgICBkZXN0OiAnbG9uZ1N0YWNrdHJhY2UnLFxuICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIGFjdGlvbjogJ3N0b3JlVHJ1ZScsXG4gICAgZGVwcmVjYXRlZEZvcjogJy0tbG9uZy1zdGFja3RyYWNlJyxcbiAgICBoZWxwOiAnW0RFUFJFQ0FURURdIC0gQWRkIGxvbmcgc3RhY2sgdHJhY2VzIHRvIGxvZyBlbnRyaWVzLiBSZWNvbW1lbmRlZCBmb3IgZGVidWdnaW5nIG9ubHkuJyxcbiAgfV0sXG5dO1xuXG5mdW5jdGlvbiB1cGRhdGVQYXJzZUFyZ3NGb3JEZWZhdWx0Q2FwYWJpbGl0aWVzIChwYXJzZXIpIHtcbiAgLy8gaGVyZSB3ZSB3YW50IHRvIHVwZGF0ZSB0aGUgcGFyc2VyLnBhcnNlQXJncygpIGZ1bmN0aW9uXG4gIC8vIGluIG9yZGVyIHRvIGJyaW5nIHRvZ2V0aGVyIGFsbCB0aGUgYXJncyB0aGF0IGFyZSBhY3R1YWxseVxuICAvLyBkZWZhdWx0IGNhcHMuXG4gIC8vIG9uY2UgdGhvc2UgZGVwcmVjYXRlZCBhcmdzIGFyZSBhY3R1YWxseSByZW1vdmVkLCB0aGlzXG4gIC8vIGNhbiBhbHNvIGJlIHJlbW92ZWRcbiAgcGFyc2VyLl9wYXJzZUFyZ3MgPSBwYXJzZXIucGFyc2VBcmdzO1xuICBwYXJzZXIucGFyc2VBcmdzID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICBsZXQgcGFyc2VkQXJncyA9IHBhcnNlci5fcGFyc2VBcmdzKGFyZ3MpO1xuICAgIHBhcnNlZEFyZ3MuZGVmYXVsdENhcGFiaWxpdGllcyA9IHBhcnNlZEFyZ3MuZGVmYXVsdENhcGFiaWxpdGllcyB8fCB7fTtcbiAgICBmb3IgKGxldCBhcmdFbnRyeSBvZiBkZXByZWNhdGVkQXJncykge1xuICAgICAgbGV0IGFyZyA9IGFyZ0VudHJ5WzFdLmRlc3Q7XG4gICAgICBpZiAoYXJnRW50cnlbMV0uZGVwcmVjYXRlZEZvciA9PT0gJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnKSB7XG4gICAgICAgIGlmIChhcmcgaW4gcGFyc2VkQXJncyAmJiBwYXJzZWRBcmdzW2FyZ10gIT09IGFyZ0VudHJ5WzFdLmRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgIHBhcnNlZEFyZ3MuZGVmYXVsdENhcGFiaWxpdGllc1thcmddID0gcGFyc2VkQXJnc1thcmddO1xuICAgICAgICAgIC8vIGogcyBoIGkgbiB0IGNhbid0IGhhbmRsZSBjb21wbGV4IGludGVycG9sYXRlZCBzdHJpbmdzXG4gICAgICAgICAgbGV0IGNhcERpY3QgPSB7W2FyZ106IHBhcnNlZEFyZ3NbYXJnXX07XG4gICAgICAgICAgYXJnRW50cnlbMV0uZGVwcmVjYXRlZEZvciA9IGAtLWRlZmF1bHQtY2FwYWJpbGl0aWVzIGAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJyR7SlNPTi5zdHJpbmdpZnkoY2FwRGljdCl9J2A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhcnNlZEFyZ3M7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhcnNlRGVmYXVsdENhcHMgKGNhcHMpIHtcbiAgdHJ5IHtcbiAgICAvLyB1c2Ugc3luY2hyb25vdXMgZmlsZSBhY2Nlc3MsIGFzIGBhcmdwYXJzZWAgcHJvdmlkZXMgbm8gd2F5IG9mIGVpdGhlclxuICAgIC8vIGF3YWl0aW5nIG9yIHVzaW5nIGNhbGxiYWNrcy4gVGhpcyBzdGVwIGhhcHBlbnMgaW4gc3RhcnR1cCwgaW4gd2hhdCBpc1xuICAgIC8vIGVmZmVjdGl2ZWx5IGNvbW1hbmQtbGluZSBjb2RlLCBzbyBub3RoaW5nIGlzIGJsb2NrZWQgaW4gdGVybXMgb2ZcbiAgICAvLyBzZXNzaW9ucywgc28gaG9sZGluZyB1cCB0aGUgZXZlbnQgbG9vcCBkb2VzIG5vdCBpbmN1ciB0aGUgdXN1YWxcbiAgICAvLyBkcmF3YmFja3MuXG4gICAgaWYgKGZzLnN0YXRTeW5jKGNhcHMpLmlzRmlsZSgpKSB7XG4gICAgICBjYXBzID0gZnMucmVhZEZpbGVTeW5jKGNhcHMsICd1dGY4Jyk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBub3QgYSBmaWxlLCBvciBub3QgcmVhZGFibGVcbiAgfVxuICBjYXBzID0gSlNPTi5wYXJzZShjYXBzKTtcbiAgaWYgKCFfLmlzUGxhaW5PYmplY3QoY2FwcykpIHtcbiAgICB0aHJvdyAnSW52YWxpZCBmb3JtYXQgZm9yIGRlZmF1bHQgY2FwYWJpbGl0aWVzJztcbiAgfVxuICByZXR1cm4gY2Fwcztcbn1cblxuZnVuY3Rpb24gZ2V0UGFyc2VyICgpIHtcbiAgbGV0IHBhcnNlciA9IG5ldyBBcmd1bWVudFBhcnNlcih7XG4gICAgdmVyc2lvbjogcmVxdWlyZShwYXRoLnJlc29sdmUocm9vdERpciwgJ3BhY2thZ2UuanNvbicpKS52ZXJzaW9uLFxuICAgIGFkZEhlbHA6IHRydWUsXG4gICAgZGVzY3JpcHRpb246ICdBIHdlYmRyaXZlci1jb21wYXRpYmxlIHNlcnZlciBmb3IgdXNlIHdpdGggbmF0aXZlIGFuZCBoeWJyaWQgaU9TIGFuZCBBbmRyb2lkIGFwcGxpY2F0aW9ucy4nLFxuICAgIHByb2c6IHByb2Nlc3MuYXJndlsxXSB8fCAnQXBwaXVtJ1xuICB9KTtcbiAgbGV0IGFsbEFyZ3MgPSBfLnVuaW9uKGFyZ3MsIGRlcHJlY2F0ZWRBcmdzKTtcbiAgcGFyc2VyLnJhd0FyZ3MgPSBhbGxBcmdzO1xuICBmb3IgKGxldCBhcmcgb2YgYWxsQXJncykge1xuICAgIHBhcnNlci5hZGRBcmd1bWVudChhcmdbMF0sIGFyZ1sxXSk7XG4gIH1cbiAgdXBkYXRlUGFyc2VBcmdzRm9yRGVmYXVsdENhcGFiaWxpdGllcyhwYXJzZXIpO1xuXG4gIHJldHVybiBwYXJzZXI7XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRBcmdzICgpIHtcbiAgbGV0IGRlZmF1bHRzID0ge307XG4gIGZvciAobGV0IFssIGFyZ10gb2YgYXJncykge1xuICAgIGRlZmF1bHRzW2FyZy5kZXN0XSA9IGFyZy5kZWZhdWx0VmFsdWU7XG4gIH1cbiAgcmV0dXJuIGRlZmF1bHRzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBnZXRQYXJzZXI7XG5leHBvcnQgeyBnZXREZWZhdWx0QXJncywgZ2V0UGFyc2VyIH07XG4iXSwiZmlsZSI6ImxpYi9wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
