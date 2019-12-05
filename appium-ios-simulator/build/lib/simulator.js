"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSimulator = getSimulator;
exports.getDeviceString = getDeviceString;

require("source-map-support/register");

var _simulatorXcode = _interopRequireDefault(require("./simulator-xcode-6"));

var _simulatorXcode2 = _interopRequireDefault(require("./simulator-xcode-7"));

var _simulatorXcode3 = _interopRequireDefault(require("./simulator-xcode-7.3"));

var _simulatorXcode4 = _interopRequireDefault(require("./simulator-xcode-8"));

var _simulatorXcode5 = _interopRequireDefault(require("./simulator-xcode-9"));

var _simulatorXcode6 = _interopRequireDefault(require("./simulator-xcode-9.3"));

var _simulatorXcode7 = _interopRequireDefault(require("./simulator-xcode-10"));

var _simulatorXcode8 = _interopRequireDefault(require("./simulator-xcode-11"));

var _utils = require("./utils");

var _appiumXcode = _interopRequireDefault(require("appium-xcode"));

var _logger = require("./logger");

function handleUnsupportedXcode(xcodeVersion) {
  if (xcodeVersion.major < 6) {
    throw new Error(`Tried to use an iOS simulator with xcode ` + `version ${xcodeVersion.versionString} but only Xcode version ` + `6.0.0 and up are supported`);
  }
}

async function getSimulator(udid) {
  const xcodeVersion = await _appiumXcode.default.getVersion(true);
  const simulatorInfo = await (0, _utils.getSimulatorInfo)(udid);

  if (!simulatorInfo) {
    throw new Error(`No sim found with udid '${udid}'`);
  }

  (0, _logger.setLoggingPlatform)(simulatorInfo.platform);

  _logger.log.info(`Constructing ${simulatorInfo.platform || 'iOS'} simulator for Xcode version ${xcodeVersion.versionString} ` + `with udid '${udid}'`);

  let SimClass;

  switch (xcodeVersion.major) {
    case 6:
      SimClass = _simulatorXcode.default;
      break;

    case 7:
      if (xcodeVersion.minor < 3) {
        SimClass = _simulatorXcode2.default;
      } else {
        SimClass = _simulatorXcode3.default;
      }

      break;

    case 8:
      SimClass = _simulatorXcode4.default;
      break;

    case 9:
      if (xcodeVersion.minor < 3) {
        SimClass = _simulatorXcode5.default;
      } else {
        SimClass = _simulatorXcode6.default;
      }

      break;

    case 10:
      SimClass = _simulatorXcode7.default;
      break;

    case 11:
      SimClass = _simulatorXcode8.default;
      break;

    default:
      handleUnsupportedXcode(xcodeVersion);
      SimClass = _simulatorXcode6.default;
  }

  return new SimClass(udid, xcodeVersion);
}

