var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({
	port: 8080,

});

wss.on('connection', function(ws){
	ws.on('message', function message(msg) {
		console.log(msg);
		ws.send('message');
	});

	ws.on('close', function close() {
		console.log('close');
	});

	ws.on('error', function error(err) {
		console.log('error');
	});

	ws.on('open', function open() {
		console.log('open');
	});
});
