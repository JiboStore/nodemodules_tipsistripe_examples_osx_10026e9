"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.helpers = exports.commands = void 0;

require("source-map-support/register");

var _appiumBaseDriver = require("appium-base-driver");

var _appiumSupport = require("appium-support");

var _logger = _interopRequireDefault(require("../logger"));

var _path = _interopRequireDefault(require("path"));

var _teen_process = require("teen_process");

let commands = {},
    helpers = {},
    extensions = {};
exports.helpers = helpers;
exports.commands = commands;

helpers.getSimFileFullPath = async function (remotePath) {
  let basePath = this.sim.getDir();
  let appName = null;

  if (this.opts.app) {
    let appNameRegex = new RegExp(`\\${_path.default.sep}([\\w-]+\\.app)`);
    let appNameMatches = appNameRegex.exec(this.opts.app);

    if (appNameMatches) {
      appName = appNameMatches[1];
    }
  }

  if (_appiumSupport.system.isWindows()) {
    if (remotePath.indexof("://") === 1) {
      remotePath = remotePath.slice(4);
    }
  } else {
    if (remotePath.indexOf("/") === 0) {
      remotePath = remotePath.slice(1);
    }
  }

  if (remotePath.indexOf(appName) === 0) {
    _logger.default.debug("We want an app-relative file");

    let findPath = basePath;

    if (this.opts.platformVersion >= 8) {
      findPath = _path.default.resolve(basePath, "Containers", "Bundle");
    }

    findPath = findPath.replace(/\s/g, '\\ ');
    let {
      stdout
    } = await (0, _teen_process.exec)('find', [findPath, '-name', appName]);
    let appRoot = stdout.replace(/\n$/, '');
    let subPath = remotePath.substring(appName.length + 1);
    return _path.default.resolve(appRoot, subPath);
  } else {
    _logger.default.debug("We want a sim-relative file");

    return _path.default.resolve(basePath, remotePath);
  }
};

commands.pushFile = async function (remotePath, base64Data) {
  _logger.default.debug(`Pushing ${remotePath} to iOS simulator`);

  if (this.isRealDevice()) {
    _logger.default.debug("Unsupported: cannot write files to physical device");

    throw new _appiumBaseDriver.errors.NotYetImplementedError();
  }

  let fullPath = await this.getSimFileFullPath(remotePath);

  _logger.default.debug(`Attempting to write ${fullPath}...`);

  if (await _appiumSupport.fs.exists(fullPath)) {
    _logger.default.debug(`${fullPath} already exists, deleting...`);

    await _appiumSupport.fs.unlink(fullPath);
  }

  await (0, _appiumSupport.mkdirp)(_path.default.dirname(fullPath));
  let content = Buffer.from(base64Data, 'base64');
  await _appiumSupport.fs.writeFile(fullPath, content);

  _logger.default.debug(`Wrote ${content.length} bytes to ${fullPath}`);
};

commands.pullFile = async function (remotePath) {
  _logger.default.debug(`Pulling ${remotePath} from sim`);

  if (this.isRealDevice()) {
    throw new _appiumBaseDriver.errors.NotYetImplementedError();
  }

  let fullPath = await this.getSimFileFullPath(remotePath);

  _logger.default.debug(`Attempting to read ${fullPath}`);

  let data = await _appiumSupport.fs.readFile(fullPath, {
    encoding: 'base64'
  });
  return data;
};

commands.pullFolder = async function (remotePath) {
  _logger.default.debug(`Pulling '${remotePath}' from sim`);

  if (this.isRealDevice()) {
    throw new _appiumBaseDriver.errors.NotYetImplementedError();
  }

  let fullPath = await this.getSimFileFullPath(remotePath);

  _logger.default.debug(`Adding ${fullPath} to an in-memory zip archive`);

  let buffer = await _appiumSupport.zip.toInMemoryZip(fullPath);

  _logger.default.debug("Converting in-memory zip file to base64 encoded string");

  let data = buffer.toString('base64');

  _logger.default.debug("Returning in-memory zip file as base54 encoded string");

  return data;
};

