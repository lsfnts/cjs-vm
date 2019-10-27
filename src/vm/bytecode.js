const OpCodes = require('./opCodes');

module.exports = class Bytecode {
	constructor() {
		this.count = 0;
		this.cap = 8;
		this.code = new Uint8Array(8);
		
		this.currentLine = 1;
		this.lineCount = 2;
		this.lineCap = 8;
		this.lines = new Uint16Array(8);
		this.lines[0] = 0;
		this.lines[1] = 1;
		
		this.constants = [];

		this.var
	}

	write(byte, line) {
		if (this.cap < this.count+1) {
			this.cap *= 2;
			let temp = this.code.buffer;
			this.code = new Uint8Array(this.cap);
			this.code.set(new Uint8Array(temp));
		}
		if(line !== this.currentLine){
			if (this.lineCap < this.lineCount+1) {
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
				linea = this.lines[i-1];
				break;
			}
		}
		if(linea) return linea;
		else return this.lines[this.lineCount-1];
	}
	//typed

	//normal array
	addConstant(value) {
		return this.constants.push(value)-1;
	}
}
