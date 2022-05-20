var createError = require('http-errors');
var http = require('http');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');
var cors = require('cors');
// var socketIO = require('socket.io');
var os = require('os');
var debug = require('debug')('nonadvice-express:server');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var regularUserRouter = require('./routes/regularUsers');
var authRouter = require('./routes/auth');
var storeRouter = require('./routes/store');
var adminRouter = require('./routes/admin');
const { Socket } = require('socket.io');

var app = express();

app.use(cors());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/resources', express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api', regularUserRouter);
app.use('/api/auth', authRouter);
app.use('/api/store', storeRouter);
app.use('/api/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var port = normalizePort(process.env.PORT || '9000');
app.set('port', port);

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

//signaling
var io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.sockets.on('connection', function(socket) {
    console.log(socket.id);
    function log(){
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function(message, room) {
        log('client said: ', message);
        socket.in(room).emit('message', message, room);
    });

    socket.on('userCheck', function(room) {
      var clientsInRoom = io.sockets.adapter.rooms.get(room);
      var numClients = clientsInRoom ? clientsInRoom.size : 0;
      if(numClients === 0){
        log('store close or error ( 0 client )');
      }else if (numClients === 1){
        socket.emit('can join', room);
      }else if (numClients === 2){
        socket.emit('full', room);
      }
    });

    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);

        var clientsInRoom = io.sockets.adapter.rooms.get(room);
        console.log(clientsInRoom);
        var numClients = clientsInRoom ? clientsInRoom.size : 0;
        console.log(clientsInRoom, numClients);
        log('Room ' + room + ' now has' + numClients + ' clent(s)');

        if(numClients === 0){
            socket.join(room);
            log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);
        }

        else if (numClients === 1){
            log('Client ID ' + socket.id + " joined room " + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
        }

        else {
            socket.emit('full', room);
        }

        console.log(io.sockets.adapter.rooms);
    });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function(){
        console.log('received bye');
    });

    socket.on('byeFromUser', function(room){
      io.to(room).emit('byeFromUser');
    })

    socket.on('endCall', function(room) {
      io.to(room).emit('kick');
    })
})


module.exports = app;
