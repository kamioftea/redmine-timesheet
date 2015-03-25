var express = require('express');
var router = express.Router();
var user = require('../model/user.js');

router.post('/add',
	function (req, res) {
		user.addUser(
			req.body.email,
			"",
			req.body.api_host,
			req.body.api_key,
			function (err) {
				if (err) {
					return res.status(500).send(err);
				}
				res.redirect('/users')
			});
	}
);

/* GET users listing. */
router.get('/',
	function (req, res, next) {
		user.getUsers(function(err, users){
			if(err)
			{
				return res.status(500).send(err)
			}
			req.users = users;
			next();
		})
	}, function (req, res) {
		res.json(req.users);
	}
);

module.exports = router;
