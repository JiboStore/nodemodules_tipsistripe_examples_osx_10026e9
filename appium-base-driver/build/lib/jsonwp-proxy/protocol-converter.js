"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.COMMAND_URLS_CONFLICTS = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _driver = _interopRequireDefault(require("../basedriver/driver"));

var _appiumSupport = require("appium-support");

var _helpers = require("../basedriver/helpers");

var _protocol = require("../protocol/protocol");

const log = _appiumSupport.logger.getLogger('Protocol Converter');

const COMMAND_URLS_CONFLICTS = [{
  commandNames: ['execute', 'executeAsync'],
  jsonwpConverter: url => url.replace(/\/execute.*/, url.includes('async') ? '/execute_async' : '/execute'),
  w3cConverter: url => url.replace(/\/execute.*/, url.includes('async') ? '/execute/async' : '/execute/sync')
}, {
  commandNames: ['getElementScreenshot'],
  jsonwpConverter: url => url.replace(/\/element\/([^/]+)\/screenshot$/, '/screenshot/$1'),
  w3cConverter: url => url.replace(/\/screenshot\/([^/]+)/, '/element/$1/screenshot')
}, {
  commandNames: ['getWindowHandles', 'getWindowHandle'],
  jsonwpConverter: url => {
    return /\/window$/.test(url) ? url.replace(/\/window$/, '/window_handle') : url.replace(/\/window\/handle(s?)$/, '/window_handle$1');
  },
  w3cConverter: url => {
    return /\/window_handle$/.test(url) ? url.replace(/\/window_handle$/, '/window') : url.replace(/\/window_handles$/, '/window/handles');
  }
}, {
  commandNames: ['getProperty'],
  jsonwpConverter: w3cUrl => {
    const w3cPropertyRegex = /\/element\/([^/]+)\/property\/([^/]+)/;
    const jsonwpUrl = w3cUrl.replace(w3cPropertyRegex, '/element/$1/attribute/$2');
    log.info(`Converting W3C '${w3cUrl}' to '${jsonwpUrl}'`);
    return jsonwpUrl;
  },
  w3cConverter: jsonwpUrl => jsonwpUrl
}];
exports.COMMAND_URLS_CONFLICTS = COMMAND_URLS_CONFLICTS;
const {
  MJSONWP,
  W3C
} = _driver.default.DRIVER_PROTOCOL;

class ProtocolConverter {
  constructor(proxyFunc) {
    this.proxyFunc = proxyFunc;
    this._downstreamProtocol = null;
  }

  set downstreamProtocol(value) {
    this._downstreamProtocol = value;
  }

  get downstreamProtocol() {
    return this._downstreamProtocol;
  }

  getTimeoutRequestObjects(body) {
    if (this.downstreamProtocol === W3C && _lodash.default.has(body, 'ms') && _lodash.default.has(body, 'type')) {
      const typeToW3C = x => x === 'page load' ? 'pageLoad' : x;

      return [{
        [typeToW3C(body.type)]: body.ms
      }];
    }

    if (this.downstreamProtocol === MJSONWP && (!_lodash.default.has(body, 'ms') || !_lodash.default.has(body, 'type'))) {
      const typeToJSONWP = x => x === 'pageLoad' ? 'page load' : x;

      return _lodash.default.toPairs(body).filter(pair => /^\d+(?:[.,]\d*?)?$/.test(`${pair[1]}`)).map(pair => {
        return {
          type: typeToJSONWP(pair[0]),
          ms: pair[1]
        };
      });
    }

    return [body];
  }

  async proxySetTimeouts(url, method, body) {
    let response, resBody;
    const timeoutRequestObjects = this.getTimeoutRequestObjects(body);
    log.debug(`Will send the following request bodies to /timeouts: ${JSON.stringify(timeoutRequestObjects)}`);

    for (const timeoutObj of timeoutRequestObjects) {
      [response, resBody] = await this.proxyFunc(url, method, timeoutObj);

      if (this.downstreamProtocol !== MJSONWP) {
        return [response, resBody];
      }

      if (response.statusCode >= 400) {
        return [response, resBody];
      }
    }

    return [response, resBody];
  }

