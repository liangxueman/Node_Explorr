var mongoose = require("mongoose");

// schema set up
var campground_schema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  image_id: String,
  description: String,
  location: String, 
  lat: Number, 
  lng: Number,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// model set up
module.exports = mongoose.model("Campground", campground_schema);