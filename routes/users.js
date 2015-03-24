var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db =  new sqlite3.Database('data/v1.db');

function ensureDatabase(req, res, next)
{
	db.run("CREATE TABLE IF NOT EXISTS user (host VARCHAR(255), key VARCHAR(40), PRIMARY KEY (host, key))", function(err)
	{
		if (err)
		{
			return res.status(500).send(err);
		}
		next();
	});
}

router.post('/add',
	ensureDatabase,
	function(req, res, next){
		console.log(req.body);
		db.prepare("INSERT INTO user (host, key) VALUES(?,?)").run([
			req.body.api_host,
			req.body.api_key
		], function(err){
			if (err)
			{
				return res.status(500).send(err);
			}
			res.redirect('/users')
		});

	}
);

/* GET users listing. */
router.get('/',
	ensureDatabase,
	function(req, res, next) {
		req.users = [];
		db.each("SELECT host, key FROM user", function (err, row) {
			if (err) {
				req.users.push(err);
				return;
			}
			req.users.push(row);
		}, function(err, rows){
			if (err)
			{
				users.push(err)
			}

			next();
		});
	}, function(req, res, next) {
		res.json(req.users);
	}
);

module.exports = router;
