/**
 * Created by Jeff on 24/03/2015.
 */
var sqlite3 = require('sqlite3').verbose();
var db =  new sqlite3.Database('data/v1.db');
var bCrypt = require('bcrypt-nodejs');

db.run("CREATE TABLE IF NOT EXISTS user (" +
	"user_id INTEGER PRIMARY KEY, " +
	"email VARCHAR(255), " +
	"password VARCHAR(60), " +
	"host VARCHAR(255), " +
	"key VARCHAR(40), " +
	"UNIQUE (email)" +
")");

function getUsers(cb)
{
	var users = [];
	db.each("SELECT user_id, email, host, key FROM user", function (err, row) {
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
		"SELECT email, password, host, key" +
		" FROM user" +
		" WHERE user_id = ?";

	db.get(sql,[user_id], function (err, row) {
		return cb(err, row);
	});
}

function getUserByEmail(email, cb)
{
	var sql =
		"SELECT email, password, host, key" +
		" FROM user" +
		" WHERE email = ?";

	db.get(sql,[email], function (err, row) {
		return cb(err, row);
	});
}

function addUser(email, password, host, key, cb)
{
	var sql =
		"INSERT INTO user (email, password, host, key)" +
		" VALUES (?, ?, ?, ?)";

	var hash = bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);

	db.run(sql,[email, hash, host, key], function (err) {
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
	validPassword: validPassword
};