jQuery(function($) {
  var socket = io.connect('/photo');
  var streaming = true;

  socket.on('msg', function(msg) {
    $('#message').text(msg);
  });

  var cnt = 0;
  socket.on('photo', function(photo) {
    var img = new Image();
    img.src = photo.thumbnail;
    img.onload = function() {
      if (!streaming) { return; }
      var tweet = photo.tweet;
      imageListEl.prepend(
        $('<li />').data('tweet-id', tweet.id_str).append(
          $('<a />').attr('title', tweet.text)
                    .attr('target', '_blank')
                    .attr('href', photo.url)
                    .append(
            $('<img />').attr('src', photo.thumbnail)
          )
        )
      );
      if (cnt++ >= 100) {
        imageListEl.children("li:last").remove();
      }
    };
  });

  $('#stream-switch').click(toggleStreaming);
  
  function toggleStreaming() {
    if (streaming) {
      socket.emit('suspend');
      $("#stream-switch").val('Resume');
    } else {
      socket.emit('resume');
      $("#stream-switch").val('Suspend');
    }
    streaming = !streaming;
  };

  $('#filter-form').submit(function(e) {
    e.preventDefault();
    e.stopPropagation();
    var filter = $("#filter-text").val();
    socket.emit('filter', filter);
  });

  $('#speed').change(function() {
    var sec = Number($(this).val());
    socket.emit('interval', sec);
  });

  $('#popup').click(function() {
    $(this).removeClass("visible");
    toggleStreaming();
  });

  var imageListEl = $("#image-list");
  imageListEl.on('click', 'li a', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleStreaming();
    $('#popup').addClass("visible")
      .find('.content')
        .children('img').remove().end()
        .children('.tweet').text(this.title);

    var img = new Image();
    img.src = this.href;
    var cw = $("#popup").width();
    var ch = $("#popup").height();
    img.onload = function() {
      var iw = img.width;
      var ih = img.height;
      if (iw * ch < ih * cw) {
        rw = ch * iw / ih;
        rh = ch;
      } else {
        rw = cw;
        rh = cw * ih / iw;
      }
      $(img).css({
        width : rw,
        height : rh,
        marginLeft : -rw * 0.5,
        marginTop : -rh * 0.5
      });
      $('#popup .content')
        .children('img').remove().end()
        .append(img);
    };
  });

});

