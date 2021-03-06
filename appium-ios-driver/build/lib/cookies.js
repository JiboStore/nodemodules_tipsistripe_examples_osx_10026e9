"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createJSCookie = createJSCookie;
exports.createJWPCookie = createJWPCookie;
exports.getValue = getValue;
exports.expireCookie = expireCookie;
exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumSupport = require("appium-support");

const log = _appiumSupport.logger.getLogger('Cookie');

function convertCookie(value, converter) {
  if (value.indexOf('"') === 0) {
    value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  let parsedValue;

  try {
    parsedValue = decodeURIComponent(value.replace(/\+/g, ' '));
  } catch (e) {
    log.warn(e);
  }

  return converter ? converter(parsedValue) : parsedValue;
}

function createJSCookie(key, value, options = {}) {
  return [encodeURIComponent(key), '=', value, options.expires ? `; expires=${options.expires}` : '', options.path ? `; path=${options.path}` : '', options.domain ? `; domain=${options.domain}` : '', options.secure ? '; secure' : ''].join('');
}

function createJWPCookie(key, cookieString, converter = null) {
  let result = {};
  let cookies = cookieString ? cookieString.split('; ') : [];

  for (let cookie of cookies) {
    let parts = cookie.split('=');
    let name = decodeURIComponent(parts.shift());
    let val = parts[0];

    if (key && key === name) {
      result.name = key;
      result.value = convertCookie(val, converter);
    } else {
      result[name] = convertCookie(val, converter);
    }
  }

  return result;
}

function getValue(key, cookieString, converter = null) {
  let result = createJWPCookie(key, cookieString, converter);
  return _lodash.default.isUndefined(key) ? result : result.value;
}

function expireCookie(key, options) {
  return createJSCookie(key, '', _lodash.default.assign({}, options, {
    expires: 'Thu, 01 Jan 1970 00:00:00 GMT'
  }));
}

var _default = {
  createJSCookie,
  createJWPCookie,
  getValue,
  expireCookie
};
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb29raWVzLmpzIl0sIm5hbWVzIjpbImxvZyIsImxvZ2dlciIsImdldExvZ2dlciIsImNvbnZlcnRDb29raWUiLCJ2YWx1ZSIsImNvbnZlcnRlciIsImluZGV4T2YiLCJzbGljZSIsInJlcGxhY2UiLCJwYXJzZWRWYWx1ZSIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJ3YXJuIiwiY3JlYXRlSlNDb29raWUiLCJrZXkiLCJvcHRpb25zIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiZXhwaXJlcyIsInBhdGgiLCJkb21haW4iLCJzZWN1cmUiLCJqb2luIiwiY3JlYXRlSldQQ29va2llIiwiY29va2llU3RyaW5nIiwicmVzdWx0IiwiY29va2llcyIsInNwbGl0IiwiY29va2llIiwicGFydHMiLCJuYW1lIiwic2hpZnQiLCJ2YWwiLCJnZXRWYWx1ZSIsIl8iLCJpc1VuZGVmaW5lZCIsImV4cGlyZUNvb2tpZSIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBT0E7O0FBQ0E7O0FBR0EsTUFBTUEsR0FBRyxHQUFHQyxzQkFBT0MsU0FBUCxDQUFpQixRQUFqQixDQUFaOztBQUlBLFNBQVNDLGFBQVQsQ0FBd0JDLEtBQXhCLEVBQStCQyxTQUEvQixFQUEwQztBQUN4QyxNQUFJRCxLQUFLLENBQUNFLE9BQU4sQ0FBYyxHQUFkLE1BQXVCLENBQTNCLEVBQThCO0FBRzVCRixJQUFBQSxLQUFLLEdBQUdBLEtBQUssQ0FBQ0csS0FBTixDQUFZLENBQVosRUFBZSxDQUFDLENBQWhCLEVBQW1CQyxPQUFuQixDQUEyQixNQUEzQixFQUFtQyxHQUFuQyxFQUF3Q0EsT0FBeEMsQ0FBZ0QsT0FBaEQsRUFBeUQsSUFBekQsQ0FBUjtBQUNEOztBQUVELE1BQUlDLFdBQUo7O0FBQ0EsTUFBSTtBQUNGQSxJQUFBQSxXQUFXLEdBQUdDLGtCQUFrQixDQUFDTixLQUFLLENBQUNJLE9BQU4sQ0FBYyxLQUFkLEVBQXFCLEdBQXJCLENBQUQsQ0FBaEM7QUFDRCxHQUZELENBRUUsT0FBT0csQ0FBUCxFQUFVO0FBRVZYLElBQUFBLEdBQUcsQ0FBQ1ksSUFBSixDQUFTRCxDQUFUO0FBQ0Q7O0FBRUQsU0FBT04sU0FBUyxHQUFHQSxTQUFTLENBQUNJLFdBQUQsQ0FBWixHQUE0QkEsV0FBNUM7QUFDRDs7QUFHRCxTQUFTSSxjQUFULENBQXlCQyxHQUF6QixFQUE4QlYsS0FBOUIsRUFBcUNXLE9BQU8sR0FBRyxFQUEvQyxFQUFtRDtBQUNqRCxTQUFPLENBQ0xDLGtCQUFrQixDQUFDRixHQUFELENBRGIsRUFDb0IsR0FEcEIsRUFDeUJWLEtBRHpCLEVBRUxXLE9BQU8sQ0FBQ0UsT0FBUixHQUNLLGFBQVlGLE9BQU8sQ0FBQ0UsT0FBUSxFQURqQyxHQUVJLEVBSkMsRUFLTEYsT0FBTyxDQUFDRyxJQUFSLEdBQ0ssVUFBU0gsT0FBTyxDQUFDRyxJQUFLLEVBRDNCLEdBRUksRUFQQyxFQVFMSCxPQUFPLENBQUNJLE1BQVIsR0FDSyxZQUFXSixPQUFPLENBQUNJLE1BQU8sRUFEL0IsR0FFSSxFQVZDLEVBV0xKLE9BQU8sQ0FBQ0ssTUFBUixHQUNJLFVBREosR0FFSSxFQWJDLEVBY0xDLElBZEssQ0FjQSxFQWRBLENBQVA7QUFlRDs7QUFHRCxTQUFTQyxlQUFULENBQTBCUixHQUExQixFQUErQlMsWUFBL0IsRUFBNkNsQixTQUFTLEdBQUcsSUFBekQsRUFBK0Q7QUFDN0QsTUFBSW1CLE1BQU0sR0FBRyxFQUFiO0FBQ0EsTUFBSUMsT0FBTyxHQUFHRixZQUFZLEdBQUdBLFlBQVksQ0FBQ0csS0FBYixDQUFtQixJQUFuQixDQUFILEdBQThCLEVBQXhEOztBQUNBLE9BQUssSUFBSUMsTUFBVCxJQUFtQkYsT0FBbkIsRUFBNEI7QUFDMUIsUUFBSUcsS0FBSyxHQUFHRCxNQUFNLENBQUNELEtBQVAsQ0FBYSxHQUFiLENBQVo7QUFHQSxRQUFJRyxJQUFJLEdBQUduQixrQkFBa0IsQ0FBQ2tCLEtBQUssQ0FBQ0UsS0FBTixFQUFELENBQTdCO0FBQ0EsUUFBSUMsR0FBRyxHQUFHSCxLQUFLLENBQUMsQ0FBRCxDQUFmOztBQUlBLFFBQUlkLEdBQUcsSUFBSUEsR0FBRyxLQUFLZSxJQUFuQixFQUF5QjtBQUN2QkwsTUFBQUEsTUFBTSxDQUFDSyxJQUFQLEdBQWNmLEdBQWQ7QUFDQVUsTUFBQUEsTUFBTSxDQUFDcEIsS0FBUCxHQUFlRCxhQUFhLENBQUM0QixHQUFELEVBQU0xQixTQUFOLENBQTVCO0FBQ0QsS0FIRCxNQUdPO0FBQ0xtQixNQUFBQSxNQUFNLENBQUNLLElBQUQsQ0FBTixHQUFlMUIsYUFBYSxDQUFDNEIsR0FBRCxFQUFNMUIsU0FBTixDQUE1QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT21CLE1BQVA7QUFDRDs7QUFHRCxTQUFTUSxRQUFULENBQW1CbEIsR0FBbkIsRUFBd0JTLFlBQXhCLEVBQXNDbEIsU0FBUyxHQUFHLElBQWxELEVBQXdEO0FBQ3RELE1BQUltQixNQUFNLEdBQUdGLGVBQWUsQ0FBQ1IsR0FBRCxFQUFNUyxZQUFOLEVBQW9CbEIsU0FBcEIsQ0FBNUI7QUFHQSxTQUFPNEIsZ0JBQUVDLFdBQUYsQ0FBY3BCLEdBQWQsSUFBcUJVLE1BQXJCLEdBQThCQSxNQUFNLENBQUNwQixLQUE1QztBQUNEOztBQUtELFNBQVMrQixZQUFULENBQXVCckIsR0FBdkIsRUFBNEJDLE9BQTVCLEVBQXFDO0FBRW5DLFNBQU9GLGNBQWMsQ0FBQ0MsR0FBRCxFQUFNLEVBQU4sRUFBVW1CLGdCQUFFRyxNQUFGLENBQVMsRUFBVCxFQUFhckIsT0FBYixFQUFzQjtBQUNuREUsSUFBQUEsT0FBTyxFQUFFO0FBRDBDLEdBQXRCLENBQVYsQ0FBckI7QUFHRDs7ZUFJYztBQUFFSixFQUFBQSxjQUFGO0FBQWtCUyxFQUFBQSxlQUFsQjtBQUFtQ1UsRUFBQUEsUUFBbkM7QUFBNkNHLEVBQUFBO0FBQTdDLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogZGVyaXZlZCBmcm9tIGpRdWVyeSBDb29raWUgUGx1Z2luIHYxLjQuMVxuICogaHR0cHM6Ly9naXRodWIuY29tL2NhcmhhcnRsL2pxdWVyeS1jb29raWVcbiAqL1xuXG4vLyBuZWVkZWQgdG8gY29tbXVuaWNhdGUvdHJhbnNsYXRlIGJldHdlZW4gSlNPTldpcmUgY29va2llcyBhbmQgcmVndWxhciBKYXZhU2NyaXB0IGNvb2tpZXNcblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcblxuXG5jb25zdCBsb2cgPSBsb2dnZXIuZ2V0TG9nZ2VyKCdDb29raWUnKTtcblxuLy8gcGFyc2VzIHRoZSB2YWx1ZSBpZiBuZWVkZWQgYW5kIGNvbnZlcnRzIHRoZSB2YWx1ZSBpZiBhIGNvbnZlcnRlciBpcyBwcm92aWRlZFxuLy8gaW50ZXJuYWwgZnVuY3Rpb24sIG5vdCBleHBvcnRlZFxuZnVuY3Rpb24gY29udmVydENvb2tpZSAodmFsdWUsIGNvbnZlcnRlcikge1xuICBpZiAodmFsdWUuaW5kZXhPZignXCInKSA9PT0gMCkge1xuICAgIC8vIHRoaXMgaXMgYSBxdW90ZWQgY29va2llZCBhY2NvcmRpbmcgdG8gUkZDMjA2OFxuICAgIC8vIHJlbW92ZSBlbmNsb3NpbmcgcXVvdGVzIGFuZCBpbnRlcm5hbCBxdW90ZXMgYW5kIGJhY2tzbGFzaGVzXG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxLCAtMSkucmVwbGFjZSgvXFxcXFwiL2csICdcIicpLnJlcGxhY2UoL1xcXFxcXFxcL2csICdcXFxcJyk7XG4gIH1cblxuICBsZXQgcGFyc2VkVmFsdWU7XG4gIHRyeSB7XG4gICAgcGFyc2VkVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUucmVwbGFjZSgvXFwrL2csICcgJykpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gbm8gbmVlZCB0byBmYWlsIGlmIHdlIGNhbid0IGRlY29kZVxuICAgIGxvZy53YXJuKGUpO1xuICB9XG5cbiAgcmV0dXJuIGNvbnZlcnRlciA/IGNvbnZlcnRlcihwYXJzZWRWYWx1ZSkgOiBwYXJzZWRWYWx1ZTtcbn1cblxuLy8gdGFrZXMgYXJndW1lbnRzIGdpdmVuIGFuZCBjcmVhdGVzIGEgSmF2YVNjcmlwdCBDb29raWVcbmZ1bmN0aW9uIGNyZWF0ZUpTQ29va2llIChrZXksIHZhbHVlLCBvcHRpb25zID0ge30pIHtcbiAgcmV0dXJuIFtcbiAgICBlbmNvZGVVUklDb21wb25lbnQoa2V5KSwgJz0nLCB2YWx1ZSxcbiAgICBvcHRpb25zLmV4cGlyZXNcbiAgICAgID8gYDsgZXhwaXJlcz0ke29wdGlvbnMuZXhwaXJlc31gXG4gICAgICA6ICcnLFxuICAgIG9wdGlvbnMucGF0aFxuICAgICAgPyBgOyBwYXRoPSR7b3B0aW9ucy5wYXRofWBcbiAgICAgIDogJycsXG4gICAgb3B0aW9ucy5kb21haW5cbiAgICAgID8gYDsgZG9tYWluPSR7b3B0aW9ucy5kb21haW59YFxuICAgICAgOiAnJyxcbiAgICBvcHRpb25zLnNlY3VyZVxuICAgICAgPyAnOyBzZWN1cmUnXG4gICAgICA6ICcnXG4gIF0uam9pbignJyk7XG59XG5cbi8vIHRha2VzIHRoZSBKYXZhU2NyaXB0IGNvb2tpZVN0cmluZyBhbmQgdHJhbnNsYXRlcyBpdCBpbnRvIGEgSlNPTldpcmUgZm9ybWF0dGVkIGNvb2tpZVxuZnVuY3Rpb24gY3JlYXRlSldQQ29va2llIChrZXksIGNvb2tpZVN0cmluZywgY29udmVydGVyID0gbnVsbCkge1xuICBsZXQgcmVzdWx0ID0ge307XG4gIGxldCBjb29raWVzID0gY29va2llU3RyaW5nID8gY29va2llU3RyaW5nLnNwbGl0KCc7ICcpIDogW107XG4gIGZvciAobGV0IGNvb2tpZSBvZiBjb29raWVzKSB7XG4gICAgbGV0IHBhcnRzID0gY29va2llLnNwbGl0KCc9Jyk7XG5cbiAgICAvLyBnZXQgdGhlIGZpcnN0IGFuZCBzZWNvbmQgZWxlbWVudCBhcyBuYW1lIGFuZCB2YWx1ZVxuICAgIGxldCBuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRzLnNoaWZ0KCkpO1xuICAgIGxldCB2YWwgPSBwYXJ0c1swXTtcblxuICAgIC8vIGlmIG5hbWUgaXMga2V5LCB0aGlzIGlzIHRoZSBjZW50cmFsIGVsZW1lbnQgb2YgdGhlIGNvb2tpZSwgc28gYWRkIGFzIGBuYW1lYFxuICAgIC8vIG90aGVyd2lzZSBpdCBpcyBhbiBvcHRpb25hbCBlbGVtZW50XG4gICAgaWYgKGtleSAmJiBrZXkgPT09IG5hbWUpIHtcbiAgICAgIHJlc3VsdC5uYW1lID0ga2V5O1xuICAgICAgcmVzdWx0LnZhbHVlID0gY29udmVydENvb2tpZSh2YWwsIGNvbnZlcnRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdFtuYW1lXSA9IGNvbnZlcnRDb29raWUodmFsLCBjb252ZXJ0ZXIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyB0YWtlcyBhIEphdmFTY3JpcHQgY29va2llc3RyaW5nIGFuZCBwYXJzZXMgaXQgZm9yIHRoZSB2YWx1ZSBnaXZlbiB0aGUga2V5XG5mdW5jdGlvbiBnZXRWYWx1ZSAoa2V5LCBjb29raWVTdHJpbmcsIGNvbnZlcnRlciA9IG51bGwpIHtcbiAgbGV0IHJlc3VsdCA9IGNyZWF0ZUpXUENvb2tpZShrZXksIGNvb2tpZVN0cmluZywgY29udmVydGVyKTtcblxuICAvLyBpZiBga2V5YCBpcyB1bmRlZmluZWQgd2Ugd2FudCB0aGUgZW50aXJlIGNvb2tpZVxuICByZXR1cm4gXy5pc1VuZGVmaW5lZChrZXkpID8gcmVzdWx0IDogcmVzdWx0LnZhbHVlO1xufVxuXG5cbi8vIHJldHVybnMgYSBjb29raWUgdGhhdCBleHBpcmVzIG9uIDAxIEphbiAxOTcwXG4vLyBhc3NpZ24gdGhlIHJldHVybmVkIGNvb2tpZSB0byBhbiBleGlzdGluZyBjb29raWUgdG8gZGVsZXRlIHRoYXQgY29va2llXG5mdW5jdGlvbiBleHBpcmVDb29raWUgKGtleSwgb3B0aW9ucykge1xuICAvLyBvdmVycmlkZSBgZXhwaXJlc2AgaW4gYG9wdGlvbnNgLCBhbmQgdGhlbiBtYWtlIHRoZSBjb29raWVcbiAgcmV0dXJuIGNyZWF0ZUpTQ29va2llKGtleSwgJycsIF8uYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgZXhwaXJlczogJ1RodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UJ1xuICB9KSk7XG59XG5cbi8vIGV4cG9ydCBpbmRpdmlkdWFsbHkgYW5kIGFsc28gKGFzIGRlZmF1bHQpIGFzIGFuIG9iamVjdFxuZXhwb3J0IHsgY3JlYXRlSlNDb29raWUsIGNyZWF0ZUpXUENvb2tpZSwgZ2V0VmFsdWUsIGV4cGlyZUNvb2tpZSB9O1xuZXhwb3J0IGRlZmF1bHQgeyBjcmVhdGVKU0Nvb2tpZSwgY3JlYXRlSldQQ29va2llLCBnZXRWYWx1ZSwgZXhwaXJlQ29va2llIH07XG4iXSwiZmlsZSI6ImxpYi9jb29raWVzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