async function getDeviceString(opts) {
  let xcodeVersion = await _appiumXcode.default.getVersion(true);
  handleUnsupportedXcode(xcodeVersion);

  _logger.log.info(`Retrieving device name string for Xcode version ${xcodeVersion.versionString}`);

  if (xcodeVersion.major >= 8) {
    return await _simulatorXcode2.default.getDeviceString(opts);
  } else if (xcodeVersion.major === 7) {
    return await _simulatorXcode2.default.getDeviceString(opts);
  } else if (xcodeVersion.major === 6) {
    return await _simulatorXcode.default.getDeviceString(opts);
  }
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zaW11bGF0b3IuanMiXSwibmFtZXMiOlsiaGFuZGxlVW5zdXBwb3J0ZWRYY29kZSIsInhjb2RlVmVyc2lvbiIsIm1ham9yIiwiRXJyb3IiLCJ2ZXJzaW9uU3RyaW5nIiwiZ2V0U2ltdWxhdG9yIiwidWRpZCIsInhjb2RlIiwiZ2V0VmVyc2lvbiIsInNpbXVsYXRvckluZm8iLCJwbGF0Zm9ybSIsImxvZyIsImluZm8iLCJTaW1DbGFzcyIsIlNpbXVsYXRvclhjb2RlNiIsIm1pbm9yIiwiU2ltdWxhdG9yWGNvZGU3IiwiU2ltdWxhdG9yWGNvZGU3MyIsIlNpbXVsYXRvclhjb2RlOCIsIlNpbXVsYXRvclhjb2RlOSIsIlNpbXVsYXRvclhjb2RlOTMiLCJTaW11bGF0b3JYY29kZTEwIiwiU2ltdWxhdG9yWGNvZGUxMSIsImdldERldmljZVN0cmluZyIsIm9wdHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBLFNBQVNBLHNCQUFULENBQWlDQyxZQUFqQyxFQUErQztBQUM3QyxNQUFJQSxZQUFZLENBQUNDLEtBQWIsR0FBcUIsQ0FBekIsRUFBNEI7QUFDMUIsVUFBTSxJQUFJQyxLQUFKLENBQVcsMkNBQUQsR0FDQyxXQUFVRixZQUFZLENBQUNHLGFBQWMsMEJBRHRDLEdBRUMsNEJBRlgsQ0FBTjtBQUdEO0FBQ0Y7O0FBV0QsZUFBZUMsWUFBZixDQUE2QkMsSUFBN0IsRUFBbUM7QUFDakMsUUFBTUwsWUFBWSxHQUFHLE1BQU1NLHFCQUFNQyxVQUFOLENBQWlCLElBQWpCLENBQTNCO0FBQ0EsUUFBTUMsYUFBYSxHQUFHLE1BQU0sNkJBQWlCSCxJQUFqQixDQUE1Qjs7QUFFQSxNQUFJLENBQUNHLGFBQUwsRUFBb0I7QUFDbEIsVUFBTSxJQUFJTixLQUFKLENBQVcsMkJBQTBCRyxJQUFLLEdBQTFDLENBQU47QUFDRDs7QUFHRCxrQ0FBbUJHLGFBQWEsQ0FBQ0MsUUFBakM7O0FBRUFDLGNBQUlDLElBQUosQ0FBVSxnQkFBZUgsYUFBYSxDQUFDQyxRQUFkLElBQTBCLEtBQU0sZ0NBQStCVCxZQUFZLENBQUNHLGFBQWMsR0FBMUcsR0FDQyxjQUFhRSxJQUFLLEdBRDVCOztBQUVBLE1BQUlPLFFBQUo7O0FBQ0EsVUFBUVosWUFBWSxDQUFDQyxLQUFyQjtBQUNFLFNBQUssQ0FBTDtBQUNFVyxNQUFBQSxRQUFRLEdBQUdDLHVCQUFYO0FBQ0E7O0FBQ0YsU0FBSyxDQUFMO0FBQ0UsVUFBSWIsWUFBWSxDQUFDYyxLQUFiLEdBQXFCLENBQXpCLEVBQTRCO0FBQzFCRixRQUFBQSxRQUFRLEdBQUdHLHdCQUFYO0FBQ0QsT0FGRCxNQUVPO0FBQ0xILFFBQUFBLFFBQVEsR0FBR0ksd0JBQVg7QUFDRDs7QUFDRDs7QUFDRixTQUFLLENBQUw7QUFDRUosTUFBQUEsUUFBUSxHQUFHSyx3QkFBWDtBQUNBOztBQUNGLFNBQUssQ0FBTDtBQUNFLFVBQUlqQixZQUFZLENBQUNjLEtBQWIsR0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJGLFFBQUFBLFFBQVEsR0FBR00sd0JBQVg7QUFDRCxPQUZELE1BRU87QUFDTE4sUUFBQUEsUUFBUSxHQUFHTyx3QkFBWDtBQUNEOztBQUNEOztBQUNGLFNBQUssRUFBTDtBQUNFUCxNQUFBQSxRQUFRLEdBQUdRLHdCQUFYO0FBQ0E7O0FBQ0YsU0FBSyxFQUFMO0FBQ0VSLE1BQUFBLFFBQVEsR0FBR1Msd0JBQVg7QUFDQTs7QUFDRjtBQUNFdEIsTUFBQUEsc0JBQXNCLENBQUNDLFlBQUQsQ0FBdEI7QUFDQVksTUFBQUEsUUFBUSxHQUFHTyx3QkFBWDtBQTdCSjs7QUErQkEsU0FBTyxJQUFJUCxRQUFKLENBQWFQLElBQWIsRUFBbUJMLFlBQW5CLENBQVA7QUFDRDs7QUFpQkQsZUFBZXNCLGVBQWYsQ0FBZ0NDLElBQWhDLEVBQXNDO0FBQ3BDLE1BQUl2QixZQUFZLEdBQUcsTUFBTU0scUJBQU1DLFVBQU4sQ0FBaUIsSUFBakIsQ0FBekI7QUFFQVIsRUFBQUEsc0JBQXNCLENBQUNDLFlBQUQsQ0FBdEI7O0FBRUFVLGNBQUlDLElBQUosQ0FBVSxtREFBa0RYLFlBQVksQ0FBQ0csYUFBYyxFQUF2Rjs7QUFDQSxNQUFJSCxZQUFZLENBQUNDLEtBQWIsSUFBc0IsQ0FBMUIsRUFBNkI7QUFDM0IsV0FBTyxNQUFNYyx5QkFBZ0JPLGVBQWhCLENBQWdDQyxJQUFoQyxDQUFiO0FBQ0QsR0FGRCxNQUVPLElBQUl2QixZQUFZLENBQUNDLEtBQWIsS0FBdUIsQ0FBM0IsRUFBOEI7QUFDbkMsV0FBTyxNQUFNYyx5QkFBZ0JPLGVBQWhCLENBQWdDQyxJQUFoQyxDQUFiO0FBQ0QsR0FGTSxNQUVBLElBQUl2QixZQUFZLENBQUNDLEtBQWIsS0FBdUIsQ0FBM0IsRUFBOEI7QUFDbkMsV0FBTyxNQUFNWSx3QkFBZ0JTLGVBQWhCLENBQWdDQyxJQUFoQyxDQUFiO0FBQ0Q7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTaW11bGF0b3JYY29kZTYgZnJvbSAnLi9zaW11bGF0b3IteGNvZGUtNic7XG5pbXBvcnQgU2ltdWxhdG9yWGNvZGU3IGZyb20gJy4vc2ltdWxhdG9yLXhjb2RlLTcnO1xuaW1wb3J0IFNpbXVsYXRvclhjb2RlNzMgZnJvbSAnLi9zaW11bGF0b3IteGNvZGUtNy4zJztcbmltcG9ydCBTaW11bGF0b3JYY29kZTggZnJvbSAnLi9zaW11bGF0b3IteGNvZGUtOCc7XG5pbXBvcnQgU2ltdWxhdG9yWGNvZGU5IGZyb20gJy4vc2ltdWxhdG9yLXhjb2RlLTknO1xuaW1wb3J0IFNpbXVsYXRvclhjb2RlOTMgZnJvbSAnLi9zaW11bGF0b3IteGNvZGUtOS4zJztcbmltcG9ydCBTaW11bGF0b3JYY29kZTEwIGZyb20gJy4vc2ltdWxhdG9yLXhjb2RlLTEwJztcbmltcG9ydCBTaW11bGF0b3JYY29kZTExIGZyb20gJy4vc2ltdWxhdG9yLXhjb2RlLTExJztcbmltcG9ydCB7IGdldFNpbXVsYXRvckluZm8gfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB4Y29kZSBmcm9tICdhcHBpdW0teGNvZGUnO1xuaW1wb3J0IHsgbG9nLCBzZXRMb2dnaW5nUGxhdGZvcm0gfSBmcm9tICcuL2xvZ2dlcic7XG5cblxuZnVuY3Rpb24gaGFuZGxlVW5zdXBwb3J0ZWRYY29kZSAoeGNvZGVWZXJzaW9uKSB7XG4gIGlmICh4Y29kZVZlcnNpb24ubWFqb3IgPCA2KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUcmllZCB0byB1c2UgYW4gaU9TIHNpbXVsYXRvciB3aXRoIHhjb2RlIGAgK1xuICAgICAgICAgICAgICAgICAgICBgdmVyc2lvbiAke3hjb2RlVmVyc2lvbi52ZXJzaW9uU3RyaW5nfSBidXQgb25seSBYY29kZSB2ZXJzaW9uIGAgK1xuICAgICAgICAgICAgICAgICAgICBgNi4wLjAgYW5kIHVwIGFyZSBzdXBwb3J0ZWRgKTtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIGFuZCByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIFNpbXVsYXRvciBpbnN0YW5jZSBmb3IgdGhlIGdpdmVuIElELlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1ZGlkIC0gVGhlIElEIG9mIGFuIGV4aXN0aW5nIFNpbXVsYXRvci5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgU2ltdWxhdG9yIHdpdGggZ2l2ZW4gdWRpZCBkb2VzIG5vdCBleGlzdCBpbiBkZXZpY2VzIGxpc3QuXG4gKiAgIElmIHlvdSB3YW50IHRvIGNyZWF0ZSBhIG5ldyBzaW11bGF0b3IsIHlvdSBjYW4gdXNlIHRoZSBgY3JlYXRlRGV2aWNlKClgIG1ldGhvZCBvZlxuICogICBbbm9kZS1zaW1jdGxdKGdpdGh1Yi5jb20vYXBwaXVtL25vZGUtc2ltY3RsKS5cbiAqIEByZXR1cm4ge29iamVjdH0gU2ltdWxhdG9yIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggdGhlIHVkaWQgcGFzc2VkIGluLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRTaW11bGF0b3IgKHVkaWQpIHtcbiAgY29uc3QgeGNvZGVWZXJzaW9uID0gYXdhaXQgeGNvZGUuZ2V0VmVyc2lvbih0cnVlKTtcbiAgY29uc3Qgc2ltdWxhdG9ySW5mbyA9IGF3YWl0IGdldFNpbXVsYXRvckluZm8odWRpZCk7XG5cbiAgaWYgKCFzaW11bGF0b3JJbmZvKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyBzaW0gZm91bmQgd2l0aCB1ZGlkICcke3VkaWR9J2ApO1xuICB9XG5cbiAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgdGhlIHJpZ2h0IGxvZ2dpbmcgcHJlZml4XG4gIHNldExvZ2dpbmdQbGF0Zm9ybShzaW11bGF0b3JJbmZvLnBsYXRmb3JtKTtcblxuICBsb2cuaW5mbyhgQ29uc3RydWN0aW5nICR7c2ltdWxhdG9ySW5mby5wbGF0Zm9ybSB8fCAnaU9TJ30gc2ltdWxhdG9yIGZvciBYY29kZSB2ZXJzaW9uICR7eGNvZGVWZXJzaW9uLnZlcnNpb25TdHJpbmd9IGAgK1xuICAgICAgICAgICBgd2l0aCB1ZGlkICcke3VkaWR9J2ApO1xuICBsZXQgU2ltQ2xhc3M7XG4gIHN3aXRjaCAoeGNvZGVWZXJzaW9uLm1ham9yKSB7XG4gICAgY2FzZSA2OlxuICAgICAgU2ltQ2xhc3MgPSBTaW11bGF0b3JYY29kZTY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDc6XG4gICAgICBpZiAoeGNvZGVWZXJzaW9uLm1pbm9yIDwgMykge1xuICAgICAgICBTaW1DbGFzcyA9IFNpbXVsYXRvclhjb2RlNztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIFNpbUNsYXNzID0gU2ltdWxhdG9yWGNvZGU3MztcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgODpcbiAgICAgIFNpbUNsYXNzID0gU2ltdWxhdG9yWGNvZGU4O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA5OlxuICAgICAgaWYgKHhjb2RlVmVyc2lvbi5taW5vciA8IDMpIHtcbiAgICAgICAgU2ltQ2xhc3MgPSBTaW11bGF0b3JYY29kZTk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBTaW1DbGFzcyA9IFNpbXVsYXRvclhjb2RlOTM7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDEwOlxuICAgICAgU2ltQ2xhc3MgPSBTaW11bGF0b3JYY29kZTEwO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxMTpcbiAgICAgIFNpbUNsYXNzID0gU2ltdWxhdG9yWGNvZGUxMTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBoYW5kbGVVbnN1cHBvcnRlZFhjb2RlKHhjb2RlVmVyc2lvbik7XG4gICAgICBTaW1DbGFzcyA9IFNpbXVsYXRvclhjb2RlOTM7XG4gIH1cbiAgcmV0dXJuIG5ldyBTaW1DbGFzcyh1ZGlkLCB4Y29kZVZlcnNpb24pO1xufVxuXG4vKipcbiAqIFRha2VzIGEgc2V0IG9mIG9wdGlvbnMgYW5kIGZpbmRzIHRoZSBjb3JyZWN0IGRldmljZSBzdHJpbmcgaW4gb3JkZXIgZm9yIEluc3RydW1lbnRzIHRvXG4gKiBpZGVudGlmeSB0aGUgY29ycmVjdCBzaW11bGF0b3IuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgLSBUaGUgb3B0aW9ucyBhdmFpbGFibGUgYXJlOlxuICogICAtIGBkZXZpY2VOYW1lYCAtIGEgbmFtZSBmb3IgdGhlIGRldmljZS4gSWYgdGhlIGdpdmVuIGRldmljZSBuYW1lIHN0YXJ0cyB3aXRoIGA9YCwgdGhlIG5hbWUsIGxlc3MgdGhlIGVxdWFscyBzaWduLCBpcyByZXR1cm5lZC5cbiAqICAgLSBgcGxhdGZvcm1WZXJzaW9uYCAtIHRoZSB2ZXJzaW9uIG9mIGlPUyB0byB1c2UuIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IFhjb2RlJ3MgbWF4aW11bSBTREsgdmVyc2lvbi5cbiAqICAgLSBgZm9yY2VJcGhvbmVgIC0gZm9yY2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGRldmljZSBzdHJpbmcgdG8gaVBob25lLiBEZWZhdWx0cyB0byBgZmFsc2VgLlxuICogICAtIGBmb3JjZUlwYWRgIC0gZm9yY2UgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGRldmljZSBzdHJpbmcgdG8gaVBhZC4gRGVmYXVsdHMgdG8gYGZhbHNlYC5cbiAqICAgSWYgYm90aCBgZm9yY2VJcGhvbmVgIGFuZCBgZm9yY2VJcGFkYCBhcmUgdHJ1ZSwgdGhlIGRldmljZSB3aWxsIGJlIGZvcmNlZCB0byBpUGhvbmUuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgZm91bmQgZGV2aWNlIHN0cmluZywgZm9yIGV4YW1wbGU6XG4gKiAgICdpUGhvbmUgNSAoOC40KScgd2l0aCBYY29kZSA3K1xuICogICAnaVBob25lIDUgKDguNCBTaW11bGF0b3IpJyB3aXRoIFhjb2RlIDYrXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdldERldmljZVN0cmluZyAob3B0cykge1xuICBsZXQgeGNvZGVWZXJzaW9uID0gYXdhaXQgeGNvZGUuZ2V0VmVyc2lvbih0cnVlKTtcblxuICBoYW5kbGVVbnN1cHBvcnRlZFhjb2RlKHhjb2RlVmVyc2lvbik7XG5cbiAgbG9nLmluZm8oYFJldHJpZXZpbmcgZGV2aWNlIG5hbWUgc3RyaW5nIGZvciBYY29kZSB2ZXJzaW9uICR7eGNvZGVWZXJzaW9uLnZlcnNpb25TdHJpbmd9YCk7XG4gIGlmICh4Y29kZVZlcnNpb24ubWFqb3IgPj0gOCkge1xuICAgIHJldHVybiBhd2FpdCBTaW11bGF0b3JYY29kZTcuZ2V0RGV2aWNlU3RyaW5nKG9wdHMpO1xuICB9IGVsc2UgaWYgKHhjb2RlVmVyc2lvbi5tYWpvciA9PT0gNykge1xuICAgIHJldHVybiBhd2FpdCBTaW11bGF0b3JYY29kZTcuZ2V0RGV2aWNlU3RyaW5nKG9wdHMpO1xuICB9IGVsc2UgaWYgKHhjb2RlVmVyc2lvbi5tYWpvciA9PT0gNikge1xuICAgIHJldHVybiBhd2FpdCBTaW11bGF0b3JYY29kZTYuZ2V0RGV2aWNlU3RyaW5nKG9wdHMpO1xuICB9XG59XG5cbmV4cG9ydCB7IGdldFNpbXVsYXRvciwgZ2V0RGV2aWNlU3RyaW5nIH07XG4iXSwiZmlsZSI6ImxpYi9zaW11bGF0b3IuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==