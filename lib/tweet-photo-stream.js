var events = require('events')
  , http = require('http')
  , async = require('async')
  , TwitterNode = require('twitter-node').TwitterNode
  ;

/**
 *
 */
function convertToPhotoUrl(url) {
  var thumbUrl, photoUrl, id;
  if (url.indexOf("http://lockerz.com/") === 0 || 
      url.indexOf("http://plixi.com/") === 0 || 
      url.indexOf("http://tweetphoto.com/") === 0) { 
    // Lockerz (fka. Plixi, TweetPhoto)
    thumbUrl = "http://api.plixi.com/api/tpapi.svc/imagefromurl?size=thumbnail&url=" + encodeURIComponent(url);
    photoUrl = "http://api.plixi.com/api/tpapi.svc/imagefromurl?size=medium&url=" + encodeURIComponent(url);
  } else if (url.indexOf("http://twitpic.com/") === 0) { // TwitPic
    id = url.substring("http://twitpic.com/".length);
    thumbUrl = "http://twitpic.com/show/thumb/" + id;
    photoUrl = "http://twitpic.com/show/iphone/" + id;
  } else if (url.indexOf("http://yfrog.com/") === 0) { // YFrog
    thumbUrl = url + ":small";
    photoUrl = url + ":iphone";
  } else if (url.indexOf("http://instagr.am/") === 0) { // Instagram
    url += url[url.length-1] === "/" ? "" : "/";
    thumbUrl = url + "media/?size=t";
    photoUrl = url + "media/?size=l";
  } else if (url.indexOf("http://photozou.jp/") === 0) { // Photozou
    id = url.split('/').pop();
    thumbUrl = "http://photozou.jp/p/thumb/" + id;
    photoUrl = "http://photozou.jp/p/img/" + id;
  } else if (url.indexOf("http://twitgoo.com/") === 0) { // TwitGoo?
    thumbUrl = url + "/img";
    photoUrl = url + "/img";
  }
  return photoUrl ? {
    url : photoUrl,
    thumbnail : thumbUrl
  } : null;
}

/**
 *
 */
function getExpandedUrl(url, callback) {
  url = require('url').parse(url);
  var client = http.createClient(80, url.host);
  var request = client.request('GET', url.pathname, { "host" : url.host });
  request.on('response', function(res) {
    if (res.headers.location) {
      callback(null, res.headers.location);
    } else {
      callback({ message : "no location found" });
    }
  });
  request.end();
}


/**
 *
 */
function extractPhotosFromTweet(tweet, callback) {
  if (!tweet.entities) { 
    callback(null, null);
    return; 
  }
  if (tweet.entities.media) {
    callback(null, 
      tweet.entities.media.filter(function(media) {
        return media.type === 'photo';
      }).map(function(media) {
        return {
          url : media.media_url,
          thumbnail : media.media_url + ":thumb",
          tweet : tweet 
        };
      })
    );
  } else if (tweet.entities.urls.length > 0) {
    async.parallel(
      tweet.entities.urls.map(function(url) {
        return function(cb) {
          if (url.expanded_url.indexOf('http://t.co/') === 0) {
            getExpandedUrl(url.expanded_url, cb);
          } else {
            cb(null, url.expanded_url);
          }
        };
      }),
      function(err, urls) {
        callback(err,
          err ? undefined : urls.map(function(url) {
            var photo = convertToPhotoUrl(url);
            photo.tweet = tweet;
            return photo;
          })
        );
      }
    );
  }
}

/**
 *
 */
var TweetPhotoStream = module.exports = function(options) {
  var self = this;
  var twitter = this.twitter = new TwitterNode({
    user : options.user,
    password : options.password,
    track : "lockerz,plixi,tweetphoto,twitpic,yfrog,photozou,twitgoo,instagr".split(',')
  });
  twitter.addListener("tweet", function(tweet) {
    extractPhotosFromTweet(tweet, function(err, photos) {
      if (!err && photos) {
        photos.forEach(function(photo) { self.emit('photo', photo); });
      }
    });
  });
  twitter.addListener('end', function(res) { self.emit('end'); });
  twitter.addListener('error', function() { });
};

TweetPhotoStream.prototype = new events.EventEmitter();

TweetPhotoStream.prototype.stream = function() {
  this.twitter.stream();
};