  async proxySetWindow(url, method, body) {
    const bodyObj = _appiumSupport.util.safeJsonParse(body);

    if (_lodash.default.isPlainObject(bodyObj)) {
      if (this.downstreamProtocol === W3C && _lodash.default.has(bodyObj, 'name') && !_lodash.default.has(bodyObj, 'handle')) {
        log.debug(`Copied 'name' value '${bodyObj.name}' to 'handle' as per W3C spec`);
        return await this.proxyFunc(url, method, { ...bodyObj,
          handle: bodyObj.name
        });
      }

      if (this.downstreamProtocol === MJSONWP && _lodash.default.has(bodyObj, 'handle') && !_lodash.default.has(bodyObj, 'name')) {
        log.debug(`Copied 'handle' value '${bodyObj.handle}' to 'name' as per JSONWP spec`);
        return await this.proxyFunc(url, method, { ...bodyObj,
          name: bodyObj.handle
        });
      }
    }

    return await this.proxyFunc(url, method, body);
  }

  async proxySetValue(url, method, body) {
    const bodyObj = _appiumSupport.util.safeJsonParse(body);

    if (_lodash.default.isPlainObject(bodyObj) && (_appiumSupport.util.hasValue(bodyObj.text) || _appiumSupport.util.hasValue(bodyObj.value))) {
      let {
        text,
        value
      } = bodyObj;

      if (_appiumSupport.util.hasValue(text) && !_appiumSupport.util.hasValue(value)) {
        value = _lodash.default.isString(text) ? [...text] : _lodash.default.isArray(text) ? text : [];
        log.debug(`Added 'value' property ${JSON.stringify(value)} to 'setValue' request body`);
      } else if (!_appiumSupport.util.hasValue(text) && _appiumSupport.util.hasValue(value)) {
        text = _lodash.default.isArray(value) ? value.join('') : _lodash.default.isString(value) ? value : '';
        log.debug(`Added 'text' property ${JSON.stringify(text)} to 'setValue' request body`);
      }

      return await this.proxyFunc(url, method, Object.assign({}, bodyObj, {
        text,
        value
      }));
    }

    return await this.proxyFunc(url, method, body);
  }

  async proxySetFrame(url, method, body) {
    const bodyObj = _appiumSupport.util.safeJsonParse(body);

    return _lodash.default.has(bodyObj, 'id') && _lodash.default.isPlainObject(bodyObj.id) ? await this.proxyFunc(url, method, { ...bodyObj,
      id: (0, _helpers.duplicateKeys)(bodyObj.id, _protocol.MJSONWP_ELEMENT_KEY, _protocol.W3C_ELEMENT_KEY)
    }) : await this.proxyFunc(url, method, body);
  }

  async proxyPerformActions(url, method, body) {
    const bodyObj = _appiumSupport.util.safeJsonParse(body);

    return _lodash.default.isPlainObject(bodyObj) ? await this.proxyFunc(url, method, (0, _helpers.duplicateKeys)(bodyObj, _protocol.MJSONWP_ELEMENT_KEY, _protocol.W3C_ELEMENT_KEY)) : await this.proxyFunc(url, method, body);
  }

  async convertAndProxy(commandName, url, method, body) {
    if (!this.downstreamProtocol) {
      return await this.proxyFunc(url, method, body);
    }

    switch (commandName) {
      case 'timeouts':
        return await this.proxySetTimeouts(url, method, body);

      case 'setWindow':
        return await this.proxySetWindow(url, method, body);

      case 'setValue':
        return await this.proxySetValue(url, method, body);

      case 'performActions':
        return await this.proxyPerformActions(url, method, body);

      case 'setFrame':
        return await this.proxySetFrame(url, method, body);

      default:
        break;
    }

    for (const {
      commandNames,
      jsonwpConverter,
      w3cConverter
    } of COMMAND_URLS_CONFLICTS) {
      if (!commandNames.includes(commandName)) {
        continue;
      }

      const rewrittenUrl = this.downstreamProtocol === MJSONWP ? jsonwpConverter(url) : w3cConverter(url);

      if (rewrittenUrl === url) {
        log.debug(`Did not know how to rewrite the original URL '${url}' ` + `for ${this.downstreamProtocol} protocol`);
        break;
      }

      log.info(`Rewrote the original URL '${url}' to '${rewrittenUrl}' ` + `for ${this.downstreamProtocol} protocol`);
      return await this.proxyFunc(rewrittenUrl, method, body);
    }

    return await this.proxyFunc(url, method, body);
  }

}

