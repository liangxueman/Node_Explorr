var express = require("express");
var request = require("request");
var express_sanitizer = require("express-sanitizer");
var body_parser = require("body-parser");
var method_override = require("method-override");
var flash = require("connect-flash");
var moment = require("moment");
var mongoose = require("mongoose");
var passport = require("passport");
var passport_local = require("passport-local");
var passport_local_mongoose = require("passport-local-mongoose");

// requiring routes
var route_index = require("./routes/index");
var route_campground = require("./routes/campgrounds");
var route_comment = require("./routes/comments");
var route_user = require("./routes/user");

//mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true });
mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true });

// requiring models
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");

var app = express();
app.set("view engine", "ejs");
app.use(express_sanitizer());
app.use(body_parser.urlencoded({extended: true}));
// "__dirname" refers to the directory this script is running
app.use(express.static(__dirname + '/public'));
app.use(method_override("_method"));
app.use(flash());

app.locals.moment = moment;

// Passport configurations
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passport_local(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// pass the user(nav bar) object to every route
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use(route_index);
app.use(route_campground);
app.use(route_comment);
app.use(route_user);

// var seedsDB = require("./seeds");
// seedsDB();

// Listen
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server listening at port " + process.env.PORT + "...");
});