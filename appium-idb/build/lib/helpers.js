"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPids = getPids;
exports.fixOutputToArray = fixOutputToArray;
exports.fixOutputToObject = fixOutputToObject;
exports.convertToIDBEnv = convertToIDBEnv;
exports.DEFAULT_COMPANION_GRPC_PORT = exports.DEFAULT_COMPANION_PORT = exports.DEFAULT_IDB_PORT = exports.IDB_COMPANION_EXECUTABLE = exports.IDB_EXECUTABLE = exports.DEFAULT_IDB_EXEC_TIMEOUT = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _teen_process = require("teen_process");

const DEFAULT_IDB_EXEC_TIMEOUT = 20000;
exports.DEFAULT_IDB_EXEC_TIMEOUT = DEFAULT_IDB_EXEC_TIMEOUT;
const DEFAULT_IDB_PORT = 9889;
exports.DEFAULT_IDB_PORT = DEFAULT_IDB_PORT;
const IDB_EXECUTABLE = 'idb';
exports.IDB_EXECUTABLE = IDB_EXECUTABLE;
const IDB_COMPANION_EXECUTABLE = 'idb_companion';
exports.IDB_COMPANION_EXECUTABLE = IDB_COMPANION_EXECUTABLE;
const DEFAULT_COMPANION_PORT = 10880;
exports.DEFAULT_COMPANION_PORT = DEFAULT_COMPANION_PORT;
const DEFAULT_COMPANION_GRPC_PORT = 10882;
exports.DEFAULT_COMPANION_GRPC_PORT = DEFAULT_COMPANION_GRPC_PORT;
const IDB_ENV_PREFIX = 'IDB_';

async function getPids(pattern, opts = {}) {
  const {
    multi = true,
    ignoreCase = true
  } = opts;
  const args = [`-${ignoreCase ? 'i' : ''}f${multi ? '' : 'n'}`, pattern];

  try {
    const {
      stdout
    } = await (0, _teen_process.exec)('pgrep', args);
    const result = stdout.split('\n').filter(Number).map(x => `${x}`);
    return multi ? result : _lodash.default.isEmpty(result) ? [] : _lodash.default.first(result);
  } catch (err) {
    return [];
  }
}

function convertToIDBEnv(env) {
  if (!_lodash.default.isPlainObject(env) || _lodash.default.isEmpty(env)) {
    return null;
  }

  return _lodash.default.reduce(env, (result, value, key) => {
    result[IDB_ENV_PREFIX + key] = value;
    return result;
  }, {});
}

function fixOutputToArray(output) {
  if (!_lodash.default.trim(output)) {
    return [];
  }

  return output.split('\n').reduce((acc, x) => {
    try {
      return [...acc, JSON.parse(x)];
    } catch (e) {
      return acc;
    }
  }, []);
}

