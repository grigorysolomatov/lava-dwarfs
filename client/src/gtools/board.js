import {Context} from '../gtools/context.js';

export const Board = pts => {    
    const layers = new Context();
    const board = new Context();

    return board.assign({
	get: (layer, pos) => {
	    return layers[layer]?.[JSON.stringify(pos)];
	},
	replace: (layer, pos, item) => {
	    layers[layer] ??= new Context();
	    const prev = board.get(layer, pos);
	    layers[layer][JSON.stringify(pos)] = item;
	    return prev;
	},
	swap: (layer, pos0, pos1) => {
	    const [item0, item1] = [pos0, pos1].map(pos => board.get(layer, pos));
	    board.replace(layer, pos0, item1);
	    board.replace(layer, pos1, item0);
	},
    });
};

const __HIDE__ = () => {
    const P = new Context(pts).rename((_, p) => JSON.stringify(pos));
    {all: async (layer, func) => {
	await P
	    .map(async p => board.one(layer, pos, func))
	    .into(P => Promise.all(P.values()));
    }};
    return board.assign({
	get: (layer, pos) => {
	    return layers[layer]?.[JSON.stringify(pos)];
	},
	replace: async (layer, pos, func) => {
	    layers[layer] ??= new Context();
	    layers[layer][JSON.stringify(pos)] = await func(board.get(layer, pos), pos);
	},
	swap: async (layer, pos0, pos1, func) => {
	    const [item0, item1] = [pos0, pos1].map(pos => board.get(layer, pos));
	    board.replace(layer, pos0, () => item1);
	    board.replace(layer, pos1, () => item0);
	    await func?.(item0, item1);
	},
    });
};
