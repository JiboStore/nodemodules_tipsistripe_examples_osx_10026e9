"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebKitRemoteDebugger = exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _remoteDebugger = require("./remote-debugger");

var _webkitRpcClient = _interopRequireDefault(require("./webkit-rpc-client"));

var _lodash = _interopRequireDefault(require("lodash"));

var _url = _interopRequireDefault(require("url"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _helpers = require("./helpers");

class WebKitRemoteDebugger extends _remoteDebugger.RemoteDebugger {
  constructor(opts = {}) {
    opts = Object.assign({
      host: 'localhost'
    }, opts);
    super(_lodash.default.defaults({
      debuggerType: _remoteDebugger.DEBUGGER_TYPES.webkit
    }, opts));
    this.webkitResponseTimeout = opts.webkitResponseTimeout || _remoteDebugger.RPC_RESPONSE_TIMEOUT_MS;
    this.dataMethods = {};
  }

  connect(pageId) {
    var _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      _this.rpcClient = new _webkitRpcClient.default(_this.host, _this.port, _this.webkitResponseTimeout);
      yield _this.rpcClient.connect(pageId);
    })();
  }

  disconnect() {
    if (this.rpcClient && this.rpcClient.isConnected()) {
      this.rpcClient.disconnect();
    }
  }

  isConnected() {
    return !!(this.rpcClient && this.rpcClient.isConnected());
  }

  pageArrayFromJson(ignoreAboutBlankUrl = false) {
    var _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      _logger.default.debug(`Getting WebKitRemoteDebugger pageArray: ${_this2.host}, ${_this2.port}`);

      let pageElementJSON = yield _this2.getJsonFromUrl(_this2.host, _this2.port, '/json');

      if (pageElementJSON[0] && pageElementJSON[0].deviceId) {
        _logger.default.debug(`Device JSON: ${(0, _helpers.simpleStringify)(pageElementJSON)}`);

        let devices = pageElementJSON.filter(device => device.deviceId !== 'SIMULATOR');

        if (devices.length > 1) {
          _logger.default.debug(`Connected to ${devices.length} devices. ` + `Choosing the first, with udid '${devices[0].deviceId}'.`);
        }

        _this2.port = devices[0].url.split(':')[1];

        _logger.default.debug(`Received notification that ios-webkit-debug-proxy is listening on port '${_this2.port}'`);

        pageElementJSON = yield _this2.getJsonFromUrl(_this2.host, _this2.port, '/json');
      }

      _logger.default.debug(`Page element JSON: ${(0, _helpers.simpleStringify)(pageElementJSON)}`);

      let newPageArray = pageElementJSON.filter(pageObject => {
        return pageObject.url && (!ignoreAboutBlankUrl || pageObject.url !== 'about:blank');
      }).map(pageObject => {
        let urlArray = pageObject.webSocketDebuggerUrl.split('/').reverse();
        let id = urlArray[0];
        return {
          id,
          title: pageObject.title,
          url: pageObject.url,
          isKey: !!id
        };
      });
      return newPageArray;
    })();
  }

  getJsonFromUrl(hostname, port, pathname) {
    return (0, _asyncToGenerator2.default)(function* () {
      let uri = _url.default.format({
        protocol: 'http',
        hostname,
        port,
        pathname
      });

      _logger.default.debug(`Sending request to: ${uri}`);

      return JSON.parse((yield (0, _requestPromise.default)({
        uri,
        method: 'GET'
      })));
    })();
  }

  convertResult(res) {
    if (res && res.wasThrown) {
      let message = res.result.value || res.result;
      throw new _appiumBaseDriver.errors.JavaScriptError(message);
    }

    if (res && res.result && res.result.type === 'undefined') {
      res.result.value = {};
    }

    return super.convertResult(res && res.result ? res.result.value : res);
  }

}

