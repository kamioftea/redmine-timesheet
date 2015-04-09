/**
 * Created by jeff on 27/03/2015.
 */

var express = require('express');
var router = express.Router();
var userService = require('../model/user.js');

router.get('/',
	function (req, res, next){
		if(!req.user.api_host || !req.user.api_key){
			return next();
		}
		var api = require('../api/users.js')(req.user.api_host, req.user.api_key);
		api.getCurrentUser(function(err, api_user){
			res.locals.api_user = api_user;
			return next();
		});
	},
	function (req, res) {
		res.render('account/index', {
			page: {title: 'Account'},
			message: req.flash('message')
		});
	}
);

router.post('/',
	function (req, res) {
		userService.updateUser(
			req.user,
			{
				email: req.body.email,
				password: req.body.new_password,
				api_host: req.body.api_host,
				api_key: req.body.api_key
			},
			function(err, user){
				if(err) {
					req.flash('error', err)
				}
				else {
					req.flash('success', 'Account Updated')
				}
				res.redirect('/account');
			}
		)
	}
);

module.exports = router;