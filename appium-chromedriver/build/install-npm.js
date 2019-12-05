#!/usr/bin/env node
"use strict";

require("source-map-support/register");

const fs = require('fs');

const path = require('path');

const log = require('fancy-log');

const _ = require('lodash');

const BUILD_RETRIES = 200;
const BUILD_RETRY_INTERVAL = 1000;
const BUILD_PATH = path.join(__dirname, 'build', 'lib', 'install.js');

function waitForDeps(cb) {
  let i = 0;

  function check() {
    i++;

    try {
      require(BUILD_PATH);

      cb();
    } catch (err) {
      if (err.message.includes(`Cannot find module '${BUILD_PATH}'`)) {
        log.warn(`Project does not appear to be built yet. Please run 'npm run chromedriver' first.`);
        return cb(new Error(`Could not install module: ${err.message}`));
      }

      log.warn(`Error trying to install Chromedriver binary. Waiting ${BUILD_RETRY_INTERVAL}ms and trying again: ${err.message}`);

      if (i <= BUILD_RETRIES) {
        setTimeout(check, BUILD_RETRY_INTERVAL);
      } else {
        cb(new Error(`Could not import installation module: ${err.message}`));
      }
    }
  }

  check();
}

function main() {
  if (!_.isEmpty(process.env.APPIUM_SKIP_CHROMEDRIVER_INSTALL) || !_.isEmpty(process.env.npm_config_chromedriver_skip_install)) {
    log.warn(`'APPIUM_SKIP_CHROMEDRIVER_INSTALL' environment variable set, or '--chromedriver-skip-install' flag set.`);
    log.warn(`Skipping Chromedriver installation. Android web/hybrid testing will not be possible`);
    return;
  }

  waitForDeps(function wait(err) {
    if (err) {
      log.warn(`Unable to import install script: ${err.message}`);
      log.warn(`Re-run 'npm run chromedriver' manually.`);
      return;
    }

    fs.stat(BUILD_PATH, function installScriptExists(err) {
      if (err) {
        log.warn(`NOTE: Run 'npx gulp transpile' before using`);
        return;
      }

      require(BUILD_PATH).doInstall().catch(function installError(err) {
        log.error(`Error installing Chromedriver: ${err.message}`);
        log.error(err.stack ? err.stack : err);
        log.error(`Downloading Chromedriver can be skipped by using the ` + `'--chromedriver-skip-install' flag or ` + `setting the 'APPIUM_SKIP_CHROMEDRIVER_INSTALL' environment ` + `variable.`);
        process.exit(1);
      });
    });
  });
}

