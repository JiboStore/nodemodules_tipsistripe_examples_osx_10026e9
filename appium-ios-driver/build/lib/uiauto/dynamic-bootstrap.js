"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareBootstrap = prepareBootstrap;
exports.getEnv = getEnv;

require("source-map-support/register");

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _crypto = _interopRequireDefault(require("crypto"));

var _appiumSupport = require("appium-support");

var _buildScript = _interopRequireDefault(require("./build-script"));

var _logger = _interopRequireDefault(require("./logger"));

var _uiautoClient = require("./uiauto-client");

let BOOTSTRAP_JS_PATH = _path.default.resolve(__dirname, '..', '..', '..', 'uiauto', 'bootstrap.js');

let COMMAND_PROXY_CLIENT_PATH = _path.default.resolve(__dirname, 'bin', 'command-proxy-client.js');

if (!__dirname.match(/build\/lib\/uiauto$/)) {
  BOOTSTRAP_JS_PATH = _path.default.resolve(__dirname, '..', 'uiauto', 'bootstrap.js');
  COMMAND_PROXY_CLIENT_PATH = _path.default.resolve(__dirname, 'bin', 'command-proxy-client.js');
}

function getEnv(opts = {}) {
  return {
    nodePath: process.execPath,
    commandProxyClientPath: COMMAND_PROXY_CLIENT_PATH,
    instrumentsSock: opts.sock || _uiautoClient.DEFAULT_INSTRUMENTS_SOCKET,
    interKeyDelay: opts.interKeyDelay || null,
    justLoopInfinitely: opts.justLoopInfinitely,
    autoAcceptAlerts: opts.autoAcceptAlerts,
    autoDismissAlerts: opts.autoDismissAlerts,
    sendKeyStrategy: opts.sendKeyStrategy,
    initialLocation: opts.initialLocation
  };
}

async function buildCode(opts) {
  if (opts.code) return opts.code;
  let env = getEnv(opts);

  _logger.default.debug(`Dynamic env: ${JSON.stringify(env)}`);

  let bootstrapJs = BOOTSTRAP_JS_PATH;
  let imports = opts.imports && opts.imports.pre ? opts.imports.pre : [];
  let bootstrapCode = await (0, _buildScript.default)(bootstrapJs, imports);
  let lines = [];
  lines.push('// This file is automatically generated. Do not manually modify!');
  lines.push('');
  lines.push(bootstrapCode);
  lines.push('');
  lines.push('bootstrap({');

  for (let [key, value] of _lodash.default.toPairs(env)) {
    if (!_lodash.default.isUndefined(value)) {
      let quote = _lodash.default.isString(value) ? '\"' : '';
      lines.push(`  "${key}": ${quote}${value}${quote},`);
    }
  }

  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  lines.push('});');
  return lines.join('\r\n');
}

function computeHash(code) {
  return _crypto.default.createHash('md5').update(code).digest('hex').substring(0, 16);
}

function getDynamicBootstrapDir(opts = {}) {
  let dynamicBootstrapDir;

  if (process.env.APPIUM_BOOTSTRAP_DIR) {
    dynamicBootstrapDir = process.env.APPIUM_BOOTSTRAP_DIR;
  } else if (process.env.HOME) {
    dynamicBootstrapDir = _path.default.resolve(process.env.HOME, 'Library/Application Support/appium/bootstrap');
  } else {
    dynamicBootstrapDir = _path.default.resolve(opts.tmpDir || '/tmp', 'appium/bootstrap');
  }

  return dynamicBootstrapDir;
}

async function writeDynamicBootstrapIfNecessary(dynamicBootstrapDir, dynamicBootstrapPath, code, hash) {
  await (0, _appiumSupport.mkdirp)(dynamicBootstrapDir);
  let codeIsGood = true;

  try {
    let existingCode = await _appiumSupport.fs.readFile(dynamicBootstrapPath);
    codeIsGood = computeHash(existingCode) === hash;
  } catch (err) {
    codeIsGood = false;
  }

  if (codeIsGood) {
    _logger.default.debug(`Reusing dynamic bootstrap: ${dynamicBootstrapPath}`);
  } else {
    _logger.default.debug(`Creating or overwriting dynamic bootstrap: ${dynamicBootstrapPath}`);

    await _appiumSupport.fs.writeFile(dynamicBootstrapPath, code, {
      flag: 'w+'
    });
  }
}

