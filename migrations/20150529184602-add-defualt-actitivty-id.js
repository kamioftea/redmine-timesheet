'use strict';

module.exports = {
  up: function (migration, DataTypes) {
	  migration.addColumn('user', 'default_activity_id', DataTypes.INTEGER)
  },

  down: function (migration, DataTypes) {
	  migration.removeColumn('user', 'default_activity_id', DataTypes.INTEGER)
  }
};
