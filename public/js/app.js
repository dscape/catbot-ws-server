$(function() {
  var socket      = Primus.connect('ws://localhost:8080')
    //
    // w/h of the web client controll boundaries
    //
    , sceneX = 598
    , sceneY = 378
    , slideX
    , slideY
    ;

  socket.on('open', function () {

    $("#pointer").draggable(
      { containment: "#pointerCont"
      , scroll: false
      , drag: function (ev, ui) {
          var position = ui.position
            , posX = position.left / sceneX
            , posY = position.top / sceneY
            ;

          console.log('x: ', posX, 'y: ', posY);
          socket.emit('x', posX);
          socket.emit('y', posY);
        }
    });

    socket.on('laserStatus', function (laserOn) {
      $('#logo').text(laserOn ? 'Turn off Laser' : 'Turn on Laser')
      $('#logo').css('background-color', laserOn ? '#e00' : '#aaa')
    });

    //
    // turn laser on and off
    //
    $('#logo').on('click', function() {
      console.log('click: switchLaser');
      socket.emit('switchLaser');
    });

  });

});