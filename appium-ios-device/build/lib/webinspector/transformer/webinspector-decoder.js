"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.WebInspectorDecoder = void 0;

require("source-map-support/register");

var _stream = _interopRequireDefault(require("stream"));

var _appiumSupport = require("appium-support");

class WebInspectorDecoder extends _stream.default.Transform {
  constructor(maxLength) {
    super({
      objectMode: true
    });
    this._frameBufferIndex = 0;
    this._frameBuffer = Buffer.allocUnsafeSlow(maxLength);
  }

  _transform(data, encoding, callback) {
    this._decode(data);

    callback();
  }

  _decode(data) {
    if (data.WIRFinalMessageKey) {
      const buffer = data.WIRFinalMessageKey;
      this._frameBufferIndex += this._readBytes(buffer, 0, this._frameBuffer, this._frameBufferIndex, buffer.length);
      this.push(_appiumSupport.plist.parsePlist(this._frameBuffer.slice(0, this._frameBufferIndex)));

      this._resetBuffers();
    } else {
      const buffer = data.WIRPartialMessageKey;
      this._frameBufferIndex += this._readBytes(buffer, 0, this._frameBuffer, this._frameBufferIndex, buffer.length);
    }
  }

  _readBytes(src, srcIndex, target, targetIndex, nBytesToBeRead) {
    let availableBytes = Math.min(nBytesToBeRead, src.length - srcIndex);
    src.copy(target, targetIndex, srcIndex, srcIndex + availableBytes);
    return availableBytes;
  }

  _resetBuffers() {
    this._frameBufferIndex = 0;
  }

}

