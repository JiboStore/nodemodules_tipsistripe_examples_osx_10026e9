"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initialisePlugin;

var _utils = require("./utils");

function initialisePlugin(name, type, target = 'default') {
  if (name[0] === '@') {
    const service = (0, _utils.safeRequire)(name);
    return service[target];
  }

  const scopedPlugin = (0, _utils.safeRequire)(`@wdio/${name.toLowerCase()}-${type}`);

  if (scopedPlugin) {
    return scopedPlugin[target];
  }

  const plugin = (0, _utils.safeRequire)(`wdio-${name.toLowerCase()}-${type}`);

  if (plugin) {
    return plugin[target];
  }

  throw new Error(`Couldn't find plugin "${name}" ${type}, neither as wdio scoped package ` + `"@wdio/${name.toLowerCase()}-${type}" nor as community package ` + `"wdio-${name.toLowerCase()}-${type}". Please make sure you have it installed!`);
}