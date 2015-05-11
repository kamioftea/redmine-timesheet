var request = require('request');

module.exports = function (api_host, api_key, cache) {

	function getTimeEntryActivities(cb) {
		var url = api_host + '/enumerations/time_entry_activities.json?key=' + api_key;
		var doRequest = function (reqCb) {
			request(url, function (err, response, body) {
				if (err) {
					return reqCb(err);
				}
				if (response.statusCode !== 200) {
					return reqCb(body);
				}

				if (cache) {
					cache.upsert({
						url:  url,
						etag: response.headers['ETag'],
						body: body
					});
				}

				return reqCb(null, JSON.parse(body).time_entry_activities);
			});
		};

		if (cache) {
			cache.find({where: {url: url}})
				.then(function (cachedResponse) {
					if (cachedResponse) {
						cb(null, JSON.parse(cachedResponse.body).time_entry_activities)
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

	function getTimeEntries(qs, cb) {
		var url = api_host + '/time_entries.json';
		var unique_url = url + JSON.stringify(qs);
		qs.key = api_key;
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
							url: unique_url,
							etag: response.headers['ETag'],
							body: body
						});
					}
				}

				return reqCb(null, JSON.parse(body).time_entries);
			});
		};

		if (cache) {
			cache.find({where: {url: unique_url}})
				.then(function (cachedResponse) {
					if (cachedResponse) {
						cb(null, JSON.parse(cachedResponse.body).time_entries);
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
		getTimeEntries:         getTimeEntries,
		getTimeEntryActivities: getTimeEntryActivities
	}
};