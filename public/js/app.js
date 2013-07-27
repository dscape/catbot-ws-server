$(function() {
  if (!window.unprefix.supported.getUserMedia) {
    throw new Error('Y U NO WEBRTC!? I CAN HAZ CHROME CANARY?');
  }

  var socket      = Primus.connect('ws://localhost:8080')
    //
    // w/h of the web client controll boundaries
    //
    , sceneX = 598
    , sceneY = 378
    , slideX
    , slideY
    ;

  var video   = document.getElementById('webcam')
    , canvas  = document.getElementById('capture')
    , ctx     = canvas.getContext('2d')
    , paired  = false
    ;

  navigator.getUserMedia({ video: true, audio: true }, 
    function( raw, stream ) {
      video.src = stream && stream || raw;
      video.addEventListener('error', function () {
        console.log(arguments);
        stream.stop();
      });
    });

  $(video).on('timeupdate', function(e) {
    if(paired) {
      // because there's no way to emit directly from video stream
      // we draw it in a canvas so we can emit base64 images.
      ctx.drawImage(video, 0, 0, 320, 160);
      socket.emit('frame', canvas.toDataURL());
    }
  });

  socket.on('drawFrame', function (png) {
    $('#panel').css("background", '#fff url(' + png + 
      ') no-repeat center center fixed');
  });

  socket.on('paired', function () {
    $("#webcam").hide();
    paired = true;
    socket.emit('switchLaser');
  });

  socket.on('unpaired', function () {
    $("#webcam").show();
    $('#panel').css("background-image", "")
    paired = false;
    socket.emit('switchLaser');
  });

  $('#panel').click(function () {
    socket.emit('next');
  });

  //        var position = ui.position
  //          , posX = position.left / sceneX
  //          , posY = position.top / sceneY
  //          ;
  //
  //        console.log('x: ', posX, 'y: ', posY);
  //        socket.emit('x', posX);
  //        socket.emit('y', posY);

});