import {getWS} from '../frontend';

export function emitWS(type,data) {
	//logger.debug( '[WS] Sending message '+type+' : '+JSON.stringify(data));
	getWS().sockets.emit(type,data);
}

export function emitWSRoom(room, type, data) {
	getWS().sockets.in(room).emit(type, data);
}

getWS().sockets.on('connection', function(socket) {
	socket.on('room', function(room) {
		socket.join(room);
	});
});

