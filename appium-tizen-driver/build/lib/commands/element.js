"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _logger = _interopRequireDefault(require("../logger"));

var _lodash = _interopRequireDefault(require("lodash"));

var _asyncbox = require("asyncbox");

let commands = {},
    extensions = {};
exports.commands = commands;

commands.getAttribute = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (attribute, elementId) {
    elementId = this.getAutomationId(elementId);
    let params = {
      attribute,
      elementId
    };
    return yield this.bootstrap.sendAction("element:getAttribute", params);
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

commands.setAttribute = function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (attribute, value, elementId) {
    elementId = this.getAutomationId(elementId);
    let params = {
      attribute,
      value,
      elementId
    };
    return yield this.bootstrap.sendAction("element:setAttribute", params);
  });

  return function (_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

commands.getLocation = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    return yield this.bootstrap.sendAction("element:location", {
      elementId
    });
  });

  return function (_x6) {
    return _ref3.apply(this, arguments);
  };
}();

commands.getLocationInView = function () {
  var _ref4 = (0, _asyncToGenerator2.default)(function* (elementId) {
    return yield this.getLocation(elementId);
  });

  return function (_x7) {
    return _ref4.apply(this, arguments);
  };
}();

commands.getLocationValueByElementId = function () {
  var _ref5 = (0, _asyncToGenerator2.default)(function* (elementId) {
    return yield this.getLocation(elementId);
  });

  return function (_x8) {
    return _ref5.apply(this, arguments);
  };
}();

commands.getText = function () {
  var _ref6 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    return yield this.bootstrap.sendAction("element:getText", {
      elementId
    });
  });

  return function (_x9) {
    return _ref6.apply(this, arguments);
  };
}();

commands.elementEnabled = function () {
  var _ref7 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    return yield this.bootstrap.sendAction("element:enabled", {
      elementId
    });
  });

  return function (_x10) {
    return _ref7.apply(this, arguments);
  };
}();

commands.elementDisplayed = function () {
  var _ref8 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    return yield this.bootstrap.sendAction("element:displayed", {
      elementId
    });
  });

  return function (_x11) {
    return _ref8.apply(this, arguments);
  };
}();

commands.elementSelected = function () {
  _logger.default.info('elementSelected not supported');

  return false;
};

commands.getSize = function () {
  var _ref9 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    return yield this.bootstrap.sendAction("element:size", {
      elementId
    });
  });

  return function (_x12) {
    return _ref9.apply(this, arguments);
  };
}();

commands.setValue = function () {
  var _ref10 = (0, _asyncToGenerator2.default)(function* (keys, elementId) {
    let text = keys.join();
    elementId = this.getAutomationId(elementId);
    let params = {
      elementId,
      text,
      replace: false
    };
    return yield this.bootstrap.sendAction("element:setText", params);
  });

  return function (_x13, _x14) {
    return _ref10.apply(this, arguments);
  };
}();

commands.setValueImmediate = function () {
  var _ref11 = (0, _asyncToGenerator2.default)(function* (keys, elementId) {
    let text = _lodash.default.isArray(keys) ? keys.join('') : keys;
    elementId = this.getAutomationId(elementId);
    let params = {
      elementId,
      text,
      replace: false
    };
    return yield this.bootstrap.sendAction("element:setText", params);
  });

  return function (_x15, _x16) {
    return _ref11.apply(this, arguments);
  };
}();

commands.clear = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (elementId) {
    elementId = this.getAutomationId(elementId);
    let params = {
      elementId,
      text: "",
      replace: true
    };
    return yield this.bootstrap.sendAction("element:setText", params);
  });

  return function (_x17) {
    return _ref12.apply(this, arguments);
  };
}();

commands.replaceValue = function () {
  var _ref13 = (0, _asyncToGenerator2.default)(function* (value, elementId) {
    elementId = this.getAutomationId(elementId);
    let params = {
      elementId,
      text: value,
      replace: true
    };
    return yield this.bootstrap.sendAction("element:setText", params);
  });

  return function (_x18, _x19) {
    return _ref13.apply(this, arguments);
  };
}();

