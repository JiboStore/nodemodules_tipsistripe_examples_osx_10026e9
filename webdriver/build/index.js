"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getPrototype", {
  enumerable: true,
  get: function () {
    return _utils2.getPrototype;
  }
});
exports.default = void 0;

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _utils = require("@wdio/utils");

var _config = require("@wdio/config");

var _request = _interopRequireDefault(require("./request"));

var _constants = require("./constants");

var _utils2 = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class WebDriver {
  static async newSession(options = {}, modifier, userPrototype = {}, customCommandWrapper) {
    const params = (0, _config.validateConfig)(_constants.DEFAULTS, options);

    if (!options.logLevels || !options.logLevels['webdriver']) {
      _logger.default.setLevel('webdriver', params.logLevel);
    }

    if (params.enableDirectConnect) {
      (0, _utils2.setupDirectConnect)(params);
    }

    const sessionId = await (0, _utils2.startWebDriverSession)(params);
    const environment = (0, _utils.sessionEnvironmentDetector)(params);
    const environmentPrototype = (0, _utils2.getEnvironmentVars)(environment);
    const protocolCommands = (0, _utils2.getPrototype)(environment);

    const prototype = _objectSpread({}, protocolCommands, {}, environmentPrototype, {}, userPrototype);

    const monad = (0, _utils.webdriverMonad)(params, modifier, prototype);
    return monad(sessionId, customCommandWrapper);
  }

  static attachToSession(options = {}, modifier, userPrototype = {}, commandWrapper) {
    if (typeof options.sessionId !== 'string') {
      throw new Error('sessionId is required to attach to existing session');
    }

    if (options.logLevel !== undefined) {
      _logger.default.setLevel('webdriver', options.logLevel);
    }

    options.capabilities = options.capabilities || {};
    options.isW3C = options.isW3C === false ? false : true;
    const environmentPrototype = (0, _utils2.getEnvironmentVars)(options);
    const protocolCommands = (0, _utils2.getPrototype)(options);

    const prototype = _objectSpread({}, protocolCommands, {}, environmentPrototype, {}, userPrototype);

    const monad = (0, _utils.webdriverMonad)(options, modifier, prototype);
    return monad(options.sessionId, commandWrapper);
  }

  static async reloadSession(instance) {
    const {
      w3cCaps,
      jsonwpCaps
    } = instance.options.requestedCapabilities;
    const sessionRequest = new _request.default('POST', '/session', {
      capabilities: w3cCaps,
      desiredCapabilities: jsonwpCaps
    });
    const response = await sessionRequest.makeRequest(instance.options);
    const newSessionId = response.sessionId || response.value && response.value.sessionId;
    instance.sessionId = newSessionId;
    return newSessionId;
  }

  static get WebDriver() {
    return WebDriver;
  }

  static get DEFAULTS() {
    return _constants.DEFAULTS;
  }

}

exports.default = WebDriver;