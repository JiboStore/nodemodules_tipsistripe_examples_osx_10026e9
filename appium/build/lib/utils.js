"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inspectObject = inspectObject;
exports.parseCapsForInnerDriver = parseCapsForInnerDriver;
exports.insertAppiumPrefixes = insertAppiumPrefixes;
exports.getPackageVersion = getPackageVersion;
exports.rootDir = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _findRoot = _interopRequireDefault(require("find-root"));

const W3C_APPIUM_PREFIX = 'appium';

function inspectObject(args) {
  function getValueArray(obj, indent = '  ') {
    if (!_lodash.default.isObject(obj)) {
      return [obj];
    }

    let strArr = ['{'];

    for (let [arg, value] of _lodash.default.toPairs(obj)) {
      if (!_lodash.default.isObject(value)) {
        strArr.push(`${indent}  ${arg}: ${value}`);
      } else {
        value = getValueArray(value, `${indent}  `);
        strArr.push(`${indent}  ${arg}: ${value.shift()}`);
        strArr.push(...value);
      }
    }

    strArr.push(`${indent}}`);
    return strArr;
  }

  for (let [arg, value] of _lodash.default.toPairs(args)) {
    value = getValueArray(value);

    _logger.default.info(`  ${arg}: ${value.shift()}`);

    for (let val of value) {
      _logger.default.info(val);
    }
  }
}

function parseCapsForInnerDriver(jsonwpCapabilities, w3cCapabilities, constraints = {}, defaultCapabilities = {}) {
  const hasW3CCaps = _lodash.default.isPlainObject(w3cCapabilities) && (_lodash.default.has(w3cCapabilities, 'alwaysMatch') || _lodash.default.has(w3cCapabilities, 'firstMatch'));

  const hasJSONWPCaps = _lodash.default.isPlainObject(jsonwpCapabilities);

  let protocol = null;
  let desiredCaps = {};
  let processedW3CCapabilities = null;
  let processedJsonwpCapabilities = null;

  if (!hasJSONWPCaps && !hasW3CCaps) {
    return {
      protocol: _appiumBaseDriver.BaseDriver.DRIVER_PROTOCOL.W3C,
      error: new Error('Either JSONWP or W3C capabilities should be provided')
    };
  }

  const {
    W3C,
    MJSONWP
  } = _appiumBaseDriver.BaseDriver.DRIVER_PROTOCOL;
  jsonwpCapabilities = _lodash.default.cloneDeep(jsonwpCapabilities);
  w3cCapabilities = _lodash.default.cloneDeep(w3cCapabilities);
  defaultCapabilities = _lodash.default.cloneDeep(defaultCapabilities);

  if (!_lodash.default.isEmpty(defaultCapabilities)) {
    if (hasW3CCaps) {
      const {
        firstMatch = [],
        alwaysMatch = {}
      } = w3cCapabilities;

      for (const [defaultCapKey, defaultCapValue] of _lodash.default.toPairs(defaultCapabilities)) {
        let isCapAlreadySet = false;

        for (const firstMatchEntry of firstMatch) {
          if (_lodash.default.has(removeW3CPrefixes(firstMatchEntry), removeW3CPrefix(defaultCapKey))) {
            isCapAlreadySet = true;
            break;
          }
        }

        isCapAlreadySet = isCapAlreadySet || _lodash.default.has(removeW3CPrefixes(alwaysMatch), removeW3CPrefix(defaultCapKey));

        if (isCapAlreadySet) {
          continue;
        }

        if (_lodash.default.isEmpty(firstMatch)) {
          w3cCapabilities.firstMatch = [{
            [defaultCapKey]: defaultCapValue
          }];
        } else {
          firstMatch[0][defaultCapKey] = defaultCapValue;
        }
      }
    }

    if (hasJSONWPCaps) {
      jsonwpCapabilities = Object.assign({}, removeW3CPrefixes(defaultCapabilities), jsonwpCapabilities);
    }
  }

  if (hasJSONWPCaps) {
    protocol = MJSONWP;
    desiredCaps = jsonwpCapabilities;
    processedJsonwpCapabilities = removeW3CPrefixes((0, _objectSpread2.default)({}, desiredCaps));
  }

  if (hasW3CCaps) {
    protocol = W3C;
    let isFixingNeededForW3cCaps = false;

    try {
      desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
    } catch (error) {
      if (!hasJSONWPCaps) {
        return {
          desiredCaps,
          processedJsonwpCapabilities,
          processedW3CCapabilities,
          protocol,
          error
        };
      }

      _logger.default.info(`Could not parse W3C capabilities: ${error.message}`);

      isFixingNeededForW3cCaps = true;
    }

    if (hasJSONWPCaps && !isFixingNeededForW3cCaps) {
      const differingKeys = _lodash.default.difference(_lodash.default.keys(processedJsonwpCapabilities), _lodash.default.keys(removeW3CPrefixes(desiredCaps)));

      if (!_lodash.default.isEmpty(differingKeys)) {
        _logger.default.info(`The following capabilities were provided in the JSONWP desired capabilities that are missing ` + `in W3C capabilities: ${JSON.stringify(differingKeys)}`);

        isFixingNeededForW3cCaps = true;
      }
    }

    if (isFixingNeededForW3cCaps && hasJSONWPCaps) {
      _logger.default.info('Trying to fix W3C capabilities by merging them with JSONWP caps');

      w3cCapabilities = fixW3cCapabilities(w3cCapabilities, jsonwpCapabilities);

      try {
        desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
      } catch (error) {
        _logger.default.warn(`Could not parse fixed W3C capabilities: ${error.message}. Falling back to JSONWP protocol`);

        return {
          desiredCaps: processedJsonwpCapabilities,
          processedJsonwpCapabilities,
          processedW3CCapabilities: null,
          protocol: MJSONWP
        };
      }
    }

    processedW3CCapabilities = {
      alwaysMatch: (0, _objectSpread2.default)({}, insertAppiumPrefixes(desiredCaps)),
      firstMatch: [{}]
    };
  }

  return {
    desiredCaps,
    processedJsonwpCapabilities,
    processedW3CCapabilities,
    protocol
  };
}

