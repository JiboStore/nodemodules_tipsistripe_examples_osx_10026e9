"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.LengthBasedSplitter = void 0;

require("source-map-support/register");

var _stream = _interopRequireDefault(require("stream"));

class LengthBasedSplitter extends _stream.default.Transform {
  constructor(littleEndian, maxFrameLength, lengthFieldOffset, lengthFieldLength, lengthAdjustment) {
    super();
    this.littleEndian = littleEndian;
    this.maxFrameLength = maxFrameLength;
    this.lengthFieldOffset = lengthFieldOffset;
    this.lengthFieldLength = lengthFieldLength;
    this.lengthAdjustment = lengthAdjustment;
    this._frameBufferIndex = 0;
    this._frameBuffer = Buffer.allocUnsafeSlow(maxFrameLength);
  }

  _transform(data, encoding, callback) {
    for (let i = 0; i < data.length; i = this._decode(data, i)) {}

    callback();
  }

  _decode(data, pos) {
    let bufferMarker = pos;
    let bytesToRead = Math.max(this.lengthFieldOffset + this.lengthFieldLength - this._frameBufferIndex, 0);
    let nBytesRead = bytesToRead === 0 ? 0 : this._readBytes(data, bufferMarker, this._frameBuffer, this._frameBufferIndex, bytesToRead);
    bufferMarker += nBytesRead;
    this._frameBufferIndex += nBytesRead;

    if (this._frameBufferIndex < this.lengthFieldOffset) {
      return bufferMarker;
    }

    const messageLength = this._readLength(this._frameBuffer, this.lengthFieldOffset, this.littleEndian);

    if (messageLength > this.maxFrameLength) {
      throw new Error(`The frame is bigger than expected. Length: ${messageLength}, max: ${this.maxFrameLength}`);
    }

    const completeMessageLength = messageLength + this.lengthAdjustment + this.lengthFieldOffset;
    bytesToRead = completeMessageLength - this._frameBufferIndex;
    nBytesRead = bytesToRead === 0 ? 0 : this._readBytes(data, bufferMarker, this._frameBuffer, this._frameBufferIndex, bytesToRead);
    bufferMarker += nBytesRead;
    this._frameBufferIndex += nBytesRead;

    if (this._frameBufferIndex < completeMessageLength) {
      return bufferMarker;
    }

    let message = Buffer.allocUnsafe(this._frameBufferIndex);

    this._frameBuffer.copy(message, 0, 0, this._frameBufferIndex);

    this._resetBuffers();

    this.push(message);
    return bufferMarker;
  }

  _readBytes(src, srcIndex, target, targetIndex, nBytesToBeRead) {
    let availableBytes = Math.min(nBytesToBeRead, src.length - srcIndex);
    src.copy(target, targetIndex, srcIndex, srcIndex + availableBytes);
    return availableBytes;
  }

  _resetBuffers() {
    this._frameBufferIndex = 0;
  }

  _readLength(data, index, littleEndian) {
    switch (this.lengthFieldLength) {
      case 4:
        return littleEndian ? data.readUInt32LE(index) : data.readUInt32BE(index);

      case 8:
        return littleEndian ? data.readUInt32LE(index) : data.readUInt32BE(index + 4);

      default:
        throw new Error(`${this.lengthFieldLength} is not supported. Only 4 and 8 are supported at the moment`);
    }
  }

}

