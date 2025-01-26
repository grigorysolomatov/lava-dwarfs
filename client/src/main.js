import {Context} from './gtools/context.js';

import {GG} from './ggame/ggame.js';
import {menu} from './ggame/menu.js';
import {server} from './ggame/server.js';

import {online} from './online.js';
import {assets} from './assets.js';

export const main = async () => await new Context().steps({
    setup: async ctx => {
	const height = window.innerHeight;
	const width = Math.min(window.innerWidth, height/1.6);
	const config = {
	    width, height,
	    backgroundColor: '#000000',
	    type: Phaser.WEBGL,
	};
	const defaults = {
	    tween: {
		duration: 500,
		ease: 'Cubic.easeOut',
	    },
	    text: {
		fontFamily: '"Modak", system-ui',
		fontSize: '32px',
		fill: '#ffaa00',
	    },
	    menu: {
		step: 50,
		delay: 100,
	    },
	};
	
	const gg = await GG().assign({config, defaults}).start();
	await gg.fonts('Modak');
	await gg.assets(assets);		
	
	ctx.assign({gg, width, height});
    },
    addons: ctx => {
	const {gg} = ctx;
	menu(gg);
	server(gg);
    },
    background: ctx => {
	const {gg, width, height} = ctx;
		
	const bgs = Context.range(8)
	      .map(_ => gg.sprite(0.5*width, 0.5*height, 'background'))
	      .map(s => s.setDisplaySize(2*height, 2*height).setTint(0xaa6666))
	      .filter((_, i) => i > 0)
	      .map(async s => {
		  while (true) {
		      await s.setAlpha(0).setAngle(360*Math.random()).tween({
			  alpha: {from: 0, to: 0.5*Math.random()},
			  x: 0.5*width + 0.4*width*(Math.random()-0.5),
			  y: 0.5*height + 0.4*height*(Math.random()-0.5),
			  yoyo: true,
			  ease: 'Sine.easeInOut',
			  duration: 4000*(Math.random() + 1),
		      });
		  }
	      });	
    },
    curtains: async ctx => {
	const {gg, width, height} = ctx;

	const size = width;
	const top = gg.sprite(0.5*width, 0, 'curtain')
	      .setDisplaySize(1.1*size, size)
	      .setOrigin(0.5, 1)
	      .setAlpha(0.5);
	const bot = gg.sprite(0.5*width, height, 'curtain')
	      .setDisplaySize(1.1*width, width)
	      .setOrigin(0.5, 0)	      
	      .setAlpha(0.5);

	ctx.curtains = new Context({
	    set: async t => {
		top.tween({y: t*0.5*height + (1-t)*0});
		await bot.tween({y: t*0.5*height + (1-t)*height});
	    },
	});
	ctx.curtains.set(1 - width/height);
    },
    menu: async ctx => {
	const {gg} = ctx;
	const choice = await gg.menu({play: 'Play'});
	await online(ctx);
    },
});
