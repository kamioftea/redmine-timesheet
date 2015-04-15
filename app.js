var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hoganExpress = require('hogan-express');
var session = require('express-session');
var flash = require('connect-flash');
var passport = require('passport');
var config = require('config');

var Sequelize = require('sequelize');
var sequelize = new Sequelize(
	config.get('db.database'),
	config.get('db.username'),
	config.get('db.password'),
	config.get('db.options')
);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('mustache', hoganExpress);
app.set('view engine', 'mustache');

app.set('layout', 'layout/layout');
app.set('partials', {top_nav: "partial/top_nav"});

app.locals.site = config.get('site');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setup session with DB store
var sessionConfig = config.get('session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var store = new SequelizeStore({ db: sequelize });
store.sync();
sessionConfig.store = store;
app.use(session(sessionConfig));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

var auth = require('./routes/auth')(app, passport);

app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

var index = require('./routes/index');
var account = require('./routes/account');
var timesheet = require('./routes/timesheet');

app.use('/auth', auth);
app.use('/', index);
app.use('/account', account);
app.use('/timesheet', timesheet);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
