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

router.use(function (req, res, next)
{
	res.locals.moduleJs = [
		'timesheet'
	];

	next()
});

/* GET home page. */
router.get('/', function (req, res) {
	var date = moment();
	res.redirect(urlFromDate(date));
});

function durationAsHoursMinutes(duration) {
	var output = [];
	if (duration.hours()) {
		output.push(duration.hours() + 'h');
	}
	if (duration.minutes()) {
		output.push(duration.minutes() + 'm');
	}
	return output.join(' ');
}
router.get('/:year/:month/:day',
	function (req, res, next) {
		if (!req.user.api_host || !req.user.api_key) {
			return next();
		}
		req.times_api = require('../api/time_entries.js')(req.user.api_host, req.user.api_key, models.ApiCache);
		req.issues_api = require('../api/issues.js')(req.user.api_host, req.user.api_key, models.ApiCache);
		req.projects_api = require('../api/projects.js')(req.user.api_host, req.user.api_key, models.ApiCache);
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
				res.locals.timeEntryActivities = _.map(timeEntryActivities, function(activity) {
					activity.selected = activity.id == req.user.default_activity_id ? 'selected' : '';
					return activity
				});
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
		req.issues_api.getMyIssues(function (err, issues) {
			res.locals.issues = [];
			res.locals.issue_lookup = {};

			if (err) {
				return next();
			}

			_.each(issues, function (issue) {
				res.locals.issues.push(issue);
				res.locals.issue_lookup[issue.id] = issue;
			});

			res.locals.issues = _.sortBy(res.locals.issues, 'subject');

			next();
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

					if (res.locals.issues[issueId] !== undefined) {
						defer.resolve(res.locals.issues[issueId])
					} else {
						req.issues_api.getIssue(issueId, function (err, issue) {
							if (err) {
								defer.reject(err)
							}
							else {
								defer.resolve(issue)
							}
						});
					}

					return defer.promise
				})
				.value()
		).then(
			function (issues) {
				var issue_lookup = [];
				_.each(issues, function (issue) {
					issue_lookup[issue.id] = issue;
				});

				_.each(res.locals.timeEntries, function (v, k, xs) {
					if (v.issue !== undefined && v.issue.id !== undefined) {
						v.issue = issue_lookup[v.issue.id];
						xs[k] = v;
					}
				});

				next();
			},
			function (err) {
				next();
			}
		)
	},
	function (req, res, next) {
		var hours = 0;
		res.locals.timeEntries = res.locals.timeEntries.map(function (v) {
			hours += v.hours;
			v.hours = durationAsHoursMinutes(moment.duration(v.hours, 'hours'));
			return v;
		});

		res.locals.totalHours = durationAsHoursMinutes(moment.duration(hours, 'hours'));

		next();
	},
	function (req, res, next) {
		req.projects_api.getProjects(function (err, projects) {
			if (err) {
				res.flash('error', err);
			}
			else {
				// First make projects aware of their children and build the indent strings
				projects = _.reduce(projects, function (acc, project) {
					project.children = [];
					project.indent = '';
					if (acc[project.id] !== undefined) {
						project.children = acc[project.id].children || [];
						project.indent = acc[project.id].indent || ''
					}

					if (project.parent !== undefined) {
						if (acc[project.parent.id] === undefined) {
							acc[project.parent.id] = {
								id:       project.parent.id,
								name:     project.parent.name,
								children: [],
								indent:   ''
							}
						}

						project.indent = acc[project.parent.id].indent + '&nbsp;&nbsp;';
						_.each(project.children, function (child_project) {
							child_project.indent = project.indent + '&nbsp;&nbsp;';
						});
						acc[project.parent.id].children.push(project.id);
					}

					acc[project.id] = project;

					return acc;
				}, {});

				// then starting with the parents as roots, build a forest of projects with sorted children
				var root_projects = _.chain(projects)
					.filter(function (project) {
						return !project.parent
					})
					.sortBy('name')
					.value();

				function injectChildren(project) {
					project.children = _.chain(project.children)
						.map(function (project_id) {
							return injectChildren(projects[project_id]);
						})
						.sortBy('name')
						.value();

					return project;
				}

				var project_forest = _.map(root_projects, injectChildren);

				// Then flatten the forest again.
				function reduceChildrenIter(forest, acc) {
					acc = acc || [];
					_.reduce(forest, function (acc, project) {
						acc.push(project);
						return reduceChildrenIter(project.children, acc)
					}, acc);
					return acc;
				}

				res.locals.projects = reduceChildrenIter(project_forest)
			}
			next();
		});
	},
	function (req, res) {
		res.render('timesheet/index', {
			date:        req.date.format('dddd Do MMMM YYYY'),
			spent_on:    req.date.format('YYYY-MM-DD'),
			previousUrl: urlFromDate(relativeWeekDay(moment(req.date), -1)),
			nextUrl:     urlFromDate(relativeWeekDay(moment(req.date), 1)),
			message:     req.flash('message')
		});
	}
);


module.exports = function (app) {

	var partials = app.get('partials');

	partials.time_entry_form = 'timesheet/partial/time_entry_form';

	app.set('partials', partials);

	return router;
};

