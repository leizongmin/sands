/**
 * Utils
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

var path = require('path');
var fs = require('fs');
var tinyliuqid = require('tinyliquid');
var utils = module.exports;


/**
 * New Context
 *
 * @param {Object} options
 * @return {Object}
 */
exports.newContext = tinyliuqid.newContext;

/**
 * Merge Object
 *
 * @param {Object} a
 * @parma {Object} b
 * @return {Object}
 */
exports.merge = function () {
  var ret = {};
  for (var i in arguments) {
    var m = arguments[i];
    for (var j in m) ret[j] = m[j];
  }
  return ret;
};

/**
 * Traverse the Directory
 *
 * @param {String} dir
 * @param {Function} fn  format: function (name, fullName, stat)
 */
exports.traverse = function (dir, fn) {
  fs.readdirSync(dir).forEach(function (n) {
    var f = path.resolve(dir, n);
    var s = fs.statSync(f);
    fn(n, f, s);
    if (s.isDirectory()) utils.traverse(f, fn);
  });
};

/**
 * Require Module Without Cache
 *
 * @parma {String} filename
 * @return {Object}
 */
exports.requireModuleWithoutCache = function (filename) {
  if (fs.existsSync(filename)) {
    var m = require(filename);
    delete require.cache[filename];
    return m;
  } else {
    return {};
  }
};

/**
 * Load Config
 *
 * @param {String} dir
 * @return {Object}
 */
exports.loadConfig = function (dir) {
  var filename = path.resolve(dir, 'config');
  filename = filename + (fs.existsSync(filename + '.json') ? '.json' : '.js');
  
  var config = require(filename);
  delete require.cache[filename];
  config.path = path.resolve(dir);

  var generateName = function () {
    var name = path.basename(dir);
    name = name[0].toUpperCase() + name.substr(1);
    return 'Plugin' + name;
  };

  return utils.merge({
    'name':               generateName(),
    'env':                'developement',
    'views':              './views',
    'view engine':        'liquid',
    'enable view cache':  true,
    'default locale':     'en',
    'i18n path':          './i18n',
    'plugin path':        './plugin',
    'filters path':       './template/filters.js',
    'async filters path': './template/asyncFilters.js',
    'locals path':        './template/locals.js',
    'async locals path':  './template/asyncLocals.js',
    'tags path':          './template/tags.js',
    'routes path':        './routes',
    'static routes path': './routes/index.json'
  }, config);
};

/**
 * Load i18n Config
 *
 * @parma {Object} config
 * @return {Object}
 */
exports.loadI18nConfig = function (config) {
  var i18n = {};
  var dir = path.resolve(config.path, config['i18n path']);
  if (fs.existsSync(dir)) {
    utils.traverse(dir, function (name, fullName, stat) {
      if (!stat.isFile()) return;
      var extname = path.extname(name);
      if (extname !== '.json') return;
      var key = name.substr(0, name.length - extname.length);
      var data = JSON.parse(fs.readFileSync(fullName, 'utf8'));
      i18n[key] = data;
    });
  }
  return i18n;
};

/**
 * List Plugins
 *
 * @parma {Object} config
 * @return {Array}
 */
exports.listPlugins = function (config) {
  var list = [];
  var dir = path.resolve(config.path, config['plugin path']);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function (name) {
      var filename = path.resolve(dir, name);
      var stat = fs.statSync(filename);
      if (stat.isFile()) list.push(name);
    });
  }
  return list;
};

/**
 * Load Filters
 *
 * @param {Object} config
 * @return {Object}
 */
exports.loadFilters = function (config) {
  var filename = path.resolve(config.path, config['filters path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Load Async Filters
 *
 * @param {Object} config
 * @return {Object}
 */
exports.loadAsyncFilters = function (config) {
  var filename = path.resolve(config.path, config['async filters path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Load Locals
 *
 * @param {Object} config
 * @return {Object}
 */
exports.loadLocals = function (config) {
  var filename = path.resolve(config.path, config['locals path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Load Async Locals
 *
 * @param {Object} config
 * @return {Object}
 */
exports.loadAsyncLocals = function (config) {
  var filename = path.resolve(config.path, config['async locals path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Load Tags
 *
 * @param {Object} config
 * @return {Object}
 */
exports.loadTags = function (config) {
  var filename = path.resolve(config.path, config['tags path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Load Routes
 *
 * @param {Object} config
 * @return {Array}
 */
exports.loadRoutes = function (config) {
  var list = [];
  var dir = path.resolve(config.path, config['routes path']);
  if (fs.existsSync(dir)) {
    utils.traverse(dir, function (name, fullName, stat) {
      if (!stat.isFile()) return;
      var extname = path.extname(name);
      if (extname !== '.js') return;
      var m = utils.requireModuleWithoutCache(fullName);
      list.push(m);
    });
  }
};

/**
 * Load Static Routes
 *
 * @param {Object} config
 * @return {Array}
 */
exports.loadStaticRoutes = function (config) {
  var filename = path.resolve(config.path, config['static routes path']);
  return utils.requireModuleWithoutCache(filename);
};

/**
 * Wrap Module
 *
 * @parma {Object} namespace
 * @param {Function} init
 */
exports.wrapModule = function (namespace, init) {
  if (typeof(init) !== 'function') return init;

  var exps = {};
  init(namespace, exps);
  return exps;
};

/**
 * Generate Simple Routes
 *
 * @param {Object} app
 * @parma {Array} routes
 */
exports.generateSimpleRoutes = function (app, routes) {
  if (!Array.isArray(routes)) return;

  var generateFn = function (template) {
    return function (req, res, next) {
      res.render(template);
    };
  };

  var methods = ['get', 'post', 'put', 'del', 'all'];
  routes.forEach(function (item) {
    // format:  {path: '/', get: 'template'} or {path: '/:id', all: 'template'} etc.
    if (!item.path) return;
    for (var i in item) {
      if (methods.indexOf(i) !== -1) {
        app[i](item.path, generateFn(item[i]));
      }
    }
  });
};