if (require.main === module) {
  main();
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluc3RhbGwtbnBtLmpzIl0sIm5hbWVzIjpbImZzIiwicmVxdWlyZSIsInBhdGgiLCJsb2ciLCJfIiwiQlVJTERfUkVUUklFUyIsIkJVSUxEX1JFVFJZX0lOVEVSVkFMIiwiQlVJTERfUEFUSCIsImpvaW4iLCJfX2Rpcm5hbWUiLCJ3YWl0Rm9yRGVwcyIsImNiIiwiaSIsImNoZWNrIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwid2FybiIsIkVycm9yIiwic2V0VGltZW91dCIsIm1haW4iLCJpc0VtcHR5IiwicHJvY2VzcyIsImVudiIsIkFQUElVTV9TS0lQX0NIUk9NRURSSVZFUl9JTlNUQUxMIiwibnBtX2NvbmZpZ19jaHJvbWVkcml2ZXJfc2tpcF9pbnN0YWxsIiwid2FpdCIsInN0YXQiLCJpbnN0YWxsU2NyaXB0RXhpc3RzIiwiZG9JbnN0YWxsIiwiY2F0Y2giLCJpbnN0YWxsRXJyb3IiLCJlcnJvciIsInN0YWNrIiwiZXhpdCIsIm1vZHVsZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FBR0EsTUFBTUEsRUFBRSxHQUFHQyxPQUFPLENBQUMsSUFBRCxDQUFsQjs7QUFDQSxNQUFNQyxJQUFJLEdBQUdELE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUNBLE1BQU1FLEdBQUcsR0FBR0YsT0FBTyxDQUFDLFdBQUQsQ0FBbkI7O0FBQ0EsTUFBTUcsQ0FBQyxHQUFHSCxPQUFPLENBQUMsUUFBRCxDQUFqQjs7QUFVQSxNQUFNSSxhQUFhLEdBQUcsR0FBdEI7QUFDQSxNQUFNQyxvQkFBb0IsR0FBRyxJQUE3QjtBQUVBLE1BQU1DLFVBQVUsR0FBR0wsSUFBSSxDQUFDTSxJQUFMLENBQVVDLFNBQVYsRUFBcUIsT0FBckIsRUFBOEIsS0FBOUIsRUFBcUMsWUFBckMsQ0FBbkI7O0FBRUEsU0FBU0MsV0FBVCxDQUFzQkMsRUFBdEIsRUFBMEI7QUFHeEIsTUFBSUMsQ0FBQyxHQUFHLENBQVI7O0FBQ0EsV0FBU0MsS0FBVCxHQUFrQjtBQUNoQkQsSUFBQUEsQ0FBQzs7QUFDRCxRQUFJO0FBQ0ZYLE1BQUFBLE9BQU8sQ0FBQ00sVUFBRCxDQUFQOztBQUNBSSxNQUFBQSxFQUFFO0FBQ0gsS0FIRCxDQUdFLE9BQU9HLEdBQVAsRUFBWTtBQUNaLFVBQUlBLEdBQUcsQ0FBQ0MsT0FBSixDQUFZQyxRQUFaLENBQXNCLHVCQUFzQlQsVUFBVyxHQUF2RCxDQUFKLEVBQWdFO0FBQzlESixRQUFBQSxHQUFHLENBQUNjLElBQUosQ0FBVSxtRkFBVjtBQUNBLGVBQU9OLEVBQUUsQ0FBQyxJQUFJTyxLQUFKLENBQVcsNkJBQTRCSixHQUFHLENBQUNDLE9BQVEsRUFBbkQsQ0FBRCxDQUFUO0FBQ0Q7O0FBQ0RaLE1BQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLHdEQUF1RFgsb0JBQXFCLHdCQUF1QlEsR0FBRyxDQUFDQyxPQUFRLEVBQXpIOztBQUNBLFVBQUlILENBQUMsSUFBSVAsYUFBVCxFQUF3QjtBQUN0QmMsUUFBQUEsVUFBVSxDQUFDTixLQUFELEVBQVFQLG9CQUFSLENBQVY7QUFDRCxPQUZELE1BRU87QUFDTEssUUFBQUEsRUFBRSxDQUFDLElBQUlPLEtBQUosQ0FBVyx5Q0FBd0NKLEdBQUcsQ0FBQ0MsT0FBUSxFQUEvRCxDQUFELENBQUY7QUFDRDtBQUNGO0FBQ0Y7O0FBQ0RGLEVBQUFBLEtBQUs7QUFDTjs7QUFFRCxTQUFTTyxJQUFULEdBQWlCO0FBRWYsTUFBSSxDQUFDaEIsQ0FBQyxDQUFDaUIsT0FBRixDQUFVQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsZ0NBQXRCLENBQUQsSUFBNEQsQ0FBQ3BCLENBQUMsQ0FBQ2lCLE9BQUYsQ0FBVUMsT0FBTyxDQUFDQyxHQUFSLENBQVlFLG9DQUF0QixDQUFqRSxFQUE4SDtBQUM1SHRCLElBQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLHlHQUFWO0FBQ0FkLElBQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLHFGQUFWO0FBQ0E7QUFDRDs7QUFHRFAsRUFBQUEsV0FBVyxDQUFDLFNBQVNnQixJQUFULENBQWVaLEdBQWYsRUFBb0I7QUFDOUIsUUFBSUEsR0FBSixFQUFTO0FBRVBYLE1BQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLG9DQUFtQ0gsR0FBRyxDQUFDQyxPQUFRLEVBQXpEO0FBQ0FaLE1BQUFBLEdBQUcsQ0FBQ2MsSUFBSixDQUFVLHlDQUFWO0FBQ0E7QUFDRDs7QUFDRGpCLElBQUFBLEVBQUUsQ0FBQzJCLElBQUgsQ0FBUXBCLFVBQVIsRUFBb0IsU0FBU3FCLG1CQUFULENBQThCZCxHQUE5QixFQUFtQztBQUNyRCxVQUFJQSxHQUFKLEVBQVM7QUFFUFgsUUFBQUEsR0FBRyxDQUFDYyxJQUFKLENBQVUsNkNBQVY7QUFDQTtBQUNEOztBQUNEaEIsTUFBQUEsT0FBTyxDQUFDTSxVQUFELENBQVAsQ0FBb0JzQixTQUFwQixHQUFnQ0MsS0FBaEMsQ0FBc0MsU0FBU0MsWUFBVCxDQUF1QmpCLEdBQXZCLEVBQTRCO0FBQ2hFWCxRQUFBQSxHQUFHLENBQUM2QixLQUFKLENBQVcsa0NBQWlDbEIsR0FBRyxDQUFDQyxPQUFRLEVBQXhEO0FBQ0FaLFFBQUFBLEdBQUcsQ0FBQzZCLEtBQUosQ0FBVWxCLEdBQUcsQ0FBQ21CLEtBQUosR0FBWW5CLEdBQUcsQ0FBQ21CLEtBQWhCLEdBQXdCbkIsR0FBbEM7QUFDQVgsUUFBQUEsR0FBRyxDQUFDNkIsS0FBSixDQUFXLHVEQUFELEdBQ0Msd0NBREQsR0FFQyw2REFGRCxHQUdDLFdBSFg7QUFJQVYsUUFBQUEsT0FBTyxDQUFDWSxJQUFSLENBQWEsQ0FBYjtBQUNELE9BUkQ7QUFTRCxLQWZEO0FBZ0JELEdBdkJVLENBQVg7QUF3QkQ7O0FBRUQsSUFBSWpDLE9BQU8sQ0FBQ21CLElBQVIsS0FBaUJlLE1BQXJCLEVBQTZCO0FBQzNCZixFQUFBQSxJQUFJO0FBQ0wiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vKiBlc2xpbnQtZGlzYWJsZSBwcm9taXNlL3ByZWZlci1hd2FpdC10by1jYWxsYmFja3MgKi9cblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGxvZyA9IHJlcXVpcmUoJ2ZhbmN5LWxvZycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG5cbi8qKlxuICogQmVjYXVzZSBvZiB0aGUgd2F5IG5wbSBsaWZlY3ljbGUgc2NyaXB0cyB3b3JrLCBvbiBhIGxvY2FsIGluc3RhbGwsIHdoZW4gdGhlXG4gKiBjb2RlIGhhcyBub3QgYmVlbiB0cmFucGlsZWQgeWV0IChpLmUuLCB0aGUgZmlyc3QgdGltZSwgb3IgYWZ0ZXIgdGhlICdidWlsZCdcbiAqIGRpcmVjdG9yeSBoYXMgYmVlbiBkZWxldGVkKSB0aGUgZG93bmxvYWQgKip3aWxsKiogZmFpbCwgYW5kICducG0gcnVuIGNocm9tZWRyaXZlcidcbiAqIHdpbGwgbmVlZCB0byBiZSBydW4uXG4gKi9cblxuY29uc3QgQlVJTERfUkVUUklFUyA9IDIwMDtcbmNvbnN0IEJVSUxEX1JFVFJZX0lOVEVSVkFMID0gMTAwMDtcblxuY29uc3QgQlVJTERfUEFUSCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdidWlsZCcsICdsaWInLCAnaW5zdGFsbC5qcycpO1xuXG5mdW5jdGlvbiB3YWl0Rm9yRGVwcyAoY2IpIHtcbiAgLy8gc2VlIGlmIHdlIGNhbiBpbXBvcnQgdGhlIG5lY2Vzc2FyeSBjb2RlXG4gIC8vIHRyeSBpdCBhIHJpZGljdWxvdXMgKGJ1dCBmaW5pdGUpIG51bWJlciBvZiB0aW1lc1xuICBsZXQgaSA9IDA7XG4gIGZ1bmN0aW9uIGNoZWNrICgpIHtcbiAgICBpKys7XG4gICAgdHJ5IHtcbiAgICAgIHJlcXVpcmUoQlVJTERfUEFUSCk7XG4gICAgICBjYigpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKGBDYW5ub3QgZmluZCBtb2R1bGUgJyR7QlVJTERfUEFUSH0nYCkpIHtcbiAgICAgICAgbG9nLndhcm4oYFByb2plY3QgZG9lcyBub3QgYXBwZWFyIHRvIGJlIGJ1aWx0IHlldC4gUGxlYXNlIHJ1biAnbnBtIHJ1biBjaHJvbWVkcml2ZXInIGZpcnN0LmApO1xuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKGBDb3VsZCBub3QgaW5zdGFsbCBtb2R1bGU6ICR7ZXJyLm1lc3NhZ2V9YCkpO1xuICAgICAgfVxuICAgICAgbG9nLndhcm4oYEVycm9yIHRyeWluZyB0byBpbnN0YWxsIENocm9tZWRyaXZlciBiaW5hcnkuIFdhaXRpbmcgJHtCVUlMRF9SRVRSWV9JTlRFUlZBTH1tcyBhbmQgdHJ5aW5nIGFnYWluOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgaWYgKGkgPD0gQlVJTERfUkVUUklFUykge1xuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCBCVUlMRF9SRVRSWV9JTlRFUlZBTCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYihuZXcgRXJyb3IoYENvdWxkIG5vdCBpbXBvcnQgaW5zdGFsbGF0aW9uIG1vZHVsZTogJHtlcnIubWVzc2FnZX1gKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNoZWNrKCk7XG59XG5cbmZ1bmN0aW9uIG1haW4gKCkge1xuICAvLyBjaGVjayBpZiB3ZSBzaG91bGQgc2tpcCBpbnN0YWxsXG4gIGlmICghXy5pc0VtcHR5KHByb2Nlc3MuZW52LkFQUElVTV9TS0lQX0NIUk9NRURSSVZFUl9JTlNUQUxMKSB8fCAhXy5pc0VtcHR5KHByb2Nlc3MuZW52Lm5wbV9jb25maWdfY2hyb21lZHJpdmVyX3NraXBfaW5zdGFsbCkpIHtcbiAgICBsb2cud2FybihgJ0FQUElVTV9TS0lQX0NIUk9NRURSSVZFUl9JTlNUQUxMJyBlbnZpcm9ubWVudCB2YXJpYWJsZSBzZXQsIG9yICctLWNocm9tZWRyaXZlci1za2lwLWluc3RhbGwnIGZsYWcgc2V0LmApO1xuICAgIGxvZy53YXJuKGBTa2lwcGluZyBDaHJvbWVkcml2ZXIgaW5zdGFsbGF0aW9uLiBBbmRyb2lkIHdlYi9oeWJyaWQgdGVzdGluZyB3aWxsIG5vdCBiZSBwb3NzaWJsZWApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGNoZWNrIGlmIHRoZSBjb2RlIGhhcyBiZWVuIHRyYW5zcGlsZWRcbiAgd2FpdEZvckRlcHMoZnVuY3Rpb24gd2FpdCAoZXJyKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgLy8gdGhpcyBzaG91bGQgb25seSBoYXBwZW4gb24gbG9jYWwgaW5zdGFsbCAoaS5lLiwgbnBtIGluc3RhbGwgaW4gdGhpcyBkaXJlY3RvcnkpXG4gICAgICBsb2cud2FybihgVW5hYmxlIHRvIGltcG9ydCBpbnN0YWxsIHNjcmlwdDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIGxvZy53YXJuKGBSZS1ydW4gJ25wbSBydW4gY2hyb21lZHJpdmVyJyBtYW51YWxseS5gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZnMuc3RhdChCVUlMRF9QQVRILCBmdW5jdGlvbiBpbnN0YWxsU2NyaXB0RXhpc3RzIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgLy8gdGhpcyBzaG91bGQgb25seSBoYXBwZW4gb24gbG9jYWwgaW5zdGFsbFxuICAgICAgICBsb2cud2FybihgTk9URTogUnVuICducHggZ3VscCB0cmFuc3BpbGUnIGJlZm9yZSB1c2luZ2ApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXF1aXJlKEJVSUxEX1BBVEgpLmRvSW5zdGFsbCgpLmNhdGNoKGZ1bmN0aW9uIGluc3RhbGxFcnJvciAoZXJyKSB7XG4gICAgICAgIGxvZy5lcnJvcihgRXJyb3IgaW5zdGFsbGluZyBDaHJvbWVkcml2ZXI6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIGxvZy5lcnJvcihlcnIuc3RhY2sgPyBlcnIuc3RhY2sgOiBlcnIpO1xuICAgICAgICBsb2cuZXJyb3IoYERvd25sb2FkaW5nIENocm9tZWRyaXZlciBjYW4gYmUgc2tpcHBlZCBieSB1c2luZyB0aGUgYCArXG4gICAgICAgICAgICAgICAgICBgJy0tY2hyb21lZHJpdmVyLXNraXAtaW5zdGFsbCcgZmxhZyBvciBgICtcbiAgICAgICAgICAgICAgICAgIGBzZXR0aW5nIHRoZSAnQVBQSVVNX1NLSVBfQ0hST01FRFJJVkVSX0lOU1RBTEwnIGVudmlyb25tZW50IGAgK1xuICAgICAgICAgICAgICAgICAgYHZhcmlhYmxlLmApO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCk7XG59XG4iXSwiZmlsZSI6Imluc3RhbGwtbnBtLmpzIiwic291cmNlUm9vdCI6Ii4uIn0=