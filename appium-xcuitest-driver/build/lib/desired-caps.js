"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PLATFORM_NAME_TVOS = exports.PLATFORM_NAME_IOS = exports.desiredCapConstraints = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumIosDriver = require("appium-ios-driver");

const PLATFORM_NAME_IOS = 'iOS';
exports.PLATFORM_NAME_IOS = PLATFORM_NAME_IOS;
const PLATFORM_NAME_TVOS = 'tvOS';
exports.PLATFORM_NAME_TVOS = PLATFORM_NAME_TVOS;

let desiredCapConstraints = _lodash.default.defaults({
  platformName: {
    presence: true,
    isString: true,
    inclusionCaseInsensitive: [PLATFORM_NAME_IOS, PLATFORM_NAME_TVOS]
  },
  showXcodeLog: {
    isBoolean: true
  },
  wdaLocalPort: {
    isNumber: true
  },
  wdaBaseUrl: {
    isString: true
  },
  iosInstallPause: {
    isNumber: true
  },
  xcodeConfigFile: {
    isString: true
  },
  xcodeOrgId: {
    isString: true
  },
  xcodeSigningId: {
    isString: true
  },
  keychainPath: {
    isString: true
  },
  keychainPassword: {
    isString: true
  },
  bootstrapPath: {
    isString: true
  },
  agentPath: {
    isString: true
  },
  tapWithShortPressDuration: {
    isNumber: true
  },
  scaleFactor: {
    isString: true
  },
  usePrebuiltWDA: {
    isBoolean: true
  },
  customSSLCert: {
    isString: true
  },
  webDriverAgentUrl: {
    isString: true
  },
  derivedDataPath: {
    isString: true
  },
  useNewWDA: {
    isBoolean: true
  },
  wdaLaunchTimeout: {
    isNumber: true
  },
  wdaConnectionTimeout: {
    isNumber: true
  },
  updatedWDABundleId: {
    isString: true
  },
  resetOnSessionStartOnly: {
    isBoolean: true
  },
  commandTimeouts: {},
  wdaStartupRetries: {
    isNumber: true
  },
  wdaStartupRetryInterval: {
    isNumber: true
  },
  prebuildWDA: {
    isBoolean: true
  },
  connectHardwareKeyboard: {
    isBoolean: true
  },
  calendarAccessAuthorized: {
    isBoolean: true
  },
  useSimpleBuildTest: {
    isBoolean: true
  },
  waitForQuiescence: {
    isBoolean: true
  },
  maxTypingFrequency: {
    isNumber: true
  },
  nativeTyping: {
    isBoolean: true
  },
  simpleIsVisibleCheck: {
    isBoolean: true
  },
  useCarthageSsl: {
    isBoolean: true
  },
  shouldUseSingletonTestManager: {
    isBoolean: true
  },
  isHeadless: {
    isBoolean: true
  },
  useXctestrunFile: {
    isBoolean: true
  },
  absoluteWebLocations: {
    isBoolean: true
  },
  simulatorWindowCenter: {
    isString: true
  },
  useJSONSource: {
    isBoolean: true
  },
  enforceFreshSimulatorCreation: {
    isBoolean: true
  },
  shutdownOtherSimulators: {
    isBoolean: true
  },
  keychainsExcludePatterns: {
    isString: true
  },
  showSafariConsoleLog: {
    isBoolean: true
  },
  showSafariNetworkLog: {
    isBoolean: true
  },
  safariGarbageCollect: {
    isBoolean: true
  },
  safariGlobalPreferences: {
    isObject: true
  },
  mjpegServerPort: {
    isNumber: true
  },
  reduceMotion: {
    isBoolean: true
  },
  mjpegScreenshotUrl: {
    isString: true
  },
  permissions: {
    isString: true
  },
  screenshotQuality: {
    isNumber: true
  },
  skipLogCapture: {
    isBoolean: true
  },
  wdaEventloopIdleDelay: {
    isNumber: true
  },
  otherApps: {
    isString: true
  },
  includeSafariInWebviews: {
    isBoolean: true
  }
}, _appiumIosDriver.desiredCapConstraints);

