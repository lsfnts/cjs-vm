const OP = require('./opCodes');
const db = require('./debug');
const Bytecode = require('./bytecode');

module.exports = class VM {
	constructor(bytecode) {
		//if(bytecode) this.bytecode = bytecode;
		//else this.chunk = new Bytecode();
		this.bytecode;
		this.ip;
		this.stack;
		this.var;
	}

	interpret(bytecode) {
		this.bytecode = bytecode;
		this.stack = [];
		this.globals = new Map();

		this.ip = 0;
		return this.run();
	}

	run() {
		let op;
		do {
			this._debug_trace();
			op = this._readByte();

			switch (op) {
				case OP.CONSTANT:
					let constant = this._readConstant();
					this.stack.push(constant);
					break;
				case OP.LONG_CONSTANT:
					let longConstant = this._readLongConstant();
					this.stack.push(longConstant);
					break;
				case OP.NEGATE: this.stack.push(-this.stack.pop());
					break;
				case OP.NULL: this.stack.push(); break;
				case OP.TRUE: this.stack.push(true); break;
				case OP.FALSE: this.stack.push(false); break;
				case OP.ADD: case OP.SUBTRACT: case OP.MULTIPLY: case OP.DIVIDE: case OP.EXPONEN:
				case OP.LESS: case OP.LESS_EQ: case OP.GREATER: case OP.GREATER_EQ: case OP.EQUAL:
					this._binaryOp(op);
					break;
				case OP.NOT: this.stack.push(!this.stack.pop()); break;
				case OP.PRINT: console.log(this.stack.pop()); break;
				case OP.READ: console.log(this.stack.pop()); break;
				case OP.POP: this.stack.pop(); break;
				case OP.GET_VAR:
					let slot1 = this._readByte();
					this.stack.push(this.stack[slot1]);
					break;
				case OP.LONG_GET_VAR:
					let slot2 = this._read2Bytes();
					this.stack.push(this.stack[slot2]);
					break;
				case OP.SET_VAR:
					let slot3 = this._readByte();
					//quitar pop
					this.stack[slot3] = this.stack.pop();
					break;
				case OP.LONG_SET_VAR:
					let slot4 = this._read2Bytes();
					//quitar pop
					this.stack[slot4] = this.stack.pop();
					break;
				case OP.RETURN:
					return true;
				default:
					//console.log(this.bytecode.constants);

					return false;
			}
		} while (op);
	}

	_readByte() {
		return this.bytecode.code[this.ip++];
	}

	_read2Bytes() {
		return (this.bytecode.code[this.ip++] << 8) | this.bytecode.code[this.ip++];
	}

	_readConstant() {
		return this.bytecode.constants[this.bytecode.code[this.ip++]];
	}

	_readLongConstant() {
		return this.bytecode.constants[this._read2Bytes()];
	}

	_binaryOp(op) {
		let b = this.stack.pop();
		let a = this.stack.pop();
		switch (op) {
			case OP.ADD:
				this.stack.push(a + b);
				break;
			case OP.SUBTRACT:
				this.stack.push(a - b);
				break;
			case OP.MULTIPLY:
				this.stack.push(a * b);
				break;
			case OP.DIVIDE:
				this.stack.push(a / b);
				break;
			case OP.EXPONEN:
				this.stack.push(a ** b);
				break;
			case OP.EQUAL:
				this.stack.push(a === b);
				break;
			case OP.LESS:
				this.stack.push(a < b);
				break
			case OP.LESS_EQ:
				this.stack.push(a <= b);
				break;
			case OP.GREATER:
				this.stack.push(a > b);
				break;
			case OP.GREATER_EQ:
				this.stack.push(a >= b);
				break;
			default:
				break;
		}
	}

	_debug_trace() {
		console.log(this.stack);
		db.disassembleInstruction(this.bytecode, this.ip);
	}
}

var binaryOps = {

}