exports.WebInspectorDecoder = WebInspectorDecoder;
var _default = WebInspectorDecoder;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi93ZWJpbnNwZWN0b3IvdHJhbnNmb3JtZXIvd2ViaW5zcGVjdG9yLWRlY29kZXIuanMiXSwibmFtZXMiOlsiV2ViSW5zcGVjdG9yRGVjb2RlciIsIlN0cmVhbSIsIlRyYW5zZm9ybSIsImNvbnN0cnVjdG9yIiwibWF4TGVuZ3RoIiwib2JqZWN0TW9kZSIsIl9mcmFtZUJ1ZmZlckluZGV4IiwiX2ZyYW1lQnVmZmVyIiwiQnVmZmVyIiwiYWxsb2NVbnNhZmVTbG93IiwiX3RyYW5zZm9ybSIsImRhdGEiLCJlbmNvZGluZyIsImNhbGxiYWNrIiwiX2RlY29kZSIsIldJUkZpbmFsTWVzc2FnZUtleSIsImJ1ZmZlciIsIl9yZWFkQnl0ZXMiLCJsZW5ndGgiLCJwdXNoIiwicGxpc3QiLCJwYXJzZVBsaXN0Iiwic2xpY2UiLCJfcmVzZXRCdWZmZXJzIiwiV0lSUGFydGlhbE1lc3NhZ2VLZXkiLCJzcmMiLCJzcmNJbmRleCIsInRhcmdldCIsInRhcmdldEluZGV4IiwibkJ5dGVzVG9CZVJlYWQiLCJhdmFpbGFibGVCeXRlcyIsIk1hdGgiLCJtaW4iLCJjb3B5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUdBLE1BQU1BLG1CQUFOLFNBQWtDQyxnQkFBT0MsU0FBekMsQ0FBbUQ7QUFFakRDLEVBQUFBLFdBQVcsQ0FBRUMsU0FBRixFQUFhO0FBQ3RCLFVBQU07QUFBRUMsTUFBQUEsVUFBVSxFQUFFO0FBQWQsS0FBTjtBQUNBLFNBQUtDLGlCQUFMLEdBQXlCLENBQXpCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQkMsTUFBTSxDQUFDQyxlQUFQLENBQXVCTCxTQUF2QixDQUFwQjtBQUNEOztBQUVETSxFQUFBQSxVQUFVLENBQUVDLElBQUYsRUFBUUMsUUFBUixFQUFrQkMsUUFBbEIsRUFBNEI7QUFDcEMsU0FBS0MsT0FBTCxDQUFhSCxJQUFiOztBQUNBRSxJQUFBQSxRQUFRO0FBQ1Q7O0FBRURDLEVBQUFBLE9BQU8sQ0FBRUgsSUFBRixFQUFRO0FBQ2IsUUFBSUEsSUFBSSxDQUFDSSxrQkFBVCxFQUE2QjtBQUMzQixZQUFNQyxNQUFNLEdBQUdMLElBQUksQ0FBQ0ksa0JBQXBCO0FBQ0EsV0FBS1QsaUJBQUwsSUFBMEIsS0FBS1csVUFBTCxDQUFnQkQsTUFBaEIsRUFBd0IsQ0FBeEIsRUFBMkIsS0FBS1QsWUFBaEMsRUFBOEMsS0FBS0QsaUJBQW5ELEVBQXNFVSxNQUFNLENBQUNFLE1BQTdFLENBQTFCO0FBQ0EsV0FBS0MsSUFBTCxDQUFVQyxxQkFBTUMsVUFBTixDQUFpQixLQUFLZCxZQUFMLENBQWtCZSxLQUFsQixDQUF3QixDQUF4QixFQUEyQixLQUFLaEIsaUJBQWhDLENBQWpCLENBQVY7O0FBQ0EsV0FBS2lCLGFBQUw7QUFDRCxLQUxELE1BS087QUFDTCxZQUFNUCxNQUFNLEdBQUdMLElBQUksQ0FBQ2Esb0JBQXBCO0FBQ0EsV0FBS2xCLGlCQUFMLElBQTBCLEtBQUtXLFVBQUwsQ0FBZ0JELE1BQWhCLEVBQXdCLENBQXhCLEVBQTJCLEtBQUtULFlBQWhDLEVBQThDLEtBQUtELGlCQUFuRCxFQUFzRVUsTUFBTSxDQUFDRSxNQUE3RSxDQUExQjtBQUNEO0FBQ0Y7O0FBRURELEVBQUFBLFVBQVUsQ0FBRVEsR0FBRixFQUFPQyxRQUFQLEVBQWlCQyxNQUFqQixFQUF5QkMsV0FBekIsRUFBc0NDLGNBQXRDLEVBQXNEO0FBQzlELFFBQUlDLGNBQWMsR0FBR0MsSUFBSSxDQUFDQyxHQUFMLENBQVNILGNBQVQsRUFBeUJKLEdBQUcsQ0FBQ1AsTUFBSixHQUFhUSxRQUF0QyxDQUFyQjtBQUNBRCxJQUFBQSxHQUFHLENBQUNRLElBQUosQ0FBU04sTUFBVCxFQUFpQkMsV0FBakIsRUFBOEJGLFFBQTlCLEVBQXdDQSxRQUFRLEdBQUdJLGNBQW5EO0FBQ0EsV0FBT0EsY0FBUDtBQUNEOztBQUVEUCxFQUFBQSxhQUFhLEdBQUk7QUFDZixTQUFLakIsaUJBQUwsR0FBeUIsQ0FBekI7QUFDRDs7QUFqQ2dEOzs7ZUFzQ3BDTixtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIHByb21pc2UvcHJlZmVyLWF3YWl0LXRvLWNhbGxiYWNrcyAqL1xuaW1wb3J0IFN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHsgcGxpc3QgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5cblxuY2xhc3MgV2ViSW5zcGVjdG9yRGVjb2RlciBleHRlbmRzIFN0cmVhbS5UcmFuc2Zvcm0ge1xuXG4gIGNvbnN0cnVjdG9yIChtYXhMZW5ndGgpIHtcbiAgICBzdXBlcih7IG9iamVjdE1vZGU6IHRydWUgfSk7XG4gICAgdGhpcy5fZnJhbWVCdWZmZXJJbmRleCA9IDA7XG4gICAgdGhpcy5fZnJhbWVCdWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmVTbG93KG1heExlbmd0aCk7XG4gIH1cblxuICBfdHJhbnNmb3JtIChkYXRhLCBlbmNvZGluZywgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWNvZGUoZGF0YSk7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuXG4gIF9kZWNvZGUgKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5XSVJGaW5hbE1lc3NhZ2VLZXkpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGRhdGEuV0lSRmluYWxNZXNzYWdlS2V5O1xuICAgICAgdGhpcy5fZnJhbWVCdWZmZXJJbmRleCArPSB0aGlzLl9yZWFkQnl0ZXMoYnVmZmVyLCAwLCB0aGlzLl9mcmFtZUJ1ZmZlciwgdGhpcy5fZnJhbWVCdWZmZXJJbmRleCwgYnVmZmVyLmxlbmd0aCk7XG4gICAgICB0aGlzLnB1c2gocGxpc3QucGFyc2VQbGlzdCh0aGlzLl9mcmFtZUJ1ZmZlci5zbGljZSgwLCB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4KSkpO1xuICAgICAgdGhpcy5fcmVzZXRCdWZmZXJzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGRhdGEuV0lSUGFydGlhbE1lc3NhZ2VLZXk7XG4gICAgICB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4ICs9IHRoaXMuX3JlYWRCeXRlcyhidWZmZXIsIDAsIHRoaXMuX2ZyYW1lQnVmZmVyLCB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4LCBidWZmZXIubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBfcmVhZEJ5dGVzIChzcmMsIHNyY0luZGV4LCB0YXJnZXQsIHRhcmdldEluZGV4LCBuQnl0ZXNUb0JlUmVhZCkge1xuICAgIGxldCBhdmFpbGFibGVCeXRlcyA9IE1hdGgubWluKG5CeXRlc1RvQmVSZWFkLCBzcmMubGVuZ3RoIC0gc3JjSW5kZXgpO1xuICAgIHNyYy5jb3B5KHRhcmdldCwgdGFyZ2V0SW5kZXgsIHNyY0luZGV4LCBzcmNJbmRleCArIGF2YWlsYWJsZUJ5dGVzKTtcbiAgICByZXR1cm4gYXZhaWxhYmxlQnl0ZXM7XG4gIH1cblxuICBfcmVzZXRCdWZmZXJzICgpIHtcbiAgICB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4ID0gMDtcbiAgfVxuXG59XG5cbmV4cG9ydCB7IFdlYkluc3BlY3RvckRlY29kZXIgfTtcbmV4cG9ydCBkZWZhdWx0IFdlYkluc3BlY3RvckRlY29kZXI7Il0sImZpbGUiOiJsaWIvd2ViaW5zcGVjdG9yL3RyYW5zZm9ybWVyL3dlYmluc3BlY3Rvci1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uLy4uIn0=