"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _logger = _interopRequireDefault(require("../logger"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _appiumBaseDriver = require("appium-base-driver");

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

commands.doTouchAction = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (action, opts) {
    switch (action) {
      case 'tap':
        return yield this.tap(opts.element, opts.x, opts.y, opts.count);

      case 'press':
        return yield this.touchDown(opts.x, opts.y, opts.element);

      case 'release':
        return yield this.touchUp(opts.x, opts.y, opts.element);

      case 'moveTo':
        return yield this.touchMove(opts.x, opts.y, opts.element);

      case 'wait':
        return yield _bluebird.default.delay(opts.ms);

      case 'longPress':
        if (typeof opts.duration === 'undefined' || !opts.duration) {
          opts.duration = 2000;
        }

        return yield this.touchLongClick(opts.element, opts.x, opts.y, opts.duration);

      default:
        _logger.default.errorAndThrow(`unknown action ${action}`);

    }
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

commands.performGesture = function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (gesture) {
    try {
      return yield this.doTouchAction(gesture.action, gesture.options || {});
    } catch (e) {
      if ((0, _appiumBaseDriver.isErrorType)(e, _appiumBaseDriver.errors.NoSuchElementError) && gesture.action === 'release' && gesture.options.element) {
        delete gesture.options.element;

        _logger.default.debug(`retrying release without element opts: ${gesture.options}.`);

        return yield this.doTouchAction(gesture.action, gesture.options || {});
      }

      throw e;
    }
  });

  return function (_x3) {
    return _ref2.apply(this, arguments);
  };
}();

