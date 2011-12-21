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
var photoChannel = io.of('/photo');

var count = 0;
var clients = {};

photoChannel.on('connection', function(socket) {
  var id = "_" + count++;
  photoChannel.emit('message', count + 'viewers.');

  var client = clients[id] = {
    socket : socket,
    pref : { interval: 500 },
    active : true,
    sleepUntil : Date.now()
  };
  socket.on('filter', function(text) {
    client.pref.filter = text && text.toLowerCase();
    client.socket.emit('message', 'Set stream filter to "'+text+'".');
  });
  socket.on('interval', function(msec) {
    client.pref.interval = msec;
    client.socket.emit('message', 'Set stream min interval to '+msec+' msec.');
  });
  socket.on('suspend', function() {
    client.active = false;
    client.socket.emit('message', 'Stream suspended');
  });
  socket.on('resume', function() {
    client.active = true;
    client.socket.emit('message', 'Stream resumed');
  });
  socket.on('disconnect', function() {
    count--;
    delete clients[id];
    photoChannel.emit('message', count + 'viewers.');
  });
});

// Photo Stream
var TweetPhotoStream = require('./lib/tweet-photo-stream');

var photoStream = new TweetPhotoStream({
  user : process.env.TWITTER_USERNAME, 
  password : process.env.TWITTER_PASSWORD
});
photoStream.on('photo', function(photo) {
  var tweetText = photo.tweet.text.toLowerCase();
  var now = Date.now();
  for (var id in clients) {
    var client = clients[id];
    if (client && client.active && now >= client.sleepUntil) {
      var filter = client.pref.filter;
      if (!filter || tweetText.indexOf(filter) >= 0) {
        client.socket.emit('photo', photo);
        client.sleepUntil = now + client.pref.interval;
      }
    }
  }
//  photoChannel.emit("photo", photo);
});
photoStream.stream();


app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
