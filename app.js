/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Socket.IO
var io = require('socket.io').listen(app);

// Photo Stream
var TweetPhotoStream = require('./lib/tweet-photo-stream');

var photoStream = new TweetPhotoStream({
  user : process.env.TWITTER_USERNAME, 
  password : process.env.TWITTER_PASSWORD
});
photoStream.on('photo', function(photo) {
  io.of('/conn').emit("photo", photo);
});
photoStream.stream();


app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
