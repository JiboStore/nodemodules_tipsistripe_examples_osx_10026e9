"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _logger = _interopRequireDefault(require("./logger"));

var _lodash = _interopRequireDefault(require("lodash"));

const MESSAGE_TYPES = ['error', 'no data', 'regular', 'chunk', 'last chunk'];
const UNKNOWN_ERROR = {
  status: 13,
  value: 'Error parsing socket data from instruments'
};

class UIAutoResponse {
  constructor() {
    this.bufferedData = '';
    this.resultBuffer = '';
  }

  resetBuffer() {
    this.bufferedData = '';
  }

  addData(data) {
    this.bufferedData += data;
  }

  finalizeData() {
    let data = this.bufferedData;
    this.bufferedData = '';
    let parsedData;

    try {
      parsedData = {
        type: MESSAGE_TYPES[parseInt(data[0], 10)]
      };

      if (parsedData.type !== 'no data') {
        parsedData.result = data.substring(2);
      }
    } catch (err) {
      _logger.default.error(`Could not parse data from socket: ${err}`);

      _logger.default.error(data);

      parsedData = {
        type: 'error',
        error: UNKNOWN_ERROR
      };
    }

    return parsedData;
  }

  getResult() {
    let data = this.finalizeData();

    if (!_lodash.default.isUndefined(data.result) && data.result !== false) {
      if (data.result) {
        _logger.default.debug(`Got result from instruments: ${data.result.slice(0, 300)}`);
      } else {
        _logger.default.debug('Got null result from instruments');
      }

      if (data.type && data.type.indexOf('chunk') !== -1) {
        this.resultBuffer += data.result;

        _logger.default.debug(`Got chunk data, current resultBuffer length: ${this.resultBuffer.length}`);

        if (data.type === 'last chunk') {
          _logger.default.debug(`This is the last data final length: ${this.resultBuffer.length}`);

          let result;

          try {
            result = JSON.parse(this.resultBuffer);
          } catch (err) {
            _logger.default.error(`Could not parse result buffer: ${err}`);

            result = UNKNOWN_ERROR;
          }

          this.resultBuffer = '';
          return result;
        } else {
          _logger.default.debug('Not the last chunk, trying to get more');

          return {
            needsMoreData: true
          };
        }
      } else {
        let result;

        try {
          result = JSON.parse(data.result);
        } catch (err) {
          _logger.default.error(`Could not parse result buffer: ${err}`);

          result = UNKNOWN_ERROR;
        }

        return result;
      }
    } else {
      return null;
    }
  }

}

