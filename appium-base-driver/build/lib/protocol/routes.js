"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routeToCommandName = routeToCommandName;
exports.NO_SESSION_ID_COMMANDS = exports.ALL_COMMANDS = exports.METHOD_MAP = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _driver = _interopRequireDefault(require("../basedriver/driver"));

var _appiumSupport = require("appium-support");

const METHOD_MAP = {
  '/wd/hub/status': {
    GET: {
      command: 'getStatus'
    }
  },
  '/wd/hub/session': {
    POST: {
      command: 'createSession',
      payloadParams: {
        validate: jsonObj => !jsonObj.capabilities && !jsonObj.desiredCapabilities && 'we require one of "desiredCapabilities" or "capabilities" object',
        optional: ['desiredCapabilities', 'requiredCapabilities', 'capabilities']
      }
    }
  },
  '/wd/hub/sessions': {
    GET: {
      command: 'getSessions'
    }
  },
  '/wd/hub/session/:sessionId': {
    GET: {
      command: 'getSession'
    },
    DELETE: {
      command: 'deleteSession'
    }
  },
  '/wd/hub/session/:sessionId/timeouts': {
    GET: {
      command: 'getTimeouts'
    },
    POST: {
      command: 'timeouts',
      payloadParams: {
        validate: (jsonObj, protocolName) => {
          if (protocolName === _driver.default.DRIVER_PROTOCOL.W3C) {
            if (!_appiumSupport.util.hasValue(jsonObj.script) && !_appiumSupport.util.hasValue(jsonObj.pageLoad) && !_appiumSupport.util.hasValue(jsonObj.implicit)) {
              return 'W3C protocol expects any of script, pageLoad or implicit to be set';
            }
          } else {
            if (!_appiumSupport.util.hasValue(jsonObj.type) || !_appiumSupport.util.hasValue(jsonObj.ms)) {
              return 'MJSONWP protocol requires type and ms';
            }
          }
        },
        optional: ['type', 'ms', 'script', 'pageLoad', 'implicit']
      }
    }
  },
  '/wd/hub/session/:sessionId/timeouts/async_script': {
    POST: {
      command: 'asyncScriptTimeout',
      payloadParams: {
        required: ['ms']
      }
    }
  },
  '/wd/hub/session/:sessionId/timeouts/implicit_wait': {
    POST: {
      command: 'implicitWait',
      payloadParams: {
        required: ['ms']
      }
    }
  },
  '/wd/hub/session/:sessionId/window_handle': {
    GET: {
      command: 'getWindowHandle'
    }
  },
  '/wd/hub/session/:sessionId/window/handle': {
    GET: {
      command: 'getWindowHandle'
    }
  },
  '/wd/hub/session/:sessionId/window_handles': {
    GET: {
      command: 'getWindowHandles'
    }
  },
  '/wd/hub/session/:sessionId/window/handles': {
    GET: {
      command: 'getWindowHandles'
    }
  },
  '/wd/hub/session/:sessionId/url': {
    GET: {
      command: 'getUrl'
    },
    POST: {
      command: 'setUrl',
      payloadParams: {
        required: ['url']
      }
    }
  },
  '/wd/hub/session/:sessionId/forward': {
    POST: {
      command: 'forward'
    }
  },
  '/wd/hub/session/:sessionId/back': {
    POST: {
      command: 'back'
    }
  },
  '/wd/hub/session/:sessionId/refresh': {
    POST: {
      command: 'refresh'
    }
  },
  '/wd/hub/session/:sessionId/execute': {
    POST: {
      command: 'execute',
      payloadParams: {
        required: ['script', 'args']
      }
    }
  },
  '/wd/hub/session/:sessionId/execute_async': {
    POST: {
      command: 'executeAsync',
      payloadParams: {
        required: ['script', 'args']
      }
    }
  },
  '/wd/hub/session/:sessionId/screenshot': {
    GET: {
      command: 'getScreenshot'
    }
  },
  '/wd/hub/session/:sessionId/ime/available_engines': {
    GET: {
      command: 'availableIMEEngines'
    }
  },
  '/wd/hub/session/:sessionId/ime/active_engine': {
    GET: {
      command: 'getActiveIMEEngine'
    }
  },
  '/wd/hub/session/:sessionId/ime/activated': {
    GET: {
      command: 'isIMEActivated'
    }
  },
  '/wd/hub/session/:sessionId/ime/deactivate': {
    POST: {
      command: 'deactivateIMEEngine'
    }
  },
  '/wd/hub/session/:sessionId/ime/activate': {
    POST: {
      command: 'activateIMEEngine',
      payloadParams: {
        required: ['engine']
      }
    }
  },
  '/wd/hub/session/:sessionId/frame': {
    POST: {
      command: 'setFrame',
      payloadParams: {
        required: ['id']
      }
    }
  },
  '/wd/hub/session/:sessionId/frame/parent': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/window': {
    GET: {
      command: 'getWindowHandle'
    },
    POST: {
      command: 'setWindow',
      payloadParams: {
        optional: ['name', 'handle'],
        makeArgs: jsonObj => {
          if (_appiumSupport.util.hasValue(jsonObj.handle) && !_appiumSupport.util.hasValue(jsonObj.name)) {
            return [jsonObj.handle, jsonObj.handle];
          }

          if (_appiumSupport.util.hasValue(jsonObj.name) && !_appiumSupport.util.hasValue(jsonObj.handle)) {
            return [jsonObj.name, jsonObj.name];
          }

          return [jsonObj.name, jsonObj.handle];
        },
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.name) && !_appiumSupport.util.hasValue(jsonObj.handle) && 'we require one of "name" or "handle" to be set'
      }
    },
    DELETE: {
      command: 'closeWindow'
    }
  },
  '/wd/hub/session/:sessionId/window/:windowhandle/size': {
    GET: {
      command: 'getWindowSize'
    },
    POST: {}
  },
  '/wd/hub/session/:sessionId/window/:windowhandle/position': {
    POST: {},
    GET: {}
  },
  '/wd/hub/session/:sessionId/window/:windowhandle/maximize': {
    POST: {
      command: 'maximizeWindow'
    }
  },
  '/wd/hub/session/:sessionId/cookie': {
    GET: {
      command: 'getCookies'
    },
    POST: {
      command: 'setCookie',
      payloadParams: {
        required: ['cookie']
      }
    },
    DELETE: {
      command: 'deleteCookies'
    }
  },
  '/wd/hub/session/:sessionId/cookie/:name': {
    GET: {
      command: 'getCookie'
    },
    DELETE: {
      command: 'deleteCookie'
    }
  },
  '/wd/hub/session/:sessionId/source': {
    GET: {
      command: 'getPageSource'
    }
  },
  '/wd/hub/session/:sessionId/title': {
    GET: {
      command: 'title'
    }
  },
  '/wd/hub/session/:sessionId/element': {
    POST: {
      command: 'findElement',
      payloadParams: {
        required: ['using', 'value']
      }
    }
  },
  '/wd/hub/session/:sessionId/elements': {
    POST: {
      command: 'findElements',
      payloadParams: {
        required: ['using', 'value']
      }
    }
  },
  '/wd/hub/session/:sessionId/element/active': {
    GET: {
      command: 'active'
    },
    POST: {
      command: 'active'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId': {
    GET: {}
  },
  '/wd/hub/session/:sessionId/element/:elementId/element': {
    POST: {
      command: 'findElementFromElement',
      payloadParams: {
        required: ['using', 'value']
      }
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/elements': {
    POST: {
      command: 'findElementsFromElement',
      payloadParams: {
        required: ['using', 'value']
      }
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/click': {
    POST: {
      command: 'click'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/submit': {
    POST: {
      command: 'submit'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/text': {
    GET: {
      command: 'getText'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/value': {
    POST: {
      command: 'setValue',
      payloadParams: {
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.value) && !_appiumSupport.util.hasValue(jsonObj.text) && 'we require one of "text" or "value" params',
        optional: ['value', 'text'],
        makeArgs: jsonObj => [jsonObj.value || jsonObj.text]
      }
    }
  },
  '/wd/hub/session/:sessionId/keys': {
    POST: {
      command: 'keys',
      payloadParams: {
        required: ['value']
      }
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/name': {
    GET: {
      command: 'getName'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/clear': {
    POST: {
      command: 'clear'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/selected': {
    GET: {
      command: 'elementSelected'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/enabled': {
    GET: {
      command: 'elementEnabled'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/attribute/:name': {
    GET: {
      command: 'getAttribute'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/equals/:otherId': {
    GET: {
      command: 'equalsElement'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/displayed': {
    GET: {
      command: 'elementDisplayed'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/location': {
    GET: {
      command: 'getLocation'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/location_in_view': {
    GET: {
      command: 'getLocationInView'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/size': {
    GET: {
      command: 'getSize'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/css/:propertyName': {
    GET: {
      command: 'getCssProperty'
    }
  },
  '/wd/hub/session/:sessionId/orientation': {
    GET: {
      command: 'getOrientation'
    },
    POST: {
      command: 'setOrientation',
      payloadParams: {
        required: ['orientation']
      }
    }
  },
  '/wd/hub/session/:sessionId/rotation': {
    GET: {
      command: 'getRotation'
    },
    POST: {
      command: 'setRotation',
      payloadParams: {
        required: ['x', 'y', 'z']
      }
    }
  },
  '/wd/hub/session/:sessionId/moveto': {
    POST: {
      command: 'moveTo',
      payloadParams: {
        optional: ['element', 'xoffset', 'yoffset']
      }
    }
  },
  '/wd/hub/session/:sessionId/click': {
    POST: {
      command: 'clickCurrent',
      payloadParams: {
        optional: ['button']
      }
    }
  },
  '/wd/hub/session/:sessionId/buttondown': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/buttonup': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/doubleclick': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/touch/click': {
    POST: {
      command: 'click',
      payloadParams: {
        required: ['element']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/down': {
    POST: {
      command: 'touchDown',
      payloadParams: {
        required: ['x', 'y']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/up': {
    POST: {
      command: 'touchUp',
      payloadParams: {
        required: ['x', 'y']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/move': {
    POST: {
      command: 'touchMove',
      payloadParams: {
        required: ['x', 'y']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/scroll': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/touch/doubleclick': {
    POST: {}
  },
  '/wd/hub/session/:sessionId/actions': {
    POST: {
      command: 'performActions',
      payloadParams: {
        required: ['actions']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/longclick': {
    POST: {
      command: 'touchLongClick',
      payloadParams: {
        required: ['elements']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/flick': {
    POST: {
      command: 'flick',
      payloadParams: {
        optional: ['element', 'xspeed', 'yspeed', 'xoffset', 'yoffset', 'speed']
      }
    }
  },
  '/wd/hub/session/:sessionId/location': {
    GET: {
      command: 'getGeoLocation'
    },
    POST: {
      command: 'setGeoLocation',
      payloadParams: {
        required: ['location']
      }
    }
  },
  '/wd/hub/session/:sessionId/local_storage': {
    GET: {},
    POST: {},
    DELETE: {}
  },
  '/wd/hub/session/:sessionId/local_storage/key/:key': {
    GET: {},
    DELETE: {}
  },
  '/wd/hub/session/:sessionId/local_storage/size': {
    GET: {}
  },
  '/wd/hub/session/:sessionId/session_storage': {
    GET: {},
    POST: {},
    DELETE: {}
  },
  '/wd/hub/session/:sessionId/session_storage/key/:key': {
    GET: {},
    DELETE: {}
  },
  '/wd/hub/session/:sessionId/session_storage/size': {
    GET: {}
  },
  '/wd/hub/session/:sessionId/log': {
    POST: {
      command: 'getLog',
      payloadParams: {
        required: ['type']
      }
    }
  },
  '/wd/hub/session/:sessionId/log/types': {
    GET: {
      command: 'getLogTypes'
    }
  },
  '/wd/hub/session/:sessionId/application_cache/status': {
    GET: {}
  },
  '/wd/hub/session/:sessionId/context': {
    GET: {
      command: 'getCurrentContext'
    },
    POST: {
      command: 'setContext',
      payloadParams: {
        required: ['name']
      }
    }
  },
  '/wd/hub/session/:sessionId/contexts': {
    GET: {
      command: 'getContexts'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/pageIndex': {
    GET: {
      command: 'getPageIndex'
    }
  },
  '/wd/hub/session/:sessionId/network_connection': {
    GET: {
      command: 'getNetworkConnection'
    },
    POST: {
      command: 'setNetworkConnection',
      payloadParams: {
        unwrap: 'parameters',
        required: ['type']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/perform': {
    POST: {
      command: 'performTouch',
      payloadParams: {
        wrap: 'actions',
        required: ['actions']
      }
    }
  },
  '/wd/hub/session/:sessionId/touch/multi/perform': {
    POST: {
      command: 'performMultiAction',
      payloadParams: {
        required: ['actions'],
        optional: ['elementId']
      }
    }
  },
  '/wd/hub/session/:sessionId/receive_async_response': {
    POST: {
      command: 'receiveAsyncResponse',
      payloadParams: {
        required: ['status', 'value']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/shake': {
    POST: {
      command: 'mobileShake'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/system_time': {
    GET: {
      command: 'getDeviceTime',
      payloadParams: {
        optional: ['format']
      }
    },
    POST: {
      command: 'getDeviceTime',
      payloadParams: {
        optional: ['format']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/lock': {
    POST: {
      command: 'lock',
      payloadParams: {
        optional: ['seconds']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/unlock': {
    POST: {
      command: 'unlock'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/is_locked': {
    POST: {
      command: 'isLocked'
    }
  },
  '/wd/hub/session/:sessionId/appium/start_recording_screen': {
    POST: {
      command: 'startRecordingScreen',
      payloadParams: {
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/stop_recording_screen': {
    POST: {
      command: 'stopRecordingScreen',
      payloadParams: {
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/performanceData/types': {
    POST: {
      command: 'getPerformanceDataTypes'
    }
  },
  '/wd/hub/session/:sessionId/appium/getPerformanceData': {
    POST: {
      command: 'getPerformanceData',
      payloadParams: {
        required: ['packageName', 'dataType'],
        optional: ['dataReadTimeout']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/press_keycode': {
    POST: {
      command: 'pressKeyCode',
      payloadParams: {
        required: ['keycode'],
        optional: ['metastate', 'flags']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/long_press_keycode': {
    POST: {
      command: 'longPressKeyCode',
      payloadParams: {
        required: ['keycode'],
        optional: ['metastate', 'flags']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/finger_print': {
    POST: {
      command: 'fingerprint',
      payloadParams: {
        required: ['fingerprintId']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/send_sms': {
    POST: {
      command: 'sendSMS',
      payloadParams: {
        required: ['phoneNumber', 'message']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/gsm_call': {
    POST: {
      command: 'gsmCall',
      payloadParams: {
        required: ['phoneNumber', 'action']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/gsm_signal': {
    POST: {
      command: 'gsmSignal',
      payloadParams: {
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.signalStrength) && !_appiumSupport.util.hasValue(jsonObj.signalStrengh) && 'we require one of "signalStrength" or "signalStrengh" params',
        optional: ['signalStrength', 'signalStrengh'],
        makeArgs: jsonObj => [_appiumSupport.util.hasValue(jsonObj.signalStrength) ? jsonObj.signalStrength : jsonObj.signalStrengh]
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/gsm_voice': {
    POST: {
      command: 'gsmVoice',
      payloadParams: {
        required: ['state']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/power_capacity': {
    POST: {
      command: 'powerCapacity',
      payloadParams: {
        required: ['percent']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/power_ac': {
    POST: {
      command: 'powerAC',
      payloadParams: {
        required: ['state']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/network_speed': {
    POST: {
      command: 'networkSpeed',
      payloadParams: {
        required: ['netspeed']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/keyevent': {
    POST: {
      command: 'keyevent',
      payloadParams: {
        required: ['keycode'],
        optional: ['metastate']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/rotate': {
    POST: {
      command: 'mobileRotation',
      payloadParams: {
        required: ['x', 'y', 'radius', 'rotation', 'touchCount', 'duration'],
        optional: ['element']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/current_activity': {
    GET: {
      command: 'getCurrentActivity'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/current_package': {
    GET: {
      command: 'getCurrentPackage'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/install_app': {
    POST: {
      command: 'installApp',
      payloadParams: {
        required: ['appPath'],
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/activate_app': {
    POST: {
      command: 'activateApp',
      payloadParams: {
        required: [['appId'], ['bundleId']],
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/remove_app': {
    POST: {
      command: 'removeApp',
      payloadParams: {
        required: [['appId'], ['bundleId']],
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/terminate_app': {
    POST: {
      command: 'terminateApp',
      payloadParams: {
        required: [['appId'], ['bundleId']],
        optional: ['options']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/app_installed': {
    POST: {
      command: 'isAppInstalled',
      payloadParams: {
        required: [['appId'], ['bundleId']]
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/app_state': {
    GET: {
      command: 'queryAppState',
      payloadParams: {
        required: [['appId'], ['bundleId']]
      }
    },
    POST: {
      command: 'queryAppState',
      payloadParams: {
        required: [['appId'], ['bundleId']]
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/hide_keyboard': {
    POST: {
      command: 'hideKeyboard',
      payloadParams: {
        optional: ['strategy', 'key', 'keyCode', 'keyName']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/is_keyboard_shown': {
    GET: {
      command: 'isKeyboardShown'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/push_file': {
    POST: {
      command: 'pushFile',
      payloadParams: {
        required: ['path', 'data']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/pull_file': {
    POST: {
      command: 'pullFile',
      payloadParams: {
        required: ['path']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/pull_folder': {
    POST: {
      command: 'pullFolder',
      payloadParams: {
        required: ['path']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/toggle_airplane_mode': {
    POST: {
      command: 'toggleFlightMode'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/toggle_data': {
    POST: {
      command: 'toggleData'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/toggle_wifi': {
    POST: {
      command: 'toggleWiFi'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/toggle_location_services': {
    POST: {
      command: 'toggleLocationServices'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/open_notifications': {
    POST: {
      command: 'openNotifications'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/start_activity': {
    POST: {
      command: 'startActivity',
      payloadParams: {
        required: ['appPackage', 'appActivity'],
        optional: ['appWaitPackage', 'appWaitActivity', 'intentAction', 'intentCategory', 'intentFlags', 'optionalIntentArguments', 'dontStopAppOnReset']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/system_bars': {
    GET: {
      command: 'getSystemBars'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/display_density': {
    GET: {
      command: 'getDisplayDensity'
    }
  },
  '/wd/hub/session/:sessionId/appium/simulator/touch_id': {
    POST: {
      command: 'touchId',
      payloadParams: {
        required: ['match']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/simulator/toggle_touch_id_enrollment': {
    POST: {
      command: 'toggleEnrollTouchId',
      payloadParams: {
        optional: ['enabled']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/app/launch': {
    POST: {
      command: 'launchApp'
    }
  },
  '/wd/hub/session/:sessionId/appium/app/close': {
    POST: {
      command: 'closeApp'
    }
  },
  '/wd/hub/session/:sessionId/appium/app/reset': {
    POST: {
      command: 'reset'
    }
  },
  '/wd/hub/session/:sessionId/appium/app/background': {
    POST: {
      command: 'background',
      payloadParams: {
        required: ['seconds']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/app/end_test_coverage': {
    POST: {
      command: 'endCoverage',
      payloadParams: {
        required: ['intent', 'path']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/app/strings': {
    POST: {
      command: 'getStrings',
      payloadParams: {
        optional: ['language', 'stringFile']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/element/:elementId/value': {
    POST: {
      command: 'setValueImmediate',
      payloadParams: {
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.value) && !_appiumSupport.util.hasValue(jsonObj.text) && 'we require one of "text" or "value" params',
        optional: ['value', 'text'],
        makeArgs: jsonObj => [jsonObj.value || jsonObj.text]
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/element/:elementId/replace_value': {
    POST: {
      command: 'replaceValue',
      payloadParams: {
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.value) && !_appiumSupport.util.hasValue(jsonObj.text) && 'we require one of "text" or "value" params',
        optional: ['value', 'text'],
        makeArgs: jsonObj => [jsonObj.value || jsonObj.text]
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/settings': {
    POST: {
      command: 'updateSettings',
      payloadParams: {
        required: ['settings']
      }
    },
    GET: {
      command: 'getSettings'
    }
  },
  '/wd/hub/session/:sessionId/appium/receive_async_response': {
    POST: {
      command: 'receiveAsyncResponse',
      payloadParams: {
        required: ['response']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/execute_driver': {
    POST: {
      command: 'executeDriverScript',
      payloadParams: {
        required: ['script'],
        optional: ['type', 'timeout']
      }
    }
  },
  '/wd/hub/session/:sessionId/alert_text': {
    GET: {
      command: 'getAlertText'
    },
    POST: {
      command: 'setAlertText',
      payloadParams: {
        required: ['text']
      }
    }
  },
  '/wd/hub/session/:sessionId/accept_alert': {
    POST: {
      command: 'postAcceptAlert'
    }
  },
  '/wd/hub/session/:sessionId/dismiss_alert': {
    POST: {
      command: 'postDismissAlert'
    }
  },
  '/wd/hub/session/:sessionId/alert/text': {
    GET: {
      command: 'getAlertText'
    },
    POST: {
      command: 'setAlertText',
      payloadParams: {
        validate: jsonObj => !_appiumSupport.util.hasValue(jsonObj.value) && !_appiumSupport.util.hasValue(jsonObj.text) && 'either "text" or "value" must be set',
        optional: ['value', 'text'],
        makeArgs: jsonObj => [jsonObj.value || jsonObj.text]
      }
    }
  },
  '/wd/hub/session/:sessionId/alert/accept': {
    POST: {
      command: 'postAcceptAlert'
    }
  },
  '/wd/hub/session/:sessionId/alert/dismiss': {
    POST: {
      command: 'postDismissAlert'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/rect': {
    GET: {
      command: 'getElementRect'
    }
  },
  '/wd/hub/session/:sessionId/execute/sync': {
    POST: {
      command: 'execute',
      payloadParams: {
        required: ['script', 'args']
      }
    }
  },
  '/wd/hub/session/:sessionId/execute/async': {
    POST: {
      command: 'executeAsync',
      payloadParams: {
        required: ['script', 'args']
      }
    }
  },
  '/wd/hub/session/:sessionId/screenshot/:elementId': {
    GET: {
      command: 'getElementScreenshot'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/screenshot': {
    GET: {
      command: 'getElementScreenshot'
    }
  },
  '/wd/hub/session/:sessionId/window/rect': {
    GET: {
      command: 'getWindowRect'
    },
    POST: {
      command: 'setWindowRect'
    }
  },
  '/wd/hub/session/:sessionId/window/maximize': {
    POST: {
      command: 'maximizeWindow'
    }
  },
  '/wd/hub/session/:sessionId/window/minimize': {
    POST: {
      command: 'minimizeWindow'
    }
  },
  '/wd/hub/session/:sessionId/window/fullscreen': {
    POST: {
      command: 'fullScreenWindow'
    }
  },
  '/wd/hub/session/:sessionId/element/:elementId/property/:name': {
    GET: {
      command: 'getProperty'
    }
  },
  '/wd/hub/session/:sessionId/appium/device/set_clipboard': {
    POST: {
      command: 'setClipboard',
      payloadParams: {
        required: ['content'],
        optional: ['contentType', 'label']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/device/get_clipboard': {
    POST: {
      command: 'getClipboard',
      payloadParams: {
        optional: ['contentType']
      }
    }
  },
  '/wd/hub/session/:sessionId/appium/compare_images': {
    POST: {
      command: 'compareImages',
      payloadParams: {
        required: ['mode', 'firstImage', 'secondImage'],
        optional: ['options']
      }
    }
  }
};
exports.METHOD_MAP = METHOD_MAP;
let ALL_COMMANDS = [];
exports.ALL_COMMANDS = ALL_COMMANDS;

for (let v of _lodash.default.values(METHOD_MAP)) {
  for (let m of _lodash.default.values(v)) {
    if (m.command) {
      ALL_COMMANDS.push(m.command);
    }
  }
}

const RE_ESCAPE = /[-[\]{}()+?.,\\^$|#\s]/g;
const RE_PARAM = /([:*])(\w+)/g;

class Route {
  constructor(route) {
    this.paramNames = [];
    let reStr = route.replace(RE_ESCAPE, '\\$&');
    reStr = reStr.replace(RE_PARAM, (_, mode, name) => {
      this.paramNames.push(name);
      return mode === ':' ? '([^/]*)' : '(.*)';
    });
    this.routeRegexp = new RegExp(`^${reStr}$`);
  }

  parse(url) {
    let matches = url.match(this.routeRegexp);
    if (!matches) return;
    let i = 0;
    let params = {};

    while (i < this.paramNames.length) {
      const paramName = this.paramNames[i++];
      params[paramName] = matches[i];
    }

    return params;
  }

}

function routeToCommandName(endpoint, method) {
  let dstRoute = null;

  if (endpoint.includes('?')) {
    endpoint = endpoint.slice(0, endpoint.indexOf('?'));
  }

  const actualEndpoint = endpoint === '/' ? '' : _lodash.default.startsWith(endpoint, '/') ? endpoint : `/${endpoint}`;

  for (let currentRoute of _lodash.default.keys(METHOD_MAP)) {
    const route = new Route(currentRoute);

    if (route.parse(`/wd/hub/session/ignored-session-id${actualEndpoint}`) || route.parse(`/wd/hub${actualEndpoint}`) || route.parse(actualEndpoint)) {
      dstRoute = currentRoute;
      break;
    }
  }

  if (!dstRoute) return;

  const methods = _lodash.default.get(METHOD_MAP, dstRoute);

  method = _lodash.default.toUpper(method);

  if (_lodash.default.has(methods, method)) {
    const dstMethod = _lodash.default.get(methods, method);

    if (dstMethod.command) {
      return dstMethod.command;
    }
  }
}

const NO_SESSION_ID_COMMANDS = ['createSession', 'getStatus', 'getSessions'];
exports.NO_SESSION_ID_COMMANDS = NO_SESSION_ID_COMMANDS;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wcm90b2NvbC9yb3V0ZXMuanMiXSwibmFtZXMiOlsiTUVUSE9EX01BUCIsIkdFVCIsImNvbW1hbmQiLCJQT1NUIiwicGF5bG9hZFBhcmFtcyIsInZhbGlkYXRlIiwianNvbk9iaiIsImNhcGFiaWxpdGllcyIsImRlc2lyZWRDYXBhYmlsaXRpZXMiLCJvcHRpb25hbCIsIkRFTEVURSIsInByb3RvY29sTmFtZSIsIkJhc2VEcml2ZXIiLCJEUklWRVJfUFJPVE9DT0wiLCJXM0MiLCJ1dGlsIiwiaGFzVmFsdWUiLCJzY3JpcHQiLCJwYWdlTG9hZCIsImltcGxpY2l0IiwidHlwZSIsIm1zIiwicmVxdWlyZWQiLCJtYWtlQXJncyIsImhhbmRsZSIsIm5hbWUiLCJ2YWx1ZSIsInRleHQiLCJ1bndyYXAiLCJ3cmFwIiwic2lnbmFsU3RyZW5ndGgiLCJzaWduYWxTdHJlbmdoIiwiQUxMX0NPTU1BTkRTIiwidiIsIl8iLCJ2YWx1ZXMiLCJtIiwicHVzaCIsIlJFX0VTQ0FQRSIsIlJFX1BBUkFNIiwiUm91dGUiLCJjb25zdHJ1Y3RvciIsInJvdXRlIiwicGFyYW1OYW1lcyIsInJlU3RyIiwicmVwbGFjZSIsIm1vZGUiLCJyb3V0ZVJlZ2V4cCIsIlJlZ0V4cCIsInBhcnNlIiwidXJsIiwibWF0Y2hlcyIsIm1hdGNoIiwiaSIsInBhcmFtcyIsImxlbmd0aCIsInBhcmFtTmFtZSIsInJvdXRlVG9Db21tYW5kTmFtZSIsImVuZHBvaW50IiwibWV0aG9kIiwiZHN0Um91dGUiLCJpbmNsdWRlcyIsInNsaWNlIiwiaW5kZXhPZiIsImFjdHVhbEVuZHBvaW50Iiwic3RhcnRzV2l0aCIsImN1cnJlbnRSb3V0ZSIsImtleXMiLCJtZXRob2RzIiwiZ2V0IiwidG9VcHBlciIsImhhcyIsImRzdE1ldGhvZCIsIk5PX1NFU1NJT05fSURfQ09NTUFORFMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQU1BLE1BQU1BLFVBQVUsR0FBRztBQUNqQixv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MEMsSUFBR0EsUUFBUyxFQUR6RDs7QUFHQSxPQUFLLElBQUlRLFlBQVQsSUFBeUJoQyxnQkFBRWlDLElBQUYsQ0FBT25FLFVBQVAsQ0FBekIsRUFBNkM7QUFDM0MsVUFBTTBDLEtBQUssR0FBRyxJQUFJRixLQUFKLENBQVUwQixZQUFWLENBQWQ7O0FBRUEsUUFBSXhCLEtBQUssQ0FBQ08sS0FBTixDQUFhLHFDQUFvQ2UsY0FBZSxFQUFoRSxLQUNBdEIsS0FBSyxDQUFDTyxLQUFOLENBQWEsVUFBU2UsY0FBZSxFQUFyQyxDQURBLElBQzJDdEIsS0FBSyxDQUFDTyxLQUFOLENBQVllLGNBQVosQ0FEL0MsRUFDNEU7QUFDMUVKLE1BQUFBLFFBQVEsR0FBR00sWUFBWDtBQUNBO0FBQ0Q7QUFDRjs7QUFDRCxNQUFJLENBQUNOLFFBQUwsRUFBZTs7QUFFZixRQUFNUSxPQUFPLEdBQUdsQyxnQkFBRW1DLEdBQUYsQ0FBTXJFLFVBQU4sRUFBa0I0RCxRQUFsQixDQUFoQjs7QUFDQUQsRUFBQUEsTUFBTSxHQUFHekIsZ0JBQUVvQyxPQUFGLENBQVVYLE1BQVYsQ0FBVDs7QUFDQSxNQUFJekIsZ0JBQUVxQyxHQUFGLENBQU1ILE9BQU4sRUFBZVQsTUFBZixDQUFKLEVBQTRCO0FBQzFCLFVBQU1hLFNBQVMsR0FBR3RDLGdCQUFFbUMsR0FBRixDQUFNRCxPQUFOLEVBQWVULE1BQWYsQ0FBbEI7O0FBQ0EsUUFBSWEsU0FBUyxDQUFDdEUsT0FBZCxFQUF1QjtBQUNyQixhQUFPc0UsU0FBUyxDQUFDdEUsT0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBR0QsTUFBTXVFLHNCQUFzQixHQUFHLENBQUMsZUFBRCxFQUFrQixXQUFsQixFQUErQixhQUEvQixDQUEvQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgQmFzZURyaXZlciBmcm9tICcuLi9iYXNlZHJpdmVyL2RyaXZlcic7XG5pbXBvcnQgeyB1dGlsIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuXG5cbi8vIGRlZmluZSB0aGUgcm91dGVzLCBtYXBwaW5nIG9mIEhUVFAgbWV0aG9kcyB0byBwYXJ0aWN1bGFyIGRyaXZlciBjb21tYW5kcyxcbi8vIGFuZCBhbnkgcGFyYW1ldGVycyB0aGF0IGFyZSBleHBlY3RlZCBpbiBhIHJlcXVlc3Rcbi8vIHBhcmFtZXRlcnMgY2FuIGJlIGByZXF1aXJlZGAgb3IgYG9wdGlvbmFsYFxuY29uc3QgTUVUSE9EX01BUCA9IHtcbiAgJy93ZC9odWIvc3RhdHVzJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRTdGF0dXMnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnY3JlYXRlU2Vzc2lvbicsIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgIHZhbGlkYXRlOiAoanNvbk9iaikgPT4gKCFqc29uT2JqLmNhcGFiaWxpdGllcyAmJiAhanNvbk9iai5kZXNpcmVkQ2FwYWJpbGl0aWVzKSAmJiAnd2UgcmVxdWlyZSBvbmUgb2YgXCJkZXNpcmVkQ2FwYWJpbGl0aWVzXCIgb3IgXCJjYXBhYmlsaXRpZXNcIiBvYmplY3QnLFxuICAgICAgb3B0aW9uYWw6IFsnZGVzaXJlZENhcGFiaWxpdGllcycsICdyZXF1aXJlZENhcGFiaWxpdGllcycsICdjYXBhYmlsaXRpZXMnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb25zJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRTZXNzaW9ucyd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0U2Vzc2lvbid9LFxuICAgIERFTEVURToge2NvbW1hbmQ6ICdkZWxldGVTZXNzaW9uJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3RpbWVvdXRzJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRUaW1lb3V0cyd9LCAvLyBXM0Mgcm91dGVcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3RpbWVvdXRzJywgcGF5bG9hZFBhcmFtczoge1xuICAgICAgdmFsaWRhdGU6IChqc29uT2JqLCBwcm90b2NvbE5hbWUpID0+IHtcbiAgICAgICAgaWYgKHByb3RvY29sTmFtZSA9PT0gQmFzZURyaXZlci5EUklWRVJfUFJPVE9DT0wuVzNDKSB7XG4gICAgICAgICAgaWYgKCF1dGlsLmhhc1ZhbHVlKGpzb25PYmouc2NyaXB0KSAmJiAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLnBhZ2VMb2FkKSAmJiAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLmltcGxpY2l0KSkge1xuICAgICAgICAgICAgcmV0dXJuICdXM0MgcHJvdG9jb2wgZXhwZWN0cyBhbnkgb2Ygc2NyaXB0LCBwYWdlTG9hZCBvciBpbXBsaWNpdCB0byBiZSBzZXQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIXV0aWwuaGFzVmFsdWUoanNvbk9iai50eXBlKSB8fCAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLm1zKSkge1xuICAgICAgICAgICAgcmV0dXJuICdNSlNPTldQIHByb3RvY29sIHJlcXVpcmVzIHR5cGUgYW5kIG1zJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvcHRpb25hbDogWyd0eXBlJywgJ21zJywgJ3NjcmlwdCcsICdwYWdlTG9hZCcsICdpbXBsaWNpdCddLFxuICAgIH19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC90aW1lb3V0cy9hc3luY19zY3JpcHQnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdhc3luY1NjcmlwdFRpbWVvdXQnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnbXMnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC90aW1lb3V0cy9pbXBsaWNpdF93YWl0Jzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnaW1wbGljaXRXYWl0JywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ21zJ119fVxuICB9LFxuICAvLyBKU09OV1BcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3dpbmRvd19oYW5kbGUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFdpbmRvd0hhbmRsZSd9XG4gIH0sXG4gIC8vIFczQ1xuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvd2luZG93L2hhbmRsZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0V2luZG93SGFuZGxlJ31cbiAgfSxcbiAgLy8gSlNPTldQXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC93aW5kb3dfaGFuZGxlcyc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0V2luZG93SGFuZGxlcyd9XG4gIH0sXG4gIC8vIFczQ1xuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvd2luZG93L2hhbmRsZXMnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFdpbmRvd0hhbmRsZXMnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdXJsJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRVcmwnfSxcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldFVybCcsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWyd1cmwnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9mb3J3YXJkJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZm9yd2FyZCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9iYWNrJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnYmFjayd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9yZWZyZXNoJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAncmVmcmVzaCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9leGVjdXRlJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZXhlY3V0ZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydzY3JpcHQnLCAnYXJncyddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2V4ZWN1dGVfYXN5bmMnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdleGVjdXRlQXN5bmMnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnc2NyaXB0JywgJ2FyZ3MnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9zY3JlZW5zaG90Jzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRTY3JlZW5zaG90J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2ltZS9hdmFpbGFibGVfZW5naW5lcyc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnYXZhaWxhYmxlSU1FRW5naW5lcyd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9pbWUvYWN0aXZlX2VuZ2luZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0QWN0aXZlSU1FRW5naW5lJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2ltZS9hY3RpdmF0ZWQnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2lzSU1FQWN0aXZhdGVkJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2ltZS9kZWFjdGl2YXRlJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZGVhY3RpdmF0ZUlNRUVuZ2luZSd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9pbWUvYWN0aXZhdGUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdhY3RpdmF0ZUlNRUVuZ2luZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydlbmdpbmUnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9mcmFtZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldEZyYW1lJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2lkJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZnJhbWUvcGFyZW50Jzoge1xuICAgIFBPU1Q6IHt9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC93aW5kb3cnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFdpbmRvd0hhbmRsZSd9LFxuICAgIFBPU1Q6IHtjb21tYW5kOiAnc2V0V2luZG93JywgcGF5bG9hZFBhcmFtczoge1xuICAgICAgb3B0aW9uYWw6IFsnbmFtZScsICdoYW5kbGUnXSxcbiAgICAgIC8vIFJldHVybiBib3RoIHZhbHVlcyB0byBtYXRjaCBXM0MgYW5kIEpTT05XUCBwcm90b2NvbHNcbiAgICAgIG1ha2VBcmdzOiAoanNvbk9iaikgPT4ge1xuICAgICAgICBpZiAodXRpbC5oYXNWYWx1ZShqc29uT2JqLmhhbmRsZSkgJiYgIXV0aWwuaGFzVmFsdWUoanNvbk9iai5uYW1lKSkge1xuICAgICAgICAgIHJldHVybiBbanNvbk9iai5oYW5kbGUsIGpzb25PYmouaGFuZGxlXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXRpbC5oYXNWYWx1ZShqc29uT2JqLm5hbWUpICYmICF1dGlsLmhhc1ZhbHVlKGpzb25PYmouaGFuZGxlKSkge1xuICAgICAgICAgIHJldHVybiBbanNvbk9iai5uYW1lLCBqc29uT2JqLm5hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbanNvbk9iai5uYW1lLCBqc29uT2JqLmhhbmRsZV07XG4gICAgICB9LFxuICAgICAgdmFsaWRhdGU6IChqc29uT2JqKSA9PiAoIXV0aWwuaGFzVmFsdWUoanNvbk9iai5uYW1lKSAmJiAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLmhhbmRsZSkpXG4gICAgICAgICYmICd3ZSByZXF1aXJlIG9uZSBvZiBcIm5hbWVcIiBvciBcImhhbmRsZVwiIHRvIGJlIHNldCcsXG4gICAgfX0sXG4gICAgREVMRVRFOiB7Y29tbWFuZDogJ2Nsb3NlV2luZG93J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3dpbmRvdy86d2luZG93aGFuZGxlL3NpemUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFdpbmRvd1NpemUnfSxcbiAgICBQT1NUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvd2luZG93Lzp3aW5kb3doYW5kbGUvcG9zaXRpb24nOiB7XG4gICAgUE9TVDoge30sXG4gICAgR0VUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvd2luZG93Lzp3aW5kb3doYW5kbGUvbWF4aW1pemUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdtYXhpbWl6ZVdpbmRvdyd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9jb29raWUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldENvb2tpZXMnfSxcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldENvb2tpZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydjb29raWUnXX19LFxuICAgIERFTEVURToge2NvbW1hbmQ6ICdkZWxldGVDb29raWVzJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2Nvb2tpZS86bmFtZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0Q29va2llJ30sXG4gICAgREVMRVRFOiB7Y29tbWFuZDogJ2RlbGV0ZUNvb2tpZSd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9zb3VyY2UnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFBhZ2VTb3VyY2UnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdGl0bGUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ3RpdGxlJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdmaW5kRWxlbWVudCcsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWyd1c2luZycsICd2YWx1ZSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnRzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZmluZEVsZW1lbnRzJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3VzaW5nJywgJ3ZhbHVlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC9hY3RpdmUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2FjdGl2ZSd9LCAvLyBXM0M6IGh0dHBzOi8vdzNjLmdpdGh1Yi5pby93ZWJkcml2ZXIvd2ViZHJpdmVyLXNwZWMuaHRtbCNkZm4tZ2V0LWFjdGl2ZS1lbGVtZW50XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdhY3RpdmUnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC86ZWxlbWVudElkJzoge1xuICAgIEdFVDoge31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9lbGVtZW50Jzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZmluZEVsZW1lbnRGcm9tRWxlbWVudCcsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWyd1c2luZycsICd2YWx1ZSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9lbGVtZW50cyc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2ZpbmRFbGVtZW50c0Zyb21FbGVtZW50JywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3VzaW5nJywgJ3ZhbHVlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC86ZWxlbWVudElkL2NsaWNrJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnY2xpY2snfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC86ZWxlbWVudElkL3N1Ym1pdCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3N1Ym1pdCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvdGV4dCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0VGV4dCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvdmFsdWUnOiB7XG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ3NldFZhbHVlJyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgdmFsaWRhdGU6IChqc29uT2JqKSA9PiAoIXV0aWwuaGFzVmFsdWUoanNvbk9iai52YWx1ZSkgJiYgIXV0aWwuaGFzVmFsdWUoanNvbk9iai50ZXh0KSkgJiZcbiAgICAgICAgICAgICd3ZSByZXF1aXJlIG9uZSBvZiBcInRleHRcIiBvciBcInZhbHVlXCIgcGFyYW1zJyxcbiAgICAgICAgb3B0aW9uYWw6IFsndmFsdWUnLCAndGV4dCddLFxuICAgICAgICAvLyBvdmVycmlkZSB0aGUgZGVmYXVsdCBhcmd1bWVudCBjb25zdHJ1Y3RvciBiZWNhdXNlIG9mIHRoZSBzcGVjaWFsXG4gICAgICAgIC8vIGxvZ2ljIGhlcmUuIEJhc2ljYWxseSB3ZSB3YW50IHRvIGFjY2VwdCBlaXRoZXIgYSB2YWx1ZSAob2xkIEpTT05XUClcbiAgICAgICAgLy8gb3IgYSB0ZXh0IChuZXcgVzNDKSBwYXJhbWV0ZXIsIGJ1dCBvbmx5IHNlbmQgb25lIG9mIHRoZW0gdG8gdGhlXG4gICAgICAgIC8vIGNvbW1hbmQgKG5vdCBib3RoKS4gUHJlZmVyICd2YWx1ZScgc2luY2UgaXQncyBtb3JlXG4gICAgICAgIC8vIGJhY2t3YXJkLWNvbXBhdGlibGUuXG4gICAgICAgIG1ha2VBcmdzOiAoanNvbk9iaikgPT4gW2pzb25PYmoudmFsdWUgfHwganNvbk9iai50ZXh0XSxcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9rZXlzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAna2V5cycsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWyd2YWx1ZSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9uYW1lJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXROYW1lJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9jbGVhcic6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2NsZWFyJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9zZWxlY3RlZCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZWxlbWVudFNlbGVjdGVkJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9lbmFibGVkJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdlbGVtZW50RW5hYmxlZCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvYXR0cmlidXRlLzpuYW1lJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRBdHRyaWJ1dGUnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC86ZWxlbWVudElkL2VxdWFscy86b3RoZXJJZCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZXF1YWxzRWxlbWVudCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvZGlzcGxheWVkJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdlbGVtZW50RGlzcGxheWVkJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9sb2NhdGlvbic6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0TG9jYXRpb24nfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZWxlbWVudC86ZWxlbWVudElkL2xvY2F0aW9uX2luX3ZpZXcnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldExvY2F0aW9uSW5WaWV3J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9zaXplJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRTaXplJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9jc3MvOnByb3BlcnR5TmFtZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0Q3NzUHJvcGVydHknfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvb3JpZW50YXRpb24nOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldE9yaWVudGF0aW9uJ30sXG4gICAgUE9TVDoge2NvbW1hbmQ6ICdzZXRPcmllbnRhdGlvbicsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydvcmllbnRhdGlvbiddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3JvdGF0aW9uJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRSb3RhdGlvbid9LFxuICAgIFBPU1Q6IHtjb21tYW5kOiAnc2V0Um90YXRpb24nLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsneCcsICd5JywgJ3onXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9tb3ZldG8nOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdtb3ZlVG8nLCBwYXlsb2FkUGFyYW1zOiB7b3B0aW9uYWw6IFsnZWxlbWVudCcsICd4b2Zmc2V0JywgJ3lvZmZzZXQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9jbGljayc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2NsaWNrQ3VycmVudCcsIHBheWxvYWRQYXJhbXM6IHtvcHRpb25hbDogWydidXR0b24nXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9idXR0b25kb3duJzoge1xuICAgIFBPU1Q6IHt9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9idXR0b251cCc6IHtcbiAgICBQT1NUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZG91YmxlY2xpY2snOiB7XG4gICAgUE9TVDoge31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3RvdWNoL2NsaWNrJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnY2xpY2snLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnZWxlbWVudCddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3RvdWNoL2Rvd24nOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b3VjaERvd24nLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsneCcsICd5J119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdG91Y2gvdXAnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b3VjaFVwJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3gnLCAneSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3RvdWNoL21vdmUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b3VjaE1vdmUnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsneCcsICd5J119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdG91Y2gvc2Nyb2xsJzoge1xuICAgIFBPU1Q6IHt9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC90b3VjaC9kb3VibGVjbGljayc6IHtcbiAgICBQT1NUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYWN0aW9ucyc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3BlcmZvcm1BY3Rpb25zJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2FjdGlvbnMnXX19LFxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdG91Y2gvbG9uZ2NsaWNrJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAndG91Y2hMb25nQ2xpY2snLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnZWxlbWVudHMnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC90b3VjaC9mbGljayc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2ZsaWNrJywgcGF5bG9hZFBhcmFtczoge29wdGlvbmFsOiBbJ2VsZW1lbnQnLCAneHNwZWVkJywgJ3lzcGVlZCcsICd4b2Zmc2V0JywgJ3lvZmZzZXQnLCAnc3BlZWQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9sb2NhdGlvbic6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0R2VvTG9jYXRpb24nfSxcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldEdlb0xvY2F0aW9uJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2xvY2F0aW9uJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvbG9jYWxfc3RvcmFnZSc6IHtcbiAgICBHRVQ6IHt9LFxuICAgIFBPU1Q6IHt9LFxuICAgIERFTEVURToge31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2xvY2FsX3N0b3JhZ2Uva2V5LzprZXknOiB7XG4gICAgR0VUOiB7fSxcbiAgICBERUxFVEU6IHt9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9sb2NhbF9zdG9yYWdlL3NpemUnOiB7XG4gICAgR0VUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvc2Vzc2lvbl9zdG9yYWdlJzoge1xuICAgIEdFVDoge30sXG4gICAgUE9TVDoge30sXG4gICAgREVMRVRFOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvc2Vzc2lvbl9zdG9yYWdlL2tleS86a2V5Jzoge1xuICAgIEdFVDoge30sXG4gICAgREVMRVRFOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvc2Vzc2lvbl9zdG9yYWdlL3NpemUnOiB7XG4gICAgR0VUOiB7fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvbG9nJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZ2V0TG9nJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3R5cGUnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9sb2cvdHlwZXMnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldExvZ1R5cGVzJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGxpY2F0aW9uX2NhY2hlL3N0YXR1cyc6IHtcbiAgICBHRVQ6IHt9XG4gIH0sXG5cbiAgLy9cbiAgLy8gbWpzb253aXJlXG4gIC8vXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9jb250ZXh0Jzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRDdXJyZW50Q29udGV4dCd9LFxuICAgIFBPU1Q6IHtjb21tYW5kOiAnc2V0Q29udGV4dCcsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWyduYW1lJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvY29udGV4dHMnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldENvbnRleHRzJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2VsZW1lbnQvOmVsZW1lbnRJZC9wYWdlSW5kZXgnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFBhZ2VJbmRleCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9uZXR3b3JrX2Nvbm5lY3Rpb24nOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldE5ldHdvcmtDb25uZWN0aW9uJ30sXG4gICAgUE9TVDoge2NvbW1hbmQ6ICdzZXROZXR3b3JrQ29ubmVjdGlvbicsIHBheWxvYWRQYXJhbXM6IHt1bndyYXA6ICdwYXJhbWV0ZXJzJywgcmVxdWlyZWQ6IFsndHlwZSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3RvdWNoL3BlcmZvcm0nOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdwZXJmb3JtVG91Y2gnLCBwYXlsb2FkUGFyYW1zOiB7d3JhcDogJ2FjdGlvbnMnLCByZXF1aXJlZDogWydhY3Rpb25zJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvdG91Y2gvbXVsdGkvcGVyZm9ybSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3BlcmZvcm1NdWx0aUFjdGlvbicsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydhY3Rpb25zJ10sIG9wdGlvbmFsOiBbJ2VsZW1lbnRJZCddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3JlY2VpdmVfYXN5bmNfcmVzcG9uc2UnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdyZWNlaXZlQXN5bmNSZXNwb25zZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydzdGF0dXMnLCAndmFsdWUnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL3NoYWtlJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnbW9iaWxlU2hha2UnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9zeXN0ZW1fdGltZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0RGV2aWNlVGltZScsIHBheWxvYWRQYXJhbXM6IHtvcHRpb25hbDogWydmb3JtYXQnXX19LFxuICAgIFBPU1Q6IHtjb21tYW5kOiAnZ2V0RGV2aWNlVGltZScsIHBheWxvYWRQYXJhbXM6IHtvcHRpb25hbDogWydmb3JtYXQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2xvY2snOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdsb2NrJywgcGF5bG9hZFBhcmFtczoge29wdGlvbmFsOiBbJ3NlY29uZHMnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL3VubG9jayc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3VubG9jayd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2lzX2xvY2tlZCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2lzTG9ja2VkJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9zdGFydF9yZWNvcmRpbmdfc2NyZWVuJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnc3RhcnRSZWNvcmRpbmdTY3JlZW4nLCBwYXlsb2FkUGFyYW1zOiB7b3B0aW9uYWw6IFsnb3B0aW9ucyddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9zdG9wX3JlY29yZGluZ19zY3JlZW4nOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdzdG9wUmVjb3JkaW5nU2NyZWVuJywgcGF5bG9hZFBhcmFtczoge29wdGlvbmFsOiBbJ29wdGlvbnMnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vcGVyZm9ybWFuY2VEYXRhL3R5cGVzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZ2V0UGVyZm9ybWFuY2VEYXRhVHlwZXMnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2dldFBlcmZvcm1hbmNlRGF0YSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2dldFBlcmZvcm1hbmNlRGF0YScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydwYWNrYWdlTmFtZScsICdkYXRhVHlwZSddLCBvcHRpb25hbDogWydkYXRhUmVhZFRpbWVvdXQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL3ByZXNzX2tleWNvZGUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdwcmVzc0tleUNvZGUnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsna2V5Y29kZSddLCBvcHRpb25hbDogWydtZXRhc3RhdGUnLCAnZmxhZ3MnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2xvbmdfcHJlc3Nfa2V5Y29kZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2xvbmdQcmVzc0tleUNvZGUnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsna2V5Y29kZSddLCBvcHRpb25hbDogWydtZXRhc3RhdGUnLCAnZmxhZ3MnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2Zpbmdlcl9wcmludCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2ZpbmdlcnByaW50JywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2ZpbmdlcnByaW50SWQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL3NlbmRfc21zJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnc2VuZFNNUycsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydwaG9uZU51bWJlcicsICdtZXNzYWdlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9nc21fY2FsbCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2dzbUNhbGwnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsncGhvbmVOdW1iZXInLCAnYWN0aW9uJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9nc21fc2lnbmFsJzoge1xuICAgIFBPU1Q6IHtcbiAgICAgIGNvbW1hbmQ6ICdnc21TaWduYWwnLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICB2YWxpZGF0ZTogKGpzb25PYmopID0+ICghdXRpbC5oYXNWYWx1ZShqc29uT2JqLnNpZ25hbFN0cmVuZ3RoKSAmJiAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLnNpZ25hbFN0cmVuZ2gpKSAmJlxuICAgICAgICAgICAgJ3dlIHJlcXVpcmUgb25lIG9mIFwic2lnbmFsU3RyZW5ndGhcIiBvciBcInNpZ25hbFN0cmVuZ2hcIiBwYXJhbXMnLFxuICAgICAgICBvcHRpb25hbDogWydzaWduYWxTdHJlbmd0aCcsICdzaWduYWxTdHJlbmdoJ10sXG4gICAgICAgIC8vIGJhY2t3YXJkLWNvbXBhdGlibGUuIHNvbk9iai5zaWduYWxTdHJlbmd0aCBjYW4gYmUgMFxuICAgICAgICBtYWtlQXJnczogKGpzb25PYmopID0+IFt1dGlsLmhhc1ZhbHVlKGpzb25PYmouc2lnbmFsU3RyZW5ndGgpID8ganNvbk9iai5zaWduYWxTdHJlbmd0aCA6IGpzb25PYmouc2lnbmFsU3RyZW5naF1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2dzbV92b2ljZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2dzbVZvaWNlJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3N0YXRlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9wb3dlcl9jYXBhY2l0eSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3Bvd2VyQ2FwYWNpdHknLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsncGVyY2VudCddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvcG93ZXJfYWMnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdwb3dlckFDJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3N0YXRlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9uZXR3b3JrX3NwZWVkJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnbmV0d29ya1NwZWVkJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ25ldHNwZWVkJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9rZXlldmVudCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2tleWV2ZW50JywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2tleWNvZGUnXSwgb3B0aW9uYWw6IFsnbWV0YXN0YXRlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9yb3RhdGUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdtb2JpbGVSb3RhdGlvbicsIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgIHJlcXVpcmVkOiBbJ3gnLCAneScsICdyYWRpdXMnLCAncm90YXRpb24nLCAndG91Y2hDb3VudCcsICdkdXJhdGlvbiddLFxuICAgICAgb3B0aW9uYWw6IFsnZWxlbWVudCddIH19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2N1cnJlbnRfYWN0aXZpdHknOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldEN1cnJlbnRBY3Rpdml0eSd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2N1cnJlbnRfcGFja2FnZSc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0Q3VycmVudFBhY2thZ2UnfVxuICB9LFxuICAvL3JlZ2lvbiBBcHBsaWNhdGlvbnMgTWFuYWdlbWVudFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9pbnN0YWxsX2FwcCc6IHtcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAnaW5zdGFsbEFwcCcsXG4gICAgICBwYXlsb2FkUGFyYW1zOiB7XG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwcFBhdGgnXSxcbiAgICAgICAgb3B0aW9uYWw6IFsnb3B0aW9ucyddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9hY3RpdmF0ZV9hcHAnOiB7XG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ2FjdGl2YXRlQXBwJyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgcmVxdWlyZWQ6IFtbJ2FwcElkJ10sIFsnYnVuZGxlSWQnXV0sXG4gICAgICAgIG9wdGlvbmFsOiBbJ29wdGlvbnMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvcmVtb3ZlX2FwcCc6IHtcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAncmVtb3ZlQXBwJyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgcmVxdWlyZWQ6IFtbJ2FwcElkJ10sIFsnYnVuZGxlSWQnXV0sXG4gICAgICAgIG9wdGlvbmFsOiBbJ29wdGlvbnMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvdGVybWluYXRlX2FwcCc6IHtcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAndGVybWluYXRlQXBwJyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgcmVxdWlyZWQ6IFtbJ2FwcElkJ10sIFsnYnVuZGxlSWQnXV0sXG4gICAgICAgIG9wdGlvbmFsOiBbJ29wdGlvbnMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvYXBwX2luc3RhbGxlZCc6IHtcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAnaXNBcHBJbnN0YWxsZWQnLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICByZXF1aXJlZDogW1snYXBwSWQnXSwgWydidW5kbGVJZCddXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvYXBwX3N0YXRlJzoge1xuICAgIEdFVDoge1xuICAgICAgY29tbWFuZDogJ3F1ZXJ5QXBwU3RhdGUnLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICByZXF1aXJlZDogW1snYXBwSWQnXSwgWydidW5kbGVJZCddXVxuICAgICAgfVxuICAgIH0sXG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ3F1ZXJ5QXBwU3RhdGUnLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICByZXF1aXJlZDogW1snYXBwSWQnXSwgWydidW5kbGVJZCddXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy9lbmRyZWdpb25cbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvaGlkZV9rZXlib2FyZCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2hpZGVLZXlib2FyZCcsIHBheWxvYWRQYXJhbXM6IHtvcHRpb25hbDogWydzdHJhdGVneScsICdrZXknLCAna2V5Q29kZScsICdrZXlOYW1lJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9pc19rZXlib2FyZF9zaG93bic6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnaXNLZXlib2FyZFNob3duJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvcHVzaF9maWxlJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAncHVzaEZpbGUnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsncGF0aCcsICdkYXRhJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9wdWxsX2ZpbGUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdwdWxsRmlsZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydwYXRoJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9wdWxsX2ZvbGRlcic6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3B1bGxGb2xkZXInLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsncGF0aCddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvdG9nZ2xlX2FpcnBsYW5lX21vZGUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b2dnbGVGbGlnaHRNb2RlJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvdG9nZ2xlX2RhdGEnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b2dnbGVEYXRhJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvdG9nZ2xlX3dpZmknOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b2dnbGVXaUZpJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2UvdG9nZ2xlX2xvY2F0aW9uX3NlcnZpY2VzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAndG9nZ2xlTG9jYXRpb25TZXJ2aWNlcyd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL29wZW5fbm90aWZpY2F0aW9ucyc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ29wZW5Ob3RpZmljYXRpb25zJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2Uvc3RhcnRfYWN0aXZpdHknOiB7XG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ3N0YXJ0QWN0aXZpdHknLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICByZXF1aXJlZDogWydhcHBQYWNrYWdlJywgJ2FwcEFjdGl2aXR5J10sXG4gICAgICAgIG9wdGlvbmFsOiBbJ2FwcFdhaXRQYWNrYWdlJywgJ2FwcFdhaXRBY3Rpdml0eScsICdpbnRlbnRBY3Rpb24nLFxuICAgICAgICAgICdpbnRlbnRDYXRlZ29yeScsICdpbnRlbnRGbGFncycsICdvcHRpb25hbEludGVudEFyZ3VtZW50cycsICdkb250U3RvcEFwcE9uUmVzZXQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2Uvc3lzdGVtX2JhcnMnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFN5c3RlbUJhcnMnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2RldmljZS9kaXNwbGF5X2RlbnNpdHknOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldERpc3BsYXlEZW5zaXR5J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9zaW11bGF0b3IvdG91Y2hfaWQnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICd0b3VjaElkJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ21hdGNoJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL3NpbXVsYXRvci90b2dnbGVfdG91Y2hfaWRfZW5yb2xsbWVudCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3RvZ2dsZUVucm9sbFRvdWNoSWQnLCBwYXlsb2FkUGFyYW1zOiB7b3B0aW9uYWw6IFsnZW5hYmxlZCddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9hcHAvbGF1bmNoJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnbGF1bmNoQXBwJ31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9hcHAvY2xvc2UnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdjbG9zZUFwcCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vYXBwL3Jlc2V0Jzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAncmVzZXQnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2FwcC9iYWNrZ3JvdW5kJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnYmFja2dyb3VuZCcsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydzZWNvbmRzJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2FwcC9lbmRfdGVzdF9jb3ZlcmFnZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2VuZENvdmVyYWdlJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ2ludGVudCcsICdwYXRoJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2FwcC9zdHJpbmdzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZ2V0U3RyaW5ncycsIHBheWxvYWRQYXJhbXM6IHtvcHRpb25hbDogWydsYW5ndWFnZScsICdzdHJpbmdGaWxlJ119fVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL2VsZW1lbnQvOmVsZW1lbnRJZC92YWx1ZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldFZhbHVlSW1tZWRpYXRlJywgcGF5bG9hZFBhcmFtczoge1xuICAgICAgdmFsaWRhdGU6IChqc29uT2JqKSA9PiAoIXV0aWwuaGFzVmFsdWUoanNvbk9iai52YWx1ZSkgJiYgIXV0aWwuaGFzVmFsdWUoanNvbk9iai50ZXh0KSkgJiZcbiAgICAgICAgICAnd2UgcmVxdWlyZSBvbmUgb2YgXCJ0ZXh0XCIgb3IgXCJ2YWx1ZVwiIHBhcmFtcycsXG4gICAgICBvcHRpb25hbDogWyd2YWx1ZScsICd0ZXh0J10sXG4gICAgICAvLyBXZSB3YW50IHRvIGVpdGhlciBhIHZhbHVlIChvbGQgSlNPTldQKSBvciBhIHRleHQgKG5ldyBXM0MpIHBhcmFtZXRlcixcbiAgICAgIC8vIGJ1dCBvbmx5IHNlbmQgb25lIG9mIHRoZW0gdG8gdGhlIGNvbW1hbmQgKG5vdCBib3RoKS5cbiAgICAgIC8vIFByZWZlciAndmFsdWUnIHNpbmNlIGl0J3MgbW9yZSBiYWNrd2FyZC1jb21wYXRpYmxlLlxuICAgICAgbWFrZUFyZ3M6IChqc29uT2JqKSA9PiBbanNvbk9iai52YWx1ZSB8fCBqc29uT2JqLnRleHRdLFxuICAgIH19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZWxlbWVudC86ZWxlbWVudElkL3JlcGxhY2VfdmFsdWUnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdyZXBsYWNlVmFsdWUnLCBwYXlsb2FkUGFyYW1zOiB7XG4gICAgICB2YWxpZGF0ZTogKGpzb25PYmopID0+ICghdXRpbC5oYXNWYWx1ZShqc29uT2JqLnZhbHVlKSAmJiAhdXRpbC5oYXNWYWx1ZShqc29uT2JqLnRleHQpKSAmJlxuICAgICAgICAgICd3ZSByZXF1aXJlIG9uZSBvZiBcInRleHRcIiBvciBcInZhbHVlXCIgcGFyYW1zJyxcbiAgICAgIG9wdGlvbmFsOiBbJ3ZhbHVlJywgJ3RleHQnXSxcbiAgICAgIC8vIFdlIHdhbnQgdG8gZWl0aGVyIGEgdmFsdWUgKG9sZCBKU09OV1ApIG9yIGEgdGV4dCAobmV3IFczQykgcGFyYW1ldGVyLFxuICAgICAgLy8gYnV0IG9ubHkgc2VuZCBvbmUgb2YgdGhlbSB0byB0aGUgY29tbWFuZCAobm90IGJvdGgpLlxuICAgICAgLy8gUHJlZmVyICd2YWx1ZScgc2luY2UgaXQncyBtb3JlIGJhY2t3YXJkLWNvbXBhdGlibGUuXG4gICAgICBtYWtlQXJnczogKGpzb25PYmopID0+IFtqc29uT2JqLnZhbHVlIHx8IGpzb25PYmoudGV4dF0sXG4gICAgfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9zZXR0aW5ncyc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3VwZGF0ZVNldHRpbmdzJywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3NldHRpbmdzJ119fSxcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0U2V0dGluZ3MnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvYXBwaXVtL3JlY2VpdmVfYXN5bmNfcmVzcG9uc2UnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdyZWNlaXZlQXN5bmNSZXNwb25zZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydyZXNwb25zZSddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9leGVjdXRlX2RyaXZlcic6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ2V4ZWN1dGVEcml2ZXJTY3JpcHQnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnc2NyaXB0J10sIG9wdGlvbmFsOiBbJ3R5cGUnLCAndGltZW91dCddfX1cbiAgfSxcblxuXG4gIC8qXG4gICAqIFRoZSBXM0Mgc3BlYyBoYXMgc29tZSBjaGFuZ2VzIHRvIHRoZSB3aXJlIHByb3RvY29sLlxuICAgKiBodHRwczovL3czYy5naXRodWIuaW8vd2ViZHJpdmVyL3dlYmRyaXZlci1zcGVjLmh0bWxcbiAgICogQmVnaW4gdG8gYWRkIHRob3NlIGNoYW5nZXMgaGVyZSwga2VlcGluZyB0aGUgb2xkIHZlcnNpb25cbiAgICogc2luY2UgY2xpZW50cyBzdGlsbCBpbXBsZW1lbnQgdGhlbS5cbiAgICovXG4gIC8vIG9sZCBhbGVydHNcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FsZXJ0X3RleHQnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldEFsZXJ0VGV4dCd9LFxuICAgIFBPU1Q6IHtjb21tYW5kOiAnc2V0QWxlcnRUZXh0JywgcGF5bG9hZFBhcmFtczoge3JlcXVpcmVkOiBbJ3RleHQnXX19XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hY2NlcHRfYWxlcnQnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdwb3N0QWNjZXB0QWxlcnQnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZGlzbWlzc19hbGVydCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3Bvc3REaXNtaXNzQWxlcnQnfVxuICB9LFxuICAvLyBodHRwczovL3czYy5naXRodWIuaW8vd2ViZHJpdmVyL3dlYmRyaXZlci1zcGVjLmh0bWwjdXNlci1wcm9tcHRzXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hbGVydC90ZXh0Jzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRBbGVydFRleHQnfSxcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAnc2V0QWxlcnRUZXh0JyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgdmFsaWRhdGU6IChqc29uT2JqKSA9PiAoIXV0aWwuaGFzVmFsdWUoanNvbk9iai52YWx1ZSkgJiYgIXV0aWwuaGFzVmFsdWUoanNvbk9iai50ZXh0KSkgJiZcbiAgICAgICAgICAgICdlaXRoZXIgXCJ0ZXh0XCIgb3IgXCJ2YWx1ZVwiIG11c3QgYmUgc2V0JyxcbiAgICAgICAgb3B0aW9uYWw6IFsndmFsdWUnLCAndGV4dCddLFxuICAgICAgICAvLyBQcmVmZXIgJ3ZhbHVlJyBzaW5jZSBpdCdzIG1vcmUgYmFja3dhcmQtY29tcGF0aWJsZS5cbiAgICAgICAgbWFrZUFyZ3M6IChqc29uT2JqKSA9PiBbanNvbk9iai52YWx1ZSB8fCBqc29uT2JqLnRleHRdLFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FsZXJ0L2FjY2VwdCc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3Bvc3RBY2NlcHRBbGVydCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hbGVydC9kaXNtaXNzJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAncG9zdERpc21pc3NBbGVydCd9XG4gIH0sXG4gIC8vIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby93ZWJkcml2ZXIvd2ViZHJpdmVyLXNwZWMuaHRtbCNnZXQtZWxlbWVudC1yZWN0XG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvcmVjdCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0RWxlbWVudFJlY3QnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvZXhlY3V0ZS9zeW5jJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZXhlY3V0ZScsIHBheWxvYWRQYXJhbXM6IHtyZXF1aXJlZDogWydzY3JpcHQnLCAnYXJncyddfX1cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2V4ZWN1dGUvYXN5bmMnOiB7XG4gICAgUE9TVDoge2NvbW1hbmQ6ICdleGVjdXRlQXN5bmMnLCBwYXlsb2FkUGFyYW1zOiB7cmVxdWlyZWQ6IFsnc2NyaXB0JywgJ2FyZ3MnXX19XG4gIH0sXG4gIC8vIFByZS1XM0MgZW5kcG9pbnQgZm9yIGVsZW1lbnQgc2NyZWVuc2hvdFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvc2NyZWVuc2hvdC86ZWxlbWVudElkJzoge1xuICAgIEdFVDoge2NvbW1hbmQ6ICdnZXRFbGVtZW50U2NyZWVuc2hvdCd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvc2NyZWVuc2hvdCc6IHtcbiAgICBHRVQ6IHtjb21tYW5kOiAnZ2V0RWxlbWVudFNjcmVlbnNob3QnfVxuICB9LFxuICAnL3dkL2h1Yi9zZXNzaW9uLzpzZXNzaW9uSWQvd2luZG93L3JlY3QnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFdpbmRvd1JlY3QnfSxcbiAgICBQT1NUOiB7Y29tbWFuZDogJ3NldFdpbmRvd1JlY3QnfSxcbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3dpbmRvdy9tYXhpbWl6ZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ21heGltaXplV2luZG93J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3dpbmRvdy9taW5pbWl6ZSc6IHtcbiAgICBQT1NUOiB7Y29tbWFuZDogJ21pbmltaXplV2luZG93J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL3dpbmRvdy9mdWxsc2NyZWVuJzoge1xuICAgIFBPU1Q6IHtjb21tYW5kOiAnZnVsbFNjcmVlbldpbmRvdyd9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9lbGVtZW50LzplbGVtZW50SWQvcHJvcGVydHkvOm5hbWUnOiB7XG4gICAgR0VUOiB7Y29tbWFuZDogJ2dldFByb3BlcnR5J31cbiAgfSxcbiAgJy93ZC9odWIvc2Vzc2lvbi86c2Vzc2lvbklkL2FwcGl1bS9kZXZpY2Uvc2V0X2NsaXBib2FyZCc6IHtcbiAgICBQT1NUOiB7XG4gICAgICBjb21tYW5kOiAnc2V0Q2xpcGJvYXJkJyxcbiAgICAgIHBheWxvYWRQYXJhbXM6IHtcbiAgICAgICAgcmVxdWlyZWQ6IFsnY29udGVudCddLFxuICAgICAgICBvcHRpb25hbDogW1xuICAgICAgICAgICdjb250ZW50VHlwZScsXG4gICAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vZGV2aWNlL2dldF9jbGlwYm9hcmQnOiB7XG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ2dldENsaXBib2FyZCcsXG4gICAgICBwYXlsb2FkUGFyYW1zOiB7XG4gICAgICAgIG9wdGlvbmFsOiBbXG4gICAgICAgICAgJ2NvbnRlbnRUeXBlJyxcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gICcvd2QvaHViL3Nlc3Npb24vOnNlc3Npb25JZC9hcHBpdW0vY29tcGFyZV9pbWFnZXMnOiB7XG4gICAgUE9TVDoge1xuICAgICAgY29tbWFuZDogJ2NvbXBhcmVJbWFnZXMnLFxuICAgICAgcGF5bG9hZFBhcmFtczoge1xuICAgICAgICByZXF1aXJlZDogWydtb2RlJywgJ2ZpcnN0SW1hZ2UnLCAnc2Vjb25kSW1hZ2UnXSxcbiAgICAgICAgb3B0aW9uYWw6IFsnb3B0aW9ucyddXG4gICAgICB9LFxuICAgIH1cbiAgfSxcbn07XG5cbi8vIGRyaXZlciBjb21tYW5kIG5hbWVzXG5sZXQgQUxMX0NPTU1BTkRTID0gW107XG5mb3IgKGxldCB2IG9mIF8udmFsdWVzKE1FVEhPRF9NQVApKSB7XG4gIGZvciAobGV0IG0gb2YgXy52YWx1ZXModikpIHtcbiAgICBpZiAobS5jb21tYW5kKSB7XG4gICAgICBBTExfQ09NTUFORFMucHVzaChtLmNvbW1hbmQpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBSRV9FU0NBUEUgPSAvWy1bXFxde30oKSs/LixcXFxcXiR8I1xcc10vZztcbmNvbnN0IFJFX1BBUkFNID0gLyhbOipdKShcXHcrKS9nO1xuXG5jbGFzcyBSb3V0ZSB7XG4gIGNvbnN0cnVjdG9yIChyb3V0ZSkge1xuICAgIHRoaXMucGFyYW1OYW1lcyA9IFtdO1xuXG4gICAgbGV0IHJlU3RyID0gcm91dGUucmVwbGFjZShSRV9FU0NBUEUsICdcXFxcJCYnKTtcbiAgICByZVN0ciA9IHJlU3RyLnJlcGxhY2UoUkVfUEFSQU0sIChfLCBtb2RlLCBuYW1lKSA9PiB7XG4gICAgICB0aGlzLnBhcmFtTmFtZXMucHVzaChuYW1lKTtcbiAgICAgIHJldHVybiBtb2RlID09PSAnOicgPyAnKFteL10qKScgOiAnKC4qKSc7XG4gICAgfSk7XG4gICAgdGhpcy5yb3V0ZVJlZ2V4cCA9IG5ldyBSZWdFeHAoYF4ke3JlU3RyfSRgKTtcbiAgfVxuXG4gIHBhcnNlICh1cmwpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHVybC5tYXRjaCh0aGlzLnJvdXRlUmVnZXhwKTtcbiAgICBpZiAoIW1hdGNoZXMpIHJldHVybjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjdXJseVxuICAgIGxldCBpID0gMDtcbiAgICBsZXQgcGFyYW1zID0ge307XG4gICAgd2hpbGUgKGkgPCB0aGlzLnBhcmFtTmFtZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwYXJhbU5hbWUgPSB0aGlzLnBhcmFtTmFtZXNbaSsrXTtcbiAgICAgIHBhcmFtc1twYXJhbU5hbWVdID0gbWF0Y2hlc1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxufVxuXG5mdW5jdGlvbiByb3V0ZVRvQ29tbWFuZE5hbWUgKGVuZHBvaW50LCBtZXRob2QpIHtcbiAgbGV0IGRzdFJvdXRlID0gbnVsbDtcblxuICAvLyByZW1vdmUgYW55IHF1ZXJ5IHN0cmluZ1xuICBpZiAoZW5kcG9pbnQuaW5jbHVkZXMoJz8nKSkge1xuICAgIGVuZHBvaW50ID0gZW5kcG9pbnQuc2xpY2UoMCwgZW5kcG9pbnQuaW5kZXhPZignPycpKTtcbiAgfVxuXG4gIGNvbnN0IGFjdHVhbEVuZHBvaW50ID0gZW5kcG9pbnQgPT09ICcvJyA/ICcnIDpcbiAgICAoXy5zdGFydHNXaXRoKGVuZHBvaW50LCAnLycpID8gZW5kcG9pbnQgOiBgLyR7ZW5kcG9pbnR9YCk7XG5cbiAgZm9yIChsZXQgY3VycmVudFJvdXRlIG9mIF8ua2V5cyhNRVRIT0RfTUFQKSkge1xuICAgIGNvbnN0IHJvdXRlID0gbmV3IFJvdXRlKGN1cnJlbnRSb3V0ZSk7XG4gICAgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCB0aGUgYWN0dWFsIHNlc3Npb24gaWQgZm9yIG1hdGNoaW5nXG4gICAgaWYgKHJvdXRlLnBhcnNlKGAvd2QvaHViL3Nlc3Npb24vaWdub3JlZC1zZXNzaW9uLWlkJHthY3R1YWxFbmRwb2ludH1gKSB8fFxuICAgICAgICByb3V0ZS5wYXJzZShgL3dkL2h1YiR7YWN0dWFsRW5kcG9pbnR9YCkgfHwgcm91dGUucGFyc2UoYWN0dWFsRW5kcG9pbnQpKSB7XG4gICAgICBkc3RSb3V0ZSA9IGN1cnJlbnRSb3V0ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoIWRzdFJvdXRlKSByZXR1cm47IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY3VybHlcblxuICBjb25zdCBtZXRob2RzID0gXy5nZXQoTUVUSE9EX01BUCwgZHN0Um91dGUpO1xuICBtZXRob2QgPSBfLnRvVXBwZXIobWV0aG9kKTtcbiAgaWYgKF8uaGFzKG1ldGhvZHMsIG1ldGhvZCkpIHtcbiAgICBjb25zdCBkc3RNZXRob2QgPSBfLmdldChtZXRob2RzLCBtZXRob2QpO1xuICAgIGlmIChkc3RNZXRob2QuY29tbWFuZCkge1xuICAgICAgcmV0dXJuIGRzdE1ldGhvZC5jb21tYW5kO1xuICAgIH1cbiAgfVxufVxuXG4vLyBkcml2ZXIgY29tbWFuZHMgdGhhdCBkbyBub3QgcmVxdWlyZSBhIHNlc3Npb24gdG8gYWxyZWFkeSBleGlzdFxuY29uc3QgTk9fU0VTU0lPTl9JRF9DT01NQU5EUyA9IFsnY3JlYXRlU2Vzc2lvbicsICdnZXRTdGF0dXMnLCAnZ2V0U2Vzc2lvbnMnXTtcblxuZXhwb3J0IHsgTUVUSE9EX01BUCwgQUxMX0NPTU1BTkRTLCBOT19TRVNTSU9OX0lEX0NPTU1BTkRTLCByb3V0ZVRvQ29tbWFuZE5hbWUgfTtcbiJdLCJmaWxlIjoibGliL3Byb3RvY29sL3JvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
