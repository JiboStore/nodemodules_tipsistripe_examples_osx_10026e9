"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tailUntil = tailUntil;

require("source-map-support/register");

var _teen_process = require("teen_process");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _logger = _interopRequireDefault(require("./logger"));

async function tailUntil(filePath, until, timeout = 5000) {
  let proc = new _teen_process.SubProcess('tail', ['-f', '-n', '100', filePath]);

  let startDetector = stdout => {
    return stdout.indexOf(until) > -1;
  };

  return await new _bluebird.default((resolve, reject) => {
    let started = proc.start(startDetector);

    let timedout = _bluebird.default.delay(timeout).then(() => {
      return reject(new Error(`Tailing file ${filePath} failed after ${timeout}ms`));
    });

    _bluebird.default.race([started, timedout]).then(resolve).catch(reject);
  }).finally(async () => {
    if (proc.isRunning) {
      try {
        await proc.stop();
      } catch (err) {
        _logger.default.info(`Stopping tail process failed: ${err.message}`);
      }
    }
  });
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90YWlsLXVudGlsLmpzIl0sIm5hbWVzIjpbInRhaWxVbnRpbCIsImZpbGVQYXRoIiwidW50aWwiLCJ0aW1lb3V0IiwicHJvYyIsIlN1YlByb2Nlc3MiLCJzdGFydERldGVjdG9yIiwic3Rkb3V0IiwiaW5kZXhPZiIsIkIiLCJyZXNvbHZlIiwicmVqZWN0Iiwic3RhcnRlZCIsInN0YXJ0IiwidGltZWRvdXQiLCJkZWxheSIsInRoZW4iLCJFcnJvciIsInJhY2UiLCJjYXRjaCIsImZpbmFsbHkiLCJpc1J1bm5pbmciLCJzdG9wIiwiZXJyIiwibG9nIiwiaW5mbyIsIm1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBR0EsZUFBZUEsU0FBZixDQUEwQkMsUUFBMUIsRUFBb0NDLEtBQXBDLEVBQTJDQyxPQUFPLEdBQUcsSUFBckQsRUFBMkQ7QUFDekQsTUFBSUMsSUFBSSxHQUFHLElBQUlDLHdCQUFKLENBQWUsTUFBZixFQUF1QixDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsS0FBYixFQUFvQkosUUFBcEIsQ0FBdkIsQ0FBWDs7QUFRQSxNQUFJSyxhQUFhLEdBQUlDLE1BQUQsSUFBWTtBQUM5QixXQUFPQSxNQUFNLENBQUNDLE9BQVAsQ0FBZU4sS0FBZixJQUF3QixDQUFDLENBQWhDO0FBQ0QsR0FGRDs7QUFJQSxTQUFPLE1BQU0sSUFBSU8saUJBQUosQ0FBTSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDdEMsUUFBSUMsT0FBTyxHQUFHUixJQUFJLENBQUNTLEtBQUwsQ0FBV1AsYUFBWCxDQUFkOztBQUdBLFFBQUlRLFFBQVEsR0FBR0wsa0JBQUVNLEtBQUYsQ0FBUVosT0FBUixFQUFpQmEsSUFBakIsQ0FBc0IsTUFBTTtBQUN6QyxhQUFPTCxNQUFNLENBQUMsSUFBSU0sS0FBSixDQUFXLGdCQUFlaEIsUUFBUyxpQkFBZ0JFLE9BQVEsSUFBM0QsQ0FBRCxDQUFiO0FBQ0QsS0FGYyxDQUFmOztBQUtBTSxzQkFBRVMsSUFBRixDQUFPLENBQUNOLE9BQUQsRUFBVUUsUUFBVixDQUFQLEVBQTRCRSxJQUE1QixDQUFpQ04sT0FBakMsRUFBMENTLEtBQTFDLENBQWdEUixNQUFoRDtBQUNELEdBVlksRUFVVlMsT0FWVSxDQVVGLFlBQVk7QUFFckIsUUFBSWhCLElBQUksQ0FBQ2lCLFNBQVQsRUFBb0I7QUFDbEIsVUFBSTtBQUNGLGNBQU1qQixJQUFJLENBQUNrQixJQUFMLEVBQU47QUFDRCxPQUZELENBRUUsT0FBT0MsR0FBUCxFQUFZO0FBRVpDLHdCQUFJQyxJQUFKLENBQVUsaUNBQWdDRixHQUFHLENBQUNHLE9BQVEsRUFBdEQ7QUFDRDtBQUNGO0FBQ0YsR0FwQlksQ0FBYjtBQXFCRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN1YlByb2Nlc3MgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcic7XG5cbi8vIHRhaWxzIGEgZmlsZSwgcHJvbWlzZSByZXNvbHZlcyB3aGVuIGlucHV0IHN0cmluZyBpcyB3cml0dGVuIHRvIGZpbGVcbmFzeW5jIGZ1bmN0aW9uIHRhaWxVbnRpbCAoZmlsZVBhdGgsIHVudGlsLCB0aW1lb3V0ID0gNTAwMCkge1xuICBsZXQgcHJvYyA9IG5ldyBTdWJQcm9jZXNzKCd0YWlsJywgWyctZicsICctbicsICcxMDAnLCBmaWxlUGF0aF0pO1xuXG4gIC8vIC8vIGZvciBkZWJ1Z2dpbmdcbiAgLy8gZnVuY3Rpb24gY29uc29sZU91dCAoLi4uYXJncykge1xuICAvLyAgIGNvbnNvbGUubG9nKGA+Pj4gJHthcmdzfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgLy8gfVxuICAvLyBwcm9jLm9uKCdvdXRwdXQnLCBjb25zb2xlT3V0KTtcblxuICBsZXQgc3RhcnREZXRlY3RvciA9IChzdGRvdXQpID0+IHtcbiAgICByZXR1cm4gc3Rkb3V0LmluZGV4T2YodW50aWwpID4gLTE7XG4gIH07XG5cbiAgcmV0dXJuIGF3YWl0IG5ldyBCKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgc3RhcnRlZCA9IHByb2Muc3RhcnQoc3RhcnREZXRlY3Rvcik7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBwcm9taXNlL3ByZWZlci1hd2FpdC10by10aGVuICovXG4gICAgbGV0IHRpbWVkb3V0ID0gQi5kZWxheSh0aW1lb3V0KS50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKGBUYWlsaW5nIGZpbGUgJHtmaWxlUGF0aH0gZmFpbGVkIGFmdGVyICR7dGltZW91dH1tc2ApKTtcbiAgICB9KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlICovXG5cbiAgICBCLnJhY2UoW3N0YXJ0ZWQsIHRpbWVkb3V0XSkudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICB9KS5maW5hbGx5KGFzeW5jICgpID0+IHtcbiAgICAvLyBubyBtYXR0ZXIgd2hhdCwgc3RvcCB0aGUgdGFpbCBwcm9jZXNzXG4gICAgaWYgKHByb2MuaXNSdW5uaW5nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBwcm9jLnN0b3AoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyB0aGVyZSBpcyBub3QgbXVjaCB3ZSBjYW4gZG8gaGVyZSwgdW5mb3J0dW5hdGVseSwgYnV0IGxvZ1xuICAgICAgICBsb2cuaW5mbyhgU3RvcHBpbmcgdGFpbCBwcm9jZXNzIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgeyB0YWlsVW50aWwgfTtcbiJdLCJmaWxlIjoibGliL3RhaWwtdW50aWwuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
