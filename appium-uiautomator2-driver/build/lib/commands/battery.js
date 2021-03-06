"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.commands = void 0;

require("source-map-support/register");

let extensions = {},
    commands = {};
exports.commands = commands;

commands.mobileGetBatteryInfo = async function () {
  const result = await this.uiautomator2.jwproxy.command('/appium/device/battery_info', 'GET', {});
  result.state = result.status;
  delete result.status;
  return result;
};

Object.assign(extensions, commands);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9iYXR0ZXJ5LmpzIl0sIm5hbWVzIjpbImV4dGVuc2lvbnMiLCJjb21tYW5kcyIsIm1vYmlsZUdldEJhdHRlcnlJbmZvIiwicmVzdWx0IiwidWlhdXRvbWF0b3IyIiwiandwcm94eSIsImNvbW1hbmQiLCJzdGF0ZSIsInN0YXR1cyIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsSUFBSUEsVUFBVSxHQUFHLEVBQWpCO0FBQUEsSUFBcUJDLFFBQVEsR0FBRyxFQUFoQzs7O0FBdUJBQSxRQUFRLENBQUNDLG9CQUFULEdBQWdDLGtCQUFrQjtBQUNoRCxRQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLQyxZQUFMLENBQWtCQyxPQUFsQixDQUEwQkMsT0FBMUIsQ0FBa0MsNkJBQWxDLEVBQWlFLEtBQWpFLEVBQXdFLEVBQXhFLENBQXJCO0FBRUFILEVBQUFBLE1BQU0sQ0FBQ0ksS0FBUCxHQUFlSixNQUFNLENBQUNLLE1BQXRCO0FBQ0EsU0FBT0wsTUFBTSxDQUFDSyxNQUFkO0FBQ0EsU0FBT0wsTUFBUDtBQUNELENBTkQ7O0FBUUFNLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjVixVQUFkLEVBQTBCQyxRQUExQjtlQUVlRCxVIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGV4dGVuc2lvbnMgPSB7fSwgY29tbWFuZHMgPSB7fTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBCYXR0ZXJ5SW5mb1xuICpcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsZXZlbCAtIEJhdHRlcnkgbGV2ZWwgaW4gcmFuZ2UgWzAuMCwgMS4wXSwgd2hlcmVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEuMCBtZWFucyAxMDAlIGNoYXJnZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMSBpcyByZXR1cm5lZCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNhbm5vdCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0cmlldmVkIGZyb20gdGhlIHN5c3RlbS5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzdGF0ZSAtIEJhdHRlcnkgc3RhdGUuIFRoZSBmb2xsb3dpbmcgdmFsdWVzIGFyZSBwb3NzaWJsZTpcbiAqICAgQkFUVEVSWV9TVEFUVVNfVU5LTk9XTiA9IDFcbiAqICAgQkFUVEVSWV9TVEFUVVNfQ0hBUkdJTkcgPSAyXG4gKiAgIEJBVFRFUllfU1RBVFVTX0RJU0NIQVJHSU5HID0gM1xuICogICBCQVRURVJZX1NUQVRVU19OT1RfQ0hBUkdJTkcgPSA0XG4gKiAgIEJBVFRFUllfU1RBVFVTX0ZVTEwgPSA1XG4gKiAgIC0xIGlzIHJldHVybmVkIGlmIHRoZSBhY3R1YWwgdmFsdWUgY2Fubm90IGJlIHJldHJpZXZlZCBmcm9tIHRoZSBzeXN0ZW0uXG4gKi9cblxuLyoqXG4gKiBSZWFkcyB0aGUgYmF0dGVyeSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJucyB7QmF0dGVyeUluZm99IFRoZSBhY3R1YWwgYmF0dGVyeSBpbmZvXG4gKi9cbmNvbW1hbmRzLm1vYmlsZUdldEJhdHRlcnlJbmZvID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnVpYXV0b21hdG9yMi5qd3Byb3h5LmNvbW1hbmQoJy9hcHBpdW0vZGV2aWNlL2JhdHRlcnlfaW5mbycsICdHRVQnLCB7fSk7XG4gIC8vIEdpdmUgaXQgdGhlIHNhbWUgbmFtZSBhcyBpbiBpT1NcbiAgcmVzdWx0LnN0YXRlID0gcmVzdWx0LnN0YXR1cztcbiAgZGVsZXRlIHJlc3VsdC5zdGF0dXM7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5PYmplY3QuYXNzaWduKGV4dGVuc2lvbnMsIGNvbW1hbmRzKTtcbmV4cG9ydCB7IGNvbW1hbmRzIH07XG5leHBvcnQgZGVmYXVsdCBleHRlbnNpb25zO1xuIl0sImZpbGUiOiJsaWIvY29tbWFuZHMvYmF0dGVyeS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