async function prepareBootstrap(opts = {}) {
  _logger.default.debug('Preparing bootstrap code');

  let dynamicBootstrapDir = getDynamicBootstrapDir(opts);

  _logger.default.debug(`Dynamic bootstrap dir: ${dynamicBootstrapDir}`);

  let code = await buildCode(opts);
  let hash = computeHash(code);

  let dynamicBootstrapPath = _path.default.resolve(dynamicBootstrapDir, `bootstrap-${hash}.js`);

  _logger.default.debug(`Dynamic bootstrap code: ${code.split('\n')[0]}...`);

  _logger.default.debug(`Dynamic bootstrap path: ${dynamicBootstrapPath}`);

  await writeDynamicBootstrapIfNecessary(dynamicBootstrapDir, dynamicBootstrapPath, code, hash);
  return dynamicBootstrapPath;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91aWF1dG8vZHluYW1pYy1ib290c3RyYXAuanMiXSwibmFtZXMiOlsiQk9PVFNUUkFQX0pTX1BBVEgiLCJwYXRoIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsIkNPTU1BTkRfUFJPWFlfQ0xJRU5UX1BBVEgiLCJtYXRjaCIsImdldEVudiIsIm9wdHMiLCJub2RlUGF0aCIsInByb2Nlc3MiLCJleGVjUGF0aCIsImNvbW1hbmRQcm94eUNsaWVudFBhdGgiLCJpbnN0cnVtZW50c1NvY2siLCJzb2NrIiwiREVGQVVMVF9JTlNUUlVNRU5UU19TT0NLRVQiLCJpbnRlcktleURlbGF5IiwianVzdExvb3BJbmZpbml0ZWx5IiwiYXV0b0FjY2VwdEFsZXJ0cyIsImF1dG9EaXNtaXNzQWxlcnRzIiwic2VuZEtleVN0cmF0ZWd5IiwiaW5pdGlhbExvY2F0aW9uIiwiYnVpbGRDb2RlIiwiY29kZSIsImVudiIsImxvZ2dlciIsImRlYnVnIiwiSlNPTiIsInN0cmluZ2lmeSIsImJvb3RzdHJhcEpzIiwiaW1wb3J0cyIsInByZSIsImJvb3RzdHJhcENvZGUiLCJsaW5lcyIsInB1c2giLCJrZXkiLCJ2YWx1ZSIsIl8iLCJ0b1BhaXJzIiwiaXNVbmRlZmluZWQiLCJxdW90ZSIsImlzU3RyaW5nIiwibGVuZ3RoIiwicmVwbGFjZSIsImpvaW4iLCJjb21wdXRlSGFzaCIsImNyeXB0byIsImNyZWF0ZUhhc2giLCJ1cGRhdGUiLCJkaWdlc3QiLCJzdWJzdHJpbmciLCJnZXREeW5hbWljQm9vdHN0cmFwRGlyIiwiZHluYW1pY0Jvb3RzdHJhcERpciIsIkFQUElVTV9CT09UU1RSQVBfRElSIiwiSE9NRSIsInRtcERpciIsIndyaXRlRHluYW1pY0Jvb3RzdHJhcElmTmVjZXNzYXJ5IiwiZHluYW1pY0Jvb3RzdHJhcFBhdGgiLCJoYXNoIiwiY29kZUlzR29vZCIsImV4aXN0aW5nQ29kZSIsImZzIiwicmVhZEZpbGUiLCJlcnIiLCJ3cml0ZUZpbGUiLCJmbGFnIiwicHJlcGFyZUJvb3Rz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S0MsT0FBTCxDQUFhaUQsbUJBQWIsRUFBbUMsYUFBWU0sSUFBSyxLQUFwRCxDQUEzQjs7QUFDQWpDLGtCQUFPQyxLQUFQLENBQWMsMkJBQTBCSCxJQUFJLENBQUM0QyxLQUFMLENBQVcsSUFBWCxFQUFpQixDQUFqQixDQUFvQixLQUE1RDs7QUFDQTFDLGtCQUFPQyxLQUFQLENBQWMsMkJBQTBCK0Isb0JBQXFCLEVBQTdEOztBQUNBLFFBQU1ELGdDQUFnQyxDQUFDSixtQkFBRCxFQUNwQ0ssb0JBRG9DLEVBQ2RsQyxJQURjLEVBQ1JtQyxJQURRLENBQXRDO0FBR0EsU0FBT0Qsb0JBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEdlbmVyYXRlIGEgYm9vdHN0cmFwIGZvciB0aGUgVUlBdXRvIEluc3RydW1lbnRzIHNjcmlwdCBjb250YWluaW5nXG4vLyB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzIHdlIG5lZWQuXG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB7IGZzLCBta2RpcnAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgYnVpbGRTY3JpcHQgZnJvbSAnLi9idWlsZC1zY3JpcHQnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlcic7XG5pbXBvcnQgeyBERUZBVUxUX0lOU1RSVU1FTlRTX1NPQ0tFVCB9IGZyb20gJy4vdWlhdXRvLWNsaWVudCc7XG5cblxubGV0IEJPT1RTVFJBUF9KU19QQVRIID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJy4uJywgJ3VpYXV0bycsICdib290c3RyYXAuanMnKTtcbmxldCBDT01NQU5EX1BST1hZX0NMSUVOVF9QQVRIID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2JpbicsICdjb21tYW5kLXByb3h5LWNsaWVudC5qcycpO1xuaWYgKCFfX2Rpcm5hbWUubWF0Y2goL2J1aWxkXFwvbGliXFwvdWlhdXRvJC8pKSB7XG4gIEJPT1RTVFJBUF9KU19QQVRIID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ3VpYXV0bycsICdib290c3RyYXAuanMnKTtcbiAgQ09NTUFORF9QUk9YWV9DTElFTlRfUEFUSCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdiaW4nLCAnY29tbWFuZC1wcm94eS1jbGllbnQuanMnKTtcbn1cblxuZnVuY3Rpb24gZ2V0RW52IChvcHRzID0ge30pIHtcbiAgLy8gYnVpbGQgYW4gb2JqZWN0IHdpdGggdGhlIHJlcXVpcmVkIHByb3BlcnRpZXMgZm9yIGJvb3RzdHJhcFxuICByZXR1cm4ge1xuICAgIG5vZGVQYXRoOiBwcm9jZXNzLmV4ZWNQYXRoLFxuICAgIGNvbW1hbmRQcm94eUNsaWVudFBhdGg6IENPTU1BTkRfUFJPWFlfQ0xJRU5UX1BBVEgsXG4gICAgaW5zdHJ1bWVudHNTb2NrOiBvcHRzLnNvY2sgfHwgREVGQVVMVF9JTlNUUlVNRU5UU19TT0NLRVQsXG4gICAgaW50ZXJLZXlEZWxheTogb3B0cy5pbnRlcktleURlbGF5IHx8IG51bGwsXG4gICAganVzdExvb3BJbmZpbml0ZWx5OiBvcHRzLmp1c3RMb29wSW5maW5pdGVseSxcbiAgICBhdXRvQWNjZXB0QWxlcnRzOiBvcHRzLmF1dG9BY2NlcHRBbGVydHMsXG4gICAgYXV0b0Rpc21pc3NBbGVydHM6IG9wdHMuYXV0b0Rpc21pc3NBbGVydHMsXG4gICAgc2VuZEtleVN0cmF0ZWd5OiBvcHRzLnNlbmRLZXlTdHJhdGVneSxcbiAgICBpbml0aWFsTG9jYXRpb246IG9wdHMuaW5pdGlhbExvY2F0aW9uLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBidWlsZENvZGUgKG9wdHMpIHtcbiAgLy8gb25seSBidWlsZCB0aGUgY29kZSBpZiBpdCBoYXNuJ3QgYmVlbiBkb25lIGJlZm9yZVxuICBpZiAob3B0cy5jb2RlKSByZXR1cm4gb3B0cy5jb2RlO1xuXG4gIGxldCBlbnYgPSBnZXRFbnYob3B0cyk7XG4gIGxvZ2dlci5kZWJ1ZyhgRHluYW1pYyBlbnY6ICR7SlNPTi5zdHJpbmdpZnkoZW52KX1gKTtcblxuICBsZXQgYm9vdHN0cmFwSnMgPSBCT09UU1RSQVBfSlNfUEFUSDtcbiAgLy8gaWYgc3BlY2lhbCBpbXBvcnRzIHdlcmUgc2VudCBpbiwgbWFrZSB1c2Ugb2YgdGhlbVxuICBsZXQgaW1wb3J0cyA9IChvcHRzLmltcG9ydHMgJiYgb3B0cy5pbXBvcnRzLnByZSkgPyBvcHRzLmltcG9ydHMucHJlIDogW107XG4gIGxldCBib290c3RyYXBDb2RlID0gYXdhaXQgYnVpbGRTY3JpcHQoYm9vdHN0cmFwSnMsIGltcG9ydHMpO1xuXG4gIC8vIGdlbmVyYXRlIHRoZSBkeW5hbWljIHBhcnQgb2YgdGhlIGJvb3RzdHJhcCBjb2RlXG4gIC8vIHdpdGggdGhlIGVudmlyb25tZW50IHNldCB1cCBwcm9wZXJseVxuICBsZXQgbGluZXMgPSBbXTtcbiAgbGluZXMucHVzaCgnLy8gVGhpcyBmaWxlIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBEbyBub3QgbWFudWFsbHkgbW9kaWZ5IScpO1xuICBsaW5lcy5wdXNoKCcnKTtcbiAgbGluZXMucHVzaChib290c3RyYXBDb2RlKTtcbiAgbGluZXMucHVzaCgnJyk7XG4gIGxpbmVzLnB1c2goJ2Jvb3RzdHJhcCh7Jyk7XG4gIC8vIGFkZCBlYWNoIGRlZmluZWQgdmFyaWFibGUgdG8gdGhlIGVudmlyb25tZW50XG4gIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBfLnRvUGFpcnMoZW52KSkge1xuICAgIGlmICghXy5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgIGxldCBxdW90ZSA9IF8uaXNTdHJpbmcodmFsdWUpID8gJ1xcXCInIDogJyc7XG4gICAgICBsaW5lcy5wdXNoKGAgIFwiJHtrZXl9XCI6ICR7cXVvdGV9JHt2YWx1ZX0ke3F1b3RlfSxgKTtcbiAgICB9XG4gIH1cbiAgLy8gZ2V0IHJpZCBvZiB0aGUgbGFzdCBjb21tYSB0aGF0IHdhcyBhZGRlZFxuICBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXSA9IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLnJlcGxhY2UoLywkLywgJycpO1xuICBsaW5lcy5wdXNoKCd9KTsnKTtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcclxcbicpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCAoY29kZSkge1xuICByZXR1cm4gY3J5cHRvXG4gICAgLmNyZWF0ZUhhc2goJ21kNScpXG4gICAgLnVwZGF0ZShjb2RlKVxuICAgIC5kaWdlc3QoJ2hleCcpXG4gICAgLnN1YnN0cmluZygwLCAxNik7XG59XG5cbmZ1bmN0aW9uIGdldER5bmFtaWNCb290c3RyYXBEaXIgKG9wdHMgPSB7fSkge1xuICAvLyBmaWd1cmluZyBvdXQgd2hlcmUgdG8gc3RvcmUgZHluYW1pYyBib290c3RyYXBcbiAgbGV0IGR5bmFtaWNCb290c3RyYXBEaXI7XG4gIGlmIChwcm9jZXNzLmVudi5BUFBJVU1fQk9PVFNUUkFQX0RJUikge1xuICAgIC8vIG1haW5seSBmb3IgdGVzdFxuICAgIGR5bmFtaWNCb290c3RyYXBEaXIgPSBwcm9jZXNzLmVudi5BUFBJVU1fQk9PVFNUUkFQX0RJUjtcbiAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5IT01FKSB7XG4gICAgZHluYW1pY0Jvb3RzdHJhcERpciA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmVudi5IT01FLFxuICAgICAgJ0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9hcHBpdW0vYm9vdHN0cmFwJyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm8gdXNlciBkaXIsIHVzaW5nIHRtcFxuICAgIGR5bmFtaWNCb290c3RyYXBEaXIgPSBwYXRoLnJlc29sdmUob3B0cy50bXBEaXIgfHwgJy90bXAnLCAnYXBwaXVtL2Jvb3RzdHJhcCcpO1xuICB9XG4gIHJldHVybiBkeW5hbWljQm9vdHN0cmFwRGlyO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUR5bmFtaWNCb290c3RyYXBJZk5lY2Vzc2FyeSAoZHluYW1pY0Jvb3RzdHJhcERpciwgZHluYW1pY0Jvb3RzdHJhcFBhdGgsIGNvZGUsIGhhc2gpIHtcbiAgYXdhaXQgbWtkaXJwKGR5bmFtaWNCb290c3RyYXBEaXIpO1xuXG4gIC8vIGNoZWNrIGlmIHRoZXJlIGlzIGV4aXN0aW5nIGNvZGUgYW5kIGl0IGhhcyB0aGUgc2FtZSBoYXNoXG4gIGxldCBjb2RlSXNHb29kID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBsZXQgZXhpc3RpbmdDb2RlID0gYXdhaXQgZnMucmVhZEZpbGUoZHluYW1pY0Jvb3RzdHJhcFBhdGgpO1xuICAgIGNvZGVJc0dvb2QgPSBjb21wdXRlSGFzaChleGlzdGluZ0NvZGUpID09PSBoYXNoO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb2RlSXNHb29kID0gZmFsc2U7XG4gIH1cblxuICAvLyB3cml0ZSBmaWxlIGlmIHRoZSBvbGQgY29kZSBpcyBub3QgdGhlIHNhbWVcbiAgaWYgKGNvZGVJc0dvb2QpIHtcbiAgICBsb2dnZXIuZGVidWcoYFJldXNpbmcgZHluYW1pYyBib290c3RyYXA6ICR7ZHluYW1pY0Jvb3RzdHJhcFBhdGh9YCk7XG4gIH0gZWxzZSB7XG4gICAgbG9nZ2VyLmRlYnVnKGBDcmVhdGluZyBvciBvdmVyd3JpdGluZyBkeW5hbWljIGJvb3RzdHJhcDogJHtkeW5hbWljQm9vdHN0cmFwUGF0aH1gKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUoZHluYW1pY0Jvb3RzdHJhcFBhdGgsIGNvZGUsIHtmbGFnOiAndysnfSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUJvb3RzdHJhcCAob3B0cyA9IHt9KSB7XG4gIGxvZ2dlci5kZWJ1ZygnUHJlcGFyaW5nIGJvb3RzdHJhcCBjb2RlJyk7XG5cbiAgbGV0IGR5bmFtaWNCb290c3RyYXBEaXIgPSBnZXREeW5hbWljQm9vdHN0cmFwRGlyKG9wdHMpO1xuICBsb2dnZXIuZGVidWcoYER5bmFtaWMgYm9vdHN0cmFwIGRpcjogJHtkeW5hbWljQm9vdHN0cmFwRGlyfWApO1xuXG4gIC8vIGJ1aWxkaW5nIGNvZGUgYW5kIGhhc2hcbiAgbGV0IGNvZGUgPSBhd2FpdCBidWlsZENvZGUob3B0cyk7XG4gIGxldCBoYXNoID0gY29tcHV0ZUhhc2goY29kZSk7XG4gIGxldCBkeW5hbWljQm9vdHN0cmFwUGF0aCA9IHBhdGgucmVzb2x2ZShkeW5hbWljQm9vdHN0cmFwRGlyLCBgYm9vdHN0cmFwLSR7aGFzaH0uanNgKTtcbiAgbG9nZ2VyLmRlYnVnKGBEeW5hbWljIGJvb3RzdHJhcCBjb2RlOiAke2NvZGUuc3BsaXQoJ1xcbicpWzBdfS4uLmApO1xuICBsb2dnZXIuZGVidWcoYER5bmFtaWMgYm9vdHN0cmFwIHBhdGg6ICR7ZHluYW1pY0Jvb3RzdHJhcFBhdGh9YCk7XG4gIGF3YWl0IHdyaXRlRHluYW1pY0Jvb3RzdHJhcElmTmVjZXNzYXJ5KGR5bmFtaWNCb290c3RyYXBEaXIsXG4gICAgZHluYW1pY0Jvb3RzdHJhcFBhdGgsIGNvZGUsIGhhc2gpO1xuXG4gIHJldHVybiBkeW5hbWljQm9vdHN0cmFwUGF0aDtcbn1cblxuZXhwb3J0IHsgcHJlcGFyZUJvb3RzdHJhcCwgZ2V0RW52IH07XG4iXSwiZmlsZSI6ImxpYi91aWF1dG8vZHluYW1pYy1ib290c3RyYXAuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
