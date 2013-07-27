var s       = require('node-static')
  , Primus  = require('primus')
  , Emitter = require('primus-emitter')
  , cat     = require('catbot')
  , file    = new(s.Server)('./public')
  , ircat   = process.env.IARECATZ
  , sockets = {}
  , free    = []
  , paired  = {}
  ;

var app = require('http').createServer(function (request, response) {
  console.log(request.url);

  request.addListener('end', function () {
      file.serve(request, response);
  }).resume();
}).listen(8080);

var server = new Primus(app, { transformer: 'websockets', parser: 'JSON' });
server.use('emitter', Emitter);

function pair(nickname) {
  var remote = free.pop()
    , socket = sockets[nickname]
    ;
  if (remote && remote !== nickname) {
    console.log('remove ' + remote + ' from the queue');
    var remoteSocket = sockets[remote];
    if(!remoteSocket) {
      return process.nextTick(function () { pair(nickname); });
    }
    remoteSocket.on('frame', function emitFrameToPairRemote(frame) {
      socket.emit('drawFrame', frame);
    });
    socket.on('frame', function emitDrawFrameClient(frame) {
      remoteSocket.emit('drawFrame', frame);
    });
    paired[nickname] = remote;
    paired[remote]   = nickname;
    console.log('paired ' + nickname + ' with ' + remote + '.');
    socket.emit('paired');
    remoteSocket.emit('paired');
  } else {
    app.log.info('added ' + nickname + ' to the queue');
    free.push(nickname);
  }
}

function next(nickname, disconnected) {
  var remote = paired[nickname]
    , socket = sockets[nickname]
    ;
  delete paired[nickname];
  console.log('listeners removed for ' + nickname);
  socket.removeAllListeners('frame');
  socket.emit('unpaired');
  if(!disconnected) {
    pair(nickname);
  }
  if(remote) {
    delete paired[remote];
    var remoteSocket = sockets[remote];
    console.log('listeners removed for ' + remote);
    remoteSocket.removeAllListeners('frame');
    remoteSocket.emit('unpaired');
    pair(remote);
  }
}

function handle_connections(err, hardware) {
  if (err) {
    throw err;
  }

  server.on('connection', function (socket) {
    console.log('connected: ' + socket.id);

    socket.on('disconnect', function disconnect() {
      console.log('disconnected: ' + socket.id);
      next(socket.id, true);
      delete sockets[socket.id];
    });

    socket.on('next', function () {
      next(socket.id, false);
    });

    socket.on('x', function (x) {
      if(!hardware) return;
      console.log('x: ' + x);
      hardware.x.move(Math.floor(x*180));
    });

    socket.on('y', function (y) {
      if(!hardware) return;
      console.log('y: ' + y);
      hardware.y.move(Math.floor(y*180));
    });

    socket.on('switchLaser', function () {
      if(!hardware) return;
      hardware.laser.isOn ? hardware.laser.off() : hardware.laser.on();
    });
  });
}

if(ircat) {
  cat(handle_connections);
} else {
  handle_connections();
}
