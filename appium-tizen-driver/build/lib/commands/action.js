"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _appiumSupport = require("appium-support");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _path = _interopRequireDefault(require("path"));

var _jimp = _interopRequireDefault(require("jimp"));

const swipeStepsPerSec = 28;
let commands = {},
    extensions = {};
exports.commands = commands;

commands.flick = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (element, xSpeed, ySpeed, xOffset, yOffset, speed) {
    if (element) {
      return yield this.fakeFlickElement(element, xOffset, yOffset, speed);
    } else {
      return yield this.fakeFlick(xSpeed, ySpeed);
    }
  });

  return function (_x, _x2, _x3, _x4, _x5, _x6) {
    return _ref.apply(this, arguments);
  };
}();

commands.fakeFlick = function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (xSpeed, ySpeed) {
    return yield this.bootstrap.sendAction('element:flick', {
      xSpeed,
      ySpeed
    });
  });

  return function (_x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();

commands.fakeFlickElement = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (elementId, xoffset, yoffset, speed) {
    let steps = 1250.0 / speed + 1;
    let xStart = 1;
    let yStart = 1;

    if (elementId === this.sessionId) {
      elementId = null;
    }

    if (elementId) {
      let location = yield this.getLocationValueByElementId(elementId);
      xStart = location[0];
      yStart = location[1];
    }

    let xEnd = xStart + xoffset;
    let yEnd = yStart + yoffset;
    let params = [xStart, yStart, xEnd, yEnd, steps];
    return yield this.doSwipe(params);
  });

  return function (_x9, _x10, _x11, _x12) {
    return _ref3.apply(this, arguments);
  };
}();

commands.swipe = function () {
  var _ref4 = (0, _asyncToGenerator2.default)(function* (startX, startY, endX, endY, duration) {
    if (startX === 'null') {
      startX = 1;
    }

    if (startY === 'null') {
      startY = 1;
    }

    let swipeOpts = [startX, startY, endX, endY, Math.round(duration * swipeStepsPerSec)];
    return yield this.doSwipe(swipeOpts);
  });

  return function (_x13, _x14, _x15, _x16, _x17) {
    return _ref4.apply(this, arguments);
  };
}();

commands.doSwipe = function () {
  var _ref5 = (0, _asyncToGenerator2.default)(function* (swipeOpts) {
    return yield this.bootstrap.sendAction("swipe", swipeOpts);
  });

  return function (_x18) {
    return _ref5.apply(this, arguments);
  };
}();

commands.pullFile = function () {
  var _ref6 = (0, _asyncToGenerator2.default)(function* (remotePath) {
    const rootDir = _path.default.resolve(__dirname, '..', '..');

    const filePath = _path.default.resolve(rootDir, 'file');

    let localFile = filePath + '/appiumfile.tmp';
    yield this.sdb.pull(remotePath, localFile);
    let data = yield _appiumSupport.fs.readFile(localFile);
    let b64data = new Buffer(data).toString('base64');

    if (yield _appiumSupport.fs.exists(localFile)) {
      yield _appiumSupport.fs.unlink(localFile);
    }

    return b64data;
  });

  return function (_x19) {
    return _ref6.apply(this, arguments);
  };
}();

function takeScreenShot(_x20) {
  return _takeScreenShot.apply(this, arguments);
}

function _takeScreenShot() {
  _takeScreenShot = (0, _asyncToGenerator2.default)(function* (sdb) {
    return yield sdb.takeScreenShot();
  });
  return _takeScreenShot.apply(this, arguments);
}

function getScreenshotData(_x21) {
  return _getScreenshotData.apply(this, arguments);
}

function _getScreenshotData() {
  _getScreenshotData = (0, _asyncToGenerator2.default)(function* (sdb) {
    const rootDir = _path.default.resolve(__dirname, '..', '..');

    const filePath = _path.default.resolve(rootDir, 'file');

    let localFile = filePath + '/screenShot.tmp';

    if (yield _appiumSupport.fs.exists(localFile)) {
      yield _appiumSupport.fs.unlink(localFile);
    }

    try {
      const pngDir = '/tmp/';

      const png = _path.default.posix.resolve(pngDir, 'dump_screen.png');

      yield sdb.pull(png, localFile);
      return yield _jimp.default.read(localFile);
    } finally {
      if (yield _appiumSupport.fs.exists(localFile)) {
        yield _appiumSupport.fs.unlink(localFile);
      }
    }
  });
  return _getScreenshotData.apply(this, arguments);
}