function fixW3cCapabilities(w3cCaps, jsonwpCaps) {
  const result = {
    firstMatch: w3cCaps.firstMatch || [],
    alwaysMatch: w3cCaps.alwaysMatch || {}
  };

  const keysToInsert = _lodash.default.keys(jsonwpCaps);

  const removeMatchingKeys = match => {
    _lodash.default.pull(keysToInsert, match);

    const colonIndex = match.indexOf(':');

    if (colonIndex >= 0 && match.length > colonIndex) {
      _lodash.default.pull(keysToInsert, match.substring(colonIndex + 1));
    }

    if (keysToInsert.includes(`${W3C_APPIUM_PREFIX}:${match}`)) {
      _lodash.default.pull(keysToInsert, `${W3C_APPIUM_PREFIX}:${match}`);
    }
  };

  for (const firstMatchEntry of result.firstMatch) {
    for (const pair of _lodash.default.toPairs(firstMatchEntry)) {
      removeMatchingKeys(pair[0]);
    }
  }

  for (const pair of _lodash.default.toPairs(result.alwaysMatch)) {
    removeMatchingKeys(pair[0]);
  }

  for (const key of keysToInsert) {
    result.alwaysMatch[key] = jsonwpCaps[key];
  }

  return result;
}

function insertAppiumPrefixes(caps) {
  const STANDARD_CAPS = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];
  let prefixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    if (STANDARD_CAPS.includes(name) || name.includes(':')) {
      prefixedCaps[name] = value;
    } else {
      prefixedCaps[`${W3C_APPIUM_PREFIX}:${name}`] = value;
    }
  }

  return prefixedCaps;
}

function removeW3CPrefixes(caps) {
  if (!_lodash.default.isPlainObject(caps)) {
    return caps;
  }

  const fixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    fixedCaps[removeW3CPrefix(name)] = value;
  }

  return fixedCaps;
}

function removeW3CPrefix(key) {
  const colonPos = key.indexOf(':');
  return colonPos > 0 && key.length > colonPos ? key.substring(colonPos + 1) : key;
}

function getPackageVersion(pkgName) {
  const pkgInfo = require(`${pkgName}/package.json`) || {};
  return pkgInfo.version;
}

