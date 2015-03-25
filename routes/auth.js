var express = require('express');

module.exports = function (app, passport) {
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
