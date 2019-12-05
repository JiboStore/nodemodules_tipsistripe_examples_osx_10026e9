"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CHROMIUM_WIN = exports.WEBVIEW_BASE = exports.WEBVIEW_WIN = exports.NATIVE_WIN = exports.helpers = exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _asyncbox = require("asyncbox");

const NATIVE_WIN = 'NATIVE_APP';
exports.NATIVE_WIN = NATIVE_WIN;
const WEBVIEW_WIN = 'WEBVIEW';
exports.WEBVIEW_WIN = WEBVIEW_WIN;
const WEBVIEW_BASE = `${WEBVIEW_WIN}_`;
exports.WEBVIEW_BASE = WEBVIEW_BASE;
const WEBVIEW_REGEXP = new RegExp(`@?webview_devtools_remote_(\\d+)`);
const WEBVIEW_PID_REGEXP = new RegExp(`${WEBVIEW_BASE}(\\d+)`);
const CHROMIUM_WIN = 'CHROMIUM';
exports.CHROMIUM_WIN = CHROMIUM_WIN;
const CROSSWALK_SOCKET_SUFFIX = '_devtools_remote';
const CROSSWALK_REGEXP_STRING = `(\\S*)${CROSSWALK_SOCKET_SUFFIX}`;
const CROSSWALK_REGEXP = new RegExp(`@${CROSSWALK_REGEXP_STRING}`);
const CROSSWALK_PROCESS_REGEXP = new RegExp(WEBVIEW_BASE + CROSSWALK_REGEXP_STRING);
const DEFAULT_WEBVIEW_DEVTOOLS_PORT = 9222;
let helpers = {};
exports.helpers = helpers;

async function getPotentialWebviewProcs(adb) {
  const procs = [];
  const out = await adb.shell(['cat', '/proc/net/unix']);

  for (let line of out.split('\n')) {
    line = line.trim();
    let regexMatch;

    if (regexMatch = line.match(WEBVIEW_REGEXP) || line.match(CROSSWALK_REGEXP)) {
      procs.push(regexMatch[0]);
    }
  }

  return _lodash.default.uniq(procs);
}

async function webviewsFromProcs(adb, deviceSocket) {
  const procs = await getPotentialWebviewProcs(adb);
  const webviews = [];

  for (const proc of procs) {
    if (deviceSocket === 'chrome_devtools_remote' && proc === `@${deviceSocket}`) {
      webviews.push({
        proc,
        webview: CHROMIUM_WIN
      });
      continue;
    }

    let webviewPid;
    let crosswalkWebviewSocket;

    if (webviewPid = proc.match(WEBVIEW_REGEXP)) {
      webviews.push({
        proc,
        webview: `${WEBVIEW_BASE}${webviewPid[1]}`
      });
    } else if (crosswalkWebviewSocket = proc.match(CROSSWALK_REGEXP)) {
      if (deviceSocket) {
        if (crosswalkWebviewSocket[0] === `@${deviceSocket}`) {
          webviews.push({
            proc,
            webview: `${WEBVIEW_BASE}${crosswalkWebviewSocket[1]}`
          });
        }
      } else {
        webviews.push({
          proc,
          webview: `${WEBVIEW_BASE}${crosswalkWebviewSocket[1]}${CROSSWALK_SOCKET_SUFFIX}`
        });
      }
    }
  }

  return webviews;
}

async function webviewHasPages(adb, {
  proc,
  webview
}, webviewDevtoolsPort) {
  let hasPages = false;
  const wvPort = webviewDevtoolsPort || DEFAULT_WEBVIEW_DEVTOOLS_PORT;
  const remotePort = proc.replace(/^@/, '');
  const portAlreadyForwarded = (await adb.getForwardList()).map(line => line.split(' ')[1]).reduce((acc, portSpec) => acc || portSpec === `tcp:${wvPort}`, false);

  if (portAlreadyForwarded) {
    _logger.default.warn(`Port ${wvPort} was already forwarded when attempting webview ` + `page presence check, so was unable to perform check.`);

    return false;
  }

  await adb.adbExec(['forward', `tcp:${wvPort}`, `localabstract:${remotePort}`]);

  try {
    const remoteDebugger = `http://localhost:${wvPort}/json/list`;

    _logger.default.debug(`Attempting to get list of pages for webview '${webview}' ` + `from the remote debugger at ${remoteDebugger}.`);

    const pages = await (0, _requestPromise.default)({
      uri: remoteDebugger,
      json: true
    });

    if (pages.length > 0) {
      hasPages = true;
    }

    _logger.default.info(`Webview '${webview}' has ${hasPages ? '' : 'no '} pages`);
  } catch (e) {
    _logger.default.warn(`Got error when retrieving page list, will assume no pages: ${e}`);
  }

  await adb.removePortForward(wvPort);
  return hasPages;
}

helpers.procFromWebview = async function procFromWebview(adb, webview) {
  if (webview.match(WEBVIEW_PID_REGEXP) === null) {
    let processName = webview.match(CROSSWALK_PROCESS_REGEXP);

    if (processName === null) {
      throw new Error(`Could not find process name for webview ${webview}`);
    }

    return processName[1];
  }

  let pid = webview.match(/\d+$/);

  if (!pid) {
    throw new Error(`Could not find PID for webview ${webview}`);
  }

  pid = pid[0];

  _logger.default.debug(`${webview} mapped to pid ${pid}`);

  _logger.default.debug('Getting process name for webview');

  let out = await adb.shell('ps');
  let pkg = 'unknown';
  let lines = out.split(/\r?\n/);
  const fullHeader = lines[0].trim();
  const header = fullHeader.split(/\s+/);
  const pidColumn = header.indexOf('PID');

  for (let line of lines) {
    const entries = line.trim().split(/\s+/);
    const pidEntry = entries[pidColumn];

    if (pidEntry === pid) {
      pkg = _lodash.default.last(entries);

      _logger.default.debug(`Parsed pid: '${pidEntry}' pkg: '${pkg}' from`);

      _logger.default.debug(`    ${fullHeader}`);

      _logger.default.debug(`    ${line}`);

      break;
    }
  }

  _logger.default.debug(`Returning process name: '${pkg}'`);

  return pkg;
};

