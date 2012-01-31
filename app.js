
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , require_login = require('./lib/require_login.js');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "shelby tv ftw bitches" }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', require_login, routes.index);
app.post('/login', routes.login);
app.get('/wipe',require_login, routes.render_wipe);
app.post('/wipe',require_login, routes.wipe_user);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
