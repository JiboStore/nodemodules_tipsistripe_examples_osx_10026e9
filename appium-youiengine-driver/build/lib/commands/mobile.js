"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _utils = require("../utils");

var _logger = _interopRequireDefault(require("../logger"));

let extensions = {};

extensions.mobilePressButton = async function mobilePressButton(opts = {}) {
  const {
    name
  } = opts;

  if (!name) {
    _logger.default.errorAndThrow('Button Name is mandatory');
  }

  let code = _utils.youiEngineKeycode.indexOf(name);

  if (code === -1) {
    _logger.default.errorAndThrow('Unknown Button Name, see documentation for supported Button Names');
  }

  let commandObject = {
    name: `PressKey`,
    args: [`${code}`]
  };
  let commandJSON = JSON.stringify(commandObject);
  let data = await this.executeSocketCommand(commandJSON);
  let result;

  try {
    result = JSON.parse(data);
  } catch (e) {
    throw new Error('Bad response from PressButton');
  }

  return result.value;
};

Object.assign(extensions);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9tb2JpbGUuanMiXSwibmFtZXMiOlsiZXh0ZW5zaW9ucyIsIm1vYmlsZVByZXNzQnV0dG9uIiwib3B0cyIsIm5hbWUiLCJsb2ciLCJlcnJvckFuZFRocm93IiwiY29kZSIsInlvdWlFbmdpbmVLZXljb2RlIiwiaW5kZXhPZiIsImNvbW1hbmRPYmplY3QiLCJhcmdzIiwiY29tbWFuZEpTT04iLCJKU09OIiwic3RyaW5naWZ5IiwiZGF0YSIsImV4ZWN1dGVTb2NrZXRDb21tYW5kIiwicmVzdWx0IiwicGFyc2UiLCJlIiwiRXJyb3IiLCJ2YWx1ZSIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQSxJQUFJQSxVQUFVLEdBQUcsRUFBakI7O0FBRUFBLFVBQVUsQ0FBQ0MsaUJBQVgsR0FBK0IsZUFBZUEsaUJBQWYsQ0FBa0NDLElBQUksR0FBRyxFQUF6QyxFQUE2QztBQUMxRSxRQUFNO0FBQUNDLElBQUFBO0FBQUQsTUFBU0QsSUFBZjs7QUFDQSxNQUFJLENBQUNDLElBQUwsRUFBVztBQUNUQyxvQkFBSUMsYUFBSixDQUFrQiwwQkFBbEI7QUFDRDs7QUFDRCxNQUFJQyxJQUFJLEdBQUdDLHlCQUFrQkMsT0FBbEIsQ0FBMEJMLElBQTFCLENBQVg7O0FBQ0EsTUFBSUcsSUFBSSxLQUFLLENBQUMsQ0FBZCxFQUFpQjtBQUNmRixvQkFBSUMsYUFBSixDQUFrQixtRUFBbEI7QUFDRDs7QUFFRCxNQUFJSSxhQUFhLEdBQUc7QUFDbEJOLElBQUFBLElBQUksRUFBRyxVQURXO0FBRWxCTyxJQUFBQSxJQUFJLEVBQUUsQ0FBRSxHQUFFSixJQUFLLEVBQVQ7QUFGWSxHQUFwQjtBQUlBLE1BQUlLLFdBQVcsR0FBR0MsSUFBSSxDQUFDQyxTQUFMLENBQWVKLGFBQWYsQ0FBbEI7QUFFQSxNQUFJSyxJQUFJLEdBQUcsTUFBTSxLQUFLQyxvQkFBTCxDQUEwQkosV0FBMUIsQ0FBakI7QUFFQSxNQUFJSyxNQUFKOztBQUNBLE1BQUk7QUFDRkEsSUFBQUEsTUFBTSxHQUFHSixJQUFJLENBQUNLLEtBQUwsQ0FBV0gsSUFBWCxDQUFUO0FBQ0QsR0FGRCxDQUVFLE9BQU9JLENBQVAsRUFBVTtBQUNWLFVBQU0sSUFBSUMsS0FBSixDQUFVLCtCQUFWLENBQU47QUFDRDs7QUFFRCxTQUFPSCxNQUFNLENBQUNJLEtBQWQ7QUFDRCxDQTFCRDs7QUE0QkFDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjdEIsVUFBZDtlQUNlQSxVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgeW91aUVuZ2luZUtleWNvZGUgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgbG9nIGZyb20gJy4uL2xvZ2dlcic7XG5cblxubGV0IGV4dGVuc2lvbnMgPSB7fTtcblxuZXh0ZW5zaW9ucy5tb2JpbGVQcmVzc0J1dHRvbiA9IGFzeW5jIGZ1bmN0aW9uIG1vYmlsZVByZXNzQnV0dG9uIChvcHRzID0ge30pIHtcbiAgY29uc3Qge25hbWV9ID0gb3B0cztcbiAgaWYgKCFuYW1lKSB7XG4gICAgbG9nLmVycm9yQW5kVGhyb3coJ0J1dHRvbiBOYW1lIGlzIG1hbmRhdG9yeScpO1xuICB9XG4gIGxldCBjb2RlID0geW91aUVuZ2luZUtleWNvZGUuaW5kZXhPZihuYW1lKTtcbiAgaWYgKGNvZGUgPT09IC0xKSB7XG4gICAgbG9nLmVycm9yQW5kVGhyb3coJ1Vua25vd24gQnV0dG9uIE5hbWUsIHNlZSBkb2N1bWVudGF0aW9uIGZvciBzdXBwb3J0ZWQgQnV0dG9uIE5hbWVzJyk7XG4gIH1cblxuICBsZXQgY29tbWFuZE9iamVjdCA9IHtcbiAgICBuYW1lOiBgUHJlc3NLZXlgLFxuICAgIGFyZ3M6IFtgJHtjb2RlfWBdXG4gIH07XG4gIGxldCBjb21tYW5kSlNPTiA9IEpTT04uc3RyaW5naWZ5KGNvbW1hbmRPYmplY3QpO1xuXG4gIGxldCBkYXRhID0gYXdhaXQgdGhpcy5leGVjdXRlU29ja2V0Q29tbWFuZChjb21tYW5kSlNPTik7XG5cbiAgbGV0IHJlc3VsdDtcbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgcmVzcG9uc2UgZnJvbSBQcmVzc0J1dHRvbicpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucyk7XG5leHBvcnQgZGVmYXVsdCBleHRlbnNpb25zO1xuXG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9tb2JpbGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==