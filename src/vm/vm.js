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
	}

	interpret(bytecode) {
		this.bytecode = bytecode;
		this.stack = [];

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
				case OP.EQUAL:
				case OP.RETURN:
					console.log(this.stack.pop());
					return true;
				default:
					return false;
			}
		} while(op);
	}

	_readByte() {
		return this.bytecode.code[this.ip++];
	}

	_readConstant() {
		return this.bytecode.constants[this.bytecode.code[this.ip++]];
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