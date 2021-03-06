"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

let commands = {},
    extensions = {};
exports.commands = commands;

commands.execute = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (script) {
    return yield eval(script);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

Object.assign(extensions, commands);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9leGVjdXRlLmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwiZXh0ZW5zaW9ucyIsImV4ZWN1dGUiLCJzY3JpcHQiLCJldmFsIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLElBQUlBLFFBQVEsR0FBRyxFQUFmO0FBQUEsSUFBbUJDLFVBQVUsR0FBRyxFQUFoQzs7O0FBRUFELFFBQVEsQ0FBQ0UsT0FBVDtBQUFBLDZDQUFtQixXQUFnQkMsTUFBaEIsRUFBd0I7QUFDekMsaUJBQWFDLElBQUksQ0FBQ0QsTUFBRCxDQUFqQjtBQUNELEdBRkQ7O0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSUFFLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjTCxVQUFkLEVBQTBCRCxRQUExQjtlQUVlQyxVIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGNvbW1hbmRzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuY29tbWFuZHMuZXhlY3V0ZSA9IGFzeW5jIGZ1bmN0aW9uIChzY3JpcHQpIHtcbiAgcmV0dXJuIGF3YWl0IGV2YWwoc2NyaXB0KTtcbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMpO1xuZXhwb3J0IHsgY29tbWFuZHMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9leGVjdXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
