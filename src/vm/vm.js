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
		this.frames = [];

		this.ip = 0;
		if (bytecode.hasError) return;
		return this.run();
	}

	run() {
		let op = 1;
		while (op) {
			//this._debug_trace();
			op = this._readByte();

			switch (op) {
				case OP.CONSTANT:
					this.stack.push(this._readConstant());
					break;
				case OP.LONG_CONSTANT:
					this.stack.push(this._readLongConstant());
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
				case OP.POP_N:
					let n = this._readConstant();
					while (n--) this.stack.pop();
					break;
				case OP.SET_VAR:
					this.stack[this._readByte()] = this.stack.pop();
					break;
				case OP.LONG_SET_VAR:
					this.stack[this._readShort()] = this.stack.pop();
					break;
				case OP.SET_VAR_FUN:
					this.stack[this._readByte() + this.frames[this.frames.length - 2]] = this.stack.pop();
					break;
				case OP.LONG_SET_VAR_FUN:
					this.stack[this._readShort() + this.frames[this.frames.length - 2]] = this.stack.pop();
					break;
				case OP.GET_VAR:
					this.stack.push(this.stack[this._readByte()]);
					break;
				case OP.LONG_GET_VAR:
					this.stack.push(this.stack[this._readShort()]);
					break;
				case OP.GET_VAR_FUN:
					this.stack.push(this.stack[this._readByte() + this.frames[this.frames.length - 2]]);
					break;
				case OP.LONG_GET_VAR_FUN:
					this.stack.push(this.stack[this._readShort() + this.frames[this.frames.length - 2]]);
					break;
				case OP.JUMP_IF_FALSE:
					if (!this.stack.pop()) this.ip += 2 + this._readShortNo();
					else this.ip += 2;
					break;
				case OP.JUMP:
					this.ip += 2 + this._readShortNo();
					break;
				case OP.LOOP:
					this.ip -= this._readShortNo() - 2;
					break;
				case OP.CALL:
					this.frames.push(this.stack.length - this._readByte() - 1);
					this.frames.push(this.ip);
					this.ip = this.stack.pop();
					console.log(this.frames);
					break;
				case OP.SET_RETURN:
					this.frames.push(this.stack.pop());
					break;
				case OP.RETURN_VALUE:
					this.stack.push(this.frames.pop())
				case OP.RETURN:
					this.ip = this.frames.pop();
					this.frames.pop();
					break;
				default:
					//console.log(this.bytecode.constants);

					return false;
			}
		}
	}

	_peek(offset) {
		return this.stack[this.stack.length - offset - 1];
	}

	_readByte() {
		return this.bytecode.code[this.ip++];
	}

	_readShort() {
		return (this.bytecode.code[this.ip++] << 8) | this.bytecode.code[this.ip++];
	}

	_readShortNo() {
		return (this.bytecode.code[this.ip] << 8) | this.bytecode.code[this.ip + 1];
	}

	_readConstant() {
		return this.bytecode.constants[this.bytecode.code[this.ip++]];
	}

	_readLongConstant() {
		return this.bytecode.constants[this._readShort()];
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
function newCallFrame(funcion, ip, slots) {
	return { funcion: funcion, ip: ip, slots: slots }
}