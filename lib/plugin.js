/**
 * Plugin
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

var path = require('path');
var expressLiquid = require('express-liquid');
var utils = require('./utils');


/**
 * Plugin
 *
 * @param {String} dir
 */
var Plugin = module.exports = function (dir) {
  this.path = path.resolve(dir);

  // load config
  var config = this.config = utils.loadConfig(this.path);
  this.name = utils.name;
  if (global[this.name]) throw new Error('Naming conflicts!');
  var namespace = this.namespace = global[this.name] = {self: this};

  this._i18n = utils.wrapModule(namespace, utils.loadI18nConfig(config));
  this._plugins = utils.wrapModule(namespace, utils.listPlugins(config));
  this._filters = utils.wrapModule(namespace, utils.loadFilters(config));
  this._asyncFilters = utils.wrapModule(namespace, utils.loadAsyncFilters(config));
  this._locals = utils.wrapModule(namespace, utils.loadLocals(config));
  this._asyncLocals = utils.wrapModule(namespace, utils.loadAsyncLocals(config));
  this._tags = utils.wrapModule(namespace, utils.loadTags(config));
  this._routes = utils.wrapModule(namespace, utils.loadRoutes(config));
  this._staticRoutes = utils.wrapModule(namespace, utils.loadStaticRoutes(config));

  // context
  var context = this.context = namespace.context = utils.newContext();
  context.setLocals('config', this.config);
  var setEach = function (data, method) {
    if (data) for (var i in data) context[method](i, data[i]);
  }
  setEach(require('./filters'), 'setFilters');
  setEach(this._filters, 'setFilters');
  setEach(this._asyncFilters, 'setAsyncFilters');
  setEach(this._locals, 'setLocals');
  setEach(this._asyncLocals, 'setAsyncLocals');

  // render
  this._render = expressLiquid({
    context:    this.context,
    customTags: utils.merge(require('./tags'), this._tags)
  }); 
};

/**
 * Return the connect middleware port
 *
 * @return {Function}
 */
Plugin.prototype.handler = function () {
  var me = this;
  return function (req, res, next) {
    res._old_render = res.render;
    res.render = function (name, data, callback) {
      me.render(req, res, next, name, data, callback);
    };
    next();
  };
};

/**
 * Bind to the express
 *
 * @param {Object} app
 */
Plugin.prototype.bind = function (app) {
  this.app = app;
  utils.generateSimpleRoutes(app, this._staticRoutes);
};

/**
 * Render
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @param {String} name
 * @param {Object} data
 * @param {Function} callback
 */
Plugin.prototype.render = function (req, res, next, name, data, callback) {
  if (typeof(data) === 'function') {
    callback = data;
    data = null;
  }
  if (typeof(callback) !== 'function') {
    callback = function (err, html) {
      if (err) return next(err);
      res.end(html);
    };
  }

  var me = this;

  // context
  var c = utils.newContext();
  if (res.locals) for (var i in res.locals) c.setLocals(i, res.locals[i]);
  c.setLocals('server', {
    url:      req.url,
    session:  req.session,
    query:    req.query,
    params:   req.params,
    body:     req.body,
    headers:  req.headers
  });
  // TODO: i18n
  c.setLocals('i18n', {});

  // render
  me._render(name, {
    context:  c,
    cache:            me.config['enable view cache'],
    settings: {
      'view engine':  me.config['view engine'],
      'views':        me.config['views']
    }
  }, callback);
};
