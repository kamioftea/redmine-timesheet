"use strict";

module.exports = function(sequelize, DataTypes) {
	var ApiCache = sequelize.define("ApiCache", {
		url: { type: DataTypes.STRING(512), unique: true},
		etag: {type: DataTypes.STRING},
		body: {type: DataTypes.TEXT}
	}, {
		classMethods: {
			
		}
	});

	return ApiCache;
};