"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _androidHelpers = _interopRequireDefault(require("../android-helpers"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumSupport = require("appium-support");

var _path = _interopRequireDefault(require("path"));

var _logger = _interopRequireDefault(require("../logger"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _jimp = _interopRequireDefault(require("jimp"));

var _teen_process = require("teen_process");

const swipeStepsPerSec = 28;
const dragStepsPerSec = 40;
const CONTAINER_PATH_MARKER = '@';
const CONTAINER_PATH_PATTERN = new RegExp(`^${CONTAINER_PATH_MARKER}([^/]+)/(.+)`);
const ANDROID_MEDIA_RESCAN_INTENT = 'android.intent.action.MEDIA_SCANNER_SCAN_FILE';
let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

commands.keyevent = async function keyevent(keycode, metastate = null) {
  _logger.default.warn('keyevent will be deprecated use pressKeyCode');

  return await this.pressKeyCode(keycode, metastate);
};

commands.pressKeyCode = async function pressKeyCode(keycode, metastate = null) {
  return await this.bootstrap.sendAction('pressKeyCode', {
    keycode,
    metastate
  });
};

commands.longPressKeyCode = async function longPressKeyCode(keycode, metastate = null) {
  return await this.bootstrap.sendAction('longPressKeyCode', {
    keycode,
    metastate
  });
};

commands.getOrientation = async function getOrientation() {
  let params = {
    naturalOrientation: !!this.opts.androidNaturalOrientation
  };
  let orientation = await this.bootstrap.sendAction('orientation', params);
  return orientation.toUpperCase();
};

commands.setOrientation = async function setOrientation(orientation) {
  orientation = orientation.toUpperCase();
  let params = {
    orientation,
    naturalOrientation: !!this.opts.androidNaturalOrientation
  };
  return await this.bootstrap.sendAction('orientation', params);
};

commands.fakeFlick = async function fakeFlick(xSpeed, ySpeed) {
  return await this.bootstrap.sendAction('flick', {
    xSpeed,
    ySpeed
  });
};

commands.fakeFlickElement = async function fakeFlickElement(elementId, xoffset, yoffset, speed) {
  let params = {
    xoffset,
    yoffset,
    speed,
    elementId
  };
  return await this.bootstrap.sendAction('element:flick', params);
};

commands.swipe = async function swipe(startX, startY, endX, endY, duration, touchCount, elId) {
  if (startX === 'null') {
    startX = 0.5;
  }

  if (startY === 'null') {
    startY = 0.5;
  }

  let swipeOpts = {
    startX,
    startY,
    endX,
    endY,
    steps: Math.round(duration * swipeStepsPerSec)
  };

  if (_appiumSupport.util.hasValue(elId)) {
    swipeOpts.elementId = elId;
  }

  return await this.doSwipe(swipeOpts);
};

commands.doSwipe = async function doSwipe(swipeOpts) {
  if (_appiumSupport.util.hasValue(swipeOpts.elementId)) {
    return await this.bootstrap.sendAction('element:swipe', swipeOpts);
  } else {
    return await this.bootstrap.sendAction('swipe', swipeOpts);
  }
};

commands.pinchClose = async function pinchClose(startX, startY, endX, endY, duration, percent, steps, elId) {
  let pinchOpts = {
    direction: 'in',
    elementId: elId,
    percent,
    steps
  };
  return await this.bootstrap.sendAction('element:pinch', pinchOpts);
};

commands.pinchOpen = async function pinchOpen(startX, startY, endX, endY, duration, percent, steps, elId) {
  let pinchOpts = {
    direction: 'out',
    elementId: elId,
    percent,
    steps
  };
  return await this.bootstrap.sendAction('element:pinch', pinchOpts);
};

commands.flick = async function flick(element, xSpeed, ySpeed, xOffset, yOffset, speed) {
  if (element) {
    await this.fakeFlickElement(element, xOffset, yOffset, speed);
  } else {
    await this.fakeFlick(xSpeed, ySpeed);
  }
};

commands.drag = async function drag(startX, startY, endX, endY, duration, touchCount, elementId, destElId) {
  let dragOpts = {
    elementId,
    destElId,
    startX,
    startY,
    endX,
    endY,
    steps: Math.round(duration * dragStepsPerSec)
  };
  return await this.doDrag(dragOpts);
};

commands.doDrag = async function doDrag(dragOpts) {
  if (_appiumSupport.util.hasValue(dragOpts.elementId)) {
    return await this.bootstrap.sendAction('element:drag', dragOpts);
  } else {
    return await this.bootstrap.sendAction('drag', dragOpts);
  }
};

commands.lock = async function lock(seconds) {
  await this.adb.lock();

  if (isNaN(seconds)) {
    return;
  }

  const floatSeconds = parseFloat(seconds);

  if (floatSeconds <= 0) {
    return;
  }

  await _bluebird.default.delay(1000 * floatSeconds);
  await this.unlock();
};

commands.isLocked = async function isLocked() {
  return await this.adb.isScreenLocked();
};

commands.unlock = async function unlock() {
  return await _androidHelpers.default.unlock(this, this.adb, this.caps);
};

commands.openNotifications = async function openNotifications() {
  return await this.bootstrap.sendAction('openNotification');
};

commands.setLocation = async function setLocation(latitude, longitude) {
  return await this.adb.sendTelnetCommand(`geo fix ${longitude} ${latitude}`);
};

function parseContainerPath(remotePath) {
  const match = CONTAINER_PATH_PATTERN.exec(remotePath);

  if (!match) {
    _logger.default.errorAndThrow(`It is expected that package identifier is separated from the relative path with a single slash. ` + `'${remotePath}' is given instead`);
  }

  return [match[1], _path.default.posix.resolve(`/data/data/${match[1]}`, match[2])];
}

commands.pullFile = async function pullFile(remotePath) {
  if (remotePath.endsWith('/')) {
    _logger.default.errorAndThrow(`It is expected that remote path points to a file and not to a folder. ` + `'${remotePath}' is given instead`);
  }

  let tmpDestination = null;

  if (remotePath.startsWith(CONTAINER_PATH_MARKER)) {
    const [packageId, pathInContainer] = parseContainerPath(remotePath);

    _logger.default.info(`Parsed package identifier '${packageId}' from '${remotePath}'. Will get the data from '${pathInContainer}'`);

    tmpDestination = `/data/local/tmp/${_path.default.posix.basename(pathInContainer)}`;

    try {
      await this.adb.shell(['run-as', packageId, `chmod 777 '${pathInContainer.replace(/'/g, '\\\'')}'`]);
      await this.adb.shell(['cp', '-f', pathInContainer, tmpDestination]);
    } catch (e) {
      _logger.default.errorAndThrow(`Cannot access the container of '${packageId}' application. ` + `Is the application installed and has 'debuggable' build option set to true? ` + `Original error: ${e.message}`);
    }
  }

  const localFile = await _appiumSupport.tempDir.path({
    prefix: 'appium',
    suffix: '.tmp'
  });

  try {
    await this.adb.pull(_lodash.default.isString(tmpDestination) ? tmpDestination : remotePath, localFile);
    const data = await _appiumSupport.fs.readFile(localFile);
    return Buffer.from(data).toString('base64');
  } finally {
    if (await _appiumSupport.fs.exists(localFile)) {
      await _appiumSupport.fs.unlink(localFile);
    }

    if (_lodash.default.isString(tmpDestination)) {
      await this.adb.shell(['rm', '-f', tmpDestination]);
    }
  }
};

commands.pushFile = async function pushFile(remotePath, base64Data) {
  if (remotePath.endsWith('/')) {
    _logger.default.errorAndThrow(`It is expected that remote path points to a file and not to a folder. ` + `'${remotePath}' is given instead`);
  }

  const localFile = await _appiumSupport.tempDir.path({
    prefix: 'appium',
    suffix: '.tmp'
  });

  if (_lodash.default.isArray(base64Data)) {
    base64Data = Buffer.from(base64Data).toString('utf8');
  }

  const content = Buffer.from(base64Data, 'base64');
  let tmpDestination = null;

  try {
    await _appiumSupport.fs.writeFile(localFile, content.toString('binary'), 'binary');

    if (remotePath.startsWith(CONTAINER_PATH_MARKER)) {
      const [packageId, pathInContainer] = parseContainerPath(remotePath);

      _logger.default.info(`Parsed package identifier '${packageId}' from '${remotePath}'. Will put the data into '${pathInContainer}'`);

      tmpDestination = `/data/local/tmp/${_path.default.posix.basename(pathInContainer)}`;

      try {
        await this.adb.shell(['run-as', packageId, `mkdir -p '${_path.default.posix.dirname(pathInContainer).replace(/'/g, '\\\'')}'`]);
        await this.adb.shell(['run-as', packageId, `touch '${pathInContainer.replace(/'/g, '\\\'')}'`]);
        await this.adb.shell(['run-as', packageId, `chmod 777 '${pathInContainer.replace(/'/g, '\\\'')}'`]);
        await this.adb.push(localFile, tmpDestination);
        await this.adb.shell(['cp', '-f', tmpDestination, pathInContainer]);
      } catch (e) {
        _logger.default.errorAndThrow(`Cannot access the container of '${packageId}' application. ` + `Is the application installed and has 'debuggable' build option set to true? ` + `Original error: ${e.message}`);
      }
    } else {
      await this.adb.push(localFile, remotePath);

      _logger.default.info('After pushing media file, broadcasting media scan intent');

      try {
        await this.adb.shell(['am', 'broadcast', '-a', ANDROID_MEDIA_RESCAN_INTENT, '-d', `file://${remotePath}`]);
      } catch (e) {
        _logger.default.warn(`Got error broadcasting media scan intent: ${e.message}; ignoring`);
      }
    }
  } finally {
    if (await _appiumSupport.fs.exists(localFile)) {
      await _appiumSupport.fs.unlink(localFile);
    }

    if (_lodash.default.isString(tmpDestination)) {
      await this.adb.shell(['rm', '-f', tmpDestination]);
    }
  }
};

commands.pullFolder = async function pullFolder(remotePath) {
  let localFolder = await _appiumSupport.tempDir.path({
    prefix: 'appium'
  });
  await this.adb.pull(remotePath, localFolder);
  return (await _appiumSupport.zip.toInMemoryZip(localFolder)).toString('base64');
};

commands.fingerprint = async function fingerprint(fingerprintId) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('fingerprint method is only available for emulators');
  }

  await this.adb.fingerprint(fingerprintId);
};

