/**
 * Created by Jeff on 24/03/2015.
 */
var sqlite3 = require('sqlite3').verbose();
var db =  new sqlite3.Database('data/v1.db');
var bCrypt = require('bcrypt-nodejs');

db.run("CREATE TABLE IF NOT EXISTS user (" +
	"user_id INTEGER PRIMARY KEY, " +
	"email VARCHAR(255), " +
	"password VARCHAR(60), " +
	"api_host VARCHAR(255), " +
	"api_key VARCHAR(40), " +
	"UNIQUE (email)" +
")");

function getUsers(cb)
{
	var users = [];
	db.each("SELECT user_id, email, api_host, api_key FROM user", function (err, row) {
		if (err) {
			return cb(err)
		}
		users.push(row);
	}, function(err){
		return cb(err, users);
	});
}

function getUser(user_id, cb)
{
	var sql =
		"SELECT user_id, email, password, api_host, api_key" +
		" FROM user" +
		" WHERE user_id = ?";

	db.get(sql,[user_id], function (err, row) {
		return cb(err, row);
	});
}

function getUserByEmail(email, cb)
{
	var sql =
		"SELECT user_id, email, password, api_host, api_key" +
		" FROM user" +
		" WHERE email = ?";

	db.get(sql,[email], function (err, row) {
		return cb(err, row);
	});
}

function getHashedPassword(password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

function addUser(email, password, api_host, api_key, cb)
{
	var sql =
		"INSERT INTO user (email, password, api_host, api_key)" +
		" VALUES (?, ?, ?, ?)";
	var hash = getHashedPassword(password);
	db.run(sql,[email, hash, api_host, api_key], function (err) {
		if(err) { cb(err) }
		getUser(this.lastID, cb);
	});
}

function updateUser(user, data, cb)
{
	var sql =
		"UPDATE user SET" +
			" email = ?," +
			" password = ?," +
			" api_host = ?," +
			" api_key = ?" +
		"WHERE user_id = ?";

	var email = data.email || user.email;
	var password = data.password ? getHashedPassword(data.password) : user.password;
	var api_host = data.api_host || user.api_host;
	var api_key = data.api_key || user.api_key;

	db.run(sql,[email, password, api_host, api_key, user.user_id], function (err) {
		if(err) { cb(err) }
		getUser(this.lastID, cb);
	});
}

function validPassword(user, password)
{
	return bCrypt.compareSync(password, user.password);
}

module.exports = {
	getUser: getUser,
	getUserByEmail: getUserByEmail,
	getUsers: getUsers,
	addUser: addUser,
	updateUser: updateUser,
	validPassword: validPassword
};