"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("source-map-support/register");

var _appiumIosDriver = require("appium-ios-driver");

var _asyncbox = require("asyncbox");

var _appiumSupport = require("appium-support");

var _logger = _interopRequireDefault(require("../logger"));

var _lodash = _interopRequireDefault(require("lodash"));

var _bluebird = _interopRequireDefault(require("bluebird"));

const IPHONE_TOP_BAR_HEIGHT = 71;
const IPHONE_SCROLLED_TOP_BAR_HEIGHT = 41;
const IPHONE_X_NOTCH_OFFSET_IOS_12 = 24;
const IPHONE_X_NOTCH_OFFSET_IOS_13 = 20;
const IPHONE_LANDSCAPE_TOP_BAR_HEIGHT = 51;
const IPHONE_BOTTOM_BAR_OFFSET = 49;
const TAB_BAR_OFFSET = 33;
const IPHONE_WEB_COORD_SMART_APP_BANNER_OFFSET = 84;
const IPAD_WEB_COORD_SMART_APP_BANNER_OFFSET = 95;
const IPHONE_X_WIDTH = 375;
const IPHONE_X_HEIGHT = 812;
const IPHONE_XR_WIDTH = 414;
const IPHONE_XR_HEIGHT = 896;
const ATOM_WAIT_TIMEOUT = 5 * 60000;
let extensions = {};
Object.assign(extensions, _appiumIosDriver.iosCommands.web);
extensions.getSafariIsIphone = _lodash.default.memoize(async function getSafariIsIphone() {
  try {
    const userAgent = await this.execute('return navigator.userAgent');
    return userAgent.toLowerCase().includes('iphone');
  } catch (err) {
    _logger.default.warn(`Unable to find device type from useragent. Assuming iPhone`);

    _logger.default.debug(`Error: ${err.message}`);
  }

  return true;
});
extensions.getSafariIsIphoneX = _lodash.default.memoize(async function getSafariIsIphone() {
  try {
    const script = 'return {height: window.screen.availHeight, width: window.screen.availWidth};';
    const {
      height,
      width
    } = await this.execute(script);
    const [portraitHeight, portraitWidth] = height > width ? [height, width] : [width, height];
    return portraitHeight === IPHONE_X_HEIGHT && portraitWidth === IPHONE_X_WIDTH || portraitHeight === IPHONE_XR_HEIGHT && portraitWidth === IPHONE_XR_WIDTH;
  } catch (err) {
    _logger.default.warn(`Unable to find device type from dimensions. Assuming not iPhone X`);

    _logger.default.debug(`Error: ${err.message}`);
  }

  return false;
});

extensions.getExtraTranslateWebCoordsOffset = async function getExtraTranslateWebCoordsOffset(wvPos, realDims) {
  let topOffset = 0;
  let bottomOffset = 0;
  const implicitWaitMs = this.implicitWaitMs;
  const isIphone = await this.getSafariIsIphone();
  const isIphoneX = isIphone && (await this.getSafariIsIphoneX());
  const orientation = realDims.h > realDims.w ? 'PORTRAIT' : 'LANDSCAPE';
  const notchOffset = isIphoneX ? _appiumSupport.util.compareVersions(this.opts.platformVersion, '<', '13.0') ? IPHONE_X_NOTCH_OFFSET_IOS_12 : IPHONE_X_NOTCH_OFFSET_IOS_13 : 0;

  try {
    this.setImplicitWait(0);
    await this.findNativeElementOrElements('accessibility id', 'ReloadButton', false);
    topOffset = IPHONE_TOP_BAR_HEIGHT + notchOffset;

    if (isIphone) {
      if (orientation === 'PORTRAIT') {
        bottomOffset = IPHONE_BOTTOM_BAR_OFFSET;
      } else {
        topOffset = IPHONE_LANDSCAPE_TOP_BAR_HEIGHT;
      }
    }

    if (orientation === 'LANDSCAPE' || !isIphone) {
      try {
        await this.findNativeElementOrElements('-ios predicate string', `name LIKE '*, Tab' AND visible = 1`, false);
        topOffset += TAB_BAR_OFFSET;
      } catch (ign) {}
    }
  } catch (err) {
    topOffset = IPHONE_SCROLLED_TOP_BAR_HEIGHT + notchOffset;

    if (orientation === 'LANDSCAPE' && isIphone) {
      topOffset = 0;
    }
  } finally {
    this.setImplicitWait(implicitWaitMs);
  }

  topOffset += await this.getExtraNativeWebTapOffset();
  wvPos.y += topOffset;
  realDims.h -= topOffset + bottomOffset;
};

extensions.getExtraNativeWebTapOffset = async function getExtraNativeWebTapOffset() {
  let offset = 0;
  const implicitWaitMs = this.implicitWaitMs;

  try {
    this.setImplicitWait(0);

    try {
      await this.findNativeElementOrElements('accessibility id', 'Close app download offer', false);
      offset += (await this.getSafariIsIphone()) ? IPHONE_WEB_COORD_SMART_APP_BANNER_OFFSET : IPAD_WEB_COORD_SMART_APP_BANNER_OFFSET;
    } catch (ign) {}
  } finally {
    this.setImplicitWait(implicitWaitMs);
  }

  _logger.default.debug(`Additional native web tap offset computed: ${offset}`);

  return offset;
};

async function tapWebElementNatively(driver, atomsElement) {
  try {
    let text = await driver.executeAtom('get_text', [atomsElement]);

    if (!text) {
      text = await driver.executeAtom('get_attribute_value', [atomsElement, 'value']);
    }

    if (text) {
      const els = await driver.findNativeElementOrElements('accessibility id', text, true);

      if (els.length === 1 || els.length === 2) {
        const el = els[0];
        const rect = await driver.proxyCommand(`/element/${_appiumSupport.util.unwrapElement(el)}/rect`, 'GET');

        if (els.length === 2) {
          const el2 = els[1];
          const rect2 = await driver.proxyCommand(`/element/${_appiumSupport.util.unwrapElement(el2)}/rect`, 'GET');

          if (rect.x !== rect2.x || rect.y !== rect2.y || rect.width !== rect2.width || rect.height !== rect2.height) {
            return false;
          }
        }

        const coords = {
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        };
        await driver.clickCoords(coords);
        return true;
      }
    }
  } catch (err) {
    _logger.default.warn(`Error attempting to click: ${err.message}`);
  }

  return false;
}

extensions.nativeWebTap = async function nativeWebTap(el) {
  const atomsElement = this.useAtomsElement(el);

  if (await tapWebElementNatively(this, atomsElement)) {
    return;
  }

  _logger.default.warn('Unable to do simple native web tap. Attempting to convert coordinates');

  await this.executeAtom('get_size', [atomsElement]);
  await this.executeAtom('get_top_left_coordinates', [atomsElement]);
  const {
    width,
    height
  } = await this.executeAtom('get_size', [atomsElement]);
  let {
    x,
    y
  } = await this.executeAtom('get_top_left_coordinates', [atomsElement]);
  x += width / 2;
  y += height / 2;
  this.curWebCoords = {
    x,
    y
  };
  await this.clickWebCoords();
};

extensions.clickCoords = async function clickCoords(coords) {
  await this.performTouch([{
    action: 'tap',
    options: coords
  }]);
};

extensions.translateWebCoords = async function translateWebCoords(coords) {
  _logger.default.debug(`Translating coordinates (${JSON.stringify(coords)}) to web coordinates`);

  const implicitWaitMs = this.implicitWaitMs;
  let webview;

  try {
    this.setImplicitWait(0);
    webview = await (0, _asyncbox.retryInterval)(5, 100, async () => {
      return await this.findNativeElementOrElements('class name', 'XCUIElementTypeWebView', false);
    });
  } finally {
    this.setImplicitWait(implicitWaitMs);
  }

  webview = _appiumSupport.util.unwrapElement(webview);
  const rect = await this.proxyCommand(`/element/${webview}/rect`, 'GET');
  const wvPos = {
    x: rect.x,
    y: rect.y
  };
  const realDims = {
    w: rect.width,
    h: rect.height
  };
  const cmd = '(function () { return {w: window.innerWidth, h: window.innerHeight}; })()';
  const wvDims = await this.remote.execute(cmd);
  await this.getExtraTranslateWebCoordsOffset(wvPos, realDims);

  if (wvDims && realDims && wvPos) {
    let xRatio = realDims.w / wvDims.w;
    let yRatio = realDims.h / wvDims.h;
    let newCoords = {
      x: wvPos.x + Math.round(xRatio * coords.x),
      y: wvPos.y + Math.round(yRatio * coords.y)
    };

    _logger.default.debug(`Converted coordinates: ${JSON.stringify(newCoords)}`);

    _logger.default.debug(`    rect: ${JSON.stringify(rect)}`);

    _logger.default.debug(`    wvPos: ${JSON.stringify(wvPos)}`);

    _logger.default.debug(`    realDims: ${JSON.stringify(realDims)}`);

    _logger.default.debug(`    wvDims: ${JSON.stringify(wvDims)}`);

    _logger.default.debug(`    xRatio: ${JSON.stringify(xRatio)}`);

    _logger.default.debug(`    yRatio: ${JSON.stringify(yRatio)}`);

    _logger.default.debug(`Converted web coords ${JSON.stringify(coords)} ` + `into real coords ${JSON.stringify(newCoords)}`);

    return newCoords;
  }
};

