import {getWS} from '../frontend';

export function emitWS(type: string, data: any) {
	//logger.debug( '[WS] Sending message '+type+' : '+JSON.stringify(data));
	getWS().sockets.emit(type, data);
}

export function emitWSRoom(room: string, type: string, data: any) {
	getWS().sockets.in(room).emit(type, data);
}

getWS().sockets.on('connection', function(socket: any) {
	socket.on('room', (room: string) => {
		socket.join(room);
	});
});

