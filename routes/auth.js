var express = require('express');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../model/user');

module.exports = function (app, passport) {

	passport.serializeUser(function(user, done) {
		done(null, user.email);
	});

	passport.deserializeUser(function(email, done) {
		User.getUser(email, function(err, user) {
			done(err, user);
		});
	});

	passport.use(new LocalStrategy(
		{ usernameField: 'email' },
		function(email, password, done) {

			User.getUser(email, function(err, user) {
				if (err) { return done(err); }
				if (!user) {
					console.log('No user: ' + email);
					return done(null, false, { message: 'Incorrect email.' });
				}

				if (!User.validPassword(user, password)) {
					console.log('Password: ' + user.password + ' vs ' + password);
					return done(null, false, { message: 'Incorrect password.' });
				}
				return done(null, user);
			});
		}
	));

	app.use(function(req, res, next){
		if (req.isAuthenticated() || req.path.match(/^\/auth/)) {
			console.log(req.path);
			return next();
		}
		console.log(req.path);
		res.redirect('/auth/login');
	});

	var router = express.Router();

	/* GET home page. */
	router.get('/login', function (req, res, next) {
		res.render('login', {title: 'Login | Redmine Timesheet'});
	});

	router.post('/login', passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/auth/login',
		failureFlash:    false
	}));

	return router;
};
