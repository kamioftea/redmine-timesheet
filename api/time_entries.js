var request = require('request');
var moment = require('moment');

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
		qs.key = api_key;
		var options = {
			url: url,
			qs: qs
		};

		request(options, function (err, response, body) {
			if (err) {
				return cb(err);
			}
			if (response.statusCode !== 200) {
				return cb(body);
			}
			return cb(null, JSON.parse(body).time_entries);
		});
	}

	return {
		getTimeEntries:         getTimeEntries,
		getTimeEntryActivities: getTimeEntryActivities
	}
};