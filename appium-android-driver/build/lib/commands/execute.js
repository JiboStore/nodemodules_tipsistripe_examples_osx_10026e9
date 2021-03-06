"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

var _logger = _interopRequireDefault(require("../logger"));

let extensions = {};

extensions.execute = async function execute(script, args) {
  if (script.match(/^mobile:/)) {
    _logger.default.info(`Executing native command '${script}'`);

    script = script.replace(/^mobile:/, '').trim();
    return await this.executeMobile(script, _lodash.default.isArray(args) ? args[0] : args);
  }

  if (!this.isWebContext()) {
    throw new _appiumBaseDriver.errors.NotImplementedError();
  }

  const endpoint = this.chromedriver.jwproxy.downstreamProtocol === _appiumBaseDriver.PROTOCOLS.MJSONWP ? '/execute' : '/execute/sync';
  return await this.chromedriver.jwproxy.command(endpoint, 'POST', {
    script,
    args
  });
};

extensions.executeMobile = async function executeMobile(mobileCommand, opts = {}) {
  const mobileCommandsMapping = {
    shell: 'mobileShell',
    startLogsBroadcast: 'mobileStartLogsBroadcast',
    stopLogsBroadcast: 'mobileStopLogsBroadcast',
    changePermissions: 'mobileChangePermissions',
    getPermissions: 'mobileGetPermissions',
    performEditorAction: 'mobilePerformEditorAction',
    sensorSet: 'sensorSet'
  };

  if (!_lodash.default.has(mobileCommandsMapping, mobileCommand)) {
    throw new _appiumBaseDriver.errors.UnknownCommandError(`Unknown mobile command "${mobileCommand}". ` + `Only ${_lodash.default.keys(mobileCommandsMapping)} commands are supported.`);
  }

  return await this[mobileCommandsMapping[mobileCommand]](opts);
};

