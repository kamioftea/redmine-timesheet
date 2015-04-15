var express = require('express');
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');

module.exports = function (app, passport) {

	passport.serializeUser(function (user, done) {
		return done(null, user.user_id);
	});

	passport.deserializeUser(function (user_id, done) {
		models.User.find(user_id).then(function (user) {
			return done(null, user);
		})
	});

	passport.use('login', new LocalStrategy(
		{usernameField: 'email'},
		function (email, password, done) {

			models.User.find({where: {email: email}}).then(function (user) {
				if (!user) {
					return done(null, false, {message: 'Incorrect email.'});
				}

				if (!user.validatePassword(password)) {
					return done(null, false, {message: 'Incorrect password.'});
				}

				return done(null, user);
			});
		}
	));

	passport.use('signup', new LocalStrategy({
				passReqToCallback: true,
				usernameField:     'email'
			},
			function (req, email, password, done) {
				var findOrCreateUser = function () {
					// find a user in Mongo with provided username
					models.User.find({where: {email: email}}).then(function (user) {
						// already exists
						if (user) {
							return done(null, false,
								req.flash('message', 'User Already Exists'));
						}
						else {
							models.User.create({
								email:    email,
								password: models.User.makePassword(password)
							}).done(function (user) {
								return done(null, user);
							});
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
			page:    {title: 'Login'},
			message: req.flash('message')
		});
	});

	router.post(
		'/login',
		passport.authenticate('login', {
				failureRedirect: '/auth/login',
				failureFlash:    true
			}
		),
		// Wait for session to save before redirecting
		function (req, res) {
			req.session.save(function (err) {
				res.redirect('/');
			})
		}
	);

	router.get(
		'/logout',
		function (req, res, next)
		{
			req.logout();
			req.session.destroy(function (err) {
				res.redirect('/');
			})
		}
	);

	/* GET Registration Page */
	router.get('/signup', function (req, res) {
		res.render('auth/signup', {
			title:   'Sign Up | Redmine Timesheet',
			message: req.flash('message')
		});
	});

	/* Handle Registration POST */
	router.post(
		'/signup',
		passport.authenticate('signup', {
			failureRedirect: '/auth/signup',
			failureFlash:    true
		}),
		// Wait for session to save before redirecting
		function (req, res) {
			req.session.save(function (err) {
				res.redirect('/');
			})
		}
	);


	return router;
};
