export const server = async ctx => {
    ctx.server = async () => {
	localStorage.clear();
	const socket = io();
	const view = message => Array.isArray(message) ? '[' + message.join(', ') + ']' : message;
	const server = {
	    send: async (channel, message) => {
		// console.log('client:', view(channel), view(message));
		const response = await new Promise(res => socket.emit(channel, message, res));
		// console.log('server:', view(response));
		return response;
	    },
	    receive: async channel => {
		// console.log('client:', 'receive', view(channel));
		const [message, callback] = await new Promise(res => socket.once(
		    channel,
		    (message, callback) => res([message, callback]),
		));		
		// console.log('server:', view(message));
		return [message, callback];
	    },
	};
	const id = localStorage.getItem('id') || uuidv4(); localStorage.setItem('id', id);
	const response = await server.send('id', id);
	return server;
    };
};
