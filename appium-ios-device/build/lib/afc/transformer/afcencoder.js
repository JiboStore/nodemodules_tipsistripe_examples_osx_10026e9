"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AfcEncoder = void 0;

require("source-map-support/register");

var _stream = _interopRequireDefault(require("stream"));

var _protocol = require("../protocol");

class AfcEncoder extends _stream.default.Transform {
  constructor() {
    super({
      objectMode: true
    });
  }

  _transform(data, encoding, callback) {
    callback(null, this._encode(data));
  }

  _encode(data) {
    data.content = data.content ? data.content : Buffer.alloc(0);
    const thisLength = _protocol.AFC_PACKET_HEADER_SIZE + data.headerPayload.length;
    const messageLength = thisLength + data.content.length;
    const buffer = Buffer.alloc(messageLength);

    _protocol.MAGIC_NUMBER.copy(buffer);

    this.writeUInt64LE(buffer, 8, messageLength);
    this.writeUInt64LE(buffer, 16, thisLength);
    this.writeUInt64LE(buffer, 24, data.packetNumber);
    this.writeUInt64LE(buffer, 32, data.opCode);
    data.headerPayload.copy(buffer, _protocol.AFC_PACKET_HEADER_SIZE);
    data.content.copy(buffer, thisLength);
    return buffer;
  }

  writeUInt64LE(buffer, index, content) {
    buffer.writeUInt32LE(content, index);
    buffer.writeUInt32LE(0, index + 4);
  }

}