commands.click = function () {
  var _ref14 = (0, _asyncToGenerator2.default)(function* (elementId, x = 0, y = 0) {
    if (x === this.sessionId) {
      x = 0;
    }

    if (y === this.sessionId) {
      y = 0;
    }

    if (elementId) {
      elementId = this.getAutomationId(elementId);
    } else {
      elementId = "";
    }

    let params = {
      elementId,
      x,
      y
    };
    return yield this.bootstrap.sendAction("element:click", params);
  });

  return function (_x20) {
    return _ref14.apply(this, arguments);
  };
}();

commands.touchUp = function () {
  var _ref15 = (0, _asyncToGenerator2.default)(function* (x = 1, y = 1, elementId = "") {
    if (elementId && elementId !== this.sessionId) {
      elementId = this.getAutomationId(elementId);
    } else {
      elementId = "";
    }

    let params = {
      elementId,
      x,
      y
    };
    return yield this.bootstrap.sendAction("element:touchUp", params);
  });

  return function () {
    return _ref15.apply(this, arguments);
  };
}();

commands.touchDown = function () {
  var _ref16 = (0, _asyncToGenerator2.default)(function* (x, y, elementId = "") {
    if (elementId && elementId !== this.sessionId) {
      elementId = this.getAutomationId(elementId);
    } else {
      elementId = "";
    }

    let params = {
      elementId,
      x,
      y
    };
    return yield this.bootstrap.sendAction("element:touchDown", params);
  });

  return function (_x21, _x22) {
    return _ref16.apply(this, arguments);
  };
}();

commands.touchMove = function () {
  var _ref17 = (0, _asyncToGenerator2.default)(function* (x, y, elementId = null) {
    if (elementId && elementId !== this.sessionId) {
      elementId = this.getAutomationId(elementId);
    } else {
      elementId = "";
    }

    let params = {
      elementId,
      x,
      y
    };
    return yield this.bootstrap.sendAction("element:touchMove", params);
  });

  return function (_x23, _x24) {
    return _ref17.apply(this, arguments);
  };
}();

commands.touchLongClick = function () {
  var _ref18 = (0, _asyncToGenerator2.default)(function* (elementId, x, y, duration) {
    yield this.touchDown(x, y, elementId);
    yield (0, _asyncbox.sleep)(duration);
    return yield this.touchUp(x, y, elementId);
  });

  return function (_x25, _x26, _x27, _x28) {
    return _ref18.apply(this, arguments);
  };
}();

commands.tap = function () {
  var _ref19 = (0, _asyncToGenerator2.default)(function* (elementId, x = 0, y = 0, count = 1) {
    let result = true;
    let tapResult = false;

    for (let i = 0; i < count; i++) {
      tapResult = yield this.click(elementId, x, y);

      if (!tapResult) {
        result = false;
      }
    }

    return result;
  });

  return function (_x29) {
    return _ref19.apply(this, arguments);
  };
}();

