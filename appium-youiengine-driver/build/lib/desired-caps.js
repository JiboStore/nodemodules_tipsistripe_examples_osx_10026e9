"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

const desiredCapConstraints = {
  platformName: {
    presence: true,
    isString: true,
    inclusionCaseInsensitive: ['iOS', 'Android', 'Mac', 'YIMac', 'BlueSky', 'YItvOS', 'NoProxy', 'ConnectToApp']
  },
  automationName: {
    presence: true,
    isString: true,
    inclusionCaseInsensitive: ['YouiEngine']
  },
  app: {
    isString: true
  },
  youiEngineAppAddress: {
    isString: true
  },
  avd: {
    isString: true
  },
  udid: {
    isString: true
  }
};
var _default = desiredCapConstraints;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9kZXNpcmVkLWNhcHMuanMiXSwibmFtZXMiOlsiZGVzaXJlZENhcENvbnN0cmFpbnRzIiwicGxhdGZvcm1OYW1lIiwicHJlc2VuY2UiLCJpc1N0cmluZyIsImluY2x1c2lvbkNhc2VJbnNlbnNpdGl2ZSIsImF1dG9tYXRpb25OYW1lIiwiYXBwIiwieW91aUVuZ2luZUFwcEFkZHJlc3MiLCJhdmQiLCJ1ZGlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxNQUFNQSxxQkFBcUIsR0FBRztBQUM1QkMsRUFBQUEsWUFBWSxFQUFFO0FBQ1pDLElBQUFBLFFBQVEsRUFBRSxJQURFO0FBRVpDLElBQUFBLFFBQVEsRUFBRSxJQUZFO0FBR1pDLElBQUFBLHdCQUF3QixFQUFFLENBQ3hCLEtBRHdCLEVBRXhCLFNBRndCLEVBR3hCLEtBSHdCLEVBSXhCLE9BSndCLEVBS3hCLFNBTHdCLEVBTXhCLFFBTndCLEVBT3hCLFNBUHdCLEVBUXhCLGNBUndCO0FBSGQsR0FEYztBQWU1QkMsRUFBQUEsY0FBYyxFQUFFO0FBQ2RILElBQUFBLFFBQVEsRUFBRSxJQURJO0FBRWRDLElBQUFBLFFBQVEsRUFBRSxJQUZJO0FBR2RDLElBQUFBLHdCQUF3QixFQUFFLENBQ3hCLFlBRHdCO0FBSFosR0FmWTtBQXNCNUJFLEVBQUFBLEdBQUcsRUFBRTtBQUNISCxJQUFBQSxRQUFRLEVBQUU7QUFEUCxHQXRCdUI7QUF5QjVCSSxFQUFBQSxvQkFBb0IsRUFBRTtBQUNwQkosSUFBQUEsUUFBUSxFQUFFO0FBRFUsR0F6Qk07QUE0QjVCSyxFQUFBQSxHQUFHLEVBQUU7QUFDSEwsSUFBQUEsUUFBUSxFQUFFO0FBRFAsR0E1QnVCO0FBK0I1Qk0sRUFBQUEsSUFBSSxFQUFFO0FBQ0pOLElBQUFBLFFBQVEsRUFBRTtBQUROO0FBL0JzQixDQUE5QjtlQW9DZUgscUIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBkZXNpcmVkQ2FwQ29uc3RyYWludHMgPSB7XG4gIHBsYXRmb3JtTmFtZToge1xuICAgIHByZXNlbmNlOiB0cnVlLFxuICAgIGlzU3RyaW5nOiB0cnVlLFxuICAgIGluY2x1c2lvbkNhc2VJbnNlbnNpdGl2ZTogW1xuICAgICAgJ2lPUycsXG4gICAgICAnQW5kcm9pZCcsXG4gICAgICAnTWFjJyxcbiAgICAgICdZSU1hYycsXG4gICAgICAnQmx1ZVNreScsXG4gICAgICAnWUl0dk9TJyxcbiAgICAgICdOb1Byb3h5JywgLy8gJ05vUHJveHknIGlzIGJlaW5nIGRlcHJlY2F0ZWQgYW5kIHJlcGxhY2VkIHdpdGggJ0Nvbm5lY3RUb0FwcCdcbiAgICAgICdDb25uZWN0VG9BcHAnLFxuICAgIF1cbiAgfSxcbiAgYXV0b21hdGlvbk5hbWU6IHtcbiAgICBwcmVzZW5jZTogdHJ1ZSxcbiAgICBpc1N0cmluZzogdHJ1ZSxcbiAgICBpbmNsdXNpb25DYXNlSW5zZW5zaXRpdmU6IFtcbiAgICAgICdZb3VpRW5naW5lJyxcbiAgICBdXG4gIH0sXG4gIGFwcDoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH0sXG4gIHlvdWlFbmdpbmVBcHBBZGRyZXNzOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgYXZkOiB7XG4gICAgaXNTdHJpbmc6IHRydWVcbiAgfSxcbiAgdWRpZDoge1xuICAgIGlzU3RyaW5nOiB0cnVlXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlc2lyZWRDYXBDb25zdHJhaW50cztcbiJdLCJmaWxlIjoibGliL2Rlc2lyZWQtY2Fwcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9