const rootDir = (0, _findRoot.default)(__dirname);
exports.rootDir = rootDir;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJXM0NfQVBQSVVNX1BSRUZJWCIsImluc3BlY3RPYmplY3QiLCJhcmdzIiwiZ2V0VmFsdWVBcnJheSIsIm9iaiIsImluZGVudCIsIl8iLCJpc09iamVjdCIsInN0ckFyciIsImFyZyIsInZhbHVlIiwidG9QYWlycyIsInB1c2giLCJzaGlmdCIsImxvZ2dlciIsImluZm8iLCJ2YWwiLCJwYXJzZUNhcHNGb3JJbm5lckRyaXZlciIsImpzb253cENhcGFiaWxpdGllcyIsInczY0NhcGFiaWxpdGllcyIsImNvbnN0cmFpbnRzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImhhc1czQ0NhcHMiLCJpc1BsYWluT2JqZWN0IiwiaGFzIiwiaGFzSlNPTldQQ2FwcyIsInByb3RvY29sIiwiZGVzaXJlZENhcHMiLCJwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMiLCJwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMiLCJCYXNlRHJpdmVyIiwiRFJJVkVSX1BST1RPQ09MIiwiVzNDIiwiZXJyb3IiLCJFcnJvciIsIk1KU09OV1AiLCJjbG9uZURlZXAiLCJpc0VtcHR5IiwiZmlyc3RNYXRjaCIsImFsd2F5c01hdGNoIiwiZGVmYXVsdENhcEtleSIsImRlZmF1bHRDYXBWYWx1ZSIsImlzQ2FwQWxyZWFkeVNldCIsImZpcnN0TWF0Y2hFbnRyeSIsInJlbW92ZVczQ1ByZWZpeGVzIiwicmVtb3ZlVzNDUHJlZml4IiwiT2JqZWN0IiwiYXNzaWduIiwiaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzIiwibWVzc2FnZSIsImRpZmZlcmluZ0tleXMiLCJkaWZmZXJlbmNlIiwia2V5cyIsIkpTT04iLCJzdHJpbmdpZnkiLCJmaXhXM2NDYXBhYmlsaXRpZXMiLCJ3YXJuIiwiaW5zZXJ0QXBwaXVtUHJlZml4ZXMiLCJ3M2NDYXBzIiwianNvbndwQ2FwcyIsInJlc3VsdCIsImtleXNUb0luc2VydCIsInJlbW92ZU1hdGNoaW5nS2V5cyIsIm1hdGNoIiwicHVsbCIsImNvbG9uSW5kZXgiLCJpbmRleE9mIiwibGVuZ3RoIiwic3Vic3RyaW5nIiwiaW5jbHVkZXMiLCJwYWlyIiwia2V5IiwiY2FwcyIsIlNUQU5EQVJEX0NBUFMiLCJwcmVmaXhlZENhcHMiLCJuYW1lIiwiZml4ZWRDYXBzIiwiY29sb25Qb3MiLCJnZXRQYWNrYWdlVmVyc2lvbiIsInBrZ05hbWUiLCJwa2dJbmZvIiwicmVxdWlyZSIsInZlcnNpb24iLCJyb290RGlyIiwiX19kaXJuYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLGlCQUFpQixHQUFHLFFBQTFCOztBQUVBLFNBQVNDLGFBQVQsQ0FBd0JDLElBQXhCLEVBQThCO0FBQzVCLFdBQVNDLGFBQVQsQ0FBd0JDLEdBQXhCLEVBQTZCQyxNQUFNLEdBQUcsSUFBdEMsRUFBNEM7QUFDMUMsUUFBSSxDQUFDQyxnQkFBRUMsUUFBRixDQUFXSCxHQUFYLENBQUwsRUFBc0I7QUFDcEIsYUFBTyxDQUFDQSxHQUFELENBQVA7QUFDRDs7QUFFRCxRQUFJSSxNQUFNLEdBQUcsQ0FBQyxHQUFELENBQWI7O0FBQ0EsU0FBSyxJQUFJLENBQUNDLEdBQUQsRUFBTUMsS0FBTixDQUFULElBQXlCSixnQkFBRUssT0FBRixDQUFVUCxHQUFWLENBQXpCLEVBQXlDO0FBQ3ZDLFVBQUksQ0FBQ0UsZ0JBQUVDLFFBQUYsQ0FBV0csS0FBWCxDQUFMLEVBQXdCO0FBQ3RCRixRQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBYSxHQUFFUCxNQUFPLEtBQUlJLEdBQUksS0FBSUMsS0FBTSxFQUF4QztBQUNELE9BRkQsTUFFTztBQUNMQSxRQUFBQSxLQUFLLEdBQUdQLGFBQWEsQ0FBQ08sS0FBRCxFQUFTLEdBQUVMLE1BQU8sSUFBbEIsQ0FBckI7QUFDQUcsUUFBQUEsTUFBTSxDQUFDSSxJQUFQLENBQWEsR0FBRVAsTUFBTyxLQUFJSSxHQUFJLEtBQUlDLEtBQUssQ0FBQ0csS0FBTixFQUFjLEVBQWhE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SUFBSyxFQUE5QixDQUFaLEdBQStDakUsS0FBL0M7QUFDRDtBQUNGOztBQUNELFNBQU9nRSxZQUFQO0FBQ0Q7O0FBRUQsU0FBUzlCLGlCQUFULENBQTRCNEIsSUFBNUIsRUFBa0M7QUFDaEMsTUFBSSxDQUFDbEUsZ0JBQUVpQixhQUFGLENBQWdCaUQsSUFBaEIsQ0FBTCxFQUE0QjtBQUMxQixXQUFPQSxJQUFQO0FBQ0Q7O0FBRUQsUUFBTUksU0FBUyxHQUFHLEVBQWxCOztBQUNBLE9BQUssSUFBSSxDQUFDRCxJQUFELEVBQU9qRSxLQUFQLENBQVQsSUFBMEJKLGdCQUFFSyxPQUFGLENBQVU2RCxJQUFWLENBQTFCLEVBQTJDO0FBQ3pDSSxJQUFBQSxTQUFTLENBQUMvQixlQUFlLENBQUM4QixJQUFELENBQWhCLENBQVQsR0FBbUNqRSxLQUFuQztBQUNEOztBQUNELFNBQU9rRSxTQUFQO0FBQ0Q7O0FBRUQsU0FBUy9CLGVBQVQsQ0FBMEIwQixHQUExQixFQUErQjtBQUM3QixRQUFNTSxRQUFRLEdBQUdOLEdBQUcsQ0FBQ0wsT0FBSixDQUFZLEdBQVosQ0FBakI7QUFDQSxTQUFPVyxRQUFRLEdBQUcsQ0FBWCxJQUFnQk4sR0FBRyxDQUFDSixNQUFKLEdBQWFVLFFBQTdCLEdBQXdDTixHQUFHLENBQUNILFNBQUosQ0FBY1MsUUFBUSxHQUFHLENBQXpCLENBQXhDLEdBQXNFTixHQUE3RTtBQUNEOztBQUVELFNBQVNPLGlCQUFULENBQTRCQyxPQUE1QixFQUFxQztBQUNuQyxRQUFNQyxPQUFPLEdBQUdDLE9BQU8sQ0FBRSxHQUFFRixPQUFRLGVBQVosQ0FBUCxJQUFzQyxFQUF0RDtBQUNBLFNBQU9DLE9BQU8sQ0FBQ0UsT0FBZjtBQUNEOztBQUVELE1BQU1DLE9BQU8sR0FBRyx1QkFBU0MsU0FBVCxDQUFoQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHByb2Nlc3NDYXBhYmlsaXRpZXMsIEJhc2VEcml2ZXIgfSBmcm9tICdhcHBpdW0tYmFzZS1kcml2ZXInO1xuaW1wb3J0IGZpbmRSb290IGZyb20gJ2ZpbmQtcm9vdCc7XG5cbmNvbnN0IFczQ19BUFBJVU1fUFJFRklYID0gJ2FwcGl1bSc7XG5cbmZ1bmN0aW9uIGluc3BlY3RPYmplY3QgKGFyZ3MpIHtcbiAgZnVuY3Rpb24gZ2V0VmFsdWVBcnJheSAob2JqLCBpbmRlbnQgPSAnICAnKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHJldHVybiBbb2JqXTtcbiAgICB9XG5cbiAgICBsZXQgc3RyQXJyID0gWyd7J107XG4gICAgZm9yIChsZXQgW2FyZywgdmFsdWVdIG9mIF8udG9QYWlycyhvYmopKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHN0ckFyci5wdXNoKGAke2luZGVudH0gICR7YXJnfTogJHt2YWx1ZX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gZ2V0VmFsdWVBcnJheSh2YWx1ZSwgYCR7aW5kZW50fSAgYCk7XG4gICAgICAgIHN0ckFyci5wdXNoKGAke2luZGVudH0gICR7YXJnfTogJHt2YWx1ZS5zaGlmdCgpfWApO1xuICAgICAgICBzdHJBcnIucHVzaCguLi52YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHN0ckFyci5wdXNoKGAke2luZGVudH19YCk7XG4gICAgcmV0dXJuIHN0ckFycjtcbiAgfVxuICBmb3IgKGxldCBbYXJnLCB2YWx1ZV0gb2YgXy50b1BhaXJzKGFyZ3MpKSB7XG4gICAgdmFsdWUgPSBnZXRWYWx1ZUFycmF5KHZhbHVlKTtcbiAgICBsb2dnZXIuaW5mbyhgICAke2FyZ306ICR7dmFsdWUuc2hpZnQoKX1gKTtcbiAgICBmb3IgKGxldCB2YWwgb2YgdmFsdWUpIHtcbiAgICAgIGxvZ2dlci5pbmZvKHZhbCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVGFrZXMgdGhlIGNhcHMgdGhhdCB3ZXJlIHByb3ZpZGVkIGluIHRoZSByZXF1ZXN0IGFuZCB0cmFuc2xhdGVzIHRoZW1cbiAqIGludG8gY2FwcyB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSBpbm5lciBkcml2ZXJzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBqc29ud3BDYXBhYmlsaXRpZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSB3M2NDYXBhYmlsaXRpZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25zdHJhaW50c1xuICogQHBhcmFtIHtPYmplY3R9IGRlZmF1bHRDYXBhYmlsaXRpZXNcbiAqL1xuZnVuY3Rpb24gcGFyc2VDYXBzRm9ySW5uZXJEcml2ZXIgKGpzb253cENhcGFiaWxpdGllcywgdzNjQ2FwYWJpbGl0aWVzLCBjb25zdHJhaW50cyA9IHt9LCBkZWZhdWx0Q2FwYWJpbGl0aWVzID0ge30pIHtcbiAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxlciBzZW50IEpTT05XUCBjYXBzLCBXM0MgY2Fwcywgb3IgYm90aFxuICBjb25zdCBoYXNXM0NDYXBzID0gXy5pc1BsYWluT2JqZWN0KHczY0NhcGFiaWxpdGllcykgJiZcbiAgICAoXy5oYXModzNjQ2FwYWJpbGl0aWVzLCAnYWx3YXlzTWF0Y2gnKSB8fCBfLmhhcyh3M2NDYXBhYmlsaXRpZXMsICdmaXJzdE1hdGNoJykpO1xuICBjb25zdCBoYXNKU09OV1BDYXBzID0gXy5pc1BsYWluT2JqZWN0KGpzb253cENhcGFiaWxpdGllcyk7XG4gIGxldCBwcm90b2NvbCA9IG51bGw7XG4gIGxldCBkZXNpcmVkQ2FwcyA9IHt9O1xuICBsZXQgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzID0gbnVsbDtcbiAgbGV0IHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyA9IG51bGw7XG5cbiAgaWYgKCFoYXNKU09OV1BDYXBzICYmICFoYXNXM0NDYXBzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3RvY29sOiBCYXNlRHJpdmVyLkRSSVZFUl9QUk9UT0NPTC5XM0MsXG4gICAgICBlcnJvcjogbmV3IEVycm9yKCdFaXRoZXIgSlNPTldQIG9yIFczQyBjYXBhYmlsaXRpZXMgc2hvdWxkIGJlIHByb3ZpZGVkJyksXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHtXM0MsIE1KU09OV1B9ID0gQmFzZURyaXZlci5EUklWRVJfUFJPVE9DT0w7XG5cbiAgLy8gTWFrZSBzdXJlIHdlIGRvbid0IG11dGF0ZSB0aGUgb3JpZ2luYWwgYXJndW1lbnRzXG4gIGpzb253cENhcGFiaWxpdGllcyA9IF8uY2xvbmVEZWVwKGpzb253cENhcGFiaWxpdGllcyk7XG4gIHczY0NhcGFiaWxpdGllcyA9IF8uY2xvbmVEZWVwKHczY0NhcGFiaWxpdGllcyk7XG4gIGRlZmF1bHRDYXBhYmlsaXRpZXMgPSBfLmNsb25lRGVlcChkZWZhdWx0Q2FwYWJpbGl0aWVzKTtcblxuICBpZiAoIV8uaXNFbXB0eShkZWZhdWx0Q2FwYWJpbGl0aWVzKSkge1xuICAgIGlmIChoYXNXM0NDYXBzKSB7XG4gICAgICBjb25zdCB7Zmlyc3RNYXRjaCA9IFtdLCBhbHdheXNNYXRjaCA9IHt9fSA9IHczY0NhcGFiaWxpdGllcztcbiAgICAgIGZvciAoY29uc3QgW2RlZmF1bHRDYXBLZXksIGRlZmF1bHRDYXBWYWx1ZV0gb2YgXy50b1BhaXJzKGRlZmF1bHRDYXBhYmlsaXRpZXMpKSB7XG4gICAgICAgIGxldCBpc0NhcEFscmVhZHlTZXQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBmaXJzdE1hdGNoRW50cnkgb2YgZmlyc3RNYXRjaCkge1xuICAgICAgICAgIGlmIChfLmhhcyhyZW1vdmVXM0NQcmVmaXhlcyhmaXJzdE1hdGNoRW50cnkpLCByZW1vdmVXM0NQcmVmaXgoZGVmYXVsdENhcEtleSkpKSB7XG4gICAgICAgICAgICBpc0NhcEFscmVhZHlTZXQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlzQ2FwQWxyZWFkeVNldCA9IGlzQ2FwQWxyZWFkeVNldCB8fCBfLmhhcyhyZW1vdmVXM0NQcmVmaXhlcyhhbHdheXNNYXRjaCksIHJlbW92ZVczQ1ByZWZpeChkZWZhdWx0Q2FwS2V5KSk7XG4gICAgICAgIGlmIChpc0NhcEFscmVhZHlTZXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9ubHkgYWRkIHRoZSBkZWZhdWx0IGNhcGFiaWxpdHkgaWYgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAgICAgICAgaWYgKF8uaXNFbXB0eShmaXJzdE1hdGNoKSkge1xuICAgICAgICAgIHczY0NhcGFiaWxpdGllcy5maXJzdE1hdGNoID0gW3tbZGVmYXVsdENhcEtleV06IGRlZmF1bHRDYXBWYWx1ZX1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZpcnN0TWF0Y2hbMF1bZGVmYXVsdENhcEtleV0gPSBkZWZhdWx0Q2FwVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGhhc0pTT05XUENhcHMpIHtcbiAgICAgIGpzb253cENhcGFiaWxpdGllcyA9IE9iamVjdC5hc3NpZ24oe30sIHJlbW92ZVczQ1ByZWZpeGVzKGRlZmF1bHRDYXBhYmlsaXRpZXMpLCBqc29ud3BDYXBhYmlsaXRpZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEdldCBNSlNPTldQIGNhcHNcbiAgaWYgKGhhc0pTT05XUENhcHMpIHtcbiAgICBwcm90b2NvbCA9IE1KU09OV1A7XG4gICAgZGVzaXJlZENhcHMgPSBqc29ud3BDYXBhYmlsaXRpZXM7XG4gICAgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzID0gcmVtb3ZlVzNDUHJlZml4ZXMoey4uLmRlc2lyZWRDYXBzfSk7XG4gIH1cblxuICAvLyBHZXQgVzNDIGNhcHNcbiAgaWYgKGhhc1czQ0NhcHMpIHtcbiAgICBwcm90b2NvbCA9IFczQztcbiAgICAvLyBDYWxsIHRoZSBwcm9jZXNzIGNhcGFiaWxpdGllcyBhbGdvcml0aG0gdG8gZmluZCBtYXRjaGluZyBjYXBzIG9uIHRoZSBXM0NcbiAgICAvLyAoc2VlOiBodHRwczovL2dpdGh1Yi5jb20vamxpcHBzL3NpbXBsZS13ZC1zcGVjI3Byb2Nlc3NpbmctY2FwYWJpbGl0aWVzKVxuICAgIGxldCBpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgZGVzaXJlZENhcHMgPSBwcm9jZXNzQ2FwYWJpbGl0aWVzKHczY0NhcGFiaWxpdGllcywgY29uc3RyYWludHMsIHRydWUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoIWhhc0pTT05XUENhcHMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkZXNpcmVkQ2FwcyxcbiAgICAgICAgICBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb3RvY29sLFxuICAgICAgICAgIGVycm9yLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgbG9nZ2VyLmluZm8oYENvdWxkIG5vdCBwYXJzZSBXM0MgY2FwYWJpbGl0aWVzOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICBpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChoYXNKU09OV1BDYXBzICYmICFpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMpIHtcbiAgICAgIGNvbnN0IGRpZmZlcmluZ0tleXMgPSBfLmRpZmZlcmVuY2UoXy5rZXlzKHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyksIF8ua2V5cyhyZW1vdmVXM0NQcmVmaXhlcyhkZXNpcmVkQ2FwcykpKTtcbiAgICAgIGlmICghXy5pc0VtcHR5KGRpZmZlcmluZ0tleXMpKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBUaGUgZm9sbG93aW5nIGNhcGFiaWxpdGllcyB3ZXJlIHByb3ZpZGVkIGluIHRoZSBKU09OV1AgZGVzaXJlZCBjYXBhYmlsaXRpZXMgdGhhdCBhcmUgbWlzc2luZyBgICtcbiAgICAgICAgICBgaW4gVzNDIGNhcGFiaWxpdGllczogJHtKU09OLnN0cmluZ2lmeShkaWZmZXJpbmdLZXlzKX1gKTtcbiAgICAgICAgaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzICYmIGhhc0pTT05XUENhcHMpIHtcbiAgICAgIGxvZ2dlci5pbmZvKCdUcnlpbmcgdG8gZml4IFczQyBjYXBhYmlsaXRpZXMgYnkgbWVyZ2luZyB0aGVtIHdpdGggSlNPTldQIGNhcHMnKTtcbiAgICAgIHczY0NhcGFiaWxpdGllcyA9IGZpeFczY0NhcGFiaWxpdGllcyh3M2NDYXBhYmlsaXRpZXMsIGpzb253cENhcGFiaWxpdGllcyk7XG4gICAgICB0cnkge1xuICAgICAgICBkZXNpcmVkQ2FwcyA9IHByb2Nlc3NDYXBhYmlsaXRpZXModzNjQ2FwYWJpbGl0aWVzLCBjb25zdHJhaW50cywgdHJ1ZSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dnZXIud2FybihgQ291bGQgbm90IHBhcnNlIGZpeGVkIFczQyBjYXBhYmlsaXRpZXM6ICR7ZXJyb3IubWVzc2FnZX0uIEZhbGxpbmcgYmFjayB0byBKU09OV1AgcHJvdG9jb2xgKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkZXNpcmVkQ2FwczogcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyxcbiAgICAgICAgICBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXM6IG51bGwsXG4gICAgICAgICAgcHJvdG9jb2w6IE1KU09OV1AsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IHczYyBjYXBhYmlsaXRpZXMgcGF5bG9hZCB0aGF0IGNvbnRhaW5zIG9ubHkgdGhlIG1hdGNoaW5nIGNhcHMgaW4gYGFsd2F5c01hdGNoYFxuICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcyA9IHtcbiAgICAgIGFsd2F5c01hdGNoOiB7Li4uaW5zZXJ0QXBwaXVtUHJlZml4ZXMoZGVzaXJlZENhcHMpfSxcbiAgICAgIGZpcnN0TWF0Y2g6IFt7fV0sXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7ZGVzaXJlZENhcHMsIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcywgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzLCBwcm90b2NvbH07XG59XG5cbi8qKlxuICogVGhpcyBoZWxwZXIgbWV0aG9kIHRyaWVzIHRvIGZpeCBjb3JydXB0ZWQgVzNDIGNhcGFiaWxpdGllcyBieVxuICogbWVyZ2luZyB0aGVtIHRvIGV4aXN0aW5nIEpTT05XUCBjYXBhYmlsaXRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHczY0NhcHMgVzNDIGNhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IGpzb253cENhcHMgSlNPTldQIGNhcGFiaWxpdGllc1xuICogQHJldHVybnMge09iamVjdH0gRml4ZWQgVzNDIGNhcGFiaWxpdGllc1xuICovXG5mdW5jdGlvbiBmaXhXM2NDYXBhYmlsaXRpZXMgKHczY0NhcHMsIGpzb253cENhcHMpIHtcbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIGZpcnN0TWF0Y2g6IHczY0NhcHMuZmlyc3RNYXRjaCB8fCBbXSxcbiAgICBhbHdheXNNYXRjaDogdzNjQ2Fwcy5hbHdheXNNYXRjaCB8fCB7fSxcbiAgfTtcbiAgY29uc3Qga2V5c1RvSW5zZXJ0ID0gXy5rZXlzKGpzb253cENhcHMpO1xuICBjb25zdCByZW1vdmVNYXRjaGluZ0tleXMgPSAobWF0Y2gpID0+IHtcbiAgICBfLnB1bGwoa2V5c1RvSW5zZXJ0LCBtYXRjaCk7XG4gICAgY29uc3QgY29sb25JbmRleCA9IG1hdGNoLmluZGV4T2YoJzonKTtcbiAgICBpZiAoY29sb25JbmRleCA+PSAwICYmIG1hdGNoLmxlbmd0aCA+IGNvbG9uSW5kZXgpIHtcbiAgICAgIF8ucHVsbChrZXlzVG9JbnNlcnQsIG1hdGNoLnN1YnN0cmluZyhjb2xvbkluZGV4ICsgMSkpO1xuICAgIH1cbiAgICBpZiAoa2V5c1RvSW5zZXJ0LmluY2x1ZGVzKGAke1czQ19BUFBJVU1fUFJFRklYfToke21hdGNofWApKSB7XG4gICAgICBfLnB1bGwoa2V5c1RvSW5zZXJ0LCBgJHtXM0NfQVBQSVVNX1BSRUZJWH06JHttYXRjaH1gKTtcbiAgICB9XG4gIH07XG5cbiAgZm9yIChjb25zdCBmaXJzdE1hdGNoRW50cnkgb2YgcmVzdWx0LmZpcnN0TWF0Y2gpIHtcbiAgICBmb3IgKGNvbnN0IHBhaXIgb2YgXy50b1BhaXJzKGZpcnN0TWF0Y2hFbnRyeSkpIHtcbiAgICAgIHJlbW92ZU1hdGNoaW5nS2V5cyhwYWlyWzBdKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IHBhaXIgb2YgXy50b1BhaXJzKHJlc3VsdC5hbHdheXNNYXRjaCkpIHtcbiAgICByZW1vdmVNYXRjaGluZ0tleXMocGFpclswXSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzVG9JbnNlcnQpIHtcbiAgICByZXN1bHQuYWx3YXlzTWF0Y2hba2V5XSA9IGpzb253cENhcHNba2V5XTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFRha2VzIGEgY2FwYWJpbGl0aWVzIG9iamVjdHMgYW5kIHByZWZpeGVzIGNhcGFiaWxpdGllcyB3aXRoIGBhcHBpdW06YFxuICogQHBhcmFtIHtPYmplY3R9IGNhcHMgRGVzaXJlZCBjYXBhYmlsaXRpZXMgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGluc2VydEFwcGl1bVByZWZpeGVzIChjYXBzKSB7XG4gIC8vIFN0YW5kYXJkLCBub24tcHJlZml4ZWQgY2FwYWJpbGl0aWVzIChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3dlYmRyaXZlci8jZGZuLXRhYmxlLW9mLXN0YW5kYXJkLWNhcGFiaWxpdGllcylcbiAgY29uc3QgU1RBTkRBUkRfQ0FQUyA9IFtcbiAgICAnYnJvd3Nlck5hbWUnLFxuICAgICdicm93c2VyVmVyc2lvbicsXG4gICAgJ3BsYXRmb3JtTmFtZScsXG4gICAgJ2FjY2VwdEluc2VjdXJlQ2VydHMnLFxuICAgICdwYWdlTG9hZFN0cmF0ZWd5JyxcbiAgICAncHJveHknLFxuICAgICdzZXRXaW5kb3dSZWN0JyxcbiAgICAndGltZW91dHMnLFxuICAgICd1bmhhbmRsZWRQcm9tcHRCZWhhdmlvcidcbiAgXTtcblxuICBsZXQgcHJlZml4ZWRDYXBzID0ge307XG4gIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgXy50b1BhaXJzKGNhcHMpKSB7XG4gICAgaWYgKFNUQU5EQVJEX0NBUFMuaW5jbHVkZXMobmFtZSkgfHwgbmFtZS5pbmNsdWRlcygnOicpKSB7XG4gICAgICBwcmVmaXhlZENhcHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZml4ZWRDYXBzW2Ake1czQ19BUFBJVU1fUFJFRklYfToke25hbWV9YF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByZWZpeGVkQ2Fwcztcbn1cblxuZnVuY3Rpb24gcmVtb3ZlVzNDUHJlZml4ZXMgKGNhcHMpIHtcbiAgaWYgKCFfLmlzUGxhaW5PYmplY3QoY2FwcykpIHtcbiAgICByZXR1cm4gY2FwcztcbiAgfVxuXG4gIGNvbnN0IGZpeGVkQ2FwcyA9IHt9O1xuICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIF8udG9QYWlycyhjYXBzKSkge1xuICAgIGZpeGVkQ2Fwc1tyZW1vdmVXM0NQcmVmaXgobmFtZSldID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGZpeGVkQ2Fwcztcbn1cblxuZnVuY3Rpb24gcmVtb3ZlVzNDUHJlZml4IChrZXkpIHtcbiAgY29uc3QgY29sb25Qb3MgPSBrZXkuaW5kZXhPZignOicpO1xuICByZXR1cm4gY29sb25Qb3MgPiAwICYmIGtleS5sZW5ndGggPiBjb2xvblBvcyA/IGtleS5zdWJzdHJpbmcoY29sb25Qb3MgKyAxKSA6IGtleTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFja2FnZVZlcnNpb24gKHBrZ05hbWUpIHtcbiAgY29uc3QgcGtnSW5mbyA9IHJlcXVpcmUoYCR7cGtnTmFtZX0vcGFja2FnZS5qc29uYCkgfHwge307XG4gIHJldHVybiBwa2dJbmZvLnZlcnNpb247XG59XG5cbmNvbnN0IHJvb3REaXIgPSBmaW5kUm9vdChfX2Rpcm5hbWUpO1xuXG5leHBvcnQge1xuICBpbnNwZWN0T2JqZWN0LCBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciwgaW5zZXJ0QXBwaXVtUHJlZml4ZXMsIHJvb3REaXIsXG4gIGdldFBhY2thZ2VWZXJzaW9uLFxufTtcbiJdLCJmaWxlIjoibGliL3V0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
