import {Context} from './gtools/context.js';
import {Board} from './gtools/board.js';
import {sleep} from './gtools/time.js';

export const verbs = async ctx => {
    const {gg, height, width, send, receive, myIdx} = ctx;

    const [nrows, ncols] = [9, 9];
    const step = 0.9*width/(ncols-1);
    const POS = Context.range(nrows*ncols).map(i => [Math.floor(i/ncols), i % ncols]);
    const board = Board(POS);
    
    const graphix = {
	boardXY: ([row, col]) => {
	    const [x, y] = [0.5*width, 0.5*height];
	    return [
		x + (col - 0.5*(ncols-1))*step,
		y + (row - 0.5*(nrows-1))*step,
	    ];
	},
	optionsXY: (i, n) => {
	    const [x, y] = graphix.boardXY([nrows + 0.75, Math.floor((ncols-1)/2)]);
	    return [x + (i - (n-1)/2)*step, y];
	},
	sprite: (pos, key) => {
	    const sprite = gg.sprite(...graphix.boardXY(pos), key).setDisplaySize(0.95*step, 0.95*step);
	    sprite.baseScale = sprite.scale;
	    return sprite;
	},
    };
    const meta = {turn: 0, actions: 3, selected: null};
    
    const anims = {
	// Replace ---------------------------------------------------------
	spin: async (sprite0, sprite1, [row, col]) => {
	    sprite0?.tween({
		alpha: 0,
		scale: 1.2*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });		    
	    await sprite1.setScale(0).tween({
		scale: {from: 0, to: sprite1.baseScale},
		angle: {from: sprite1.angle - 90, to: sprite1.angle},
		delay: 100*(Math.abs(row - Math.floor(nrows/2)) + Math.abs(col - Math.floor(ncols/2))),
	    });
	},
	grow: async (sprite0, sprite1) => {
	    sprite0?.tween({
		alpha: 0,
		scale: 1.5*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });	
	    await sprite1.tween({
		scale: {from: 0, to: sprite1.baseScale},
	    });
	},
	fade: async (sprite0, sprite1) => {
	    sprite0?.tween({
		alpha: 0,
		scale: 1.2*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });
	    sprite1.tween({
		alpha: {from: 0, to: 1},
		duration: 500,
	    });
	},
	blow: async (sprite0, sprite1) => {
	    sprite0?.tween({
		alpha: 0,
		scale: 1.5*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });
	    await sprite1.tween({
		alpha: {from: 0, to: 1},
		scale: {from: 1.5*sprite1.baseScale, to: sprite1.baseScale},
		duration: 500,
	    });
	},
	click: async (sprite0, sprite1) => {
	    sprite0?.tween({
		alpha: 0,
		scale: 1.5*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });
	    sprite1.tween({
		alpha: {from: 0, to: 1},
		scale: {from: 1.5*sprite1.baseScale, to: sprite1.baseScale},
		duration: 500,
	    });
	},
	crack: async (sprite0, sprite1) => {
	    sprite0?.setDepth(1).tween({
		alpha: 0,
		// scale: 1.2*sprite0.baseScale,
		onComplete: () => sprite0.destroy()
	    });
	    await sprite1.tween({
		alpha: {from: 0, to: 1},
	    });
	},
	// Swap ------------------------------------------------------------
	slide: async (sprite0, sprite1) => {
	    sprite0.tween({x: sprite1.x, y: sprite1.y});
	    await sprite1.tween({x: sprite0.x, y: sprite0.y});
	},
	jump: async (sprite0, sprite1) => {
	    const swap = async (s0, s1) => {
		const originY = s0.originY;
		const angle = s0.angle;
		const duration = 500;		    
		const sign = Math.floor(Math.random()*2)*2 - 1;
		s0.setDepth(100 + s1.y).tween({x: s1.x, y: s1.y, duration});
		await s0.tween({
		    t: {from: 0, to: 1},
		    yoyo: true,
		    duration: 0.5*duration,			
		    onUpdate: (tween, target) => {
			const t = target.t;
			s0
			    .setOrigin(0.5, originY + t)
			    .setScale(s0.baseScale*(1 + 0.5*t))
			    .setAngle(angle + t*10*sign);
		    },
		});
		s0.tween({
		    yoyo: true,
		    duration: 150,
		    scaleY: {from: s0.scaleY, to: 0.9*s0.scaleY},
		})
	    };
	    swap(sprite0, sprite1);
	    await swap(sprite1, sprite0);
	},
    };
    const types = {
	tile: async sprite => {
	    sprite
		.setDepth(0)
		.setAngle(Math.floor(Math.random()*4)*90)
		.setDisplaySize(0.95*step, 0.95*step)		
		.baseScale = sprite.scale;
	    await sleep(1000 + 2000*Math.random());
	    while (true) {
		await sprite.tween({
		    angle: sprite.angle + (Math.random()*2-1)*2,
		    scale: 1.02*sprite.baseScale,
		    duration: 2000 + 1000*Math.random(),
		    yoyo: true,
		    ease: 'Sine.easeInOut',
		});
	    }
	},
	click: async sprite => {
	    sprite
		.setDepth(10)
		.setOrigin(0.5, 0.5)
		.setInteractive()
		.setDisplaySize(0.95*step, 0.95*step)
		.baseScale = sprite.scale;
	    sprite.tween({
		alpha: {from: 1, to: 0.5},
		yoyo: true,
		ease: 'Sine.easeInOut',
		duration: 500,
		delay: 500,
		repeat: -1,
	    });
	},
	unit: async sprite => {
	    sprite
		.setDepth(100)
		.setOrigin(0.5, 0.85)
		.setDisplaySize(1.2*step, 1.2*step)
		.baseScale = sprite.scale;
	    sprite.tween({
		scaleY: {from: sprite.scaleY, to: 1.05*sprite.scaleY},
		yoyo: true,
		repeat: -1,
		ease: 'Sine.easeInOut',
		duration: 1500,
		delay: Math.random()*1000,
	    });
	},
	portal: t => async sprite => {
	    sprite
		.setDepth(1)
		.setDisplaySize(0.8*step, 0.8*step)
		.setAngle(Math.random()*360)
		.setFlipX(t > 0)
		.baseScale = sprite.scale;				
	    sprite.tween({
		angle: sprite.angle + t*360,
		repeat: -1,
		ease: 'Linear',
		duration: 4000,
	    });
	},
	flat: async sprite => {
	    sprite
		.setDepth(10)
		.setDisplaySize(0.95*step, 0.95*step)
		.baseScale = sprite.scale;
	},
    };
    const verbs = {
	get: (layer, pos) => board.get(layer, pos)?.key,
	replace: {
	    one: async (layer, pos, key, settings={}) => {
		const sprite = graphix.sprite(pos, key);
		const prev = board.replace(layer, pos, {key, sprite});
		const {type=types.unit, anim=anims.grow} = settings;
		type(sprite); await anim(prev?.sprite, sprite, pos);
	    },
	    all: async (layer, func, settings) => {
		await POS
		    .map(async pos => await verbs.replace.one(layer, pos, func(pos), settings))
		    .into(ctx => Promise.all(ctx.values()));
	    },
	},
	swap: async (layer, pos0, pos1, settings={}) => {
	    if (!board.get(layer, pos0) || !board.get(layer, pos1)) {return;}
	    
	    const [sprite0, sprite1] = [pos0, pos1].map(pos => board.get(layer, pos).sprite);
	    const {anim=anims.slide} = settings;
	    board.swap(layer, pos0, pos1);
	    await anim(sprite0, sprite1);		
	},
	cswap: async (layer, pos0, pos1, settings={}) => {
	    const ppos = new Context([pos0, pos1]);
	    ppos
		.filter(pos => verbs.get('units', pos))
		.filter(pos => verbs.get('tiles', pos) === 'tile-crack')
		.forEach(pos => verbs.replace.one('tiles', pos, undefined, {
		    type: types.tile, anim: anims.crack
		}));
	    await verbs.swap(layer, pos0, pos1, settings);
	    await ppos
		.filter(pos => verbs.get('units', pos))
		.filter(pos => !verbs.get('tiles', pos))
		.map(async pos => {
		    await verbs.replace.one('units', pos, undefined, {
			type: types.unit, anim: anims.grow
		    });
		})
		.into(u => Promise.all(u.values()));
	},
	click: async (filter = () => false) => {
	    const func = pos => filter(pos) ? 'click' : undefined;
	    await verbs.replace.all('clicks', func, {type: types.click, anim: anims.click});
	    const pos = await POS.filter(filter)
		  .map(async pos => {
		      await board.get('clicks', pos).sprite.event('pointerup');
		      return pos;
		  })
		  .into(u => Promise.race(u.values()));
	    verbs.replace.all('clicks', pos => undefined, {type: types.click, anim: anims.click});
	    return pos;
	},
	option: async (options = {}) => {
	    const xy = i => graphix.optionsXY(i, Object.keys(options).length);
	    const sprites = new Context(options)
		  .map((key, _, i) => {
		      const sprite = gg.sprite(...xy(i), key).setDisplaySize(0.95*step, 0.95*step);
		      return sprite;
		  })
		  .forEach(sprite => {
		      sprite.tween({
			  alpha: {from: 0, to: 1},
			  scale: {from: 1.2*sprite.scale, to: sprite.scale},
		      });
		  });
	    verbs._optionCleanup?.();
	    verbs._optionCleanup = () => sprites.forEach(async sprite => {
		await sprite.tween({
		    alpha: 0,
		    scale: 1.2*sprite.scale,
		});
		sprite.destroy();
	    });
	    const choice = await sprites
		  .map(async (sprite, key) => {
		      await sprite.setInteractive().event('pointerup');
		      return key;
		  })
		  .into(u => Promise.race(u.values()));
	    verbs._optionCleanup();
	    return choice;
	},
	action: async (filter, options) => {
	    if (meta.turn === myIdx) {
		const choice = await Promise.race([verbs.click(filter), verbs.option(options)]);
		verbs.click(); verbs.option();
		await send(choice);
		return choice;
	    }
	    if (meta.turn !== myIdx) {
		return await receive();
	    }
	},
	select: async (pos=null) => {
	    const prev = meta.selected;
	    if (prev) {
		verbs.replace.one('select', prev, undefined, {
		    type: types.flat, anim: anims.blow,
		});
	    }
	    meta.selected = pos;
	    if (!meta.selected) {return prev;}
	    await verbs.replace.one('select', pos, 'select', {
		type: types.flat, anim: anims.blow
	    });
	    return prev;
	},
	selected: () => meta.selected,
	turn: () => meta.turn,
	pass: () => {
	    meta.turn = 1 - meta.turn;
	    meta.actions = 3;
	},
	act: () => {meta.actions -= 1;},
	actions: () => meta.actions,
	crack: async () => {
	    await POS
		.filter(pos => verbs.get('units', pos))
		.filter(pos => verbs.get('tiles', pos) === 'tile')
		.map(async pos => await verbs.replace.one('tiles', pos, 'tile-crack', {
		    type: types.tile, anim: anims.crack
		}))
		.into(u => Promise.all(u.values()));
	},
    };
    
    ctx.assign({verbs, anims, types, nrows, ncols, POS});
};
