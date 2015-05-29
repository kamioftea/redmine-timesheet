/**
 * Created by jeff on 27/03/2015.
 */

var express = require('express');
var router = express.Router();
var models = require('../models');
var _ = require('underscore');

router.get('/',
	function (req, res, next) {
		if (!req.user.api_host || !req.user.api_key) {
			return next();
		}
		req.user.getOrCreateApiUser(function (err, api_user) {
			res.locals.api_user = api_user;
			next();
		});
	},
	function (req, res, next) {
		var times_api = require('../api/time_entries.js')(req.user.api_host, req.user.api_key, models.ApiCache);

		times_api.getTimeEntryActivities(function (err, timeEntryActivities) {
			res.locals.timeEntryActivities = [];
			if (!err) {
				res.locals.timeEntryActivities = _.map(timeEntryActivities, function(activity) {
					activity.selected = activity.id == req.user.default_activity_id ? 'selected' : '';
					return activity
				});
			}
			next();
		})
	},
	function (req, res) {
		res.render('account/index', {
			page:    {title: 'Account'},
			message: req.flash('message')
		});
	}
);

router.post('/',
	function (req, res) {
		console.log(req.body);
		req.user.update(
			{
				email:               req.body.email,
				password:            req.body.new_password ? models.User.makePassword(req.body.new_password) : req.user.password,
				api_host:            req.body.api_host,
				api_key:             req.body.api_key,
				default_activity_id: req.body.default_activity_id
			}).then(function (user) {
				console.log(user);
				req.flash('success', 'Account Updated');
				res.redirect('/account');
			}
		)
	}
);

module.exports = router;