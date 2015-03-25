/**
 * Created by Jeff on 24/03/2015.
 */
var sqlite3 = require('sqlite3').verbose();
var db =  new sqlite3.Database('data/v1.db');

db.run("CREATE TABLE IF NOT EXISTS user (" +
	"email VARCHAR(255), " +
	"password VARCHAR(60), " +
	"host VARCHAR(255), " +
	"key VARCHAR(40), " +
	"PRIMARY KEY (email)" +
")");

function getUsers(cb)
{
	var users = [];
	db.each("SELECT email, host, key FROM user", function (err, row) {
		if (err) {
			return cb(err)
		}
		users.push(row);
	}, function(err){
		return cb(err, users);
	});
}

function getUser(email, cb)
{
	var sql =
		"SELECT email, password, host, key" +
		" FROM user" +
		" WHERE email = ?";

	console.log(sql);

	db.get(sql,[email], function (err, row) {
		console.log(email);
		console.log(row);
		return cb(err, row);
	});
}

function addUser(email, password, host, key, cb)
{
	var sql =
		"INSERT INTO user (email, password, host, key)" +
		" VALUES (?, ?, ?, ?)";

	db.run(sql,[email, password, host, key], function (err, row) {
		return cb(err, row);
	});
}

function validPassword(user, password)
{
	// TODO: bcrypt
	return user.password === password;
}

module.exports = {
	getUser: getUser,
	getUsers: getUsers,
	addUser: addUser,
	validPassword: validPassword
};