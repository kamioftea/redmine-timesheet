var bCrypt = require('bcrypt-nodejs');

"use strict";

module.exports = function (sequelize, DataTypes) {
	var User = sequelize.define("User", {
		user_id:  {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
		email:    {type: DataTypes.STRING, unique: true},
		password: {type: DataTypes.STRING(60)},
		api_host: {type: DataTypes.STRING},
		api_key:  {type: DataTypes.STRING(40)}
	}, {
		classMethods:    {
			associate:    function (models) {
				User.hasOne(models.ApiUser)
			},
			makePassword: function (password) {
				return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
			}
		},
		instanceMethods: {
			validatePassword:   function (password) {
				return bCrypt.compareSync(password, this.password);
			},
			getOrCreateApiUser: function (cb) {
				var user = this;

				this.getApiUser().then(function(ApiUser){
					if (ApiUser) {
						return cb(null, ApiUser);
					}
					
					if (!user.api_host || !user.api_key)
					{
						return cb('User doesn\'t have API credentials');
					}

					var api = require('../api/users.js')(user.api_host, user.api_key);
					api.getCurrentUser(function (err, api_user) {
						if (err) {
							return cb(err)
						}

						sequelize.models.ApiUser.create(api_user).then(function(ApiUser) {
							ApiUser.setUser(user);
							ApiUser.save().then(function (ApiUser) {
								return cb(null, ApiUser);
							}, function (err) {
								return cb(err);
							});
						}, function(err) {
							return cb(err)
						});
					});
				}, function(err){
					return cb(err);
				});

			}
		}
	});

	return User;
};
