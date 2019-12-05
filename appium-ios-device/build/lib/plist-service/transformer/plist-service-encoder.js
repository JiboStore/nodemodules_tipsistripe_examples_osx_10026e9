"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PlistServiceEncoder = void 0;

require("source-map-support/register");

var _stream = _interopRequireDefault(require("stream"));

var _appiumSupport = require("appium-support");

const HEADER_LENGTH = 4;

class PlistServiceEncoder extends _stream.default.Transform {
  constructor() {
    super({
      objectMode: true
    });
  }

  _transform(data, encoding, callback) {
    callback(null, this._encode(data));
  }

  _encode(data) {
    let payloadBuffer = _appiumSupport.plist.createPlist(data, true);

    const headerBuffer = Buffer.alloc(HEADER_LENGTH);
    headerBuffer.writeUInt32BE(payloadBuffer.length, 0);
    return Buffer.concat([headerBuffer, payloadBuffer], headerBuffer.length + payloadBuffer.length);
  }

}

exports.PlistServiceEncoder = PlistServiceEncoder;
var _default = PlistServiceEncoder;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wbGlzdC1zZXJ2aWNlL3RyYW5zZm9ybWVyL3BsaXN0LXNlcnZpY2UtZW5jb2Rlci5qcyJdLCJuYW1lcyI6WyJIRUFERVJfTEVOR1RIIiwiUGxpc3RTZXJ2aWNlRW5jb2RlciIsIlN0cmVhbSIsIlRyYW5zZm9ybSIsImNvbnN0cnVjdG9yIiwib2JqZWN0TW9kZSIsIl90cmFuc2Zvcm0iLCJkYXRhIiwiZW5jb2RpbmciLCJjYWxsYmFjayIsIl9lbmNvZGUiLCJwYXlsb2FkQnVmZmVyIiwicGxpc3QiLCJjcmVhdGVQbGlzdCIsImhlYWRlckJ1ZmZlciIsIkJ1ZmZlciIsImFsbG9jIiwid3JpdGVVSW50MzJCRSIsImxlbmd0aCIsImNvbmNhdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxhQUFhLEdBQUcsQ0FBdEI7O0FBRUEsTUFBTUMsbUJBQU4sU0FBa0NDLGdCQUFPQyxTQUF6QyxDQUFtRDtBQUVqREMsRUFBQUEsV0FBVyxHQUFJO0FBQ2IsVUFBTTtBQUFFQyxNQUFBQSxVQUFVLEVBQUU7QUFBZCxLQUFOO0FBQ0Q7O0FBRURDLEVBQUFBLFVBQVUsQ0FBRUMsSUFBRixFQUFRQyxRQUFSLEVBQWtCQyxRQUFsQixFQUE0QjtBQUNwQ0EsSUFBQUEsUUFBUSxDQUFDLElBQUQsRUFBTyxLQUFLQyxPQUFMLENBQWFILElBQWIsQ0FBUCxDQUFSO0FBQ0Q7O0FBRURHLEVBQUFBLE9BQU8sQ0FBRUgsSUFBRixFQUFRO0FBQ2IsUUFBSUksYUFBYSxHQUFHQyxxQkFBTUMsV0FBTixDQUFrQk4sSUFBbEIsRUFBd0IsSUFBeEIsQ0FBcEI7O0FBQ0EsVUFBTU8sWUFBWSxHQUFHQyxNQUFNLENBQUNDLEtBQVAsQ0FBYWhCLGFBQWIsQ0FBckI7QUFDQWMsSUFBQUEsWUFBWSxDQUFDRyxhQUFiLENBQTJCTixhQUFhLENBQUNPLE1BQXpDLEVBQWlELENBQWpEO0FBQ0EsV0FBT0gsTUFBTSxDQUFDSSxNQUFQLENBQWMsQ0FBQ0wsWUFBRCxFQUFlSCxhQUFmLENBQWQsRUFBNkNHLFlBQVksQ0FBQ0ksTUFBYixHQUFzQlAsYUFBYSxDQUFDTyxNQUFqRixDQUFQO0FBQ0Q7O0FBZmdEOzs7ZUFvQnBDakIsbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBwcm9taXNlL3ByZWZlci1hd2FpdC10by1jYWxsYmFja3MgKi9cbmltcG9ydCBTdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IHBsaXN0IH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuXG5jb25zdCBIRUFERVJfTEVOR1RIID0gNDtcblxuY2xhc3MgUGxpc3RTZXJ2aWNlRW5jb2RlciBleHRlbmRzIFN0cmVhbS5UcmFuc2Zvcm0ge1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcih7IG9iamVjdE1vZGU6IHRydWUgfSk7XG4gIH1cblxuICBfdHJhbnNmb3JtIChkYXRhLCBlbmNvZGluZywgY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhudWxsLCB0aGlzLl9lbmNvZGUoZGF0YSkpO1xuICB9XG5cbiAgX2VuY29kZSAoZGF0YSkge1xuICAgIGxldCBwYXlsb2FkQnVmZmVyID0gcGxpc3QuY3JlYXRlUGxpc3QoZGF0YSwgdHJ1ZSk7XG4gICAgY29uc3QgaGVhZGVyQnVmZmVyID0gQnVmZmVyLmFsbG9jKEhFQURFUl9MRU5HVEgpO1xuICAgIGhlYWRlckJ1ZmZlci53cml0ZVVJbnQzMkJFKHBheWxvYWRCdWZmZXIubGVuZ3RoLCAwKTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbaGVhZGVyQnVmZmVyLCBwYXlsb2FkQnVmZmVyXSwgaGVhZGVyQnVmZmVyLmxlbmd0aCArIHBheWxvYWRCdWZmZXIubGVuZ3RoKTtcbiAgfVxuXG59XG5cbmV4cG9ydCB7IFBsaXN0U2VydmljZUVuY29kZXIgfTtcbmV4cG9ydCBkZWZhdWx0IFBsaXN0U2VydmljZUVuY29kZXI7Il0sImZpbGUiOiJsaWIvcGxpc3Qtc2VydmljZS90cmFuc2Zvcm1lci9wbGlzdC1zZXJ2aWNlLWVuY29kZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vLi4ifQ==