exports.LengthBasedSplitter = LengthBasedSplitter;
var _default = LengthBasedSplitter;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlsL3RyYW5zZm9ybWVyL2xlbmd0aC1iYXNlZC1zcGxpdHRlci5qcyJdLCJuYW1lcyI6WyJMZW5ndGhCYXNlZFNwbGl0dGVyIiwiU3RyZWFtIiwiVHJhbnNmb3JtIiwiY29uc3RydWN0b3IiLCJsaXR0bGVFbmRpYW4iLCJtYXhGcmFtZUxlbmd0aCIsImxlbmd0aEZpZWxkT2Zmc2V0IiwibGVuZ3RoRmllbGRMZW5ndGgiLCJsZW5ndGhBZGp1c3RtZW50IiwiX2ZyYW1lQnVmZmVySW5kZXgiLCJfZnJhbWVCdWZmZXIiLCJCdWZmZXIiLCJhbGxvY1Vuc2FmZVNsb3ciLCJfdHJhbnNmb3JtIiwiZGF0YSIsImVuY29kaW5nIiwiY2FsbGJhY2siLCJpIiwibGVuZ3RoIiwiX2RlY29kZSIsInBvcyIsImJ1ZmZlck1hcmtlciIsImJ5dGVzVG9SZWFkIiwiTWF0aCIsIm1heCIsIm5CeXRlc1JlYWQiLCJfcmVhZEJ5dGVzIiwibWVzc2FnZUxlbmd0aCIsIl9yZWFkTGVuZ3RoIiwiRXJyb3IiLCJjb21wbGV0ZU1lc3NhZ2VMZW5ndGgiLCJtZXNzYWdlIiwiYWxsb2NVbnNhZmUiLCJjb3B5IiwiX3Jlc2V0QnVmZmVycyIsInB1c2giLCJzcmMiLCJzcmNJbmRleCIsInRhcmdldCIsInRhcmdldEluZGV4IiwibkJ5dGVzVG9CZVJlYWQiLCJhdmFpbGFibGVCeXRlcyIsIm1pbiIsImluZGV4IiwicmVhZFVJbnQzMkxFIiwicmVhZFVJbnQzMkJFIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUNBOztBQUVBLE1BQU1BLG1CQUFOLFNBQWtDQyxnQkFBT0MsU0FBekMsQ0FBbUQ7QUFFakRDLEVBQUFBLFdBQVcsQ0FBRUMsWUFBRixFQUFnQkMsY0FBaEIsRUFBZ0NDLGlCQUFoQyxFQUFtREMsaUJBQW5ELEVBQXNFQyxnQkFBdEUsRUFBd0Y7QUFDakc7QUFDQSxTQUFLSixZQUFMLEdBQW9CQSxZQUFwQjtBQUNBLFNBQUtDLGNBQUwsR0FBc0JBLGNBQXRCO0FBQ0EsU0FB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bEIsSUFBSSxDQUFDbUIsR0FBTCxDQUFTRixjQUFULEVBQXlCSixHQUFHLENBQUNsQixNQUFKLEdBQWFtQixRQUF0QyxDQUFyQjtBQUNBRCxJQUFBQSxHQUFHLENBQUNILElBQUosQ0FBU0ssTUFBVCxFQUFpQkMsV0FBakIsRUFBOEJGLFFBQTlCLEVBQXdDQSxRQUFRLEdBQUdJLGNBQW5EO0FBQ0EsV0FBT0EsY0FBUDtBQUNEOztBQUNEUCxFQUFBQSxhQUFhLEdBQUk7QUFDZixTQUFLekIsaUJBQUwsR0FBeUIsQ0FBekI7QUFDRDs7QUFFRG1CLEVBQUFBLFdBQVcsQ0FBRWQsSUFBRixFQUFRNkIsS0FBUixFQUFldkMsWUFBZixFQUE2QjtBQUN0QyxZQUFRLEtBQUtHLGlCQUFiO0FBQ0UsV0FBSyxDQUFMO0FBQ0UsZUFBT0gsWUFBWSxHQUFHVSxJQUFJLENBQUM4QixZQUFMLENBQWtCRCxLQUFsQixDQUFILEdBQThCN0IsSUFBSSxDQUFDK0IsWUFBTCxDQUFrQkYsS0FBbEIsQ0FBakQ7O0FBQ0YsV0FBSyxDQUFMO0FBQ0UsZUFBT3ZDLFlBQVksR0FBR1UsSUFBSSxDQUFDOEIsWUFBTCxDQUFrQkQsS0FBbEIsQ0FBSCxHQUE4QjdCLElBQUksQ0FBQytCLFlBQUwsQ0FBa0JGLEtBQUssR0FBRyxDQUExQixDQUFqRDs7QUFDRjtBQUNFLGNBQU0sSUFBSWQsS0FBSixDQUFXLEdBQUUsS0FBS3RCLGlCQUFrQiw2REFBcEMsQ0FBTjtBQU5KO0FBUUQ7O0FBM0VnRDs7O2VBK0VwQ1AsbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBwcm9taXNlL3ByZWZlci1hd2FpdC10by1jYWxsYmFja3MgKi9cbmltcG9ydCBTdHJlYW0gZnJvbSAnc3RyZWFtJztcblxuY2xhc3MgTGVuZ3RoQmFzZWRTcGxpdHRlciBleHRlbmRzIFN0cmVhbS5UcmFuc2Zvcm0ge1xuXG4gIGNvbnN0cnVjdG9yIChsaXR0bGVFbmRpYW4sIG1heEZyYW1lTGVuZ3RoLCBsZW5ndGhGaWVsZE9mZnNldCwgbGVuZ3RoRmllbGRMZW5ndGgsIGxlbmd0aEFkanVzdG1lbnQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubGl0dGxlRW5kaWFuID0gbGl0dGxlRW5kaWFuO1xuICAgIHRoaXMubWF4RnJhbWVMZW5ndGggPSBtYXhGcmFtZUxlbmd0aDtcbiAgICB0aGlzLmxlbmd0aEZpZWxkT2Zmc2V0ID0gbGVuZ3RoRmllbGRPZmZzZXQ7XG4gICAgdGhpcy5sZW5ndGhGaWVsZExlbmd0aCA9IGxlbmd0aEZpZWxkTGVuZ3RoO1xuICAgIHRoaXMubGVuZ3RoQWRqdXN0bWVudCA9IGxlbmd0aEFkanVzdG1lbnQ7XG5cbiAgICB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4ID0gMDtcbiAgICB0aGlzLl9mcmFtZUJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cobWF4RnJhbWVMZW5ndGgpO1xuICB9XG5cbiAgX3RyYW5zZm9ybSAoZGF0YSwgZW5jb2RpbmcsIGNhbGxiYWNrKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCA7IGkgPSB0aGlzLl9kZWNvZGUoZGF0YSwgaSkpIHt9XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuXG4gIF9kZWNvZGUgKGRhdGEsIHBvcykge1xuXG4gICAgbGV0IGJ1ZmZlck1hcmtlciA9IHBvcztcblxuICAgIGxldCBieXRlc1RvUmVhZCA9IE1hdGgubWF4KCh0aGlzLmxlbmd0aEZpZWxkT2Zmc2V0ICsgdGhpcy5sZW5ndGhGaWVsZExlbmd0aCkgLSB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4LCAwKTtcbiAgICBsZXQgbkJ5dGVzUmVhZCA9IGJ5dGVzVG9SZWFkID09PSAwID8gMCA6IHRoaXMuX3JlYWRCeXRlcyhkYXRhLCBidWZmZXJNYXJrZXIsIHRoaXMuX2ZyYW1lQnVmZmVyLCB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4LCBieXRlc1RvUmVhZCk7XG4gICAgYnVmZmVyTWFya2VyICs9IG5CeXRlc1JlYWQ7XG4gICAgdGhpcy5fZnJhbWVCdWZmZXJJbmRleCArPSBuQnl0ZXNSZWFkO1xuXG4gICAgaWYgKHRoaXMuX2ZyYW1lQnVmZmVySW5kZXggPCB0aGlzLmxlbmd0aEZpZWxkT2Zmc2V0KSB7XG4gICAgICByZXR1cm4gYnVmZmVyTWFya2VyO1xuICAgIH1cblxuICAgIGNvbnN0IG1lc3NhZ2VMZW5ndGggPSB0aGlzLl9yZWFkTGVuZ3RoKHRoaXMuX2ZyYW1lQnVmZmVyLCB0aGlzLmxlbmd0aEZpZWxkT2Zmc2V0LCB0aGlzLmxpdHRsZUVuZGlhbik7XG4gICAgaWYgKG1lc3NhZ2VMZW5ndGggPiB0aGlzLm1heEZyYW1lTGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBmcmFtZSBpcyBiaWdnZXIgdGhhbiBleHBlY3RlZC4gTGVuZ3RoOiAke21lc3NhZ2VMZW5ndGh9LCBtYXg6ICR7dGhpcy5tYXhGcmFtZUxlbmd0aH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0ZU1lc3NhZ2VMZW5ndGggPSBtZXNzYWdlTGVuZ3RoICsgdGhpcy5sZW5ndGhBZGp1c3RtZW50ICsgdGhpcy5sZW5ndGhGaWVsZE9mZnNldDtcblxuICAgIGJ5dGVzVG9SZWFkID0gY29tcGxldGVNZXNzYWdlTGVuZ3RoIC0gdGhpcy5fZnJhbWVCdWZmZXJJbmRleDtcbiAgICBuQnl0ZXNSZWFkID0gYnl0ZXNUb1JlYWQgPT09IDAgPyAwIDogdGhpcy5fcmVhZEJ5dGVzKGRhdGEsIGJ1ZmZlck1hcmtlciwgdGhpcy5fZnJhbWVCdWZmZXIsIHRoaXMuX2ZyYW1lQnVmZmVySW5kZXgsIGJ5dGVzVG9SZWFkKTtcbiAgICBidWZmZXJNYXJrZXIgKz0gbkJ5dGVzUmVhZDtcbiAgICB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4ICs9IG5CeXRlc1JlYWQ7XG5cbiAgICBpZiAodGhpcy5fZnJhbWVCdWZmZXJJbmRleCA8IGNvbXBsZXRlTWVzc2FnZUxlbmd0aCkge1xuICAgICAgcmV0dXJuIGJ1ZmZlck1hcmtlcjtcbiAgICB9XG5cbiAgICBsZXQgbWVzc2FnZSA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSh0aGlzLl9mcmFtZUJ1ZmZlckluZGV4KTtcbiAgICB0aGlzLl9mcmFtZUJ1ZmZlci5jb3B5KG1lc3NhZ2UsIDAsIDAsIHRoaXMuX2ZyYW1lQnVmZmVySW5kZXgpO1xuXG4gICAgdGhpcy5fcmVzZXRCdWZmZXJzKCk7XG5cbiAgICB0aGlzLnB1c2gobWVzc2FnZSk7XG4gICAgcmV0dXJuIGJ1ZmZlck1hcmtlcjtcbiAgfVxuXG4gIF9yZWFkQnl0ZXMgKHNyYywgc3JjSW5kZXgsIHRhcmdldCwgdGFyZ2V0SW5kZXgsIG5CeXRlc1RvQmVSZWFkKSB7XG4gICAgbGV0IGF2YWlsYWJsZUJ5dGVzID0gTWF0aC5taW4obkJ5dGVzVG9CZVJlYWQsIHNyYy5sZW5ndGggLSBzcmNJbmRleCk7XG4gICAgc3JjLmNvcHkodGFyZ2V0LCB0YXJnZXRJbmRleCwgc3JjSW5kZXgsIHNyY0luZGV4ICsgYXZhaWxhYmxlQnl0ZXMpO1xuICAgIHJldHVybiBhdmFpbGFibGVCeXRlcztcbiAgfVxuICBfcmVzZXRCdWZmZXJzICgpIHtcbiAgICB0aGlzLl9mcmFtZUJ1ZmZlckluZGV4ID0gMDtcbiAgfVxuXG4gIF9yZWFkTGVuZ3RoIChkYXRhLCBpbmRleCwgbGl0dGxlRW5kaWFuKSB7XG4gICAgc3dpdGNoICh0aGlzLmxlbmd0aEZpZWxkTGVuZ3RoKSB7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIHJldHVybiBsaXR0bGVFbmRpYW4gPyBkYXRhLnJlYWRVSW50MzJMRShpbmRleCkgOiBkYXRhLnJlYWRVSW50MzJCRShpbmRleCk7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHJldHVybiBsaXR0bGVFbmRpYW4gPyBkYXRhLnJlYWRVSW50MzJMRShpbmRleCkgOiBkYXRhLnJlYWRVSW50MzJCRShpbmRleCArIDQpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMubGVuZ3RoRmllbGRMZW5ndGh9IGlzIG5vdCBzdXBwb3J0ZWQuIE9ubHkgNCBhbmQgOCBhcmUgc3VwcG9ydGVkIGF0IHRoZSBtb21lbnRgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHsgTGVuZ3RoQmFzZWRTcGxpdHRlcn07XG5leHBvcnQgZGVmYXVsdCBMZW5ndGhCYXNlZFNwbGl0dGVyO1xuIl0sImZpbGUiOiJsaWIvdXRpbC90cmFuc2Zvcm1lci9sZW5ndGgtYmFzZWQtc3BsaXR0ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vLi4ifQ==