var bCrypt = require('bcrypt-nodejs');

"use strict";

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define("User", {
		user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		email: {type: DataTypes.STRING, unique: true},
		password: {type: DataTypes.STRING(60)},
		api_host: {type: DataTypes.STRING},
		api_key: {type: DataTypes.STRING(40)}
	}, {
		classMethods: {
			associate: function(models) {
				User.hasOne(models.ApiUser)
			},
			makePassword: function(password) {
				return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
			}
		},
		instanceMethods: {
			validatePassword: function(password) {
				return bCrypt.compareSync(password, this.password);
			}
		}
	});

	return User;
};
