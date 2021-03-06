"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

const extensions = {},
      commands = {};
exports.commands = commands;

commands.mobileGetDeviceInfo = async function mobileGetDeviceInfo() {
  return await this.proxyCommand('/wda/device/info', 'GET');
};

Object.assign(extensions, commands);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9kZXZpY2VJbmZvLmpzIl0sIm5hbWVzIjpbImV4dGVuc2lvbnMiLCJjb21tYW5kcyIsIm1vYmlsZUdldERldmljZUluZm8iLCJwcm94eUNvbW1hbmQiLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE1BQU1BLFVBQVUsR0FBRyxFQUFuQjtBQUFBLE1BQXVCQyxRQUFRLEdBQUcsRUFBbEM7OztBQVFBQSxRQUFRLENBQUNDLG1CQUFULEdBQStCLGVBQWVBLG1CQUFmLEdBQXNDO0FBQ25FLFNBQU8sTUFBTSxLQUFLQyxZQUFMLENBQWtCLGtCQUFsQixFQUFzQyxLQUF0QyxDQUFiO0FBQ0QsQ0FGRDs7QUFJQUMsTUFBTSxDQUFDQyxNQUFQLENBQWNMLFVBQWQsRUFBMEJDLFFBQTFCO2VBRWVELFUiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleHRlbnNpb25zID0ge30sIGNvbW1hbmRzID0ge307XG5cbi8qKlxuICogUmV0dXJucyBkZXZpY2UgaW5mby5cbiAqXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgcmVzcG9uc2Ugb2YgYC93ZGEvZGV2aWNlL2luZm8nYFxuICogQHRocm93cyB7RXJyb3J9IGlmIGFuIGVycm9yIHJhaXNlZCBieSBjb21tYW5kXG4gKi9cbmNvbW1hbmRzLm1vYmlsZUdldERldmljZUluZm8gPSBhc3luYyBmdW5jdGlvbiBtb2JpbGVHZXREZXZpY2VJbmZvICgpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMucHJveHlDb21tYW5kKCcvd2RhL2RldmljZS9pbmZvJywgJ0dFVCcpO1xufTtcblxuT2JqZWN0LmFzc2lnbihleHRlbnNpb25zLCBjb21tYW5kcyk7XG5leHBvcnQgeyBjb21tYW5kcyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2RldmljZUluZm8uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
