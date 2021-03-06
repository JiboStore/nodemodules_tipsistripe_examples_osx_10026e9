"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.WEB_INSPECTOR_SERVICE_NAME = exports.WebInspectorService = void 0;

require("source-map-support/register");

var _webinspectorDecoder = _interopRequireDefault(require("./transformer/webinspector-decoder"));

var _webinspectorEncoder = _interopRequireDefault(require("./transformer/webinspector-encoder"));

var _plistServiceDecoder = _interopRequireDefault(require("../plist-service/transformer/plist-service-decoder"));

var _plistServiceEncoder = _interopRequireDefault(require("../plist-service/transformer/plist-service-encoder"));

var _lengthBasedSplitter = _interopRequireDefault(require("../util/transformer/length-based-splitter"));

var _lodash = _interopRequireDefault(require("lodash"));

var _constants = require("../constants");

const WEB_INSPECTOR_SERVICE_NAME = 'com.apple.webinspector';
exports.WEB_INSPECTOR_SERVICE_NAME = WEB_INSPECTOR_SERVICE_NAME;
const PARTIAL_MESSAGE_SUPPORT_DEPRECATION_VERSION = 11;

class WebInspectorService {
  constructor(majorOsVersion, socketClient) {
    this._socketClient = socketClient;

    if (majorOsVersion < PARTIAL_MESSAGE_SUPPORT_DEPRECATION_VERSION) {
      this._decoder = new _webinspectorDecoder.default(_constants.MB);
      const plistDecoder = new _plistServiceDecoder.default();
      const splitter = new _lengthBasedSplitter.default(false, 1000000, 0, 4, 4);

      this._socketClient.pipe(splitter).pipe(plistDecoder).pipe(this._decoder);

      this._encoder = new _webinspectorEncoder.default();
      const plistEncoder = new _plistServiceEncoder.default();

      this._encoder.pipe(plistEncoder).pipe(this._socketClient);
    } else {
      this._decoder = new _plistServiceDecoder.default();
      const splitter = new _lengthBasedSplitter.default(false, 1000000, 0, 4, 4);

      this._socketClient.pipe(splitter).pipe(this._decoder);

      this._encoder = new _plistServiceEncoder.default();

      this._encoder.pipe(this._socketClient);
    }
  }

  sendMessage(rpcObject) {
    if (_lodash.default.isNil(rpcObject)) {
      throw new Error('Cant send a null object');
    }

    this._encoder.write(rpcObject);
  }

  listenMessage(callback) {
    this._decoder.on('data', callback);
  }

  close() {
    this._socketClient.destroy();
  }

}