Object.assign(extensions, commands, helpers);
var _default = extensions;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jb21tYW5kcy9maWxlLW1vdmVtZW50LmpzIl0sIm5hbWVzIjpbImNvbW1hbmRzIiwiaGVscGVycyIsImV4dGVuc2lvbnMiLCJnZXRTaW1GaWxlRnVsbFBhdGgiLCJyZW1vdGVQYXRoIiwiYmFzZVBhdGgiLCJzaW0iLCJnZXREaXIiLCJhcHBOYW1lIiwib3B0cyIsImFwcCIsImFwcE5hbWVSZWdleCIsIlJlZ0V4cCIsInBhdGgiLCJzZXAiLCJhcHBOYW1lTWF0Y2hlcyIsImV4ZWMiLCJzeXN0ZW0iLCJpc1dpbmRvd3MiLCJpbmRleG9mIiwic2xpY2UiLCJpbmRleE9mIiwibG9nZ2VyIiwiZGVidWciLCJmaW5kUGF0aCIsInBsYXRmb3JtVmVyc2lvbiIsInJlc29sdmUiLCJyZXBsYWNlIiwic3Rkb3V0IiwiYXBwUm9vdCIsInN1YlBhdGgiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJwdXNoRmlsZSIsImJhc2U2NERhdGEiLCJpc1JlYWxEZXZpY2UiLCJlcnJvcnMiLCJOb3RZZXRJbXBsZW1lbnRlZEVycm9yIiwiZnVsbFBhdGgiLCJmcyIsImV4aXN0cyIsInVubGluayIsImRpcm5hbWUiLCJjb250ZW50IiwiQnVmZmVyIiwiZnJvbSIsIndyaXRlRmlsZSIsInB1bGxGaWxlIiwiZGF0YSIsInJlYWRGaWxlIiwiZW5jb2RpbmciLCJwdWxsRm9sZGVyIiwiYnVmZmVyIiwiemlwIiwidG9Jbk1lbW9yeVppcCIsInRvU3RyaW5nIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLElBQUlBLFFBQVEsR0FBRyxFQUFmO0FBQUEsSUFBbUJDLE9BQU8sR0FBRyxFQUE3QjtBQUFBLElBQWlDQyxVQUFVLEdBQUcsRUFBOUM7Ozs7QUFXQUQsT0FBTyxDQUFDRSxrQkFBUixHQUE2QixnQkFBZ0JDLFVBQWhCLEVBQTRCO0FBQ3ZELE1BQUlDLFFBQVEsR0FBRyxLQUFLQyxHQUFMLENB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QUFDQSxNQUFJYyxNQUFNLEdBQUcsTUFBTUMsbUJBQUlDLGFBQUosQ0FBa0JoQixRQUFsQixDQUFuQjs7QUFFQWhCLGtCQUFPQyxLQUFQLENBQWEsd0RBQWI7O0FBQ0EsTUFBSXlCLElBQUksR0FBR0ksTUFBTSxDQUFDRyxRQUFQLENBQWdCLFFBQWhCLENBQVg7O0FBQ0FqQyxrQkFBT0MsS0FBUCxDQUFhLHVEQUFiOztBQUNBLFNBQU95QixJQUFQO0FBQ0QsQ0FoQkQ7O0FBa0JBUSxNQUFNLENBQUNDLE1BQVAsQ0FBY3ZELFVBQWQsRUFBMEJGLFFBQTFCLEVBQW9DQyxPQUFwQztlQUVlQyxVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXJyb3JzIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcbmltcG9ydCB7IGZzLCBzeXN0ZW0sIG1rZGlycCwgemlwIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9sb2dnZXInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcblxubGV0IGNvbW1hbmRzID0ge30sIGhlbHBlcnMgPSB7fSwgZXh0ZW5zaW9ucyA9IHt9O1xuXG4vLyBUT0RPOiBtb3JlIGV4cGxpY2l0IGVycm9yIG1lc3NhZ2UgZm9yIGFsbCB0aGUgZmlsZS1tb3ZlbWVudCBjb21tYW5kc1xuXG4vKlxuICogIEdldCB0aGUgZnVsbCBwYXRoIHRvIGFuIGlPUyBzaW11bGF0b3IgZmlsZS5cbiAqICBDYWxscyBjYihlcnIsIGZ1bGxGaWxlUGF0aClcbiAqICAvU29tZS9QYXRoICAgICAgICAgICAgICAgICAgICAgICAgICAgZmV0Y2hlcyBhIGZpbGUgcmVsYXRpdmUgdG8gdGhlIHJvb3Qgb2YgdGhlIGRldmljZSdzIGZpbGVzeXN0ZW0uXG4gKiAgL0FwcGxpY2F0aW9ucy9BcHBOYW1lLmFwcC9Tb21lL1BhdGggIGZldGNoZXMgYSBmaWxlIHJlbGF0aXZlIHRvIHRoZSByb290IG9mIHRoYXQgQXBwbGljYXRpb24ncyAuYXBwIGRpcmVjdG9yeSwgYWRkaW5nIGluIHRoZSBHVUlELlxuICogIFNvIGl0IGxvb2tzIHNvbWV0aGluZyBsaWtlOiAvQXBwbGljYXRpb25zL0dVSUQtR1VJRC1HVUlELUdVSUQvU29tZS9QYXRoXG4gKi9cbmhlbHBlcnMuZ2V0U2ltRmlsZUZ1bGxQYXRoID0gYXN5bmMgZnVuY3Rpb24gKHJlbW90ZVBhdGgpIHtcbiAgbGV0IGJhc2VQYXRoID0gdGhpcy5zaW0uZ2V0RGlyKCk7XG4gIGxldCBhcHBOYW1lID0gbnVsbDtcblxuICBpZiAodGhpcy5vcHRzLmFwcCkge1xuICAgIGxldCBhcHBOYW1lUmVnZXggPSBuZXcgUmVnRXhwKGBcXFxcJHtwYXRoLnNlcH0oW1xcXFx3LV0rXFxcXC5hcHApYCk7XG4gICAgbGV0IGFwcE5hbWVNYXRjaGVzID0gYXBwTmFtZVJlZ2V4LmV4ZWModGhpcy5vcHRzLmFwcCk7XG4gICAgaWYgKGFwcE5hbWVNYXRjaGVzKSB7XG4gICAgICBhcHBOYW1lID0gYXBwTmFtZU1hdGNoZXNbMV07XG4gICAgfVxuICB9XG4gIC8vIGRlLWFic29sdXRpemUgdGhlIHBhdGhcbiAgaWYgKHN5c3RlbS5pc1dpbmRvd3MoKSkge1xuICAgIGlmIChyZW1vdGVQYXRoLmluZGV4b2YoXCI6Ly9cIikgPT09IDEpIHtcbiAgICAgIHJlbW90ZVBhdGggPSByZW1vdGVQYXRoLnNsaWNlKDQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocmVtb3RlUGF0aC5pbmRleE9mKFwiL1wiKSA9PT0gMCkge1xuICAgICAgcmVtb3RlUGF0aCA9IHJlbW90ZVBhdGguc2xpY2UoMSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHJlbW90ZVBhdGguaW5kZXhPZihhcHBOYW1lKSA9PT0gMCkge1xuICAgIGxvZ2dlci5kZWJ1ZyhcIldlIHdhbnQgYW4gYXBwLXJlbGF0aXZlIGZpbGVcIik7XG5cbiAgICBsZXQgZmluZFBhdGggPSBiYXNlUGF0aDtcbiAgICBpZiAodGhpcy5vcHRzLnBsYXRmb3JtVmVyc2lvbiA+PSA4KSB7XG4gICAgICAvLyB0aGUgLmFwcCBmaWxlIGFwcGVhcnMgaW4gL0NvbnRhaW5lcnMvRGF0YSBhbmQgL0NvbnRhaW5lcnMvQnVuZGxlIGJvdGguIFdlIG9ubHkgd2FudCAvQnVuZGxlXG4gICAgICBmaW5kUGF0aCA9IHBhdGgucmVzb2x2ZShiYXNlUGF0aCwgXCJDb250YWluZXJzXCIsIFwiQnVuZGxlXCIpO1xuICAgIH1cbiAgICBmaW5kUGF0aCA9IGZpbmRQYXRoLnJlcGxhY2UoL1xccy9nLCAnXFxcXCAnKTtcblxuICAgIGxldCB7IHN0ZG91dCB9ID0gYXdhaXQgZXhlYygnZmluZCcsIFtmaW5kUGF0aCwgJy1uYW1lJywgYXBwTmFtZV0pO1xuICAgIGxldCBhcHBSb290ID0gc3Rkb3V0LnJlcGxhY2UoL1xcbiQvLCAnJyk7XG4gICAgbGV0IHN1YlBhdGggPSByZW1vdGVQYXRoLnN1YnN0cmluZyhhcHBOYW1lLmxlbmd0aCArIDEpO1xuICAgIHJldHVybiBwYXRoLnJlc29sdmUoYXBwUm9vdCwgc3ViUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgbG9nZ2VyLmRlYnVnKFwiV2Ugd2FudCBhIHNpbS1yZWxhdGl2ZSBmaWxlXCIpO1xuICAgIHJldHVybiBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIHJlbW90ZVBhdGgpO1xuICB9XG59O1xuXG5jb21tYW5kcy5wdXNoRmlsZSA9IGFzeW5jIGZ1bmN0aW9uIChyZW1vdGVQYXRoLCBiYXNlNjREYXRhKSB7XG4gIGxvZ2dlci5kZWJ1ZyhgUHVzaGluZyAke3JlbW90ZVBhdGh9IHRvIGlPUyBzaW11bGF0b3JgKTtcblxuICBpZiAodGhpcy5pc1JlYWxEZXZpY2UoKSkge1xuICAgIGxvZ2dlci5kZWJ1ZyhcIlVuc3VwcG9ydGVkOiBjYW5ub3Qgd3JpdGUgZmlsZXMgdG8gcGh5c2ljYWwgZGV2aWNlXCIpO1xuICAgIHRocm93IG5ldyBlcnJvcnMuTm90WWV0SW1wbGVtZW50ZWRFcnJvcigpO1xuICB9XG5cbiAgbGV0IGZ1bGxQYXRoID0gYXdhaXQgdGhpcy5nZXRTaW1GaWxlRnVsbFBhdGgocmVtb3RlUGF0aCk7XG5cbiAgbG9nZ2VyLmRlYnVnKGBBdHRlbXB0aW5nIHRvIHdyaXRlICR7ZnVsbFBhdGh9Li4uYCk7XG4gIGlmIChhd2FpdCBmcy5leGlzdHMoZnVsbFBhdGgpKSB7XG4gICAgbG9nZ2VyLmRlYnVnKGAke2Z1bGxQYXRofSBhbHJlYWR5IGV4aXN0cywgZGVsZXRpbmcuLi5gKTtcbiAgICBhd2FpdCBmcy51bmxpbmsoZnVsbFBhdGgpO1xuICB9XG4gIGF3YWl0IG1rZGlycChwYXRoLmRpcm5hbWUoZnVsbFBhdGgpKTtcbiAgbGV0IGNvbnRlbnQgPSBCdWZmZXIuZnJvbShiYXNlNjREYXRhLCAnYmFzZTY0Jyk7XG4gIGF3YWl0IGZzLndyaXRlRmlsZShmdWxsUGF0aCwgY29udGVudCk7XG4gIGxvZ2dlci5kZWJ1ZyhgV3JvdGUgJHtjb250ZW50Lmxlbmd0aH0gYnl0ZXMgdG8gJHtmdWxsUGF0aH1gKTtcbn07XG5cbmNvbW1hbmRzLnB1bGxGaWxlID0gYXN5bmMgZnVuY3Rpb24gKHJlbW90ZVBhdGgpIHtcbiAgbG9nZ2VyLmRlYnVnKGBQdWxsaW5nICR7cmVtb3RlUGF0aH0gZnJvbSBzaW1gKTtcblxuICBpZiAodGhpcy5pc1JlYWxEZXZpY2UoKSkge1xuICAgIHRocm93IG5ldyBlcnJvcnMuTm90WWV0SW1wbGVtZW50ZWRFcnJvcigpO1xuICB9XG4gIGxldCBmdWxsUGF0aCA9IGF3YWl0IHRoaXMuZ2V0U2ltRmlsZUZ1bGxQYXRoKHJlbW90ZVBhdGgpO1xuXG4gIGxvZ2dlci5kZWJ1ZyhgQXR0ZW1wdGluZyB0byByZWFkICR7ZnVsbFBhdGh9YCk7XG4gIGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUoZnVsbFBhdGgsIHtlbmNvZGluZzogJ2Jhc2U2NCd9KTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuXG5jb21tYW5kcy5wdWxsRm9sZGVyID0gYXN5bmMgZnVuY3Rpb24gKHJlbW90ZVBhdGgpIHtcbiAgbG9nZ2VyLmRlYnVnKGBQdWxsaW5nICcke3JlbW90ZVBhdGh9JyBmcm9tIHNpbWApO1xuXG4gIGlmICh0aGlzLmlzUmVhbERldmljZSgpKSB7XG4gICAgdGhyb3cgbmV3IGVycm9ycy5Ob3RZZXRJbXBsZW1lbnRlZEVycm9yKCk7XG4gIH1cblxuICBsZXQgZnVsbFBhdGggPSBhd2FpdCB0aGlzLmdldFNpbUZpbGVGdWxsUGF0aChyZW1vdGVQYXRoKTtcblxuICBsb2dnZXIuZGVidWcoYEFkZGluZyAke2Z1bGxQYXRofSB0byBhbiBpbi1tZW1vcnkgemlwIGFyY2hpdmVgKTtcbiAgbGV0IGJ1ZmZlciA9IGF3YWl0IHppcC50b0luTWVtb3J5WmlwKGZ1bGxQYXRoKTtcblxuICBsb2dnZXIuZGVidWcoXCJDb252ZXJ0aW5nIGluLW1lbW9yeSB6aXAgZmlsZSB0byBiYXNlNjQgZW5jb2RlZCBzdHJpbmdcIik7XG4gIGxldCBkYXRhID0gYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgbG9nZ2VyLmRlYnVnKFwiUmV0dXJuaW5nIGluLW1lbW9yeSB6aXAgZmlsZSBhcyBiYXNlNTQgZW5jb2RlZCBzdHJpbmdcIik7XG4gIHJldHVybiBkYXRhO1xufTtcblxuT2JqZWN0LmFzc2lnbihleHRlbnNpb25zLCBjb21tYW5kcywgaGVscGVycyk7XG5leHBvcnQgeyBjb21tYW5kcywgaGVscGVycyB9O1xuZXhwb3J0IGRlZmF1bHQgZXh0ZW5zaW9ucztcbiJdLCJmaWxlIjoibGliL2NvbW1hbmRzL2ZpbGUtbW92ZW1lbnQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
