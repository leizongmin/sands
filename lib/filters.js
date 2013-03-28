/**
 * Template Filters
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

module.exports = function (namespace, exports) {

  var utils = require('./utils');
  var formatRegExp = /%[sd%]/g;

  /**
   * Format String
   *
   * @param {String} f
   * @return {String}
   */
  exports.format = function (f) {
    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        default:
          return x;
      }
    });
    return str;
  };

};
