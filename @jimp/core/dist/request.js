"use strict";

require("core-js/modules/es6.object.define-properties");

require("core-js/modules/es7.object.get-own-property-descriptors");

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.array.filter");

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.object.keys");

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.object.assign");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global XMLHttpRequest */
if (process.browser || process.env.ENVIRONMENT === 'BROWSER' || typeof process.versions.electron !== 'undefined' && process.type === 'renderer' && typeof XMLHttpRequest === 'function') {
  // If we run into a browser or the electron renderer process,
  // use XHR method instead of Request node module.
  module.exports = function (options, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', options.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function () {
      if (xhr.status < 400) {
        try {
          var data = Buffer.from(this.response);
          cb(null, xhr, data);
        } catch (error) {
          return cb(new Error('Response is not a buffer for url ' + options.url + '. Error: ' + error.message));
        }
      } else {
        cb(new Error('HTTP Status ' + xhr.status + ' for url ' + options.url));
      }
    });
    xhr.addEventListener('error', function (e) {
      cb(e);
    });
    xhr.send();
  };
} else {
  module.exports = function (_ref, cb) {
    var options = Object.assign({}, _ref);

    var p = require('phin');

    p(_objectSpread({
      compression: true
    }, options), function (err, res) {
      if (err === null) {
        cb(null, res, res.body);
      } else {
        cb(err);
      }
    });
  };
}
//# sourceMappingURL=request.js.map