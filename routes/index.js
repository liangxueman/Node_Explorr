var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var api_key = '51f1317ead91709e411f452b66c2a354-a5d1a068-ef9cec75';
var domain = 'sandbox3a4370920e2c45899dc3bd94e37c47ed.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

router.get("/", function(req, res) {
    res.render("landing");
});

// ===============================
//     Authentication Route
// ===============================
router.get("/register", function(req, res) {
  res.render("register");
});

router.post("/register", function(req, res) {
  var new_user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    email: req.body.email
  });
  User.register(new_user, req.body.password, function(err, user){
    if(err) {
      req.flash("error", err.message);
      return res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/campgrounds");
      });
    }
  });
});

// LOGIN
router.get("/login", function(req, res) {
  res.render("login");
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/campgrounds",
  failureRedirect: "login",
  failureFlash: true
}), function(req, res){});

// LOG OUT
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/campgrounds");
});


// ===============================
//     Password Reset Route
// ===============================
// FORGOT
router.get("/forgot", function(req, res) {
  res.render("forgot");
});

router.post("/forgot", function(req, res, next) {
  // run the function one by one in the array
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buffer) {
        var token = buffer.toString("hex");
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({email:req.body.email}, function(err, user) {
        if(err) {
          req.flash("error", "No account with this email exits.");
          return res.redirect("/forgot");
        } else {
          user.reset_password_token = token;
          user.reset_password_expires = Date.now() + 3600000;  // 1 hour
          user.save(function(err) {
            done(err, token, user);
          });
        }
      });
    },
    function(token, user, done) {
      // var smtpTransport = nodemailer.createTransport({
      //   service: "Gmail",
      //   auth: {
      //     user: "liangxueman@gmail.com",
      //     pass: process.env.GMAILPASSWORD
      //   }
      // });
      // var mailOptions = {
      //   to: user.email,
      //   from: "liangxueman@gmail.com",
      //   subject: "Outdoorr Password Reset",
      //   text: "You are receiving this email because you requested to reset your Outdoorr account password." + 
      //   "Please click the following link or paste this into your browser to complete the process." + 
      //   "http://" + req.headers.host + "/reset/" + token + "\n\n" + 
      //   "If you did not request this, please ignore this email and your Outdoorr account password will remain unchanged."
      // };
      // smtpTransport.sendMail(mailOptions, function(err) {
      //   console.log("Reset password email sent");
      //   req.flash("success", "An email has been sent to " + user.email + ". Please check your mailbox for further instructions");
      //   done(err, "done");
      // });
      
      // var api_key = '51f1317ead91709e411f452b66c2a354-a5d1a068-ef9cec75';
      // var domain = 'sandbox3a4370920e2c45899dc3bd94e37c47ed.mailgun.org';
      // var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
       
      var data = {
        from: 'Outdoorr <liangxueman@gmail.com>',
        to: user.email,
        subject: 'Outdoorr Password Reset',
        text: 'You are receiving this email because you requested to reset your Outdoorr account password.' +
        'Please click the following link or paste this into your browser to complete the process.\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n' +
        'Please note, this link will only be valid within one hour.' +
        'If you did not request this, please ignore this email and your Outdoorr account password will remain unchanged.'
      };
       
      mailgun.messages().send(data, function (err, body) {
        if(err) {
          console.log(err);
        } else {
          req.flash("success", "An email has been sent to " + user.email + ". Please check your mailbox for further instructions");
          done(err, "done");
        }
      });
    }], function(err) {
      if(err) {
        return next(err);
      } else {
        res.redirect("/forgot");
      }
    });
});

// RESET
router.get("/reset/:token", function(req, res) {
  User.findOne({
    reset_password_token: req.params.token,
    reset_password_expires: {$gt: Date.now()}
  }, function(err, user) {
    if(err) {
      console.log(err);
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot");
    } else {
      res.render("reset", {token: req.params.token});
    }
  });
});

router.post("/reset/:token", function(req, res, next) {
  async.waterfall([
    function(done) {
      User.findOne({
        reset_password_token: req.params.token, 
        reset_password_expires: {$gt: Date.now()}
      }, function(err, user) {
        if(err) {
          console.log(err);
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        } else {
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              if(err) {
                console.log(err);
                req.flash("error", "Fail to reset password. Please try again later.");
                res.redirect("/forgot");
              } else {
                user.reset_password_expires = undefined;
                user.reset_password_token = undefined;
                user.save(function(err) {
                  if(err) {
                    console.log(err);
                    req.flash("error", "Fail to reset password. Please try again later.");
                    res.redirect("/forgot");
                  } else {
                    req.logIn(user, function(err) {
                      if(err) {
                        console.log(err);
                        res.redirect("/login");
                      } else {
                        done(err, user);
                      }
                    });
                  }
                });
              }
            });
          } else {
            req.flash("error", "Passwords do not match.");
            res.redirect("back");
          }
        }
      });
    },
    function(user, done) {
      var data = {
        from: 'Outdoorr <liangxueman@gmail.com>',
        to: user.email,
        subject: 'Outdoorr Password Reset Confirmation',
        text: 'This is a confirmation that your Outdoorr account password has been reset.'
      };
    
      mailgun.messages().send(data, function (err, body) {
        if(err) {
          console.log(err);
        } else {
          req.flash("success", "Your password has been reset.");
          done(err, "done");
        }
      });
    }
  ], function(err) {
    if(err) {
      return next(err);
    } else {
      res.redirect("/campgrounds");
    }
  });
});

module.exports = router;