exports.desiredCapConstraints = desiredCapConstraints;
var _default = desiredCapConstraints;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kZXNpcmVkLWNhcHMuanMiXSwibmFtZXMiOlsiUExBVEZPUk1fTkFNRV9JT1MiLCJQTEFURk9STV9OQU1FX1RWT1MiLCJkZXNpcmVkQ2FwQ29uc3RyYWludHMiLCJfIiwiZGVmYXVsdHMiLCJwbGF0Zm9ybU5hbWUiLCJwcmVzZW5jZSIsImlzU3RyaW5nIiwiaW5jbHVzaW9uQ2FzZUluc2Vuc2l0aXZlIiwic2hvd1hjb2RlTG9nIiwiaXNCb29sZWFuIiwid2RhTG9jYWxQb3J0IiwiaXNOdW1iZXIiLCJ3ZGFCYXNlVXJsIiwiaW9zSW5zdGFsbFBhdXNlIiwieGNvZGVDb25maWdGaWxlIiwieGNvZGVPcmdJZCIsInhjb2RlU2lnbmluZ0lkIiwia2V5Y2hhaW5QYXRoIiwia2V5Y2hhaW5QYXNzd29yZCIsImJvb3RzdHJhcFBhdGgiLCJhZ2VudFBhdGgiLCJ0YXBXaXRoU2hvcnRQcmVzc0R1cmF0aW9uIiwic2NhbGVGYWN0b3IiLCJ1c2VQcmVidWlsdFdEQSIsImN1c3RvbVNTTENlcnQiLCJ3ZWJEcml2ZXJBZ2VudFVybCIsImRlcml2ZWREYXRhUGF0aCIsInVzZU5ld1dEQSIsIndkYUxhdW5jaFRpbWVvdXQiLCJ3ZGFDb25uZWN0aW9uVGltZW91dCIsInVwZGF0ZWRXREFCdW5kbGVJZCIsInJlc2V0T25TZXNzaW9uU3RhcnRPbmx5IiwiY29tbWFuZFRpbWVvdXRzIiwid2RhU3RhcnR1cFJldHJpZXMiLCJ3ZGFTdGFydHVwUmV0cnlJbnRlcnZhbCIsInByZWJ1aWxkV0RBIiwiY29ubmVjdEhhcmR3YXJlS2V5Ym9hcmQiLCJjYWxlbmRhckFjY2Vzc0F1dGhvcml6ZWQiLCJ1c2VTaW1wbGVCdWlsZFRlc3QiLCJ3YWl0Rm9yUXVpZXNjZW5jZSIsIm1heFR5cGluZ0ZyZXF1ZW5jeSIsIm5hdGl2ZVR5cGluZyIsInNpbXBsZUlzVmlzaWJsZUNoZWNrIiwidXNlQ2FydGhhZ2VTc2wiLCJzaG91bGRVc2VTaW5nbGV0b25UZXN0TWFuYWdlciIsImlzSGVhZGxlc3MiLCJ1c2VYY3Rlc3RydW5GaWxlIiwiYWJzb2x1dGVXZWJMb2NhdGlvbnMiLCJzaW11bGF0b3JXaW5kb3dDZW50ZXIiLCJ1c2VKU09OU291cmNlIiwiZW5mb3JjZUZyZXNoU2ltdWxhdG9yQ3JlYXRpb24iLCJzaHV0ZG93bk90aGVyU2ltdWxhdG9ycyIsImtleWNoYWluc0V4Y2x1ZGVQYXR0ZXJucyIsInNob3dTYWZhcmlDb25zb2xlTG9nIiwic2hvd1NhZmFyaU5ldHdvcmtMb2ciLCJzYWZhcmlHYXJiYWdlQ29sbGVjdCIsInNhZmFyaUdsb2JhbFByZWZlcmVuY2VzIiwiaXNPYmplY3QiLCJtanBlZ1NlcnZlclBvcnQiLCJyZWR1Y2VNb3Rpb24iLCJtanBlZ1NjcmVlbnNob3RVcmwiLCJwZXJtaXNzaW9ucyIsInNjcmVlbnNob3RRdWFsaXR5Iiwic2tpcExvZ0NhcHR1cmUiLCJ3ZGFFdmVudGxvb3BJZGxlRGVsYXkiLCJvdGhlckFwcHMiLCJpbmNsdWRlU2FmYXJpSW5XZWJ2aWV3cyIsImlvc0Rlc2lyZWRDYXBDb25zdHJhaW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQSxNQUFNQSxpQkFBaUIsR0FBRyxLQUExQjs7QUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxNQUEzQjs7O0FBRUEsSUFBSUMscUJBQXFCLEdBQUdDLGdCQUFFQyxRQUFGLENBQVc7QUFDckNDLEVBQUFBLFlBQVksRUFBRTtBQUNaQyxJQUFBQSxRQUFRLEVBQUUsSUFERTtBQUVaQyxJQUFBQSxRQUFRLEVBQUUsSUFGRTtBQUdaQyxJQUFBQSx3QkFBd0IsRUFBRSxDQUFDUixpQkFBRCxFQUFvQkMsa0JBQXBCO0FBSGQsR0FEdUI7QUFNckNRLEVBQUFBLFlBQVksRUFBRTtBQUNaQyxJQUFBQSxTQUFTLEVBQUU7QUFEQyxHQU51QjtBQVNyQ0MsRUFBQUEsWUFBWSxFQUFFO0FBQ1pDLElBQUFBLFFBQVEsRUFBRTtBQURFLEdBVHVCO0FBWXJDQyxFQUFBQSxVQUFVLEVBQUU7QUFDVk4sSUFBQUEsUUFBUSxFQUFF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QUFRLEVBQUU7QUFESyxHQXBKb0I7QUF1SnJDZ0QsRUFBQUEsWUFBWSxFQUFFO0FBQ1psRCxJQUFBQSxTQUFTLEVBQUU7QUFEQyxHQXZKdUI7QUEwSnJDbUQsRUFBQUEsa0JBQWtCLEVBQUU7QUFDbEJ0RCxJQUFBQSxRQUFRLEVBQUU7QUFEUSxHQTFKaUI7QUE2SnJDdUQsRUFBQUEsV0FBVyxFQUFFO0FBQ1h2RCxJQUFBQSxRQUFRLEVBQUU7QUFEQyxHQTdKd0I7QUFnS3JDd0QsRUFBQUEsaUJBQWlCLEVBQUU7QUFDakJuRCxJQUFBQSxRQUFRLEVBQUU7QUFETyxHQWhLa0I7QUFtS3JDb0QsRUFBQUEsY0FBYyxFQUFFO0FBQ2R0RCxJQUFBQSxTQUFTLEVBQUU7QUFERyxHQW5LcUI7QUFzS3JDdUQsRUFBQUEscUJBQXFCLEVBQUU7QUFDckJyRCxJQUFBQSxRQUFRLEVBQUU7QUFEVyxHQXRLYztBQXlLckNzRCxFQUFBQSxTQUFTLEVBQUU7QUFDVDNELElBQUFBLFFBQVEsRUFBRTtBQURELEdBekswQjtBQTRLckM0RCxFQUFBQSx1QkFBdUIsRUFBRTtBQUN2QnpELElBQUFBLFNBQVMsRUFBRTtBQURZO0FBNUtZLENBQVgsRUErS3pCMEQsc0NBL0t5QixDQUE1Qjs7O2VBa0xlbEUscUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgZGVzaXJlZENhcENvbnN0cmFpbnRzIGFzIGlvc0Rlc2lyZWRDYXBDb25zdHJhaW50cyB9IGZyb20gJ2FwcGl1bS1pb3MtZHJpdmVyJztcblxuLy8gVGhlc2UgcGxhdGZvcm0gbmFtZXMgc2hvdWxkIGJlIHZhbGlkIGluIHNpbXVsYXRvciBuYW1lXG5jb25zdCBQTEFURk9STV9OQU1FX0lPUyA9ICdpT1MnO1xuY29uc3QgUExBVEZPUk1fTkFNRV9UVk9TID0gJ3R2T1MnO1xuXG5sZXQgZGVzaXJlZENhcENvbnN0cmFpbnRzID0gXy5kZWZhdWx0cyh7XG4gIHBsYXRmb3JtTmFtZTogeyAvLyBvdmVycmlkZVxuICAgIHByZXNlbmNlOiB0cnVlLFxuICAgIGlzU3RyaW5nOiB0cnVlLFxuICAgIGluY2x1c2lvbkNhc2VJbnNlbnNpdGl2ZTogW1BMQVRGT1JNX05BTUVfSU9TLCBQTEFURk9STV9OQU1FX1RWT1NdXG4gIH0sXG4gIHNob3dYY29kZUxvZzoge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICB3ZGFMb2NhbFBvcnQ6IHtcbiAgICBpc051bWJlcjogdHJ1ZVxuICB9LFxuICB3ZGFCYXNlVXJsOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgaW9zSW5zdGFsbFBhdXNlOiB7XG4gICAgaXNOdW1iZXI6IHRydWVcbiAgfSxcbiAgeGNvZGVDb25maWdGaWxlOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgeGNvZGVPcmdJZDoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH0sXG4gIHhjb2RlU2lnbmluZ0lkOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAga2V5Y2hhaW5QYXRoOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAga2V5Y2hhaW5QYXNzd29yZDoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH0sXG4gIGJvb3RzdHJhcFBhdGg6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICBhZ2VudFBhdGg6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICB0YXBXaXRoU2hvcnRQcmVzc0R1cmF0aW9uOiB7XG4gICAgaXNOdW1iZXI6IHRydWVcbiAgfSxcbiAgc2NhbGVGYWN0b3I6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICB1c2VQcmVidWlsdFdEQToge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICBjdXN0b21TU0xDZXJ0OiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgd2ViRHJpdmVyQWdlbnRVcmw6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICBkZXJpdmVkRGF0YVBhdGg6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICB1c2VOZXdXREE6IHtcbiAgICBpc0Jvb2xlYW46IHRydWVcbiAgfSxcbiAgd2RhTGF1bmNoVGltZW91dDoge1xuICAgIGlzTnVtYmVyOiB0cnVlXG4gIH0sXG4gIHdkYUNvbm5lY3Rpb25UaW1lb3V0OiB7XG4gICAgaXNOdW1iZXI6IHRydWVcbiAgfSxcbiAgdXBkYXRlZFdEQUJ1bmRsZUlkOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgcmVzZXRPblNlc3Npb25TdGFydE9ubHk6IHtcbiAgICBpc0Jvb2xlYW46IHRydWVcbiAgfSxcbiAgY29tbWFuZFRpbWVvdXRzOiB7XG4gICAgLy8gcmVjb2duaXplIHRoZSBjYXAsXG4gICAgLy8gYnV0IHZhbGlkYXRlIGluIHRoZSBkcml2ZXIjdmFsaWRhdGVEZXNpcmVkQ2FwcyBtZXRob2RcbiAgfSxcbiAgd2RhU3RhcnR1cFJldHJpZXM6IHtcbiAgICBpc051bWJlcjogdHJ1ZVxuICB9LFxuICB3ZGFTdGFydHVwUmV0cnlJbnRlcnZhbDoge1xuICAgIGlzTnVtYmVyOiB0cnVlXG4gIH0sXG4gIHByZWJ1aWxkV0RBOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIGNvbm5lY3RIYXJkd2FyZUtleWJvYXJkOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIGNhbGVuZGFyQWNjZXNzQXV0aG9yaXplZDoge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICB1c2VTaW1wbGVCdWlsZFRlc3Q6IHtcbiAgICBpc0Jvb2xlYW46IHRydWVcbiAgfSxcbiAgd2FpdEZvclF1aWVzY2VuY2U6IHtcbiAgICBpc0Jvb2xlYW46IHRydWVcbiAgfSxcbiAgbWF4VHlwaW5nRnJlcXVlbmN5OiB7XG4gICAgaXNOdW1iZXI6IHRydWVcbiAgfSxcbiAgbmF0aXZlVHlwaW5nOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNpbXBsZUlzVmlzaWJsZUNoZWNrOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHVzZUNhcnRoYWdlU3NsOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNob3VsZFVzZVNpbmdsZXRvblRlc3RNYW5hZ2VyOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIGlzSGVhZGxlc3M6IHtcbiAgICBpc0Jvb2xlYW46IHRydWVcbiAgfSxcbiAgdXNlWGN0ZXN0cnVuRmlsZToge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICBhYnNvbHV0ZVdlYkxvY2F0aW9uczoge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICBzaW11bGF0b3JXaW5kb3dDZW50ZXI6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICB1c2VKU09OU291cmNlOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIGVuZm9yY2VGcmVzaFNpbXVsYXRvckNyZWF0aW9uOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNodXRkb3duT3RoZXJTaW11bGF0b3JzOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIGtleWNoYWluc0V4Y2x1ZGVQYXR0ZXJuczoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH0sXG4gIHNob3dTYWZhcmlDb25zb2xlTG9nOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNob3dTYWZhcmlOZXR3b3JrTG9nOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNhZmFyaUdhcmJhZ2VDb2xsZWN0OiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIHNhZmFyaUdsb2JhbFByZWZlcmVuY2VzOiB7XG4gICAgaXNPYmplY3Q6IHRydWVcbiAgfSxcbiAgbWpwZWdTZXJ2ZXJQb3J0OiB7XG4gICAgaXNOdW1iZXI6IHRydWVcbiAgfSxcbiAgcmVkdWNlTW90aW9uOiB7XG4gICAgaXNCb29sZWFuOiB0cnVlXG4gIH0sXG4gIG1qcGVnU2NyZWVuc2hvdFVybDoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH0sXG4gIHBlcm1pc3Npb25zOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgc2NyZWVuc2hvdFF1YWxpdHk6IHtcbiAgICBpc051bWJlcjogdHJ1ZVxuICB9LFxuICBza2lwTG9nQ2FwdHVyZToge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxuICB3ZGFFdmVudGxvb3BJZGxlRGVsYXk6IHtcbiAgICBpc051bWJlcjogdHJ1ZVxuICB9LFxuICBvdGhlckFwcHM6IHtcbiAgICBpc1N0cmluZzogdHJ1ZVxuICB9LFxuICBpbmNsdWRlU2FmYXJpSW5XZWJ2aWV3czoge1xuICAgIGlzQm9vbGVhbjogdHJ1ZVxuICB9LFxufSwgaW9zRGVzaXJlZENhcENvbnN0cmFpbnRzKTtcblxuZXhwb3J0IHsgZGVzaXJlZENhcENvbnN0cmFpbnRzLCBQTEFURk9STV9OQU1FX0lPUywgUExBVEZPUk1fTkFNRV9UVk9TIH07XG5leHBvcnQgZGVmYXVsdCBkZXNpcmVkQ2FwQ29uc3RyYWludHM7XG4iXSwiZmlsZSI6ImxpYi9kZXNpcmVkLWNhcHMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
