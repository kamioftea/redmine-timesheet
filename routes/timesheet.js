var express = require('express');
var router = express.Router();
var moment = require('moment');

function relativeWeekDay(date, days)
{
	if (days == 0) return date;
	var delta = days < 0 ? -1 : 1;
	date.add(delta, 'days');
	if (date.day() > 0 && date.day() < 6)
	{
		days = days - delta;
	}
	return relativeWeekDay(date, days)
}

function urlFromDate(date)
{
	return '/timesheet/' + date.year() + '/' + date.month() + '/' + date.date();
}

/* GET home page. */
router.get('/', function (req, res, next) {
	var date = moment();
	res.redirect(urlFromDate(date));
});

router.get('/:year/:month/:day', function (req, res, next) {
	var date = moment([req.params.year, req.params.month, req.params.day]);

	res.render('timesheet/index', {
		date:    date.format('dddd Do MMMM YYYY'),
		previousUrl: urlFromDate(relativeWeekDay(moment(date), -1)),
		nextUrl: urlFromDate(relativeWeekDay(moment(date), 1)),
		message: req.flash('message')
	});
});

module.exports = router;
