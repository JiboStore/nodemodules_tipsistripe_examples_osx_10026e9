"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSauceEndpoint = getSauceEndpoint;
exports.removeLineNumbers = removeLineNumbers;
exports.isCucumberFeatureWithLineNumber = isCucumberFeatureWithLineNumber;
exports.detectBackend = detectBackend;
exports.validateConfig = validateConfig;
const DEFAULT_HOSTNAME = '127.0.0.1';
const DEFAULT_PORT = 4444;
const DEFAULT_PROTOCOL = 'http';
const REGION_MAPPING = {
  'us': '',
  'eu': 'eu-central-1.',
  'eu-central-1': 'eu-central-1.',
  'us-east-1': 'us-east-1.'
};

function getSauceEndpoint(region, isRDC) {
  const shortRegion = REGION_MAPPING[region] ? region : 'us';

  if (isRDC) {
    return `${shortRegion}1.appium.testobject.com`;
  }

  return `ondemand.${REGION_MAPPING[shortRegion]}saucelabs.com`;
}

function removeLineNumbers(filePath) {
  const matcher = filePath.match(/:\d+(:\d+$|$)/);

  if (matcher) {
    filePath = filePath.substring(0, matcher.index);
  }

  return filePath;
}

function isCucumberFeatureWithLineNumber(spec) {
  const specs = Array.isArray(spec) ? spec : [spec];
  return specs.some(s => s.match(/:\d+(:\d+$|$)/));
}

function detectBackend(options = {}, isRDC = false) {
  let {
    port,
    hostname,
    user,
    key,
    protocol,
    region,
    headless
  } = options;

  if (typeof user === 'string' && typeof key === 'string' && key.length === 20) {
    return {
      protocol: 'https',
      hostname: 'hub-cloud.browserstack.com',
      port: 443
    };
  }

  if (typeof user === 'string' && typeof key === 'string' && key.length === 32) {
    return {
      hostname: 'hub.testingbot.com',
      port: 80
    };
  }

  if (typeof user === 'string' && typeof key === 'string' && key.length === 36 || typeof user === 'string' && isRDC || isRDC) {
    const sauceRegion = headless ? 'us-east-1' : region;
    return {
      protocol: protocol || 'https',
      hostname: hostname || getSauceEndpoint(sauceRegion, isRDC),
      port: port || 443
    };
  }

  if ((typeof user === 'string' || typeof key === 'string') && !hostname) {
    throw new Error('A "user" or "key" was provided but could not be connected to a ' + 'known cloud service (SauceLabs, Browerstack or Testingbot). ' + 'Please check if given user and key properties are correct!');
  }

  return {
    hostname: hostname || DEFAULT_HOSTNAME,
    port: port || DEFAULT_PORT,
    protocol: protocol || DEFAULT_PROTOCOL
  };
}

function validateConfig(defaults, options) {
  const params = {};

  for (const [name, expectedOption] of Object.entries(defaults)) {
    if (typeof options[name] === 'undefined' && !expectedOption.default && expectedOption.required) {
      throw new Error(`Required option "${name}" is missing`);
    }

    if (typeof options[name] === 'undefined' && expectedOption.default) {
      params[name] = expectedOption.default;
    }

    if (typeof options[name] !== 'undefined') {
      if (typeof expectedOption.type === 'string' && typeof options[name] !== expectedOption.type) {
        throw new Error(`Expected option "${name}" to be type of ${expectedOption.type} but was ${typeof options[name]}`);
      }

      if (typeof expectedOption.type === 'function') {
        try {
          expectedOption.type(options[name]);
        } catch (e) {
          throw new Error(`Type check for option "${name}" failed: ${e.message}`);
        }
      }

      if (expectedOption.match && !options[name].match(expectedOption.match)) {
        throw new Error(`Option "${name}" doesn't match expected values: ${expectedOption.match}`);
      }

      params[name] = options[name];
    }
  }

  return params;
}