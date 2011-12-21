jQuery(function($) {
  var socket = io.connect('/photo');
  var streaming = true;

  $('#stream-switch').click(function() {
    if (streaming) {
      socket.emit('suspend');
      $(this).val('Resume');
    } else {
      socket.emit('resume');
      $(this).val('Suspend');
    }
    streaming = !streaming;
  });

  $('#filter-text').keydown(function(e) {
    if (e.keyCode === 13) {
      var filter = $(this).val();
      socket.emit('filter', filter);
    }
  });

  $('#speed').change(function() {
    var sec = Number($(this).val());
    socket.emit('interval', sec);
  });

  socket.on('message', function(msg) {
    $('#message').text(msg);
  });

  var imageListEl = $("#image-list");
  var tweets = {};

  imageListEl.on('click', 'li img', function(e) {
    var id = $(this).parent('li').data('tweet-id');
    var tweet = tweets[id];
    if (tweet) {
      $('#tweet-text').text(tweet.text);
    }
  });

  var cnt = 0;
  socket.on('photo', function(photo) {
    var img = new Image();
    img.src = photo.thumbnail;
    img.onload = function() {
      if (!streaming) { return; }
      var tweet = photo.tweet;
      tweets[tweet.id_str] = tweet;
      imageListEl.prepend(
        $('<li />').data('tweet-id', tweet.id_str).append(
          $('<img />').attr('src', photo.thumbnail)
        )
      );
      if (cnt++ > 100) {
        var li = imageListEl.children("li:last");
        var id = li.data('tweet-id');
        delete tweets[id];
        li.remove();
      }
    };
  });

});

