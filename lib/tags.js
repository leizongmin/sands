/**
 * Template Tags
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

module.exports = function (namespace, exports) {

  var utils = require('./utils');

  /**
   * Example:
   *   {% paginate posts by 30 %}
   *     {% for post in posts %}{{post.title}}{% endfor %}
   *   {% endpaginate %}
   * 
   * Convert to:
   *   {% assign posts = 30 | query_posts_list %}
   */
  exports.paginate = function (context, name, body) {
    // body='posts by 30';
    var bs = body.split(/\s+/);
    var n = bs[0];
    var s = bs[2];
    var tpl = '{% assign ' + n + ' = ' + s + ' | query_' + n + '_list %}';
    context.astStack.push(utils.parseTemplate(tpl));
  };
  exports.endpaginate = function (context, name, body) {
    // Do nothing.
  };

  /**
   * Example:
   *   {% snippet "name" with data %}
   *
   * Convert to:
   *   {% include "snippet/name" with data %}
   */
  exports.snippet = function (context, name, body) {

  };

  /**
   * Example:
   *   {% plugin "name" with data %}
   */
  exports.plugin = function (context, name, body) {
    
  };

};
