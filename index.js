/**
 * Clear CMS
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

var Plugin = require('./lib/plugin');


/**
 * Load Plugin
 *
 * @param {String} dir
 */
exports.load = function (dir) {
  return new Plugin(dir);
};



