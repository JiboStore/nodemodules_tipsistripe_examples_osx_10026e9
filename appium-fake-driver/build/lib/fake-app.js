"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FakeApp = void 0;

require("source-map-support/register");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _fs = _interopRequireDefault(require("fs"));

var _xmldom = _interopRequireDefault(require("xmldom"));

var _xpath = _interopRequireDefault(require("xpath"));

var _logger = _interopRequireDefault(require("./logger"));

var _fakeElement = require("./fake-element");

const readFile = _bluebird.default.promisify(_fs.default.readFile);

class FakeApp {
  constructor() {
    this.dom = null;
    this.activeDom = null;
    this.activeWebview = null;
    this.activeFrame = null;
    this.activeAlert = null;
    this.lat = 0;
    this.long = 0;
    this.rawXml = '';
    this.currentOrientation = 'PORTRAIT';
  }

  get title() {
    let nodes = this.xpathQuery('//title');

    if (nodes.length < 1) {
      throw new Error('No title!');
    }

    return nodes[0].firstChild.data;
  }

  get currentGeoLocation() {
    return {
      latitude: this.lat,
      longitude: this.long
    };
  }

  get orientation() {
    return this.currentOrientation;
  }

  set orientation(o) {
    this.currentOrientation = o;
  }

  async loadApp(appPath) {
    _logger.default.info('Loading Mock app model');

    let data = await readFile(appPath);

    _logger.default.info('Parsing Mock app XML');

    this.rawXml = data.toString();
    this.dom = new _xmldom.default.DOMParser().parseFromString(this.rawXml);
    this.activeDom = this.dom;
  }

  getWebviews() {
    return this.xpathQuery('//MockWebView/*[1]').map(n => {
      return new FakeWebView(n);
    });
  }

  activateWebview(wv) {
    this.activeWebview = wv;
    let fragment = new _xmldom.default.XMLSerializer().serializeToString(wv.node);
    this.activeDom = new _xmldom.default.DOMParser().parseFromString(fragment, 'application/xml');
  }

  deactivateWebview() {
    this.activeWebview = null;
    this.activeDom = this.dom;
  }

  activateFrame(frame) {
    this.activeFrame = frame;
    let fragment = new _xmldom.default.XMLSerializer().serializeToString(frame);
    this.activeDom = new _xmldom.default.DOMParser().parseFromString(fragment, 'application/xml');
  }

  deactivateFrame() {
    this.activeFrame = null;
    this.activateWebview(this.activeWebview);
  }

  xpathQuery(sel, ctx) {
    return _xpath.default.select(sel, ctx || this.activeDom);
  }

  idQuery(id, ctx) {
    return this.xpathQuery(`//*[@id="${id}"]`, ctx);
  }

  classQuery(className, ctx) {
    return this.xpathQuery(`//${className}`, ctx);
  }

  hasAlert() {
    return this.activeAlert !== null;
  }

  setAlertText(text) {
    if (!this.activeAlert.hasPrompt()) {
      throw new Error('No prompt to set text of');
    }

    this.activeAlert.setAttr('prompt', text);
  }

  showAlert(alertId) {
    let nodes = this.xpathQuery(`//alert[@id="${alertId}"]`);

    if (nodes.length < 1) {
      throw new Error(`Alert ${alertId} doesn't exist!`);
    }

    this.activeAlert = new _fakeElement.FakeElement(nodes[0], this);
  }

  alertText() {
    return this.activeAlert.getAttr('prompt') || this.activeAlert.nodeAttrs.text;
  }

  handleAlert() {
    this.activeAlert = null;
  }

  getScreenshot() {
    return 'hahahanotreallyascreenshot';
  }

}

exports.FakeApp = FakeApp;