var _default = ProtocolConverter;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9qc29ud3AtcHJveHkvcHJvdG9jb2wtY29udmVydGVyLmpzIl0sIm5hbWVzIjpbImxvZyIsImxvZ2dlciIsImdldExvZ2dlciIsIkNPTU1BTkRfVVJMU19DT05GTElDVFMiLCJjb21tYW5kTmFtZXMiLCJqc29ud3BDb252ZXJ0ZXIiLCJ1cmwiLCJyZXBsYWNlIiwiaW5jbHVkZXMiLCJ3M2NDb252ZXJ0ZXIiLCJ0ZXN0IiwidzNjVXJsIiwidzNjUHJvcGVydHlSZWdleCIsImpzb253cFVybCIsImluZm8iLCJNSlNPTldQIiwiVzNDIiwiQmFzZURyaXZlciIsIkRSSVZFUl9QUk9UT0NPTCIsIlByb3RvY29sQ29udmVydGVyIiwiY29uc3RydWN0b3IiLCJwcm94eUZ1bmMiLCJfZG93bnN0cmVhbVByb3RvY29sIiwiZG93bnN0cmVhbVByb3RvY29sIiwidmFsdWUiLCJnZXRUaW1lb3V0UmVxdWVzdE9iamVjdHMiLCJib2R5IiwiXyIsImhhcyIsInR5cGVUb1czQyIsIngiLCJ0eXBlIiwibXMiLCJ0eXBlVG9KU09OV1AiLCJ0b1BhaXJzIiwiZmlsdGVyIiwicGFpciIsIm1hcCIsInByb3h5U2V0VGltZW91dHMiLCJtZXRob2QiLCJyZXNwb25zZSIsInJlc0JvZHkiLCJ0aW1lb3V0UmVxdWVzdE9iamVjdHMiLCJkZWJ1ZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0aW1lb3V0T2JqIiwic3RhdHVzQ29kZSIsInByb3h5U2V0V2luZG93IiwiYm9keU9iaiIsInV0aWwiLCJzYWZlSnNvblBhcnNlIiwiaXNQbGFpbk9iamVjdCIsIm5hbWUiLCJoYW5kbGUiLCJwcm94eVNldFZhbHVlIiwiaGFzVmFsdWUiLCJ0ZXh0IiwiaXNTdHJpbmciLCJpc0FycmF5Iiwiam9pbiIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5U2V0RnJhbWUiLCJpZCIsIk1KU09OV1BfRUxFTUVOVF9LRVkiLCJXM0NfRUxFTUVOVF9LRVkiLCJwcm94eVBlcmZvcm1BY3Rpb25zIiwiY29udmVydEFu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RDs7QUFDRHZCLE1BQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLDZCQUE0QlIsR0FBSSxTQUFRZ0UsWUFBYSxJQUF0RCxHQUNOLE9BQU0sS0FBSy9DLGtCQUFtQixXQURqQztBQUVBLGFBQU8sTUFBTSxLQUFLRixTQUFMLENBQWVpRCxZQUFmLEVBQTZCL0IsTUFBN0IsRUFBcUNiLElBQXJDLENBQWI7QUFDRDs7QUFHRCxXQUFPLE1BQU0sS0FBS0wsU0FBTCxDQUFlZixHQUFmLEVBQW9CaUMsTUFBcEIsRUFBNEJiLElBQTVCLENBQWI7QUFDRDs7QUFoTXFCOztlQW1NVFAsaUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IEJhc2VEcml2ZXIgZnJvbSAnLi4vYmFzZWRyaXZlci9kcml2ZXInO1xuaW1wb3J0IHsgbG9nZ2VyLCB1dGlsIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IHsgZHVwbGljYXRlS2V5cyB9IGZyb20gJy4uL2Jhc2Vkcml2ZXIvaGVscGVycyc7XG5pbXBvcnQgeyBNSlNPTldQX0VMRU1FTlRfS0VZLCBXM0NfRUxFTUVOVF9LRVkgfSBmcm9tICcuLi9wcm90b2NvbC9wcm90b2NvbCc7XG5cbmNvbnN0IGxvZyA9IGxvZ2dlci5nZXRMb2dnZXIoJ1Byb3RvY29sIENvbnZlcnRlcicpO1xuXG5cbmV4cG9ydCBjb25zdCBDT01NQU5EX1VSTFNfQ09ORkxJQ1RTID0gW1xuICB7XG4gICAgY29tbWFuZE5hbWVzOiBbJ2V4ZWN1dGUnLCAnZXhlY3V0ZUFzeW5jJ10sXG4gICAganNvbndwQ29udmVydGVyOiAodXJsKSA9PiB1cmwucmVwbGFjZSgvXFwvZXhlY3V0ZS4qLyxcbiAgICAgIHVybC5pbmNsdWRlcygnYXN5bmMnKSA/ICcvZXhlY3V0ZV9hc3luYycgOiAnL2V4ZWN1dGUnKSxcbiAgICB3M2NDb252ZXJ0ZXI6ICh1cmwpID0+IHVybC5yZXBsYWNlKC9cXC9leGVjdXRlLiovLFxuICAgICAgdXJsLmluY2x1ZGVzKCdhc3luYycpID8gJy9leGVjdXRlL2FzeW5jJyA6ICcvZXhlY3V0ZS9zeW5jJyksXG4gIH0sXG4gIHtcbiAgICBjb21tYW5kTmFtZXM6IFsnZ2V0RWxlbWVudFNjcmVlbnNob3QnXSxcbiAgICBqc29ud3BDb252ZXJ0ZXI6ICh1cmwpID0+IHVybC5yZXBsYWNlKC9cXC9lbGVtZW50XFwvKFteL10rKVxcL3NjcmVlbnNob3QkLyxcbiAgICAgICcvc2NyZWVuc2hvdC8kMScpLFxuICAgIHczY0NvbnZlcnRlcjogKHVybCkgPT4gdXJsLnJlcGxhY2UoL1xcL3NjcmVlbnNob3RcXC8oW14vXSspLyxcbiAgICAgICcvZWxlbWVudC8kMS9zY3JlZW5zaG90JyksXG4gIH0sXG4gIHtcbiAgICBjb21tYW5kTmFtZXM6IFsnZ2V0V2luZG93SGFuZGxlcycsICdnZXRXaW5kb3dIYW5kbGUnXSxcbiAgICBqc29ud3BDb252ZXJ0ZXI6ICh1cmwpID0+IHtcbiAgICAgIHJldHVybiAvXFwvd2luZG93JC8udGVzdCh1cmwpXG4gICAgICAgID8gdXJsLnJlcGxhY2UoL1xcL3dpbmRvdyQvLCAnL3dpbmRvd19oYW5kbGUnKVxuICAgICAgICA6IHVybC5yZXBsYWNlKC9cXC93aW5kb3dcXC9oYW5kbGUocz8pJC8sICcvd2luZG93X2hhbmRsZSQxJyk7XG4gICAgfSxcbiAgICB3M2NDb252ZXJ0ZXI6ICh1cmwpID0+IHtcbiAgICAgIHJldHVybiAvXFwvd2luZG93X2hhbmRsZSQvLnRlc3QodXJsKVxuICAgICAgICA/IHVybC5yZXBsYWNlKC9cXC93aW5kb3dfaGFuZGxlJC8sICcvd2luZG93JylcbiAgICAgICAgOiB1cmwucmVwbGFjZSgvXFwvd2luZG93X2hhbmRsZXMkLywgJy93aW5kb3cvaGFuZGxlcycpO1xuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBjb21tYW5kTmFtZXM6IFsnZ2V0UHJvcGVydHknXSxcbiAgICBqc29ud3BDb252ZXJ0ZXI6ICh3M2NVcmwpID0+IHtcbiAgICAgIGNvbnN0IHczY1Byb3BlcnR5UmVnZXggPSAvXFwvZWxlbWVudFxcLyhbXi9dKylcXC9wcm9wZXJ0eVxcLyhbXi9dKykvO1xuICAgICAgY29uc3QganNvbndwVXJsID0gdzNjVXJsLnJlcGxhY2UodzNjUHJvcGVydHlSZWdleCwgJy9lbGVtZW50LyQxL2F0dHJpYnV0ZS8kMicpO1xuICAgICAgbG9nLmluZm8oYENvbnZlcnRpbmcgVzNDICcke3czY1VybH0nIHRvICcke2pzb253cFVybH0nYCk7XG4gICAgICByZXR1cm4ganNvbndwVXJsO1xuICAgIH0sXG4gICAgdzNjQ29udmVydGVyOiAoanNvbndwVXJsKSA9PiBqc29ud3BVcmwgLy8gRG9uJ3QgY29udmVydCBKU09OV1AgVVJMIHRvIFczQy4gVzNDIGFjY2VwdHMgL2F0dHJpYnV0ZSBhbmQgL3Byb3BlcnR5XG4gIH1cbl07XG5cbmNvbnN0IHtNSlNPTldQLCBXM0N9ID0gQmFzZURyaXZlci5EUklWRVJfUFJPVE9DT0w7XG5cblxuY2xhc3MgUHJvdG9jb2xDb252ZXJ0ZXIge1xuICBjb25zdHJ1Y3RvciAocHJveHlGdW5jKSB7XG4gICAgdGhpcy5wcm94eUZ1bmMgPSBwcm94eUZ1bmM7XG4gICAgdGhpcy5fZG93bnN0cmVhbVByb3RvY29sID0gbnVsbDtcbiAgfVxuXG4gIHNldCBkb3duc3RyZWFtUHJvdG9jb2wgKHZhbHVlKSB7XG4gICAgdGhpcy5fZG93bnN0cmVhbVByb3RvY29sID0gdmFsdWU7XG4gIH1cblxuICBnZXQgZG93bnN0cmVhbVByb3RvY29sICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZG93bnN0cmVhbVByb3RvY29sO1xuICB9XG5cbiAgLyoqXG4gICAqIFczQyAvdGltZW91dHMgY2FuIHRha2UgYXMgbWFueSBhcyAzIHRpbWVvdXQgdHlwZXMgYXQgb25jZSwgTUpTT05XUCAvdGltZW91dHMgb25seSB0YWtlcyBvbmVcbiAgICogYXQgYSB0aW1lLiBTbyBpZiB3ZSdyZSB1c2luZyBXM0MgYW5kIHByb3h5aW5nIHRvIE1KU09OV1AgYW5kIHRoZXJlJ3MgbW9yZSB0aGFuIG9uZSB0aW1lb3V0IHR5cGVcbiAgICogcHJvdmlkZWQgaW4gdGhlIHJlcXVlc3QsIHdlIG5lZWQgdG8gZG8gMyBwcm94aWVzIGFuZCBjb21iaW5lIHRoZSByZXN1bHRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGJvZHkgUmVxdWVzdCBib2R5XG4gICAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBvZiBXM0MgKyBNSlNPTldQIGNvbXBhdGlibGUgdGltZW91dCBvYmplY3RzXG4gICAqL1xuICBnZXRUaW1lb3V0UmVxdWVzdE9iamVjdHMgKGJvZHkpIHtcbiAgICBpZiAodGhpcy5kb3duc3RyZWFtUHJvdG9jb2wgPT09IFczQyAmJiBfLmhhcyhib2R5LCAnbXMnKSAmJiBfLmhhcyhib2R5LCAndHlwZScpKSB7XG4gICAgICBjb25zdCB0eXBlVG9XM0MgPSAoeCkgPT4geCA9PT0gJ3BhZ2UgbG9hZCcgPyAncGFnZUxvYWQnIDogeDtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICBbdHlwZVRvVzNDKGJvZHkudHlwZSldOiBib2R5Lm1zLFxuICAgICAgfV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZG93bnN0cmVhbVByb3RvY29sID09PSBNSlNPTldQICYmICghXy5oYXMoYm9keSwgJ21zJykgfHwgIV8uaGFzKGJvZHksICd0eXBlJykpKSB7XG4gICAgICBjb25zdCB0eXBlVG9KU09OV1AgPSAoeCkgPT4geCA9PT0gJ3BhZ2VMb2FkJyA/ICdwYWdlIGxvYWQnIDogeDtcbiAgICAgIHJldHVybiBfLnRvUGFpcnMoYm9keSlcbiAgICAgICAgLy8gT25seSB0cmFuc2Zvcm0gdGhlIGVudHJ5IGlmIG1zIHZhbHVlIGlzIGEgdmFsaWQgcG9zaXRpdmUgZmxvYXQgbnVtYmVyXG4gICAgICAgIC5maWx0ZXIoKHBhaXIpID0+IC9eXFxkKyg/OlsuLF1cXGQqPyk/JC8udGVzdChgJHtwYWlyWzFdfWApKVxuICAgICAgICAubWFwKChwYWlyKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGVUb0pTT05XUChwYWlyWzBdKSxcbiAgICAgICAgICAgIG1zOiBwYWlyWzFdLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBbYm9keV07XG4gIH1cblxuICAvKipcbiAgICogUHJveHkgYW4gYXJyYXkgb2YgdGltZW91dCBvYmplY3RzIGFuZCBtZXJnZSB0aGUgcmVzdWx0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgRW5kcG9pbnQgdXJsXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2QgRW5kcG9pbnQgbWV0aG9kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBib2R5IFJlcXVlc3QgYm9keVxuICAgKi9cbiAgYXN5bmMgcHJveHlTZXRUaW1lb3V0cyAodXJsLCBtZXRob2QsIGJvZHkpIHtcbiAgICBsZXQgcmVzcG9uc2UsIHJlc0JvZHk7XG5cbiAgICBjb25zdCB0aW1lb3V0UmVxdWVzdE9iamVjdHMgPSB0aGlzLmdldFRpbWVvdXRSZXF1ZXN0T2JqZWN0cyhib2R5KTtcbiAgICBsb2cuZGVidWcoYFdpbGwgc2VuZCB0aGUgZm9sbG93aW5nIHJlcXVlc3QgYm9kaWVzIHRvIC90aW1lb3V0czogJHtKU09OLnN0cmluZ2lmeSh0aW1lb3V0UmVxdWVzdE9iamVjdHMpfWApO1xuICAgIGZvciAoY29uc3QgdGltZW91dE9iaiBvZiB0aW1lb3V0UmVxdWVzdE9iamVjdHMpIHtcbiAgICAgIFtyZXNwb25zZSwgcmVzQm9keV0gPSBhd2FpdCB0aGlzLnByb3h5RnVuYyh1cmwsIG1ldGhvZCwgdGltZW91dE9iaik7XG5cbiAgICAgIC8vIElmIHdlIGdvdCBhIG5vbi1NSlNPTldQIHJlc3BvbnNlLCByZXR1cm4gdGhlIHJlc3VsdCwgbm90aGluZyBsZWZ0IHRvIGRvXG4gICAgICBpZiAodGhpcy5kb3duc3RyZWFtUHJvdG9jb2wgIT09IE1KU09OV1ApIHtcbiAgICAgICAgcmV0dXJuIFtyZXNwb25zZSwgcmVzQm9keV07XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGdvdCBhbiBlcnJvciwgcmV0dXJuIHRoZSBlcnJvciByaWdodCBhd2F5XG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA+PSA0MDApIHtcbiAgICAgICAgcmV0dXJuIFtyZXNwb25zZSwgcmVzQm9keV07XG4gICAgICB9XG5cbiAgICAgIC8vIC4uLk90aGVyd2lzZSwgY29udGludWUgdG8gdGhlIG5leHQgdGltZW91dHMgY2FsbFxuICAgIH1cbiAgICByZXR1cm4gW3Jlc3BvbnNlLCByZXNCb2R5XTtcbiAgfVxuXG4gIGFzeW5jIHByb3h5U2V0V2luZG93ICh1cmwsIG1ldGhvZCwgYm9keSkge1xuICAgIGNvbnN0IGJvZHlPYmogPSB1dGlsLnNhZmVKc29uUGFyc2UoYm9keSk7XG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChib2R5T2JqKSkge1xuICAgICAgaWYgKHRoaXMuZG93bnN0cmVhbVByb3RvY29sID09PSBXM0MgJiYgXy5oYXMoYm9keU9iaiwgJ25hbWUnKSAmJiAhXy5oYXMoYm9keU9iaiwgJ2hhbmRsZScpKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgQ29waWVkICduYW1lJyB2YWx1ZSAnJHtib2R5T2JqLm5hbWV9JyB0byAnaGFuZGxlJyBhcyBwZXIgVzNDIHNwZWNgKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlGdW5jKHVybCwgbWV0aG9kLCB7XG4gICAgICAgICAgLi4uYm9keU9iaixcbiAgICAgICAgICBoYW5kbGU6IGJvZHlPYmoubmFtZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5kb3duc3RyZWFtUHJvdG9jb2wgPT09IE1KU09OV1AgJiYgXy5oYXMoYm9keU9iaiwgJ2hhbmRsZScpICYmICFfLmhhcyhib2R5T2JqLCAnbmFtZScpKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgQ29waWVkICdoYW5kbGUnIHZhbHVlICcke2JvZHlPYmouaGFuZGxlfScgdG8gJ25hbWUnIGFzIHBlciBKU09OV1Agc3BlY2ApO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm94eUZ1bmModXJsLCBtZXRob2QsIHtcbiAgICAgICAgICAuLi5ib2R5T2JqLFxuICAgICAgICAgIG5hbWU6IGJvZHlPYmouaGFuZGxlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm94eUZ1bmModXJsLCBtZXRob2QsIGJvZHkpO1xuICB9XG5cbiAgYXN5bmMgcHJveHlTZXRWYWx1ZSAodXJsLCBtZXRob2QsIGJvZHkpIHtcbiAgICBjb25zdCBib2R5T2JqID0gdXRpbC5zYWZlSnNvblBhcnNlKGJvZHkpO1xuICAgIGlmIChfLmlzUGxhaW5PYmplY3QoYm9keU9iaikgJiYgKHV0aWwuaGFzVmFsdWUoYm9keU9iai50ZXh0KSB8fCB1dGlsLmhhc1ZhbHVlKGJvZHlPYmoudmFsdWUpKSkge1xuICAgICAgbGV0IHt0ZXh0LCB2YWx1ZX0gPSBib2R5T2JqO1xuICAgICAgaWYgKHV0aWwuaGFzVmFsdWUodGV4dCkgJiYgIXV0aWwuaGFzVmFsdWUodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gXy5pc1N0cmluZyh0ZXh0KVxuICAgICAgICAgID8gWy4uLnRleHRdXG4gICAgICAgICAgOiAoXy5pc0FycmF5KHRleHQpID8gdGV4dCA6IFtdKTtcbiAgICAgICAgbG9nLmRlYnVnKGBBZGRlZCAndmFsdWUnIHByb3BlcnR5ICR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSB0byAnc2V0VmFsdWUnIHJlcXVlc3QgYm9keWApO1xuICAgICAgfSBlbHNlIGlmICghdXRpbC5oYXNWYWx1ZSh0ZXh0KSAmJiB1dGlsLmhhc1ZhbHVlKHZhbHVlKSkge1xuICAgICAgICB0ZXh0ID0gXy5pc0FycmF5KHZhbHVlKVxuICAgICAgICAgID8gdmFsdWUuam9pbignJylcbiAgICAgICAgICA6IChfLmlzU3RyaW5nKHZhbHVlKSA/IHZhbHVlIDogJycpO1xuICAgICAgICBsb2cuZGVidWcoYEFkZGVkICd0ZXh0JyBwcm9wZXJ0eSAke0pTT04uc3RyaW5naWZ5KHRleHQpfSB0byAnc2V0VmFsdWUnIHJlcXVlc3QgYm9keWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlGdW5jKHVybCwgbWV0aG9kLCBPYmplY3QuYXNzaWduKHt9LCBib2R5T2JqLCB7XG4gICAgICAgIHRleHQsXG4gICAgICAgIHZhbHVlLFxuICAgICAgfSkpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3h5RnVuYyh1cmwsIG1ldGhvZCwgYm9keSk7XG4gIH1cblxuICBhc3luYyBwcm94eVNldEZyYW1lICh1cmwsIG1ldGhvZCwgYm9keSkge1xuICAgIGNvbnN0IGJvZHlPYmogPSB1dGlsLnNhZmVKc29uUGFyc2UoYm9keSk7XG4gICAgcmV0dXJuIF8uaGFzKGJvZHlPYmosICdpZCcpICYmIF8uaXNQbGFpbk9iamVjdChib2R5T2JqLmlkKVxuICAgICAgPyBhd2FpdCB0aGlzLnByb3h5RnVuYyh1cmwsIG1ldGhvZCwge1xuICAgICAgICAuLi5ib2R5T2JqLFxuICAgICAgICBpZDogZHVwbGljYXRlS2V5cyhib2R5T2JqLmlkLCBNSlNPTldQX0VMRU1FTlRfS0VZLCBXM0NfRUxFTUVOVF9LRVkpLFxuICAgICAgfSlcbiAgICAgIDogYXdhaXQgdGhpcy5wcm94eUZ1bmModXJsLCBtZXRob2QsIGJvZHkpO1xuICB9XG5cbiAgYXN5bmMgcHJveHlQZXJmb3JtQWN0aW9ucyAodXJsLCBtZXRob2QsIGJvZHkpIHtcbiAgICBjb25zdCBib2R5T2JqID0gdXRpbC5zYWZlSnNvblBhcnNlKGJvZHkpO1xuICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYm9keU9iailcbiAgICAgID8gYXdhaXQgdGhpcy5wcm94eUZ1bmModXJsLCBtZXRob2QsIGR1cGxpY2F0ZUtleXMoYm9keU9iaiwgTUpTT05XUF9FTEVNRU5UX0tFWSwgVzNDX0VMRU1FTlRfS0VZKSlcbiAgICAgIDogYXdhaXQgdGhpcy5wcm94eUZ1bmModXJsLCBtZXRob2QsIGJvZHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcImNyb3NzaW5nXCIgZW5kcG9pbnRzIGZvciB0aGUgY2FzZVxuICAgKiB3aGVuIHVwc3RyZWFtIGFuZCBkb3duc3RyZWFtIGRyaXZlcnMgb3BlcmF0ZSBkaWZmZXJlbnQgcHJvdG9jb2xzXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kTmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2RcbiAgICogQHBhcmFtIHs/c3RyaW5nfG9iamVjdH0gYm9keVxuICAgKiBAcmV0dXJucyBUaGUgcHJveHlmeWluZyByZXN1bHQgYXMgW3Jlc3BvbnNlLCByZXNwb25zZUJvZHldIHR1cGxlXG4gICAqL1xuICBhc3luYyBjb252ZXJ0QW5kUHJveHkgKGNvbW1hbmROYW1lLCB1cmwsIG1ldGhvZCwgYm9keSkge1xuICAgIGlmICghdGhpcy5kb3duc3RyZWFtUHJvdG9jb2wpIHtcbiAgICAgIC8vIFRoZXJlIGlzIG5vIHBvaW50IHRvIGNvbnZlcnQgYW55dGhpbmcgaWYgd2UgZG8gbm90IGtub3dcbiAgICAgIC8vIGZvciB3aGljaCBwcm90b2NvbCB0aGUgY29udmVyc2lvbiBzaG91bGQgYmUgZG9uZVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlGdW5jKHVybCwgbWV0aG9kLCBib2R5KTtcbiAgICB9XG5cbiAgICAvLyBTYW1lIHVybCwgYnV0IGRpZmZlcmVudCBhcmd1bWVudHNcbiAgICBzd2l0Y2ggKGNvbW1hbmROYW1lKSB7XG4gICAgICBjYXNlICd0aW1lb3V0cyc6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3h5U2V0VGltZW91dHModXJsLCBtZXRob2QsIGJvZHkpO1xuICAgICAgY2FzZSAnc2V0V2luZG93JzpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlTZXRXaW5kb3codXJsLCBtZXRob2QsIGJvZHkpO1xuICAgICAgY2FzZSAnc2V0VmFsdWUnOlxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm94eVNldFZhbHVlKHVybCwgbWV0aG9kLCBib2R5KTtcbiAgICAgIGNhc2UgJ3BlcmZvcm1BY3Rpb25zJzpcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlQZXJmb3JtQWN0aW9ucyh1cmwsIG1ldGhvZCwgYm9keSk7XG4gICAgICBjYXNlICdzZXRGcmFtZSc6XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3h5U2V0RnJhbWUodXJsLCBtZXRob2QsIGJvZHkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gU2FtZSBhcmd1bWVudHMsIGJ1dCBkaWZmZXJlbnQgVVJMc1xuICAgIGZvciAoY29uc3Qge2NvbW1hbmROYW1lcywganNvbndwQ29udmVydGVyLCB3M2NDb252ZXJ0ZXJ9IG9mIENPTU1BTkRfVVJMU19DT05GTElDVFMpIHtcbiAgICAgIGlmICghY29tbWFuZE5hbWVzLmluY2x1ZGVzKGNvbW1hbmROYW1lKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmV3cml0dGVuVXJsID0gdGhpcy5kb3duc3RyZWFtUHJvdG9jb2wgPT09IE1KU09OV1BcbiAgICAgICAgPyBqc29ud3BDb252ZXJ0ZXIodXJsKVxuICAgICAgICA6IHczY0NvbnZlcnRlcih1cmwpO1xuICAgICAgaWYgKHJld3JpdHRlblVybCA9PT0gdXJsKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgRGlkIG5vdCBrbm93IGhvdyB0byByZXdyaXRlIHRoZSBvcmlnaW5hbCBVUkwgJyR7dXJsfScgYCArXG4gICAgICAgICAgYGZvciAke3RoaXMuZG93bnN0cmVhbVByb3RvY29sfSBwcm90b2NvbGApO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxvZy5pbmZvKGBSZXdyb3RlIHRoZSBvcmlnaW5hbCBVUkwgJyR7dXJsfScgdG8gJyR7cmV3cml0dGVuVXJsfScgYCArXG4gICAgICAgIGBmb3IgJHt0aGlzLmRvd25zdHJlYW1Qcm90b2NvbH0gcHJvdG9jb2xgKTtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3h5RnVuYyhyZXdyaXR0ZW5VcmwsIG1ldGhvZCwgYm9keSk7XG4gICAgfVxuXG4gICAgLy8gTm8gbWF0Y2hlcyBmb3VuZC4gUHJvY2VlZCBub3JtYWxseVxuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3h5RnVuYyh1cmwsIG1ldGhvZCwgYm9keSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHJvdG9jb2xDb252ZXJ0ZXI7XG4iXSwiZmlsZSI6ImxpYi9qc29ud3AtcHJveHkvcHJvdG9jb2wtY29udmVydGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
