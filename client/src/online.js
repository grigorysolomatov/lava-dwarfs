import { Context } from './gtools/context.js';
import { game } from './game.js';

export const online = async ctx => ctx.steps({
    opponent: async ctx => {
	const {gg, width, height} = ctx;

	const msg = gg.text(0.5*width, 0.5*height, 'Finding Opponent').setOrigin(0.5);
	msg.tween({alpha: {from: 0, to: 1}});
	msg.tween({
	    scale: {from: msg.scale, to: 0.8*msg.scale},
	    yoyo: true,
	    repeat: -1,
	});
	
	const server = await gg.server();
	const res = await server.send('unplay', 'all');
	await server.send('play', 'random');
	msg.tween({alpha: 0, onComplete: () => msg.destroy()});

	ctx.assign({server});
    },
    turndecide: async ctx => {
	const {server} = ctx;
	
	const myNum = Math.random();
	await server.send('dialogue', ['send', 'turndecide', myNum]);
	const theirNum = await server.send('dialogue', ['receive', 'turndecide']);
	const myIdx = 1*(myNum < theirNum);

	ctx.assign({
	    myIdx,
	    send: async msg => await server.send('dialogue', ['send', 'ingame', msg]),
	    receive: async () => await server.send('dialogue', ['receive', 'ingame']),
	});
    },
    game: async ctx => {
	await game(ctx);
    },
});