commands.performTouch = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (gestures) {
    let result = true;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = gestures[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let g = _step.value;

        if (!(yield this.performGesture(g))) {
          result = false;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  });

  return function (_x4) {
    return _ref3.apply(this, arguments);
  };
}();

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy90b3VjaC5qcyJdLCJuYW1lcyI6WyJjb21tYW5kcyIsImhlbHBlcnMiLCJleHRlbnNpb25zIiwiZG9Ub3VjaEFjdGlvbiIsImFjdGlvbiIsIm9wdHMiLCJ0YXAiLCJlbGVtZW50IiwieCIsInkiLCJjb3VudCIsInRvdWNoRG93biIsInRvdWNoVXAiLCJ0b3VjaE1vdmUiLCJCIiwiZGVsYXkiLCJtcyIsImR1cmF0aW9uIiwidG91Y2hMb25nQ2xpY2siLCJsb2ciLCJlcnJvckFuZFRocm93IiwicGVyZm9ybUdlc3R1cmUiLCJnZXN0dXJlIiwib3B0aW9ucyIsImUiLCJlcnJvcnMiLCJOb1N1Y2hFbGVtZW50RXJyb3IiLCJkZWJ1ZyIsInBlcmZvcm1Ub3VjaCIsImdlc3R1cmVzIiwicmVzdWx0IiwiZyIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQSxJQUFJQSxRQUFRLEdBQUcsRUFBZjtBQUFBLElBQW1CQyxPQUFPLEdBQUcsRUFBN0I7QUFBQSxJQUFpQ0MsVUFBVSxHQUFHLEVBQTlDOzs7O0FBRUFGLFFBQVEsQ0FBQ0csYUFBVDtBQUFBLDZDQUF5QixXQUFnQkMsTUFBaEIsRUFBd0JDLElBQXhCLEVBQThCO0FBQ3JELFlBQVFELE1BQVI7QUFDRSxXQUFLLEtBQUw7QUFDRSxxQkFBYSxLQUFLRSxHQUFMLENBQVNELElBQUksQ0FBQ0UsT0FBZCxFQUF1QkYsSUFBSSxDQUFDRyxDQUE1QixFQUErQkgsSUFBSSxDQUFDSSxDQUFwQyxFQUF1Q0osSUFBSSxDQUFDSyxLQUE1QyxDQUFiOztBQUNGLFdBQUssT0FBTDtBQUNFLHFCQUFhLEtBQUtDLFNBQUwsQ0FBZU4sSUFBSSxDQUFDRyxDQUFwQixFQUF1QkgsSUFBSSxDQUFDSSxDQUE1QixFQUErQkosSUFBSSxDQUFDRSxPQUFwQyxDQUFiOztBQUNGLFdBQUssU0FBTDtBQUNFLHFCQUFhLEtBQUtLLE9BQUwsQ0FBYVAsSUFBSSxDQUFDRyxDQUFsQixFQUFxQkgsSUFBSSxDQUFDSSxDQUExQixFQUE2QkosSUFBSSxDQUFDRSxPQUFsQyxDQUFiOztBQUNGLFdBQUssUUFBTDtBQUNFLHFCQUFhLEtBQUtNLFNBQUwsQ0FBZVIsSUFBSSxDQUFDRyxDQUFwQixFQUF1QkgsSUFBSSxDQUFDSSxDQUE1QixFQUErQkosSUFBSSxDQUFDRSxPQUFwQyxDQUFiOztBQUNGLFdBQUssTUFBTDtBQUNFLHFCQUFhTyxrQkFBRUMsS0FBRixDQUFRVixJQUFJLENBQUNXLEVBQWIsQ0FBYjs7QUFDRixXQUFLLFdBQUw7QUFDRSxZQUFJLE9BQU9YLElBQUksQ0FBQ1ksUUFBWixLQUF5QixXQUF6QixJQUF3QyxDQUFDWixJQUFJLENBQUNZLFFBQWxELEVBQTREO0FBQzFEWixVQUFBQSxJQUFJLENBQUNZLFFBQUwsR0FBZ0IsSUFBaEI7QUFDRDs7QUFDRCxxQkFBYSxLQUFLQyxjQUFMLENBQW9CYixJQUFJLENBQUNFLE9BQXpCLEVBQWtDRixJQUFJLENBQUNHLENBQXZDLEVBQTBDSCxJQUFJLENBQUNJLENBQS9DLEVBQWtESixJQUFJLENBQUNZLFFBQXZELENBQWI7O0FBQ0Y7QUFDRUUsd0JBQUlDLGFBQUosQ0FBbUIsa0JBQWlCaEIsTUFBTyxFQUEzQzs7QUFqQko7QUFtQkQsR0FwQkQ7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBc0JBSixRQUFRLENBQUNxQixjQUFUO0FBQUEsOENBQTBCLFdBQWdCQyxPQUFoQixFQUF5QjtBQUNqRCxRQUFJO0FBQ0YsbUJBQWEsS0FBS25CLGFBQUwsQ0FBbUJtQixPQUFPLENBQUNsQixNQUEzQixFQUFtQ2tCLE9BQU8sQ0FBQ0MsT0FBUixJQUFtQixFQUF0RCxDQUFiO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUVWLFVBQUksbUNBQVlBLENBQVosRUFBZUMseUJBQU9DLGtCQUF0QixLQUE2Q0osT0FBTyxDQUFDbEIsTUFBUixLQUFtQixTQUFoRSxJQUNGa0IsT0FBTyxDQUFDQyxPQUFSLENBQWdCaEIsT0FEbEIsRUFDMkI7QUFDekIsZUFBT2UsT0FBTyxDQUFDQyxPQUFSLENBQWdCaEIsT0FBdkI7O0FBQ0FZLHdCQUFJUSxLQUFKLENBQVcsMENBQXlDTCxPQUFPLENBQUNDLE9BQVEsR0FBcEU7O0FBQ0EscUJBQWEsS0FBS3BCLGFBQUwsQ0FBbUJtQixPQUFPLENBQUNsQixNQUEzQixFQUFtQ2tCLE9BQU8sQ0FBQ0MsT0FBUixJQUFtQixFQUF0RCxDQUFiO0FBQ0Q7O0FBQ0QsWUFBTUMsQ0FBTjtBQUNEO0FBQ0YsR0FiRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFlQXhCLFFBQVEsQ0FBQzRCLFlBQVQ7QUFBQSw4Q0FBd0IsV0FBZ0JDLFFBQWhCLEVBQTBCO0FBQ2hELFFBQUlDLE1BQU0sR0FBRyxJQUFiO0FBRGdEO0FBQUE7QUFBQTs7QUFBQTtBQUdoRCwyQkFBY0QsUUFBZCw4SEFBd0I7QUFBQSxZQUFmRSxDQUFlOztBQUN0QixZQUFJLFFBQVEsS0FBS1YsY0FBTCxDQUFvQlUsQ0FBcEIsQ0FBUixDQUFKLEVBQXFDO0FBQ25DRCxVQUFBQSxNQUFNLEdBQUcsS0FBVDtBQUNEO0FBQ0Y7QUFQK0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFTaEQsV0FBT0EsTUFBUDtBQUNELEdBVkQ7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBWUFFLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjL0IsVUFBZCxFQUEwQkYsUUFBMUIsRUFBb0NDLE9BQXBDO2VBRWVDLFUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9nIGZyb20gJy4uL2xvZ2dlcic7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBlcnJvcnMsIGlzRXJyb3JUeXBlIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcblxubGV0IGNvbW1hbmRzID0ge30sIGhlbHBlcnMgPSB7fSwgZXh0ZW5zaW9ucyA9IHt9O1xuXG5jb21tYW5kcy5kb1RvdWNoQWN0aW9uID0gYXN5bmMgZnVuY3Rpb24gKGFjdGlvbiwgb3B0cykge1xuICBzd2l0Y2ggKGFjdGlvbikge1xuICAgIGNhc2UgJ3RhcCc6XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy50YXAob3B0cy5lbGVtZW50LCBvcHRzLngsIG9wdHMueSwgb3B0cy5jb3VudCk7XG4gICAgY2FzZSAncHJlc3MnOlxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudG91Y2hEb3duKG9wdHMueCwgb3B0cy55LCBvcHRzLmVsZW1lbnQpO1xuICAgIGNhc2UgJ3JlbGVhc2UnOlxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudG91Y2hVcChvcHRzLngsIG9wdHMueSwgb3B0cy5lbGVtZW50KTtcbiAgICBjYXNlICdtb3ZlVG8nOlxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudG91Y2hNb3ZlKG9wdHMueCwgb3B0cy55LCBvcHRzLmVsZW1lbnQpO1xuICAgIGNhc2UgJ3dhaXQnOlxuICAgICAgcmV0dXJuIGF3YWl0IEIuZGVsYXkob3B0cy5tcyk7XG4gICAgY2FzZSAnbG9uZ1ByZXNzJzpcbiAgICAgIGlmICh0eXBlb2Ygb3B0cy5kdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgfHwgIW9wdHMuZHVyYXRpb24pIHtcbiAgICAgICAgb3B0cy5kdXJhdGlvbiA9IDIwMDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy50b3VjaExvbmdDbGljayhvcHRzLmVsZW1lbnQsIG9wdHMueCwgb3B0cy55LCBvcHRzLmR1cmF0aW9uKTtcbiAgICBkZWZhdWx0OlxuICAgICAgbG9nLmVycm9yQW5kVGhyb3coYHVua25vd24gYWN0aW9uICR7YWN0aW9ufWApO1xuICB9XG59O1xuXG5jb21tYW5kcy5wZXJmb3JtR2VzdHVyZSA9IGFzeW5jIGZ1bmN0aW9uIChnZXN0dXJlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZG9Ub3VjaEFjdGlvbihnZXN0dXJlLmFjdGlvbiwgZ2VzdHVyZS5vcHRpb25zIHx8IHt9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIHNvbWV0aW1lIHRoZSBlbGVtZW50IGlzIG5vdCBhdmFpbGFibGUgd2hlbiByZWxlYXNpbmcsIHJldHJ5IHdpdGhvdXQgaXRcbiAgICBpZiAoaXNFcnJvclR5cGUoZSwgZXJyb3JzLk5vU3VjaEVsZW1lbnRFcnJvcikgJiYgZ2VzdHVyZS5hY3Rpb24gPT09ICdyZWxlYXNlJyAmJlxuICAgICAgZ2VzdHVyZS5vcHRpb25zLmVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSBnZXN0dXJlLm9wdGlvbnMuZWxlbWVudDtcbiAgICAgIGxvZy5kZWJ1ZyhgcmV0cnlpbmcgcmVsZWFzZSB3aXRob3V0IGVsZW1lbnQgb3B0czogJHtnZXN0dXJlLm9wdGlvbnN9LmApO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG9Ub3VjaEFjdGlvbihnZXN0dXJlLmFjdGlvbiwgZ2VzdHVyZS5vcHRpb25zIHx8IHt9KTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufTtcblxuY29tbWFuZHMucGVyZm9ybVRvdWNoID0gYXN5bmMgZnVuY3Rpb24gKGdlc3R1cmVzKSB7XG4gIGxldCByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAobGV0IGcgb2YgZ2VzdHVyZXMpIHtcbiAgICBpZiAoIShhd2FpdCB0aGlzLnBlcmZvcm1HZXN0dXJlKGcpKSkge1xuICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMsIGhlbHBlcnMpO1xuZXhwb3J0IHsgY29tbWFuZHMsIGhlbHBlcnMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy90b3VjaC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
