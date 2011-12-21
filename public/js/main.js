jQuery(function($) {
  var socket = io.connect('/conn');
  var imageListEl = $("#image-list");
  var count = 0;
  socket.on('photo', function(photo) {
    var img = new Image();
    img.src = photo.thumbnail;
    img.onload = function() {
      imageListEl.prepend(
        $('<li />').append(
          $('<img />').attr('src', photo.thumbnail)
        )
      );
      if (count++ > 100) {
        imageListEl.children("li:last").remove();
      }
    };
  });

})
