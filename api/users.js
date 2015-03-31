var request = require('request');
var moment = require('moment');

module.exports = function(api_host, api_key){
	function getCurrentUser(cb){
		var url = api_host + '/users/current.json?key=' + api_key;
		
		request(url, function(err, response, body){
			if (err){
				return cb(err);
			}
			if(response.statusCode !== 200){
				return cb(body);
			}
			data = JSON.parse(body);
			if(data.user === undefined)
			{
				return cb('No user returned in response')
			}
			if(data.user.last_login_on)
			{
				data.user.last_login_on = moment(data.user.last_login_on).format("ddd Do MMM YYYY, H:mm:ss");
			}
			return cb(null, data.user);
		});
	}
	
	return {
		getCurrentUser: getCurrentUser
	}
}