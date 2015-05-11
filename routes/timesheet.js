var express = require('express');
var router = express.Router();
var moment = require('moment');
var models = require('../models');
var Q = require('q');
var _ = require('underscore');

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
	return '/timesheet/' + date.year() + '/' + (date.month() + 1) + '/' + date.date();
}

/* GET home page. */
router.get('/', function (req, res) {
	var date = moment();
	res.redirect(urlFromDate(date));
});

router.get('/:year/:month/:day',
	function (req, res, next) {
		if (!req.user.api_host || !req.user.api_key) {
			return next();
		}
		req.times_api = require('../api/time_entries.js')(req.user.api_host, req.user.api_key, models.ApiCache);
		req.issue_api = require('../api/issues.js')(req.user.api_host, req.user.api_key, models.ApiCache);
		req.date = moment([req.params.year, req.params.month - 1, req.params.day]);
		next()
	},
	function (req, res, next) {
		if (!req.times_api) {
			return next();
		}

		req.times_api.getTimeEntryActivities(function (err, timeEntryActivities) {
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
		if (!req.times_api) {
			return next();
		}

		req.user.getOrCreateApiUser(function (err, apiUser) {
			if (err) {
				return next();
			}

			var qs = {
				user_id:  apiUser.id,
				spent_on: req.date.format('YYYY-MM-DD')
			};

			req.times_api.getTimeEntries(qs, function (err, timeEntries) {
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
	function (req, res, next) {
		Q.all(
			_.chain(res.locals.timeEntries)
				.filter(function (timeEntry) {
					return timeEntry.issue !== undefined;
				})
				.map(function (timeEntry) {
					return timeEntry.issue.id;
				})
				.unique()
				.map(function (issueId) {
					var defer = Q.defer();

					console.log('Issue');
					console.log(issueId);

					req.issue_api.getIssue(issueId, function (err, issue) {
						if (err) {
							defer.reject(err)
						}
						else {
							defer.resolve(issue)
						}
					});

					return defer.promise
				})
				.value()
		).then(
			function (issues) {
				var issue_lookup = [];
				_.each(issues, function (issue) {
					issue_lookup[issue.id] = issue;
				});

				_.each(res.locals.timeEntries, function(v,k,xs){
					if(v.issue !== undefined && v.issue.id !== undefined)
					{
						v.issue = issue_lookup[v.issue.id];
						xs[k] = v;
					}
				});

				next();
			},
			function(err)
			{
				console.log(err);
				next();
			}
		)
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
