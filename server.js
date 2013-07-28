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

function handle_connections(err, hardware) {
  if (err) {
    throw err;
  }

  server.on('connection', function (socket) {
    console.log((hardware ? 'cat' : 'human') + ': ' + socket.id);

    socket.emit('laserStatus', hardware && hardware.laser.isOn);

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
      socket.emit('laserStatus', hardware.laser.isOn);
    });
  });
}

//
// humans currently not supported
//
if(ircat) {
  cat(handle_connections);
}