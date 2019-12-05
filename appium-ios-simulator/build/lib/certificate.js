"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrustStore = exports.Certificate = exports.default = void 0;

require("source-map-support/register");

var _crypto = _interopRequireDefault(require("crypto"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _path = _interopRequireDefault(require("path"));

var _appiumSupport = require("appium-support");

var _utils = require("./utils");

const openssl = _bluebird.default.promisify(require('openssl-wrapper').exec);

const tset = `<?xml version="1.0" encoding="UTF-8"?>\n
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <array/>
</plist>`;

class Certificate {
  constructor(pemFilename) {
    this.pemFilename = pemFilename;
  }

  async add(dir) {
    let data = (await this.getDerData(this.pemFilename)).toString('hex');
    let subject = await this.getSubject(this.pemFilename);
    let sha1 = (await this.getFingerPrint(this.data)).toString('hex');
    let trustStore = new TrustStore(dir);
    return await trustStore.addRecord(sha1, tset, subject, data);
  }

  async has(dir) {
    let subject = await this.getSubject(this.pemFilename);
    let trustStore = new TrustStore(dir);

    if (!(await trustStore.hasRecords(subject))) {
      return false;
    }

    let previousFingerprint = await trustStore.getFingerPrintFromRecord(subject);
    let currentFingerprint = await this.getFingerPrint();
    return previousFingerprint.toString() === currentFingerprint.toString();
  }

  async remove(dir) {
    let subject = await this.getSubject(this.pemFilename);
    let trustStore = new TrustStore(dir);
    return await trustStore.removeRecord(subject);
  }

  async getDerData() {
    if (this.data) {
      return this.data;
    }

    this.data = await openssl('x509', {
      outform: 'der',
      in: this.pemFilename
    });
    return this.data;
  }

  async getFingerPrint() {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    let data = await this.getDerData();

    let shasum = _crypto.default.createHash('sha1');

    shasum.update(data);
    this.fingerprint = shasum.digest();
    return this.fingerprint;
  }

  async getSubject() {
    if (this.subject) {
      return this.subject;
    }

    let subject = await openssl('x509', {
      noout: true,
      subject: true,
      in: this.pemFilename
    });
    let subRegex = /^subject[\w\W]*\/CN=([\w\W]*)(\n)?/;
    this.subject = subject.toString().match(subRegex)[1];
    return this.subject;
  }

}

exports.Certificate = Certificate;

class TrustStore {
  constructor(sharedResourceDir) {
    this.sharedResourceDir = sharedResourceDir;
  }

  async getDB() {
    if (this.db) {
      return this.db;
    }

    let keychainsPath = _path.default.resolve(this.sharedResourceDir, 'Library', 'Keychains');

    if (!(await _appiumSupport.fs.exists(keychainsPath))) {
      await (0, _appiumSupport.mkdirp)(keychainsPath);
    }

    this.db = _path.default.resolve(keychainsPath, 'TrustStore.sqlite3');
    await (0, _utils.execSQLiteQuery)(this.db, `CREATE TABLE IF NOT EXISTS tsettings (sha1 BLOB NOT NULL DEFAULT '', subj BLOB NOT NULL DEFAULT '', tset BLOB, data BLOB, PRIMARY KEY(sha1));`);

    try {
      await (0, _utils.execSQLiteQuery)(this.db, 'CREATE INDEX isubj ON tsettings(subj);');
    } catch (e) {}

    return this.db;
  }

  async addRecord(sha1, tset, subj, data) {
    let db = await this.getDB();

    if (await this.hasRecords(subj)) {
      return await (0, _utils.execSQLiteQuery)(db, `UPDATE tsettings SET sha1=x'?', tset='?', data=x'?' WHERE subj='?'`, sha1, tset, data, subj);
    } else {
      return await (0, _utils.execSQLiteQuery)(db, `INSERT INTO tsettings (sha1, subj, tset, data) VALUES (x'?', '?', '?', x'?')`, sha1, subj, tset, data);
    }
  }

  async removeRecord(subj) {
    return await (0, _utils.execSQLiteQuery)((await this.getDB()), `DELETE FROM tsettings WHERE subj = '?'`, subj);
  }

  async hasRecords(subj) {
    return (await this.getRecordCount(subj)) > 0;
  }

  async getRecordCount(subj) {
    let result = await (0, _utils.execSQLiteQuery)((await this.getDB()), `SELECT count(*) FROM tsettings WHERE subj = '?'`, subj);
    return parseInt(result.split('=')[1], 10);
  }

  async getFingerPrintFromRecord(subj) {
    let result = await (0, _utils.execSQLiteQuery)((await this.getDB()), `SELECT sha1 FROM tsettings WHERE subj='?'`, subj);

    if (result) {
      return Buffer.from(result.split('=')[1].trim());
    }
  }

}

exports.TrustStore = TrustStore;
var _default = Certificate;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jZXJ0aWZpY2F0ZS5qcyJdLCJuYW1lcyI6WyJvcGVuc3NsIiwiQiIsInByb21pc2lmeSIsInJlcXVpcmUiLCJleGVjIiwidHNldCIsIkNlcnRpZmljYXRlIiwiY29uc3RydWN0b3IiLCJwZW1GaWxlbmFtZSIsImFkZCIsImRpciIsImRhdGEiLCJnZXREZXJEYXRhIiwidG9TdHJpbmciLCJzdWJqZWN0IiwiZ2V0U3ViamVjdCIsInNoYTEiLCJnZXRGaW5nZXJQcmludCIsInRydXN0U3RvcmUiLCJUcnVzdFN0b3JlIiwiYWRkUmVjb3JkIiwiaGFzIiwiaGFzUmVjb3JkcyIsInByZXZpb3VzRmluZ2VycHJpbnQiLCJnZXRGaW5nZXJQcmludEZyb21SZWNvcmQiLCJjdXJyZW50RmluZ2VycHJpbnQiLCJyZW1vdmUiLCJyZW1vdmVSZWNvcmQiLCJvdXRmb3JtIiwiaW4iLCJmaW5nZXJwcmludCIsInNoYXN1bSIsImNyeXB0byIsImNyZWF0ZUhhc2giLCJ1cGRhdGUiLCJkaWdlc3QiLCJub291dCIsInN1YlJlZ2V4IiwibWF0Y2giLCJzaGFyZWRSZXNvdXJjZURpciIsImdldERCIiwiZGIiLCJrZXljaGFpbnNQYXRoIiwicGF0aCIsInJlc29sdmUiLCJmcyIsImV4aXN0cyIsImUiLCJzdWJqIiwiZ2V0UmVjb3JkQ291bnQiLCJyZXN1bHQiLCJwYXJzZUludCIsInNwbGl0IiwiQnVmZmVyIiwiZnJvbSIsInRyaW0iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsT0FBTyxHQUFHQyxrQkFBRUMsU0FBRixDQUFZQyxPQUFPLENBQUMsaUJBQUQsQ0FBUCxDQUEyQkMsSUFBdkMsQ0FBaEI7O0FBRUEsTUFBTUMsSUFBSSxHQUFJOzs7O1NBQWQ7O0FBU0EsTUFBTUMsV0FBTixDQUFrQjtBQUVoQkMsRUFBQUEsV0FBVyxDQUFFQyxXQUFGLEVBQWU7QUFDeEIsU0FBS0EsV0FBTCxHQUFtQkEsV0FB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QUFQO0FBQ0Q7QUFDRjs7QUE5RWM7OztlQWlGRmpELFciLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBta2RpcnAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgeyBleGVjU1FMaXRlUXVlcnkgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3Qgb3BlbnNzbCA9IEIucHJvbWlzaWZ5KHJlcXVpcmUoJ29wZW5zc2wtd3JhcHBlcicpLmV4ZWMpO1xuXG5jb25zdCB0c2V0ID0gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxcblxuICAgIDwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgXCItLy9BcHBsZS8vRFREIFBMSVNUIDEuMC8vRU5cIiBcImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGRcIj5cbiAgICA8cGxpc3QgdmVyc2lvbj1cIjEuMFwiPlxuICAgIDxhcnJheS8+XG48L3BsaXN0PmA7XG5cbi8qKlxuICogTGlicmFyeSBmb3IgcHJvZ3JhbWF0aWNhbGx5IGFkZGluZyBjZXJ0aWZpY2F0ZXNcbiAqL1xuY2xhc3MgQ2VydGlmaWNhdGUge1xuXG4gIGNvbnN0cnVjdG9yIChwZW1GaWxlbmFtZSkge1xuICAgIHRoaXMucGVtRmlsZW5hbWUgPSBwZW1GaWxlbmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBjZXJ0aWZpY2F0ZSB0byB0aGUgVHJ1c3RTdG9yZVxuICAgKi9cbiAgYXN5bmMgYWRkIChkaXIpIHtcbiAgICBsZXQgZGF0YSA9IChhd2FpdCB0aGlzLmdldERlckRhdGEodGhpcy5wZW1GaWxlbmFtZSkpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICBsZXQgc3ViamVjdCA9IChhd2FpdCB0aGlzLmdldFN1YmplY3QodGhpcy5wZW1GaWxlbmFtZSkpO1xuICAgIGxldCBzaGExID0gKGF3YWl0IHRoaXMuZ2V0RmluZ2VyUHJpbnQodGhpcy5kYXRhKSkudG9TdHJpbmcoJ2hleCcpO1xuXG4gICAgbGV0IHRydXN0U3RvcmUgPSBuZXcgVHJ1c3RTdG9yZShkaXIpO1xuICAgIHJldHVybiBhd2FpdCB0cnVzdFN0b3JlLmFkZFJlY29yZChzaGExLCB0c2V0LCBzdWJqZWN0LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYga2V5Y2hhaW4gYXQgZ2l2ZW4gZGlyZWN0b3J5IGhhcyB0aGlzIGNlcnRpZmljYXRlXG4gICAqL1xuICBhc3luYyBoYXMgKGRpcikge1xuICAgIGxldCBzdWJqZWN0ID0gYXdhaXQgdGhpcy5nZXRTdWJqZWN0KHRoaXMucGVtRmlsZW5hbWUpO1xuICAgIGxldCB0cnVzdFN0b3JlID0gbmV3IFRydXN0U3RvcmUoZGlyKTtcblxuICAgIC8vIFJldHVybiBmYWxzZSBpZiByZWNvcmQgd2l0aCB0aGlzIHN1YmplY3QgaXMgbm90IGZvdW5kXG4gICAgaWYgKCFhd2FpdCB0cnVzdFN0b3JlLmhhc1JlY29yZHMoc3ViamVjdCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiByZWNvcmQgaXMgZm91bmQsIGNoZWNrIGZpbmdlcnByaW50cyB0byB2ZXJpZnkgdGhhdCB0aGV5IGRpZG4ndCBjaGFuZ2VcbiAgICBsZXQgcHJldmlvdXNGaW5nZXJwcmludCA9IGF3YWl0IHRydXN0U3RvcmUuZ2V0RmluZ2VyUHJpbnRGcm9tUmVjb3JkKHN1YmplY3QpO1xuICAgIGxldCBjdXJyZW50RmluZ2VycHJpbnQgPSBhd2FpdCB0aGlzLmdldEZpbmdlclByaW50KCk7XG4gICAgcmV0dXJuIHByZXZpb3VzRmluZ2VycHJpbnQudG9TdHJpbmcoKSA9PT0gY3VycmVudEZpbmdlcnByaW50LnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGNlcnRpZmljYXRlIGZyb20gdGhlIFRydXN0U3RvcmVcbiAgICovXG4gIGFzeW5jIHJlbW92ZSAoZGlyKSB7XG4gICAgbGV0IHN1YmplY3QgPSBhd2FpdCB0aGlzLmdldFN1YmplY3QodGhpcy5wZW1GaWxlbmFtZSk7XG4gICAgbGV0IHRydXN0U3RvcmUgPSBuZXcgVHJ1c3RTdG9yZShkaXIpO1xuICAgIHJldHVybiBhd2FpdCB0cnVzdFN0b3JlLnJlbW92ZVJlY29yZChzdWJqZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2xhdGUgUEVNIGZpbGUgdG8gREVSIGJ1ZmZlclxuICAgKi9cbiAgYXN5bmMgZ2V0RGVyRGF0YSAoKSB7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0ICdwZW0nIGZpbGUgdG8gJ2RlcidcbiAgICB0aGlzLmRhdGEgPSBhd2FpdCBvcGVuc3NsKCd4NTA5Jywge1xuICAgICAgb3V0Zm9ybTogJ2RlcicsXG4gICAgICBpbjogdGhpcy5wZW1GaWxlbmFtZVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgU0hBMSBmaW5nZXJwcmludCBmcm9tIGRlciBkYXRhIGJlZm9yZVxuICAgKi9cbiAgYXN5bmMgZ2V0RmluZ2VyUHJpbnQgKCkge1xuICAgIGlmICh0aGlzLmZpbmdlcnByaW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5maW5nZXJwcmludDtcbiAgICB9XG5cbiAgICBsZXQgZGF0YSA9IGF3YWl0IHRoaXMuZ2V0RGVyRGF0YSgpO1xuICAgIGxldCBzaGFzdW0gPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpO1xuICAgIHNoYXN1bS51cGRhdGUoZGF0YSk7XG4gICAgdGhpcy5maW5nZXJwcmludCA9IHNoYXN1bS5kaWdlc3QoKTtcbiAgICByZXR1cm4gdGhpcy5maW5nZXJwcmludDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSB0aGUgc3ViamVjdCBmcm9tIHRoZSBkZXIgZGF0YVxuICAgKi9cbiAgYXN5bmMgZ2V0U3ViamVjdCAoKSB7XG4gICAgaWYgKHRoaXMuc3ViamVjdCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3ViamVjdDtcbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0ICdwZW0nIGZpbGUgdG8gJ2RlcidcbiAgICBsZXQgc3ViamVjdCA9IGF3YWl0IG9wZW5zc2woJ3g1MDknLCB7XG4gICAgICBub291dDogdHJ1ZSxcbiAgICAgIHN1YmplY3Q6IHRydWUsXG4gICAgICBpbjogdGhpcy5wZW1GaWxlbmFtZVxuICAgIH0pO1xuICAgIGxldCBzdWJSZWdleCA9IC9ec3ViamVjdFtcXHdcXFddKlxcL0NOPShbXFx3XFxXXSopKFxcbik/LztcbiAgICB0aGlzLnN1YmplY3QgPSBzdWJqZWN0LnRvU3RyaW5nKCkubWF0Y2goc3ViUmVnZXgpWzFdO1xuICAgIHJldHVybiB0aGlzLnN1YmplY3Q7XG4gIH1cblxufVxuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgYWRkaW5nIGFuZCByZW1vdmluZyByZWNvcmRzIHRvIFRydXN0U3RvcmUuc3FsaXRlMyBkYXRhYmFzZXMgdGhhdCBLZXljaGFpbnMgdXNlXG4gKi9cbmNsYXNzIFRydXN0U3RvcmUge1xuICBjb25zdHJ1Y3RvciAoc2hhcmVkUmVzb3VyY2VEaXIpIHtcbiAgICB0aGlzLnNoYXJlZFJlc291cmNlRGlyID0gc2hhcmVkUmVzb3VyY2VEaXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0IFRydXN0U3RvcmUgZGF0YWJhc2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2ltdWxhdG9yXG4gICAqL1xuICBhc3luYyBnZXREQiAoKSB7XG4gICAgaWYgKHRoaXMuZGIpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzaW0gZG9lc24ndCBoYXZlIGEga2V5Y2hhaW5zIGRpcmVjdG9yeSwgY3JlYXRlIG9uZVxuICAgIGxldCBrZXljaGFpbnNQYXRoID0gcGF0aC5yZXNvbHZlKHRoaXMuc2hhcmVkUmVzb3VyY2VEaXIsICdMaWJyYXJ5JywgJ0tleWNoYWlucycpO1xuICAgIGlmICghKGF3YWl0IGZzLmV4aXN0cyhrZXljaGFpbnNQYXRoKSkpIHtcbiAgICAgIGF3YWl0IG1rZGlycChrZXljaGFpbnNQYXRoKTtcbiAgICB9XG5cbiAgICAvLyBPcGVuIHNxbGl0ZSBkYXRhYmFzZVxuICAgIHRoaXMuZGIgPSBwYXRoLnJlc29sdmUoa2V5Y2hhaW5zUGF0aCwgJ1RydXN0U3RvcmUuc3FsaXRlMycpO1xuXG4gICAgLy8gSWYgaXQgZG9lc24ndCBoYXZlIGEgdHNldHRpbmdzIHRhYmxlLCBjcmVhdGUgb25lXG4gICAgYXdhaXQgZXhlY1NRTGl0ZVF1ZXJ5KHRoaXMuZGIsIGBDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyB0c2V0dGluZ3MgKHNoYTEgQkxPQiBOT1QgTlVMTCBERUZBVUxUICcnLCBzdWJqIEJMT0IgTk9UIE5VTEwgREVGQVVMVCAnJywgdHNldCBCTE9CLCBkYXRhIEJMT0IsIFBSSU1BUlkgS0VZKHNoYTEpKTtgKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXhlY1NRTGl0ZVF1ZXJ5KHRoaXMuZGIsICdDUkVBVEUgSU5ERVggaXN1YmogT04gdHNldHRpbmdzKHN1YmopOycpO1xuICAgIH0gY2F0Y2ggKGUpIHsgfVxuXG5cbiAgICByZXR1cm4gdGhpcy5kYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgcmVjb3JkIHRvIHRzZXR0aW5nc1xuICAgKi9cbiAgYXN5bmMgYWRkUmVjb3JkIChzaGExLCB0c2V0LCBzdWJqLCBkYXRhKSB7XG4gICAgbGV0IGRiID0gYXdhaXQgdGhpcy5nZXREQigpO1xuICAgIGlmIChhd2FpdCB0aGlzLmhhc1JlY29yZHMoc3ViaikpIHtcbiAgICAgIHJldHVybiBhd2FpdCBleGVjU1FMaXRlUXVlcnkoZGIsIGBVUERBVEUgdHNldHRpbmdzIFNFVCBzaGExPXgnPycsIHRzZXQ9Jz8nLCBkYXRhPXgnPycgV0hFUkUgc3Viaj0nPydgLCBzaGExLCB0c2V0LCBkYXRhLCBzdWJqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGF3YWl0IGV4ZWNTUUxpdGVRdWVyeShkYiwgYElOU0VSVCBJTlRPIHRzZXR0aW5ncyAoc2hhMSwgc3ViaiwgdHNldCwgZGF0YSkgVkFMVUVTICh4Jz8nLCAnPycsICc/JywgeCc/JylgLCBzaGExLCBzdWJqLCB0c2V0LCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHJlY29yZCBmcm9tIHRzZXR0aW5ncyB0aGF0IG1hdGNoZXMgdGhlIHN1YmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN1YmpcbiAgICovXG4gIGFzeW5jIHJlbW92ZVJlY29yZCAoc3Viaikge1xuICAgIHJldHVybiBhd2FpdCBleGVjU1FMaXRlUXVlcnkoYXdhaXQgdGhpcy5nZXREQigpLCBgREVMRVRFIEZST00gdHNldHRpbmdzIFdIRVJFIHN1YmogPSAnPydgLCBzdWJqKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByZWNvcmQgZnJvbSB0c2V0dGluZ3MgdGhhdCBtYXRjaGVzIHRoZSBzdWJqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdWJqXG4gICAqL1xuICBhc3luYyBoYXNSZWNvcmRzIChzdWJqKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFJlY29yZENvdW50KHN1YmopKSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvdW50IG9mIGhvdyBtYW55IHJlY29yZHMgaGF2ZSB0aGlzIHN1YmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN1YmpcbiAgICovXG4gIGFzeW5jIGdldFJlY29yZENvdW50IChzdWJqKSB7XG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IGV4ZWNTUUxpdGVRdWVyeShhd2FpdCB0aGlzLmdldERCKCksIGBTRUxFQ1QgY291bnQoKikgRlJPTSB0c2V0dGluZ3MgV0hFUkUgc3ViaiA9ICc/J2AsIHN1YmopO1xuICAgIHJldHVybiBwYXJzZUludChyZXN1bHQuc3BsaXQoJz0nKVsxXSwgMTApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgU0hBMSBmaW5nZXJwcmludCBmb3IgdGhlIHJlY29yZCB0aGF0IGhhcyB0aGlzIHN1YmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN1YmpcbiAgICovXG4gIGFzeW5jIGdldEZpbmdlclByaW50RnJvbVJlY29yZCAoc3Viaikge1xuICAgIGxldCByZXN1bHQgPSBhd2FpdCBleGVjU1FMaXRlUXVlcnkoYXdhaXQgdGhpcy5nZXREQigpLCBgU0VMRUNUIHNoYTEgRlJPTSB0c2V0dGluZ3MgV0hFUkUgc3Viaj0nPydgLCBzdWJqKTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gQnVmZmVyLmZyb20ocmVzdWx0LnNwbGl0KCc9JylbMV0udHJpbSgpKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ2VydGlmaWNhdGU7XG5leHBvcnQgeyBDZXJ0aWZpY2F0ZSwgVHJ1c3RTdG9yZSB9O1xuIl0sImZpbGUiOiJsaWIvY2VydGlmaWNhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==