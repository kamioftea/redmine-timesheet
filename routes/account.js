/**
 * Created by jeff on 27/03/2015.
 */

var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/',
	function (req, res, next){
		if(!req.user.api_host || !req.user.api_key){
			return next();
		}
		console.log(req.user.getApiUser());
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
			req.user.update(
			{
				email: req.body.email,
				password: req.body.new_password ? models.User.makePassword(req.body.new_password) : req.user.password,
				api_host: req.body.api_host,
				api_key: req.body.api_key
			}).then(function(user){
				req.flash('success', 'Account Updated');
				res.redirect('/account');
			}
		)
	}
);

module.exports = router;