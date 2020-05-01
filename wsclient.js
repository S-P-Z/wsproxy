let WebSocket = require('websocket-stream')
let net = require('net')
let url = 'ws://localhost:8080'

let socket = net.createServer(sock => {
	sock.on('error', (err) => {
		console.error(err);
	});

	sock.on('close', () => {
		sock.destroyed || sock.destroy();
	});
	
	let ws = new WebSocket(url)
	// sock.once('data', websocketHandler.bind(sock))
	sock.pipe(ws);
	ws.pipe(sock);
});

// let websocketHandler = function(data){
// 	let sock = this;
// 	ws.send(data);

// 	ws.on('open',function() {
// 	});

// 	ws.on('message', function(msg) {
// 		sock.pipe(msg);
// 	});

// }

socket.listen(8888, () => console.log('socks 5 proxy running ...')).on('error', err => console.error(err));