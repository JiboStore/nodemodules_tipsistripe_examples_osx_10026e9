"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IDB = exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _index = _interopRequireDefault(require("./tools/index.js"));

var _helpers = require("./helpers");

const DEFAULT_OPTS = {
  udid: null,
  executable: {
    path: _helpers.IDB_EXECUTABLE,
    port: null,
    grpcPort: null,
    defaultArgs: []
  },
  logLevel: null,
  companion: {
    path: _helpers.IDB_COMPANION_EXECUTABLE,
    port: null,
    grpcPort: null,
    logPath: null
  },
  execTimeout: _helpers.DEFAULT_IDB_EXEC_TIMEOUT
};

class IDB {
  constructor(opts = {}) {
    Object.assign(this, opts);

    _lodash.default.defaultsDeep(this, _lodash.default.cloneDeep(DEFAULT_OPTS));

    if (!this.udid) {
      throw new Error(`UDID must be set for idb`);
    }

    this.executable.defaultArgs.push('--udid', this.udid);

    if (this.logLevel) {
      this.executable.defaultArgs.push('--log', this.logLevel);
    }
  }

}

exports.IDB = IDB;

for (const [fnName, fn] of _lodash.default.toPairs(_index.default)) {
  IDB.prototype[fnName] = fn;
}

