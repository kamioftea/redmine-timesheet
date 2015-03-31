var express = require('express');
var LocalStrategy = require('passport-local').Strategy;
var userService = require('../model/user');

module.exports = function (app, passport) {

	passport.serializeUser(function (user, done) {
		done(null, user.email);
	});

	passport.deserializeUser(function (email, done) {
		userService.getUserByEmail(email, function (err, user) {
			done(err, user);
		});
	});

	passport.use('login', new LocalStrategy(
		{usernameField: 'email'},
		function (email, password, done) {

			userService.getUserByEmail(email, function (err, user) {
				if (err) {
                  	console.log('err: '+err);
					return done(err);
				}
				if (!user) {
                  console.log('no user');
					return done(null, false, {message: 'Incorrect email.'});
				}

				if (!userService.validPassword(user, password)) {
                  console.log('pass no match');
                  console.log(user);
				  return done(null, false, {message: 'Incorrect password.'});
				}
              console.log('ok');
				return done(null, user);
			});
		}
	));

	passport.use('signup', new LocalStrategy({
				passReqToCallback: true,
				usernameField:     'email'
			},
			function (req, email, password, done) {
				var findOrCreateUser = function () {
					// find a user in Mongo with provided username
					userService.getUserByEmail({'email': email}, function (err, user) {
						// In case of any error return
						if (err) {
							return done(err);
						}
						// already exists
						if (user) {
							return done(null, false,
								req.flash('message', 'User Already Exists'));
						}
						else {
							userService.addUser(
								email,
								password,
								null,
								null,
								function (err, user) {
									if (err) {
										throw err;
									}
									return done(null, user);
								}
							);
						}
					});
				};

				// Delay the execution of findOrCreateUser and execute
				// the method in the next tick of the event loop
				process.nextTick(findOrCreateUser);
			})
	);

	app.use(function (req, res, next) {
		if (req.isAuthenticated() || req.path.match(/^\/auth/)) {
			return next();
		}
		res.redirect('/auth/login');
	});

	var router = express.Router();

	/* GET home page. */
	router.get('/login', function (req, res) {
		res.render('auth/login', {
			page: {title: 'Login'},
			message: req.flash('message')
		});
	});

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/',
		failureRedirect: '/auth/login',
		failureFlash:    true
	}));

	router.get('/logout', function(req, res){
		req.logout();
		res.redirect('/auth/login');
	});

	/* GET Registration Page */
	router.get('/signup', function (req, res) {
		res.render('auth/signup', {
			title:   'Sign Up | Redmine Timesheet',
			message: req.flash('message')
		});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/',
		failureRedirect: '/auth/signup',
		failureFlash:    true
	}));


	return router;
};