commands.sendSMS = async function sendSMS(phoneNumber, message) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('sendSMS method is only available for emulators');
  }

  await this.adb.sendSMS(phoneNumber, message);
};

commands.gsmCall = async function gsmCall(phoneNumber, action) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('gsmCall method is only available for emulators');
  }

  await this.adb.gsmCall(phoneNumber, action);
};

commands.gsmSignal = async function gsmSignal(signalStrengh) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('gsmSignal method is only available for emulators');
  }

  await this.adb.gsmSignal(signalStrengh);
};

commands.gsmVoice = async function gsmVoice(state) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('gsmVoice method is only available for emulators');
  }

  await this.adb.gsmVoice(state);
};

commands.powerAC = async function powerAC(state) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('powerAC method is only available for emulators');
  }

  await this.adb.powerAC(state);
};

commands.powerCapacity = async function powerCapacity(batteryPercent) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('powerCapacity method is only available for emulators');
  }

  await this.adb.powerCapacity(batteryPercent);
};

commands.networkSpeed = async function networkSpeed(networkSpeed) {
  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('networkSpeed method is only available for emulators');
  }

  await this.adb.networkSpeed(networkSpeed);
};

commands.sensorSet = async function sensorSet(sensor = {}) {
  const {
    sensorType,
    value
  } = sensor;

  if (!_appiumSupport.util.hasValue(sensorType)) {
    _logger.default.errorAndThrow(`'sensorType' argument is required`);
  }

  if (!_appiumSupport.util.hasValue(value)) {
    _logger.default.errorAndThrow(`'value' argument is required`);
  }

  if (!this.isEmulator()) {
    _logger.default.errorAndThrow('sensorSet method is only available for emulators');
  }

  await this.adb.sensorSet(sensorType, value);
};

helpers.getScreenshotDataWithAdbShell = async function getScreenshotDataWithAdbShell(adb, opts) {
  const localFile = await _appiumSupport.tempDir.path({
    prefix: 'appium',
    suffix: '.png'
  });

  if (await _appiumSupport.fs.exists(localFile)) {
    await _appiumSupport.fs.unlink(localFile);
  }

  try {
    const pngDir = opts.androidScreenshotPath || '/data/local/tmp/';

    const png = _path.default.posix.resolve(pngDir, 'screenshot.png');

    const cmd = ['/system/bin/rm', `${png};`, '/system/bin/screencap', '-p', png];
    await adb.shell(cmd);

    if (!(await adb.fileSize(png))) {
      throw new Error('The size of the taken screenshot equals to zero.');
    }

    await adb.pull(png, localFile);
    return await _jimp.default.read(localFile);
  } finally {
    if (await _appiumSupport.fs.exists(localFile)) {
      await _appiumSupport.fs.unlink(localFile);
    }
  }
};

helpers.getScreenshotDataWithAdbExecOut = async function getScreenshotDataWithAdbExecOut(adb) {
  let {
    stdout,
    stderr,
    code
  } = await (0, _teen_process.exec)(adb.executable.path, adb.executable.defaultArgs.concat(['exec-out', '/system/bin/screencap', '-p']), {
    encoding: 'binary',
    isBuffer: true
  });

  if (code || stderr.length) {
    throw new Error(`Screenshot returned error, code: '${code}', stderr: '${stderr.toString()}'`);
  }

  if (!stdout.length) {
    throw new Error('Screenshot returned no data');
  }

  return await _jimp.default.read(stdout);
};

