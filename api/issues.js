var request = require('request');

module.exports = function (api_host, api_key, cache) {

	function getIssue(id, cb) {
		var url = api_host + '/issues/'+id+'.json';
		var qs = {key: api_key};
		var options = {
			url: url,
			qs: qs
		};

		var doRequest = function (reqCb) {
			request(options, function (err, response, body) {
				if (err) {
					return reqCb(err);
				}
				if (response.statusCode !== 200) {
					return reqCb(body);
				}

				if(cache) {
					if (cache) {
						cache.upsert({
							url: url,
							etag: response.headers['ETag'],
							body: body
						});
					}
				}

				return reqCb(null, JSON.parse(body).issue);
			});
		};

		if (cache) {
			cache.find({where: {url: url}})
				.then(function (cachedResponse) {
					if (cachedResponse) {
						cb(null, JSON.parse(cachedResponse.body).issue);
						// also refresh the cache
						doRequest(function(){console.log('refreshed cache')});
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
		getIssue:         getIssue
	}
};