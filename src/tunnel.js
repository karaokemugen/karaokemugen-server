import logger from 'winston';

export function launchTunnelServer(opts) {	
	const server = require('../localtunnel-server/server')({
		max_tcp_sockets: opts.maxSockets,
		secure: opts.secure
	});

	server.listen(opts.port, () => {
		logger.debug('server listening on port: %d', server.address().port);
	});
}
