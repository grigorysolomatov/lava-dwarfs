export class Context {
    static range(n) {
	const raw = new Array(n).fill().map((_, i) => i);
	return new Context(raw);
    }
    constructor(raw={}) {
	this.__raw = raw;
	return new Proxy(raw, {
	    get: (obj, prop) => this[prop] || raw[prop],
	    // set: (obj, prop, value) => { raw[prop] = value; return true; },
	});
    }
    assign(raw) {
	Object.assign(this.__raw, raw);
	return this;
    }
    keys() {
	return Object.keys(this.__raw);
    }
    values() {
	return Object.values(this.__raw);
    }
    map(func) {
	const raw = Object
	      .keys(this.__raw)
	      .map((key, i) => ({[key]: func(this.__raw[key], key, i)}))
	      .reduce((a, b) => Object.assign(a, b), {});
	return new Context(raw);
    }
    rename(func) {
	const raw = Object
	      .keys(this.__raw)
	      .map((key, i) => ({[func(key, this.__raw[key], i)]: this.__raw[key]}))
	      .reduce((a, b) => Object.assign(a, b), {});
	return new Context(raw);
    }
    forEach(func) {
	this.map(func);
	return this;
    }
    into(func) {
	return func(this);
    }
    onto(...funcs) {
	const hasAsync = funcs.map(func => func.constructor.name).includes("AsyncFunction");
	if (hasAsync) {
	    return new Promise(async res => {
		for (const func of funcs) { await func(this); }
		res(this);
	    });
	}
	else {
	    for (const func of funcs) { func(this); }
	    return this;
	}
    }
    steps(dict) {
	return this.onto(...Object.values(dict));
    }
    log() {
	console.log('[Context]', this.__raw);
	return this;
    }
    take(...keys) {
	const data = keys
	      .map(key => ({[key]: this.__raw[key]}))
	      .reduce((a, b) => Object.assign(a, b), {});
	return new Context(data);
    }
    filter(func) {
	const raw = Object.keys(this.__raw)
	      .filter((key, i) => func(this.__raw[key], key, i))
	      .map(key => ({[key]: this.__raw[key]}))
	      .reduce((a, b) => Object.assign(a, b), {});
	return new Context(raw);
    }
    invert() {
	const raw = this.keys().reduce((raw, key) => Object.assign(raw, {[this[key]]: key}), {});
	return new Context(raw);
    }
    remove(...keys) {
	keys.forEach(key => delete this.__raw[key]);
	return this;
    }
    async stateMachine(states, start=Object.keys(states)[0]) {
	let state = start;
	while (states[state]) { state = await states[state](this); }
	return state;
    }
    async treeMachine(root) {
	const path = [];
	while (true) {
	    const node = path.reduce((a, b) => a[b], root);
	    if (!node) {break;}	    
	    const next = await node[Object.keys(node)[0]](this);
	    if (next === '..') { path.pop(); } else { path.push(next); }
	}
    }
}
