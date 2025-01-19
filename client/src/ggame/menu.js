export const menu = ctx => {
    const {scene, defaults, config} = ctx;
    const {width, height} = config;
    
    ctx.menu = async (options, x=0.5*width, y=0.5*height) => {
	const {step, tween, delay} = defaults.menu;
	const [nrows, ncols] = [Object.keys(options).length, 1];
	
	const entries = ctx.grid(x, y, nrows, ncols, step)
	      .map(([x, y], _, i) => ctx.text(x, y, Object.values(options)[i]))
	      .rename((_, __, i) => Object.keys(options)[i])
	      .forEach(text => text.setOrigin(0.5).setAlpha(0).setInteractive())
	      .forEach((text, _, i) => text.tween({
		  // y: {from: height, to: text.y},
		  x: {from: 0, to: text.x},
		  alpha: {from: 0, to: 1},
		  delay: delay*i,
	      }));

	const choice = await entries
	      .map((text, key) => text.event('pointerup', () => key))
	      .into(ctx => Promise.race(ctx.values()));

	entries.forEach(text => text.tween({alpha: 0, onComplete: () => text.destroy()}));
	return choice;
    };
};