extensions.checkForAlert = async function checkForAlert() {
  return false;
};

extensions.waitForAtom = async function waitForAtom(promise) {
  const started = process.hrtime();

  try {
    return this.parseExecuteResponse((await _bluebird.default.resolve(promise).timeout(ATOM_WAIT_TIMEOUT)));
  } catch (err) {
    if (err instanceof _bluebird.default.TimeoutError) {
      throw new Error(`Did not get any response after ${process.hrtime(started)[0]}s`);
    }

    throw err;
  }
};

var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy93ZWIuanMiXSwibmFtZXMiOlsiSVBIT05FX1RPUF9CQVJfSEVJR0hUIiwiSVBIT05FX1NDUk9MTEVEX1RPUF9CQVJfSEVJR0hUIiwiSVBIT05FX1hfTk9UQ0hfT0ZGU0VUX0lPU18xMiIsIklQSE9ORV9YX05PVENIX09GRlNFVF9JT1NfMTMiLCJJUEhPTkVfTEFORFNDQVBFX1RPUF9CQVJfSEVJR0hUIiwiSVBIT05FX0JPVFRPTV9CQVJfT0ZGU0VUIiwiVEFCX0JBUl9PRkZTRVQiLCJJUEhPTkVfV0VCX0NPT1JEX1NNQVJUX0FQUF9CQU5ORVJfT0ZGU0VUIiwiSVBBRF9XRUJfQ09PUkRfU01BUlRfQVBQX0JBTk5FUl9PRkZTRVQiLCJJUEhPTkVfWF9XSURUSCIsIklQSE9ORV9YX0hFSUdIVCIsIklQSE9ORV9YUl9XSURUSCIsIklQSE9ORV9YUl9IRUlHSFQiLCJBVE9NX1dBSVRfVElNRU9VVCIsImV4dGVuc2lvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJpb3NDb21tYW5kcyIsIndlYiIsImdldFNhZmFyaUlzSXBob25lIiwiXyIsIm1lbW9pemUiLCJ1c2VyQWdlbnQiLCJleGVjdXRlIiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsImVyciIsImxvZyIsIndhcm4iLCJkZWJ1ZyIsIm1lc3NhZ2UiLCJnZXRTYWZhcmlJc0lwaG9uZVgiLCJzY3JpcHQiLCJoZWlnaHQiLCJ3aWR0aCIsInBvcnRyYWl0SGVpZ2h0IiwicG9ydHJhaXRXaWR0aCIsImdldEV4dHJhVHJhbnNsYXRlV2ViQ29vcmRzT2Zmc2V0Iiwid3ZQb3MiLCJyZWFsRGltcyIsInRvcE9mZnNldCIsImJvdHRvbU9mZnNldCIsImltcGxpY2l0V2FpdE1zIiwiaXNJcGhvbmUiLCJpc0lwaG9uZVgiLCJvcmllbnRhdGlvbiIsImgiLCJ3Iiwibm90Y2hPZmZzZXQiLCJ1dGlsIiwiY29tcGFyZVZlcnNpb25zIiwib3B0cyIsInBsYXRmb3JtVmVyc2lvbiIsInNldEltcGxpY2l0V2FpdCIsImZpbmROYXRpdmVFbGVtZW50T3JFbGVtZW50cyIsImlnbiIsImdldEV4dHJhTmF0aXZlV2ViVGFwT2Zmc2V0IiwieSIsIm9mZnNldCIsInRhcFdlYkVsZW1lbnROYXRpdmVseSIsImRyaXZlciIsImF0b21zRWxlbWVudCIsInRleHQiLCJleGVjdXRlQXRvbSIsImVscyIsImxlbmd0aCIsImVsIiwicmVjdCIsInByb3h5Q29tbWFuZCIsInVud3JhcEVsZW1lbnQiLCJlbDIiLCJyZWN0MiIsIngiLCJjb29yZHMiLCJNYXRoIiwicm91bmQiLCJjbGlja0Nvb3JkcyIsIm5hdGl2ZVdlYlRhcCIsInVzZUF0b21zRWxlbWVudCIsImN1cldlYkNvb3JkcyIsImNsaWNrV2ViQ29vcmRzIiwicGVyZm9ybVRvdWNoIiwiYWN0aW9uIiwib3B0aW9ucyIsInRyYW5zbGF0ZVdlYkNvb3JkcyIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3ZWJ2aWV3IiwiY21kIiwid3ZEaW1zIiwicmVtb3RlIiwieFJhdGlvIiwieVJhdGlvIiwibmV3Q29vcmRzIiwiY2hlY2tGb3JBbGVydCIsIndhaXRGb3JBdG9tIiwicHJvbWlzZSIsInN0YXJ0ZWQiLCJwcm9jZXNzIiwiaHJ0aW1lIiwicGFyc2VFeGVjdXRlUmVzcG9uc2UiLCJCIiwicmVzb2x2ZSIsInRpbWVvdXQiLCJUaW1lb3V0RXJyb3IiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxxQkFBcUIsR0FBRyxFQUE5QjtBQUNBLE1BQU1DLDhCQUE4QixHQUFHLEVBQXZDO0FBQ0EsTUFBTUMsNEJBQTRCLEdBQUcsRUFBckM7QUFDQSxNQUFNQyw0QkFBNEIsR0FBRyxFQUFyQztBQUNBLE1BQU1DLCtCQUErQixHQUFHLEVBQXhDO0FBQ0EsTUFBTUMsd0JBQXdCLEdBQUcsRUFBakM7QUFDQSxNQUFNQyxjQUFjLEdBQUcsRUFBdkI7QUFDQSxNQUFNQyx3Q0FBd0MsR0FBRyxFQUFqRDtBQUNBLE1BQU1DLHNDQUFzQyxHQUFHLEVBQS9DO0FBRUEsTUFBTUMsY0FBYyxHQUFHLEdBQXZCO0FBQ0EsTUFBTUMsZUFBZSxHQUFHLEdBQXhCO0FBQ0EsTUFBTUMsZUFBZSxHQUFHLEdBQXhCO0FBQ0EsTUFBTUMsZ0JBQWdCLEdBQUcsR0FBekI7QUFFQSxNQUFNQyxpQkFBaUIsR0FBRyxJQUFJLEtBQTlCO0FBRUEsSUFBSUMsVUFBVSxHQUFHLEVBQWpCO0FBRUFDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjRixVQUFkLEVBQTBCRyw2QkFBWUMsR0FBdEM7QUFJQUosVUFBVSxDQUFDSyxpQkFBWCxHQUErQkMsZ0JBQUVDLE9BQUYsQ0FBVSxlQUFlRixpQkFBZixHQUFvQztBQUMzRSxNQUFJO0FBQ0YsVUFBTUcsU0FBUyxHQUFHLE1BQU0sS0FBS0MsT0FBTCxDQUFhLDRCQUFiLENBQXhCO0FBQ0EsV0FBT0QsU0FBUyxDQUFDRSxXQUFWLEdBQXdCQyxRQUF4QixDQUFpQyxRQUFqQyxDQUFQO0FBQ0QsR0FIRCxDQUdFLE9BQU9DLEdBQVAsRUFBWTtBQUNaQyxvQkFBSUMsSUFBSixDQUFVLDREQUFWOztBQUNBRCxvQkFBSUUsS0FBSixDQUFXLFVBQVNILEdBQUcsQ0FBQ0ksT0FBUSxFQUFoQztBQUNEOztBQUNELFNBQU8sSUFBUDtBQUNELENBVDhCLENBQS9CO0FBV0FoQixVQUFVLENBQUNpQixrQkFBWCxHQUFnQ1gsZ0JBQUVDLE9BQUYsQ0FBVSxlQUFlRixpQkFBZixHQUFvQztBQUM1RSxNQUFJO0FBQ0YsVUFBTWEsTUFBTSxHQUFHLDhFQUFmO0FBQ0EsVUFBTTtBQUFDQyxNQUFBQSxNQUFEO0FBQVNDLE1BQUFBO0FBQVQsUUFBa0IsTUFBTSxLQUFLWCxPQUFMLENBQWFTLE1BQWIsQ0FBOUI7QUFFQSxVQUFNLENBQUNHLGNBQUQsRUFBaUJDLGFBQWpCLElBQWtDSCxNQUFNLEdBQUdDLEtBQVQsR0FBaUIsQ0FBQ0QsTUFBRCxFQUFTQyxLQUFULENBQWpCLEdBQW1DLENBQUNBLEtBQUQsRUFBUUQsTUFBUixDQUEzRTtBQUNBLFdBQVFFLGNBQWMsS0FBS3pCLGVBQW5CLElBQXNDMEIsYUFBYSxLQUFLM0IsY0FBekQsSUFDQzBCLGNBQWMsS0FBS3ZCLGdCQUFuQixJQUF1Q3dCLGFBQWEsS0FBS3pCLGVBRGpFO0FBR0QsR0FSRCxDQVFFLE9BQU9lLEdBQVAsRUFBWTtBQUNaQyxvQkFBSUMsSUFBSixDQUFVLG1FQUFWOztBQUNBRCxvQkFBSUUsS0FBSixDQUFXLFVBQVNILEdBQUcsQ0FBQ0ksT0FBUSxFQUFoQztBQUNEOztBQUNELFNBQU8sS0FBUDtBQUNELENBZCtCLENBQWhDOztBQWdCQWhCLFVBQVUsQ0FBQ3VCLGdDQUFYLEdBQThDLGVBQWVBLGdDQUFmLENBQWlEQyxLQUFqRCxFQUF3REMsUUFBeEQsRUFBa0U7QUFDOUcsTUFBSUMsU0FBUyxHQUFHLENBQWhCO0FBQ0EsTUFBSUMsWUFBWSxHQUFHLENBQW5CO0FBR0EsUUFBTUMsY0FBYyxHQUFHLEtBQUtBLGNBQTVCO0FBRUEsUUFBTUMsUUFBUSxHQUFHLE1BQU0sS0FBS3hCLGlCQUFMLEVBQXZCO0FBQ0EsUUFBTXlCLFNBQVMsR0FBR0QsUUFBUSxLQUFJLE1BQU0sS0FBS1osa0JBQUwsRUFBVixDQUExQjtBQUVBLFFBQU1jLFdBQVcsR0FBR04sUUFBUSxDQUFDTyxDQUFULEdBQWFQLFFBQVEsQ0FBQ1EsQ0FBdEIsR0FBMEIsVUFBMUIsR0FBdUMsV0FBM0Q7QUFFQSxRQUFNQyxXQUFXLEdBQUdKLFNBQVMsR0FDekJLLG9CQUFLQyxlQUFMLENBQXFCLEtBQUtDLElBQUwsQ0FBVUMsZUFBL0IsRUFBZ0QsR0FBaEQsRUFBcUQsTUFBckQsSUFDRWxELDRCQURGLEdBRUVDLDRCQUh1QixHQUl6QixDQUpKOztBQU1BLE1BQUk7QUFDRixTQUFLa0QsZUFBTCxDQUFxQixDQUFyQjtBQUdBLFVBQU0sS0FBS0MsMkJBQUwsQ0FBaUMsa0JBQWpDLEVBQXFELGNBQXJELEVBQXFFLEtBQXJFLENBQU47QUFHQWQsSUFBQUEsU0FBUyxHQUFHeEMscUJBQXFCLEdBQUdnRCxXQUFwQzs7QUFDQSxRQUFJTCxRQUFKLEVBQWM7QUFDWixVQUFJRSxXQUFXLEtBQUssVUFBcEIsRUFBZ0M7QUFFOUJKLFFBQUFBLFlBQVksR0FBR3BDLHdCQUFmO0FBQ0QsT0FIRCxNQUdPO0FBQ0xtQyxRQUFBQSxTQUFTLEdBQUdwQywrQkFBWjtBQUNEO0FBQ0Y7O0FBQ0QsUUFBSXlDLFdBQVcsS0FBSyxXQUFoQixJQUErQixDQUFDRixRQUFwQyxFQUE4QztBQUU1QyxVQUFJO0FBQ0YsY0FBTSxLQUFLVywyQkFBTCxDQUFpQyx1QkFBakMsRUFBMkQsb0NBQTNELEVBQWdHLEtBQWhHLENBQU47QUFDQWQsUUFBQUEsU0FBUyxJQUFJbEMsY0FBYjtBQUNELE9BSEQsQ0FHRSxPQUFPaUQsR0FBUCxFQUFZLENBRWI7QUFDRjtBQUVGLEdBMUJELENBMEJFLE9BQU83QixHQUFQLEVBQVk7QUFFWmMsSUFBQUEsU0FBUyxHQUFHdkMsOEJBQThCLEdBQUcrQyxXQUE3Qzs7QUFHQSxRQUFJSCxXQUFXLEtBQUssV0FBaEIsSUFBK0JGLFFBQW5DLEVBQTZDO0FBQzNDSCxNQUFBQSxTQUFTLEdBQUcsQ0FBWjtBQUNEO0FBRUYsR0FuQ0QsU0FtQ1U7QUFFUixTQUFLYSxlQUFMLENBQXFCWCxjQUFyQjtBQUNEOztBQUVERixFQUFBQSxTQUFTLElBQUksTUFBTSxLQUFLZ0IsMEJBQUwsRUFBbkI7QUFFQWxCLEVBQUFBLEtBQUssQ0FBQ21CLENBQU4sSUFBV2pCLFNBQVg7QUFDQUQsRUFBQUEsUUFBUSxDQUFDTyxDQUFULElBQWVOLFNBQVMsR0FBR0MsWUFBM0I7QUFDRCxDQTlERDs7QUFnRUEzQixVQUFVLENBQUMwQywwQkFBWCxHQUF3QyxlQUFlQSwwQkFBZixHQUE2QztBQUNuRixNQUFJRSxNQUFNLEdBQUcsQ0FBYjtBQUdBLFFBQU1oQixjQUFjLEdBQUcsS0FBS0EsY0FBNUI7O0FBQ0EsTUFBSTtBQUNGLFNBQUtXLGVBQUwsQ0FBcUIsQ0FBckI7O0FBR0EsUUFBSTtBQUNGLFlBQU0sS0FBS0MsMkJBQUwsQ0FBaUMsa0JBQWpDLEVBQXFELDBCQUFyRCxFQUFpRixLQUFqRixDQUFOO0FBQ0FJLE1BQUFBLE1BQU0sSUFBSSxPQUFNLEtBQUt2QyxpQkFBTCxFQUFOLElBQ1JaLHdDQURRLEdBRVJDLHNDQUZGO0FBR0QsS0FMRCxDQUtFLE9BQU8rQyxHQUFQLEVBQVksQ0FFYjtBQUNGLEdBWkQsU0FZVTtBQUVSLFNBQUtGLGVBQUwsQ0FBcUJYLGNBQXJCO0FBQ0Q7O0FBRURmLGtCQUFJRSxLQUFKLENBQVcsOENBQTZDNkIsTUFBTyxFQUEvRDs7QUFDQSxTQUFPQSxNQUFQO0FBQ0QsQ0F4QkQ7O0FBMEJBLGVBQWVDLHFCQUFmLENBQXNDQyxNQUF0QyxFQUE4Q0MsWUFBOUMsRUFBNEQ7QUFHMUQsTUFBSTtBQUNGLFFBQUlDLElBQUksR0FBRyxNQUFNRixNQUFNLENBQUNHLFdBQVAsQ0FBbUIsVUFBbkIsRUFBK0IsQ0FBQ0YsWUFBRCxDQUEvQixDQUFqQjs7QUFDQSxRQUFJLENBQUNDLElBQUwsRUFBVztBQUNUQSxNQUFBQSxJQUFJLEdBQUcsTUFBTUYsTUFBTSxDQUFDRyxXQUFQLENBQW1CLHFCQUFuQixFQUEwQyxDQUFDRixZQUFELEVBQWUsT0FBZixDQUExQyxDQUFiO0FBQ0Q7O0FBRUQsUUFBSUMsSUFBSixFQUFVO0FBQ1IsWUFBTUUsR0FBRyxHQUFHLE1BQU1KLE1BQU0sQ0FBQ04sMkJBQVAsQ0FBbUMsa0JBQW5DLEVBQXVEUSxJQUF2RCxFQUE2RCxJQUE3RCxDQUFsQjs7QUFDQSxVQUFJRSxHQUFHLENBQUNDLE1BQUosS0FBZSxDQUFmLElBQW9CRCxHQUFHLENBQUNDLE1BQUosS0FBZSxDQUF2QyxFQUEwQztBQUN4QyxjQUFNQyxFQUFFLEdBQUdGLEdBQUcsQ0FBQyxDQUFELENBQWQ7QUFFQSxjQUFNRyxJQUFJLEdBQUcsTUFBTVAsTUFBTSxDQUFDUSxZQUFQLENBQXFCLFlBQVduQixvQkFBS29CLGFBQUwsQ0FBbUJILEVBQW5CLENBQXVCLE9BQXZELEVBQStELEtBQS9ELENBQW5COztBQUNBLFlBQUlGLEdBQUcsQ0FBQ0MsTUFBSixLQUFlLENBQW5CLEVBQXNCO0FBQ3BCLGdCQUFNSyxHQUFHLEdBQUdOLEdBQUcsQ0FBQyxDQUFELENBQWY7QUFDQSxnQkFBTU8sS0FBSyxHQUFHLE1BQU1YLE1BQU0sQ0FBQ1EsWUFBUCxDQUFxQixZQUFXbkIsb0JBQUtvQixhQUFMLENBQW1CQyxHQUFuQixDQUF3QixPQUF4RCxFQUFnRSxLQUFoRSxDQUFwQjs7QUFFQSxjQUFLSCxJQUFJLENBQUNLLENBQUwsS0FBV0QsS0FBSyxDQUFDQyxDQUFqQixJQUFzQkwsSUFBSSxDQUFDVixDQUFMLEtBQVdjLEtBQUssQ0FBQ2QsQ0FBeEMsSUFDSFUsSUFBSSxDQUFDakMsS0FBTCxLQUFlcUMsS0FBSyxDQUFDckMsS0FBckIsSUFBOEJpQyxJQUFJLENBQUNsQyxNQUFMLEtBQWdCc0MsS0FBSyxDQUFDdEMsTUFEckQsRUFDOEQ7QUFFNUQsbUJBQU8sS0FBUDtBQUNEO0FBQ0Y7O0FBQ0QsY0FBTXdDLE1BQU0sR0FBRztBQUNiRCxVQUFBQSxDQUFDLEVBQUVFLElBQUksQ0FBQ0MsS0FBTCxDQUFXUixJQUFJLENBQUNLLENBQUwsR0FBU0wsSUFBSSxDQUFDakMsS0FBTCxHQUFhLENBQWpDLENBRFU7QUFFYnVCLFVBQUFBLENBQUMsRUFBRWlCLElBQUksQ0FBQ0MsS0FBTCxDQUFXUixJQUFJLENBQUNWLENBQUwsR0FBU1UsSUFBSSxDQUFDbEMsTUFBTCxHQUFjLENBQWxDO0FBRlUsU0FBZjtBQUlBLGNBQU0yQixNQUFNLENBQUNnQixXQUFQLENBQW1CSCxNQUFuQixDQUFOO0FBQ0EsZUFBTyxJQUFQO0FBQ0Q7QUFDRjtBQUNGLEdBOUJELENBOEJFLE9BQU8vQyxHQUFQLEVBQVk7QUFHWkMsb0JBQUlDLElBQUosQ0FBVSw4QkFBNkJGLEdBQUcsQ0FBQ0ksT0FBUSxFQUFuRDtBQUNEOztBQUNELFNBQU8sS0FBUDtBQUNEOztBQUVEaEIsVUFBVSxDQUFDK0QsWUFBWCxHQUEwQixlQUFlQSxZQUFmLENBQTZCWCxFQUE3QixFQUFpQztBQUN6RCxRQUFNTCxZQUFZLEdBQUcsS0FBS2lCLGVBQUwsQ0FBcUJaLEVBQXJCLENBQXJCOztBQUVBLE1BQUksTUFBTVAscUJBQXFCLENBQUMsSUFBRCxFQUFPRSxZQUFQLENBQS9CLEVBQXFEO0FBQ25EO0FBQ0Q7O0FBQ0RsQyxrQkFBSUMsSUFBSixDQUFTLHVFQUFUOztBQUlBLFFBQU0sS0FBS21DLFdBQUwsQ0FBaUIsVUFBakIsRUFBNkIsQ0FBQ0YsWUFBRCxDQUE3QixDQUFOO0FBQ0EsUUFBTSxLQUFLRSxXQUFMLENBQWlCLDBCQUFqQixFQUE2QyxDQUFDRixZQUFELENBQTdDLENBQU47QUFFQSxRQUFNO0FBQUMzQixJQUFBQSxLQUFEO0FBQVFELElBQUFBO0FBQVIsTUFBa0IsTUFBTSxLQUFLOEIsV0FBTCxDQUFpQixVQUFqQixFQUE2QixDQUFDRixZQUFELENBQTdCLENBQTlCO0FBQ0EsTUFBSTtBQUFDVyxJQUFBQSxDQUFEO0FBQUlmLElBQUFBO0FBQUosTUFBUyxNQUFNLEtBQUtNLFdBQUwsQ0FBaUIsMEJBQWpCLEVBQTZDLENBQUNGLFlBQUQsQ0FBN0MsQ0FBbkI7QUFDQVcsRUFBQUEsQ0FBQyxJQUFJdEMsS0FBSyxHQUFHLENBQWI7QUFDQXVCLEVBQUFBLENBQUMsSUFBSXhCLE1BQU0sR0FBRyxDQUFkO0FBRUEsT0FBSzhDLFlBQUwsR0FBb0I7QUFBQ1AsSUFBQUEsQ0FBRDtBQUFJZixJQUFBQTtBQUFKLEdBQXBCO0FBQ0EsUUFBTSxLQUFLdUIsY0FBTCxFQUFOO0FBQ0QsQ0FwQkQ7O0FBc0JBbEUsVUFBVSxDQUFDOEQsV0FBWCxHQUF5QixlQUFlQSxXQUFmLENBQTRCSCxNQUE1QixFQUFvQztBQUMzRCxRQUFNLEtBQUtRLFlBQUwsQ0FBa0IsQ0FDdEI7QUFDRUMsSUFBQUEsTUFBTSxFQUFFLEtBRFY7QUFFRUMsSUFBQUEsT0FBTyxFQUFFVjtBQUZYLEdBRHNCLENBQWxCLENBQU47QUFNRCxDQVBEOztBQVNBM0QsVUFBVSxDQUFDc0Usa0JBQVgsR0FBZ0MsZUFBZUEsa0JBQWYsQ0FBbUNYLE1BQW5DLEVBQTJDO0FBQ3pFOUMsa0JBQUlFLEtBQUosQ0FBVyw0QkFBMkJ3RCxJQUFJLENBQUNDLFNBQUwsQ0FBZWIsTUFBZixDQUF1QixzQkFBN0Q7O0FBR0EsUUFBTS9CLGNBQWMsR0FBRyxLQUFLQSxjQUE1QjtBQUNBLE1BQUk2QyxPQUFKOztBQUNBLE1BQUk7QUFDRixTQUFLbEMsZUFBTCxDQUFxQixDQUFyQjtBQUNBa0MsSUFBQUEsT0FBTyxHQUFHLE1BQU0sNkJBQWMsQ0FBZCxFQUFpQixHQUFqQixFQUFzQixZQUFZO0FBQ2hELGFBQU8sTUFBTSxLQUFLakMsMkJBQUwsQ0FBaUMsWUFBakMsRUFBK0Msd0JBQS9DLEVBQXlFLEtBQXpFLENBQWI7QUFDRCxLQUZlLENBQWhCO0FBR0QsR0FMRCxTQUtVO0FBQ1IsU0FBS0QsZUFBTCxDQUFxQlgsY0FBckI7QUFDRDs7QUFFRDZDLEVBQUFBLE9BQU8sR0FBR3RDLG9CQUFLb0IsYUFBTCxDQUFtQmtCLE9BQW5CLENBQVY7QUFDQSxRQUFNcEIsSUFBSSxHQUFHLE1BQU0sS0FBS0MsWUFBTCxDQUFtQixZQUFXbUIsT0FBUSxPQUF0QyxFQUE4QyxLQUE5QyxDQUFuQjtBQUNBLFFBQU1qRCxLQUFLLEdBQUc7QUFBQ2tDLElBQUFBLENBQUMsRUFBRUwsSUFBSSxDQUFDSyxDQUFUO0FBQVlmLElBQUFBLENBQUMsRUFBRVUsSUFBSSxDQUFDVjtBQUFwQixHQUFkO0FBQ0EsUUFBTWxCLFFBQVEsR0FBRztBQUFDUSxJQUFBQSxDQUFDLEVBQUVvQixJQUFJLENBQUNqQyxLQUFUO0FBQWdCWSxJQUFBQSxDQUFDLEVBQUVxQixJQUFJLENBQUNsQztBQUF4QixHQUFqQjtBQUVBLFFBQU11RCxHQUFHLEdBQUcsMkVBQVo7QUFDQSxRQUFNQyxNQUFNLEdBQUcsTUFBTSxLQUFLQyxNQUFMLENBQVluRSxPQUFaLENBQW9CaUUsR0FBcEIsQ0FBckI7QUFFQSxRQUFNLEtBQUtuRCxnQ0FBTCxDQUFzQ0MsS0FBdEMsRUFBNkNDLFFBQTdDLENBQU47O0FBRUEsTUFBSWtELE1BQU0sSUFBSWxELFFBQVYsSUFBc0JELEtBQTFCLEVBQWlDO0FBQy9CLFFBQUlxRCxNQUFNLEdBQUdwRCxRQUFRLENBQUNRLENBQVQsR0FBYTBDLE1BQU0sQ0FBQzFDLENBQWpDO0FBQ0EsUUFBSTZDLE1BQU0sR0FBR3JELFFBQVEsQ0FBQ08sQ0FBVCxHQUFhMkMsTUFBTSxDQUFDM0MsQ0FBakM7QUFDQSxRQUFJK0MsU0FBUyxHQUFHO0FBQ2RyQixNQUFBQSxDQUFDLEVBQUVsQyxLQUFLLENBQUNrQyxDQUFOLEdBQVVFLElBQUksQ0FBQ0MsS0FBTCxDQUFXZ0IsTUFBTSxHQUFHbEIsTUFBTSxDQUFDRCxDQUEzQixDQURDO0FBRWRmLE1BQUFBLENBQUMsRUFBRW5CLEtBQUssQ0FBQ21CLENBQU4sR0FBVWlCLElBQUksQ0FBQ0MsS0FBTCxDQUFXaUIsTUFBTSxHQUFHbkIsTUFBTSxDQUFDaEIsQ0FBM0I7QUFGQyxLQUFoQjs7QUFPQTlCLG9CQUFJRSxLQUFKLENBQVcsMEJBQXlCd0QsSUFBSSxDQUFDQyxTQUFMLENBQWVPLFNBQWYsQ0FBMEIsRUFBOUQ7O0FBQ0FsRSxvQkFBSUUsS0FBSixDQUFXLGFBQVl3RCxJQUFJLENBQUNDLFNBQUwsQ0FBZW5CLElBQWYsQ0FBcUIsRUFBNUM7O0FBQ0F4QyxvQkFBSUUsS0FBSixDQUFXLGNBQWF3RCxJQUFJLENBQUNDLFNBQUwsQ0FBZWhELEtBQWYsQ0FBc0IsRUFBOUM7O0FBQ0FYLG9CQUFJRSxLQUFKLENBQVcsaUJBQWdCd0QsSUFBSSxDQUFDQyxTQUFMLENBQWUvQyxRQUFmLENBQXlCLEVBQXBEOztBQUNBWixvQkFBSUUsS0FBSixDQUFXLGVBQWN3RCxJQUFJLENBQUNDLFNBQUwsQ0FBZUcsTUFBZixDQUF1QixFQUFoRDs7QUFDQTlELG9CQUFJRSxLQUFKLENBQVcsZUFBY3dELElBQUksQ0FBQ0MsU0FBTCxDQUFlSyxNQUFmLENBQXVCLEVBQWhEOztBQUNBaEUsb0JBQUlFLEtBQUosQ0FBVyxlQUFjd0QsSUFBSSxDQUFDQyxTQUFMLENBQWVNLE1BQWYsQ0FBdUIsRUFBaEQ7O0FBRUFqRSxvQkFBSUUsS0FBSixDQUFXLHdCQUF1QndELElBQUksQ0FBQ0MsU0FBTCxDQUFlYixNQUFmLENBQXVCLEdBQS9DLEdBQ0Msb0JBQW1CWSxJQUFJLENBQUNDLFNBQUwsQ0FBZU8sU0FBZixDQUEwQixFQUR4RDs7QUFFQSxXQUFPQSxTQUFQO0FBQ0Q7QUFDRixDQS9DRDs7QUFpREEvRSxVQUFVLENBQUNnRixhQUFYLEdBQTJCLGVBQWVBLGFBQWYsR0FBZ0M7QUFDekQsU0FBTyxLQUFQO0FBQ0QsQ0FGRDs7QUFJQWhGLFVBQVUsQ0FBQ2lGLFdBQVgsR0FBeUIsZUFBZUEsV0FBZixDQUE0QkMsT0FBNUIsRUFBcUM7QUFDNUQsUUFBTUMsT0FBTyxHQUFHQyxPQUFPLENBQUNDLE1BQVIsRUFBaEI7O0FBQ0EsTUFBSTtBQUNGLFdBQU8sS0FBS0Msb0JBQUwsRUFBMEIsTUFBTUMsa0JBQUVDLE9BQUYsQ0FBVU4sT0FBVixFQUNwQ08sT0FEb0MsQ0FDNUIxRixpQkFENEIsQ0FBaEMsRUFBUDtBQUVELEdBSEQsQ0FHRSxPQUFPYSxHQUFQLEVBQVk7QUFDWixRQUFJQSxHQUFHLFlBQVkyRSxrQkFBRUcsWUFBckIsRUFBbUM7QUFDakMsWUFBTSxJQUFJQyxLQUFKLENBQVcsa0NBQWlDUCxPQUFPLENBQUNDLE1BQVIsQ0FBZUYsT0FBZixFQUF3QixDQUF4QixDQUEyQixHQUF2RSxDQUFOO0FBQ0Q7O0FBQ0QsVUFBTXZFLEdBQU47QUFDRDtBQUNGLENBWEQ7O2VBYWVaLFUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpb3NDb21tYW5kcyB9IGZyb20gJ2FwcGl1bS1pb3MtZHJpdmVyJztcbmltcG9ydCB7IHJldHJ5SW50ZXJ2YWwgfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgeyB1dGlsIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcblxuY29uc3QgSVBIT05FX1RPUF9CQVJfSEVJR0hUID0gNzE7XG5jb25zdCBJUEhPTkVfU0NST0xMRURfVE9QX0JBUl9IRUlHSFQgPSA0MTtcbmNvbnN0IElQSE9ORV9YX05PVENIX09GRlNFVF9JT1NfMTIgPSAyNDtcbmNvbnN0IElQSE9ORV9YX05PVENIX09GRlNFVF9JT1NfMTMgPSAyMDtcbmNvbnN0IElQSE9ORV9MQU5EU0NBUEVfVE9QX0JBUl9IRUlHSFQgPSA1MTtcbmNvbnN0IElQSE9ORV9CT1RUT01fQkFSX09GRlNFVCA9IDQ5O1xuY29uc3QgVEFCX0JBUl9PRkZTRVQgPSAzMztcbmNvbnN0IElQSE9ORV9XRUJfQ09PUkRfU01BUlRfQVBQX0JBTk5FUl9PRkZTRVQgPSA4NDtcbmNvbnN0IElQQURfV0VCX0NPT1JEX1NNQVJUX0FQUF9CQU5ORVJfT0ZGU0VUID0gOTU7XG5cbmNvbnN0IElQSE9ORV9YX1dJRFRIID0gMzc1O1xuY29uc3QgSVBIT05FX1hfSEVJR0hUID0gODEyO1xuY29uc3QgSVBIT05FX1hSX1dJRFRIID0gNDE0O1xuY29uc3QgSVBIT05FX1hSX0hFSUdIVCA9IDg5NjtcblxuY29uc3QgQVRPTV9XQUlUX1RJTUVPVVQgPSA1ICogNjAwMDA7XG5cbmxldCBleHRlbnNpb25zID0ge307XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgaW9zQ29tbWFuZHMud2ViKTtcblxuXG5cbmV4dGVuc2lvbnMuZ2V0U2FmYXJpSXNJcGhvbmUgPSBfLm1lbW9pemUoYXN5bmMgZnVuY3Rpb24gZ2V0U2FmYXJpSXNJcGhvbmUgKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXJBZ2VudCA9IGF3YWl0IHRoaXMuZXhlY3V0ZSgncmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQnKTtcbiAgICByZXR1cm4gdXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2lwaG9uZScpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2cud2FybihgVW5hYmxlIHRvIGZpbmQgZGV2aWNlIHR5cGUgZnJvbSB1c2VyYWdlbnQuIEFzc3VtaW5nIGlQaG9uZWApO1xuICAgIGxvZy5kZWJ1ZyhgRXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59KTtcblxuZXh0ZW5zaW9ucy5nZXRTYWZhcmlJc0lwaG9uZVggPSBfLm1lbW9pemUoYXN5bmMgZnVuY3Rpb24gZ2V0U2FmYXJpSXNJcGhvbmUgKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHNjcmlwdCA9ICdyZXR1cm4ge2hlaWdodDogd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodCwgd2lkdGg6IHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aH07JztcbiAgICBjb25zdCB7aGVpZ2h0LCB3aWR0aH0gPSBhd2FpdCB0aGlzLmV4ZWN1dGUoc2NyaXB0KTtcbiAgICAvLyBjaGVjayBmb3IgdGhlIGNvcnJlY3QgaGVpZ2h0IGFuZCB3aWR0aFxuICAgIGNvbnN0IFtwb3J0cmFpdEhlaWdodCwgcG9ydHJhaXRXaWR0aF0gPSBoZWlnaHQgPiB3aWR0aCA/IFtoZWlnaHQsIHdpZHRoXSA6IFt3aWR0aCwgaGVpZ2h0XTtcbiAgICByZXR1cm4gKHBvcnRyYWl0SGVpZ2h0ID09PSBJUEhPTkVfWF9IRUlHSFQgJiYgcG9ydHJhaXRXaWR0aCA9PT0gSVBIT05FX1hfV0lEVEgpIHx8XG4gICAgICAgICAgIChwb3J0cmFpdEhlaWdodCA9PT0gSVBIT05FX1hSX0hFSUdIVCAmJiBwb3J0cmFpdFdpZHRoID09PSBJUEhPTkVfWFJfV0lEVEgpO1xuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZy53YXJuKGBVbmFibGUgdG8gZmluZCBkZXZpY2UgdHlwZSBmcm9tIGRpbWVuc2lvbnMuIEFzc3VtaW5nIG5vdCBpUGhvbmUgWGApO1xuICAgIGxvZy5kZWJ1ZyhgRXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSk7XG5cbmV4dGVuc2lvbnMuZ2V0RXh0cmFUcmFuc2xhdGVXZWJDb29yZHNPZmZzZXQgPSBhc3luYyBmdW5jdGlvbiBnZXRFeHRyYVRyYW5zbGF0ZVdlYkNvb3Jkc09mZnNldCAod3ZQb3MsIHJlYWxEaW1zKSB7XG4gIGxldCB0b3BPZmZzZXQgPSAwO1xuICBsZXQgYm90dG9tT2Zmc2V0ID0gMDtcblxuICAvLyBrZWVwIHRyYWNrIG9mIGltcGxpY2l0IHdhaXQsIGFuZCBzZXQgbG9jYWxseSB0byAwXG4gIGNvbnN0IGltcGxpY2l0V2FpdE1zID0gdGhpcy5pbXBsaWNpdFdhaXRNcztcblxuICBjb25zdCBpc0lwaG9uZSA9IGF3YWl0IHRoaXMuZ2V0U2FmYXJpSXNJcGhvbmUoKTtcbiAgY29uc3QgaXNJcGhvbmVYID0gaXNJcGhvbmUgJiYgYXdhaXQgdGhpcy5nZXRTYWZhcmlJc0lwaG9uZVgoKTtcblxuICBjb25zdCBvcmllbnRhdGlvbiA9IHJlYWxEaW1zLmggPiByZWFsRGltcy53ID8gJ1BPUlRSQUlUJyA6ICdMQU5EU0NBUEUnO1xuXG4gIGNvbnN0IG5vdGNoT2Zmc2V0ID0gaXNJcGhvbmVYXG4gICAgPyB1dGlsLmNvbXBhcmVWZXJzaW9ucyh0aGlzLm9wdHMucGxhdGZvcm1WZXJzaW9uLCAnPCcsICcxMy4wJylcbiAgICAgID8gSVBIT05FX1hfTk9UQ0hfT0ZGU0VUX0lPU18xMlxuICAgICAgOiBJUEhPTkVfWF9OT1RDSF9PRkZTRVRfSU9TXzEzXG4gICAgOiAwO1xuXG4gIHRyeSB7XG4gICAgdGhpcy5zZXRJbXBsaWNpdFdhaXQoMCk7XG5cbiAgICAvLyBjaGVjayBpZiB0aGUgZnVsbCB1cmwgYmFyIGlzIHVwXG4gICAgYXdhaXQgdGhpcy5maW5kTmF0aXZlRWxlbWVudE9yRWxlbWVudHMoJ2FjY2Vzc2liaWxpdHkgaWQnLCAnUmVsb2FkQnV0dG9uJywgZmFsc2UpO1xuXG4gICAgLy8gcmVsb2FkIGJ1dHRvbiBmb3VuZCwgd2hpY2ggbWVhbnMgc2Nyb2xsaW5nIGhhcyBub3QgaGFwcGVuZWRcbiAgICB0b3BPZmZzZXQgPSBJUEhPTkVfVE9QX0JBUl9IRUlHSFQgKyBub3RjaE9mZnNldDtcbiAgICBpZiAoaXNJcGhvbmUpIHtcbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ1BPUlRSQUlUJykge1xuICAgICAgICAvLyBUaGUgYm90dG9tIGJhciBpcyBvbmx5IHZpc2libGUgd2hlbiBwb3J0cmFpdFxuICAgICAgICBib3R0b21PZmZzZXQgPSBJUEhPTkVfQk9UVE9NX0JBUl9PRkZTRVQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b3BPZmZzZXQgPSBJUEhPTkVfTEFORFNDQVBFX1RPUF9CQVJfSEVJR0hUO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3JpZW50YXRpb24gPT09ICdMQU5EU0NBUEUnIHx8ICFpc0lwaG9uZSkge1xuICAgICAgLy8gVGFicyBvbmx5IGFwcGVhciBpZiB0aGUgZGV2aWNlIGlzIGxhbmRzY2FwZSBvciBpZiBpdCdzIGFuIGlQYWQgc28gd2Ugb25seSBjaGVjayB2aXNpYmlsaXR5IGluIHRoaXMgY2FzZVxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5maW5kTmF0aXZlRWxlbWVudE9yRWxlbWVudHMoJy1pb3MgcHJlZGljYXRlIHN0cmluZycsIGBuYW1lIExJS0UgJyosIFRhYicgQU5EIHZpc2libGUgPSAxYCwgZmFsc2UpO1xuICAgICAgICB0b3BPZmZzZXQgKz0gVEFCX0JBUl9PRkZTRVQ7XG4gICAgICB9IGNhdGNoIChpZ24pIHtcbiAgICAgICAgLy8gbm8gZWxlbWVudCBmb3VuZCwgc28gbm8gdGFicyBhbmQgbm8gbmVlZCB0byBkZWFsIHdpdGggb2Zmc2V0XG4gICAgICB9XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIG5vIHJlbG9hZCBidXR0b24sIHdoaWNoIGluZGljYXRlcyBzY3JvbGxpbmcgaGFzIGhhcHBlbmVkXG4gICAgdG9wT2Zmc2V0ID0gSVBIT05FX1NDUk9MTEVEX1RPUF9CQVJfSEVJR0hUICsgbm90Y2hPZmZzZXQ7XG5cbiAgICAvLyBJZiB0aGUgaVBob25lIGlzIGxhbmRzY2FwZSB0aGVuIHRoZXJlIGlzIG5vdCB0b3AgYmFyXG4gICAgaWYgKG9yaWVudGF0aW9uID09PSAnTEFORFNDQVBFJyAmJiBpc0lwaG9uZSkge1xuICAgICAgdG9wT2Zmc2V0ID0gMDtcbiAgICB9XG5cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZXR1cm4gaW1wbGljaXQgd2FpdCB0byB3aGF0IGl0IHdhc1xuICAgIHRoaXMuc2V0SW1wbGljaXRXYWl0KGltcGxpY2l0V2FpdE1zKTtcbiAgfVxuXG4gIHRvcE9mZnNldCArPSBhd2FpdCB0aGlzLmdldEV4dHJhTmF0aXZlV2ViVGFwT2Zmc2V0KCk7XG5cbiAgd3ZQb3MueSArPSB0b3BPZmZzZXQ7XG4gIHJlYWxEaW1zLmggLT0gKHRvcE9mZnNldCArIGJvdHRvbU9mZnNldCk7XG59O1xuXG5leHRlbnNpb25zLmdldEV4dHJhTmF0aXZlV2ViVGFwT2Zmc2V0ID0gYXN5bmMgZnVuY3Rpb24gZ2V0RXh0cmFOYXRpdmVXZWJUYXBPZmZzZXQgKCkge1xuICBsZXQgb2Zmc2V0ID0gMDtcblxuICAvLyBrZWVwIHRyYWNrIG9mIGltcGxpY2l0IHdhaXQsIGFuZCBzZXQgbG9jYWxseSB0byAwXG4gIGNvbnN0IGltcGxpY2l0V2FpdE1zID0gdGhpcy5pbXBsaWNpdFdhaXRNcztcbiAgdHJ5IHtcbiAgICB0aGlzLnNldEltcGxpY2l0V2FpdCgwKTtcblxuICAgIC8vIHRyeSB0byBzZWUgaWYgdGhlcmUgaXMgYW4gU21hcnQgQXBwIEJhbm5lclxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmZpbmROYXRpdmVFbGVtZW50T3JFbGVtZW50cygnYWNjZXNzaWJpbGl0eSBpZCcsICdDbG9zZSBhcHAgZG93bmxvYWQgb2ZmZXInLCBmYWxzZSk7XG4gICAgICBvZmZzZXQgKz0gYXdhaXQgdGhpcy5nZXRTYWZhcmlJc0lwaG9uZSgpID9cbiAgICAgICAgSVBIT05FX1dFQl9DT09SRF9TTUFSVF9BUFBfQkFOTkVSX09GRlNFVCA6XG4gICAgICAgIElQQURfV0VCX0NPT1JEX1NNQVJUX0FQUF9CQU5ORVJfT0ZGU0VUO1xuICAgIH0gY2F0Y2ggKGlnbikge1xuICAgICAgLy8gbm8gc21hcnQgYXBwIGJhbm5lciBmb3VuZCwgc28gY29udGludWVcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgLy8gcmV0dXJuIGltcGxpY2l0IHdhaXQgdG8gd2hhdCBpdCB3YXNcbiAgICB0aGlzLnNldEltcGxpY2l0V2FpdChpbXBsaWNpdFdhaXRNcyk7XG4gIH1cblxuICBsb2cuZGVidWcoYEFkZGl0aW9uYWwgbmF0aXZlIHdlYiB0YXAgb2Zmc2V0IGNvbXB1dGVkOiAke29mZnNldH1gKTtcbiAgcmV0dXJuIG9mZnNldDtcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIHRhcFdlYkVsZW1lbnROYXRpdmVseSAoZHJpdmVyLCBhdG9tc0VsZW1lbnQpIHtcbiAgLy8gdHJ5IHRvIGdldCB0aGUgdGV4dCBvZiB0aGUgZWxlbWVudCwgd2hpY2ggd2lsbCBiZSBhY2Nlc3NpYmxlIGluIHRoZVxuICAvLyBuYXRpdmUgY29udGV4dFxuICB0cnkge1xuICAgIGxldCB0ZXh0ID0gYXdhaXQgZHJpdmVyLmV4ZWN1dGVBdG9tKCdnZXRfdGV4dCcsIFthdG9tc0VsZW1lbnRdKTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIHRleHQgPSBhd2FpdCBkcml2ZXIuZXhlY3V0ZUF0b20oJ2dldF9hdHRyaWJ1dGVfdmFsdWUnLCBbYXRvbXNFbGVtZW50LCAndmFsdWUnXSk7XG4gICAgfVxuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIGNvbnN0IGVscyA9IGF3YWl0IGRyaXZlci5maW5kTmF0aXZlRWxlbWVudE9yRWxlbWVudHMoJ2FjY2Vzc2liaWxpdHkgaWQnLCB0ZXh0LCB0cnVlKTtcbiAgICAgIGlmIChlbHMubGVuZ3RoID09PSAxIHx8IGVscy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgY29uc3QgZWwgPSBlbHNbMF07XG4gICAgICAgIC8vIHVzZSB0YXAgYmVjYXVzZSBvbiBpT1MgMTEuMiBhbmQgYmVsb3cgYG5hdGl2ZUNsaWNrYCBjcmFzaGVzIFdEQVxuICAgICAgICBjb25zdCByZWN0ID0gYXdhaXQgZHJpdmVyLnByb3h5Q29tbWFuZChgL2VsZW1lbnQvJHt1dGlsLnVud3JhcEVsZW1lbnQoZWwpfS9yZWN0YCwgJ0dFVCcpO1xuICAgICAgICBpZiAoZWxzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgIGNvbnN0IGVsMiA9IGVsc1sxXTtcbiAgICAgICAgICBjb25zdCByZWN0MiA9IGF3YWl0IGRyaXZlci5wcm94eUNvbW1hbmQoYC9lbGVtZW50LyR7dXRpbC51bndyYXBFbGVtZW50KGVsMil9L3JlY3RgLCAnR0VUJyk7XG5cbiAgICAgICAgICBpZiAoKHJlY3QueCAhPT0gcmVjdDIueCB8fCByZWN0LnkgIT09IHJlY3QyLnkpIHx8XG4gICAgICAgICAgKHJlY3Qud2lkdGggIT09IHJlY3QyLndpZHRoIHx8IHJlY3QuaGVpZ2h0ICE9PSByZWN0Mi5oZWlnaHQpKSB7XG4gICAgICAgICAgICAvLyBUaGVzZSAyIG5hdGl2ZSBlbGVtZW50cyBhcmUgbm90IHJlZmVycmluZyB0byB0aGUgc2FtZSB3ZWIgZWxlbWVudFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb29yZHMgPSB7XG4gICAgICAgICAgeDogTWF0aC5yb3VuZChyZWN0LnggKyByZWN0LndpZHRoIC8gMiksXG4gICAgICAgICAgeTogTWF0aC5yb3VuZChyZWN0LnkgKyByZWN0LmhlaWdodCAvIDIpLFxuICAgICAgICB9O1xuICAgICAgICBhd2FpdCBkcml2ZXIuY2xpY2tDb29yZHMoY29vcmRzKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBhbnkgZmFpbHVyZSBzaG91bGQgZmFsbCB0aHJvdWdoIGFuZCB0cmlnZ2VyIHRoZSBtb3JlIGVsYWJvcmF0ZVxuICAgIC8vIG1ldGhvZCBvZiBjbGlja2luZ1xuICAgIGxvZy53YXJuKGBFcnJvciBhdHRlbXB0aW5nIHRvIGNsaWNrOiAke2Vyci5tZXNzYWdlfWApO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXh0ZW5zaW9ucy5uYXRpdmVXZWJUYXAgPSBhc3luYyBmdW5jdGlvbiBuYXRpdmVXZWJUYXAgKGVsKSB7XG4gIGNvbnN0IGF0b21zRWxlbWVudCA9IHRoaXMudXNlQXRvbXNFbGVtZW50KGVsKTtcblxuICBpZiAoYXdhaXQgdGFwV2ViRWxlbWVudE5hdGl2ZWx5KHRoaXMsIGF0b21zRWxlbWVudCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbG9nLndhcm4oJ1VuYWJsZSB0byBkbyBzaW1wbGUgbmF0aXZlIHdlYiB0YXAuIEF0dGVtcHRpbmcgdG8gY29udmVydCBjb29yZGluYXRlcycpO1xuXG4gIC8vIGBnZXRfdG9wX2xlZnRfY29vcmRpbmF0ZXNgIHJldHVybnMgdGhlIHdyb25nIHZhbHVlIHNvbWV0aW1lcyxcbiAgLy8gdW5sZXNzIHdlIHByZS1jYWxsIGJvdGggb2YgdGhlc2UgZnVuY3Rpb25zIGJlZm9yZSB0aGUgYWN0dWFsIGNhbGxzXG4gIGF3YWl0IHRoaXMuZXhlY3V0ZUF0b20oJ2dldF9zaXplJywgW2F0b21zRWxlbWVudF0pO1xuICBhd2FpdCB0aGlzLmV4ZWN1dGVBdG9tKCdnZXRfdG9wX2xlZnRfY29vcmRpbmF0ZXMnLCBbYXRvbXNFbGVtZW50XSk7XG5cbiAgY29uc3Qge3dpZHRoLCBoZWlnaHR9ID0gYXdhaXQgdGhpcy5leGVjdXRlQXRvbSgnZ2V0X3NpemUnLCBbYXRvbXNFbGVtZW50XSk7XG4gIGxldCB7eCwgeX0gPSBhd2FpdCB0aGlzLmV4ZWN1dGVBdG9tKCdnZXRfdG9wX2xlZnRfY29vcmRpbmF0ZXMnLCBbYXRvbXNFbGVtZW50XSk7XG4gIHggKz0gd2lkdGggLyAyO1xuICB5ICs9IGhlaWdodCAvIDI7XG5cbiAgdGhpcy5jdXJXZWJDb29yZHMgPSB7eCwgeX07XG4gIGF3YWl0IHRoaXMuY2xpY2tXZWJDb29yZHMoKTtcbn07XG5cbmV4dGVuc2lvbnMuY2xpY2tDb29yZHMgPSBhc3luYyBmdW5jdGlvbiBjbGlja0Nvb3JkcyAoY29vcmRzKSB7XG4gIGF3YWl0IHRoaXMucGVyZm9ybVRvdWNoKFtcbiAgICB7XG4gICAgICBhY3Rpb246ICd0YXAnLFxuICAgICAgb3B0aW9uczogY29vcmRzLFxuICAgIH0sXG4gIF0pO1xufTtcblxuZXh0ZW5zaW9ucy50cmFuc2xhdGVXZWJDb29yZHMgPSBhc3luYyBmdW5jdGlvbiB0cmFuc2xhdGVXZWJDb29yZHMgKGNvb3Jkcykge1xuICBsb2cuZGVidWcoYFRyYW5zbGF0aW5nIGNvb3JkaW5hdGVzICgke0pTT04uc3RyaW5naWZ5KGNvb3Jkcyl9KSB0byB3ZWIgY29vcmRpbmF0ZXNgKTtcblxuICAvLyBhYnNvbHV0aXplIHdlYiBjb29yZHNcbiAgY29uc3QgaW1wbGljaXRXYWl0TXMgPSB0aGlzLmltcGxpY2l0V2FpdE1zO1xuICBsZXQgd2VidmlldztcbiAgdHJ5IHtcbiAgICB0aGlzLnNldEltcGxpY2l0V2FpdCgwKTtcbiAgICB3ZWJ2aWV3ID0gYXdhaXQgcmV0cnlJbnRlcnZhbCg1LCAxMDAsIGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmZpbmROYXRpdmVFbGVtZW50T3JFbGVtZW50cygnY2xhc3MgbmFtZScsICdYQ1VJRWxlbWVudFR5cGVXZWJWaWV3JywgZmFsc2UpO1xuICAgIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIHRoaXMuc2V0SW1wbGljaXRXYWl0KGltcGxpY2l0V2FpdE1zKTtcbiAgfVxuXG4gIHdlYnZpZXcgPSB1dGlsLnVud3JhcEVsZW1lbnQod2Vidmlldyk7XG4gIGNvbnN0IHJlY3QgPSBhd2FpdCB0aGlzLnByb3h5Q29tbWFuZChgL2VsZW1lbnQvJHt3ZWJ2aWV3fS9yZWN0YCwgJ0dFVCcpO1xuICBjb25zdCB3dlBvcyA9IHt4OiByZWN0LngsIHk6IHJlY3QueX07XG4gIGNvbnN0IHJlYWxEaW1zID0ge3c6IHJlY3Qud2lkdGgsIGg6IHJlY3QuaGVpZ2h0fTtcblxuICBjb25zdCBjbWQgPSAnKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHt3OiB3aW5kb3cuaW5uZXJXaWR0aCwgaDogd2luZG93LmlubmVySGVpZ2h0fTsgfSkoKSc7XG4gIGNvbnN0IHd2RGltcyA9IGF3YWl0IHRoaXMucmVtb3RlLmV4ZWN1dGUoY21kKTtcblxuICBhd2FpdCB0aGlzLmdldEV4dHJhVHJhbnNsYXRlV2ViQ29vcmRzT2Zmc2V0KHd2UG9zLCByZWFsRGltcyk7XG5cbiAgaWYgKHd2RGltcyAmJiByZWFsRGltcyAmJiB3dlBvcykge1xuICAgIGxldCB4UmF0aW8gPSByZWFsRGltcy53IC8gd3ZEaW1zLnc7XG4gICAgbGV0IHlSYXRpbyA9IHJlYWxEaW1zLmggLyB3dkRpbXMuaDtcbiAgICBsZXQgbmV3Q29vcmRzID0ge1xuICAgICAgeDogd3ZQb3MueCArIE1hdGgucm91bmQoeFJhdGlvICogY29vcmRzLngpLFxuICAgICAgeTogd3ZQb3MueSArIE1hdGgucm91bmQoeVJhdGlvICogY29vcmRzLnkpLFxuICAgIH07XG5cbiAgICAvLyBhZGRpdGlvbmFsIGxvZ2dpbmcgZm9yIGNvb3JkaW5hdGVzLCBzaW5jZSBpdCBpcyBzb21ldGltZXMgYnJva2VuXG4gICAgLy8gICBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vaXNzdWVzLzkxNTlcbiAgICBsb2cuZGVidWcoYENvbnZlcnRlZCBjb29yZGluYXRlczogJHtKU09OLnN0cmluZ2lmeShuZXdDb29yZHMpfWApO1xuICAgIGxvZy5kZWJ1ZyhgICAgIHJlY3Q6ICR7SlNPTi5zdHJpbmdpZnkocmVjdCl9YCk7XG4gICAgbG9nLmRlYnVnKGAgICAgd3ZQb3M6ICR7SlNPTi5zdHJpbmdpZnkod3ZQb3MpfWApO1xuICAgIGxvZy5kZWJ1ZyhgICAgIHJlYWxEaW1zOiAke0pTT04uc3RyaW5naWZ5KHJlYWxEaW1zKX1gKTtcbiAgICBsb2cuZGVidWcoYCAgICB3dkRpbXM6ICR7SlNPTi5zdHJpbmdpZnkod3ZEaW1zKX1gKTtcbiAgICBsb2cuZGVidWcoYCAgICB4UmF0aW86ICR7SlNPTi5zdHJpbmdpZnkoeFJhdGlvKX1gKTtcbiAgICBsb2cuZGVidWcoYCAgICB5UmF0aW86ICR7SlNPTi5zdHJpbmdpZnkoeVJhdGlvKX1gKTtcblxuICAgIGxvZy5kZWJ1ZyhgQ29udmVydGVkIHdlYiBjb29yZHMgJHtKU09OLnN0cmluZ2lmeShjb29yZHMpfSBgICtcbiAgICAgICAgICAgICAgYGludG8gcmVhbCBjb29yZHMgJHtKU09OLnN0cmluZ2lmeShuZXdDb29yZHMpfWApO1xuICAgIHJldHVybiBuZXdDb29yZHM7XG4gIH1cbn07XG5cbmV4dGVuc2lvbnMuY2hlY2tGb3JBbGVydCA9IGFzeW5jIGZ1bmN0aW9uIGNoZWNrRm9yQWxlcnQgKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHJlcXVpcmUtYXdhaXRcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZXh0ZW5zaW9ucy53YWl0Rm9yQXRvbSA9IGFzeW5jIGZ1bmN0aW9uIHdhaXRGb3JBdG9tIChwcm9taXNlKSB7XG4gIGNvbnN0IHN0YXJ0ZWQgPSBwcm9jZXNzLmhydGltZSgpO1xuICB0cnkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlRXhlY3V0ZVJlc3BvbnNlKGF3YWl0IEIucmVzb2x2ZShwcm9taXNlKVxuICAgICAgLnRpbWVvdXQoQVRPTV9XQUlUX1RJTUVPVVQpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEIuVGltZW91dEVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZ2V0IGFueSByZXNwb25zZSBhZnRlciAke3Byb2Nlc3MuaHJ0aW1lKHN0YXJ0ZWQpWzBdfXNgKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBleHRlbnNpb25zO1xuIl0sImZpbGUiOiJsaWIvY29tbWFuZHMvd2ViLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
