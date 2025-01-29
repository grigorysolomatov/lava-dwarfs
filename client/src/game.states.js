import {MSpace} from './gtools/mspace.js';
import {units} from './game.units.js';

export const states = async ctx => ctx.stateMachine({
    init: async ctx => {
	const {verbs, anims, types, nrows, ncols} = ctx;

	verbs.replace.all('units', () => undefined);
	verbs.replace.all('select', () => undefined);
	verbs.replace.all('clicks', () => undefined, {type: types.click, anim: anims.click});
	await verbs.replace.all('tiles', ([row, col]) => {
	    if (row === 0 || col === 0 || row === nrows-1 || col === ncols-1) { return undefined; }
	    return 'tile';
	}, {
	    type: types.tile, anim: anims.spin
	});	

	return 'portals';
    },
    portals: async ctx => {	
	const {verbs, anims, types, nrows, ncols} = ctx;

	const [row, col] = [(nrows-1)/2, (ncols-1)/2];
	const portal = async (pos, key) => {
	    await verbs.replace.one('units', pos, key, {
		type: types.portal, anim: anims.grow,
	    });
	};
	portal([row-2, col-2], 'portal-red');
	portal([row+2, col-2], 'portal-blue');
	portal([row-2, col+2], 'portal-blue');
	await portal([row+2, col+2], 'portal-red');

	return 'spawn';
    },
    spawn: async ctx => {
	const {verbs, anims, myIdx, POS} = ctx;

	verbs.crack();
	verbs.select();
	const portals = POS
	      .filter(pos => verbs.get('units', pos)?.includes('portal'))
	      .keys().length > 0;

	if (!portals) { return 'select'; }

	const filter = pos => verbs.get('units', pos)?.includes(['portal-red', 'portal-blue'][verbs.turn()]);
	const pos = await verbs.action(filter); verbs.select(pos);	
	
	const unit = verbs.get('units', pos).split('-')[0];
	await units(ctx, unit);
	
	return 'spawn';
    },
    select: async ctx => {
	const {verbs, anims, myIdx} = ctx;

	verbs.crack();
	verbs.select();
	const filter = pos => verbs.get('units', pos)?.includes(['red', 'blue'][verbs.turn()]);
	const pos = await verbs.action(filter); verbs.select(pos);	
	
	const unit = verbs.get('units', pos).split('-')[0];
	await units(ctx, unit);
	
	return 'select';
    },    
});

const __HIDE__ = {
    init_OLD: async ctx => {
	return
	const {verbs, anims, types, nrows, ncols} = ctx;

	verbs.replace.all('units', () => undefined);
	verbs.replace.all('select', () => undefined);
	verbs.replace.all('clicks', () => undefined, {type: types.click, anim: anims.click});
	await verbs.replace.all('tiles', ([row, col]) => {
	    if (row === 0 || col === 0 || row === nrows-1 || col === ncols-1) { return undefined; }
	    return 'tile';
	}, {
	    type: types.tile, anim: anims.spin
	});

	const [row, col] = [(nrows-1)/2, (ncols-1)/2];
	
	verbs.replace.one('units', [row-1, col-(col-1)], 'hooker-red');
	verbs.replace.one('units', [row-1, col+(col-1)], 'hooker-blue');

	verbs.replace.one('units', [row, col-(col-1)], 'pusher-red');
	verbs.replace.one('units', [row, col+(col-1)], 'pusher-blue');

	verbs.replace.one('units', [row+1, col-(col-1)], 'shooter-red');
	await verbs.replace.one('units', [row+1, col+(col-1)], 'shooter-blue');
	
	return 'crack';
    },
    crack_OLD: async ctx => {
	const {verbs, anims, types, POS} = ctx;
	POS
	    .filter(pos => verbs.get('units', pos))
	    .filter(pos => verbs.get('tiles', pos) === 'tile')
	    .map(async pos => await verbs.replace.one('tiles', pos, 'tile-crack', {
		type: types.tile, anim: anims.crack
	    }))
	    .into(u => Promise.all(u.values()));
	return 'select';
    },
};