var _default = IDB;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9pZGIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRTIiwidWRpZCIsImV4ZWN1dGFibGUiLCJwYXRoIiwiSURCX0VYRUNVVEFCTEUiLCJwb3J0IiwiZ3JwY1BvcnQiLCJkZWZhdWx0QXJncyIsImxvZ0xldmVsIiwiY29tcGFuaW9uIiwiSURCX0NPTVBBTklPTl9FWEVDVVRBQkxFIiwibG9nUGF0aCIsImV4ZWNUaW1lb3V0IiwiREVGQVVMVF9JREJfRVhFQ19USU1FT1VUIiwiSURCIiwiY29uc3RydWN0b3IiLCJvcHRzIiwiT2JqZWN0IiwiYXNzaWduIiwiXyIsImRlZmF1bHRzRGVlcCIsImNsb25lRGVlcCIsIkVycm9yIiwicHVzaCIsImZuTmFtZSIsImZuIiwidG9QYWlycyIsIm1ldGhvZHMiLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBS0EsTUFBTUEsWUFBWSxHQUFHO0FBQ25CQyxFQUFBQSxJQUFJLEVBQUUsSUFEYTtBQUVuQkMsRUFBQUEsVUFBVSxFQUFFO0FBQ1ZDLElBQUFBLElBQUksRUFBRUMsdUJBREk7QUFFVkMsSUFBQUEsSUFBSSxFQUFFLElBRkk7QUFHVkMsSUFBQUEsUUFBUSxFQUFFLElBSEE7QUFJVkMsSUFBQUEsV0FBVyxFQUFFO0FBSkgsR0FGTztBQVFuQkMsRUFBQUEsUUFBUSxFQUFFLElBUlM7QUFTbkJDLEVBQUFBLFNBQVMsRUFBRTtBQUNUTixJQUFBQSxJQUFJLEVBQUVPLGlDQURHO0FBRVRMLElBQUFBLElBQUksRUFBRSxJQUZHO0FBR1RDLElBQUFBLFFBQVEsRUFBRSxJQUhEO0FBSVRLLElBQUFBLE9BQU8sRUFBRTtBQUpBLEdBVFE7QUFlbkJDLEVBQUFBLFdBQVcsRUFBRUM7QUFmTSxDQUFyQjs7QUFrQkEsTUFBTUMsR0FBTixDQUFVO0FBQ1JDLEVBQUFBLFdBQVcsQ0FBRUMsSUFBSSxHQUFHLEVBQVQsRUFBYTtBQUN0QkMsSUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWMsSUFBZCxFQUFvQkYsSUFBcEI7O0FBQ0FHLG9CQUFFQyxZQUFGLENBQWUsSUFBZixFQUFxQkQsZ0JBQUVFLFNBQUYsQ0FBWXJCLFlBQVosQ0FBckI7O0FBRUEsUUFBSSxDQUFDLEtBQUtDLElBQVYsRUFBZ0I7QUFDZCxZQUFNLElBQUlxQixLQUFKLENBQVcsMEJBQVgsQ0FBTjtBQUNEOztBQUNELFNBQUtwQixVQUFMLENBQWdCSyxXQUFoQixDQUE0QmdCLElBQTVCLENBQWlDLFFBQWpDLEVBQTJDLEtBQUt0QixJQUFoRDs7QUFFQSxRQUFJLEtBQUtPLFFBQVQsRUFBbUI7QUFDakIsV0FBS04sVUFBTCxDQUFnQkssV0FBaEIsQ0FBNEJnQixJQUE1QixDQUFpQyxPQUFqQyxFQUEwQyxLQUFLZixRQUEvQztBQUNEO0FBQ0Y7O0FBYk87Ozs7QUFpQlYsS0FBSyxNQUFNLENBQUNnQixNQUFELEVBQVNDLEVBQVQsQ0FBWCxJQUEyQk4sZ0JBQUVPLE9BQUYsQ0FBVUMsY0FBVixDQUEzQixFQUErQztBQUM3Q2IsRUFBQUEsR0FBRyxDQUFDYyxTQUFKLENBQWNKLE1BQWQsSUFBd0JDLEVBQXhCO0FBQ0Q7O2VBRWNYLEciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IG1ldGhvZHMgZnJvbSAnLi90b29scy9pbmRleC5qcyc7XG5pbXBvcnQge1xuICBERUZBVUxUX0lEQl9FWEVDX1RJTUVPVVQsXG4gIElEQl9FWEVDVVRBQkxFLCBJREJfQ09NUEFOSU9OX0VYRUNVVEFCTEUsXG59IGZyb20gJy4vaGVscGVycyc7XG5cbmNvbnN0IERFRkFVTFRfT1BUUyA9IHtcbiAgdWRpZDogbnVsbCxcbiAgZXhlY3V0YWJsZToge1xuICAgIHBhdGg6IElEQl9FWEVDVVRBQkxFLFxuICAgIHBvcnQ6IG51bGwsXG4gICAgZ3JwY1BvcnQ6IG51bGwsXG4gICAgZGVmYXVsdEFyZ3M6IFtdLFxuICB9LFxuICBsb2dMZXZlbDogbnVsbCxcbiAgY29tcGFuaW9uOiB7XG4gICAgcGF0aDogSURCX0NPTVBBTklPTl9FWEVDVVRBQkxFLFxuICAgIHBvcnQ6IG51bGwsXG4gICAgZ3JwY1BvcnQ6IG51bGwsXG4gICAgbG9nUGF0aDogbnVsbCxcbiAgfSxcbiAgZXhlY1RpbWVvdXQ6IERFRkFVTFRfSURCX0VYRUNfVElNRU9VVCxcbn07XG5cbmNsYXNzIElEQiB7XG4gIGNvbnN0cnVjdG9yIChvcHRzID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIG9wdHMpO1xuICAgIF8uZGVmYXVsdHNEZWVwKHRoaXMsIF8uY2xvbmVEZWVwKERFRkFVTFRfT1BUUykpO1xuXG4gICAgaWYgKCF0aGlzLnVkaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVURJRCBtdXN0IGJlIHNldCBmb3IgaWRiYCk7XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0YWJsZS5kZWZhdWx0QXJncy5wdXNoKCctLXVkaWQnLCB0aGlzLnVkaWQpO1xuXG4gICAgaWYgKHRoaXMubG9nTGV2ZWwpIHtcbiAgICAgIHRoaXMuZXhlY3V0YWJsZS5kZWZhdWx0QXJncy5wdXNoKCctLWxvZycsIHRoaXMubG9nTGV2ZWwpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBhZGQgYWxsIHRoZSBtZXRob2RzIHRvIHRoZSBJREIgcHJvdG90eXBlXG5mb3IgKGNvbnN0IFtmbk5hbWUsIGZuXSBvZiBfLnRvUGFpcnMobWV0aG9kcykpIHtcbiAgSURCLnByb3RvdHlwZVtmbk5hbWVdID0gZm47XG59XG5cbmV4cG9ydCBkZWZhdWx0IElEQjtcbmV4cG9ydCB7IElEQiB9O1xuIl0sImZpbGUiOiJsaWIvaWRiLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
