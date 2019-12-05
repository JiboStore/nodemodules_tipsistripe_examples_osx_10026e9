"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IOSLog = void 0;

require("source-map-support/register");

var _events = require("events");

const MAX_LOG_ENTRIES_COUNT = 10000;

class IOSLog extends _events.EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.logIdxSinceLastRequest = -1;
    this.maxBufferSize = MAX_LOG_ENTRIES_COUNT;
  }

  async startCapture() {
    throw new Error(`Sub-classes need to implement a 'startCapture' function`);
  }

  async stopCapture() {
    throw new Error(`Sub-classes need to implement a 'stopCapture' function`);
  }

  get isCapturing() {
    throw new Error(`Sub-classes need to implement a 'isCapturing' function`);
  }

  broadcast(logLine) {
    const logObj = {
      timestamp: Date.now(),
      level: 'ALL',
      message: logLine
    };
    this.logs.push(logObj);
    this.emit('output', logObj);

    if (this.logs.length > this.maxBufferSize) {
      this.logs.shift();

      if (this.logIdxSinceLastRequest > 0) {
        --this.logIdxSinceLastRequest;
      }
    }
  }

  getLogs() {
    if (this.logs.length && this.logIdxSinceLastRequest < this.logs.length) {
      let result = this.logs;

      if (this.logIdxSinceLastRequest > 0) {
        result = result.slice(this.logIdxSinceLastRequest);
      }

      this.logIdxSinceLastRequest = this.logs.length;
      return result;
    }

    return [];
  }

  getAllLogs() {
    return this.logs;
  }

}

