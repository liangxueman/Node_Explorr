var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");

// ===============================
//         User Route
// ===============================
// SHOW
router.get("/users/:user_id", function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
    if(err) {
      console.log(err);
      req.flash("error", "User Not Found");
      res.redirect("back");
    } else {
      Campground.find().where("author.id").equals(user._id).exec(function(err, campgrounds) {
        if(err) {
          console.log(err);
          res.redirect("back");
        } else {
          res.render("users/show", {viewUser: user, viewCampgrounds: campgrounds});
        }
      });
    }
  });
});

// EDIT
router.get("/users/:user_id/edit", middleware.verifyUserIdentity, function(req, res) {
  User.findById(req.params.user_id, function(err, user) {
    if(err) {
      console.log(err);
      req.flash("error", "Fail to retrive data. Please try again later.");
      res.redirect("back");
    } else {
      res.render("users/edit", {viewUser: user});
    }
  });
});

// UPDATE
router.put("/users/:user_id", middleware.verifyUserIdentity, function(req, res) {
  User.findByIdAndUpdate(req.params.user_id, req.body.viewUser, function(err, user) {
    if(err) {
      console.log(err);
      req.flash("error", "Fail to update user profile. Please try again later.");
      res.redirect("back");
    } else {
      res.redirect("/users/" + user._id);
    }
  });
});

module.exports = router;