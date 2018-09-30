var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");

var middlewareObject = {};

middlewareObject.isLoggedIn = function(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please Login or Sign Up.");
  res.redirect("back");
}

middlewareObject.verifyCampgroundOwnership = function(req, res, next) {
  if(req.isAuthenticated()) {
    Campground.findById(req.params.id, function(err, campground) {
      if(err) {
        req.flash("error", "Campground Not Found");
        res.redirect("back");
      } else {
        if(campground.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "Permission Denied");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Please Login or Sign Up");
    res.redirect("back");
  }
}

middlewareObject.verifyCommentOwnership = function(req, res, next) {
  if(req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function(err, comment) {
      if(err) {
        req.flash("error", "Comment Not Found");
        res.redirect("back");
      } else {
        if(comment.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "Permission Denied");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Please Login or Sign Up");
    res.redirect("back");
  }
}

middlewareObject.verifyUserIdentity = function(req, res, next) {
  if(req.isAuthenticated()) {
    User.findById(req.params.user_id, function(err, user) {
      if(err) {
        req.flash("error", "User Not Found.");
        req.redirect("back");
      } else {
        if(user._id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "Permission Denied");
          res.redirect("back");
        }
      }
    })
  } else {
    req.flash("error", "Please Login or Sign Up");
    res.redirect("back");
  }
}

module.exports = middlewareObject;