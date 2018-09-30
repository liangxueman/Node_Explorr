var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
// ===============================
//  multer and cloudinary config
// ===============================
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var image_filter = function(req, file, callback) {
  // only allow image files
  if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return callback(new Error("Only image file is allowed."), false);
  }
  callback(null, true);
}
var upload = multer({storage: storage, fileFilter: image_filter});
var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "djig0e5hp",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
//        Node Geocoder
// ===============================
var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);

// ===============================
//      Campgrounds Routes
// ===============================
// INDEX
router.get("/campgrounds", function(req, res) {
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1; 
  
  if(req.query.search) {
    // if search term exist
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Campground.find({name: regex}, function(err, campgrounds) {
    //   if(err) {
    //     console.log(err);
    //     req.flash("error", err.message);
    //   } else {
    //     if(campgrounds.length < 1) {
    //       req.flash("error", "Oops, no results for \"" + req.query.search + "\"");
    //       return res.redirect("back");
    //     }
    //     res.render("campgrounds/index", {campgrounds: campgrounds});
    //   }
    // });
    Campground.find({name: regex}).skip(perPage*pageNumber-perPage).limit(perPage).exec(function(err, campgrounds) {
      if(err) {
        console.log(err);
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        Campground.countDocuments({name: regex}).exec(function(err, count) {
          if(err) {
            console.log(err);
            res.redirect("back");
          } else {
            if(campgrounds.length < 1) {
              req.flash("error", "Oops, no results for \"" + req.query.search + "\"");
              return res.redirect("back");
            }
            res.render("campgrounds/index", {
              campgrounds: campgrounds,
              currentPage: pageNumber,
              pages: Math.ceil(count/perPage)
            });
          }
        });
      }
    });
  } else {
    Campground.find({}).skip(perPage*pageNumber-perPage).limit(perPage).exec(function(err, campgrounds) {
      if(err) {
        console.log(err);
        req.flash("error", err.message);
        return res.redirect("back");
      }
      Campground.countDocuments().exec(function(err, count) {
        if(err) {
          console.log(err);
          req.flash("error", err.message);
          res.redirect("back");
        } else {
          res.render("campgrounds/index", {
            campgrounds: campgrounds,
            currentPage: pageNumber,
            pages: Math.ceil(count/perPage)
          });
        }
      });
    });
  }
});

// NEW
router.get("/campgrounds/new", middleware.isLoggedIn, function (req, res) {
  res.render("campgrounds/new");
});

// CREATE
router.post("/campgrounds", middleware.isLoggedIn, upload.single("image"), function(req, res) {
  cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
    if(err) {
      console.log(err);
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      req.body.campground.image = result.secure_url;
      req.body.campground.image_id = result.public_id;
      
      geocoder.geocode(req.body.campground.location, function(err, data) {
        if(err || !data.length) {
          console.log(err);
          req.flash("error", "Invalid Address.");
          return res.redirect("back");
        }
        
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
        Campground.create(req.body.campground, function(err, campground) {
          if(err) {
            console.log(err);
            res.redirect("back");
          } else {
            campground.author.id = req.user._id;
            campground.author.username = req.user.username;
            campground.save();
            res.redirect("/campgrounds/" + campground.id);
          }
        });
      });
    }
  });
});

// SHOW
router.get("/campgrounds/:id", function(req, res) {
  // the id is stored in req.params.id which is generated by mongo db
  Campground.findById(req.params.id).populate("comments").exec(function(err, campground) {
    if(err) {
      console.log(err);
    } else {
      res.render("campgrounds/show", {campground: campground});
    }
  });
});

// EDIT
router.get("/campgrounds/:id/edit", middleware.verifyCampgroundOwnership, function(req, res) {
  // find the target campground
  Campground.findById(req.params.id, function(err, campground) {
    if(err) {
      console.log(err);
    } else {
      res.render("campgrounds/edit", {campground: campground});
    }
  });
});

// UPDATE
router.put("/campgrounds/:id", middleware.verifyCampgroundOwnership, upload.single("image"), function(req, res) {
  // console.log(req.body);
  // async and await is only available on node.js version 8+
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      console.log(err);
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      if(req.file) {
        // update image file
        try {
          await cloudinary.v2.uploader.destroy(campground.image_id);
          var result = await cloudinary.v2.uploader.upload(req.file.path);
          campground.image_id = result.public_id;
          campground.image = result.secure_url;
        } catch(err) {
          console.log(err);
          req.flash("error", err.message);
          return res.redirect("back");
        }
      }
      // update location
      try {
        var data = await geocoder.geocode(req.body.campground.location);
        campground.lat = data[0].latitude;
        campground.lng = data[0].longitude;
        campground.location = data[0].formattedAddress;
      } catch(err) {
        console.log(err);
        req.flash("error", "Invalid Address.");
        res.redirect("back");
      }
      
      campground.name = req.body.campground.name;
      campground.description = req.body.campground.description;
      campground.price = req.body.campground.price;
      campground.save();
      req.flash("success", "Campground has been successfully updated.");
      res.redirect("/campgrounds/" + campground._id);
    }
  });
});

// DELETE
router.delete("/campgrounds/:id", middleware.verifyCampgroundOwnership, function(req, res) {
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      await cloudinary.v2.uploader.destroy(campground.image_id);
      campground.remove();
      req.flash("success", "Campground successfully deleted.");
      res.redirect("/campgrounds");
    } catch(err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("back");
    }
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;