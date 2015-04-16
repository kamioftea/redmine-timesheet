"use strict";

module.exports = function(sequelize, DataTypes) {
	var TimeEntry = sequelize.define("TimeEntry", {
		issue_id: { type: DataTypes.INTEGER},
		spent_on: {type: DataTypes.DATE},
		hours: {type: DataTypes.FLOAT},
		activity_id: {type: DataTypes.INTEGER},
		comments: {type: DataTypes.STRING}
	}, {
		classMethods: {
			
		}
	});

	return TimeEntry;
};