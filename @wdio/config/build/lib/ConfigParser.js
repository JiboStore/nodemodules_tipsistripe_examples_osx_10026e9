"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _glob = _interopRequireDefault(require("glob"));

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _logger = _interopRequireDefault(require("@wdio/logger"));

var _utils = require("../utils");

var _constants = require("../constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _logger.default)('@wdio/config:ConfigParser');
const MERGE_OPTIONS = {
  clone: false
};

class ConfigParser {
  constructor() {
    this._config = _constants.DEFAULT_CONFIGS;
    this._capabilities = [];
  }

  addConfigFile(filename) {
    if (typeof filename !== 'string') {
      throw new Error('addConfigFile requires filepath');
    }

    var filePath = _path.default.resolve(process.cwd(), filename);

    try {
      var fileConfig = (0, _deepmerge.default)(require(filePath).config, {}, MERGE_OPTIONS);
      const defaultTo = Array.isArray(this._capabilities) ? [] : {};
      this._capabilities = (0, _deepmerge.default)(this._capabilities, fileConfig.capabilities || defaultTo, MERGE_OPTIONS);
      delete fileConfig.capabilities;
      this.addService(fileConfig);

      for (let hookName of _constants.SUPPORTED_HOOKS) {
        delete fileConfig[hookName];
      }

      this._config = (0, _deepmerge.default)(this._config, fileConfig, MERGE_OPTIONS);

      const isRDC = Array.isArray(this._capabilities) && this._capabilities.some(capability => 'testobject_api_key' in capability);

      this._config = (0, _deepmerge.default)((0, _utils.detectBackend)(this._config, isRDC), this._config, MERGE_OPTIONS);
      delete this._config.watch;
    } catch (e) {
      log.error(`Failed loading configuration file: ${filePath}:`, e.message);
      throw e;
    }
  }

  merge(object = {}) {
    this._config = (0, _deepmerge.default)(this._config, object, MERGE_OPTIONS);
    let spec = Array.isArray(object.spec) ? object.spec : [];
    let exclude = Array.isArray(object.exclude) ? object.exclude : [];

    if (object.specs && object.specs.length > 0) {
      this._config.specs = object.specs;
    } else if (object.exclude && object.exclude.length > 0) {
      this._config.exclude = object.exclude;
    }

    const defaultTo = Array.isArray(this._capabilities) ? [] : {};
    this._capabilities = (0, _deepmerge.default)(this._capabilities, this._config.capabilities || defaultTo, MERGE_OPTIONS);

    if (this._config.spec && (0, _utils.isCucumberFeatureWithLineNumber)(this._config.spec)) {
      this._config.cucumberFeaturesWithLineNumbers = Array.isArray(this._config.spec) ? [...this._config.spec] : [this._config.spec];
    }

    if (spec.length > 0) {
      this._config.specs = [...this.setFilePathToFilterOptions(spec, this._config.specs)];
    }

    if (exclude.length > 0) {
      this._config.exclude = [...this.setFilePathToFilterOptions(exclude, this._config.exclude)];
    }

    let defaultBackend = (0, _utils.detectBackend)({});

    if (this._config.hostname === defaultBackend.hostname && this._config.port === defaultBackend.port && this._config.protocol === defaultBackend.protocol) {
      delete this._config.hostname;
      delete this._config.port;
      delete this._config.protocol;
    }

    this._config = (0, _deepmerge.default)((0, _utils.detectBackend)(this._config), this._config, MERGE_OPTIONS);
  }

  addService(service) {
    for (let hookName of _constants.SUPPORTED_HOOKS) {
      if (!service[hookName]) {
        continue;
      }

      if (typeof service[hookName] === 'function') {
        this._config[hookName].push(service[hookName].bind(service));
      } else if (Array.isArray(service[hookName])) {
        for (let hook of service[hookName]) {
          if (typeof hook === 'function') {
            this._config[hookName].push(hook.bind(service));
          }
        }
      }
    }
  }

  getSpecs(capSpecs, capExclude) {
    let specs = ConfigParser.getFilePaths(this._config.specs);
    let spec = Array.isArray(this._config.spec) ? this._config.spec : [];
    let exclude = ConfigParser.getFilePaths(this._config.exclude);
    let suites = Array.isArray(this._config.suite) ? this._config.suite : [];

    if (suites.length > 0) {
      let suiteSpecs = [];

      for (let suiteName of suites) {
        let suite = this._config.suites[suiteName];

        if (suite && Array.isArray(suite)) {
          suiteSpecs = suiteSpecs.concat(ConfigParser.getFilePaths(suite));
        }
      }

      if (suiteSpecs.length === 0) {
        throw new Error(`The suite(s) "${suites.join('", "')}" you specified don't exist ` + 'in your config file or doesn\'t contain any files!');
      }

      let tmpSpecs = spec.length > 0 ? [...specs, ...suiteSpecs] : suiteSpecs;

      if (Array.isArray(capSpecs)) {
        tmpSpecs = ConfigParser.getFilePaths(capSpecs);
      }

      if (Array.isArray(capExclude)) {
        exclude = ConfigParser.getFilePaths(capExclude);
      }

      specs = [...new Set(tmpSpecs)];
      return specs.filter(spec => !exclude.includes(spec));
    }

    if (Array.isArray(capSpecs)) {
      specs = ConfigParser.getFilePaths(capSpecs);
    }

    if (Array.isArray(capExclude)) {
      exclude = ConfigParser.getFilePaths(capExclude);
    }

    return specs.filter(spec => !exclude.includes(spec));
  }

  setFilePathToFilterOptions(cliArgFileList, config) {
    const filesToFilter = new Set();
    const fileList = ConfigParser.getFilePaths(config);
    cliArgFileList.forEach(filteredFile => {
      filteredFile = (0, _utils.removeLineNumbers)(filteredFile);
      let globMatchedFiles = ConfigParser.getFilePaths(_glob.default.sync(filteredFile));

      if (_fs.default.existsSync(filteredFile) && _fs.default.lstatSync(filteredFile).isFile()) {
        filesToFilter.add(_path.default.resolve(process.cwd(), filteredFile));
      } else if (globMatchedFiles.length) {
        globMatchedFiles.forEach(file => filesToFilter.add(file));
      } else {
        fileList.forEach(file => {
          if (file.match(filteredFile)) {
            filesToFilter.add(file);
          }
        });
      }
    });

    if (filesToFilter.size === 0) {
      throw new Error(`spec file(s) ${cliArgFileList.join(', ')} not found`);
    }

    return filesToFilter;
  }

  getConfig() {
    return this._config;
  }

  getCapabilities(i) {
    if (typeof i === 'number' && this._capabilities[i]) {
      return this._capabilities[i];
    }

    return this._capabilities;
  }

  static getFilePaths(patterns, omitWarnings) {
    let files = [];

    if (typeof patterns === 'string') {
      patterns = (0, _utils.removeLineNumbers)(patterns);
      patterns = [patterns];
    } else {
      patterns = patterns.map(pattern => (0, _utils.removeLineNumbers)(pattern));
    }

    if (!Array.isArray(patterns)) {
      throw new Error('specs or exclude property should be an array of strings');
    }

    for (let pattern of patterns) {
      let filenames = _glob.default.sync(pattern);

      filenames = filenames.filter(filename => filename.slice(-3) === '.js' || filename.slice(-4) === '.mjs' || filename.slice(-4) === '.es6' || filename.slice(-3) === '.ts' || filename.slice(-8) === '.feature' || filename.slice(-7) === '.coffee');
      filenames = filenames.map(filename => _path.default.isAbsolute(filename) ? _path.default.normalize(filename) : _path.default.resolve(process.cwd(), filename));

      if (filenames.length === 0 && !omitWarnings) {
        log.warn('pattern', pattern, 'did not match any file');
      }

      files = (0, _deepmerge.default)(files, filenames, MERGE_OPTIONS);
    }

    return files;
  }

  filterWorkerServices() {
    if (!Array.isArray(this._config.services)) {
      return;
    }

    this._config.services = this._config.services.filter(service => {
      return !_constants.NON_WORKER_SERVICES.includes(service);
    });
  }

}

exports.default = ConfigParser;