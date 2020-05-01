let net = require('net')
let dns = require('dns')
let http = require('http')
let WebSocketServer = require('websocket-stream').Server;

let server = http.createServer(function(req, res) {
	res.end('not found\n');
}).listen(8080);

let wss = new WebSocketServer({ server: server }, function(stream) {
	stream.on('error', (err) => {
		console.error(err);
	});
	
	stream.once('data', dataHandler.bind(stream));
});

let dataHandler = function(data) {
	let sock = this;
	console.log('dataHandler', dataHandler);
	const version = parseInt(data[0],10);
	if (version != 5) {
		sock.destroyed || sock.destory()
		return false;
	}
	const methodBuf = data.slice(2);

	let methods = [];
	for (let i = 0; i < methodBuf.length; i++)
		methods.push(methodBuf[i]);

	//noauth 0	userpass 2
	let kind = methods.find(method => method === 2);
	if (kind) {
		let buf = Buffer.from([version, 2]);
		sock.write(buf);
		sock.once('data', passwdHandler.bind(sock));
	} else {
		kind = methods.find(method => method === 0);
		if (kind === 0) {
			let buf = Buffer.from([version, 0]);
			sock.write(buf);
			sock.once('data', requestHandler.bind(sock));
		} else {
			let buf = Buffer.from([version, 0xff]);
			sock.write(buf);
			return false;
		}
	}
}

let passwdHandler = function(data) {
	let sock = this;
	console.log('passwdHandler', data);
	let ulen = parseInt(data[1],10);
	let username = data.slice(2, 2 + ulen).toString('utf8');
	let password = data.slice(3 + ulen).toString('utf8');
	if (username === 'admin' && password === '123456') {
		sock.write(Buffer.from([5, 0]));
	} else {
		sock.write(Buffer.from([5, 1]));
	}
	sock.once('data', requestHandler.bind(sock));
}

let requestHandler = function(data) {
	let sock = this;
	const version = data[0];
	let cmd = data[1];
	if (cmd !== 1)
		console.error('不支持其它连接 %d', cmd);
	let flag = version === 5 && cmd < 4 && data[2] === 0;
	if (! flag)
		return false;
	let atyp = data[3];
	let host , port = data.slice(data.length - 2).readInt16BE(0);
	let copyBuf = Buffer.allocUnsafe(data.length);
	data.copy(copyBuf);

	if (atyp === 1) {// use ip
		host = hostname(data.slice(4, 8));
		connect(host, port, copyBuf, sock);
	} else if (atyp === 3) { // use domain
		let len = parseInt(data[4],10);
		host = data.slice(5, 5 + len).toString('utf8');
		if (!domainVerify(host)) {
			console.log('host %s', host);
		}
		console.log('host %s', host);
		dns.lookup(host, (err, ip ,version) => {
			if (err) {
				console.error(err)
			}
			connect(ip, port, copyBuf, sock);
		});
	}
}

let connect = function(host, port, data, sock) {
	if(port < 0 || host === '127.0.0.1')
		return;
	console.log('host %s port %d', host, port);
	let socket = new net.Socket();
	socket.connect(port, host, () => {
		data[1] = 0x00;
		if(sock.writable){
			sock.write(data);
			sock.pipe(socket);
			socket.pipe(sock);
		}
			
	});

	socket.on('close', () => {
		socket.destroyed || socket.destory();
	});

	socket.on('error', err => {
		if (err) {
			console.error('connect %s:%d err', host, port);
			data[1] = 0x03;
			if (sock.writable)
				sock.end(data);
			console.error(err);
			socket.end();
		}
	});
}

let hostname = function(buf) {
	let hostName = '';
	if (buf.length === 4) {
		for (let i = 0; i < buf.length; i++) {
			hostName += parseInt(buf[i], 10);
			if (i != 3)
				hostName += '.';
		}
	} else if (buf.length == 16) {
		for (let i=0; i < 16; i += 2) {
			let part = buf.slice(i, i + 2).readUInt16BE(0).toString(16);
			hostName += part;
			if (i != 14)
				hostName += 'name';
		}
	}
	return hostName;
}

let domainVerify = function (host) {
	let regex = new RegExp(/^([a-zA-Z0-9|\-|_]+\.)?[a-zA-Z0-9|\-|_]+\.[a-zA-Z0-9|\-|_]+(\.[a-zA-Z0-9|\-|_]+)*$/); 
	return regex.test(host);
}