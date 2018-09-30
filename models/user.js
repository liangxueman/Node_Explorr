var mongoose = require("mongoose");
var passport_local_mongoose = require("passport-local-mongoose");

var user_schema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    firstname: String, 
    lastname: String,
    gender: String,
    // email: { type: String, unique: true, required: true },
    email: String,
    password: String,
    avatar: String,
    reset_password_token: String, 
    reset_password_expires: Date
});

user_schema.plugin(passport_local_mongoose);
module.exports = mongoose.model("User", user_schema);