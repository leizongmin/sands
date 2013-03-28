
var loadPlugin = require('../').load;
var express = require('express');

var app = express();
var plugin = loadPlugin('.');

console.log(plugin);

app.configure(function () {
  app.set('env', 'developement');
  app.use(express.favicon());
  app.use(express.urlencoded());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('fdsfdsfd'));
  app.use(express.compress());

  app.use(plugin.handler());
  app.use(app.router);
});
plugin.bind(app);
app.listen(8080);