exports.WebKitRemoteDebugger = exports.default = WebKitRemoteDebugger;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi93ZWJraXQtcmVtb3RlLWRlYnVnZ2VyLmpzIl0sIm5hbWVzIjpbIldlYktpdFJlbW90ZURlYnVnZ2VyIiwiUmVtb3RlRGVidWdnZXIiLCJjb25zdHJ1Y3RvciIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJob3N0IiwiXyIsImRlZmF1bHRzIiwiZGVidWdnZXJUeXBlIiwiREVCVUdHRVJfVFlQRVMiLCJ3ZWJraXQiLCJ3ZWJraXRSZXNwb25zZVRpbWVvdXQiLCJSUENfUkVTUE9OU0VfVElNRU9VVF9NUyIsImRhdGFNZXRob2RzIiwiY29ubmVjdCIsInBhZ2VJZCIsInJwY0NsaWVudCIsIldlYktpdFJwY0NsaWVudCIsInBvcnQiLCJkaXNjb25uZWN0IiwiaXNDb25uZWN0ZWQiLCJwYWdlQXJyYXlGcm9tSnNvbiIsImlnbm9yZUFib3V0QmxhbmtVcmwiLCJsb2ciLCJkZWJ1ZyIsInBhZ2VFbGVtZW50SlNPTiIsImdldEpzb25Gcm9tVXJsIiwiZGV2aWNlSWQiLCJkZXZpY2VzIiwiZmlsdGVyIiwiZGV2aWNlIiwibGVuZ3RoIiwidXJsIiwic3BsaXQiLCJuZXdQYWdlQXJyYXkiLCJwYWdlT2JqZWN0IiwibWFwIiwidXJsQXJyYXkiLCJ3ZWJTb2NrZXREZWJ1Z2dlclVybCIsInJldmVyc2UiLCJpZCIsInRpdGxlIiwiaXNLZXkiLCJob3N0bmFtZSIsInBhdGhuYW1lIiwidXJpIiwiZm9ybWF0IiwicHJvdG9jb2wiLCJKU09OIiwicGFyc2UiLCJtZXRob2QiLCJjb252ZXJ0UmVzdWx0IiwicmVzIiwid2FzVGhyb3duIiwibWVzc2FnZSIsInJlc3VsdCIsInZhbHVlIiwiZXJyb3JzIiwiSmF2YVNjcmlwdEVycm9yIiwidHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHZSxNQUFNQSxvQkFBTixTQUFtQ0MsOEJBQW5DLENBQWtEO0FBQy9EQyxFQUFBQSxXQUFX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QUcsQ0FBQ0csTUFBdEM7QUFDQSxZQUFNLElBQUlFLHlCQUFPQyxlQUFYLENBQTJCSixPQUEzQixDQUFOO0FBQ0Q7O0FBRUQsUUFBSUYsR0FBRyxJQUFJQSxHQUFHLENBQUNHLE1BQVgsSUFBcUJILEdBQUcsQ0FBQ0csTUFBSixDQUFXSSxJQUFYLEtBQW9CLFdBQTdDLEVBQTBEO0FBR3hEUCxNQUFBQSxHQUFHLENBQUNHLE1BQUosQ0FBV0MsS0FBWCxHQUFtQixFQUFuQjtBQUNEOztBQUdELFdBQU8sTUFBTUwsYUFBTixDQUFvQkMsR0FBRyxJQUFJQSxHQUFHLENBQUNHLE1BQVgsR0FBb0JILEdBQUcsQ0FBQ0csTUFBSixDQUFXQyxLQUEvQixHQUF1Q0osR0FBM0QsQ0FBUDtBQUNEOztBQXpHOEQiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bWFpblxuXG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IGVycm9ycyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgeyBSZW1vdGVEZWJ1Z2dlciwgREVCVUdHRVJfVFlQRVMsIFJQQ19SRVNQT05TRV9USU1FT1VUX01TIH0gZnJvbSAnLi9yZW1vdGUtZGVidWdnZXInO1xuaW1wb3J0IFdlYktpdFJwY0NsaWVudCBmcm9tICcuL3dlYmtpdC1ycGMtY2xpZW50JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgcmVxdWVzdCBmcm9tICdyZXF1ZXN0LXByb21pc2UnO1xuaW1wb3J0IHsgc2ltcGxlU3RyaW5naWZ5IH0gZnJvbSAnLi9oZWxwZXJzJztcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXZWJLaXRSZW1vdGVEZWJ1Z2dlciBleHRlbmRzIFJlbW90ZURlYnVnZ2VyIHtcbiAgY29uc3RydWN0b3IgKG9wdHMgPSB7fSkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBpcyBhIGhvc3RcbiAgICBvcHRzID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICB9LCBvcHRzKTtcbiAgICBzdXBlcihfLmRlZmF1bHRzKHtkZWJ1Z2dlclR5cGU6IERFQlVHR0VSX1RZUEVTLndlYmtpdH0sIG9wdHMpKTtcblxuICAgIHRoaXMud2Via2l0UmVzcG9uc2VUaW1lb3V0ID0gb3B0cy53ZWJraXRSZXNwb25zZVRpbWVvdXQgfHwgUlBDX1JFU1BPTlNFX1RJTUVPVVRfTVM7XG5cbiAgICAvLyB1c2VkIHRvIHN0b3JlIGNhbGxiYWNrIHR5cGVzIHdoZW4gc2VuZGluZyByZXF1ZXN0c1xuICAgIHRoaXMuZGF0YU1ldGhvZHMgPSB7fTtcbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3QgKHBhZ2VJZCkge1xuICAgIHRoaXMucnBjQ2xpZW50ID0gbmV3IFdlYktpdFJwY0NsaWVudCh0aGlzLmhvc3QsIHRoaXMucG9ydCwgdGhpcy53ZWJraXRSZXNwb25zZVRpbWVvdXQpO1xuICAgIGF3YWl0IHRoaXMucnBjQ2xpZW50LmNvbm5lY3QocGFnZUlkKTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QgKCkge1xuICAgIGlmICh0aGlzLnJwY0NsaWVudCAmJiB0aGlzLnJwY0NsaWVudC5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICB0aGlzLnJwY0NsaWVudC5kaXNjb25uZWN0KCk7XG4gICAgfVxuICB9XG5cbiAgaXNDb25uZWN0ZWQgKCkge1xuICAgIHJldHVybiAhISh0aGlzLnJwY0NsaWVudCAmJiB0aGlzLnJwY0NsaWVudC5pc0Nvbm5lY3RlZCgpKTtcbiAgfVxuXG4gIGFzeW5jIHBhZ2VBcnJheUZyb21Kc29uIChpZ25vcmVBYm91dEJsYW5rVXJsID0gZmFsc2UpIHtcbiAgICBsb2cuZGVidWcoYEdldHRpbmcgV2ViS2l0UmVtb3RlRGVidWdnZXIgcGFnZUFycmF5OiAke3RoaXMuaG9zdH0sICR7dGhpcy5wb3J0fWApO1xuICAgIGxldCBwYWdlRWxlbWVudEpTT04gPSBhd2FpdCB0aGlzLmdldEpzb25Gcm9tVXJsKHRoaXMuaG9zdCwgdGhpcy5wb3J0LCAnL2pzb24nKTtcbiAgICBpZiAocGFnZUVsZW1lbnRKU09OWzBdICYmIHBhZ2VFbGVtZW50SlNPTlswXS5kZXZpY2VJZCkge1xuICAgICAgbG9nLmRlYnVnKGBEZXZpY2UgSlNPTjogJHtzaW1wbGVTdHJpbmdpZnkocGFnZUVsZW1lbnRKU09OKX1gKTtcblxuICAgICAgbGV0IGRldmljZXMgPSBwYWdlRWxlbWVudEpTT04uZmlsdGVyKChkZXZpY2UpID0+IGRldmljZS5kZXZpY2VJZCAhPT0gJ1NJTVVMQVRPUicpO1xuICAgICAgaWYgKGRldmljZXMubGVuZ3RoID4gMSkge1xuICAgICAgICBsb2cuZGVidWcoYENvbm5lY3RlZCB0byAke2RldmljZXMubGVuZ3RofSBkZXZpY2VzLiBgICtcbiAgICAgICAgICAgICAgICAgIGBDaG9vc2luZyB0aGUgZmlyc3QsIHdpdGggdWRpZCAnJHtkZXZpY2VzWzBdLmRldmljZUlkfScuYCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBvcnQgPSBkZXZpY2VzWzBdLnVybC5zcGxpdCgnOicpWzFdO1xuICAgICAgbG9nLmRlYnVnKGBSZWNlaXZlZCBub3RpZmljYXRpb24gdGhhdCBpb3Mtd2Via2l0LWRlYnVnLXByb3h5IGlzIGxpc3RlbmluZyBvbiBwb3J0ICcke3RoaXMucG9ydH0nYCk7XG5cbiAgICAgIHBhZ2VFbGVtZW50SlNPTiA9IGF3YWl0IHRoaXMuZ2V0SnNvbkZyb21VcmwodGhpcy5ob3N0LCB0aGlzLnBvcnQsICcvanNvbicpO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYFBhZ2UgZWxlbWVudCBKU09OOiAke3NpbXBsZVN0cmluZ2lmeShwYWdlRWxlbWVudEpTT04pfWApO1xuXG4gICAgLy8gQWRkIGVsZW1lbnRzIHRvIGFuIGFycmF5XG4gICAgbGV0IG5ld1BhZ2VBcnJheSA9IHBhZ2VFbGVtZW50SlNPTi5maWx0ZXIoKHBhZ2VPYmplY3QpID0+IHtcbiAgICAgIHJldHVybiBwYWdlT2JqZWN0LnVybCAmJiAoIWlnbm9yZUFib3V0QmxhbmtVcmwgfHwgcGFnZU9iamVjdC51cmwgIT09ICdhYm91dDpibGFuaycpO1xuICAgIH0pLm1hcCgocGFnZU9iamVjdCkgPT4ge1xuICAgICAgbGV0IHVybEFycmF5ID0gcGFnZU9iamVjdC53ZWJTb2NrZXREZWJ1Z2dlclVybC5zcGxpdCgnLycpLnJldmVyc2UoKTtcbiAgICAgIGxldCBpZCA9IHVybEFycmF5WzBdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQsXG4gICAgICAgIHRpdGxlOiBwYWdlT2JqZWN0LnRpdGxlLFxuICAgICAgICB1cmw6IHBhZ2VPYmplY3QudXJsLFxuICAgICAgICBpc0tleTogISFpZCxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3UGFnZUFycmF5O1xuICB9XG5cbiAgYXN5bmMgZ2V0SnNvbkZyb21VcmwgKGhvc3RuYW1lLCBwb3J0LCBwYXRobmFtZSkge1xuICAgIGxldCB1cmkgPSB1cmwuZm9ybWF0KHtcbiAgICAgIHByb3RvY29sOiAnaHR0cCcsXG4gICAgICBob3N0bmFtZSxcbiAgICAgIHBvcnQsXG4gICAgICBwYXRobmFtZVxuICAgIH0pO1xuICAgIGxvZy5kZWJ1ZyhgU2VuZGluZyByZXF1ZXN0IHRvOiAke3VyaX1gKTtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCByZXF1ZXN0KHt1cmksIG1ldGhvZDogJ0dFVCd9KSk7XG4gIH1cblxuICBjb252ZXJ0UmVzdWx0IChyZXMpIHtcbiAgICAvLyBXZWJLaXQgcmV0dXJucyBhIHJlc3VsdCB3cmFwcGVkIGRlZXBlciB0aGFuIHRoZSBSZW1vdGUgRGVidWdnZXI6XG4gICAgLy8gICB7XG4gICAgLy8gICAgIHJlc3VsdDoge1xuICAgIC8vICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgLy8gICAgICAgdmFsdWU6IHtcbiAgICAvLyAgICAgICAgIHN0YXR1czogMCxcbiAgICAvLyAgICAgICAgIHZhbHVlOiB7XG4gICAgLy8gICAgICAgICAgIEVMRU1FTlQ6IFwiOndkYzoxNDQxODE5NzQwMDYwXCJcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0sXG4gICAgLy8gICAgIHdhc1Rocm93bjogZmFsc2VcbiAgICAvLyAgIH1cblxuICAgIC8vIGNoZWNrIGZvciBlcnJvcnNcbiAgICBpZiAocmVzICYmIHJlcy53YXNUaHJvd24pIHtcbiAgICAgIC8vIHdlIGdvdCBzb21lIGZvcm0gb2YgZXJyb3IuXG4gICAgICBsZXQgbWVzc2FnZSA9IHJlcy5yZXN1bHQudmFsdWUgfHwgcmVzLnJlc3VsdDtcbiAgICAgIHRocm93IG5ldyBlcnJvcnMuSmF2YVNjcmlwdEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGlmIChyZXMgJiYgcmVzLnJlc3VsdCAmJiByZXMucmVzdWx0LnR5cGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBpZiBpdCBkb2Vzbid0IHRocm93IGFuIGVycm9yLCB3ZSBqdXN0IHdhbnQgdG8gcHV0IGluIGFcbiAgICAgIC8vIHBsYWNlIGhvbGRlci4gdGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBhbiBhc3luYyBleGVjdXRlIHJlcXVlc3RcbiAgICAgIHJlcy5yZXN1bHQudmFsdWUgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHRoZSBhY3R1YWwgcmVzdWx0IHRvIHRoZSBSZW1vdGUgRGVidWdnZXIgY29udmVydGVyXG4gICAgcmV0dXJuIHN1cGVyLmNvbnZlcnRSZXN1bHQocmVzICYmIHJlcy5yZXN1bHQgPyByZXMucmVzdWx0LnZhbHVlIDogcmVzKTtcbiAgfVxufVxuXG5leHBvcnQgeyBXZWJLaXRSZW1vdGVEZWJ1Z2dlciB9O1xuIl0sImZpbGUiOiJsaWIvd2Via2l0LXJlbW90ZS1kZWJ1Z2dlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