helpers.getWebviews = async function getWebviews(adb, {
  androidDeviceSocket = null,
  ensureWebviewsHavePages = null,
  webviewDevtoolsPort = null
} = {}) {
  _logger.default.debug('Getting a list of available webviews');

  let webviewProcs = await webviewsFromProcs(adb, androidDeviceSocket);

  if (ensureWebviewsHavePages) {
    _logger.default.info('Retrieved potential webviews; will filter out ones with no active pages');

    webviewProcs = await (0, _asyncbox.asyncfilter)(webviewProcs, async wp => await webviewHasPages(adb, wp, webviewDevtoolsPort), false);
  } else {
    _logger.default.info('Not checking whether webviews have active pages; use the ' + "'ensureWebviewsHavePages' cap to turn this check on");
  }

  let webviews = webviewProcs.map(wp => wp.webview);

  if (androidDeviceSocket) {
    return webviews;
  }

  webviews = await (0, _asyncbox.asyncmap)(webviews, async webviewName => {
    let pkg = await helpers.procFromWebview(adb, webviewName);
    return WEBVIEW_BASE + pkg;
  });

  _logger.default.debug(`Found webviews: ${JSON.stringify(webviews)}`);

  return webviews;
};

helpers.decorateChromeOptions = function decorateChromeOptions(caps, opts, deviceId) {
  if (opts.chromeOptions) {
    if (opts.chromeOptions.Arguments) {
      opts.chromeOptions.args = [...(opts.chromeOptions.args || []), ...opts.chromeOptions.Arguments];
      delete opts.chromeOptions.Arguments;
    }

    for (let [opt, val] of _lodash.default.toPairs(opts.chromeOptions)) {
      if (_lodash.default.isUndefined(caps.chromeOptions[opt])) {
        caps.chromeOptions[opt] = val;
      } else {
        _logger.default.warn(`Cannot pass option ${caps.chromeOptions[opt]} because ` + 'Appium needs it to make chromeDriver work');
      }
    }
  }

  caps.chromeOptions.androidDeviceSerial = deviceId;
  return caps;
};

