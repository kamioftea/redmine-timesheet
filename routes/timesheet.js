var express = require('express');
var router = express.Router();
var moment = require('moment');
var models = require('../models');

function relativeWeekDay(date, days) {
	if (days == 0) {
		return date;
	}
	var delta = days < 0 ? -1 : 1;
	date.add(delta, 'days');
	if (date.day() > 0 && date.day() < 6) {
		days = days - delta;
	}
	return relativeWeekDay(date, days)
}

function urlFromDate(date) {
	return '/timesheet/' + date.year() + '/' + date.month() + '/' + date.date();
}

/* GET home page. */
router.get('/', function (req, res, next) {
	var date = moment();
	res.redirect(urlFromDate(date));
});

router.get('/:year/:month/:day',
	function (req, res, next) {
		if (!req.user.api_host || !req.user.api_key) {
			return next();
		}
		req.api = require('../api/time_entries.js')(req.user.api_host, req.user.api_key, models.ApiCache);
		req.date = moment([req.params.year, req.params.month, req.params.day]);
		next()
	},
	function (req, res, next) {
		if (!req.api) {
			return next();
		}

		req.api.getTimeEntryActivities(function (err, timeEntryActivities) {
			if (err) {
				res.flash('error', err);
			}
			else {
				res.locals.timeEntryActivities = timeEntryActivities;
			}
			next();
		})
	},
	function (req, res, next) {
		if (!req.api) {
			return next();
		}

		req.user.getOrCreateApiUser(function (err, apiUser) {
			if (err) {
				return next();
			}

			var qs = {
				user_id: apiUser.id,
				spent_on: req.date.format('YYYY-MM-DD')
			};

			console.log(qs);

			req.api.getTimeEntries(qs, function (err, timeEntries) {
				if (err) {
					res.flash('error', err);
				}
				else {
					res.locals.timeEntries = timeEntries;
				}
				next();
			})
		});
	},
	function (req, res) {
		res.render('timesheet/index', {
			date:        req.date.format('dddd Do MMMM YYYY'),
			previousUrl: urlFromDate(relativeWeekDay(moment(req.date), -1)),
			nextUrl:     urlFromDate(relativeWeekDay(moment(req.date), 1)),
			message:     req.flash('message')
		});
	}
);

module.exports = router;
