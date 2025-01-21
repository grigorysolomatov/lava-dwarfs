import {MSpace} from './gtools/mspace.js';
import {Context} from './gtools/context.js';

export const units = async (ctx, unit) => await new Context({...ctx}).stateMachine({
    who: async ctx => {
	const {verbs} = ctx;
	
	ctx.abilities = {
	    'portal': {
		'ninja': 'ninja-spawn',
		'hooker': 'hooker-spawn',
		'cowboy': 'cowboy-spawn',
		'mech': 'mech-spawn',
		'brute': 'brute-spawn',
		'cancel': 'cancel',
	    },
	    'ninja': {
		'push': 'push',
		'jump3': 'jump',
		'pass': 'pass',
	    },
	    'cowboy': {
		'shoot': 'shoot',
		'destroy-tile': 'destroy-tile',
		'jump': 'jump', 'pass': 'pass',
	    },
	    'hooker': {
		'pull-tile': 'pull-tile',
		'pull': 'pull',
		'jump': 'jump',
		'pass': 'pass',
	    },
	    'mech': {
		'rookshoot': 'rookshoot',
		'rookjump': 'jump',
		'pass': 'pass',
	    },
	    'brute': {
		'throw': 'throw',
		'smash': 'smash',
		'jump': 'jump',
		'pass': 'pass',
	    },
	}[unit] || {'pass': 'pass'};

	
	if (false && unit === 'mech') {
	    ctx.movement = pos => MSpace()
		.funcs({
		    pos: pos => pos,
		    units: pos => verbs.get('units', pos),
		})
		.dists({
		    pos: (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]),
		    units: (a, b) => 1*(a !== b),
		})
		.mark({pos: [pos], units: [undefined]})
		.raw({pos: d => d === 1, units: d => d === 0});
	}
	else {
	    ctx.movement = pos => MSpace()
		.funcs({
		    pos: pos => pos,
		    units: pos => verbs.get('units', pos),
		})
		.dists({
		    pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		    units: (a, b) => 1*(a !== b),
		})
		.mark({pos: [pos], units: [undefined]})
		.raw({pos: d => d === 1, units: d => d === 0});
	}

	if (unit === 'portal') { return 'portal'; }
	else { return 'step'; }	
    },
    portal: async ctx => {
	const {verbs, anims} = ctx;
	
	const pos = verbs.selected();
	const unit = await verbs.action(() => false, ctx.abilities);
	if (unit === 'cancel') { return; }
	
	const color = ['red', 'blue'][verbs.turn()];
	verbs.replace.one('overlay', pos, undefined);
	await verbs.replace.one('units', pos, `${unit}-${color}`);

	return 'pass';
    },
    step: async ctx => {
	const {verbs, anims} = ctx;
	
	const p0 = verbs.selected();
	const options = {
	    'select': 'cancel',
	};
	const choice = await verbs.action(ctx.movement(p0), options);
	if (typeof choice === 'string') { return choice; }
	const p1 = choice;
	verbs.select(p1);
	await verbs.cswap('units', p0, p1, {anim: anims.jump});
	
	if (!verbs.get('units', verbs.selected())) { return 'pass'; }

	verbs.act();
	return 'act';
    },
    act: async ctx => {
	const {verbs, anims} = ctx;

	if (verbs.actions() <= 0) { return 'pass'; }
	const p0 = verbs.selected();
	const choice = await verbs.action(ctx.movement(p0), ctx.abilities);
	if (typeof choice === 'string') { return choice; }
	const p1 = choice;
	verbs.select(p1);
	await verbs.cswap('units', p0, p1, {anim: anims.jump});

	if (!verbs.get('units', verbs.selected())) { return 'pass'; }

	verbs.act();
	return 'act';
    },
    pass: async ctx => {
	const {verbs} = ctx;

	verbs.crack();
	verbs.pass();
    },    
    'push': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: pos => pos,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d === 1, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	const p2 = [p1[0] + d[0], p1[1] + d[1]];

	if (verbs.get('units', p2)) {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.swap('units', p1, p1, {anim: anims.jump});
	}
	else {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.cswap('units', p1, p2, {anim: anims.jump});
	}

	// await verbs.swap('units', p0, p0, {anim: anims.jump});
	// await verbs.cswap('units', p1, p2, {anim: anims.jump});

	return 'pass';
    },
    'swap': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: pos => pos,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => 0 < d && d <= 2, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }	
	const p1 = choice;

	await verbs.swap('units', p0, p1, {anim: anims.jump});
	
	return 'pass';
    },
    'explode': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();

	await verbs.swap('units', p0, p0, {anim: anims.jump});
	await Context
	    .range(9)
	    .map(i => [Math.floor(i/3) - 1, i%3 - 1])
	    .filter(([row, col]) => row !== 0 || col !== 0)
	    .map(d => [
		[p0[0] + d[0], p0[1] + d[1]],
		[p0[0] + 2*d[0], p0[1] + 2*d[1]],
	    ])
	    .map(async ([p1, p2]) => {
		if (verbs.get('units', p2)) {
		    await verbs.swap('units', p1, p1, {anim: anims.jump});
		}
		else {
		    await verbs.cswap('units', p1, p2, {anim: anims.jump});
		}
	    })
	    .into(u => Promise.all(u.values()));

	return 'pass';
    },
    'shoot': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: p => [
		      p[0] - p0[0],
		      p[1] - p0[1],
		      Math.abs(p[0] - p0[0]) - Math.abs(p[1] - p0[1]),
		  ].includes(0)? p : p0,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d === 2, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	const p2 = [p1[0] + d[0]/2, p1[1] + d[1]/2];

	if (verbs.get('units', p2)) {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.swap('units', p1, p1, {anim: anims.jump});
	}
	else {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.cswap('units', p1, p2, {anim: anims.jump});
	}
	// await verbs.swap('units', p0, p0, {anim: anims.jump});
	// await verbs.cswap('units', p1, p2, {anim: anims.jump});

	return 'pass';
    },
    'rookshoot': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: p => [
		      p[0] - p0[0],
		      p[1] - p0[1],
		  ].includes(0)? p : p0,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d > 0, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]].map(u => Math.max(-1, Math.min(1, u)));
	const p2 = [p1[0] + d[0], p1[1] + d[1]];

	if (verbs.get('units', p2)) {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.swap('units', p1, p1, {anim: anims.jump});
	}
	else {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.cswap('units', p1, p2, {anim: anims.jump});
	}
	// await verbs.swap('units', p0, p0, {anim: anims.jump});
	// await verbs.cswap('units', p1, p2, {anim: anims.jump});

	return 'pass';
    },
    'pull': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: p => [
		      p[0] - p0[0],
		      p[1] - p0[1],
		      Math.abs(p[0] - p0[0]) - Math.abs(p[1] - p0[1]),
		  ].includes(0)? p : p0,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d === 2, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	const p2 = [p1[0] - d[0]/2, p1[1] - d[1]/2];

	if (verbs.get('units', p2)) {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.swap('units', p1, p1, {anim: anims.jump});
	}
	else {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.cswap('units', p1, p2, {anim: anims.jump});
	}
	
	// await verbs.swap('units', p0, p0, {anim: anims.jump});
	// await verbs.cswap('units', p1, p2, {anim: anims.jump});

	return 'pass';
    },
    'pull-tile': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const inRange = MSpace()
	      .funcs({
		  pos: p => [
		      p[0] - p0[0],
		      p[1] - p0[1],
		      Math.abs(p[0] - p0[0]) - Math.abs(p[1] - p0[1]),
		  ].includes(0)? p : p0,
		  tiles: pos => verbs.get('tiles', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  tiles: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], tiles: [undefined]})
	      .raw({pos: d => d === 2, tiles: d => d > 0});
	const filter = p1 => {
	    const p = [0.5*(p0[0] + p1[0]), 0.5*(p0[1] + p1[1])]; // mid
	    const isSpace = p => verbs.get('tiles', p) === undefined;
	    return inRange(p1) && isSpace(p);
	};
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	const p2 = [p1[0] - d[0]/2, p1[1] - d[1]/2];

	await verbs.swap('units', p0, p0, {anim: anims.jump});
	verbs.swap('units', p1, p2, {anim: anims.slide});
	if (!verbs.get('tiles', p2)) {
	    await verbs.swap('tiles', p1, p2, {anim: anims.slide});
	}

	return 'pass';
    },
    'destroy-tile': async ctx => {
	const {verbs, anims, types} = ctx;

	const p0 = verbs.selected();

	for (let i = 0; i < 2; i++) {
	    const filter = MSpace()
		  .funcs({
		      pos: pos => pos,
		      units: pos => verbs.get('units', pos),
		      tiles: pos => verbs.get('tiles', pos),
		  })
		  .dists({
		      pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		      units: (a, b) => 1*(a !== b),
		      tiles: (a, b) => 1*(a !== b),
		  })
		  .mark({pos: [p0], units: [undefined], tiles: ['tile']})
		  .raw({pos: d => d <= 2, units: d => d === 0, tiles: d => d === 0});
	    const options = i === 0? {
		'act': 'cancel',
	    } : {
		'pass': 'pass',
	    };
	    const choice = await verbs.action(filter, options);
	    if (typeof choice === 'string') { return choice; }
	    
	    const p1 = choice;
	    await verbs.replace.one('tiles', p1, undefined, {type: types.click, anim: anims.fade});	    
	}

	return 'pass';
    },
    'jump': async ctx => {
	const {verbs, anims} = ctx;

	if (verbs.actions() <= 0) { return 'pass'; }
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: pos => pos,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d === 2, units: d => d === 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	const p1 = choice;
	verbs.select(p1);
	await verbs.cswap('units', p0, p1, {anim: anims.jump});

	return 'pass';
    },
    'rookjump': async ctx => {
	const {verbs, anims} = ctx;

	if (verbs.actions() <= 0) { return 'pass'; }
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: p => [
		      p[0] - p0[0],
		      p[1] - p0[1],
		  ].includes(0)? p : p0,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d > 0, units: d => d === 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	const p1 = choice;
	verbs.select(p1);
	await verbs.cswap('units', p0, p1, {anim: anims.jump});

	return 'pass';
    },
    'jump3': async ctx => {
	const {verbs, anims} = ctx;

	if (verbs.actions() <= 0) { return 'pass'; }
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: pos => pos,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => [2, 3].includes(d), units: d => d === 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	const p1 = choice;
	verbs.select(p1);
	await verbs.cswap('units', p0, p1, {anim: anims.jump});

	return 'pass';
    },
    'throw': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	const filter = MSpace()
	      .funcs({
		  pos: pos => pos,
		  units: pos => verbs.get('units', pos),
	      })
	      .dists({
		  pos: (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]),
		  units: (a, b) => 1*(a !== b),
	      })
	      .mark({pos: [p0], units: [undefined]})
	      .raw({pos: d => d === 1, units: d => d > 0});
	const options = {
	    'act': 'cancel',
	};
	const choice = await verbs.action(filter, options);
	if (typeof choice === 'string') { return choice; }
	
	const p1 = choice;
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	const p2 = [p1[0] - 2*d[0], p1[1] - 2*d[1]];

	if (verbs.get('units', p2)) {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.swap('units', p1, p1, {anim: anims.jump});
	}
	else {
	    await verbs.swap('units', p0, p0, {anim: anims.jump});
	    await verbs.cswap('units', p1, p2, {anim: anims.jump});
	}

	// await verbs.swap('units', p0, p0, {anim: anims.jump});
	// await verbs.cswap('units', p1, p2, {anim: anims.jump});

	return 'pass';
    },
    'smash': async ctx => {
	const {verbs, anims, types} = ctx;
	
	const p0 = verbs.selected();
	await verbs.swap('units', p0, p0, {anim: anims.jump});
	await Context
	    .range(9)
	    .map(i => [Math.floor(i/3) - 1, i%3 - 1])
	    .map(d => [p0[0] + d[0], p0[1] + d[1]])
	    .filter(p => verbs.get('tiles', p))
	    .map(async p => await verbs.replace.one('tiles', p, 'tile-crack', {
		type: types.tile, anim: anims.crack
	    }))
	    .into(u => Promise.all(u.values()));
	
	return 'pass';
    },
});
