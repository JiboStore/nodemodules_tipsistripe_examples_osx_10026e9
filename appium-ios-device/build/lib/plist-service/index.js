"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PlistService = void 0;

require("source-map-support/register");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _sslHelper = require("../ssl-helper");

var _plistServiceEncoder = _interopRequireDefault(require("./transformer/plist-service-encoder"));

var _plistServiceDecoder = _interopRequireDefault(require("./transformer/plist-service-decoder"));

var _lengthBasedSplitter = _interopRequireDefault(require("../util/transformer/length-based-splitter"));

const CHECK_FREQ_MS = 50;

class PlistService {
  constructor(socketClient) {
    this._socketClient = socketClient;
    this._decoder = new _plistServiceDecoder.default();
    this._splitter = new _lengthBasedSplitter.default(false, 1000000, 0, 4, 4);

    this._socketClient.pipe(this._splitter).pipe(this._decoder);

    this._encoder = new _plistServiceEncoder.default();

    this._encoder.pipe(this._socketClient);

    this.replyQueue = [];

    this._decoder.on('data', data => this.replyQueue.push(data));
  }

  async sendPlistAndReceive(json, timeout = 5000) {
    this.sendPlist(json);
    return await this.receivePlist(timeout);
  }

  sendPlist(json) {
    if (!json) {
      throw new Error('Cant send a null a object');
    }

    this._encoder.write(json);
  }

  async receivePlist(timeout = 5000) {
    return await new _bluebird.default((resolve, reject) => {
      const queue = this.replyQueue;
      const data = queue.shift();

      if (data) {
        resolve(data);
        return;
      }

      const checkExist = setInterval(() => {
        const data = queue.shift();

        if (!data) {
          return;
        }

        clearInterval(checkExist);
        resolve(data);
      }, CHECK_FREQ_MS);
      setTimeout(() => {
        clearInterval(checkExist);
        reject(new Error(`Failed to receive any data within the timeout: ${timeout}`));
      }, timeout);
    });
  }

  enableSessionSSL(hostPrivateKey, hostCertificate) {
    this._socketClient.unpipe(this._splitter);

    this._splitter.unpipe(this._decoder);

    this._encoder.unpipe(this._socketClient);

    this._socketClient = (0, _sslHelper.upgradeToSSL)(this._socketClient, hostPrivateKey, hostCertificate);

    this._encoder.pipe(this._socketClient);

    this._socketClient.pipe(this._splitter).pipe(this._decoder);
  }

  close() {
    this._socketClient.destroy();
  }

}