commands.getScreenshot = async function getScreenshot() {
  const apiLevel = await this.adb.getApiLevel();
  let image = null;

  if (apiLevel > 20) {
    try {
      image = await this.getScreenshotDataWithAdbExecOut(this.adb);
    } catch (e) {
      _logger.default.info(`Cannot get screenshot data with 'adb exec-out' because of '${e.message}'. ` + `Defaulting to 'adb shell' call`);
    }
  }

  if (!image) {
    try {
      image = await this.getScreenshotDataWithAdbShell(this.adb, this.opts);
    } catch (e) {
      const err = `Cannot get screenshot data because of '${e.message}'. ` + `Make sure the 'LayoutParams.FLAG_SECURE' is not set for ` + `the current view`;

      _logger.default.errorAndThrow(err);
    }
  }

  if (apiLevel < 23) {
    let screenOrientation = await this.adb.getScreenOrientation();

    try {
      image = await image.rotate(-90 * screenOrientation);
    } catch (err) {
      _logger.default.warn(`Could not rotate screenshot due to error: ${err}`);
    }
  }

  const getBuffer = _bluebird.default.promisify(image.getBuffer, {
    context: image
  });

  const imgBuffer = await getBuffer(_jimp.default.MIME_PNG);
  return imgBuffer.toString('base64');
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9hY3Rpb25zLmpzIl0sIm5hbWVzIjpbInN3aXBlU3RlcHNQZXJTZWMiLCJkcmFnU3RlcHNQZXJTZWMiLCJDT05UQUlORVJfUEFUSF9NQVJLRVIiLCJDT05UQUlORVJfUEFUSF9QQVRURVJOIiwiUmVnRXhwIiwiQU5EUk9JRF9NRURJQV9SRVNDQU5fSU5URU5UIiwiY29tbWFuZHMiLCJoZWxwZXJzIiwiZXh0ZW5zaW9ucyIsImtleWV2ZW50Iiwia2V5Y29kZSIsIm1ldGFzdGF0ZSIsImxvZyIsIndhcm4iLCJwcmVzc0tleUNvZGUiLCJib290c3RyYXAiLCJzZW5kQWN0aW9uIiwibG9uZ1ByZXNzS2V5Q29kZSIsImdldE9yaWVudGF0aW9uIiwicGFyYW1zIiwibmF0dXJhbE9yaWVudGF0aW9uIiwib3B0cyIsImFuZHJvaWROYXR1cmFsT3JpZW50YXRpb24iLCJvcmllbnRhdGlvbiIsInRvVXBwZXJDYXNlIiwic2V0T3JpZW50YXRpb24iLCJmYWtlRmxpY2siLCJ4U3BlZWQiLCJ5U3BlZWQiLCJmYWtlRmxpY2tFbGVtZW50IiwiZWxlbWVudElkIiwieG9mZnNldCIsInlvZmZzZXQiLCJzcGVlZCIsInN3aXBlIiwic3RhcnRYIiwic3RhcnRZIiwiZW5kWCIsImVuZFkiLCJkdXJhdGlvbiIsInRvdWNoQ291bnQiLCJlbElkIiwic3dpcGVPcHRzIiwic3RlcHMiLCJNYXRoIiwicm91bmQiLCJ1dGlsIiwiaGFzVmFsdWUiLCJkb1N3aXBlIiwicGluY2hDbG9zZSIsInBlcmNlbnQiLCJwaW5jaE9wdHMiLCJkaXJlY3Rpb24iLCJwaW5jaE9wZW4iLCJmbGljayIsImVsZW1lbnQiLCJ4T2Zmc2V0IiwieU9mZnNldCIsImRyYWciLCJkZXN0RWxJZCIsImRyYWdPcHRzIiwiZG9EcmFnIiwibG9jayIsInNlY29uZHMiLCJhZGIiLCJpc05hTiIsImZsb2F0U2Vjb25kcyIsInBhcnNlRmxvYXQiLCJCIiwiZGVsYXkiLCJ1bmxvY2siLCJpc0xvY2tlZCIsImlzU2NyZWVuTG9ja2VkIiwiYW5kcm9pZEhlbHBlcnMiLCJjYXBzIiwib3Blbk5vdGlmaWNhdGlvbnMiLCJzZXRMb2NhdGlvbiIsImxhdGl0dWRlIiwibG9uZ2l0dWRlIiwic2VuZFRlbG5ldENvbW1hbmQiLCJwYXJzZUNvbnRhaW5lclBhdGgiLCJyZW1vdGVQYXRoIiwibWF0Y2giLCJleGVjIiwiZXJyb3JBbmRUaHJvdyIsInBhdGgiLCJwb3NpeCIsInJlc29sdmUiLCJwdWxsRmlsZSIsImVuZHNXaXRoIiwidG1wRGVzdGluYXRpb24iLCJzdGFydHNXaXRoIiwicGFja2FnZUlkIiwicGF0aEluQ29udGFpbmVyIiwiaW5mbyIsImJhc2VuYW1lIiwic2hlbGwiLCJyZXBsYWNlIiwiZSIsIm1lc3NhZ2UiLCJsb2NhbEZpbGUiLCJ0ZW1wRGlyIiwicHJlZml4Iiwic3VmZml4IiwicHVsbCIsIl8iLCJpc1N0cmluZyIsImRhdGEiLCJmcyIsInJlYWRGaWxlIiwiQnVmZmVyIiwiZnJvbSIsInRvU3RyaW5nIiwiZXhpc3RzIiwidW5saW5rIiwicHVzaEZpbGUiLCJiYXNlNjREYXRhIiwiaXNBcnJheSIsImNvbnRlbnQiLCJ3cml0ZUZpbGUiLCJkaXJuYW1lIiwicHVzaCIsInB1bGxGb2xkZXIiLCJsb2NhbEZvbGRlciIsInppcCIsInRvSW5NZW1vcnlaaXAiLCJmaW5nZXJwcmludCIsImZpbmdlcnByaW50SWQiLCJpc0VtdWxhdG9yIiwic2VuZFNNUyIsInBob25lTnVtYmVyIiwiZ3NtQ2FsbCIsImFjdGlvbiIsImdzbVNpZ25hbCIsInNpZ25hbFN0cmVuZ2giLCJnc21Wb2ljZSIsInN0YXRlIiwicG93ZXJBQyIsInBvd2VyQ2FwYWNpdHkiLCJiYXR0ZXJ5UGVyY2VudCIsIm5ldHdvcmtTcGVlZCIsInNlbnNvclNldCIsInNlbnNvciIsInNlbnNvclR5cGUiLCJ2YWx1ZSIsImdldFNjcmVlbnNob3REYXRhV2l0aEFkYlNoZWxsIiwicG5nRGlyIiwiYW5kcm9pZFNjcmVlbnNob3RQYXRoIiwicG5nIiwiY21kIiwiZmlsZVNpemUiLCJFcnJvciIsImppbXAiLCJyZWFkIiwiZ2V0U2NyZWVuc2hvdERhdGFXaXRoQWRiRXhlY091dCIsInN0ZG91dCIsInN0ZGVyciIsImNvZGUiLCJleGVjdXRhYmxlIiwiZGVmYXVsdEFyZ3MiLCJjb25jYXQiLCJlbmNvZGluZyIsImlzQnVmZmVyIiwibGVuZ3RoIiwiZ2V0U2NyZWVuc2hvdCIsImFwaUxldmVsIiwiZ2V0QXBpTGV2ZWwiLCJpbWFnZSIsImVyciIsInNjcmVlbk9yaWVudGF0aW9uIiwiZ2V0U2NyZWVuT3JpZW50YXRpb24iLCJyb3RhdGUiLCJnZXRCdWZmZXIiLCJwcm9taXNpZnkiLCJjb250ZXh0IiwiaW1nQnVmZmVyIiwiTUlNRV9QTkciLCJPYmplY3QiLCJhc3NpZ24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsZ0JBQWdCLEdBQUcsRUFBekI7QUFDQSxNQUFNQyxlQUFlLEdBQUcsRUFBeEI7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxHQUE5QjtBQUVBLE1BQU1DLHNCQUFzQixHQUFHLElBQUlDLE1BQUosQ0FBWSxJQUFHRixxQkFBc0IsY0FBckMsQ0FBL0I7QUFDQSxNQUFNRywyQkFBMkIsR0FBRywrQ0FBcEM7QUFFQSxJQUFJQyxRQUFRLEdBQUcsRUFBZjtBQUFBLElBQW1CQyxPQUFPLEdBQUcsRUFBN0I7QUFBQSxJQUFpQ0MsVUFBVSxHQUFHLEVBQTlDOzs7O0FBRUFGLFFBQVEsQ0FBQ0csUUFBVCxHQUFvQixlQUFlQSxRQUFmLENBQXlCQyxPQUF6QixFQUFrQ0MsU0FBUyxHQUFHLElBQTlDLEVBQW9EO0FBRXRFQyxrQkFBSUMsSUFBSixDQUFTLDhDQUFUOztBQUNBLFNBQU8sTUFBTSxLQUFLQyxZQUFMLENBQWtCSixPQUFsQixFQUEyQkMsU0FBM0IsQ0FBYjtBQUNELENBSkQ7O0FBTUFMLFFBQVEsQ0FBQ1EsWUFBVCxHQUF3QixlQUFlQSxZQUFmLENB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O0FBQ0EsUUFBSTtBQUNGSCxNQUFBQSxLQUFLLEdBQUcsTUFBTUEsS0FBSyxDQUFDSSxNQUFOLENBQWEsQ0FBQyxFQUFELEdBQU1GLGlCQUFuQixDQUFkO0FBQ0QsS0FGRCxDQUVFLE9BQU9ELEdBQVAsRUFBWTtBQUNaNUosc0JBQUlDLElBQUosQ0FBVSw2Q0FBNEMySixHQUFJLEVBQTFEO0FBQ0Q7QUFDRjs7QUFDRCxRQUFNSSxTQUFTLEdBQUd4RyxrQkFBRXlHLFNBQUYsQ0FBWU4sS0FBSyxDQUFDSyxTQUFsQixFQUE2QjtBQUFDRSxJQUFBQSxPQUFPLEVBQUVQO0FBQVYsR0FBN0IsQ0FBbEI7O0FBQ0EsUUFBTVEsU0FBUyxHQUFHLE1BQU1ILFNBQVMsQ0FBQ3BCLGNBQUt3QixRQUFOLENBQWpDO0FBQ0EsU0FBT0QsU0FBUyxDQUFDL0QsUUFBVixDQUFtQixRQUFuQixDQUFQO0FBQ0QsQ0FuQ0Q7O0FBcUNBaUUsTUFBTSxDQUFDQyxNQUFQLENBQWMxSyxVQUFkLEVBQTBCRixRQUExQixFQUFvQ0MsT0FBcEM7ZUFFZUMsVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhbmRyb2lkSGVscGVycyBmcm9tICcuLi9hbmRyb2lkLWhlbHBlcnMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IGZzLCB1dGlsLCB6aXAsIHRlbXBEaXJ9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXInO1xuaW1wb3J0IEIgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGppbXAgZnJvbSAnamltcCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcblxuY29uc3Qgc3dpcGVTdGVwc1BlclNlYyA9IDI4O1xuY29uc3QgZHJhZ1N0ZXBzUGVyU2VjID0gNDA7XG5jb25zdCBDT05UQUlORVJfUEFUSF9NQVJLRVIgPSAnQCc7XG4vLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yL1BMZEIwRy8yXG5jb25zdCBDT05UQUlORVJfUEFUSF9QQVRURVJOID0gbmV3IFJlZ0V4cChgXiR7Q09OVEFJTkVSX1BBVEhfTUFSS0VSfShbXi9dKykvKC4rKWApO1xuY29uc3QgQU5EUk9JRF9NRURJQV9SRVNDQU5fSU5URU5UID0gJ2FuZHJvaWQuaW50ZW50LmFjdGlvbi5NRURJQV9TQ0FOTkVSX1NDQU5fRklMRSc7XG5cbmxldCBjb21tYW5kcyA9IHt9LCBoZWxwZXJzID0ge30sIGV4dGVuc2lvbnMgPSB7fTtcblxuY29tbWFuZHMua2V5ZXZlbnQgPSBhc3luYyBmdW5jdGlvbiBrZXlldmVudCAoa2V5Y29kZSwgbWV0YXN0YXRlID0gbnVsbCkge1xuICAvLyBUT0RPIGRlcHJlY2F0ZSBrZXlldmVudDsgY3VycmVudGx5IHdkIG9ubHkgaW1wbGVtZW50cyBrZXlldmVudFxuICBsb2cud2Fybigna2V5ZXZlbnQgd2lsbCBiZSBkZXByZWNhdGVkIHVzZSBwcmVzc0tleUNvZGUnKTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMucHJlc3NLZXlDb2RlKGtleWNvZGUsIG1ldGFzdGF0ZSk7XG59O1xuXG5jb21tYW5kcy5wcmVzc0tleUNvZGUgPSBhc3luYyBmdW5jdGlvbiBwcmVzc0tleUNvZGUgKGtleWNvZGUsIG1ldGFzdGF0ZSA9IG51bGwpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ3ByZXNzS2V5Q29kZScsIHtrZXljb2RlLCBtZXRhc3RhdGV9KTtcbn07XG5cbmNvbW1hbmRzLmxvbmdQcmVzc0tleUNvZGUgPSBhc3luYyBmdW5jdGlvbiBsb25nUHJlc3NLZXlDb2RlIChrZXljb2RlLCBtZXRhc3RhdGUgPSBudWxsKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdsb25nUHJlc3NLZXlDb2RlJywge2tleWNvZGUsIG1ldGFzdGF0ZX0pO1xufTtcblxuY29tbWFuZHMuZ2V0T3JpZW50YXRpb24gPSBhc3luYyBmdW5jdGlvbiBnZXRPcmllbnRhdGlvbiAoKSB7XG4gIGxldCBwYXJhbXMgPSB7XG4gICAgbmF0dXJhbE9yaWVudGF0aW9uOiAhIXRoaXMub3B0cy5hbmRyb2lkTmF0dXJhbE9yaWVudGF0aW9uLFxuICB9O1xuICBsZXQgb3JpZW50YXRpb24gPSBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdvcmllbnRhdGlvbicsIHBhcmFtcyk7XG4gIHJldHVybiBvcmllbnRhdGlvbi50b1VwcGVyQ2FzZSgpO1xufTtcblxuY29tbWFuZHMuc2V0T3JpZW50YXRpb24gPSBhc3luYyBmdW5jdGlvbiBzZXRPcmllbnRhdGlvbiAob3JpZW50YXRpb24pIHtcbiAgb3JpZW50YXRpb24gPSBvcmllbnRhdGlvbi50b1VwcGVyQ2FzZSgpO1xuICBsZXQgcGFyYW1zID0ge1xuICAgIG9yaWVudGF0aW9uLFxuICAgIG5hdHVyYWxPcmllbnRhdGlvbjogISF0aGlzLm9wdHMuYW5kcm9pZE5hdHVyYWxPcmllbnRhdGlvbixcbiAgfTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ29yaWVudGF0aW9uJywgcGFyYW1zKTtcbn07XG5cbmNvbW1hbmRzLmZha2VGbGljayA9IGFzeW5jIGZ1bmN0aW9uIGZha2VGbGljayAoeFNwZWVkLCB5U3BlZWQpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ2ZsaWNrJywge3hTcGVlZCwgeVNwZWVkfSk7XG59O1xuXG5jb21tYW5kcy5mYWtlRmxpY2tFbGVtZW50ID0gYXN5bmMgZnVuY3Rpb24gZmFrZUZsaWNrRWxlbWVudCAoZWxlbWVudElkLCB4b2Zmc2V0LCB5b2Zmc2V0LCBzcGVlZCkge1xuICBsZXQgcGFyYW1zID0ge3hvZmZzZXQsIHlvZmZzZXQsIHNwZWVkLCBlbGVtZW50SWR9O1xuICByZXR1cm4gYXdhaXQgdGhpcy5ib290c3RyYXAuc2VuZEFjdGlvbignZWxlbWVudDpmbGljaycsIHBhcmFtcyk7XG59O1xuXG5jb21tYW5kcy5zd2lwZSA9IGFzeW5jIGZ1bmN0aW9uIHN3aXBlIChzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSwgZHVyYXRpb24sIHRvdWNoQ291bnQsIGVsSWQpIHtcbiAgaWYgKHN0YXJ0WCA9PT0gJ251bGwnKSB7XG4gICAgc3RhcnRYID0gMC41O1xuICB9XG4gIGlmIChzdGFydFkgPT09ICdudWxsJykge1xuICAgIHN0YXJ0WSA9IDAuNTtcbiAgfVxuICBsZXQgc3dpcGVPcHRzID0ge3N0YXJ0WCwgc3RhcnRZLCBlbmRYLCBlbmRZLFxuICAgICAgICAgICAgICAgICAgIHN0ZXBzOiBNYXRoLnJvdW5kKGR1cmF0aW9uICogc3dpcGVTdGVwc1BlclNlYyl9O1xuICAvLyBnb2luZyB0aGUgbG9uZyB3YXkgYW5kIGNoZWNraW5nIGZvciB1bmRlZmluZWQgYW5kIG51bGwgc2luY2VcbiAgLy8gd2UgY2FuJ3QgYmUgYXNzdXJlZCBgZWxJZGAgaXMgYSBzdHJpbmcgYW5kIG5vdCBhbiBpbnRcbiAgaWYgKHV0aWwuaGFzVmFsdWUoZWxJZCkpIHtcbiAgICBzd2lwZU9wdHMuZWxlbWVudElkID0gZWxJZDtcbiAgfVxuICByZXR1cm4gYXdhaXQgdGhpcy5kb1N3aXBlKHN3aXBlT3B0cyk7XG59O1xuXG5jb21tYW5kcy5kb1N3aXBlID0gYXN5bmMgZnVuY3Rpb24gZG9Td2lwZSAoc3dpcGVPcHRzKSB7XG4gIGlmICh1dGlsLmhhc1ZhbHVlKHN3aXBlT3B0cy5lbGVtZW50SWQpKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ2VsZW1lbnQ6c3dpcGUnLCBzd2lwZU9wdHMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdzd2lwZScsIHN3aXBlT3B0cyk7XG4gIH1cbn07XG5cbmNvbW1hbmRzLnBpbmNoQ2xvc2UgPSBhc3luYyBmdW5jdGlvbiBwaW5jaENsb3NlIChzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSwgZHVyYXRpb24sIHBlcmNlbnQsIHN0ZXBzLCBlbElkKSB7XG4gIGxldCBwaW5jaE9wdHMgPSB7XG4gICAgZGlyZWN0aW9uOiAnaW4nLFxuICAgIGVsZW1lbnRJZDogZWxJZCxcbiAgICBwZXJjZW50LFxuICAgIHN0ZXBzXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdlbGVtZW50OnBpbmNoJywgcGluY2hPcHRzKTtcbn07XG5cbmNvbW1hbmRzLnBpbmNoT3BlbiA9IGFzeW5jIGZ1bmN0aW9uIHBpbmNoT3BlbiAoc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksIGR1cmF0aW9uLCBwZXJjZW50LCBzdGVwcywgZWxJZCkge1xuICBsZXQgcGluY2hPcHRzID0ge2RpcmVjdGlvbjogJ291dCcsIGVsZW1lbnRJZDogZWxJZCwgcGVyY2VudCwgc3RlcHN9O1xuICByZXR1cm4gYXdhaXQgdGhpcy5ib290c3RyYXAuc2VuZEFjdGlvbignZWxlbWVudDpwaW5jaCcsIHBpbmNoT3B0cyk7XG59O1xuXG5jb21tYW5kcy5mbGljayA9IGFzeW5jIGZ1bmN0aW9uIGZsaWNrIChlbGVtZW50LCB4U3BlZWQsIHlTcGVlZCwgeE9mZnNldCwgeU9mZnNldCwgc3BlZWQpIHtcbiAgaWYgKGVsZW1lbnQpIHtcbiAgICBhd2FpdCB0aGlzLmZha2VGbGlja0VsZW1lbnQoZWxlbWVudCwgeE9mZnNldCwgeU9mZnNldCwgc3BlZWQpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHRoaXMuZmFrZUZsaWNrKHhTcGVlZCwgeVNwZWVkKTtcbiAgfVxufTtcblxuY29tbWFuZHMuZHJhZyA9IGFzeW5jIGZ1bmN0aW9uIGRyYWcgKHN0YXJ0WCwgc3RhcnRZLCBlbmRYLCBlbmRZLCBkdXJhdGlvbiwgdG91Y2hDb3VudCwgZWxlbWVudElkLCBkZXN0RWxJZCkge1xuICBsZXQgZHJhZ09wdHMgPSB7XG4gICAgZWxlbWVudElkLCBkZXN0RWxJZCwgc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksXG4gICAgc3RlcHM6IE1hdGgucm91bmQoZHVyYXRpb24gKiBkcmFnU3RlcHNQZXJTZWMpXG4gIH07XG4gIHJldHVybiBhd2FpdCB0aGlzLmRvRHJhZyhkcmFnT3B0cyk7XG5cbn07XG5cbmNvbW1hbmRzLmRvRHJhZyA9IGFzeW5jIGZ1bmN0aW9uIGRvRHJhZyAoZHJhZ09wdHMpIHtcbiAgaWYgKHV0aWwuaGFzVmFsdWUoZHJhZ09wdHMuZWxlbWVudElkKSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdlbGVtZW50OmRyYWcnLCBkcmFnT3B0cyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYm9vdHN0cmFwLnNlbmRBY3Rpb24oJ2RyYWcnLCBkcmFnT3B0cyk7XG4gIH1cbn07XG5cbmNvbW1hbmRzLmxvY2sgPSBhc3luYyBmdW5jdGlvbiBsb2NrIChzZWNvbmRzKSB7XG4gIGF3YWl0IHRoaXMuYWRiLmxvY2soKTtcbiAgaWYgKGlzTmFOKHNlY29uZHMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZmxvYXRTZWNvbmRzID0gcGFyc2VGbG9hdChzZWNvbmRzKTtcbiAgaWYgKGZsb2F0U2Vjb25kcyA8PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGF3YWl0IEIuZGVsYXkoMTAwMCAqIGZsb2F0U2Vjb25kcyk7XG4gIGF3YWl0IHRoaXMudW5sb2NrKCk7XG59O1xuXG5jb21tYW5kcy5pc0xvY2tlZCA9IGFzeW5jIGZ1bmN0aW9uIGlzTG9ja2VkICgpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYWRiLmlzU2NyZWVuTG9ja2VkKCk7XG59O1xuXG5jb21tYW5kcy51bmxvY2sgPSBhc3luYyBmdW5jdGlvbiB1bmxvY2sgKCkge1xuICByZXR1cm4gYXdhaXQgYW5kcm9pZEhlbHBlcnMudW5sb2NrKHRoaXMsIHRoaXMuYWRiLCB0aGlzLmNhcHMpO1xufTtcblxuY29tbWFuZHMub3Blbk5vdGlmaWNhdGlvbnMgPSBhc3luYyBmdW5jdGlvbiBvcGVuTm90aWZpY2F0aW9ucyAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmJvb3RzdHJhcC5zZW5kQWN0aW9uKCdvcGVuTm90aWZpY2F0aW9uJyk7XG59O1xuXG5jb21tYW5kcy5zZXRMb2NhdGlvbiA9IGFzeW5jIGZ1bmN0aW9uIHNldExvY2F0aW9uIChsYXRpdHVkZSwgbG9uZ2l0dWRlKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmFkYi5zZW5kVGVsbmV0Q29tbWFuZChgZ2VvIGZpeCAke2xvbmdpdHVkZX0gJHtsYXRpdHVkZX1gKTtcbn07XG5cbmZ1bmN0aW9uIHBhcnNlQ29udGFpbmVyUGF0aCAocmVtb3RlUGF0aCkge1xuICBjb25zdCBtYXRjaCA9IENPTlRBSU5FUl9QQVRIX1BBVFRFUk4uZXhlYyhyZW1vdGVQYXRoKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KGBJdCBpcyBleHBlY3RlZCB0aGF0IHBhY2thZ2UgaWRlbnRpZmllciBpcyBzZXBhcmF0ZWQgZnJvbSB0aGUgcmVsYXRpdmUgcGF0aCB3aXRoIGEgc2luZ2xlIHNsYXNoLiBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgJyR7cmVtb3RlUGF0aH0nIGlzIGdpdmVuIGluc3RlYWRgKTtcbiAgfVxuICByZXR1cm4gW21hdGNoWzFdLCBwYXRoLnBvc2l4LnJlc29sdmUoYC9kYXRhL2RhdGEvJHttYXRjaFsxXX1gLCBtYXRjaFsyXSldO1xufVxuXG5jb21tYW5kcy5wdWxsRmlsZSA9IGFzeW5jIGZ1bmN0aW9uIHB1bGxGaWxlIChyZW1vdGVQYXRoKSB7XG4gIGlmIChyZW1vdGVQYXRoLmVuZHNXaXRoKCcvJykpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgSXQgaXMgZXhwZWN0ZWQgdGhhdCByZW1vdGUgcGF0aCBwb2ludHMgdG8gYSBmaWxlIGFuZCBub3QgdG8gYSBmb2xkZXIuIGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGAnJHtyZW1vdGVQYXRofScgaXMgZ2l2ZW4gaW5zdGVhZGApO1xuICB9XG4gIGxldCB0bXBEZXN0aW5hdGlvbiA9IG51bGw7XG4gIGlmIChyZW1vdGVQYXRoLnN0YXJ0c1dpdGgoQ09OVEFJTkVSX1BBVEhfTUFSS0VSKSkge1xuICAgIGNvbnN0IFtwYWNrYWdlSWQsIHBhdGhJbkNvbnRhaW5lcl0gPSBwYXJzZUNvbnRhaW5lclBhdGgocmVtb3RlUGF0aCk7XG4gICAgbG9nLmluZm8oYFBhcnNlZCBwYWNrYWdlIGlkZW50aWZpZXIgJyR7cGFja2FnZUlkfScgZnJvbSAnJHtyZW1vdGVQYXRofScuIFdpbGwgZ2V0IHRoZSBkYXRhIGZyb20gJyR7cGF0aEluQ29udGFpbmVyfSdgKTtcbiAgICB0bXBEZXN0aW5hdGlvbiA9IGAvZGF0YS9sb2NhbC90bXAvJHtwYXRoLnBvc2l4LmJhc2VuYW1lKHBhdGhJbkNvbnRhaW5lcil9YDtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydydW4tYXMnLCBwYWNrYWdlSWQsIGBjaG1vZCA3NzcgJyR7cGF0aEluQ29udGFpbmVyLnJlcGxhY2UoLycvZywgJ1xcXFxcXCcnKX0nYF0pO1xuICAgICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydjcCcsICctZicsIHBhdGhJbkNvbnRhaW5lciwgdG1wRGVzdGluYXRpb25dKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgQ2Fubm90IGFjY2VzcyB0aGUgY29udGFpbmVyIG9mICcke3BhY2thZ2VJZH0nIGFwcGxpY2F0aW9uLiBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGBJcyB0aGUgYXBwbGljYXRpb24gaW5zdGFsbGVkIGFuZCBoYXMgJ2RlYnVnZ2FibGUnIGJ1aWxkIG9wdGlvbiBzZXQgdG8gdHJ1ZT8gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuICBjb25zdCBsb2NhbEZpbGUgPSBhd2FpdCB0ZW1wRGlyLnBhdGgoe3ByZWZpeDogJ2FwcGl1bScsIHN1ZmZpeDogJy50bXAnfSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy5hZGIucHVsbChfLmlzU3RyaW5nKHRtcERlc3RpbmF0aW9uKSA/IHRtcERlc3RpbmF0aW9uIDogcmVtb3RlUGF0aCwgbG9jYWxGaWxlKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUobG9jYWxGaWxlKTtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oZGF0YSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhd2FpdCBmcy5leGlzdHMobG9jYWxGaWxlKSkge1xuICAgICAgYXdhaXQgZnMudW5saW5rKGxvY2FsRmlsZSk7XG4gICAgfVxuICAgIGlmIChfLmlzU3RyaW5nKHRtcERlc3RpbmF0aW9uKSkge1xuICAgICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydybScsICctZicsIHRtcERlc3RpbmF0aW9uXSk7XG4gICAgfVxuICB9XG59O1xuXG5jb21tYW5kcy5wdXNoRmlsZSA9IGFzeW5jIGZ1bmN0aW9uIHB1c2hGaWxlIChyZW1vdGVQYXRoLCBiYXNlNjREYXRhKSB7XG4gIGlmIChyZW1vdGVQYXRoLmVuZHNXaXRoKCcvJykpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgSXQgaXMgZXhwZWN0ZWQgdGhhdCByZW1vdGUgcGF0aCBwb2ludHMgdG8gYSBmaWxlIGFuZCBub3QgdG8gYSBmb2xkZXIuIGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGAnJHtyZW1vdGVQYXRofScgaXMgZ2l2ZW4gaW5zdGVhZGApO1xuICB9XG4gIGNvbnN0IGxvY2FsRmlsZSA9IGF3YWl0IHRlbXBEaXIucGF0aCh7cHJlZml4OiAnYXBwaXVtJywgc3VmZml4OiAnLnRtcCd9KTtcbiAgaWYgKF8uaXNBcnJheShiYXNlNjREYXRhKSkge1xuICAgIC8vIHNvbWUgY2xpZW50cyAoYWhlbSkgamF2YSwgc2VuZCBhIGJ5dGUgYXJyYXkgZW5jb2RpbmcgdXRmOCBjaGFyYWN0ZXJzXG4gICAgLy8gaW5zdGVhZCBvZiBhIHN0cmluZywgd2hpY2ggd291bGQgYmUgaW5maW5pdGVseSBiZXR0ZXIhXG4gICAgYmFzZTY0RGF0YSA9IEJ1ZmZlci5mcm9tKGJhc2U2NERhdGEpLnRvU3RyaW5nKCd1dGY4Jyk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IEJ1ZmZlci5mcm9tKGJhc2U2NERhdGEsICdiYXNlNjQnKTtcbiAgbGV0IHRtcERlc3RpbmF0aW9uID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUobG9jYWxGaWxlLCBjb250ZW50LnRvU3RyaW5nKCdiaW5hcnknKSwgJ2JpbmFyeScpO1xuICAgIGlmIChyZW1vdGVQYXRoLnN0YXJ0c1dpdGgoQ09OVEFJTkVSX1BBVEhfTUFSS0VSKSkge1xuICAgICAgY29uc3QgW3BhY2thZ2VJZCwgcGF0aEluQ29udGFpbmVyXSA9IHBhcnNlQ29udGFpbmVyUGF0aChyZW1vdGVQYXRoKTtcbiAgICAgIGxvZy5pbmZvKGBQYXJzZWQgcGFja2FnZSBpZGVudGlmaWVyICcke3BhY2thZ2VJZH0nIGZyb20gJyR7cmVtb3RlUGF0aH0nLiBXaWxsIHB1dCB0aGUgZGF0YSBpbnRvICcke3BhdGhJbkNvbnRhaW5lcn0nYCk7XG4gICAgICB0bXBEZXN0aW5hdGlvbiA9IGAvZGF0YS9sb2NhbC90bXAvJHtwYXRoLnBvc2l4LmJhc2VuYW1lKHBhdGhJbkNvbnRhaW5lcil9YDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRiLnNoZWxsKFxuICAgICAgICAgIFsncnVuLWFzJywgcGFja2FnZUlkLCBgbWtkaXIgLXAgJyR7cGF0aC5wb3NpeC5kaXJuYW1lKHBhdGhJbkNvbnRhaW5lcikucmVwbGFjZSgvJy9nLCAnXFxcXFxcJycpfSdgXVxuICAgICAgICApO1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5zaGVsbChbJ3J1bi1hcycsIHBhY2thZ2VJZCwgYHRvdWNoICcke3BhdGhJbkNvbnRhaW5lci5yZXBsYWNlKC8nL2csICdcXFxcXFwnJyl9J2BdKTtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydydW4tYXMnLCBwYWNrYWdlSWQsIGBjaG1vZCA3NzcgJyR7cGF0aEluQ29udGFpbmVyLnJlcGxhY2UoLycvZywgJ1xcXFxcXCcnKX0nYF0pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5wdXNoKGxvY2FsRmlsZSwgdG1wRGVzdGluYXRpb24pO1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5zaGVsbChbJ2NwJywgJy1mJywgdG1wRGVzdGluYXRpb24sIHBhdGhJbkNvbnRhaW5lcl0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBsb2cuZXJyb3JBbmRUaHJvdyhgQ2Fubm90IGFjY2VzcyB0aGUgY29udGFpbmVyIG9mICcke3BhY2thZ2VJZH0nIGFwcGxpY2F0aW9uLiBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYElzIHRoZSBhcHBsaWNhdGlvbiBpbnN0YWxsZWQgYW5kIGhhcyAnZGVidWdnYWJsZScgYnVpbGQgb3B0aW9uIHNldCB0byB0cnVlPyBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYWRiIHB1c2ggY3JlYXRlcyBmb2xkZXJzIGFuZCBvdmVyd3JpdGVzIGV4aXN0aW5nIGZpbGVzLlxuICAgICAgYXdhaXQgdGhpcy5hZGIucHVzaChsb2NhbEZpbGUsIHJlbW90ZVBhdGgpO1xuXG4gICAgICAvLyBpZiB3ZSBoYXZlIHB1c2hlZCBhIGZpbGUsIGl0IG1pZ2h0IGJlIGEgbWVkaWEgZmlsZSwgc28gZW5zdXJlIHRoYXRcbiAgICAgIC8vIGFwcHMga25vdyBhYm91dCBpdFxuICAgICAgbG9nLmluZm8oJ0FmdGVyIHB1c2hpbmcgbWVkaWEgZmlsZSwgYnJvYWRjYXN0aW5nIG1lZGlhIHNjYW4gaW50ZW50Jyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmFkYi5zaGVsbChbJ2FtJywgJ2Jyb2FkY2FzdCcsICctYScsXG4gICAgICAgICAgQU5EUk9JRF9NRURJQV9SRVNDQU5fSU5URU5ULCAnLWQnLCBgZmlsZTovLyR7cmVtb3RlUGF0aH1gXSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZy53YXJuKGBHb3QgZXJyb3IgYnJvYWRjYXN0aW5nIG1lZGlhIHNjYW4gaW50ZW50OiAke2UubWVzc2FnZX07IGlnbm9yaW5nYCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChhd2FpdCBmcy5leGlzdHMobG9jYWxGaWxlKSkge1xuICAgICAgYXdhaXQgZnMudW5saW5rKGxvY2FsRmlsZSk7XG4gICAgfVxuICAgIGlmIChfLmlzU3RyaW5nKHRtcERlc3RpbmF0aW9uKSkge1xuICAgICAgYXdhaXQgdGhpcy5hZGIuc2hlbGwoWydybScsICctZicsIHRtcERlc3RpbmF0aW9uXSk7XG4gICAgfVxuICB9XG59O1xuXG5jb21tYW5kcy5wdWxsRm9sZGVyID0gYXN5bmMgZnVuY3Rpb24gcHVsbEZvbGRlciAocmVtb3RlUGF0aCkge1xuICBsZXQgbG9jYWxGb2xkZXIgPSBhd2FpdCB0ZW1wRGlyLnBhdGgoe3ByZWZpeDogJ2FwcGl1bSd9KTtcbiAgYXdhaXQgdGhpcy5hZGIucHVsbChyZW1vdGVQYXRoLCBsb2NhbEZvbGRlcik7XG4gIHJldHVybiAoYXdhaXQgemlwLnRvSW5NZW1vcnlaaXAobG9jYWxGb2xkZXIpKS50b1N0cmluZygnYmFzZTY0Jyk7XG59O1xuXG5jb21tYW5kcy5maW5nZXJwcmludCA9IGFzeW5jIGZ1bmN0aW9uIGZpbmdlcnByaW50IChmaW5nZXJwcmludElkKSB7XG4gIGlmICghdGhpcy5pc0VtdWxhdG9yKCkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdygnZmluZ2VycHJpbnQgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGZvciBlbXVsYXRvcnMnKTtcbiAgfVxuICBhd2FpdCB0aGlzLmFkYi5maW5nZXJwcmludChmaW5nZXJwcmludElkKTtcbn07XG5cbmNvbW1hbmRzLnNlbmRTTVMgPSBhc3luYyBmdW5jdGlvbiBzZW5kU01TIChwaG9uZU51bWJlciwgbWVzc2FnZSkge1xuICBpZiAoIXRoaXMuaXNFbXVsYXRvcigpKSB7XG4gICAgbG9nLmVycm9yQW5kVGhyb3coJ3NlbmRTTVMgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGZvciBlbXVsYXRvcnMnKTtcbiAgfVxuICBhd2FpdCB0aGlzLmFkYi5zZW5kU01TKHBob25lTnVtYmVyLCBtZXNzYWdlKTtcbn07XG5cbmNvbW1hbmRzLmdzbUNhbGwgPSBhc3luYyBmdW5jdGlvbiBnc21DYWxsIChwaG9uZU51bWJlciwgYWN0aW9uKSB7XG4gIGlmICghdGhpcy5pc0VtdWxhdG9yKCkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdygnZ3NtQ2FsbCBtZXRob2QgaXMgb25seSBhdmFpbGFibGUgZm9yIGVtdWxhdG9ycycpO1xuICB9XG4gIGF3YWl0IHRoaXMuYWRiLmdzbUNhbGwocGhvbmVOdW1iZXIsIGFjdGlvbik7XG59O1xuXG5jb21tYW5kcy5nc21TaWduYWwgPSBhc3luYyBmdW5jdGlvbiBnc21TaWduYWwgKHNpZ25hbFN0cmVuZ2gpIHtcbiAgaWYgKCF0aGlzLmlzRW11bGF0b3IoKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KCdnc21TaWduYWwgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGZvciBlbXVsYXRvcnMnKTtcbiAgfVxuICBhd2FpdCB0aGlzLmFkYi5nc21TaWduYWwoc2lnbmFsU3RyZW5naCk7XG59O1xuXG5jb21tYW5kcy5nc21Wb2ljZSA9IGFzeW5jIGZ1bmN0aW9uIGdzbVZvaWNlIChzdGF0ZSkge1xuICBpZiAoIXRoaXMuaXNFbXVsYXRvcigpKSB7XG4gICAgbG9nLmVycm9yQW5kVGhyb3coJ2dzbVZvaWNlIG1ldGhvZCBpcyBvbmx5IGF2YWlsYWJsZSBmb3IgZW11bGF0b3JzJyk7XG4gIH1cbiAgYXdhaXQgdGhpcy5hZGIuZ3NtVm9pY2Uoc3RhdGUpO1xufTtcblxuY29tbWFuZHMucG93ZXJBQyA9IGFzeW5jIGZ1bmN0aW9uIHBvd2VyQUMgKHN0YXRlKSB7XG4gIGlmICghdGhpcy5pc0VtdWxhdG9yKCkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdygncG93ZXJBQyBtZXRob2QgaXMgb25seSBhdmFpbGFibGUgZm9yIGVtdWxhdG9ycycpO1xuICB9XG4gIGF3YWl0IHRoaXMuYWRiLnBvd2VyQUMoc3RhdGUpO1xufTtcblxuY29tbWFuZHMucG93ZXJDYXBhY2l0eSA9IGFzeW5jIGZ1bmN0aW9uIHBvd2VyQ2FwYWNpdHkgKGJhdHRlcnlQZXJjZW50KSB7XG4gIGlmICghdGhpcy5pc0VtdWxhdG9yKCkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdygncG93ZXJDYXBhY2l0eSBtZXRob2QgaXMgb25seSBhdmFpbGFibGUgZm9yIGVtdWxhdG9ycycpO1xuICB9XG4gIGF3YWl0IHRoaXMuYWRiLnBvd2VyQ2FwYWNpdHkoYmF0dGVyeVBlcmNlbnQpO1xufTtcblxuY29tbWFuZHMubmV0d29ya1NwZWVkID0gYXN5bmMgZnVuY3Rpb24gbmV0d29ya1NwZWVkIChuZXR3b3JrU3BlZWQpIHtcbiAgaWYgKCF0aGlzLmlzRW11bGF0b3IoKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KCduZXR3b3JrU3BlZWQgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGZvciBlbXVsYXRvcnMnKTtcbiAgfVxuICBhd2FpdCB0aGlzLmFkYi5uZXR3b3JrU3BlZWQobmV0d29ya1NwZWVkKTtcbn07XG5cbi8qKlxuICogRW11bGF0ZSBzZW5zb3JzIHZhbHVlcyBvbiB0aGUgY29ubmVjdGVkIGVtdWxhdG9yLlxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFNlbnNvclxuICogQHByb3BlcnR5IHtzdHJpbmd9IHNlbnNvclR5cGUgLSBzZW5zb3IgdHlwZSBkZWNsYXJlZCBpbiBhZGIuU0VOU09SU1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdmFsdWUgdG8gc2V0IHRvIHRoZSBzZW5zb3JcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gU2Vuc29yXG4gKiBAdGhyb3dzIHtFcnJvcn0gLSBJZiBzZW5zb3JUeXBlIGlzIG5vdCBkZWZpbmVkXG4gKiBAdGhyb3dzIHtFcnJvcn0gLSBJZiB2YWx1ZSBmb3IgdGhlIHNlIHNvciBpcyBub3QgZGVmaW5lZFxuICogQHRocm93cyB7RXJyb3J9IC0gSWYgZGV2aWNlVHlwZSBpcyBub3QgYW4gZW11bGF0b3JcbiAqL1xuY29tbWFuZHMuc2Vuc29yU2V0ID0gYXN5bmMgZnVuY3Rpb24gc2Vuc29yU2V0IChzZW5zb3IgPSB7fSkge1xuICBjb25zdCB7c2Vuc29yVHlwZSwgdmFsdWV9ID0gc2Vuc29yO1xuICBpZiAoIXV0aWwuaGFzVmFsdWUoc2Vuc29yVHlwZSkpIHtcbiAgICBsb2cuZXJyb3JBbmRUaHJvdyhgJ3NlbnNvclR5cGUnIGFyZ3VtZW50IGlzIHJlcXVpcmVkYCk7XG4gIH1cbiAgaWYgKCF1dGlsLmhhc1ZhbHVlKHZhbHVlKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KGAndmFsdWUnIGFyZ3VtZW50IGlzIHJlcXVpcmVkYCk7XG4gIH1cbiAgaWYgKCF0aGlzLmlzRW11bGF0b3IoKSkge1xuICAgIGxvZy5lcnJvckFuZFRocm93KCdzZW5zb3JTZXQgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGZvciBlbXVsYXRvcnMnKTtcbiAgfVxuICBhd2FpdCB0aGlzLmFkYi5zZW5zb3JTZXQoc2Vuc29yVHlwZSwgdmFsdWUpO1xufTtcblxuaGVscGVycy5nZXRTY3JlZW5zaG90RGF0YVdpdGhBZGJTaGVsbCA9IGFzeW5jIGZ1bmN0aW9uIGdldFNjcmVlbnNob3REYXRhV2l0aEFkYlNoZWxsIChhZGIsIG9wdHMpIHtcbiAgY29uc3QgbG9jYWxGaWxlID0gYXdhaXQgdGVtcERpci5wYXRoKHtwcmVmaXg6ICdhcHBpdW0nLCBzdWZmaXg6ICcucG5nJ30pO1xuICBpZiAoYXdhaXQgZnMuZXhpc3RzKGxvY2FsRmlsZSkpIHtcbiAgICBhd2FpdCBmcy51bmxpbmsobG9jYWxGaWxlKTtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHBuZ0RpciA9IG9wdHMuYW5kcm9pZFNjcmVlbnNob3RQYXRoIHx8ICcvZGF0YS9sb2NhbC90bXAvJztcbiAgICBjb25zdCBwbmcgPSBwYXRoLnBvc2l4LnJlc29sdmUocG5nRGlyLCAnc2NyZWVuc2hvdC5wbmcnKTtcbiAgICBjb25zdCBjbWQgPSBbJy9zeXN0ZW0vYmluL3JtJywgYCR7cG5nfTtgLCAnL3N5c3RlbS9iaW4vc2NyZWVuY2FwJywgJy1wJywgcG5nXTtcbiAgICBhd2FpdCBhZGIuc2hlbGwoY21kKTtcbiAgICBpZiAoIWF3YWl0IGFkYi5maWxlU2l6ZShwbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzaXplIG9mIHRoZSB0YWtlbiBzY3JlZW5zaG90IGVxdWFscyB0byB6ZXJvLicpO1xuICAgIH1cbiAgICBhd2FpdCBhZGIucHVsbChwbmcsIGxvY2FsRmlsZSk7XG4gICAgcmV0dXJuIGF3YWl0IGppbXAucmVhZChsb2NhbEZpbGUpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhd2FpdCBmcy5leGlzdHMobG9jYWxGaWxlKSkge1xuICAgICAgYXdhaXQgZnMudW5saW5rKGxvY2FsRmlsZSk7XG4gICAgfVxuICB9XG59O1xuXG5oZWxwZXJzLmdldFNjcmVlbnNob3REYXRhV2l0aEFkYkV4ZWNPdXQgPSBhc3luYyBmdW5jdGlvbiBnZXRTY3JlZW5zaG90RGF0YVdpdGhBZGJFeGVjT3V0IChhZGIpIHtcbiAgbGV0IHtzdGRvdXQsIHN0ZGVyciwgY29kZX0gPSBhd2FpdCBleGVjKGFkYi5leGVjdXRhYmxlLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGIuZXhlY3V0YWJsZS5kZWZhdWx0QXJnc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY29uY2F0KFsnZXhlYy1vdXQnLCAnL3N5c3RlbS9iaW4vc2NyZWVuY2FwJywgJy1wJ10pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VuY29kaW5nOiAnYmluYXJ5JywgaXNCdWZmZXI6IHRydWV9KTtcbiAgLy8gaWYgdGhlcmUgaXMgYW4gZXJyb3IsIHRocm93XG4gIGlmIChjb2RlIHx8IHN0ZGVyci5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFNjcmVlbnNob3QgcmV0dXJuZWQgZXJyb3IsIGNvZGU6ICcke2NvZGV9Jywgc3RkZXJyOiAnJHtzdGRlcnIudG9TdHJpbmcoKX0nYCk7XG4gIH1cbiAgLy8gaWYgd2UgZG9uJ3QgZ2V0IGFueXRoaW5nIGF0IGFsbCwgdGhyb3dcbiAgaWYgKCFzdGRvdXQubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdTY3JlZW5zaG90IHJldHVybmVkIG5vIGRhdGEnKTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBqaW1wLnJlYWQoc3Rkb3V0KTtcbn07XG5cbmNvbW1hbmRzLmdldFNjcmVlbnNob3QgPSBhc3luYyBmdW5jdGlvbiBnZXRTY3JlZW5zaG90ICgpIHtcbiAgY29uc3QgYXBpTGV2ZWwgPSBhd2FpdCB0aGlzLmFkYi5nZXRBcGlMZXZlbCgpO1xuICBsZXQgaW1hZ2UgPSBudWxsO1xuICBpZiAoYXBpTGV2ZWwgPiAyMCkge1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGlzIHNjcmVlbnNob3RpbmcgYXBwcm9hY2ggaXMgd2F5IGZhc3Rlciwgc2luY2UgaXQgcmVxdWlyZXMgbGVzcyBleHRlcm5hbCBjb21tYW5kc1xuICAgICAgLy8gdG8gYmUgZXhlY3V0ZWQuIFVuZm9ydHVuYXRlbHksIGV4ZWMtb3V0IG9wdGlvbiBpcyBvbmx5IHN1cHBvcnRlZCBieSBuZXdlciBBbmRyb2lkL1NESyB2ZXJzaW9ucyAoNS4wIGFuZCBsYXRlcilcbiAgICAgIGltYWdlID0gYXdhaXQgdGhpcy5nZXRTY3JlZW5zaG90RGF0YVdpdGhBZGJFeGVjT3V0KHRoaXMuYWRiKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuaW5mbyhgQ2Fubm90IGdldCBzY3JlZW5zaG90IGRhdGEgd2l0aCAnYWRiIGV4ZWMtb3V0JyBiZWNhdXNlIG9mICcke2UubWVzc2FnZX0nLiBgICtcbiAgICAgICAgICAgICAgIGBEZWZhdWx0aW5nIHRvICdhZGIgc2hlbGwnIGNhbGxgKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFpbWFnZSkge1xuICAgIHRyeSB7XG4gICAgICBpbWFnZSA9IGF3YWl0IHRoaXMuZ2V0U2NyZWVuc2hvdERhdGFXaXRoQWRiU2hlbGwodGhpcy5hZGIsIHRoaXMub3B0cyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyID0gYENhbm5vdCBnZXQgc2NyZWVuc2hvdCBkYXRhIGJlY2F1c2Ugb2YgJyR7ZS5tZXNzYWdlfScuIGAgK1xuICAgICAgICAgICAgICAgICAgYE1ha2Ugc3VyZSB0aGUgJ0xheW91dFBhcmFtcy5GTEFHX1NFQ1VSRScgaXMgbm90IHNldCBmb3IgYCArXG4gICAgICAgICAgICAgICAgICBgdGhlIGN1cnJlbnQgdmlld2A7XG4gICAgICBsb2cuZXJyb3JBbmRUaHJvdyhlcnIpO1xuICAgIH1cbiAgfVxuICBpZiAoYXBpTGV2ZWwgPCAyMykge1xuICAgIC8vIEFuZHJvaWQgYnVnIDg0MzM3NDIgLSByb3RhdGUgc2NyZWVuc2hvdCBpZiBzY3JlZW4gaXMgcm90YXRlZFxuICAgIGxldCBzY3JlZW5PcmllbnRhdGlvbiA9IGF3YWl0IHRoaXMuYWRiLmdldFNjcmVlbk9yaWVudGF0aW9uKCk7XG4gICAgdHJ5IHtcbiAgICAgIGltYWdlID0gYXdhaXQgaW1hZ2Uucm90YXRlKC05MCAqIHNjcmVlbk9yaWVudGF0aW9uKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZy53YXJuKGBDb3VsZCBub3Qgcm90YXRlIHNjcmVlbnNob3QgZHVlIHRvIGVycm9yOiAke2Vycn1gKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgZ2V0QnVmZmVyID0gQi5wcm9taXNpZnkoaW1hZ2UuZ2V0QnVmZmVyLCB7Y29udGV4dDogaW1hZ2V9KTtcbiAgY29uc3QgaW1nQnVmZmVyID0gYXdhaXQgZ2V0QnVmZmVyKGppbXAuTUlNRV9QTkcpO1xuICByZXR1cm4gaW1nQnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcbn07XG5cbk9iamVjdC5hc3NpZ24oZXh0ZW5zaW9ucywgY29tbWFuZHMsIGhlbHBlcnMpO1xuZXhwb3J0IHsgY29tbWFuZHMsIGhlbHBlcnMgfTtcbmV4cG9ydCBkZWZhdWx0IGV4dGVuc2lvbnM7XG4iXSwiZmlsZSI6ImxpYi9jb21tYW5kcy9hY3Rpb25zLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
