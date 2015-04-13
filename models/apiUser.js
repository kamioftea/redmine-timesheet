"use strict";

module.exports = function(sequelize, DataTypes) {
	var ApiUser = sequelize.define("ApiUser", {
		id: { type: DataTypes.INTEGER},
		login: {type: DataTypes.STRING},
		firstname: {type: DataTypes.STRING},
		lastname: {type: DataTypes.STRING},
		created_on: {type: DataTypes.DATE}
	}, {
		classMethods: {
			associate: function(models) {
				ApiUser.belongsTo(models.User)
			}
		}
	});

	return ApiUser;
};