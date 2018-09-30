var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// ===============================
//        Comment Route
// ===============================
// NEW
router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function(req, res) {
  Campground.findById(req.params.id, function(err, campground) {
    if(err) {
      console.log(err);
    } else {
      res.render("comments/new", {campground: campground});
    }
  });
});

// CREATE
router.post("/campgrounds/:id/comments", middleware.isLoggedIn, function(req, res) {
  // Look up campgrounds using id
  Campground.findById(req.params.id, function(err, campground) {
    if(err) {
      console.log(err);
    } else {
      // Create new comment
      Comment.create(req.body.comment, function(err, comment) {
        if(err) {
          console.log(err);
        } else {
          // add username and id to comment
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          // save comment
          comment.save();
          
          // Connect comment to campground
          campground.comments.push(comment);
          campground.save();
          // redirect to campground show page
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

// EDIT
router.get("/campgrounds/:id/comments/:comment_id/edit", middleware.verifyCommentOwnership, function(req, res) {
  Comment.findById(req.params.comment_id, function(err, comment) {
    if(err) {
      console.log(err);
    } else {
      res.render("comments/edit", {campground_id: req.params.id, comment: comment});
    }
  });
});

// UPDATE
router.put("/campgrounds/:id/comments/:comment_id", middleware.verifyCommentOwnership, function(req, res) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment) {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// DELETE
router.delete("/campgrounds/:id/comments/:comment_id", middleware.verifyCommentOwnership, function(req, res) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;