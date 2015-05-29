var request = require('request');

module.exports = function (api_host, api_key, cache) {

	function getIssue(id, cb) {
		var url = api_host + '/issues/' + id + '.json';
		var qs = {key: api_key};
		var options = {
			url: url,
			qs:  qs
		};

		apiRequest(options, url, 'issue', cb);
	}

	function getMyIssues(cb) {
		var url = api_host + '/issues.json';
		var qs = {
			key:            api_key,
			assigned_to_id: 'me',
			limit: 100
		};
		var options = {
			url: url,
			qs:  qs
		};
		apiRequest(options, 'issues/assigned_to_me', 'issues', cb);
	}

	function apiRequest(options, cache_key, root_property, cb) {
		var doRequest = function (reqCb) {
			request(options, function (err, response, body) {
				if (err) {
					return reqCb(err);
				}
				if (response.statusCode !== 200) {
					return reqCb(body);
				}

				if (cache) {
					if (cache) {
						cache.upsert({
							url:  cache_key,
							etag: response.headers['ETag'],
							body: body
						});
					}
				}

				return reqCb(null, JSON.parse(body)[root_property]);
			});
		};

		if (cache) {
			cache.find({where: {url: cache_key}})
				.then(function (cachedResponse) {
					if (cachedResponse) {
						cb(null, JSON.parse(cachedResponse.body)[root_property]);
						// also refresh the cache
						doRequest(function () {
						});
					}
					else {
						doRequest(cb)
					}
				})

		}
		else {
			doRequest(cb);
		}
	}

	return {
		getIssue:    getIssue,
		getMyIssues: getMyIssues
	}
};