exports.IOSLog = IOSLog;
var _default = IOSLog;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kZXZpY2UtbG9nL2lvcy1sb2cuanMiXSwibmFtZXMiOlsiTUFYX0xPR19FTlRSSUVTX0NPVU5UIiwiSU9TTG9nIiwiRXZlbnRFbWl0dGVyIiwiY29uc3RydWN0b3IiLCJsb2dzIiwibG9nSWR4U2luY2VMYXN0UmVxdWVzdCIsIm1heEJ1ZmZlclNpemUiLCJzdGFydENhcHR1cmUiLCJFcnJvciIsInN0b3BDYXB0dXJlIiwiaXNDYXB0dXJpbmciLCJicm9hZGNhc3QiLCJsb2dMaW5lIiwibG9nT2JqIiwidGltZXN0YW1wIiwiRGF0ZSIsIm5vdyIsImxldmVsIiwibWVzc2FnZSIsInB1c2giLCJlbWl0IiwibGVuZ3RoIiwic2hpZnQiLCJnZXRMb2dzIiwicmVzdWx0Iiwic2xpY2UiLCJnZXRBbGxMb2dzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFHQSxNQUFNQSxxQkFBcUIsR0FBRyxLQUE5Qjs7QUFFQSxNQUFNQyxNQUFOLFNBQXFCQyxvQkFBckIsQ0FBa0M7QUFFaENDLEVBQUFBLFdBQVcsR0FBSTtBQUNiO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLEVBQVo7QUFDQSxTQUFLQyxzQkFBTCxHQUE4QixDQUFDLENBQS9CO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQk4scUJBQXJCO0FBQ0Q7O0FBRUQsUUFBTU8sWUFBTixHQUFzQjtBQUNwQixVQUFNLElBQUlDLEtBQUosQ0FBVyx5REFBWCxDQUFOO0FBQ0Q7O0FBRUQsUUFBTUMsV0FBTixHQUFxQjtBQUNuQixVQUFNLElBQUlELEtBQUosQ0FBVyx3REFBWCxDQUFOO0FBQ0Q7O0FBRUQsTUFBSUUsV0FBSixHQUFtQjtBQUNqQixVQUFNLElBQUlGLEtBQUosQ0FBVyx3REFBWCxDQUFOO0FBQ0Q7O0FBRURHLEVBQUFBLFNBQVMsQ0FBRUMsT0FBRixFQUFXO0FBQ2xCLFVBQU1DLE1BQU0sR0FBRztBQUNiQyxNQUFBQSxTQUFTLEVBQUVDLElBQUksQ0FBQ0MsR0FBTCxFQURFO0FBRWJDLE1BQUFBLEtBQUssRUFBRSxLQUZNO0FBR2JDLE1BQUFBLE9BQU8sRUFBRU47QUFISSxLQUFmO0FBS0EsU0FBS1IsSUFBTCxDQUFVZSxJQUFWLENBQWVOLE1BQWY7QUFDQSxTQUFLTyxJQUFMLENBQVUsUUFBVixFQUFvQlAsTUFBcEI7O0FBQ0EsUUFBSSxLQUFLVCxJQUFMLENBQVVpQixNQUFWLEdBQW1CLEtBQUtmLGFBQTVCLEVBQTJDO0FBQ3pDLFdBQUtGLElBQUwsQ0FBVWtCLEtBQVY7O0FBQ0EsVUFBSSxLQUFLakIsc0JBQUwsR0FBOEIsQ0FBbEMsRUFBcUM7QUFDbkMsVUFBRSxLQUFLQSxzQkFBUDtBQUNEO0FBQ0Y7QUFDRjs7QUFFRGtCLEVBQUFBLE9BQU8sR0FBSTtBQUNULFFBQUksS0FBS25CLElBQUwsQ0FBVWlCLE1BQVYsSUFBb0IsS0FBS2hCLHNCQUFMLEdBQThCLEtBQUtELElBQUwsQ0FBVWlCLE1BQWhFLEVBQXdFO0FBQ3RFLFVBQUlHLE1BQU0sR0FBRyxLQUFLcEIsSUFBbEI7O0FBQ0EsVUFBSSxLQUFLQyxzQkFBTCxHQUE4QixDQUFsQyxFQUFxQztBQUNuQ21CLFFBQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDQyxLQUFQLENBQWEsS0FBS3BCLHNCQUFsQixDQUFUO0FBQ0Q7O0FBQ0QsV0FBS0Esc0JBQUwsR0FBOEIsS0FBS0QsSUFBTCxDQUFVaUIsTUFBeEM7QUFDQSxhQUFPRyxNQUFQO0FBQ0Q7O0FBQ0QsV0FBTyxFQUFQO0FBQ0Q7O0FBRURFLEVBQUFBLFVBQVUsR0FBSTtBQUNaLFdBQU8sS0FBS3RCLElBQVo7QUFDRDs7QUFuRCtCOzs7ZUF1RG5CSCxNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcblxuLy8gV2Uga2VlcCBvbmx5IHRoZSBtb3N0IHJlY2VudCBsb2cgZW50cmllcyB0byBhdm9pZCBvdXQgb2YgbWVtb3J5IGVycm9yXG5jb25zdCBNQVhfTE9HX0VOVFJJRVNfQ09VTlQgPSAxMDAwMDtcblxuY2xhc3MgSU9TTG9nIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmxvZ3MgPSBbXTtcbiAgICB0aGlzLmxvZ0lkeFNpbmNlTGFzdFJlcXVlc3QgPSAtMTtcbiAgICB0aGlzLm1heEJ1ZmZlclNpemUgPSBNQVhfTE9HX0VOVFJJRVNfQ09VTlQ7XG4gIH1cblxuICBhc3luYyBzdGFydENhcHR1cmUgKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFN1Yi1jbGFzc2VzIG5lZWQgdG8gaW1wbGVtZW50IGEgJ3N0YXJ0Q2FwdHVyZScgZnVuY3Rpb25gKTtcbiAgfVxuXG4gIGFzeW5jIHN0b3BDYXB0dXJlICgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZXF1aXJlLWF3YWl0XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdWItY2xhc3NlcyBuZWVkIHRvIGltcGxlbWVudCBhICdzdG9wQ2FwdHVyZScgZnVuY3Rpb25gKTtcbiAgfVxuXG4gIGdldCBpc0NhcHR1cmluZyAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdWItY2xhc3NlcyBuZWVkIHRvIGltcGxlbWVudCBhICdpc0NhcHR1cmluZycgZnVuY3Rpb25gKTtcbiAgfVxuXG4gIGJyb2FkY2FzdCAobG9nTGluZSkge1xuICAgIGNvbnN0IGxvZ09iaiA9IHtcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIGxldmVsOiAnQUxMJyxcbiAgICAgIG1lc3NhZ2U6IGxvZ0xpbmVcbiAgICB9O1xuICAgIHRoaXMubG9ncy5wdXNoKGxvZ09iaik7XG4gICAgdGhpcy5lbWl0KCdvdXRwdXQnLCBsb2dPYmopO1xuICAgIGlmICh0aGlzLmxvZ3MubGVuZ3RoID4gdGhpcy5tYXhCdWZmZXJTaXplKSB7XG4gICAgICB0aGlzLmxvZ3Muc2hpZnQoKTtcbiAgICAgIGlmICh0aGlzLmxvZ0lkeFNpbmNlTGFzdFJlcXVlc3QgPiAwKSB7XG4gICAgICAgIC0tdGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldExvZ3MgKCkge1xuICAgIGlmICh0aGlzLmxvZ3MubGVuZ3RoICYmIHRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdCA8IHRoaXMubG9ncy5sZW5ndGgpIHtcbiAgICAgIGxldCByZXN1bHQgPSB0aGlzLmxvZ3M7XG4gICAgICBpZiAodGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0ID4gMCkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UodGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdCA9IHRoaXMubG9ncy5sZW5ndGg7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBnZXRBbGxMb2dzICgpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dzO1xuICB9XG59XG5cbmV4cG9ydCB7IElPU0xvZyB9O1xuZXhwb3J0IGRlZmF1bHQgSU9TTG9nO1xuIl0sImZpbGUiOiJsaWIvZGV2aWNlLWxvZy9pb3MtbG9nLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=