class FakeWebView {
  constructor(node) {
    this.node = node;
  }

}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mYWtlLWFwcC5qcyJdLCJuYW1lcyI6WyJyZWFkRmlsZSIsIkIiLCJwcm9taXNpZnkiLCJmcyIsIkZha2VBcHAiLCJjb25zdHJ1Y3RvciIsImRvbSIsImFjdGl2ZURvbSIsImFjdGl2ZVdlYnZpZXciLCJhY3RpdmVGcmFtZSIsImFjdGl2ZUFsZXJ0IiwibGF0IiwibG9uZyIsInJhd1htbCIsImN1cnJlbnRPcmllbnRhdGlvbiIsInRpdGxlIiwibm9kZXMiLCJ4cGF0aFF1ZXJ5IiwibGVuZ3RoIiwiRXJyb3IiLCJmaXJzdENoaWxkIiwiZGF0YSIsImN1cnJlbnRHZW9Mb2NhdGlvbiIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwib3JpZW50YXRpb24iLCJvIiwibG9hZEFwcCIsImFwcFBhdGgiLCJsb2ciLCJpbmZvIiwidG9TdHJpbmciLCJYTUxEb20iLCJET01QYXJzZXIiLCJwYXJzZUZyb21TdHJpbmciLCJnZXRXZWJ2aWV3cyIsIm1hcCIsIm4iLCJGYWtlV2ViVmlldyIsImFjdGl2YXRlV2VidmlldyIsInd2IiwiZnJhZ21lbnQiLCJYTUxTZXJpYWxpemVyIiwic2VyaWFsaXplVG9TdHJpbmciLCJub2RlIiwiZGVhY3RpdmF0ZVdlYnZpZXciLCJhY3RpdmF0ZUZyYW1lIiwiZnJhbWUiLCJkZWFjdGl2YXRlRnJhbWUiLCJzZWwiLCJjdHgiLCJ4cGF0aCIsInNlbGVjdCIsImlkUXVlcnkiLCJpZCIsImNsYXNzUXVlcnkiLCJjbGFzc05hbWUiLCJoYXNBbGVydCIsInNldEFsZXJ0VGV4dCIsInRleHQiLCJoYXNQcm9tcHQiLCJzZXRBdHRyIiwic2hvd0FsZXJ0IiwiYWxlcnRJZCIsIkZha2VFbGVtZW50IiwiYWxlcnRUZXh0IiwiZ2V0QXR0ciIsIm5vZGVBdHRycyIsImhhbmRsZUFsZXJ0IiwiZ2V0U2NyZWVuc2hvdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxRQUFR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QU47QUFDRDs7QUFDRCxTQUFLckQsV0FBTCxHQUFtQixJQUFJc0Qsd0JBQUosQ0FBZ0JoRCxLQUFLLENBQUMsQ0FBRCxDQUFyQixFQUEwQixJQUExQixDQUFuQjtBQUNEOztBQUVEaUQsRUFBQUEsU0FBUyxHQUFJO0FBQ1gsV0FBTyxLQUFLdkQsV0FBTCxDQUFpQndELE9BQWpCLENBQXlCLFFBQXpCLEtBQ0EsS0FBS3hELFdBQUwsQ0FBaUJ5RCxTQUFqQixDQUEyQlIsSUFEbEM7QUFFRDs7QUFFRFMsRUFBQUEsV0FBVyxHQUFJO0FBQ2IsU0FBSzFELFdBQUwsR0FBbUIsSUFBbkI7QUFDRDs7QUFFRDJELEVBQUFBLGFBQWEsR0FBSTtBQUNmLFdBQU8sNEJBQVA7QUFDRDs7QUFySFc7Ozs7QUF5SGQsTUFBTS9CLFdBQU4sQ0FBa0I7QUFDaEJqQyxFQUFBQSxXQUFXLENBQUV1QyxJQUFGLEVBQVE7QUFDakIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0Q7O0FBSGUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IFhNTERvbSBmcm9tICd4bWxkb20nO1xuaW1wb3J0IHhwYXRoIGZyb20gJ3hwYXRoJztcbmltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInO1xuaW1wb3J0IHsgRmFrZUVsZW1lbnQgfSBmcm9tICcuL2Zha2UtZWxlbWVudCc7XG5cbmNvbnN0IHJlYWRGaWxlID0gQi5wcm9taXNpZnkoZnMucmVhZEZpbGUpO1xuXG5jbGFzcyBGYWtlQXBwIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuZG9tID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZURvbSA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVXZWJ2aWV3ID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZUZyYW1lID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZUFsZXJ0ID0gbnVsbDtcbiAgICB0aGlzLmxhdCA9IDA7XG4gICAgdGhpcy5sb25nID0gMDtcbiAgICB0aGlzLnJhd1htbCA9ICcnO1xuICAgIHRoaXMuY3VycmVudE9yaWVudGF0aW9uID0gJ1BPUlRSQUlUJztcbiAgfVxuXG4gIGdldCB0aXRsZSAoKSB7XG4gICAgbGV0IG5vZGVzID0gdGhpcy54cGF0aFF1ZXJ5KCcvL3RpdGxlJyk7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdGl0bGUhJyk7XG4gICAgfVxuICAgIHJldHVybiBub2Rlc1swXS5maXJzdENoaWxkLmRhdGE7XG4gIH1cblxuICBnZXQgY3VycmVudEdlb0xvY2F0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGF0aXR1ZGU6IHRoaXMubGF0LFxuICAgICAgbG9uZ2l0dWRlOiB0aGlzLmxvbmdcbiAgICB9O1xuICB9XG5cbiAgZ2V0IG9yaWVudGF0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50T3JpZW50YXRpb247XG4gIH1cblxuICBzZXQgb3JpZW50YXRpb24gKG8pIHtcbiAgICB0aGlzLmN1cnJlbnRPcmllbnRhdGlvbiA9IG87XG4gIH1cblxuICBhc3luYyBsb2FkQXBwIChhcHBQYXRoKSB7XG4gICAgbG9nLmluZm8oJ0xvYWRpbmcgTW9jayBhcHAgbW9kZWwnKTtcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHJlYWRGaWxlKGFwcFBhdGgpO1xuICAgIGxvZy5pbmZvKCdQYXJzaW5nIE1vY2sgYXBwIFhNTCcpO1xuICAgIHRoaXMucmF3WG1sID0gZGF0YS50b1N0cmluZygpO1xuICAgIHRoaXMuZG9tID0gbmV3IFhNTERvbS5ET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcodGhpcy5yYXdYbWwpO1xuICAgIHRoaXMuYWN0aXZlRG9tID0gdGhpcy5kb207XG4gIH1cblxuICBnZXRXZWJ2aWV3cyAoKSB7XG4gICAgcmV0dXJuIHRoaXMueHBhdGhRdWVyeSgnLy9Nb2NrV2ViVmlldy8qWzFdJykubWFwKChuKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IEZha2VXZWJWaWV3KG4pO1xuICAgIH0pO1xuICB9XG5cbiAgYWN0aXZhdGVXZWJ2aWV3ICh3dikge1xuICAgIHRoaXMuYWN0aXZlV2VidmlldyA9IHd2O1xuICAgIGxldCBmcmFnbWVudCA9IG5ldyBYTUxEb20uWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHd2Lm5vZGUpO1xuICAgIHRoaXMuYWN0aXZlRG9tID0gbmV3IFhNTERvbS5ET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoZnJhZ21lbnQsXG4gICAgICAgICdhcHBsaWNhdGlvbi94bWwnKTtcbiAgfVxuXG4gIGRlYWN0aXZhdGVXZWJ2aWV3ICgpIHtcbiAgICB0aGlzLmFjdGl2ZVdlYnZpZXcgPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlRG9tID0gdGhpcy5kb207XG4gIH1cblxuICBhY3RpdmF0ZUZyYW1lIChmcmFtZSkge1xuICAgIHRoaXMuYWN0aXZlRnJhbWUgPSBmcmFtZTtcbiAgICBsZXQgZnJhZ21lbnQgPSBuZXcgWE1MRG9tLlhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhmcmFtZSk7XG4gICAgdGhpcy5hY3RpdmVEb20gPSBuZXcgWE1MRG9tLkRPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhmcmFnbWVudCxcbiAgICAgICAgJ2FwcGxpY2F0aW9uL3htbCcpO1xuICB9XG5cbiAgZGVhY3RpdmF0ZUZyYW1lICgpIHtcbiAgICB0aGlzLmFjdGl2ZUZyYW1lID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2YXRlV2Vidmlldyh0aGlzLmFjdGl2ZVdlYnZpZXcpO1xuICB9XG5cbiAgeHBhdGhRdWVyeSAoc2VsLCBjdHgpIHtcbiAgICByZXR1cm4geHBhdGguc2VsZWN0KHNlbCwgY3R4IHx8IHRoaXMuYWN0aXZlRG9tKTtcbiAgfVxuXG4gIGlkUXVlcnkgKGlkLCBjdHgpIHtcbiAgICByZXR1cm4gdGhpcy54cGF0aFF1ZXJ5KGAvLypbQGlkPVwiJHtpZH1cIl1gLCBjdHgpO1xuICB9XG5cbiAgY2xhc3NRdWVyeSAoY2xhc3NOYW1lLCBjdHgpIHtcbiAgICByZXR1cm4gdGhpcy54cGF0aFF1ZXJ5KGAvLyR7Y2xhc3NOYW1lfWAsIGN0eCk7XG4gIH1cblxuICBoYXNBbGVydCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlQWxlcnQgIT09IG51bGw7XG4gIH1cblxuICBzZXRBbGVydFRleHQgKHRleHQpIHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlQWxlcnQuaGFzUHJvbXB0KCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcHJvbXB0IHRvIHNldCB0ZXh0IG9mJyk7XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlQWxlcnQuc2V0QXR0cigncHJvbXB0JywgdGV4dCk7XG4gIH1cblxuICBzaG93QWxlcnQgKGFsZXJ0SWQpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLnhwYXRoUXVlcnkoYC8vYWxlcnRbQGlkPVwiJHthbGVydElkfVwiXWApO1xuICAgIGlmIChub2Rlcy5sZW5ndGggPCAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEFsZXJ0ICR7YWxlcnRJZH0gZG9lc24ndCBleGlzdCFgKTtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVBbGVydCA9IG5ldyBGYWtlRWxlbWVudChub2Rlc1swXSwgdGhpcyk7XG4gIH1cblxuICBhbGVydFRleHQgKCkge1xuICAgIHJldHVybiB0aGlzLmFjdGl2ZUFsZXJ0LmdldEF0dHIoJ3Byb21wdCcpIHx8XG4gICAgICAgICAgIHRoaXMuYWN0aXZlQWxlcnQubm9kZUF0dHJzLnRleHQ7XG4gIH1cblxuICBoYW5kbGVBbGVydCAoKSB7XG4gICAgdGhpcy5hY3RpdmVBbGVydCA9IG51bGw7XG4gIH1cblxuICBnZXRTY3JlZW5zaG90ICgpIHtcbiAgICByZXR1cm4gJ2hhaGFoYW5vdHJlYWxseWFzY3JlZW5zaG90JztcbiAgfVxuXG59XG5cbmNsYXNzIEZha2VXZWJWaWV3IHtcbiAgY29uc3RydWN0b3IgKG5vZGUpIHtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICB9XG59XG5cbmV4cG9ydCB7IEZha2VBcHAgfTtcbiJdLCJmaWxlIjoibGliL2Zha2UtYXBwLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