var _default = UIAutoResponse;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91aWF1dG8vdWlhdXRvLXJlc3BvbnNlLmpzIl0sIm5hbWVzIjpbIk1FU1NBR0VfVFlQRVMiLCJVTktOT1dOX0VSUk9SIiwic3RhdHVzIiwidmFsdWUiLCJVSUF1dG9SZXNwb25zZSIsImNvbnN0cnVjdG9yIiwiYnVmZmVyZWREYXRhIiwicmVzdWx0QnVmZmVyIiwicmVzZXRCdWZmZXIiLCJhZGREYXRhIiwiZGF0YSIsImZpbmFsaXplRGF0YSIsInBhcnNlZERhdGEiLCJ0eXBlIiwicGFyc2VJbnQiLCJyZXN1bHQiLCJzdWJzdHJpbmciLCJlcnIiLCJsb2dnZXIiLCJlcnJvciIsImdldFJlc3VsdCIsIl8iLCJpc1VuZGVmaW5lZCIsImRlYnVnIiwic2xpY2UiLCJpbmRleE9mIiwibGVuZ3RoIiwiSlNPTiIsInBhcnNlIiwibmVlZHNNb3JlRGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFFQSxNQUFNQSxhQUFhLEdBQUcsQ0FBQyxPQUFELEVBQVUsU0FBVixFQUFxQixTQUFyQixFQUFnQyxPQUFoQyxFQUF5QyxZQUF6QyxDQUF0QjtBQUVBLE1BQU1DLGFBQWEsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFLEVBRFk7QUFFcEJDLEVBQUFBLEtBQUssRUFBRTtBQUZhLENBQXRCOztBQVNBLE1BQU1DLGNBQU4sQ0FBcUI7QUFDbkJDLEVBQUFBLFdBQVcsR0FBSTtBQUNiLFNBQUtDLFlBQUwsR0FBb0IsRUFBcEI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0Q7O0FBRURDLEVBQUFBLFdBQVcsR0FBSTtBQUNiLFNBQUtGLFlBQUwsR0FBb0IsRUFBcEI7QUFDRDs7QUFFREcsRUFBQUEsT0FBTyxDQUFFQyxJQUFGLEVBQVE7QUFDYixTQUFLSixZQUFMLElBQXFCSSxJQUFyQjtBQUNEOztBQUVEQyxFQUFBQSxZQUFZLEdBQUk7QUFDZCxRQUFJRCxJQUFJLEdBQUcsS0FBS0osWUFBaEI7QUFDQSxTQUFLQSxZQUFMLEdB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ICcuL2xvZ2dlcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuXG5jb25zdCBNRVNTQUdFX1RZUEVTID0gWydlcnJvcicsICdubyBkYXRhJywgJ3JlZ3VsYXInLCAnY2h1bmsnLCAnbGFzdCBjaHVuayddO1xuXG5jb25zdCBVTktOT1dOX0VSUk9SID0ge1xuICBzdGF0dXM6IDEzLFxuICB2YWx1ZTogJ0Vycm9yIHBhcnNpbmcgc29ja2V0IGRhdGEgZnJvbSBpbnN0cnVtZW50cydcbn07XG5cblxuLypcbiAqIE9iamVjdCB0byBjb250YWluIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gdGhlIFVJIEF1dG9tYXRpb24gc3lzdGVtLlxuICovXG5jbGFzcyBVSUF1dG9SZXNwb25zZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmJ1ZmZlcmVkRGF0YSA9ICcnO1xuICAgIHRoaXMucmVzdWx0QnVmZmVyID0gJyc7XG4gIH1cblxuICByZXNldEJ1ZmZlciAoKSB7XG4gICAgdGhpcy5idWZmZXJlZERhdGEgPSAnJztcbiAgfVxuXG4gIGFkZERhdGEgKGRhdGEpIHtcbiAgICB0aGlzLmJ1ZmZlcmVkRGF0YSArPSBkYXRhO1xuICB9XG5cbiAgZmluYWxpemVEYXRhICgpIHtcbiAgICBsZXQgZGF0YSA9IHRoaXMuYnVmZmVyZWREYXRhO1xuICAgIHRoaXMuYnVmZmVyZWREYXRhID0gJyc7XG5cbiAgICAvLyB0cnkgdG8gZmlndXJlIG91dCB3aGF0IHR5cGUgb2YgZGF0YSB3ZSBoYXZlLCBhbmQgcmV0dXJuIGl0XG4gICAgbGV0IHBhcnNlZERhdGE7XG4gICAgdHJ5IHtcbiAgICAgIHBhcnNlZERhdGEgPSB7XG4gICAgICAgIHR5cGU6IE1FU1NBR0VfVFlQRVNbcGFyc2VJbnQoZGF0YVswXSwgMTApXSxcbiAgICAgIH07XG4gICAgICBpZiAocGFyc2VkRGF0YS50eXBlICE9PSAnbm8gZGF0YScpIHtcbiAgICAgICAgLy8gZm9ybWF0IGlzIDxvbmUgY2hhciBtZXNzYWdlIHR5cGU+LDxEQVRBPlxuICAgICAgICBwYXJzZWREYXRhLnJlc3VsdCA9IGRhdGEuc3Vic3RyaW5nKDIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nZ2VyLmVycm9yKGBDb3VsZCBub3QgcGFyc2UgZGF0YSBmcm9tIHNvY2tldDogJHtlcnJ9YCk7XG4gICAgICBsb2dnZXIuZXJyb3IoZGF0YSk7XG4gICAgICBwYXJzZWREYXRhID0ge1xuICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICBlcnJvcjogVU5LTk9XTl9FUlJPUlxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VkRGF0YTtcbiAgfVxuXG4gIGdldFJlc3VsdCAoKSB7XG4gICAgbGV0IGRhdGEgPSB0aGlzLmZpbmFsaXplRGF0YSgpO1xuXG4gICAgaWYgKCFfLmlzVW5kZWZpbmVkKGRhdGEucmVzdWx0KSAmJiBkYXRhLnJlc3VsdCAhPT0gZmFsc2UpIHtcbiAgICAgIC8vIHdlIGhhdmUgYSByZXN1bHQsIHRyeSB0byBtYWtlIHVzZSBvZiBpdFxuICAgICAgaWYgKGRhdGEucmVzdWx0KSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgR290IHJlc3VsdCBmcm9tIGluc3RydW1lbnRzOiAke2RhdGEucmVzdWx0LnNsaWNlKDAsIDMwMCl9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2dnZXIuZGVidWcoJ0dvdCBudWxsIHJlc3VsdCBmcm9tIGluc3RydW1lbnRzJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUgJiYgZGF0YS50eXBlLmluZGV4T2YoJ2NodW5rJykgIT09IC0xKSB7XG4gICAgICAgIC8vIGEgXCJjaHVua1wiIG9mIGRhdGEsIHNvIGFkZCB0byBvdXIgYnVmZmVyXG4gICAgICAgIHRoaXMucmVzdWx0QnVmZmVyICs9IGRhdGEucmVzdWx0O1xuICAgICAgICBsb2dnZXIuZGVidWcoYEdvdCBjaHVuayBkYXRhLCBjdXJyZW50IHJlc3VsdEJ1ZmZlciBsZW5ndGg6ICR7dGhpcy5yZXN1bHRCdWZmZXIubGVuZ3RofWApO1xuICAgICAgICBpZiAoZGF0YS50eXBlID09PSAnbGFzdCBjaHVuaycpIHtcbiAgICAgICAgICBsb2dnZXIuZGVidWcoYFRoaXMgaXMgdGhlIGxhc3QgZGF0YSBmaW5hbCBsZW5ndGg6ICR7dGhpcy5yZXN1bHRCdWZmZXIubGVuZ3RofWApO1xuICAgICAgICAgIC8vIHRoaXMgaXMgdGhlIGxhc3Qgcm93LCB1bnBhY2sgYW5kIHJldHVybiByZXNwb25zZVxuICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5yZXN1bHRCdWZmZXIpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGBDb3VsZCBub3QgcGFyc2UgcmVzdWx0IGJ1ZmZlcjogJHtlcnJ9YCk7XG4gICAgICAgICAgICByZXN1bHQgPSBVTktOT1dOX0VSUk9SO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlc3VsdEJ1ZmZlciA9ICcnO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nZ2VyLmRlYnVnKCdOb3QgdGhlIGxhc3QgY2h1bmssIHRyeWluZyB0byBnZXQgbW9yZScpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuZWVkc01vcmVEYXRhOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm90IGEgXCJjaHVua1wiLCBzbyBwYXJzZSBhbmQgcmV0dXJuXG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShkYXRhLnJlc3VsdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGxvZ2dlci5lcnJvcihgQ291bGQgbm90IHBhcnNlIHJlc3VsdCBidWZmZXI6ICR7ZXJyfWApO1xuICAgICAgICAgIHJlc3VsdCA9IFVOS05PV05fRVJST1I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2UgaGF2ZSBubyByZXN1bHRcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBVSUF1dG9SZXNwb25zZTtcbiJdLCJmaWxlIjoibGliL3VpYXV0by91aWF1dG8tcmVzcG9uc2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==