Object.assign(extensions, commands);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9lbGVtZW50LmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwiZXh0ZW5zaW9ucyIsImdldEF0dHJpYnV0ZSIsImF0dHJpYnV0ZSIsImVsZW1lbnRJZCIsImdldEF1dG9tYXRpb25JZCIsInBhcmFtcyIsImJvb3RzdHJhcCIsInNlbmRBY3Rpb24iLCJzZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsImdldExvY2F0aW9uIiwiZ2V0TG9jYXRpb25JblZpZXciLCJnZXRMb2NhdGlvblZhbHVlQnlFbGVtZW50SWQiLCJnZXRUZXh0IiwiZWxlbWVudEVuYWJsZWQiLCJlbGVtZW50RGlzcGxheWVkIiwiZWxlbWVudFNlbGVjdGVkIiwibG9nIiwiaW5mbyIsImdldFNpemUiLCJzZXRWYWx1ZSIsImtleXMiLCJ0ZXh0Iiwiam9pbiIsInJlcGxhY2UiLCJzZXRWYWx1ZUltbWVkaWF0ZSIsIl8iLCJpc0FycmF5IiwiY2xlYXIiLCJyZXBsYWNlVmFsdWUiLCJjbGljayIsIngiLCJ5Iiwic2Vzc2lvbklkIiwidG91Y2hVcCIsInRvdWNoRG93biIsInRvdWNoTW92ZSIsInRvdWNoTG9uZ0NsaWNrIiwiZHVyYXRpb24iLCJ0YXAiLCJjb3VudCIsInJlc3VsdCIsInRhcFJlc3VsdCIsImkiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0EsSUFBSUEsUUFBUSxHQUFHLEVBQWY7QUFBQSxJQUFtQkMsVUFBVSxHQUFHLEVBQWhDOzs7QUFFQUQsUUFBUSxDQUFDRSxZQUFUO0FBQUEsNkNBQXdCLFdBQWdCQyxTQUFoQixFQUEyQkMsU0FBM0IsRUFBc0M7QUFDNURBLElBQUFBLFNBQVMsR0FBRyxLQUFLQyxlQUFMLENBQXFCRCxTQUFyQixDQUFaO0FBQ0EsUUFBSUUsTUFBTSxHQUFHO0FBQ1hILE1BQUFBLFNBRFc7QUFFWEMsTUFBQUE7QUFGVyxLQUFiO0FBSUEsaUJBQWEsS0FBS0csU0FBTCxDQUFlQyxV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RCxFQUFvRDtBQUNqRSxRQUFJQyxNQUFNLEdBQUcsSUFBYjtBQUNBLFFBQUlDLFNBQVMsR0FBRyxLQUFoQjs7QUFDQSxTQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILEtBQXBCLEVBQTJCRyxDQUFDLEVBQTVCLEVBQWdDO0FBQzlCRCxNQUFBQSxTQUFTLFNBQVMsS0FBS1osS0FBTCxDQUFXM0IsU0FBWCxFQUFzQjRCLENBQXRCLEVBQXlCQyxDQUF6QixDQUFsQjs7QUFDRSxVQUFJLENBQUNVLFNBQUwsRUFBZ0I7QUFDZEQsUUFBQUEsTUFBTSxHQUFHLEtBQVQ7QUFDRDtBQUNBOztBQUNMLFdBQU9BLE1BQVA7QUFDRCxHQVZEOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQVlBRyxNQUFNLENBQUNDLE1BQVAsQ0FBYzdDLFVBQWQsRUFBMEJELFFBQTFCO2VBRWVDLFUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbG9nIGZyb20gJy4uL2xvZ2dlcic7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgc2xlZXAgfSBmcm9tICdhc3luY2JveCc7XG5sZXQgY29tbWFuZHMgPSB7fSwgZXh0ZW5zaW9ucyA9IHt9O1xuXG5jb21tYW5kcy5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbiAoYXR0cmlidXRlLCBlbGVtZW50SWQpIHtcbiAgZWxlbWVudElkID0gdGhpcy5nZXRBdXRvbWF0aW9uSWQoZWxlbWVudElkKTtcbiAgbGV0IHBhcmFtcyA9IHtcbiAgICBhdHRyaWJ1dGUsXG4gICAgZWxlbWVudElkXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpnZXRBdHRyaWJ1dGVcIiwgcGFyYW1zKTtcbn07XG5cbmNvbW1hbmRzLnNldEF0dHJpYnV0ZSA9IGFzeW5jIGZ1bmN0aW9uIChhdHRyaWJ1dGUsIHZhbHVlLCBlbGVtZW50SWQpIHtcbiAgZWxlbWVudElkID0gdGhpcy5nZXRBdXRvbWF0aW9uSWQoZWxlbWVudElkKTtcbiAgbGV0IHBhcmFtcyA9IHtcbiAgICBhdHRyaWJ1dGUsXG4gICAgdmFsdWUsXG4gICAgZWxlbWVudElkXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpzZXRBdHRyaWJ1dGVcIiwgcGFyYW1zKTtcbn07XG5cbmNvbW1hbmRzLmdldExvY2F0aW9uID0gYXN5bmMgZnVuY3Rpb24gKGVsZW1lbnRJZCkge1xuICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICByZXR1cm4gYXdhaXQgdGhpcy5ib290c3RyYXAuc2VuZEFjdGlvbihcImVsZW1lbnQ6bG9jYXRpb25cIiwgeyBlbGVtZW50SWQgfSk7XG59O1xuXG5jb21tYW5kcy5nZXRMb2NhdGlvbkluVmlldyA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0TG9jYXRpb24oZWxlbWVudElkKTtcbn07XG5cbmNvbW1hbmRzLmdldExvY2F0aW9uVmFsdWVCeUVsZW1lbnRJZCA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0TG9jYXRpb24oZWxlbWVudElkKTtcbn07XG5cbmNvbW1hbmRzLmdldFRleHQgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudElkKSB7XG4gIGVsZW1lbnRJZCA9IHRoaXMuZ2V0QXV0b21hdGlvbklkKGVsZW1lbnRJZCk7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpnZXRUZXh0XCIsIHsgZWxlbWVudElkIH0pO1xufTtcblxuY29tbWFuZHMuZWxlbWVudEVuYWJsZWQgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudElkKSB7XG4gIGVsZW1lbnRJZCA9IHRoaXMuZ2V0QXV0b21hdGlvbklkKGVsZW1lbnRJZCk7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDplbmFibGVkXCIsIHsgZWxlbWVudElkIH0pO1xufTtcblxuY29tbWFuZHMuZWxlbWVudERpc3BsYXllZCA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgZWxlbWVudElkID0gdGhpcy5nZXRBdXRvbWF0aW9uSWQoZWxlbWVudElkKTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJlbGVtZW50OmRpc3BsYXllZFwiLCB7IGVsZW1lbnRJZCB9KTtcbn07XG5cbmNvbW1hbmRzLmVsZW1lbnRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgbG9nLmluZm8oJ2VsZW1lbnRTZWxlY3RlZCBub3Qgc3VwcG9ydGVkJyk7XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmNvbW1hbmRzLmdldFNpemUgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudElkKSB7XG4gIGVsZW1lbnRJZCA9IHRoaXMuZ2V0QXV0b21hdGlvbklkKGVsZW1lbnRJZCk7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpzaXplXCIsIHsgZWxlbWVudElkIH0pO1xufTtcblxuY29tbWFuZHMuc2V0VmFsdWUgPSBhc3luYyBmdW5jdGlvbiAoa2V5cywgZWxlbWVudElkKSB7XG4gIGxldCB0ZXh0ID0ga2V5cy5qb2luKCk7XG4gIGVsZW1lbnRJZCA9IHRoaXMuZ2V0QXV0b21hdGlvbklkKGVsZW1lbnRJZCk7XG4gIGxldCBwYXJhbXMgPSB7XG4gICAgZWxlbWVudElkLFxuICAgIHRleHQsXG4gICAgcmVwbGFjZTogZmFsc2VcbiAgfTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJlbGVtZW50OnNldFRleHRcIiwgcGFyYW1zKTtcbn07XG5cbmNvbW1hbmRzLnNldFZhbHVlSW1tZWRpYXRlID0gYXN5bmMgZnVuY3Rpb24gKGtleXMsIGVsZW1lbnRJZCkge1xuICBsZXQgdGV4dCA9IF8uaXNBcnJheShrZXlzKSA/IGtleXMuam9pbignJykgOiBrZXlzO1xuICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICBsZXQgcGFyYW1zID0ge1xuICAgIGVsZW1lbnRJZCxcbiAgICB0ZXh0LFxuICAgIHJlcGxhY2U6IGZhbHNlXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpzZXRUZXh0XCIsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy5jbGVhciA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQpIHtcbiAgZWxlbWVudElkID0gdGhpcy5nZXRBdXRvbWF0aW9uSWQoZWxlbWVudElkKTtcbiAgbGV0IHBhcmFtcyA9IHtcbiAgICBlbGVtZW50SWQsXG4gICAgdGV4dDogXCJcIixcbiAgICByZXBsYWNlOiB0cnVlXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpzZXRUZXh0XCIsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy5yZXBsYWNlVmFsdWUgPSBhc3luYyBmdW5jdGlvbiAodmFsdWUsIGVsZW1lbnRJZCkge1xuICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICBsZXQgcGFyYW1zID0ge1xuICAgIGVsZW1lbnRJZCxcbiAgICB0ZXh0OiB2YWx1ZSxcbiAgICByZXBsYWNlOiB0cnVlXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKFwiZWxlbWVudDpzZXRUZXh0XCIsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy5jbGljayA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQsIHggPSAwLCB5ID0gMCkge1xuICBpZiAoeCA9PT0gdGhpcy5zZXNzaW9uSWQpIHtcbiAgICB4ID0gMDtcbiAgfVxuICBpZiAoeSA9PT0gdGhpcy5zZXNzaW9uSWQpIHtcbiAgICB5ID0gMDtcbiAgfVxuXG4gIGlmIChlbGVtZW50SWQpIHtcbiAgICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnRJZCA9IFwiXCI7XG4gIH1cblxuICBsZXQgcGFyYW1zID0ge1xuICAgIGVsZW1lbnRJZCxcbiAgICB4LFxuICAgIHlcbiAgfTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJlbGVtZW50OmNsaWNrXCIsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy50b3VjaFVwID0gYXN5bmMgZnVuY3Rpb24gKHggPSAxLCB5ID0gMSwgZWxlbWVudElkID0gXCJcIikge1xuICBpZiAoZWxlbWVudElkICYmIGVsZW1lbnRJZCAhPT0gdGhpcy5zZXNzaW9uSWQpIHtcbiAgICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnRJZCA9IFwiXCI7XG4gIH1cblxuICBsZXQgcGFyYW1zID0ge1xuICAgIGVsZW1lbnRJZCxcbiAgICB4LFxuICAgIHlcbiAgfTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJlbGVtZW50OnRvdWNoVXBcIiwgcGFyYW1zKTtcbn07XG5cbmNvbW1hbmRzLnRvdWNoRG93biA9IGFzeW5jIGZ1bmN0aW9uICh4LCB5LCBlbGVtZW50SWQgPSBcIlwiKSB7XG4gIGlmIChlbGVtZW50SWQgJiYgZWxlbWVudElkICE9PSB0aGlzLnNlc3Npb25JZCkge1xuICAgIGVsZW1lbnRJZCA9IHRoaXMuZ2V0QXV0b21hdGlvbklkKGVsZW1lbnRJZCk7XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudElkID0gXCJcIjtcbiAgfVxuXG4gIGxldCBwYXJhbXMgPSB7XG4gICAgZWxlbWVudElkLFxuICAgIHgsXG4gICAgeVxuICB9O1xuICByZXR1cm4gYXdhaXQgdGhpcy5ib290c3RyYXAuc2VuZEFjdGlvbihcImVsZW1lbnQ6dG91Y2hEb3duXCIsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy50b3VjaE1vdmUgPSBhc3luYyBmdW5jdGlvbiAoeCwgeSwgZWxlbWVudElkID0gbnVsbCkge1xuICBpZiAoZWxlbWVudElkICYmIGVsZW1lbnRJZCAhPT0gdGhpcy5zZXNzaW9uSWQpIHtcbiAgICBlbGVtZW50SWQgPSB0aGlzLmdldEF1dG9tYXRpb25JZChlbGVtZW50SWQpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnRJZCA9IFwiXCI7XG4gIH1cblxuICBsZXQgcGFyYW1zID0ge1xuICAgIGVsZW1lbnRJZCxcbiAgICB4LFxuICAgIHlcbiAgfTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJlbGVtZW50OnRvdWNoTW92ZVwiLCBwYXJhbXMpO1xufTtcblxuY29tbWFuZHMudG91Y2hMb25nQ2xpY2sgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudElkLCB4LCB5LCBkdXJhdGlvbikge1xuICBhd2FpdCB0aGlzLnRvdWNoRG93bih4LCB5LCBlbGVtZW50SWQpO1xuICBhd2FpdCBzbGVlcChkdXJhdGlvbik7XG4gIHJldHVybiBhd2FpdCB0aGlzLnRvdWNoVXAoeCwgeSwgZWxlbWVudElkKTtcbn07XG5cbmNvbW1hbmRzLnRhcCA9IGFzeW5jIGZ1bmN0aW9uIChlbGVtZW50SWQsIHggPSAwLCB5ID0gMCwgY291bnQgPSAxKSB7XG4gIGxldCByZXN1bHQgPSB0cnVlO1xuICBsZXQgdGFwUmVzdWx0ID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIHRhcFJlc3VsdCA9IGF3YWl0IHRoaXMuY2xpY2soZWxlbWVudElkLCB4LCB5KTtcbiAgICAgIGlmICghdGFwUmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuT2JqZWN0LmFzc2lnbihleHRlbnNpb25zLCBjb21tYW5kcyk7XG5leHBvcnQgeyBjb21tYW5kcyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2VsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
