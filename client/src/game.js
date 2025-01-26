import {verbs} from './game.verbs.js';
import {states} from './game.states.js';

export const game = async ctx => await ctx.steps({verbs, states});

const __HIDE__ = {
    board: async ctx => {
	return; 
	const {gg, height, width} = ctx;

	const [nrows, ncols] = [7, 7];
	const step = 0.9*width/ncols;
	const POS = Context.range(nrows*ncols).map(i => [Math.floor(i/ncols), i % ncols]);
	const XY = (row, col) => {
	    const [x, y] = [0.5*width, 0.5*height];
	    return [
		x + (row - 0.5*(nrows-1))*step,
		y + (col - 0.5*(ncols-1))*step,
	    ];
	};
	const board = Board(POS);
	await board.all('tiles', async (_, [row, col]) => {
	    const sprite = gg
		  .sprite(...XY(row, col), 'tile')
		  .setDisplaySize(step*0.95, step*0.95);
	    sprite.baseScale = sprite.scale;
	    await sprite
		.setScale(0)
		.setAngle(Math.floor(Math.random()*4 % 4)*90)
		.tween({
		    scale: {from: 0, to: sprite.baseScale},
		    angle: sprite.angle + 90,
		    delay: 100*(Math.abs(row - Math.floor(nrows/2)) + Math.abs(col - Math.floor(ncols/2))),
		});
	    return sprite;
	});
	while (true) {
	    await board.swap('units', [0, 0], [1, 1], async (sprite0, sprite1) => {
		sprite0.tween({x: sprite1.x, y: s1.y});
		await s1.tween({x: sprite0.x, y: sprite0.y});
	    });
	}
    },
    wtf: async ctx => {
	console.log(choice);
	return;
	let i = 0;
	while (true) {
	    const pos = await verbs.click(pos => verbs.get('units', pos)?.includes(['red', 'blue'][i%2]));
	    i++;
	    console.log(pos);
	}
    },
    swap: async (layer, pos0, pos1, settings={}) => {
	const swap = async (item0, item1) => {
	    const [sprite0, sprite1] = [item0, item1].map(item => item.sprite);
	    const {anim=anims.slide} = settings;
	    await anim(sprite0, sprite1);
	};
	await board.swap(layer, pos0, pos1, swap);
    },
    one: async (layer, pos, key, settings={}) => {
	const spawn = async prev => {
	    const sprite = graphix.sprite(pos, key);
	    
	    const {type=types.unit, anim=anims.grow} = settings;
	    type(sprite); await anim(prev?.sprite, sprite, pos);
	    
	    return {key, sprite};
	};
	await board.replace(layer, pos, spawn);
    },
    portals: async ctx => {
	const {verbs, anims, types, nrows, ncols} = ctx;

	verbs.replace.one('units', [0, 0], 'portal-red', {
	    type: types.portal(1), anim: anims.grow,
	});
	verbs.replace.one('units', [0, 1], 'portal-blue', {
	    type: types.portal(1), anim: anims.grow,
	});
	verbs.replace.one('overlay', [0, 0], 'portal-red', {
	    type: types.portal(-1), anim: anims.grow,
	});
	await verbs.replace.one('overlay', [0, 1], 'portal-blue', {
	    type: types.portal(-1), anim: anims.grow,
	});
    },
};
