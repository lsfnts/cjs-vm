const OP = require('./opCodes');
const db = require('./debug');
const Bytecode = require('./bytecode');
var readline = require('readline-sync');
const jetpack = require('fs-jetpack');
const lineByLine = require('n-readlines');

module.exports = class VM {
	constructor(bytecode) {
		//if(bytecode) this.bytecode = bytecode;
		//else this.chunk = new Bytecode();
		this.bytecode;
		this.ip;
		this.stack;
		this.var;
	}

	interpret(bytecode, isui) {
		this.bytecode = bytecode;
		this.stack = [];
		this.frames = [];

		this.ip = 0;
		if (bytecode.hasError) return;
		return this.run(isui);
	}

	run(isui) {
		let op = 1;
		while (op) {
			this._debug_trace();
			op = this._readByte();

			switch (op) {
				case OP.CONSTANT:
					this.stack.push(this._readConstant());
					break;
				case OP.LONG_CONSTANT:
					this.stack.push(this._readLongConstant());
					break;
				case OP.ZERO: this.stack.push(0);
					break;
				case OP.EMPTY_STRING: this.stack.push('');
					break
				case OP.TRUE: this.stack.push(true);
					break;
				case OP.FALSE: this.stack.push(false);
					break;
				case OP.NEGATE: this.stack.push(-this.stack.pop());
					break;
				case OP.ADD: case OP.SUBTRACT: case OP.MULTIPLY: case OP.DIVIDE: case OP.MOD: case OP.EXPONEN: case OP.OR:
				case OP.AND: case OP.EQUAL: case OP.UNEQUAL: case OP.GREATER: case OP.GREATER_EQ: case OP.LESS: case OP.LESS_EQ:
					this._binaryOp(op);
					break;
				case OP.PRINT:
					if (isui) console.log((JSON.stringify({ text: this.stack.pop(), type: 'salida' })));
					else console.log(this.stack.pop());
					break;
				case OP.READ: {
					let t = this._readByte();
					let v;
					let name = this.stack.pop();
					if (isui) process.stdout.write((JSON.stringify({ text: name, type: 'entrada' })));
					switch (t) {
						case 9://int
							v = readline.questionInt();
							break;
						case 10://float
							v = readline.questionFloat();
							break;
						case 11://string
							v = readline.question();
							break;
						case 12://char
							v = readline.question().charAt(0);
							break;
						case 13://bool
							v = readline.question();
							if (v === "true") v = true;
							else if (v === "false") v = false;
							else return false;
							break;
						default:
							v = '';
							break;
					}
					this.stack.push(v);
					break;
				}
				case OP.POP: this.stack.pop(); break;
				case OP.POP_N: {
					let n = this._readConstant();
					while (n--) this.stack.pop();
				}
					break;
				case OP.SET_VAR:
					this.stack[this._readByte()][0] = this.stack.pop();
					break;
				case OP.LONG_SET_VAR:
					this.stack[this._readShort()][0] = this.stack.pop();
					break;
				case OP.SET_VAR_FUN:
					this.stack[this._readByte() + this.frames[this.frames.length - 2]][0] = this.stack.pop();
					break;
				case OP.LONG_SET_VAR_FUN:
					this.stack[this._readShort() + this.frames[this.frames.length - 2]][0] = this.stack.pop();
					break;
				case OP.SET_ARRAY: {
					let slot = this._readByte();
					let v = this.stack.pop();
					let n = this.stack.pop();
					this.stack[slot][0] = [n];
					while (n > 0) {
						this.stack[slot][0][--n] = v;
					}
					break;
				}
				case OP.LONG_SET_ARRAY: {
					let slot = this._readShort();
					let v = this.stack.pop();
					let n = this.stack.pop();
					this.stack[slot][0] = [n];
					while (n > 0) {
						this.stack[slot][0][--n] = v;
					}
					break;
				}
				case OP.SET_ARRAY_FUN: {
					let slot = this._readByte() + this.frames[this.frames.length - 2];
					let v = this.stack.pop();
					let n = this.stack.pop();
					this.stack[slot][0] = [n];
					while (n > 0) {
						this.stack[slot][0][--n] = v;
					}
					break;
				}
				case OP.LONG_SET_ARRAY_FUN: {
					let slot = this._readShort() + this.frames[this.frames.length - 2];
					let v = this.stack.pop();
					let n = this.stack.pop();
					this.stack[slot][0] = [n];
					while (n > 0) {
						this.stack[slot][0][--n] = v;
					}
					break;
				}
				case OP.SET_CONTENT: {
					let v = this.stack.pop();
					let i = this.stack.pop();
					this.stack[this._readByte()][0][i] = v;
					break;
				}
				case OP.LONG_SET_CONTENT: {
					let v = this.stack.pop();
					let i = this.stack.pop();
					this.stack[this._readShort()][0][i] = v;
					break;
				}
				case OP.SET_CONTENT_FUN: {
					let v = this.stack.pop();
					let i = this.stack.pop();
					this.stack[this._readByte() + this.frames[this.frames.length - 2]][0][i] = v;
					break;
				}
				case OP.GET_VAR:
					this.stack.push(this.stack[this._readByte()][0]);
					break;
				case OP.LONG_GET_VAR:
					this.stack.push(this.stack[this._readShort()][0]);
					break;
				case OP.GET_VAR_FUN:
					this.stack.push(this.stack[this._readByte() + this.frames[this.frames.length - 2]][0]);
					break;
				case OP.LONG_GET_VAR_FUN:
					this.stack.push(this.stack[this._readShort() + this.frames[this.frames.length - 2]][0]);
					break;
				case OP.GET_CONTENT: {
					let i = this.stack.pop();
					this.stack.push(this.stack[this._readByte()][0][i]);
					break;
				}
				case OP.LONG_GET_CONTENT: {
					let i = this.stack.pop();
					this.stack.push(this.stack[this._readShort()][0][i]);
					break;
				}
				case OP.GET_CONTENT_FUN: {
					let i = this.stack.pop();
					this.stack.push(this.stack[this._readByte() + this.frames[this.frames.length - 2]][0][i]);
					break;
				}
				case OP.LONG_GET_CONTENT_FUN: {
					let i = this.stack.pop();
					this.stack.push(this.stack[this._readShort() + this.frames[this.frames.length - 2]][0][i]);
					break;
				}
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
				case OP.PREDEF: {
					let base = (this.stack.length - this._readByte() - 1);
					switch (this.stack.pop()) {
						case OP.WRITE:
							jetpack.write(this.stack[base], this.stack[base + 1]);
							this.pop(); this.pop();
							break;
						case OP.APPEND:
							jetpack.append(this.stack[base], this.stack[base + 1]);
							this.pop(); this.pop();
							break;
						case OP.READFILE: {
							let l = this.stack.pop();
							let liner = new lineByLine(this.stack.pop());

							let line;
							let res = '';
							let lineNumber = 0;
							while (line = liner.next()) {
								if (lineNumber === l) {
									res = line.toString();
									break;
								}
								lineNumber++;
							}
							liner.close();
							this.stack.push(res);
							break;
						}
						case OP.SQRT:
							this.stack.push(Math.sqrt(this.stack.pop()));
							break;
						case OP.ABS:
							this.stack.push(Math.abs(this.stack.pop()));
							break;
						case OP.FACT: {
							let n = this.stack.pop();
							let total = 1;
							for (let i = 1; i <= n; i++) {
								total = total * i;
							}
							this.stack.push(total);
							break;
						}
						case OP.SEN:
							this.stack.push(Math.sin(this.stack.pop()));
							break;
						case OP.COS:
							this.stack.push(Math.cos(this.stack.pop()));
							break;
						case OP.TAN:
							this.stack.push(Math.tan(this.stack.pop()));
							break;
						case OP.ASEN:
							this.stack.push(Math.asin(this.stack.pop()));
							break;
						case OP.ACOS:
							this.stack.push(Math.acos(this.stack.pop()));
							break;
						case OP.ATAN:
							this.stack.push(Math.atan(this.stack.pop()));
							break;
						case OP.FLOOR:
							this.stack.push(Math.floor(this.stack.pop()));
							break;
						case OP.CEILING:
							this.stack.push(Math.ceil(this.stack.pop()));
							break;
						case OP.ROUND:
							this.stack.push(Math.round(this.stack.pop()));
							break;
						case OP.LENGTH:
							this.stack.push(this.stack.pop().length);
							break;
						case OP.SPLIT: {
							let res = this.stack[base].split(this.stack[base + 1]);
							this.stack.pop(); this.stack.pop();
							this.stack.push(res)
							break;
						}
						case OP.SUBSTRING: {
							let res = this.stack[base].substring(this.stack[base + 1], this.stack[base + 2]);
							this.stack.pop(); this.stack.pop(); this.stack.pop();
							this.stack.push(res);
							break;
						}
						case OP.AT: {
							let res = this.stack[base].charAt(this.stack[base + 1]);
							this.stack.pop(); this.stack.pop();
							this.stack.push(res);
							break;
						}
						case OP.SIZE:
							this.stack.push(this.stack.pop().length);
							break;
						case OP.TOSTRING:
							this.stack.push(this.stack.pop().toString());
						default:
							break;
					}
					break;
				}
				case OP.TO_INT:
					this.stack.push(Math.floor(this.stack.pop()));
					break;
				case OP.TO_CHAR:
					this.stack.push((this.stack.pop()));
					break;
				case OP.DEFINE_PARAM: {
					let name = this.stack.pop();
					this.stack[this._readByte() + this.frames[this.frames.length - 2]] = [this.stack.pop(), name];
					break;
				}
				case OP.DEFINE_VAR: {
					this.stack[this._readByte()] = [this.stack.pop(), this.stack.pop()];
					break;
				}
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
			case OP.MOD:
				this.stack.push(a % b);
				break;
			case OP.EXPONEN:
				this.stack.push(a ** b);
				break;
			case OP.OR:
				this.stack.push(a || b);
				break;
			case OP.AND:
				this.stack.push(a || b);
				break;
			case OP.EQUAL:
				this.stack.push(a === b);
				break;
			case OP.UNEQUAL:
				this.stack.push(a !== b);
				break;
			case OP.GREATER:
				this.stack.push(a > b);
				break;
			case OP.GREATER_EQ:
				this.stack.push(a >= b);
				break;
			case OP.LESS:
				this.stack.push(a < b);
				break
			case OP.LESS_EQ:
				this.stack.push(a <= b);
				break;
			default:
				break;
		}
	}

	_debug_trace() {
		//console.log(JSON.stringify());

		db.disassembleInstruction(this.bytecode, this.ip);
		console.log(this.stack);

		/*for (const value of this.stack.reverse()) {
			if (Array.isArray(value)) console.log(`[${value[1]}: ${value[0]}]`);
			else console.log(`${value}`);
		}*/
		//this.stack.reverse();

	}

}