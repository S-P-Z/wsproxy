let WebSocket = require('websocket-stream')
let net = require('net')
let url = 'wss://localhost:8080'

let socket = net.createServer(sock => {
	sock.on('error', (err) => {
		console.error(err);
	});

	sock.on('close', () => {
		sock.destroyed || sock.destroy();
	});
	
	let ws = new WebSocket(url)

	sock.pipe(ws);
	ws.on('error', (err) => {
		console.error(err);
	});
	ws.pipe(sock);
});


socket.listen(8888, () => console.log('socks 5 proxy running ...')).on('error', err => console.error(err));
