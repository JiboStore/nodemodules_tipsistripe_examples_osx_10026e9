"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testFrameworkFnWrapper = exports.testFnWrapper = void 0;

var _utils = require("../utils");

var _errorHandler = require("./errorHandler");

var _shim = require("../shim");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const testFnWrapper = function (...args) {
  return testFrameworkFnWrapper.call(this, {
    executeHooksWithArgs: _shim.executeHooksWithArgs,
    executeAsync: _shim.executeAsync,
    runSync: _shim.runSync
  }, ...args);
};

exports.testFnWrapper = testFnWrapper;

const testFrameworkFnWrapper = async function ({
  executeHooksWithArgs,
  executeAsync,
  runSync
}, type, {
  specFn,
  specFnArgs
}, {
  beforeFn,
  beforeFnArgs
}, {
  afterFn,
  afterFnArgs
}, cid, repeatTest = 0) {
  const retries = {
    attempts: 0,
    limit: repeatTest
  };
  const beforeArgs = mochaJasmineCompatibility(beforeFnArgs(this), this);
  await (0, _errorHandler.logHookError)(`Before${type}`, (await executeHooksWithArgs(beforeFn, beforeArgs)), cid);
  let promise;
  let result;
  let error;

  if ((0, _utils.isFunctionAsync)(specFn) || !runSync) {
    promise = executeAsync.call(this, specFn, retries, specFnArgs);
  } else {
    promise = new Promise(runSync.call(this, specFn, retries, specFnArgs));
  }

  const testStart = Date.now();

  try {
    result = await promise;
  } catch (err) {
    error = err;
  }

  const duration = Date.now() - testStart;
  let afterArgs = afterFnArgs(this);

  if (!error && afterArgs[0] && afterArgs[0].failedExpectations && afterArgs[0].failedExpectations.length) {
    error = afterArgs[0].failedExpectations[0];
  }

  afterArgs.push({
    retries,
    error,
    result,
    duration,
    passed: !error
  });
  afterArgs = mochaJasmineCompatibility(afterArgs, this);
  afterArgs = mochaJasmineResultCompatibility(afterArgs, error, duration);
  afterArgs = cucumberCompatibility(afterArgs);
  await (0, _errorHandler.logHookError)(`After${type}`, (await executeHooksWithArgs(afterFn, [...afterArgs])), cid);

  if (error) {
    throw error;
  }

  return result;
};

exports.testFrameworkFnWrapper = testFrameworkFnWrapper;

const mochaJasmineCompatibility = (hookArgs, {
  test = {}
} = {}) => {
  let args = hookArgs;

  if (hookArgs.length < 4 && hookArgs[0] && typeof hookArgs[0] === 'object') {
    if (!args[0].title) {
      args[0].title = args[0].description;
    }

    args[0].fullTitle = test.fullTitle ? test.fullTitle() : hookArgs[0].fullName ? hookArgs[0].fullName : undefined;
  }

  return args;
};

const mochaJasmineResultCompatibility = (afterArgs, error, duration) => {
  let args = afterArgs;

  if (afterArgs.length === 3 && afterArgs[0] && typeof afterArgs[0] === 'object') {
    args = [_objectSpread({}, afterArgs[0], {
      error,
      duration,
      passed: !error
    }), ...afterArgs.slice(1)];
  }

  return args;
};

const cucumberCompatibility = afterArgs => {
  let args = afterArgs;

  if (afterArgs.length === 5) {
    args = [...afterArgs.slice(0, 2), afterArgs[4], ...afterArgs.slice(2, 4)];
  }

  return args;
};