var _default = helpers;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi93ZWJ2aWV3LWhlbHBlcnMuanMiXSwibmFtZXMiOlsiTkFUSVZFX1dJTiIsIldFQlZJRVdfV0lOIiwiV0VCVklFV19CQVNFIiwiV0VCVklFV19SRUdFWFAiLCJSZWdFeHAiLCJXRUJWSUVXX1BJRF9SRUdFWFAiLCJDSFJPTUlVTV9XSU4iLCJDUk9TU1dBTEtfU09DS0VUX1NVRkZJWCIsIkNST1NTV0FMS19SRUdFWFBfU1RSSU5HIiwiQ1JPU1NXQUxLX1JFR0VYUCIsIkNST1NTV0FMS19QUk9DRVNTX1JFR0VYUCIsIkRFRkFVTFRfV0VCVklFV19ERVZUT09MU19QT1JUIiwiaGVscGVycyIsImdldFBvdGVudGlhbFdlYnZpZXdQcm9jcyIsImFkYiIsInByb2NzIiwib3V0Iiwic2hlbGwiLCJsaW5lIiwic3BsaXQiLCJ0cmltIiwicmVnZXhNYXRjaCIsIm1hdGNoIiwicHVzaCIsIl8iLCJ1bmlxIiwid2Vidmlld3NGcm9tUHJvY3MiLCJkZXZpY2VTb2NrZXQiLCJ3ZWJ2aWV3cyIsInByb2MiLCJ3ZWJ2aWV3Iiwid2Vidmlld1BpZCIsImNyb3Nzd2Fsa1dlYnZpZXdTb2NrZXQiLCJ3ZWJ2aWV3SGFzUGFnZXMiLCJ3ZWJ2aWV3RGV2dG9vbHNQb3J0IiwiaGFzUGFnZXMiLCJ3dlBvcnQiLCJyZW1vdGVQb3J0IiwicmVwbGFjZSIsInBvcnRBbHJlYWR5Rm9yd2FyZGVkIiwiZ2V0Rm9yd2FyZExpc3QiLCJtYXAiLCJyZWR1Y2UiLCJhY2MiLCJwb3J0U3BlYyIsImxvZ2dlciIsIndhcm4iLCJhZGJFeGVjIiwicmVtb3RlRGVidWdnZXIiLCJkZWJ1ZyIsInBhZ2VzIiwidXJpIiwianNvbiIsImxlbmd0aCIsImluZm8iLCJlIiwicmVtb3ZlUG9ydEZvcndhcmQiLCJwcm9jRnJvbVdlYnZpZXciLCJwcm9jZXNzTmFtZSIsIkVycm9yIiwicGlkIiwicGtnIiwibGluZXMiLCJmdWxsSGVhZGVyIiwiaGVhZGVyIiwicGlkQ29sdW1uIiwiaW5kZXhPZiIsImVudHJpZXMiLCJwaWRFbnRyeSIsImxhc3QiLCJnZXRXZWJ2aWV3cyIsImFuZHJvaWREZXZpY2VTb2NrZXQiLCJlbnN1cmVXZWJ2aWV3c0hhdmVQYWdlcyIsIndlYnZpZXdQcm9jcyIsIndwIiwid2Vidmlld05hbWUiLCJKU09OIiwic3RyaW5naWZ5IiwiZGVjb3JhdGVDaHJvbWVPcHRpb25zIiwiY2FwcyIsIm9wdHMiLCJkZXZpY2VJZCIsImNocm9tZU9wdGlvbnMiLCJBcmd1bWVudHMiLCJhcmdzIiwib3B0IiwidmFsIiwidG9QYWlycyIsImlzVW5kZWZpbmVkIiwiYW5kcm9pZERldmljZVNlcmlhbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxVQUFVLEdBQUcsWUFBbkI7O0FBQ0EsTUFBTUMsV0FBVyxHQUFHLFNBQXBCOztBQUNBLE1BQU1DLFlBQVksR0FBSSxHQUFFRCxXQUFZLEdBQXBDOztBQUNBLE1BQU1FLGNBQWMsR0FBRyxJQUFJQyxNQUFKLENBQVksa0NBQVosQ0FBdkI7QUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxJQUFJRCxNQUFKLENBQVksR0FBRUYsWUFBYSxRQUEzQixDQUEzQjtBQUNBLE1BQU1JLFlBQVksR0FBRyxVQUFyQjs7QUFDQSxNQUFNQyx1QkFBdUIsR0FBRyxrQkFBaEM7QUFDQSxNQUFNQyx1QkFBdUIsR0FBSSxTQUFRRCx1QkFBd0IsRUFBakU7QUFDQSxNQUFNRSxnQkFBZ0IsR0FBRyxJQUFJTCxNQUFKLENBQVksSUFBR0ksdUJBQXdCLEVBQXZDLENBQXpCO0FBQ0EsTUFBTUUsd0JBQXdCLEdBQUcsSUFBSU4sTUFBSixDQUFXRixZQUFZLEdBQUdNLHVCQUExQixDQUFqQztBQUNBLE1BQU1HLDZCQUE2QixHQUFHLElBQXRDO0FBR0EsSUFBSUMsT0FBTyxHQUFHLEVBQWQ7OztBQVdBLGVBQWVDLHdCQUFmLENBQXlDQyxHQUF6QyxFQUE4QztBQUM1QyxRQUFNQyxLQUFLLEdBQUcsRUFBZDtBQUNBLFFBQU1DLEdBQUcsR0FBRyxN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Q0FBQ0UsYUFBZixDQUF2QixFQUFzRDtBQUNwRCxVQUFJMUQsZ0JBQUVnRSxXQUFGLENBQWNULElBQUksQ0FBQ0csYUFBTCxDQUFtQkcsR0FBbkIsQ0FBZCxDQUFKLEVBQTRDO0FBQzFDTixRQUFBQSxJQUFJLENBQUNHLGFBQUwsQ0FBbUJHLEdBQW5CLElBQTBCQyxHQUExQjtBQUNELE9BRkQsTUFFTztBQUNMekMsd0JBQU9DLElBQVAsQ0FBYSxzQkFBcUJpQyxJQUFJLENBQUNHLGFBQUwsQ0FBbUJHLEdBQW5CLENBQXdCLFdBQTlDLEdBQ0EsMkNBRFo7QUFFRDtBQUNGO0FBQ0Y7O0FBR0ROLEVBQUFBLElBQUksQ0FBQ0csYUFBTCxDQUFtQk8sbUJBQW5CLEdBQXlDUixRQUF6QztBQUNBLFNBQU9GLElBQVA7QUFDRCxDQXJCRDs7ZUF1QmVuRSxPIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlJztcbmltcG9ydCB7IGFzeW5jbWFwLCBhc3luY2ZpbHRlciB9IGZyb20gJ2FzeW5jYm94JztcblxuY29uc3QgTkFUSVZFX1dJTiA9ICdOQVRJVkVfQVBQJztcbmNvbnN0IFdFQlZJRVdfV0lOID0gJ1dFQlZJRVcnO1xuY29uc3QgV0VCVklFV19CQVNFID0gYCR7V0VCVklFV19XSU59X2A7XG5jb25zdCBXRUJWSUVXX1JFR0VYUCA9IG5ldyBSZWdFeHAoYEA/d2Vidmlld19kZXZ0b29sc19yZW1vdGVfKFxcXFxkKylgKTtcbmNvbnN0IFdFQlZJRVdfUElEX1JFR0VYUCA9IG5ldyBSZWdFeHAoYCR7V0VCVklFV19CQVNFfShcXFxcZCspYCk7XG5jb25zdCBDSFJPTUlVTV9XSU4gPSAnQ0hST01JVU0nO1xuY29uc3QgQ1JPU1NXQUxLX1NPQ0tFVF9TVUZGSVggPSAnX2RldnRvb2xzX3JlbW90ZSc7XG5jb25zdCBDUk9TU1dBTEtfUkVHRVhQX1NUUklORyA9IGAoXFxcXFMqKSR7Q1JPU1NXQUxLX1NPQ0tFVF9TVUZGSVh9YDtcbmNvbnN0IENST1NTV0FMS19SRUdFWFAgPSBuZXcgUmVnRXhwKGBAJHtDUk9TU1dBTEtfUkVHRVhQX1NUUklOR31gKTtcbmNvbnN0IENST1NTV0FMS19QUk9DRVNTX1JFR0VYUCA9IG5ldyBSZWdFeHAoV0VCVklFV19CQVNFICsgQ1JPU1NXQUxLX1JFR0VYUF9TVFJJTkcpO1xuY29uc3QgREVGQVVMVF9XRUJWSUVXX0RFVlRPT0xTX1BPUlQgPSA5MjIyO1xuXG5cbmxldCBoZWxwZXJzID0ge307XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBnZXRzIGEgbGlzdCBvZiBhbmRyb2lkIHN5c3RlbSBwcm9jZXNzZXMgYW5kIHJldHVybnMgb25lc1xuICogdGhhdCBsb29rIGxpa2Ugd2Vidmlld3NcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gYWRiIC0gYW4gQURCIGluc3RhbmNlXG4gKlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IC0gYSBsaXN0IG9mIHdlYnZpZXcgcHJvY2VzcyBuYW1lcyAoaW5jbHVkaW5nIHRoZSBsZWFkaW5nXG4gKiAnQCcpXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdldFBvdGVudGlhbFdlYnZpZXdQcm9jcyAoYWRiKSB7XG4gIGNvbnN0IHByb2NzID0gW107XG4gIGNvbnN0IG91dCA9IGF3YWl0IGFkYi5zaGVsbChbJ2NhdCcsICcvcHJvYy9uZXQvdW5peCddKTtcbiAgZm9yIChsZXQgbGluZSBvZiBvdXQuc3BsaXQoJ1xcbicpKSB7XG4gICAgbGluZSA9IGxpbmUudHJpbSgpO1xuICAgIGxldCByZWdleE1hdGNoO1xuICAgIGlmICgocmVnZXhNYXRjaCA9IChsaW5lLm1hdGNoKFdFQlZJRVdfUkVHRVhQKSB8fCBsaW5lLm1hdGNoKENST1NTV0FMS19SRUdFWFApKSkpIHtcbiAgICAgIHByb2NzLnB1c2gocmVnZXhNYXRjaFswXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc29tZXRpbWVzIHRoZSB3ZWJ2aWV3IHByb2Nlc3Mgc2hvd3MgdXAgbXVsdGlwbGUgdGltZXMgcGVyIGFwcFxuICByZXR1cm4gXy51bmlxKHByb2NzKTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBXZWJ2aWV3UHJvY1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHByb2MgLSBUaGUgd2VidmlldyBwcm9jZXNzIG5hbWUgKGFzIHJldHVybmVkIGJ5XG4gKiBnZXRQb3RlbnRpYWxXZWJ2aWV3UHJvY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB3ZWJ2aWV3IC0gVGhlIGFjdHVhbCB3ZWJ2aWV3IGNvbnRleHQgbmFtZVxuICovXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0cmlldmVzIGEgbGlzdCBvZiBzeXN0ZW0gcHJvY2Vzc2VzIHRoYXQgbG9vayBsaWtlIHdlYnZpZXdzLFxuICogYW5kIHJldHVybnMgdGhlbSBhbG9uZyB3aXRoIHRoZSB3ZWJ2aWV3IGNvbnRleHQgbmFtZSBhcHByb3ByaWF0ZSBmb3IgaXQuXG4gKiBJZiB3ZSBwYXNzIGluIGEgZGV2aWNlU29ja2V0LCB3ZSBvbmx5IGF0dGVtcHQgdG8gZmluZCB3ZWJ2aWV3cyB3aGljaCBtYXRjaFxuICogdGhhdCBzb2NrZXQgbmFtZSAodGhpcyBpcyBmb3IgYXBwcyB3aGljaCBlbWJlZCBDaHJvbWl1bSwgd2hpY2ggaXNuJ3QgdGhlXG4gKiBzYW1lIGFzIGNocm9tZS1iYWNrZWQgd2Vidmlld3MpLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBhZGIgLSBhbiBBREIgaW5zdGFuY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXZpY2VTb2NrZXQgLSB0aGUgZXhwbGljdGx5LW5hbWVkIGRldmljZSBzb2NrZXQgdG8gdXNlXG4gKlxuICogQHJldHVybiB7QXJyYXkuPFdlYnZpZXdQcm9jPn1cbiAqL1xuLy8gVE9ETzogc29tZSBvZiB0aGlzIGZ1bmN0aW9uIHByb2JhYmx5IGJlbG9uZ3MgaW4gYXBwaXVtLWFkYj9cbmFzeW5jIGZ1bmN0aW9uIHdlYnZpZXdzRnJvbVByb2NzIChhZGIsIGRldmljZVNvY2tldCkge1xuICBjb25zdCBwcm9jcyA9IGF3YWl0IGdldFBvdGVudGlhbFdlYnZpZXdQcm9jcyhhZGIpO1xuICBjb25zdCB3ZWJ2aWV3cyA9IFtdO1xuICBmb3IgKGNvbnN0IHByb2Mgb2YgcHJvY3MpIHtcbiAgICBpZiAoZGV2aWNlU29ja2V0ID09PSAnY2hyb21lX2RldnRvb2xzX3JlbW90ZScgJiYgcHJvYyA9PT0gYEAke2RldmljZVNvY2tldH1gKSB7XG4gICAgICB3ZWJ2aWV3cy5wdXNoKHtwcm9jLCB3ZWJ2aWV3OiBDSFJPTUlVTV9XSU59KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGxldCB3ZWJ2aWV3UGlkO1xuICAgIGxldCBjcm9zc3dhbGtXZWJ2aWV3U29ja2V0O1xuICAgIGlmICgod2Vidmlld1BpZCA9IHByb2MubWF0Y2goV0VCVklFV19SRUdFWFApKSkge1xuICAgICAgLy8gZm9yIG11bHRpcGxlIHdlYnZpZXdzIGEgbGlzdCBvZiAnV0VCVklFV188aW5kZXg+JyB3aWxsIGJlIHJldHVybmVkXG4gICAgICAvLyB3aGVyZSA8aW5kZXg+IGlzIHplcm8gYmFzZWQgKHNhbWUgaXMgaW4gc2VsZW5kcm9pZClcbiAgICAgIHdlYnZpZXdzLnB1c2goe3Byb2MsIHdlYnZpZXc6IGAke1dFQlZJRVdfQkFTRX0ke3dlYnZpZXdQaWRbMV19YH0pO1xuICAgIH0gZWxzZSBpZiAoKGNyb3Nzd2Fsa1dlYnZpZXdTb2NrZXQgPSBwcm9jLm1hdGNoKENST1NTV0FMS19SRUdFWFApKSkge1xuICAgICAgaWYgKGRldmljZVNvY2tldCkge1xuICAgICAgICBpZiAoY3Jvc3N3YWxrV2Vidmlld1NvY2tldFswXSA9PT0gYEAke2RldmljZVNvY2tldH1gKSB7XG4gICAgICAgICAgd2Vidmlld3MucHVzaCh7cHJvYywgd2VidmlldzogYCR7V0VCVklFV19CQVNFfSR7Y3Jvc3N3YWxrV2Vidmlld1NvY2tldFsxXX1gfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdlYnZpZXdzLnB1c2goe3Byb2MsIHdlYnZpZXc6IGAke1dFQlZJRVdfQkFTRX0ke2Nyb3Nzd2Fsa1dlYnZpZXdTb2NrZXRbMV19JHtDUk9TU1dBTEtfU09DS0VUX1NVRkZJWH1gfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB3ZWJ2aWV3cztcbn1cblxuLyoqXG4gKiBHaXZlbiBhICd3ZWJ2aWV3LXByb2MnIG9iamVjdCByZXN1bHRpbmcgZnJvbSBhIGNhbGwgdG8gd2Vidmlld3NGcm9tUHJvY3MsXG4gKiBjaGVjayB3aGV0aGVyIHdlIGNhbiBkZXRlY3QgYW55IGFjdGl2ZSBwYWdlcyBjb3JyZXNwb25kaW5nIHRvIHRoYXQgd2Vidmlldy5cbiAqIFRoaXMgaXMgdXNlZCBieSBnZXRXZWJ2aWV3cyB0byBmaWx0ZXIgb3V0IGFueSB3ZWJ2aWV3LWxvb2tpbmcgcHJvY2Vzc2VzXG4gKiB3aGljaCBoYXZlIGEgcmVtb3RlIGRlYnVnIHBvcnQgb3BlbiBidXQgd2hpY2ggYXJlbid0IGFjdHVhbGx5IHJ1bm5pbmcgYW55XG4gKiBwYWdlcywgYmVjYXVzZSBzdWNoIHByb2Nlc3NlcyBjYW4ndCBiZSBhdXRvbWF0ZWQgYnkgY2hyb21lZHJpdmVyIGFueXdheS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gYWRiIC0gYW4gQURCIGluc3RhbmNlXG4gKiBAcGFyYW0ge1dlYnZpZXdQcm9jfSB3cCAtIHRoZSB3ZWJ2aWV3IHRvIGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gd2Vidmlld0RldnRvb2xzUG9ydCAtIHRoZSBsb2NhbCBwb3J0IHRvIHVzZSBmb3IgdGhlIGNoZWNrXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIG9yIG5vdCB0aGUgd2VidmlldyBoYXMgcGFnZXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gd2Vidmlld0hhc1BhZ2VzIChhZGIsIHtwcm9jLCB3ZWJ2aWV3fSwgd2Vidmlld0RldnRvb2xzUG9ydCkge1xuICBsZXQgaGFzUGFnZXMgPSBmYWxzZTtcbiAgY29uc3Qgd3ZQb3J0ID0gd2Vidmlld0RldnRvb2xzUG9ydCB8fCBERUZBVUxUX1dFQlZJRVdfREVWVE9PTFNfUE9SVDtcblxuICAvLyBwcm9jIG5hbWVzIGNvbWUgd2l0aCAnQCcsIGJ1dCB0aGlzIHNob3VsZCBub3QgYmUgYSBwYXJ0IG9mIHRoZSBhYnN0cmFjdFxuICAvLyByZW1vdGUgcG9ydCwgc28gcmVtb3ZlIGl0XG4gIGNvbnN0IHJlbW90ZVBvcnQgPSBwcm9jLnJlcGxhY2UoL15ALywgJycpO1xuXG4gIC8vIHdlIGRvbid0IHdhbnQgdG8gbWVzcyB3aXRoIHRoaW5ncyBpZiBvdXIgd3ZQb3J0IGlzIGFscmVhZHkgZm9yd2FyZGVkLFxuICAvLyBzaW5jZSB3aG8ga25vd3Mgd2hhdCBpcyBjdXJyZW50bHkgZ29pbmcgb24gdGhlcmUuIFNvIGRldGVybWluZSBpZiBpdCBpc1xuICAvLyBhbHJlYWR5IGZvcndhcmRlZCwgYW5kIGp1c3Qgc2hvcnQtY2lyY3VpdCB0aGlzIHdob2xlIG1ldGhvZCBpZiBzby5cbiAgY29uc3QgcG9ydEFscmVhZHlGb3J3YXJkZWQgPSAoYXdhaXQgYWRiLmdldEZvcndhcmRMaXN0KCkpXG4gICAgLm1hcCgobGluZSkgPT4gbGluZS5zcGxpdCgnICcpWzFdKSAvLyB0aGUgbG9jYWwgcG9ydCBpcyB0aGUgc2Vjb25kIGZpZWxkIGluIHRoZSBsaW5lXG4gICAgLnJlZHVjZSgoYWNjLCBwb3J0U3BlYykgPT4gYWNjIHx8IHBvcnRTcGVjID09PSBgdGNwOiR7d3ZQb3J0fWAsIGZhbHNlKTtcbiAgaWYgKHBvcnRBbHJlYWR5Rm9yd2FyZGVkKSB7XG4gICAgbG9nZ2VyLndhcm4oYFBvcnQgJHt3dlBvcnR9IHdhcyBhbHJlYWR5IGZvcndhcmRlZCB3aGVuIGF0dGVtcHRpbmcgd2VidmlldyBgICtcbiAgICAgICAgICAgICAgICBgcGFnZSBwcmVzZW5jZSBjaGVjaywgc28gd2FzIHVuYWJsZSB0byBwZXJmb3JtIGNoZWNrLmApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvcndhcmQgdGhlIHNwZWNpZmllZCBsb2NhbCBwb3J0IHRvIHRoZSByZW1vdGUgZGVidWdnZXIgcG9ydCBvbiB0aGUgZGV2aWNlXG4gIGF3YWl0IGFkYi5hZGJFeGVjKFsnZm9yd2FyZCcsIGB0Y3A6JHt3dlBvcnR9YCwgYGxvY2FsYWJzdHJhY3Q6JHtyZW1vdGVQb3J0fWBdKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZW1vdGVEZWJ1Z2dlciA9IGBodHRwOi8vbG9jYWxob3N0OiR7d3ZQb3J0fS9qc29uL2xpc3RgO1xuICAgIGxvZ2dlci5kZWJ1ZyhgQXR0ZW1wdGluZyB0byBnZXQgbGlzdCBvZiBwYWdlcyBmb3Igd2VidmlldyAnJHt3ZWJ2aWV3fScgYCArXG4gICAgICAgICAgICAgICAgIGBmcm9tIHRoZSByZW1vdGUgZGVidWdnZXIgYXQgJHtyZW1vdGVEZWJ1Z2dlcn0uYCk7XG4gICAgLy8gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlIGNocm9tZSByZW1vdGUgZGVidWdnZXIgUkVTVCBBUEkganVzdCB0byBnZXRcbiAgICAvLyBhIGxpc3Qgb2YgcGFnZXNcbiAgICBjb25zdCBwYWdlcyA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgdXJpOiByZW1vdGVEZWJ1Z2dlcixcbiAgICAgIGpzb246IHRydWVcbiAgICB9KTtcbiAgICBpZiAocGFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgaGFzUGFnZXMgPSB0cnVlO1xuICAgIH1cbiAgICBsb2dnZXIuaW5mbyhgV2VidmlldyAnJHt3ZWJ2aWV3fScgaGFzICR7aGFzUGFnZXMgPyAnJyA6ICdubyAnfSBwYWdlc2ApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLndhcm4oYEdvdCBlcnJvciB3aGVuIHJldHJpZXZpbmcgcGFnZSBsaXN0LCB3aWxsIGFzc3VtZSBubyBwYWdlczogJHtlfWApO1xuICB9XG4gIGF3YWl0IGFkYi5yZW1vdmVQb3J0Rm9yd2FyZCh3dlBvcnQpOyAvLyBtYWtlIHN1cmUgd2UgY2xlYW4gdXBcbiAgcmV0dXJuIGhhc1BhZ2VzO1xufVxuXG4vKipcbiAqIFRha2UgYSB3ZWJ2aWV3IG5hbWUgbGlrZSBXRUJWSUVXXzQyOTYgYW5kIHVzZSAnYWRiIHNoZWxsIHBzJyB0byBmaWd1cmUgb3V0XG4gKiB3aGljaCBhcHAgcGFja2FnZSBpcyBhc3NvY2lhdGVkIHdpdGggdGhhdCB3ZWJ2aWV3LiBPbmUgb2YgdGhlIHJlYXNvbnMgd2VcbiAqIHdhbnQgdG8gZG8gdGhpcyBpcyB0byBtYWtlIHN1cmUgd2UncmUgbGlzdGluZyB3ZWJ2aWV3cyBmb3IgdGhlIGFjdHVhbCBBVVQsXG4gKiBub3Qgc29tZSBvdGhlciBydW5uaW5nIGFwcFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBhZGIgLSBhbiBBREIgaW5zdGFuY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSB3ZWJ2aWV3IC0gYSB3ZWJ2aWV3IHByb2Nlc3MgbmFtZVxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9IC0gdGhlIHBhY2thZ2UgbmFtZSBvZiB0aGUgYXBwIHJ1bm5pbmcgdGhlIHdlYnZpZXdcbiAqL1xuLy8gVE9ETzogdGhpcyBzaG91bGQgcHJvYmFibHkgYmUgY2FsbGVkIHByb2NGcm9tUGlkIGFuZCBleGlzdCBpbiBhcHBpdW0tYWRiXG5oZWxwZXJzLnByb2NGcm9tV2VidmlldyA9IGFzeW5jIGZ1bmN0aW9uIHByb2NGcm9tV2VidmlldyAoYWRiLCB3ZWJ2aWV3KSB7XG4gIGlmICh3ZWJ2aWV3Lm1hdGNoKFdFQlZJRVdfUElEX1JFR0VYUCkgPT09IG51bGwpIHtcbiAgICBsZXQgcHJvY2Vzc05hbWUgPSB3ZWJ2aWV3Lm1hdGNoKENST1NTV0FMS19QUk9DRVNTX1JFR0VYUCk7XG4gICAgaWYgKHByb2Nlc3NOYW1lID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIHByb2Nlc3MgbmFtZSBmb3Igd2VidmlldyAke3dlYnZpZXd9YCk7XG4gICAgfVxuICAgIHJldHVybiBwcm9jZXNzTmFtZVsxXTtcbiAgfVxuXG4gIC8vIHdlYnZpZXdfZGV2dG9vbHNfcmVtb3RlXzQyOTYgPT4gNDI5NlxuICBsZXQgcGlkID0gd2Vidmlldy5tYXRjaCgvXFxkKyQvKTtcbiAgaWYgKCFwaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIFBJRCBmb3Igd2VidmlldyAke3dlYnZpZXd9YCk7XG4gIH1cbiAgcGlkID0gcGlkWzBdO1xuICBsb2dnZXIuZGVidWcoYCR7d2Vidmlld30gbWFwcGVkIHRvIHBpZCAke3BpZH1gKTtcbiAgbG9nZ2VyLmRlYnVnKCdHZXR0aW5nIHByb2Nlc3MgbmFtZSBmb3Igd2VidmlldycpO1xuICBsZXQgb3V0ID0gYXdhaXQgYWRiLnNoZWxsKCdwcycpO1xuICBsZXQgcGtnID0gJ3Vua25vd24nO1xuICBsZXQgbGluZXMgPSBvdXQuc3BsaXQoL1xccj9cXG4vKTtcblxuICAvKiBPdXRwdXQgb2YgcHMgaXMgbGlrZTpcbiAgIFVTRVIgICAgICAgUElEICBQUElEICBWU0laRSAgUlNTICAgV0NIQU4gICAgUEMgICAgICAgICBOQU1FICBfb3JfXG4gICBVU0VSICAgICAgIFBJRCAgUFBJRCAgVlNaICAgIFJTUyAgIFdDSEFOICAgIEFERFIgICAgIFMgTkFNRVxuICAgdTBfYTEzNiAgIDYyNDggIDE3OSAgIDk0NjAwMCA0ODE0NCBmZmZmZmZmZiA0MDA1OTAzZSBSIGNvbS5leGFtcGxlLnRlc3RcbiAgIHUwX2ExMzYgICA2MjQ5ICAxNzkgICA5NDYwMDAgNDgxNDQgZmZmZmZmZmYgICAgICAgICAgUiBjb20uZXhhbXBsZS50ZXN0XG4gICovXG4gIGNvbnN0IGZ1bGxIZWFkZXIgPSBsaW5lc1swXS50cmltKCk7XG4gIGNvbnN0IGhlYWRlciA9IGZ1bGxIZWFkZXIuc3BsaXQoL1xccysvKTtcbiAgY29uc3QgcGlkQ29sdW1uID0gaGVhZGVyLmluZGV4T2YoJ1BJRCcpO1xuXG4gIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBlbnRyaWVzID0gbGluZS50cmltKCkuc3BsaXQoL1xccysvKTtcbiAgICBjb25zdCBwaWRFbnRyeSA9IGVudHJpZXNbcGlkQ29sdW1uXTtcbiAgICBpZiAocGlkRW50cnkgPT09IHBpZCkge1xuICAgICAgcGtnID0gXy5sYXN0KGVudHJpZXMpO1xuICAgICAgbG9nZ2VyLmRlYnVnKGBQYXJzZWQgcGlkOiAnJHtwaWRFbnRyeX0nIHBrZzogJyR7cGtnfScgZnJvbWApO1xuICAgICAgbG9nZ2VyLmRlYnVnKGAgICAgJHtmdWxsSGVhZGVyfWApO1xuICAgICAgbG9nZ2VyLmRlYnVnKGAgICAgJHtsaW5lfWApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBsb2dnZXIuZGVidWcoYFJldHVybmluZyBwcm9jZXNzIG5hbWU6ICcke3BrZ30nYCk7XG4gIHJldHVybiBwa2c7XG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdldFdlYnZpZXdzT3B0c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGFuZHJvaWREZXZpY2VTb2NrZXQgLSBkZXZpY2Ugc29ja2V0IG5hbWVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZW5zdXJlV2Vidmlld3NIYXZlUGFnZXMgLSB3aGV0aGVyIHRvIGNoZWNrIGZvciB3ZWJ2aWV3XG4gKiBwYWdlIHByZXNlbmNlXG4gKiBAcHJvcGVydHkge251bWJlcn0gd2Vidmlld0RldnRvb2xzUG9ydCAtIHBvcnQgdG8gdXNlIGZvciB3ZWJ2aWV3IHBhZ2VcbiAqIHByZXNlbmNlIGNoZWNrIChpZiBub3QgdGhlIGRlZmF1bHQgb2YgOTIyMikuXG4gKi9cbi8qKlxuICogR2V0IGEgbGlzdCBvZiBhdmFpbGFibGUgd2Vidmlld3MgYnkgaW50cm9zcGVjdGluZyBwcm9jZXNzZXMgd2l0aCBhZGIsIHdoZXJlXG4gKiB3ZWJ2aWV3cyBhcmUgbGlzdGVkLiBJdCdzIHBvc3NpYmxlIHRvIHBhc3MgaW4gYSAnZGV2aWNlU29ja2V0JyBhcmcsIHdoaWNoXG4gKiBsaW1pdHMgdGhlIHdlYnZpZXcgcG9zc2liaWxpdGllcyB0byB0aGUgb25lIHJ1bm5pbmcgb24gdGhlIENocm9taXVtIGRldnRvb2xzXG4gKiBzb2NrZXQgd2UncmUgaW50ZXJlc3RlZCBpbiAoc2VlIG5vdGUgb24gd2Vidmlld3NGcm9tUHJvY3MpLiBXZSBjYW4gYWxzb1xuICogZGlyZWN0IHRoaXMgbWV0aG9kIHRvIHZlcmlmeSB3aGV0aGVyIGEgcGFydGljdWxhciB3ZWJ2aWV3IHByb2Nlc3MgYWN0dWFsbHlcbiAqIGhhcyBhbnkgcGFnZXMgKGlmIGEgcHJvY2VzcyBleGlzdHMgYnV0IG5vIHBhZ2VzIGFyZSBmb3VuZCwgQ2hyb21lZHJpdmVyIHdpbGxcbiAqIG5vdCBhY3R1YWxseSBiZSBhYmxlIHRvIGNvbm5lY3QgdG8gaXQsIHNvIHRoaXMgc2VydmVzIGFzIGEgZ3VhcmQgZm9yIHRoYXRcbiAqIHN0cmFuZ2UgZmFpbHVyZSBtb2RlKS4gVGhlIHN0cmF0ZWd5IGZvciBjaGVja2luZyB3aGV0aGVyIGFueSBwYWdlcyBhcmVcbiAqIGFjdGl2ZSBpbnZvbHZlcyBzZW5kaW5nIGEgcmVxdWVzdCB0byB0aGUgcmVtb3RlIGRlYnVnIHNlcnZlciBvbiB0aGUgZGV2aWNlLFxuICogaGVuY2UgaXQgaXMgYWxzbyBwb3NzaWJsZSB0byBzcGVjaWZ5IHRoZSBwb3J0IG9uIHRoZSBob3N0IG1hY2hpbmUgd2hpY2hcbiAqIHNob3VsZCBiZSB1c2VkIGZvciB0aGlzIGNvbW11bmljYXRpb24uXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGFkYiAtIGFuIEFEQiBpbnN0YW5jZVxuICogQHBhcmFtIHtHZXRXZWJ2aWV3T3B0c30gb3B0c1xuICpcbiAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fSAtIGEgbGlzdCBvZiB3ZWJ2aWV3IG5hbWVzXG4gKi9cbmhlbHBlcnMuZ2V0V2Vidmlld3MgPSBhc3luYyBmdW5jdGlvbiBnZXRXZWJ2aWV3cyAoYWRiLCB7XG4gIGFuZHJvaWREZXZpY2VTb2NrZXQgPSBudWxsLFxuICBlbnN1cmVXZWJ2aWV3c0hhdmVQYWdlcyA9IG51bGwsXG4gIHdlYnZpZXdEZXZ0b29sc1BvcnQgPSBudWxsXG59ID0ge30pIHtcblxuICBsb2dnZXIuZGVidWcoJ0dldHRpbmcgYSBsaXN0IG9mIGF2YWlsYWJsZSB3ZWJ2aWV3cycpO1xuICBsZXQgd2Vidmlld1Byb2NzID0gYXdhaXQgd2Vidmlld3NGcm9tUHJvY3MoYWRiLCBhbmRyb2lkRGV2aWNlU29ja2V0KTtcblxuICBpZiAoZW5zdXJlV2Vidmlld3NIYXZlUGFnZXMpIHtcbiAgICBsb2dnZXIuaW5mbygnUmV0cmlldmVkIHBvdGVudGlhbCB3ZWJ2aWV3czsgd2lsbCBmaWx0ZXIgb3V0IG9uZXMgd2l0aCBubyBhY3RpdmUgcGFnZXMnKTtcbiAgICB3ZWJ2aWV3UHJvY3MgPSBhd2FpdCBhc3luY2ZpbHRlcih3ZWJ2aWV3UHJvY3MsXG4gICAgICBhc3luYyAod3ApID0+IGF3YWl0IHdlYnZpZXdIYXNQYWdlcyhhZGIsIHdwLCB3ZWJ2aWV3RGV2dG9vbHNQb3J0KSxcbiAgICAgIGZhbHNlIC8qZW5zdXJlIHNlcmlhbCBvcGVyYXRpb24qLyk7XG4gIH0gZWxzZSB7XG4gICAgbG9nZ2VyLmluZm8oJ05vdCBjaGVja2luZyB3aGV0aGVyIHdlYnZpZXdzIGhhdmUgYWN0aXZlIHBhZ2VzOyB1c2UgdGhlICcgK1xuICAgICAgICAgICAgICAgIFwiJ2Vuc3VyZVdlYnZpZXdzSGF2ZVBhZ2VzJyBjYXAgdG8gdHVybiB0aGlzIGNoZWNrIG9uXCIpO1xuICB9XG5cbiAgLy8gd2Vidmlld1Byb2NzIGNvbnRhaW5zIHByb2NzLCB3aGljaCB3ZSBvbmx5IGNhcmUgYWJvdXQgZm9yIGVuc3VyaW5nXG4gIC8vIHByZXNlbmNlIG9mIHBhZ2VzIGFib3ZlLCBzbyB3ZSBjYW4gbm93IGRpc2NhcmQgdGhlbSBhbmQgcmVseSBvbiBqdXN0IHRoZVxuICAvLyB3ZWJ2aWV3IG5hbWVzXG4gIGxldCB3ZWJ2aWV3cyA9IHdlYnZpZXdQcm9jcy5tYXAoKHdwKSA9PiB3cC53ZWJ2aWV3KTtcblxuICBpZiAoYW5kcm9pZERldmljZVNvY2tldCkge1xuICAgIHJldHVybiB3ZWJ2aWV3cztcbiAgfVxuXG4gIHdlYnZpZXdzID0gYXdhaXQgYXN5bmNtYXAod2Vidmlld3MsIGFzeW5jICh3ZWJ2aWV3TmFtZSkgPT4ge1xuICAgIGxldCBwa2cgPSBhd2FpdCBoZWxwZXJzLnByb2NGcm9tV2VidmlldyhhZGIsIHdlYnZpZXdOYW1lKTtcbiAgICByZXR1cm4gV0VCVklFV19CQVNFICsgcGtnO1xuICB9KTtcbiAgbG9nZ2VyLmRlYnVnKGBGb3VuZCB3ZWJ2aWV3czogJHtKU09OLnN0cmluZ2lmeSh3ZWJ2aWV3cyl9YCk7XG4gIHJldHVybiB3ZWJ2aWV3cztcbn07XG5cbmhlbHBlcnMuZGVjb3JhdGVDaHJvbWVPcHRpb25zID0gZnVuY3Rpb24gZGVjb3JhdGVDaHJvbWVPcHRpb25zIChjYXBzLCBvcHRzLCBkZXZpY2VJZCkge1xuICAvLyBhZGQgb3B0aW9ucyBmcm9tIGFwcGl1bSBzZXNzaW9uIGNhcHNcbiAgaWYgKG9wdHMuY2hyb21lT3B0aW9ucykge1xuICAgIGlmIChvcHRzLmNocm9tZU9wdGlvbnMuQXJndW1lbnRzKSB7XG4gICAgICAvLyBtZXJnZSBgQXJndW1lbnRzYCBhbmQgYGFyZ3NgXG4gICAgICBvcHRzLmNocm9tZU9wdGlvbnMuYXJncyA9IFsuLi4ob3B0cy5jaHJvbWVPcHRpb25zLmFyZ3MgfHwgW10pLCAuLi5vcHRzLmNocm9tZU9wdGlvbnMuQXJndW1lbnRzXTtcbiAgICAgIGRlbGV0ZSBvcHRzLmNocm9tZU9wdGlvbnMuQXJndW1lbnRzO1xuICAgIH1cbiAgICBmb3IgKGxldCBbb3B0LCB2YWxdIG9mIF8udG9QYWlycyhvcHRzLmNocm9tZU9wdGlvbnMpKSB7XG4gICAgICBpZiAoXy5pc1VuZGVmaW5lZChjYXBzLmNocm9tZU9wdGlvbnNbb3B0XSkpIHtcbiAgICAgICAgY2Fwcy5jaHJvbWVPcHRpb25zW29wdF0gPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2dnZXIud2FybihgQ2Fubm90IHBhc3Mgb3B0aW9uICR7Y2Fwcy5jaHJvbWVPcHRpb25zW29wdF19IGJlY2F1c2UgYCArXG4gICAgICAgICAgICAgICAgICAgICdBcHBpdW0gbmVlZHMgaXQgdG8gbWFrZSBjaHJvbWVEcml2ZXIgd29yaycpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGFkZCBkZXZpY2UgaWQgZnJvbSBhZGJcbiAgY2Fwcy5jaHJvbWVPcHRpb25zLmFuZHJvaWREZXZpY2VTZXJpYWwgPSBkZXZpY2VJZDtcbiAgcmV0dXJuIGNhcHM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBoZWxwZXJzO1xuZXhwb3J0IHsgaGVscGVycywgTkFUSVZFX1dJTiwgV0VCVklFV19XSU4sIFdFQlZJRVdfQkFTRSwgQ0hST01JVU1fV0lOIH07XG4iXSwiZmlsZSI6ImxpYi93ZWJ2aWV3LWhlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==