exports.AfcEncoder = AfcEncoder;
var _default = AfcEncoder;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hZmMvdHJhbnNmb3JtZXIvYWZjZW5jb2Rlci5qcyJdLCJuYW1lcyI6WyJBZmNFbmNvZGVyIiwiU3RyZWFtIiwiVHJhbnNmb3JtIiwiY29uc3RydWN0b3IiLCJvYmplY3RNb2RlIiwiX3RyYW5zZm9ybSIsImRhdGEiLCJlbmNvZGluZyIsImNhbGxiYWNrIiwiX2VuY29kZSIsImNvbnRlbnQiLCJCdWZmZXIiLCJhbGxvYyIsInRoaXNMZW5ndGgiLCJBRkNfUEFDS0VUX0hFQURFUl9TSVpFIiwiaGVhZGVyUGF5bG9hZCIsImxlbmd0aCIsIm1lc3NhZ2VMZW5ndGgiLCJidWZmZXIiLCJNQUdJQ19OVU1CRVIiLCJjb3B5Iiwid3JpdGVVSW50NjRMRSIsInBhY2tldE51bWJlciIsIm9wQ29kZSIsImluZGV4Iiwid3JpdGVVSW50MzJMRSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFHQSxNQUFNQSxVQUFOLFNBQXlCQyxnQkFBT0MsU0FBaEMsQ0FBMEM7QUFFeENDLEVBQUFBLFdBQVcsR0FBSTtBQUNiLFVBQU07QUFBRUMsTUFBQUEsVUFBVSxFQUFFO0FBQWQsS0FBTjtBQUNEOztBQUVEQyxFQUFBQSxVQUFVLENBQUVDLElBQUYsRUFBUUMsUUFBUixFQUFrQkMsUUFBbEIsRUFBNEI7QUFDcENBLElBQUFBLFFBQVEsQ0FBQyxJQUFELEVBQU8sS0FBS0MsT0FBTCxDQUFhSCxJQUFiLENBQVAsQ0FBUjtBQUNEOztBQUVERyxFQUFBQSxPQUFPLENBQUVILElBQUYsRUFBUTtBQUNiQSxJQUFBQSxJQUFJLENBQUNJLE9BQUwsR0FBZUosSUFBSSxDQUFDSSxPQUFMLEdBQWVKLElBQUksQ0FBQ0ksT0FBcEIsR0FBOEJDLE1BQU0sQ0FBQ0MsS0FBUCxDQUFhLENBQWIsQ0FBN0M7QUFFQSxVQUFNQyxVQUFVLEdBQUdDLG1DQUF5QlIsSUFBSSxDQUFDUyxhQUFMLENBQW1CQyxNQUEvRDtBQUNBLFVBQU1DLGFBQWEsR0FBR0osVUFBVSxHQUFHUCxJQUFJLENBQUNJLE9BQUwsQ0FBYU0sTUFBaEQ7QUFFQSxVQUFNRSxNQUFNLEdBQUdQLE1BQU0sQ0FBQ0MsS0FBUCxDQUFhSyxhQUFiLENBQWY7O0FBQ0FFLDJCQUFhQyxJQUFiLENBQWtCRixNQUFsQjs7QUFDQSxTQUFLRyxhQUFMLENBQW1CSCxNQUFuQixFQUEyQixDQUEzQixFQUE4QkQsYUFBOUI7QUFDQSxTQUFLSSxhQUFMLENBQW1CSCxNQUFuQixFQUEyQixFQUEzQixFQUErQkwsVUFBL0I7QUFDQSxTQUFLUSxhQUFMLENBQW1CSCxNQUFuQixFQUEyQixFQUEzQixFQUErQlosSUFBSSxDQUFDZ0IsWUFBcEM7QUFDQSxTQUFLRCxhQUFMLENBQW1CSCxNQUFuQixFQUEyQixFQUEzQixFQUErQlosSUFBSSxDQUFDaUIsTUFBcEM7QUFDQWpCLElBQUFBLElBQUksQ0FBQ1MsYUFBTCxDQUFtQkssSUFBbkIsQ0FBd0JGLE1BQXhCLEVBQWdDSixnQ0FBaEM7QUFDQVIsSUFBQUEsSUFBSSxDQUFDSSxPQUFMLENBQWFVLElBQWIsQ0FBa0JGLE1BQWxCLEVBQTBCTCxVQUExQjtBQUNBLFdBQU9LLE1BQVA7QUFDRDs7QUFFREcsRUFBQUEsYUFBYSxDQUFFSCxNQUFGLEVBQVVNLEtBQVYsRUFBaUJkLE9BQWpCLEVBQTBCO0FBRXJDUSxJQUFBQSxNQUFNLENBQUNPLGFBQVAsQ0FBcUJmLE9BQXJCLEVBQThCYyxLQUE5QjtBQUNBTixJQUFBQSxNQUFNLENBQUNPLGFBQVAsQ0FBcUIsQ0FBckIsRUFBd0JELEtBQUssR0FBRyxDQUFoQztBQUNEOztBQS9CdUM7OztlQW9DM0J4QixVIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgcHJvbWlzZS9wcmVmZXItYXdhaXQtdG8tY2FsbGJhY2tzICovXG5pbXBvcnQgU3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgeyBNQUdJQ19OVU1CRVIsIEFGQ19QQUNLRVRfSEVBREVSX1NJWkUgfSBmcm9tICcuLi9wcm90b2NvbCc7XG5cblxuY2xhc3MgQWZjRW5jb2RlciBleHRlbmRzIFN0cmVhbS5UcmFuc2Zvcm0ge1xuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcih7IG9iamVjdE1vZGU6IHRydWUgfSk7XG4gIH1cblxuICBfdHJhbnNmb3JtIChkYXRhLCBlbmNvZGluZywgY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhudWxsLCB0aGlzLl9lbmNvZGUoZGF0YSkpO1xuICB9XG5cbiAgX2VuY29kZSAoZGF0YSkge1xuICAgIGRhdGEuY29udGVudCA9IGRhdGEuY29udGVudCA/IGRhdGEuY29udGVudCA6IEJ1ZmZlci5hbGxvYygwKTtcblxuICAgIGNvbnN0IHRoaXNMZW5ndGggPSBBRkNfUEFDS0VUX0hFQURFUl9TSVpFICsgZGF0YS5oZWFkZXJQYXlsb2FkLmxlbmd0aDtcbiAgICBjb25zdCBtZXNzYWdlTGVuZ3RoID0gdGhpc0xlbmd0aCArIGRhdGEuY29udGVudC5sZW5ndGg7XG5cbiAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuYWxsb2MobWVzc2FnZUxlbmd0aCk7XG4gICAgTUFHSUNfTlVNQkVSLmNvcHkoYnVmZmVyKTtcbiAgICB0aGlzLndyaXRlVUludDY0TEUoYnVmZmVyLCA4LCBtZXNzYWdlTGVuZ3RoKTtcbiAgICB0aGlzLndyaXRlVUludDY0TEUoYnVmZmVyLCAxNiwgdGhpc0xlbmd0aCk7XG4gICAgdGhpcy53cml0ZVVJbnQ2NExFKGJ1ZmZlciwgMjQsIGRhdGEucGFja2V0TnVtYmVyKTtcbiAgICB0aGlzLndyaXRlVUludDY0TEUoYnVmZmVyLCAzMiwgZGF0YS5vcENvZGUpO1xuICAgIGRhdGEuaGVhZGVyUGF5bG9hZC5jb3B5KGJ1ZmZlciwgQUZDX1BBQ0tFVF9IRUFERVJfU0laRSk7XG4gICAgZGF0YS5jb250ZW50LmNvcHkoYnVmZmVyLCB0aGlzTGVuZ3RoKTtcbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgd3JpdGVVSW50NjRMRSAoYnVmZmVyLCBpbmRleCwgY29udGVudCkge1xuICAgIC8vIElnbm9yZSB0aGUgZmlyc3QgNCBieXRlcyBzaW5jZSB3ZSBkb24ndCBkbyBhbnl0aGluZyB3aXRoIGxvbmdzXG4gICAgYnVmZmVyLndyaXRlVUludDMyTEUoY29udGVudCwgaW5kZXgpO1xuICAgIGJ1ZmZlci53cml0ZVVJbnQzMkxFKDAsIGluZGV4ICsgNCk7XG4gIH1cblxufVxuXG5leHBvcnQgeyBBZmNFbmNvZGVyIH07XG5leHBvcnQgZGVmYXVsdCBBZmNFbmNvZGVyOyJdLCJmaWxlIjoibGliL2FmYy90cmFuc2Zvcm1lci9hZmNlbmNvZGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uLy4uIn0=
