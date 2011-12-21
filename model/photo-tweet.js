var mongoose = require('mongoose')
  , db       = mongoose.connect("mongodb://localhost/twistream")
  , Schema   = mongoose.Schema
  , ObjectId = Schema.ObjectId
  ;

/**
 *
 */
var PhotoTweetSchema = new Schema({
  photo : Schema.Types.Mixed,
  tweet : Schema.Types.Mixed,
  created_at : { type : Number, index : true }
});

var PhotoTweet = module.exports = mongoose.model('PhotoTweet', PhotoTweetSchema);
 

