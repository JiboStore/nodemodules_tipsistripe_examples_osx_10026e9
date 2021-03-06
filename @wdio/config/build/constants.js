"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NON_WORKER_SERVICES = exports.SUPPORTED_HOOKS = exports.DEFAULT_CONFIGS = void 0;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_CONFIGS = {
  specs: [],
  suites: {},
  exclude: [],
  outputDir: undefined,
  logLevel: 'info',
  logLevels: {},
  excludeDriverLogs: [],
  baseUrl: undefined,
  bail: 0,
  waitforInterval: 500,
  waitforTimeout: 5000,
  framework: 'mocha',
  reporters: [],
  maxInstances: 100,
  maxInstancesPerCapability: 100,
  filesToWatch: [],
  connectionRetryCount: 3,
  execArgv: [],
  runnerEnv: {},
  runner: 'local',
  featureFlags: {
    specFiltering: undefined
  },
  mochaOpts: {
    timeout: DEFAULT_TIMEOUT
  },
  jasmineNodeOpts: {
    defaultTimeoutInterval: DEFAULT_TIMEOUT
  },
  cucumberOpts: {
    timeout: DEFAULT_TIMEOUT
  },
  onPrepare: [],
  before: [],
  beforeSession: [],
  beforeSuite: [],
  beforeHook: [],
  beforeTest: [],
  beforeCommand: [],
  afterCommand: [],
  afterTest: [],
  afterHook: [],
  afterSuite: [],
  afterSession: [],
  after: [],
  onComplete: [],
  onReload: [],
  beforeFeature: [],
  beforeScenario: [],
  beforeStep: [],
  afterStep: [],
  afterScenario: [],
  afterFeature: []
};
exports.DEFAULT_CONFIGS = DEFAULT_CONFIGS;
const SUPPORTED_HOOKS = ['before', 'beforeSession', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand', 'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'afterSession', 'after', 'beforeFeature', 'beforeScenario', 'beforeStep', 'afterStep', 'afterScenario', 'afterFeature', 'onReload', 'onPrepare', 'onComplete'];
exports.SUPPORTED_HOOKS = SUPPORTED_HOOKS;
const NON_WORKER_SERVICES = ['chromedriver', 'selenium-standalone', 'appium', 'reportportal', 'firefox-profile'];
exports.NON_WORKER_SERVICES = NON_WORKER_SERVICES;