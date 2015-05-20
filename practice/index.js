var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.get('/chat', function(req, res){
    res.sendFile('index.html', {"root": __dirname});
});

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    socket.on('disconnect', function(){
       console.log('a user disconnected.');
    });
});

server.listen(3000, function(){
    console.log('listening on *:3000');
});