commands.getScreenshot = (0, _asyncToGenerator2.default)(function* () {
  let result = yield takeScreenShot(this.sdb);

  if (result) {
    let image = yield getScreenshotData(this.sdb);

    const getBuffer = _bluebird.default.promisify(image.getBuffer, {
      context: image
    });

    const imgBuffer = yield getBuffer(_jimp.default.MIME_PNG);
    return imgBuffer.toString('base64');
  } else {
    return null;
  }
});
Object.assign(extensions, commands);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9hY3Rpb24uanMiXSwibmFtZXMiOlsic3dpcGVTdGVwc1BlclNlYyIsImNvbW1hbmRzIiwiZXh0ZW5zaW9ucyIsImZsaWNrIiwiZWxlbWVudCIsInhTcGVlZCIsInlTcGVlZCIsInhPZmZzZXQiLCJ5T2Zmc2V0Iiwic3BlZWQiLCJmYWtlRmxpY2tFbGVtZW50IiwiZmFrZUZsaWNrIiwiYm9vdHN0cmFwIiwic2VuZEFjdGlvbiIsImVsZW1lbnRJZCIsInhvZmZzZXQiLCJ5b2Zmc2V0Iiwic3RlcHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJzZXNzaW9uSWQiLCJsb2NhdGlvbiIsImdldExvY2F0aW9uVmFsdWVCeUVsZW1lbnRJZCIsInhFbmQiLCJ5RW5kIiwicGFyYW1zIiwiZG9Td2lwZSIsInN3aXBlIiwic3RhcnRYIiwic3RhcnRZIiwiZW5kWCIsImVuZFkiLCJkdXJhdGlvbiIsInN3aXBlT3B0cyIsIk1hdGgiLCJyb3VuZCIsInB1bGxGaWxlIiwicmVtb3RlUGF0aCIsInJvb3REaXIiLCJwYXRoIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsImZpbGVQYXRoIiwibG9jYWxGaWxlIiwic2RiIiwicHVsbCIsImRhdGEiLCJmcyIsInJlYWRGaWxlIiwiYjY0ZGF0YSIsIkJ1ZmZlciIsInRvU3RyaW5nIiwiZXhpc3RzIiwidW5saW5rIiwidGFrZVNjcmVlblNob3QiLCJnZXRTY3JlZW5zaG90RGF0YSIsInBuZ0RpciIsInBuZyIsInBvc2l4IiwiamltcCIsInJlYWQiLCJnZXRTY3JlZW5zaG90IiwicmVzdWx0IiwiaW1hZ2UiLCJnZXRCdWZmZXIiLCJCIiwicHJvbWlzaWZ5IiwiY29udGV4dCIsImltZ0J1ZmZlciIsIk1JTUVfUE5HIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLGdCQUFnQixHQUFHLEVBQXpCO0FBRUEsSUFBSUMsUUFBUSxHQUFHLEVB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b3J0JztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGppbXAgZnJvbSAnamltcCc7XG5cbmNvbnN0IHN3aXBlU3RlcHNQZXJTZWMgPSAyODtcblxubGV0IGNvbW1hbmRzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuY29tbWFuZHMuZmxpY2sgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudCwgeFNwZWVkLCB5U3BlZWQsIHhPZmZzZXQsIHlPZmZzZXQsIHNwZWVkKSB7XG4gIGlmIChlbGVtZW50KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZmFrZUZsaWNrRWxlbWVudChlbGVtZW50LCB4T2Zmc2V0LCB5T2Zmc2V0LCBzcGVlZCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZmFrZUZsaWNrKHhTcGVlZCwgeVNwZWVkKTtcbiAgfVxufTtcblxuY29tbWFuZHMuZmFrZUZsaWNrID0gYXN5bmMgZnVuY3Rpb24gKHhTcGVlZCwgeVNwZWVkKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdlbGVtZW50OmZsaWNrJywgeyB4U3BlZWQsIHlTcGVlZCB9KTtcbn07XG5cbmNvbW1hbmRzLmZha2VGbGlja0VsZW1lbnQgPSBhc3luYyBmdW5jdGlvbiAoZWxlbWVudElkLCB4b2Zmc2V0LCB5b2Zmc2V0LCBzcGVlZCkge1xuICBsZXQgc3RlcHMgPSAxMjUwLjAgLyBzcGVlZCArIDE7XG5cbiAgbGV0IHhTdGFydCA9IDE7XG4gIGxldCB5U3RhcnQgPSAxO1xuXG4gIGlmIChlbGVtZW50SWQgPT09IHRoaXMuc2Vzc2lvbklkKSB7XG4gICAgZWxlbWVudElkID0gbnVsbDtcbiAgfVxuICBpZiAoZWxlbWVudElkKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gYXdhaXQgdGhpcy5nZXRMb2NhdGlvblZhbHVlQnlFbGVtZW50SWQoZWxlbWVudElkKTtcbiAgICB4U3RhcnQgPSBsb2NhdGlvblswXTtcbiAgICB5U3RhcnQgPSBsb2NhdGlvblsxXTtcbiAgfVxuXG4gIGxldCB4RW5kID0geFN0YXJ0ICsgeG9mZnNldDtcbiAgbGV0IHlFbmQgPSB5U3RhcnQgKyB5b2Zmc2V0O1xuXG4gIGxldCBwYXJhbXMgPSBbeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQsIHN0ZXBzXTtcblxuICByZXR1cm4gYXdhaXQgdGhpcy5kb1N3aXBlKHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy5zd2lwZSA9IGFzeW5jIGZ1bmN0aW9uIChzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSwgZHVyYXRpb24pIHtcbiAgaWYgKHN0YXJ0WCA9PT0gJ251bGwnKSB7XG4gICAgc3RhcnRYID0gMTtcbiAgfVxuICBpZiAoc3RhcnRZID09PSAnbnVsbCcpIHtcbiAgICBzdGFydFkgPSAxO1xuICB9XG4gIGxldCBzd2lwZU9wdHMgPSBbXG4gICAgc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksXG4gICAgTWF0aC5yb3VuZChkdXJhdGlvbiAqIHN3aXBlU3RlcHNQZXJTZWMpXG4gIF07XG5cbiAgcmV0dXJuIGF3YWl0IHRoaXMuZG9Td2lwZShzd2lwZU9wdHMpO1xufTtcblxuY29tbWFuZHMuZG9Td2lwZSA9IGFzeW5jIGZ1bmN0aW9uIChzd2lwZU9wdHMpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oXCJzd2lwZVwiLCBzd2lwZU9wdHMpO1xufTtcblxuY29tbWFuZHMucHVsbEZpbGUgPSBhc3luYyBmdW5jdGlvbiAocmVtb3RlUGF0aCkge1xuICBjb25zdCByb290RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJyk7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHJvb3REaXIsICdmaWxlJyk7XG4gIGxldCBsb2NhbEZpbGUgPSBmaWxlUGF0aCArICcvYXBwaXVtZmlsZS50bXAnO1xuICBhd2FpdCB0aGlzLnNkYi5wdWxsKHJlbW90ZVBhdGgsIGxvY2FsRmlsZSk7XG4gIGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUobG9jYWxGaWxlKTtcbiAgbGV0IGI2NGRhdGEgPSBuZXcgQnVmZmVyKGRhdGEpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgaWYgKGF3YWl0IGZzLmV4aXN0cyhsb2NhbEZpbGUpKSB7XG4gICAgYXdhaXQgZnMudW5saW5rKGxvY2FsRmlsZSk7XG4gIH1cbiAgcmV0dXJuIGI2NGRhdGE7XG59O1xuXG5hc3luYyBmdW5jdGlvbiB0YWtlU2NyZWVuU2hvdCAoc2RiKSB7XG4gIHJldHVybiBhd2FpdCBzZGIudGFrZVNjcmVlblNob3QoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0U2NyZWVuc2hvdERhdGEgKHNkYikge1xuICBjb25zdCByb290RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJyk7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKHJvb3REaXIsICdmaWxlJyk7XG4gIGxldCBsb2NhbEZpbGUgPSBmaWxlUGF0aCArICcvc2NyZWVuU2hvdC50bXAnO1xuICBpZiAoYXdhaXQgZnMuZXhpc3RzKGxvY2FsRmlsZSkpIHtcbiAgICBhd2FpdCBmcy51bmxpbmsobG9jYWxGaWxlKTtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHBuZ0RpciA9ICcvdG1wLyc7XG4gICAgY29uc3QgcG5nID0gcGF0aC5wb3NpeC5yZXNvbHZlKHBuZ0RpciwgJ2R1bXBfc2NyZWVuLnBuZycpO1xuICAgIGF3YWl0IHNkYi5wdWxsKHBuZywgbG9jYWxGaWxlKTtcbiAgICByZXR1cm4gYXdhaXQgamltcC5yZWFkKGxvY2FsRmlsZSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGF3YWl0IGZzLmV4aXN0cyhsb2NhbEZpbGUpKSB7XG4gICAgICBhd2FpdCBmcy51bmxpbmsobG9jYWxGaWxlKTtcbiAgICB9XG4gIH1cbn1cblxuY29tbWFuZHMuZ2V0U2NyZWVuc2hvdCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IHRha2VTY3JlZW5TaG90KHRoaXMuc2RiKTtcblxuICBpZiAocmVzdWx0KSB7XG4gICAgbGV0IGltYWdlID0gYXdhaXQgZ2V0U2NyZWVuc2hvdERhdGEodGhpcy5zZGIpO1xuICAgIGNvbnN0IGdldEJ1ZmZlciA9IEIucHJvbWlzaWZ5KGltYWdlLmdldEJ1ZmZlciwgeyBjb250ZXh0OiBpbWFnZSB9KTtcbiAgICBjb25zdCBpbWdCdWZmZXIgPSBhd2FpdCBnZXRCdWZmZXIoamltcC5NSU1FX1BORyk7XG4gICAgcmV0dXJuIGltZ0J1ZmZlci50b1N0cmluZygnYmFzZTY0Jyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMpO1xuZXhwb3J0IHsgY29tbWFuZHMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9hY3Rpb24uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
