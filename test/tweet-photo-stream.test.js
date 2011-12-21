var TweetPhotoStream = require('../lib/tweet-photo-stream')

var photoStream = new TweetPhotoStream({
  user : process.env.TWITTER_USERNAME,
  password : process.env.TWITTER_PASSWORD
});

photoStream.on('photo', function(photo) {
  console.log('***************************');
  console.log(photo.url);
  console.log(photo.tweet.text);
});
photoStream.on('error', function(err) {
  console.log(err);
  process.stdin.pause();
});
photoStream.on('end', function(err) {
  process.stdin.pause();
});
photoStream.stream();

// to prevent process exit
process.stdin.resume();

