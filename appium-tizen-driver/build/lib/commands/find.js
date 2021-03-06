"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

let helpers = {},
    extensions = {};
exports.helpers = helpers;
let elements = {};
let index = 0;

helpers.doFindElementOrEls = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (params) {
    let strategy = "automationId";

    if (params.strategy === "name") {
      strategy = params.strategy;
    }

    let param = {
      "elementId": params.selector,
      strategy
    };
    let result = yield this.bootstrap.sendAction('find', param);

    if (!_lodash.default.isEmpty(result)) {
      result.forEach(function (element) {
        index++;
        elements[index] = element.ELEMENT;
        element.ELEMENT = `${index}`;
      });

      if (!params.multiple) {
        result = result[0];
      }
    }

    return result;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

helpers.findElOrEls = function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (strategy, selector, mult, context = '') {
    var _this = this;

    this.validateLocatorStrategy(strategy);

    if (!selector) {
      throw new Error("Must provide a selector when finding elements");
    }

    let params = {
      strategy,
      selector,
      context,
      multiple: mult
    };
    let element;

    let doFind = function () {
      var _ref3 = (0, _asyncToGenerator2.default)(function* () {
        try {
          element = yield _this.doFindElementOrEls(params);
        } catch (err) {
          if ((0, _appiumBaseDriver.isErrorType)(err, _appiumBaseDriver.errors.NoSuchElementError)) {
            return false;
          }

          throw err;
        }

        return !_lodash.default.isEmpty(element);
      });

      return function doFind() {
        return _ref3.apply(this, arguments);
      };
    }();

    try {
      yield this.implicitWaitForCondition(doFind);
    } catch (err) {
      if (err.message && err.message.match(/Condition unmet/)) {
        element = [];
      } else {
        throw err;
      }
    }

    if (mult) {
      return element;
    } else {
      if (_lodash.default.isEmpty(element)) {
        throw new _appiumBaseDriver.errors.NoSuchElementError();
      }

      return element;
    }
  });

  return function (_x2, _x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

helpers.getAutomationId = function (elementId) {
  let result = elements[elementId];

  if (!result) {
    result = "";
  }

  return result;
};

Object.assign(extensions, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9maW5kLmpzIl0sIm5hbWVzIjpbImhlbHBlcnMiLCJleHRlbnNpb25zIiwiZWxlbWVudHMiLCJpbmRleCIsImRvRmluZEVsZW1lbnRPckVscyIsInBhcmFtcyIsInN0cmF0ZWd5IiwicGFyYW0iLCJzZWxlY3RvciIsInJlc3VsdCIsImJvb3RzdHJhcCIsInNlbmRBY3Rpb24iLCJfIiwiaXNFbXB0eSIsImZvckVhY2giLCJlbGVtZW50IiwiRUxFTUVOVCIsIm11bHRpcGxlIiwiZmluZEVsT3JFbHMiLCJtdWx0IiwiY29udGV4dCIsInZhbGlkYXRlTG9jYXRvclN0cmF0ZWd5IiwiRXJyb3IiLCJkb0ZpbmQiLCJlcnIiLCJlcnJvcnMiLCJOb1N1Y2hFbGVtZW50RXJyb3IiLCJpbXBsaWNpdFdhaXRGb3JDb25kaXRpb24iLCJtZXNzYWdlIiwibWF0Y2giLCJnZXRBdXRvbWF0aW9uSWQiLCJlbGVtZW50SWQiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUEsSUFBSUEsT0FBTyxHQUFHLEVBQWQ7QUFBQSxJQUFrQkMsVUFBVSxHQUFHLEVBQS9COztBQUVBLElBQUlDLFFBQVEsR0FBRyxFQUFmO0FBQ0EsSUFBSUMsS0FBSyxHQUFHLENBQVo7O0FBRUFILE9BQU8sQ0FBQ0ksa0JBQVI7QUFBQSw2Q0FBNkIsV0FBZ0JDLE1BQWhCLEVBQXdCO0FBQ25ELFFBQUlDLFFBQVEsR0FBRyxjQUFmOztBQUVBLFFBQUlELE1BQU0sQ0FBQ0MsUUFBUCxLQUFvQixNQUF4QixFQUFnQztBQUM5QkEsTUFBQUEsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQWxCO0FBQ0Q7O0FBRUQsUUFBSUMsS0FBSyxHQUFHO0FBQUUsbUJBQWFGLE1BQU0sQ0FBQ0csUUFBdEI7QUFBZ0NGLE1BQUFBO0FBQWhDLEtBQVo7QUFDQSxRQUFJRyxNQUFNLFNBQVMsS0FBS0MsU0FBTCxDQUFlQyxVQUFmLENBQTBCLE1BQTFCLEVBQWtDSixLQUFsQyxDQUFuQjs7QUFFQSxRQUFJLENBQUNLLGdCQUFFQyxPQUFGLENBQVVKLE1BQVYsQ0FBTCxFQUF3QjtBQUN0QkEsTUFBQUEsTUFBTSxDQUFDSyxPQUFQLENBQWUsVUFBVUMsT0FBVixFQUFtQjtBQUNsQ1osUUFBQUEsS0FBSztBQUNIRCxRQUFBQSxRQUFRLENBQUNDLEtBQUQsQ0FBUixHQUFrQlksT0FBTyxDQUFDQyxPQUExQjtBQUNBRCxRQUFBQSxPQUFPLENBQUNDLE9BQVIsR0FBbUIsR0FBRWIsS0FBTSxFQUEzQjtBQUNELE9BSkQ7O0FBS0EsVUFBSSxDQUFDRSxNQUFNLENBQUNZLFFBQVosRUFBc0I7QUFDcEJSLFFBQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDLENBQUQsQ0FBZjtBQUNIO0FBQ0E7O0FBRUQsV0FBT0EsTUFBUDtBQUNELEdBdEJEOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQXdCQVQsT0FBTyxDQUFDa0IsV0FBUjtBQUFBLDhDQUFzQixXQUFnQlosUUFBaEIsRUFBMEJFLFFBQTFCLEVBQW9DVyxJQUFwQyxFQUEwQ0MsT0FBTyxHQUFHLEVBQXBELEVBQXdEO0FBQUE7O0FBQzVFLFNBQUtDLHVCQUFMLENBQTZCZixRQUE3Qjs7QUFFQSxRQUFJLENBQUNFLFFBQUwsRUFBZTtBQUNiLFlBQU0sSUFBSWMsS0FBSixDQUFVLCtDQUFWLENBQU47QUFDRDs7QUFFRCxRQUFJakIsTUFBTSxHQUFHO0FBQ1hDLE1BQUFBLFFBRFc7QUFFWEUsTUFBQUEsUUFGVztBQUdYWSxNQUFBQSxPQUhXO0FBSVhILE1BQUFBLFFBQVEsRUFBRUU7QUFKQyxLQUFiO0FBT0EsUUFBSUosT0FBSjs7QUFDQSxRQUFJUSxNQUFNO0FBQUEsa0RBQUcsYUFBWTtBQUN2QixZQUFJO0FBQ0ZSLFVBQUFBLE9BQU8sU0FBUyxLQUFJLENBQUNYLGtCQUFMLENBQXdCQyxNQUF4QixDQUFoQjtBQUNELFNBRkQsQ0FFRSxPQUFPbUIsR0FBUCxFQUFZO0FBQ1osY0FBSSxtQ0FBWUEsR0FBWixFQUFpQkMseUJBQU9DLGtCQUF4QixDQUFKLEVBQWlEO0FBQy9DLG1CQUFPLEtBQVA7QUFDRDs7QUFDRCxnQkFBTUYsR0FBTjtBQUNEOztBQUVELGVBQU8sQ0FBQ1osZ0JBQUVDLE9BQUYsQ0FBVUUsT0FBVixDQUFSO0FBQ0QsT0FYUzs7QUFBQSxzQkFBTlEsTUFBTTtBQUFBO0FBQUE7QUFBQSxPQUFWOztBQWFBLFFBQUk7QUFDRixZQUFNLEtBQUtJLHdCQUFMLENBQThCSixNQUE5QixDQUFOO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLEdBQVAsRUFBWTtBQUNaLFVBQUlBLEdBQUcsQ0FBQ0ksT0FBSixJQUFlSixHQUFHLENBQUNJLE9BQUosQ0FBWUMsS0FBWixDQUFrQixpQkFBbEIsQ0FBbkIsRUFBeUQ7QUFDdkRkLFFBQUFBLE9BQU8sR0FBRyxFQUFWO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsY0FBTVMsR0FBTjtBQUNEO0FBQ0Y7O0FBRUMsUUFBSUwsSUFBSixFQUFVO0FBQ1IsYUFBT0osT0FBUDtBQUNILEtBRkMsTUFFSztBQUNMLFVBQUlILGdCQUFFQyxPQUFGLENBQVVFLE9BQVYsQ0FBSixFQUF3QjtBQUN4QixjQUFNLElBQUlVLHlCQUFPQyxrQkFBWCxFQUFOO0FBQ0Q7O0FBQ0MsYUFBT1gsT0FBUDtBQUNEO0FBQ0YsR0E5Q0Q7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBZ0RBZixPQUFPLENBQUM4QixlQUFSLEdBQTBCLFVBQVVDLFNBQVYsRUFBcUI7QUFDN0MsTUFBSXRCLE1BQU0sR0FBR1AsUUFBUSxDQUFDNkIsU0FBRCxDQUFyQjs7QUFDQSxNQUFJLENBQUN0QixNQUFMLEVBQWE7QUFDWEEsSUFBQUEsTUFBTSxHQUFHLEVBQVQ7QUFDRDs7QUFDRCxTQUFPQSxNQUFQO0FBQ0QsQ0FORDs7QUFRQXVCLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjaEMsVUFBZCxFQUEwQkQsT0FBMUI7ZUFFZUMsVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBlcnJvcnMsIGlzRXJyb3JUeXBlIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcblxubGV0IGhlbHBlcnMgPSB7fSwgZXh0ZW5zaW9ucyA9IHt9O1xuXG5sZXQgZWxlbWVudHMgPSB7fTtcbmxldCBpbmRleCA9IDA7XG5cbmhlbHBlcnMuZG9GaW5kRWxlbWVudE9yRWxzID0gYXN5bmMgZnVuY3Rpb24gKHBhcmFtcykge1xuICBsZXQgc3RyYXRlZ3kgPSBcImF1dG9tYXRpb25JZFwiO1xuXG4gIGlmIChwYXJhbXMuc3RyYXRlZ3kgPT09IFwibmFtZVwiKSB7XG4gICAgc3RyYXRlZ3kgPSBwYXJhbXMuc3RyYXRlZ3k7XG4gIH1cblxuICBsZXQgcGFyYW0gPSB7IFwiZWxlbWVudElkXCI6IHBhcmFtcy5zZWxlY3Rvciwgc3RyYXRlZ3kgfTtcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ2ZpbmQnLCBwYXJhbSk7XG5cbiAgaWYgKCFfLmlzRW1wdHkocmVzdWx0KSkge1xuICAgIHJlc3VsdC5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgaW5kZXgrKztcbiAgICAgIGVsZW1lbnRzW2luZGV4XSA9IGVsZW1lbnQuRUxFTUVOVDtcbiAgICAgIGVsZW1lbnQuRUxFTUVOVCA9IGAke2luZGV4fWA7XG4gICAgfSk7XG4gICAgaWYgKCFwYXJhbXMubXVsdGlwbGUpIHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdFswXTtcbiAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmhlbHBlcnMuZmluZEVsT3JFbHMgPSBhc3luYyBmdW5jdGlvbiAoc3RyYXRlZ3ksIHNlbGVjdG9yLCBtdWx0LCBjb250ZXh0ID0gJycpIHtcbiAgdGhpcy52YWxpZGF0ZUxvY2F0b3JTdHJhdGVneShzdHJhdGVneSk7XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBhIHNlbGVjdG9yIHdoZW4gZmluZGluZyBlbGVtZW50c1wiKTtcbiAgfVxuXG4gIGxldCBwYXJhbXMgPSB7XG4gICAgc3RyYXRlZ3ksXG4gICAgc2VsZWN0b3IsXG4gICAgY29udGV4dCxcbiAgICBtdWx0aXBsZTogbXVsdFxuICB9O1xuXG4gIGxldCBlbGVtZW50O1xuICBsZXQgZG9GaW5kID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBlbGVtZW50ID0gYXdhaXQgdGhpcy5kb0ZpbmRFbGVtZW50T3JFbHMocGFyYW1zKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChpc0Vycm9yVHlwZShlcnIsIGVycm9ycy5Ob1N1Y2hFbGVtZW50RXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gIV8uaXNFbXB0eShlbGVtZW50KTtcbiAgfTtcblxuICB0cnkge1xuICAgIGF3YWl0IHRoaXMuaW1wbGljaXRXYWl0Rm9yQ29uZGl0aW9uKGRvRmluZCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSAmJiBlcnIubWVzc2FnZS5tYXRjaCgvQ29uZGl0aW9uIHVubWV0LykpIHtcbiAgICAgIGVsZW1lbnQgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gICAgaWYgKG11bHQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIGlmIChfLmlzRW1wdHkoZWxlbWVudCkpIHtcbiAgICB0aHJvdyBuZXcgZXJyb3JzLk5vU3VjaEVsZW1lbnRFcnJvcigpO1xuICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbn07XG5cbmhlbHBlcnMuZ2V0QXV0b21hdGlvbklkID0gZnVuY3Rpb24gKGVsZW1lbnRJZCkge1xuICBsZXQgcmVzdWx0ID0gZWxlbWVudHNbZWxlbWVudElkXTtcbiAgaWYgKCFyZXN1bHQpIHtcbiAgICByZXN1bHQgPSBcIlwiO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5PYmplY3QuYXNzaWduKGV4dGVuc2lvbnMsIGhlbHBlcnMpO1xuZXhwb3J0IHsgaGVscGVycyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2ZpbmQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
