import {Context} from '../gtools/context.js';
// import {menu} from './menu.js';
// import {online} from './online.js';
// import {board} from './board.js';

export const GG = () => new Context().steps({
    methods: ctx => {
	const tune = entity => {
	    entity.event = (key, func=x=>x) => new Promise(res => entity.once(key, (...args) => res(func(...args))));
	    entity.tween = config => ctx.tween({...config, targets: entity});
	    entity.onto = (...funcs) => {
		const hasAsync = funcs.map(func => func.constructor.name).includes("AsyncFunction");
		if (hasAsync) {
		    return new Promise(async res => {
			for (const func of funcs) { await func(entity); }
			res(entity);
		    });
		}
		else {
		    for (const func of funcs) { func(entity); }
		    return entity;
		}
	    };
	    return entity;
	};
	
	ctx.start = async () => {
	    const {config} = ctx;
	    const game = new Phaser.Game(config);
	    const key = 'MainScene';
	    const scene = await new Promise(res => {
		const scene = new Phaser.Scene({key});
		scene.create = () => res(scene);
		game.scene.add(key, scene);
		game.scene.start(key);
	    });
	    
	    return ctx.assign({game, scene});
	};
	ctx.assets = async paths => {
	    const {scene} = ctx;
	    Object.keys(paths).forEach(key => scene.load.image(key, paths[key]));
	    await new Promise(resolve => { scene.load.on('complete', resolve); scene.load.start(); });	    
	};
	ctx.fonts = async (...families) => {
	    await new Promise(resolve => WebFont.load({google: {families}, active: resolve}));
	};
	ctx.text = (x, y, str, settings={}) => {
	    const {scene, defaults} = ctx;
	    const text = scene.add.text(x, y, str, {...defaults.text, ...settings});
	    return tune(text);
	};
	ctx.sprite = (x, y, key) => {
	    const sprite = ctx.scene.add.sprite(x, y, key);
	    return tune(sprite);
	};
	ctx.tween = async config => {
	    const {scene, defaults} = ctx;
	    await new Promise(res => scene.tweens.add({
		onComplete: res,
		...defaults.tween,
		...config,
	    }));
	};
	ctx.container = (x, y) => {
	    return tune(ctx.scene.add.container(x, y));
	};
	ctx.group = () => {
	    return tune(ctx.scene.add.group());
	};
	ctx.node = (x, y) => {
	    return Node(ctx, x, y);
	};
	ctx.grid = (x, y, nrows, ncols, stepX, stepY=stepX) => {
	    const RC_XY = Context.range(nrows*ncols)
		  .map(i => [Math.floor(i/ncols), i % ncols])
		  .rename((key, val) => JSON.stringify(val))
		  .map(([row, col]) => {
		      const pos = [
			  col*stepX - 0.5*(ncols-1)*stepX + x,
			  row*stepY - 0.5*(nrows-1)*stepY + y,
		      ];
		      return pos;
		  });
	    return RC_XY;
	};
    },
});
const __HIDE__ = () => {
    const GGame = ({config, defaults}) => new Context({config, defaults}).steps({
	window: async ctx => {
	    const {config} = ctx;
	    const game = new Phaser.Game(config);	
	    const key = 'MainScene';
	    const scene = await new Promise(res => {
		const scene = new Phaser.Scene({key});
		scene.create = () => res(scene);
		game.scene.add(key, scene);
		game.scene.start(key);
	    });

	    ctx.assign({game, scene});
	},
	load: ctx => {
	    const {scene} = ctx;

	    ctx.assets = async paths => {
		Object.keys(paths).forEach(key => scene.load.image(key, paths[key]));
		await new Promise(resolve => { scene.load.on('complete', resolve); scene.load.start(); });	    
	    };
	    ctx.fonts = async (...families) => {
		await new Promise(resolve => WebFont.load({google: {families}, active: resolve}));
	    };
	},
	entities: ctx => {
	    const {scene, defaults, config} = ctx;
	    
	    ctx.tween = async config => {
		await new Promise(res => scene.tweens.add({
		    onComplete: res,
		    ...defaults.tween,
		    ...config,
		}));
	    };
	    ctx.tune = entity => {
		entity.event = (key, func=x=>x) => new Promise(res => entity.once(key, (...args) => res(func(...args))));
		entity.tween = config => ctx.tween({...config, targets: entity});
		return entity;
	    };
	    ctx.text = (x, y, str, settings={}) => {
		const text = scene.add.text(x, y, str, {...defaults.text, ...settings});
		return ctx.tune(text);
	    };
	    ctx.sprite = (x, y, key) => {
		const sprite = scene.add.sprite(x, y, key);
		return ctx.tune(sprite);
	    };	
	},
	grid: ctx => {
	    ctx.grid = (x, y, nrows, ncols, stepX, stepY=stepX) => {
		const RC_XY = Context.range(nrows*ncols)
		      .map(i => [Math.floor(i/ncols), i % ncols])
		      .rename((key, val) => JSON.stringify(val))
		      .map(([row, col]) => {
			  const pos = [
			      col*stepX - 0.5*(ncols-1)*stepX + x,
			      row*stepY - 0.5*(nrows-1)*stepY + y,
			  ];
			  return pos;
		      });
		return RC_XY;
	    };
	},
	menu, online,
    });
};