exports.PlistService = PlistService;
var _default = PlistService;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wbGlzdC1zZXJ2aWNlL2luZGV4LmpzIl0sIm5hbWVzIjpbIkNIRUNLX0ZSRVFfTVMiLCJQbGlzdFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsInNvY2tldENsaWVudCIsIl9zb2NrZXRDbGllbnQiLCJfZGVjb2RlciIsIlBsaXN0U2VydmljZURlY29kZXIiLCJfc3BsaXR0ZXIiLCJMZW5ndGhCYXNlZFNwbGl0dGVyIiwicGlwZSIsIl9lbmNvZGVyIiwiUGxpc3RTZXJ2aWNlRW5jb2RlciIsInJlcGx5UXVldWUiLCJvbiIsImRhdGEiLCJwdXNoIiwic2VuZFBsaXN0QW5kUmVjZWl2ZSIsImpzb24iLCJ0aW1lb3V0Iiwic2VuZFBsaXN0IiwicmVjZWl2ZVBsaXN0IiwiRXJyb3IiLCJ3cml0ZSIsIkIiLCJyZXNvbHZlIiwicmVqZWN0IiwicXVldWUiLCJzaGlmdCIsImNoZWNrRXhpc3QiLCJzZXRJbnRlcnZhbCIsImNsZWFySW50ZXJ2YWwiLCJzZXRUaW1lb3V0IiwiZW5hYmxlU2Vzc2lvblNTTCIsImhvc3RQcml2YXRlS2V5IiwiaG9zdENlcnRpZmljYXRlIiwidW5waXBlIiwiY2xvc2UiLCJkZXN0cm95Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLGFBQWEsR0FBRyxFQUF0Qjs7QUFFQSxNQUFNQyxZQUFOLENBQW1CO0FBQ2pCQyxFQUFBQSxXQUFXLENBQUVDLFlBQUYsRUFBZ0I7QUFDekIsU0FBS0MsYUFBTCxHQUFxQkQsWUFBckI7QUFDQSxTQUFLRSxRQUFMLEdBQWdCLElBQUlDLDRCQUFKLEVBQWhCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixJQUFJQyw0QkFBSixDQUF3QixLQUF4QixFQUErQixPQUEvQixFQUF3QyxDQUF4QyxFQUEyQyxDQUEzQyxFQUE4QyxDQUE5QyxDQUFqQjs7QUFDQSxTQUFLSixhQUFMLENBQW1CSyxJQUFuQixDQUF3QixLQUFLRixTQUE3QixFQUF3Q0UsSUFBeEMsQ0FBNkMsS0FBS0osUUFBbEQ7O0FBRUEsU0FBS0ssUUFBTCxHQUFnQixJQUFJQyw0QkFBSixFQUFoQjs7QUFDQSxTQUFLRCxRQUFMLENBQWNELElBQWQsQ0FBbUIsS0FBS0wsYUFBeEI7O0FBRUEsU0FBS1EsVUFBTCxHQUFrQixFQUFsQjs7QUFDQSxTQUFLUCxRQUFMLENBQWNRLEVBQWQsQ0FBaUIsTUFBakIsRUFBMEJDLElBQUQsSUFBVSxLQUFLRixVQUFMLENBQWdCRyxJQUFoQixDQUFxQkQsSUFBckIsQ0FBbkM7QUFDRDs7QUFFRCxRQUFNRSxtQkFBTixDQUEyQkMsSUFBM0IsRUFBaUNDLE9BQU8sR0FBRyxJQUEzQyxFQUFpRDtBQUMvQyxTQUFLQyxTQUFMLENBQWVGLElBQWY7QUFDQSxXQUFPLE1BQU0sS0FBS0csWUFBTCxDQUFrQkYsT0FBbEIsQ0FBYjtBQUNEOztBQUVEQyxFQUFBQSxTQUFTLENBQUVGLElBQUYsRUFBUTtBQUNmLFFBQUksQ0FBQ0EsSUFBTCxFQUFXO0FBQ1QsWUFBTSxJQUFJSSxLQUFKLENBQVUsMkJBQVYsQ0FBTjtBQUNEOztBQUNELFNBQUtYLFFBQUwsQ0FBY1ksS0FBZCxDQUFvQkwsSUFBcEI7QUFDRDs7QUFFRCxRQUFNRyxZQUFOLENBQW9CRixPQUFPLEdBQUcsSUFBOUIsRUFBb0M7QUFDbEMsV0FBTyxNQUFNLElBQUlLLGlCQUFKLENBQU0sQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQ3RDLFlBQU1DLEtBQUssR0FBRyxLQUFLZCxVQUFuQjtBQUNBLFlBQU1FLElBQUksR0FBR1ksS0FBSyxDQUFDQyxLQUFOLEVBQWI7O0FBQ0EsVUFBSWIsSUFBSixFQUFVO0FBQ1JVLFFBQUFBLE9BQU8sQ0FBQ1YsSUFBRCxDQUFQO0FBQ0E7QUFDRDs7QUFDRCxZQUFNYyxVQUFVLEdBQUdDLFdBQVcsQ0FBQyxNQUFNO0FBQ25DLGNBQU1mLElBQUksR0FBR1ksS0FBSyxDQUFDQyxLQUFOLEVBQWI7O0FBQ0EsWUFBSSxDQUFDYixJQUFMLEVBQVc7QUFDVDtBQUNEOztBQUNEZ0IsUUFBQUEsYUFBYSxDQUFDRixVQUFELENBQWI7QUFDQUosUUFBQUEsT0FBTyxDQUFDVixJQUFELENBQVA7QUFDRCxPQVA2QixFQU8zQmQsYUFQMkIsQ0FBOUI7QUFRQStCLE1BQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2ZELFFBQUFBLGFBQWEsQ0FBQ0YsVUFBRCxDQUFiO0FBQ0FILFFBQUFBLE1BQU0sQ0FBQyxJQUFJSixLQUFKLENBQVcsa0RBQWlESCxPQUFRLEVBQXBFLENBQUQsQ0FBTjtBQUNELE9BSFMsRUFHUEEsT0FITyxDQUFWO0FBSUQsS0FuQlksQ0FBYjtBQW9CRDs7QUFFRGMsRUFBQUEsZ0JBQWdCLENBQUVDLGNBQUYsRUFBa0JDLGVBQWxCLEVBQW1DO0FBQ2pELFNBQUs5QixhQUFMLENBQW1CK0IsTUFBbkIsQ0FBMEIsS0FBSzVCLFNBQS9COztBQUNBLFNBQUtBLFNBQUwsQ0FBZTRCLE1BQWYsQ0FBc0IsS0FBSzlCLFFBQTNCOztBQUNBLFNBQUtLLFFBQUwsQ0FBY3lCLE1BQWQsQ0FBcUIsS0FBSy9CLGFBQTFCOztBQUNBLFNBQUtBLGFBQUwsR0FBcUIsNkJBQWEsS0FBS0EsYUFBbEIsRUFBaUM2QixjQUFqQyxFQUFpREMsZUFBakQsQ0FBckI7O0FBQ0EsU0FBS3hCLFFBQUwsQ0FBY0QsSUFBZCxDQUFtQixLQUFLTCxhQUF4Qjs7QUFDQSxTQUFLQSxhQUFMLENBQW1CSyxJQUFuQixDQUF3QixLQUFLRixTQUE3QixFQUF3Q0UsSUFBeEMsQ0FBNkMsS0FBS0osUUFBbEQ7QUFDRDs7QUFFRCtCLEVBQUFBLEtBQUssR0FBSTtBQUNQLFNBQUtoQyxhQUFMLENBQW1CaUMsT0FBbkI7QUFDRDs7QUE1RGdCOzs7ZUFnRUpwQyxZIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgdXBncmFkZVRvU1NMIH0gZnJvbSAnLi4vc3NsLWhlbHBlcic7XG5pbXBvcnQgUGxpc3RTZXJ2aWNlRW5jb2RlciBmcm9tICcuL3RyYW5zZm9ybWVyL3BsaXN0LXNlcnZpY2UtZW5jb2Rlcic7XG5pbXBvcnQgUGxpc3RTZXJ2aWNlRGVjb2RlciBmcm9tICcuL3RyYW5zZm9ybWVyL3BsaXN0LXNlcnZpY2UtZGVjb2Rlcic7XG5pbXBvcnQgTGVuZ3RoQmFzZWRTcGxpdHRlciBmcm9tICcuLi91dGlsL3RyYW5zZm9ybWVyL2xlbmd0aC1iYXNlZC1zcGxpdHRlcic7XG5cbmNvbnN0IENIRUNLX0ZSRVFfTVMgPSA1MDtcblxuY2xhc3MgUGxpc3RTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IgKHNvY2tldENsaWVudCkge1xuICAgIHRoaXMuX3NvY2tldENsaWVudCA9IHNvY2tldENsaWVudDtcbiAgICB0aGlzLl9kZWNvZGVyID0gbmV3IFBsaXN0U2VydmljZURlY29kZXIoKTtcbiAgICB0aGlzLl9zcGxpdHRlciA9IG5ldyBMZW5ndGhCYXNlZFNwbGl0dGVyKGZhbHNlLCAxMDAwMDAwLCAwLCA0LCA0KTtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQucGlwZSh0aGlzLl9zcGxpdHRlcikucGlwZSh0aGlzLl9kZWNvZGVyKTtcblxuICAgIHRoaXMuX2VuY29kZXIgPSBuZXcgUGxpc3RTZXJ2aWNlRW5jb2RlcigpO1xuICAgIHRoaXMuX2VuY29kZXIucGlwZSh0aGlzLl9zb2NrZXRDbGllbnQpO1xuXG4gICAgdGhpcy5yZXBseVF1ZXVlID0gW107XG4gICAgdGhpcy5fZGVjb2Rlci5vbignZGF0YScsIChkYXRhKSA9PiB0aGlzLnJlcGx5UXVldWUucHVzaChkYXRhKSk7XG4gIH1cblxuICBhc3luYyBzZW5kUGxpc3RBbmRSZWNlaXZlIChqc29uLCB0aW1lb3V0ID0gNTAwMCkge1xuICAgIHRoaXMuc2VuZFBsaXN0KGpzb24pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlY2VpdmVQbGlzdCh0aW1lb3V0KTtcbiAgfVxuXG4gIHNlbmRQbGlzdCAoanNvbikge1xuICAgIGlmICghanNvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW50IHNlbmQgYSBudWxsIGEgb2JqZWN0Jyk7XG4gICAgfVxuICAgIHRoaXMuX2VuY29kZXIud3JpdGUoanNvbik7XG4gIH1cblxuICBhc3luYyByZWNlaXZlUGxpc3QgKHRpbWVvdXQgPSA1MDAwKSB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBCKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHF1ZXVlID0gdGhpcy5yZXBseVF1ZXVlO1xuICAgICAgY29uc3QgZGF0YSA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBjaGVja0V4aXN0ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBjb25zdCBkYXRhID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoY2hlY2tFeGlzdCk7XG4gICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICB9LCBDSEVDS19GUkVRX01TKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjbGVhckludGVydmFsKGNoZWNrRXhpc3QpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gcmVjZWl2ZSBhbnkgZGF0YSB3aXRoaW4gdGhlIHRpbWVvdXQ6ICR7dGltZW91dH1gKSk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZVNlc3Npb25TU0wgKGhvc3RQcml2YXRlS2V5LCBob3N0Q2VydGlmaWNhdGUpIHtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQudW5waXBlKHRoaXMuX3NwbGl0dGVyKTtcbiAgICB0aGlzLl9zcGxpdHRlci51bnBpcGUodGhpcy5fZGVjb2Rlcik7XG4gICAgdGhpcy5fZW5jb2Rlci51bnBpcGUodGhpcy5fc29ja2V0Q2xpZW50KTtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQgPSB1cGdyYWRlVG9TU0wodGhpcy5fc29ja2V0Q2xpZW50LCBob3N0UHJpdmF0ZUtleSwgaG9zdENlcnRpZmljYXRlKTtcbiAgICB0aGlzLl9lbmNvZGVyLnBpcGUodGhpcy5fc29ja2V0Q2xpZW50KTtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQucGlwZSh0aGlzLl9zcGxpdHRlcikucGlwZSh0aGlzLl9kZWNvZGVyKTtcbiAgfVxuXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLl9zb2NrZXRDbGllbnQuZGVzdHJveSgpO1xuICB9XG59XG5cbmV4cG9ydCB7IFBsaXN0U2VydmljZSB9O1xuZXhwb3J0IGRlZmF1bHQgUGxpc3RTZXJ2aWNlOyJdLCJmaWxlIjoibGliL3BsaXN0LXNlcnZpY2UvaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
