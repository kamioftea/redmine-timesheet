var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
	  message: req.flash('message')
  });
});

router.get('/api/:path([0-9a-z_\\-\\/]+)*', function(req, res)
{
	var url = req.user.api_host + '/' + req.params.path + '.json';

	var qs = req.query;
	qs.key = req.user.api_key;

	var options = {
		url: url,
		qs: qs
	};

	request(options, function (err, response, body) {
		if (err || response.statusCode !== 200) {

			console.log(err);
			console.log(response.statusCode);

			return res.json({
				options: options,
				params: req.params,
				success: false,
				err: err,
				statusCode: response.statusCode
			});
		}

		return res.json({
			options: options,
			params: req.params,
			response: JSON.parse(body)
		});
	});
});

module.exports = router;
