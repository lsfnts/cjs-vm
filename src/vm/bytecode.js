const OpCodes = require('./opCodes');
const jetpack = require('fs-jetpack');
const fs = require('fs');

module.exports = class Bytecode {
	constructor() {
		this.count = 0;
		this.cap = 8;
		this.code = new Uint8Array(8);

		this.currentLine = 0;
		this.lineCount = 0;
		this.lineCap = 8;
		this.lines = new Uint16Array(8);
		//this.lines[0] = 0;
		//this.lines[1] = 1;

		this.constants = [];

	}

	write(byte, line) {
		if (this.cap < this.count + 1) {
			this.cap *= 2;
			let temp = this.code.buffer;
			this.code = new Uint8Array(this.cap);
			this.code.set(new Uint8Array(temp));
		}
		if (line !== this.currentLine) {
			if (this.lineCap < this.lineCount + 1) {
				this.lineCap *= 1.5;
				let temp = this.lines.buffer;
				this.lines = new Uint16Array(this.lineCap);
				this.lines.set(new Uint16Array(temp));
			}
			this.lines[this.lineCount++] = this.count;
			this.lines[this.lineCount++] = line;
			this.currentLine = line;
		}
		this.code[this.count++] = byte;
	}

	getLine(o) {
		let linea;
		for (let i = 0; i < this.lineCount; i += 2) {
			//console.log(`pos: ${i}, value: ${this.lines[i]}`);

			if (o < this.lines[i]) {
				linea = this.lines[i - 1];
				break;
			}
		}
		if (linea) return linea;
		else return this.lines[this.lineCount - 1];
	}
	//typed

	//normal array
	addConstant(value) {
		return (this.constants.includes(value)) ? this.constants.indexOf(value) : this.constants.push(value) - 1;
	}

	setHasError() {
		this.hasError = true;
	}

	save() {
		let s = new Uint32Array(3);
		s[0] = JSON.stringify(this.constants).length;
		s[1] = this.count;
		s[2] = this.lineCount;
		console.log(s);

		let buffer = Buffer.from(this.code.slice(0, this.count));
		jetpack.write('./codigo.cj', Buffer.from(s))
		jetpack.append('./codigo.cj', Buffer.from(JSON.stringify(this.constants)));
		jetpack.append('./codigo.cj', buffer);
	}

	load(path) {
		let val = jetpack.read(path, 'buffer');
		console.log(`${val[0]} ${val[1]} ${val[2]}`);
		this.constants = JSON.parse(val.slice(3, 3 + val[0]));
		this.code = val.slice(3 + val[0], 3 + val[0] + val[1]);
		this.lines = val.slice(3 + val[0] + val[1], 3 + val[0] + val[1] + val[2]);
	}
}

class funcion {
	constructor(name, base, arity, depth) {
		this.name = name;
		this.base = base;
		this.arity = arity;
		this.depth = depth;
	}
}