exports.WebInspectorService = WebInspectorService;
var _default = WebInspectorService;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi93ZWJpbnNwZWN0b3IvaW5kZXguanMiXSwibmFtZXMiOlsiV0VCX0lOU1BFQ1RPUl9TRVJWSUNFX05BTUUiLCJQQVJUSUFMX01FU1NBR0VfU1VQUE9SVF9ERVBSRUNBVElPTl9WRVJTSU9OIiwiV2ViSW5zcGVjdG9yU2VydmljZSIsImNvbnN0cnVjdG9yIiwibWFqb3JPc1ZlcnNpb24iLCJzb2NrZXRDbGllbnQiLCJfc29ja2V0Q2xpZW50IiwiX2RlY29kZXIiLCJXZWJJbnNwZWN0b3JEZWNvZGVyIiwiTUIiLCJwbGlzdERlY29kZXIiLCJQbGlzdFNlcnZpY2VEZWNvZGVyIiwic3BsaXR0ZXIiLCJMZW5ndGhCYXNlZFNwbGl0dGVyIiwicGlwZSIsIl9lbmNvZGVyIiwiV2ViSW5zcGVjdG9yRW5jb2RlciIsInBsaXN0RW5jb2RlciIsIlBsaXN0U2VydmljZUVuY29kZXIiLCJzZW5kTWVzc2FnZSIsInJwY09iamVjdCIsIl8iLCJpc05pbCIsIkVycm9yIiwid3JpdGUiLCJsaXN0ZW5NZXNzYWdlIiwiY2FsbGJhY2siLCJvbiIsImNsb3NlIiwiZGVzdHJveSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSwwQkFBMEIsR0FBRyx3QkFBbkM7O0FBRUEsTUFBTUMsMkNBQTJDLEdBQUcsRUFBcEQ7O0FBRUEsTUFBTUMsbUJBQU4sQ0FBMEI7QUFPeEJDLEVBQUFBLFdBQVcsQ0FBRUMsY0FBRixFQUFrQkMsWUFBbEIsRUFBZ0M7QUFDekMsU0FBS0MsYUFBTCxHQUFxQkQsWUFBckI7O0FBRUEsUUFBSUQsY0FBYyxHQUFHSCwyQ0FBckIsRUFBa0U7QUFFaEUsV0FBS00sUUFBTCxHQUFnQixJQUFJQyw0QkFBSixDQUF3QkMsYUFBeEIsQ0FBaEI7QUFDQSxZQUFNQyxZQUFZLEdBQUcsSUFBSUMsNEJBQUosRUFBckI7QUFDQSxZQUFNQyxRQUFRLEdBQUcsSUFBSUMsNEJBQUosQ0FBd0IsS0FBeEIsRUFBK0IsT0FBL0IsRUFBd0MsQ0FBeEMsRUFBMkMsQ0FBM0MsRUFBOEMsQ0FBOUMsQ0FBakI7O0FBQ0EsV0FBS1AsYUFBTCxDQUFtQlEsSUFBbkIsQ0FBd0JGLFFBQXhCLEVBQWtDRSxJQUFsQyxDQUF1Q0osWUFBdkMsRUFBcURJLElBQXJELENBQTBELEtBQUtQLFFBQS9EOztBQUVBLFdBQUtRLFFBQUwsR0FBZ0IsSUFBSUMsNEJBQUosRUFBaEI7QUFDQSxZQUFNQyxZQUFZLEdBQUcsSUFBSUMsNEJBQUosRUFBckI7O0FBQ0EsV0FBS0gsUUFBTCxDQUFjRCxJQUFkLENBQW1CRyxZQUFuQixFQUFpQ0gsSUFBakMsQ0FBc0MsS0FBS1IsYUFBM0M7QUFDRCxLQVZELE1BVU87QUFDTCxXQUFLQyxRQUFMLEdBQWdCLElBQUlJLDRCQUFKLEVBQWhCO0FBQ0EsWUFBTUMsUUFBUSxHQUFHLElBQUlDLDRCQUFKLENBQXdCLEtBQXhCLEVBQStCLE9BQS9CLEVBQXdDLENBQXhDLEVBQTJDLENBQTNDLEVBQThDLENBQTlDLENBQWpCOztBQUNBLFdBQUtQLGFBQUwsQ0FBbUJRLElBQW5CLENBQXdCRixRQUF4QixFQUFrQ0UsSUFBbEMsQ0FBdUMsS0FBS1AsUUFBNUM7O0FBRUEsV0FBS1EsUUFBTCxHQUFnQixJQUFJRyw0QkFBSixFQUFoQjs7QUFDQSxXQUFLSCxRQUFMLENBQWNELElBQWQsQ0FBbUIsS0FBS1IsYUFBeEI7QUFDRDtBQUNGOztBQU9EYSxFQUFBQSxXQUFXLENBQUVDLFNBQUYsRUFBYTtBQUN0QixRQUFJQyxnQkFBRUMsS0FBRixDQUFRRixTQUFSLENBQUosRUFBd0I7QUFDdEIsWUFBTSxJQUFJRyxLQUFKLENBQVUseUJBQVYsQ0FBTjtBQUNEOztBQUNELFNBQUtSLFFBQUwsQ0FBY1MsS0FBZCxDQUFvQkosU0FBcEI7QUFDRDs7QUFZREssRUFBQUEsYUFBYSxDQUFFQyxRQUFGLEVBQVk7QUFDdkIsU0FBS25CLFFBQUwsQ0FBY29CLEVBQWQsQ0FBaUIsTUFBakIsRUFBeUJELFFBQXpCO0FBQ0Q7O0FBSURFLEVBQUFBLEtBQUssR0FBSTtBQUNQLFNBQUt0QixhQUFMLENBQW1CdUIsT0FBbkI7QUFDRDs7QUE1RHVCOzs7ZUFpRVgzQixtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIHByb21pc2UvcHJlZmVyLWF3YWl0LXRvLWNhbGxiYWNrcyAqL1xuaW1wb3J0IFdlYkluc3BlY3RvckRlY29kZXIgZnJvbSAnLi90cmFuc2Zvcm1lci93ZWJpbnNwZWN0b3ItZGVjb2Rlcic7XG5pbXBvcnQgV2ViSW5zcGVjdG9yRW5jb2RlciBmcm9tICcuL3RyYW5zZm9ybWVyL3dlYmluc3BlY3Rvci1lbmNvZGVyJztcbmltcG9ydCBQbGlzdFNlcnZpY2VEZWNvZGVyIGZyb20gJy4uL3BsaXN0LXNlcnZpY2UvdHJhbnNmb3JtZXIvcGxpc3Qtc2VydmljZS1kZWNvZGVyJztcbmltcG9ydCBQbGlzdFNlcnZpY2VFbmNvZGVyIGZyb20gJy4uL3BsaXN0LXNlcnZpY2UvdHJhbnNmb3JtZXIvcGxpc3Qtc2VydmljZS1lbmNvZGVyJztcbmltcG9ydCBMZW5ndGhCYXNlZFNwbGl0dGVyIGZyb20gJy4uL3V0aWwvdHJhbnNmb3JtZXIvbGVuZ3RoLWJhc2VkLXNwbGl0dGVyJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBNQiB9IGZyb20gJy4uL2NvbnN0YW50cyc7XG5cbmNvbnN0IFdFQl9JTlNQRUNUT1JfU0VSVklDRV9OQU1FID0gJ2NvbS5hcHBsZS53ZWJpbnNwZWN0b3InO1xuXG5jb25zdCBQQVJUSUFMX01FU1NBR0VfU1VQUE9SVF9ERVBSRUNBVElPTl9WRVJTSU9OID0gMTE7XG5cbmNsYXNzIFdlYkluc3BlY3RvclNlcnZpY2Uge1xuXG4gIC8qKlxuICAgKiBUaGUgbWFpbiBzZXJ2aWNlIGZvciBjb21tdW5pY2F0aW9uIHdpdGggdGhlIHdlYmluc3BlY3RvcmRcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1ham9yT3NWZXJzaW9uIFRoZSBtYWpvciB2ZXJzaW9uIG9mIHRoZSBvcyB2ZXJzaW9uXG4gICAqIEBwYXJhbSB7Kn0gc29ja2V0Q2xpZW50IFRoZSBzb2NrZXQgY2xpZW50IHdoZXJlIHRoZSBjb21tdW5pY2F0aW9uIHdpbGwgaGFwcGVuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAobWFqb3JPc1ZlcnNpb24sIHNvY2tldENsaWVudCkge1xuICAgIHRoaXMuX3NvY2tldENsaWVudCA9IHNvY2tldENsaWVudDtcblxuICAgIGlmIChtYWpvck9zVmVyc2lvbiA8IFBBUlRJQUxfTUVTU0FHRV9TVVBQT1JUX0RFUFJFQ0FUSU9OX1ZFUlNJT04pIHtcbiAgICAgIC8vIDFNQiBhcyBidWZmZXIgZm9yIGJ1bGRpbmcgd2ViaW5zcGVjdG9yIGZ1bGwgbWVzc2FnZXMuIFdlIGNhbiBpbmNyZWFzZSB0aGUgdmFsdWUgaWYgbW9yZSBidWZmZXIgaXMgbmVlZGVkXG4gICAgICB0aGlzLl9kZWNvZGVyID0gbmV3IFdlYkluc3BlY3RvckRlY29kZXIoTUIpO1xuICAgICAgY29uc3QgcGxpc3REZWNvZGVyID0gbmV3IFBsaXN0U2VydmljZURlY29kZXIoKTtcbiAgICAgIGNvbnN0IHNwbGl0dGVyID0gbmV3IExlbmd0aEJhc2VkU3BsaXR0ZXIoZmFsc2UsIDEwMDAwMDAsIDAsIDQsIDQpO1xuICAgICAgdGhpcy5fc29ja2V0Q2xpZW50LnBpcGUoc3BsaXR0ZXIpLnBpcGUocGxpc3REZWNvZGVyKS5waXBlKHRoaXMuX2RlY29kZXIpO1xuXG4gICAgICB0aGlzLl9lbmNvZGVyID0gbmV3IFdlYkluc3BlY3RvckVuY29kZXIoKTtcbiAgICAgIGNvbnN0IHBsaXN0RW5jb2RlciA9IG5ldyBQbGlzdFNlcnZpY2VFbmNvZGVyKCk7XG4gICAgICB0aGlzLl9lbmNvZGVyLnBpcGUocGxpc3RFbmNvZGVyKS5waXBlKHRoaXMuX3NvY2tldENsaWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2RlY29kZXIgPSBuZXcgUGxpc3RTZXJ2aWNlRGVjb2RlcigpO1xuICAgICAgY29uc3Qgc3BsaXR0ZXIgPSBuZXcgTGVuZ3RoQmFzZWRTcGxpdHRlcihmYWxzZSwgMTAwMDAwMCwgMCwgNCwgNCk7XG4gICAgICB0aGlzLl9zb2NrZXRDbGllbnQucGlwZShzcGxpdHRlcikucGlwZSh0aGlzLl9kZWNvZGVyKTtcblxuICAgICAgdGhpcy5fZW5jb2RlciA9IG5ldyBQbGlzdFNlcnZpY2VFbmNvZGVyKCk7XG4gICAgICB0aGlzLl9lbmNvZGVyLnBpcGUodGhpcy5fc29ja2V0Q2xpZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYW4gb2JqZWN0IHRvIHRoZSB3ZWJpbnNwZWN0b3JkIHNvY2tldFxuICAgKiBAcGFyYW0ge09iamVjdH0gcnBjT2JqZWN0IFRoZSBvYmplY3QgdGhhdCB3aWxsIGJlIHNlbnRcbiAgICogQHRocm93cyBXaWxsIHRocm93IGFuIGVycm9yIHdoZW4gdGhlIG9iamVjdCBpcyBudWxsIG9yIHVuZGVmaW5lZFxuICAgKi9cbiAgc2VuZE1lc3NhZ2UgKHJwY09iamVjdCkge1xuICAgIGlmIChfLmlzTmlsKHJwY09iamVjdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FudCBzZW5kIGEgbnVsbCBvYmplY3QnKTtcbiAgICB9XG4gICAgdGhpcy5fZW5jb2Rlci53cml0ZShycGNPYmplY3QpO1xuICB9XG5cbiAgLyoqIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgbWVzc2FnZSBsaXN0ZW5pbmdcbiAgICogQG5hbWUgTWVzc2FnZUNhbGxiYWNrXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBycGMgb2JqZWN0IHRoYXQgaXMgc2VudCBmcm9tIHRoZSB3ZWJpbnNwZWN0b3JkXG4gICovXG5cbiAgLyoqXG4gICAqIExpc3RlbiB0byBtZXNzYWdlcyBjb21pbmcgZnJvbSB3ZWJpbnNwZWN0b3JkXG4gICAqIEBwYXJhbSB7TWVzc2FnZUNhbGxiYWNrfSBjYWxsYmFja1xuICAgKi9cbiAgbGlzdGVuTWVzc2FnZSAoY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWNvZGVyLm9uKCdkYXRhJywgY2FsbGJhY2spO1xuICB9XG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIHVuZGVybHlpbmcgc29ja2V0IGNvbW11bmljYXRpbmcgd2l0aCB0aGUgcGhvbmVcbiAgICovXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQuZGVzdHJveSgpO1xuICB9XG5cbn1cblxuZXhwb3J0IHsgV2ViSW5zcGVjdG9yU2VydmljZSwgV0VCX0lOU1BFQ1RPUl9TRVJWSUNFX05BTUUgfTtcbmV4cG9ydCBkZWZhdWx0IFdlYkluc3BlY3RvclNlcnZpY2U7Il0sImZpbGUiOiJsaWIvd2ViaW5zcGVjdG9yL2luZGV4LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