var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9leGVjdXRlLmpzIl0sIm5hbWVzIjpbImV4dGVuc2lvbnMiLCJleGVjdXRlIiwic2NyaXB0IiwiYXJncyIsIm1hdGNoIiwibG9nZ2VyIiwiaW5mbyIsInJlcGxhY2UiLCJ0cmltIiwiZXhlY3V0ZU1vYmlsZSIsIl8iLCJpc0FycmF5IiwiaXNXZWJDb250ZXh0IiwiZXJyb3JzIiwiTm90SW1wbGVtZW50ZWRFcnJvciIsImVuZHBvaW50IiwiY2hyb21lZHJpdmVyIiwiandwcm94eSIsImRvd25zdHJlYW1Qcm90b2NvbCIsIlBST1RPQ09MUyIsIk1KU09OV1AiLCJjb21tYW5kIiwibW9iaWxlQ29tbWFuZCIsIm9wdHMiLCJtb2JpbGVDb21tYW5kc01hcHBpbmciLCJzaGVsbCIsInN0YXJ0TG9nc0Jyb2FkY2FzdCIsInN0b3BMb2dzQnJvYWRjYXN0IiwiY2hhbmdlUGVybWlzc2lvbnMiLCJnZXRQZXJtaXNzaW9ucyIsInBlcmZvcm1FZGl0b3JBY3Rpb24iLCJzZW5zb3JTZXQiLCJoYXMiLCJVbmtub3duQ29tbWFuZEVycm9yIiwia2V5cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQSxJQUFJQSxVQUFVLEdBQUcsRUFBakI7O0FBRUFBLFVBQVUsQ0FBQ0MsT0FBWCxHQUFxQixlQUFlQSxPQUFmLENBQXdCQyxNQUF4QixFQUFnQ0MsSUFBaEMsRUFBc0M7QUFDekQsTUFBSUQsTUFBTSxDQUFDRSxLQUFQLENBQWEsVUFBYixDQUFKLEVBQThCO0FBQzVCQyxvQkFBT0MsSUFBUCxDQUFhLDZCQUE0QkosTUFBTyxHQUFoRDs7QUFDQUEsSUFBQUEsTUFBTSxHQUFHQSxNQUFNLENBQUNLLE9BQVAsQ0FBZSxVQUFmLEVBQTJCLEVBQTNCLEVBQStCQyxJQUEvQixFQUFUO0FBQ0EsV0FBTyxNQUFNLEtBQUtDLGFBQUwsQ0FBbUJQLE1BQW5CLEVBQTJCUSxnQkFBRUMsT0FBRixDQUFVUixJQUFWLElBQWtCQSxJQUFJLENBQUMsQ0FBRCxDQUF0QixHQUE0QkEsSUFBdkQsQ0FBYjtBQUNEOztBQUNELE1BQUksQ0FBQyxLQUFLUyxZQUFMLEVBQUwsRUFBMEI7QUFDeEIsVUFBTSxJQUFJQyx5QkFBT0MsbUJBQVgsRUFBTjtBQUNEOztBQUNELFFBQU1DLFFBQVEsR0FBRyxLQUFLQyxZQUFMLENBQWtCQyxPQUFsQixDQUEwQkMsa0JBQTFCLEtBQWlEQyw0QkFBVUMsT0FBM0QsR0FDYixVQURhLEdBRWIsZUFGSjtBQUdBLFNBQU8sTUFBTSxLQUFLSixZQUFMLENBQWtCQyxPQUFsQixDQUEwQkksT0FBMUIsQ0FBa0NOLFFBQWxDLEVBQTRDLE1BQTVDLEVBQW9EO0FBQy9EYixJQUFBQSxNQUQrRDtBQUUvREMsSUFBQUE7QUFGK0QsR0FBcEQsQ0FBYjtBQUlELENBaEJEOztBQWtCQUgsVUFBVSxDQUFDUyxhQUFYLEdBQTJCLGVBQWVBLGFBQWYsQ0FBOEJhLGFBQTlCLEVBQTZDQyxJQUFJLEdBQUcsRUFBcEQsRUFBd0Q7QUFDakYsUUFBTUMscUJBQXFCLEdBQUc7QUFDNUJDLElBQUFBLEtBQUssRUFBRSxhQURxQjtBQUc1QkMsSUFBQUEsa0JBQWtCLEVBQUUsMEJBSFE7QUFJNUJDLElBQUFBLGlCQUFpQixFQUFFLHlCQUpTO0FBTTVCQyxJQUFBQSxpQkFBaUIsRUFBRSx5QkFOUztBQU81QkMsSUFBQUEsY0FBYyxFQUFFLHNCQVBZO0FBUzVCQyxJQUFBQSxtQkFBbUIsRUFBRSwyQkFUTztBQVc1QkMsSUFBQUEsU0FBUyxFQUFFO0FBWGlCLEdBQTlCOztBQWNBLE1BQUksQ0FBQ3JCLGdCQUFFc0IsR0FBRixDQUFNUixxQkFBTixFQUE2QkYsYUFBN0IsQ0FBTCxFQUFrRDtBQUNoRCxVQUFNLElBQUlULHlCQUFPb0IsbUJBQVgsQ0FBZ0MsMkJBQTBCWCxhQUFjLEtBQXpDLEdBQ0MsUUFBT1osZ0JBQUV3QixJQUFGLENBQU9WLHFCQUFQLENBQThCLDBCQURyRSxDQUFOO0FBRUQ7O0FBQ0QsU0FBTyxNQUFNLEtBQUtBLHFCQUFxQixDQUFDRixhQUFELENBQTFCLEVBQTJDQyxJQUEzQyxDQUFiO0FBQ0QsQ0FwQkQ7O2VBc0JldkIsVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBlcnJvcnMsIFBST1RPQ09MUyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uL2xvZ2dlcic7XG5cbmxldCBleHRlbnNpb25zID0ge307XG5cbmV4dGVuc2lvbnMuZXhlY3V0ZSA9IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGUgKHNjcmlwdCwgYXJncykge1xuICBpZiAoc2NyaXB0Lm1hdGNoKC9ebW9iaWxlOi8pKSB7XG4gICAgbG9nZ2VyLmluZm8oYEV4ZWN1dGluZyBuYXRpdmUgY29tbWFuZCAnJHtzY3JpcHR9J2ApO1xuICAgIHNjcmlwdCA9IHNjcmlwdC5yZXBsYWNlKC9ebW9iaWxlOi8sICcnKS50cmltKCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZU1vYmlsZShzY3JpcHQsIF8uaXNBcnJheShhcmdzKSA/IGFyZ3NbMF0gOiBhcmdzKTtcbiAgfVxuICBpZiAoIXRoaXMuaXNXZWJDb250ZXh0KCkpIHtcbiAgICB0aHJvdyBuZXcgZXJyb3JzLk5vdEltcGxlbWVudGVkRXJyb3IoKTtcbiAgfVxuICBjb25zdCBlbmRwb2ludCA9IHRoaXMuY2hyb21lZHJpdmVyLmp3cHJveHkuZG93bnN0cmVhbVByb3RvY29sID09PSBQUk9UT0NPTFMuTUpTT05XUFxuICAgID8gJy9leGVjdXRlJ1xuICAgIDogJy9leGVjdXRlL3N5bmMnO1xuICByZXR1cm4gYXdhaXQgdGhpcy5jaHJvbWVkcml2ZXIuandwcm94eS5jb21tYW5kKGVuZHBvaW50LCAnUE9TVCcsIHtcbiAgICBzY3JpcHQsXG4gICAgYXJncyxcbiAgfSk7XG59O1xuXG5leHRlbnNpb25zLmV4ZWN1dGVNb2JpbGUgPSBhc3luYyBmdW5jdGlvbiBleGVjdXRlTW9iaWxlIChtb2JpbGVDb21tYW5kLCBvcHRzID0ge30pIHtcbiAgY29uc3QgbW9iaWxlQ29tbWFuZHNNYXBwaW5nID0ge1xuICAgIHNoZWxsOiAnbW9iaWxlU2hlbGwnLFxuXG4gICAgc3RhcnRMb2dzQnJvYWRjYXN0OiAnbW9iaWxlU3RhcnRMb2dzQnJvYWRjYXN0JyxcbiAgICBzdG9wTG9nc0Jyb2FkY2FzdDogJ21vYmlsZVN0b3BMb2dzQnJvYWRjYXN0JyxcblxuICAgIGNoYW5nZVBlcm1pc3Npb25zOiAnbW9iaWxlQ2hhbmdlUGVybWlzc2lvbnMnLFxuICAgIGdldFBlcm1pc3Npb25zOiAnbW9iaWxlR2V0UGVybWlzc2lvbnMnLFxuXG4gICAgcGVyZm9ybUVkaXRvckFjdGlvbjogJ21vYmlsZVBlcmZvcm1FZGl0b3JBY3Rpb24nLFxuXG4gICAgc2Vuc29yU2V0OiAnc2Vuc29yU2V0J1xuICB9O1xuXG4gIGlmICghXy5oYXMobW9iaWxlQ29tbWFuZHNNYXBwaW5nLCBtb2JpbGVDb21tYW5kKSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuVW5rbm93bkNvbW1hbmRFcnJvcihgVW5rbm93biBtb2JpbGUgY29tbWFuZCBcIiR7bW9iaWxlQ29tbWFuZH1cIi4gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBPbmx5ICR7Xy5rZXlzKG1vYmlsZUNvbW1hbmRzTWFwcGluZyl9IGNvbW1hbmRzIGFyZSBzdXBwb3J0ZWQuYCk7XG4gIH1cbiAgcmV0dXJuIGF3YWl0IHRoaXNbbW9iaWxlQ29tbWFuZHNNYXBwaW5nW21vYmlsZUNvbW1hbmRdXShvcHRzKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9leGVjdXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
