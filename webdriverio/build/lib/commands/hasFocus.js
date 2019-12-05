"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 *
 * Return true or false if the selected DOM-element currently has focus.
 *
 * <example>
    :index.html
    <input name="login" autofocus="" />

    :hasFocus.js
    it('should detect the focus of an element', function () {
        browser.url('/');

        var loginInput = $('[name="login"]');
        console.log(loginInput.hasFocus()); // outputs: false

        loginInput.click();
        console.log(loginInput.hasFocus()); // outputs: true
    })
 * </example>
 *
 * @alias browser.hasFocus
 * @param {String} selector   select active element
 * @returns {Boolean}         true if element has focus
 * @uses protocol/execute
 * @type state
 *
 */

var hasFocus = function hasFocus(selector) {
    var finalSelector = selector === null ? this.lastPromise.inspect().value.selector : selector;
    var result = this.execute(function (selector) {
        var focused = document.activeElement;
        if (!focused || focused === document.body) {
            return false;
        }

        var instanceOfSelectorHasFocus = false;
        var selectorArray = document.querySelectorAll(selector);
        for (var i = 0; i < selectorArray.length; i++) {
            if (focused === selectorArray[i]) {
                instanceOfSelectorHasFocus = true;
            }
        }
        return instanceOfSelectorHasFocus;
    }, finalSelector);

    return result.then(function (result) {
        return result.value;
    });
};

exports.default = hasFocus;
module.exports = exports["default"];