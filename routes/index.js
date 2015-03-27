var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', {
		title: 'Redmine Timesheet',
		user: req.user,
		message: req.flash('message')
	});
});

module.exports = router;