function fixOutputToObject(output) {
  if (!_lodash.default.trim(output)) {
    return {};
  }

  const result = {};
  const lines = output.split('\n');

  const getLeftIndent = line => line.length - _lodash.default.trimStart(line).length;

  let lineIdx = 0;

  do {
    if (!_lodash.default.trim(lines[lineIdx])) {
      lineIdx++;
      continue;
    }

    const objectMatch = /(\S+)\s+{/.exec(lines[lineIdx]);

    if (objectMatch) {
      const currentIndent = getLeftIndent(lines[lineIdx]);
      const startLine = lineIdx;

      do {
        lineIdx++;
      } while (lineIdx < lines.length && currentIndent < getLeftIndent(lines[lineIdx]));

      const objectName = objectMatch[1];
      const objectContent = lines.slice(startLine + 1, lineIdx).join('\n');
      result[objectName] = fixOutputToObject(objectContent);
    }

    const propertyMatch = /(\S+):\s+([^\n]+)/.exec(lines[lineIdx]);

    if (propertyMatch) {
      const propertyName = propertyMatch[1];
      const propertyValue = propertyMatch[2].trim();
      result[propertyName] = propertyValue.startsWith('"') ? _lodash.default.trim(propertyValue, '"') : Number(propertyValue);
    }

    lineIdx++;
  } while (lineIdx < lines.length);

  return result;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbIkRFRkFVTFRfSURCX0VYRUNfVElNRU9VVCIsIkRFRkFVTFRfSURCX1BPUlQiLCJJREJfRVhFQ1VUQUJMRSIsIklEQl9DT01QQU5JT05fRVhFQ1VUQUJMRSIsIkRFRkFVTFRfQ09NUEFOSU9OX1BPUlQiLCJERUZBVUxUX0NPTVBBTklPTl9HUlBDX1BPUlQiLCJJREJfRU5WX1BSRUZJWCIsImdldFBpZHMiLCJwYXR0ZXJuIiwib3B0cyIsIm11bHRpIiwiaWdub3JlQ2FzZSIsImFyZ3MiLCJzdGRvdXQiLCJyZXN1bHQiLCJzcGxpdCIsImZpbHRlciIsIk51bWJlciIsIm1hcCIsIngiLCJfIiwiaXNFbXB0eSIsImZpcnN0IiwiZXJyIiwiY29udmVydFRvSURCRW52IiwiZW52IiwiaXNQbGFpbk9iamVjdCIsInJlZHVjZSIsInZhbHVlIiwia2V5IiwiZml4T3V0cHV0VG9BcnJheSIsIm91dHB1dCIsInRyaW0iLCJhY2MiLCJKU09OIiwicGFyc2UiLCJlIiwiZml4T3V0cHV0VG9PYmplY3QiLCJsaW5lcyIsImdldExlZnRJbmRlbnQiLCJsaW5lIiwibGVuZ3RoIiwidHJpbVN0YXJ0IiwibGluZUlkeCIsIm9iamVjdE1hdGNoIiwiZXhlYyIsImN1cnJlbnRJbmRlbnQiLCJzdGFydExpbmUiLCJvYmplY3ROYW1lIiwib2JqZWN0Q29udGVudCIsInNsaWNlIiwiam9pbiIsInByb3BlcnR5TWF0Y2giLCJwcm9wZXJ0eU5hbWUiLCJwcm9wZXJ0eVZhbHVlIiwic3RhcnRzV2l0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUEsTUFBTUEsd0JBQXdCLEdBQUcsS0FBakM7O0FBQ0EsTUFBTUMsZ0JBQWdCLEdBQUcsSUFBekI7O0FBQ0EsTUFBTUMsY0FBYyxHQUFHLEtBQXZCOztBQUNBLE1BQU1DLHdCQUF3QixHQUFHLGVBQWpDOztBQUNBLE1BQU1DLHNCQUFzQixHQUFHLEtBQS9COztBQUNB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Q0csTUE1QnpCOztBQTZCQSxTQUFPM0IsTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuXG5jb25zdCBERUZBVUxUX0lEQl9FWEVDX1RJTUVPVVQgPSAyMDAwMDsgLy8gaW4gbWlsbGlzZWNvbmRzXG5jb25zdCBERUZBVUxUX0lEQl9QT1JUID0gOTg4OTtcbmNvbnN0IElEQl9FWEVDVVRBQkxFID0gJ2lkYic7XG5jb25zdCBJREJfQ09NUEFOSU9OX0VYRUNVVEFCTEUgPSAnaWRiX2NvbXBhbmlvbic7XG5jb25zdCBERUZBVUxUX0NPTVBBTklPTl9QT1JUID0gMTA4ODA7XG5jb25zdCBERUZBVUxUX0NPTVBBTklPTl9HUlBDX1BPUlQgPSAxMDg4MjtcbmNvbnN0IElEQl9FTlZfUFJFRklYID0gJ0lEQl8nO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFBpZExvb2t1cE9wdGlvbnNcbiAqXG4gKiBAcHJvcGVydHkgez9ib29sZWFufSBtdWx0aSBbdHJ1ZV0gLSBTZXQgaXQgdG8gdHJ1ZSBpZiBtdWx0aXBsZSBtYXRjaGluZ1xuICogcGlkcyBhcmUgZXhwZWN0ZWQgdG8gYmUgZm91bmQuIE9ubHkgdGhlIG5ld2VzdCBwcm9jZXNzIGlkIGlzIGdvaW5nIHRvXG4gKiBiZSByZXR1cm5lZCBpbnN0ZWFkXG4gKiBAcHJvcGVydHkgez9ib29sZWFufSBpZ25vcmVDYXNlIFt0cnVlXSAtIFNldCBpdCB0byBmYWxzZSB0byBtYWtlIHRoZSBzZWFyY2hcbiAqIGNhc2Utc2Vuc2l0aXZlXG4gKi9cblxuLyoqXG4gKiBHZXQgdGhlIHByb2Nlc3MgaWQgb2YgdGhlIG1vc3QgcmVjZW50IHJ1bm5pbmcgYXBwbGljYXRpb25cbiAqIGhhdmluZyB0aGUgcGFydGljdWxhciBjb21tYW5kIGxpbmUgcGF0dGVybi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0dGVybiAtIHBncmVwLWNvbXBhdGlibGUgc2VhcmNoIHBhdHRlcm4uXG4gKiBAcGFyYW0gez9QaWRMb29rdXBPcHRpb25zfSBvcHRzXG4gKiBAcmV0dXJuIHtBcnJheTxzdHJpbmc+fSBBbiBhcnJheSBvZiBwcm9jZXNzIGlkcyBhcyBzdHJpbmdzXG4gKiBvciBhbiBlbXB0eSBhcnJheVxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRQaWRzIChwYXR0ZXJuLCBvcHRzID0ge30pIHtcbiAgY29uc3Qge1xuICAgIG11bHRpID0gdHJ1ZSxcbiAgICBpZ25vcmVDYXNlID0gdHJ1ZSxcbiAgfSA9IG9wdHM7XG4gIGNvbnN0IGFyZ3MgPSBbYC0ke2lnbm9yZUNhc2UgPyAnaScgOiAnJ31mJHttdWx0aSA/ICcnIDogJ24nfWAsIHBhdHRlcm5dO1xuICB0cnkge1xuICAgIGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYygncGdyZXAnLCBhcmdzKTtcbiAgICBjb25zdCByZXN1bHQgPSBzdGRvdXQuc3BsaXQoJ1xcbicpXG4gICAgICAuZmlsdGVyKE51bWJlcilcbiAgICAgIC5tYXAoKHgpID0+IGAke3h9YCk7XG4gICAgcmV0dXJuIG11bHRpID8gcmVzdWx0IDogKF8uaXNFbXB0eShyZXN1bHQpID8gW10gOiBfLmZpcnN0KHJlc3VsdCkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cbi8qKlxuICogQ29udmVydHMgYW4gZW52IG9iamVjdCB0byB0aGUgZm9ybWF0IHdoYXQgSURCIHByb2Nlc3MgZXhwZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IGVudiBUaGUgb2JqZWN0IG9mIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBjb252ZXJ0VG9JREJFbnYgKGVudikge1xuICBpZiAoIV8uaXNQbGFpbk9iamVjdChlbnYpIHx8IF8uaXNFbXB0eShlbnYpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIF8ucmVkdWNlKGVudiwgKHJlc3VsdCwgdmFsdWUsIGtleSkgPT4ge1xuICAgIHJlc3VsdFtJREJfRU5WX1BSRUZJWCArIGtleV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LCB7fSk7XG59XG5cbi8qKlxuICogU29tZSBpZGIgY29tbWFuZHMgZG9uJ3QgcHJvcGVybHkgZm9ybWF0IHRoZWlyXG4gKiBvdXRwdXQgaWYgYC0tanNvbmAgYXJndW1lbnQgaXMgcHJvdmlkZWQuIFRoaXMgaGVscGVyXG4gKiBmaXhlcyB0aGUgb3JpZ2luYWwgb3V0cHV0LCBzbyBpdCBjYW4gYmUgcmVwcmVzZW50ZWQgYXNcbiAqIGEgdmFsaWQgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCBUaGUgb3JpZ2luYWwgY29tbWFuZCBvdXRwdXRcbiAqIEByZXR1cm5zIHtBcnJheTxvYmplY3Q+fSBBcnJheSBvZiBvYmplY3RzIG9yIGFuIGVtcHR5IGFycmF5XG4gKi9cbmZ1bmN0aW9uIGZpeE91dHB1dFRvQXJyYXkgKG91dHB1dCkge1xuICBpZiAoIV8udHJpbShvdXRwdXQpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIG91dHB1dC5zcGxpdCgnXFxuJylcbiAgICAucmVkdWNlKChhY2MsIHgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBbLi4uYWNjLCBKU09OLnBhcnNlKHgpXTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH1cbiAgICB9LCBbXSk7XG59XG5cbi8qKlxuICogU29tZSBpZGIgY29tbWFuZHMgZG9uJ3QgcHJvcGVybHkgZm9ybWF0IHRoZWlyXG4gKiBvdXRwdXQgaWYgYC0tanNvbmAgYXJndW1lbnQgaXMgcHJvdmlkZWQuIFRoaXMgaGVscGVyXG4gKiBmaXhlcyB0aGUgb3JpZ2luYWwgb3V0cHV0LCBzbyBpdCBjYW4gYmUgcmVwcmVzZW50ZWQgYXNcbiAqIGEgdmFsaWQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgVGhlIG9yaWdpbmFsIGNvbW1hbmQgb3V0cHV0XG4gKiBAcmV0dXJucyB7b2JqZWN0fSBUaGUgcGFyc2VkIG9iamVjdCBvciBhbiBlbXB0eSBvYmplY3RcbiAqL1xuZnVuY3Rpb24gZml4T3V0cHV0VG9PYmplY3QgKG91dHB1dCkge1xuICBpZiAoIV8udHJpbShvdXRwdXQpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGNvbnN0IGxpbmVzID0gb3V0cHV0LnNwbGl0KCdcXG4nKTtcbiAgY29uc3QgZ2V0TGVmdEluZGVudCA9IChsaW5lKSA9PiBsaW5lLmxlbmd0aCAtIF8udHJpbVN0YXJ0KGxpbmUpLmxlbmd0aDtcbiAgbGV0IGxpbmVJZHggPSAwO1xuICBkbyB7XG4gICAgaWYgKCFfLnRyaW0obGluZXNbbGluZUlkeF0pKSB7XG4gICAgICBsaW5lSWR4Kys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBvYmplY3RNYXRjaCA9IC8oXFxTKylcXHMrey8uZXhlYyhsaW5lc1tsaW5lSWR4XSk7XG4gICAgaWYgKG9iamVjdE1hdGNoKSB7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZW50ID0gZ2V0TGVmdEluZGVudChsaW5lc1tsaW5lSWR4XSk7XG4gICAgICBjb25zdCBzdGFydExpbmUgPSBsaW5lSWR4O1xuICAgICAgZG8ge1xuICAgICAgICBsaW5lSWR4Kys7XG4gICAgICB9IHdoaWxlIChsaW5lSWR4IDwgbGluZXMubGVuZ3RoICYmIGN1cnJlbnRJbmRlbnQgPCBnZXRMZWZ0SW5kZW50KGxpbmVzW2xpbmVJZHhdKSk7XG4gICAgICBjb25zdCBvYmplY3ROYW1lID0gb2JqZWN0TWF0Y2hbMV07XG4gICAgICBjb25zdCBvYmplY3RDb250ZW50ID0gbGluZXMuc2xpY2Uoc3RhcnRMaW5lICsgMSwgbGluZUlkeCkuam9pbignXFxuJyk7XG4gICAgICByZXN1bHRbb2JqZWN0TmFtZV0gPSBmaXhPdXRwdXRUb09iamVjdChvYmplY3RDb250ZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU1hdGNoID0gLyhcXFMrKTpcXHMrKFteXFxuXSspLy5leGVjKGxpbmVzW2xpbmVJZHhdKTtcbiAgICBpZiAocHJvcGVydHlNYXRjaCkge1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gcHJvcGVydHlNYXRjaFsxXTtcbiAgICAgIGNvbnN0IHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eU1hdGNoWzJdLnRyaW0oKTtcbiAgICAgIHJlc3VsdFtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZS5zdGFydHNXaXRoKCdcIicpXG4gICAgICAgID8gXy50cmltKHByb3BlcnR5VmFsdWUsICdcIicpXG4gICAgICAgIDogTnVtYmVyKHByb3BlcnR5VmFsdWUpO1xuICAgIH1cblxuICAgIGxpbmVJZHgrKztcbiAgfSB3aGlsZSAobGluZUlkeCA8IGxpbmVzLmxlbmd0aCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCB7XG4gIERFRkFVTFRfSURCX0VYRUNfVElNRU9VVCwgZ2V0UGlkcywgSURCX0VYRUNVVEFCTEUsXG4gIElEQl9DT01QQU5JT05fRVhFQ1VUQUJMRSwgREVGQVVMVF9JREJfUE9SVCxcbiAgREVGQVVMVF9DT01QQU5JT05fUE9SVCwgREVGQVVMVF9DT01QQU5JT05fR1JQQ19QT1JULFxuICBmaXhPdXRwdXRUb0FycmF5LCBmaXhPdXRwdXRUb09iamVjdCwgY29udmVydFRvSURCRW52XG59O1xuIl0sImZpbGUiOiJsaWIvaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9