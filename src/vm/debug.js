const OP = require('./opCodes');


module.exports = {
	dissasemble(chunk, name) {
		console.log(`===== ${name} =====`);
		let offset = 0;
		while (offset < chunk.count) {
			offset = module.exports.disassembleInstruction(chunk, offset);
		}
		console.log(`===================`);
		console.log('constants:');
		console.log(chunk.constants.toString());
		console.log(`===================\n`);
	},

	disassembleInstruction(chunk, offset) {
		let line = chunk.getLine(offset);
		if (line === chunk.getLine(offset - 1)) {
			process.stdout.write(`${format('|', Math.max(2, Math.log10(line)))} `);
		} else {
			process.stdout.write(`${format(chunk.getLine(offset), Math.max(2, Math.log10(line)))} `);
		}
		switch (chunk.code[offset]) {
			case OP.CONSTANT:
				return module.exports.constantInstruction("CONSTANT", chunk, offset);
			case OP.LONG_CONSTANT:
				return module.exports.constantInstruction("LONG_CONSTANT", chunk, offset, true);
			case OP.TRUE:
				return module.exports.simpleInstruction("TRUE", offset);
			case OP.FALSE:
				return module.exports.simpleInstruction("FALSE", offset);
			case OP.ZERO:
				return module.exports.simpleInstruction("ZERO", offset);
			case OP.EMPTY_STRING:
				return module.exports.simpleInstruction("EMPTY_STRING", offset);
			case OP.ADD:
				return module.exports.simpleInstruction("ADD", offset);
			case OP.SUBTRACT:
				return module.exports.simpleInstruction("SUBTRACT", offset);
			case OP.MULTIPLY:
				return module.exports.simpleInstruction("MULTIPLY", offset);
			case OP.DIVIDE:
				return module.exports.simpleInstruction("DIVIDE", offset);
			case OP.EXPONEN:
				return module.exports.simpleInstruction("EXPONEN", offset);
			case OP.NOT:
				return module.exports.simpleInstruction("NOT", offset);
			case OP.EQUAL:
				return module.exports.simpleInstruction("EQUAL", offset);
			case OP.UNEQUAL:
				return module.exports.simpleInstruction("UNEQUAL", offset);
			case OP.LESS:
				return module.exports.simpleInstruction("LESS", offset);
			case OP.LESS_EQ:
				return module.exports.simpleInstruction("LESS_EQ", offset);
			case OP.GREATER:
				return module.exports.simpleInstruction("GREATER", offset);
			case OP.GREATER_EQ:
				return module.exports.simpleInstruction("GREATER_EQ", offset);
			case OP.PRINT:
				return module.exports.simpleInstruction("PRINT", offset);
			case OP.READ:
				return module.exports.simpleInstruction("READ", offset);
			case OP.POP:
				return module.exports.simpleInstruction("POP", offset);
			case OP.POP_N:
				return module.exports.constantInstruction("POP_N", chunk, offset);
			case OP.SET_VAR:
				return module.exports.byteInstruction("SET_VAR", chunk, offset);
			case OP.LONG_SET_VAR:
				return module.exports.byte2Instruction("LONG_SET_VAR", chunk, offset);
			case OP.SET_VAR_FUN:
				return module.exports.byteInstruction("SET_VAR_FUN", chunk, offset);
			case OP.LONG_SET_VAR_FUN:
				return module.exports.byte2Instruction("LONG_SET_VAR_FUN", chunk, offset);

			case OP.SET_ARRAY:
				return module.exports.byteInstruction("SET_ARRAY", chunk, offset);
			case OP.LONG_SET_ARRAY:
				return module.exports.byte2Instruction("LONG_SET_ARRAY", chunk, offset);
			case OP.SET_ARRAY_FUN:
				return module.exports.byteInstruction("SET_ARRAY_FUN", chunk, offset);
			case OP.LONG_SET_ARRAY_FUN:
				return module.exports.byte2Instruction("LONG_SET_ARRAY_FUN", chunk, offset);

			case OP.SET_CONTENT:
				return module.exports.byteInstruction("SET_CONTENT", chunk, offset);
			case OP.LONG_SET_CONTENT:
				return module.exports.byte2Instruction("LONG_SET_CONTENT", chunk, offset);
			case OP.SET_CONTENT_FUN:
				return module.exports.byteInstruction("SET_CONTENT_FUN", chunk, offset);
			case OP.LONG_SET_CONTENT_FUN:
				return module.exports.byte2Instruction("LONG_SET_CONTENT_FUN", chunk, offset);
			case OP.GET_VAR:
				return module.exports.byteInstruction("GET_VAR", chunk, offset);
			case OP.LONG_GET_VAR:
				return module.exports.byte2Instruction("LONG_GET_VAR", chunk, offset);
			case OP.GET_VAR_FUN:
				return module.exports.byteInstruction("GET_VAR_FUN", chunk, offset);
			case OP.LONG_GET_VAR_FUN:
				return module.exports.byte2Instruction("LONG_GET_VAR_FUN", chunk, offset);

			case OP.GET_CONTENT:
				return module.exports.byteInstruction("GET_CONTENT", chunk, offset);
			case OP.LONG_GET_CONTENT:
				return module.exports.byte2Instruction("LONG_GET_CONTENT", chunk, offset);
			case OP.GET_CONTENT_FUN:
				return module.exports.byteInstruction("GET_CONTENT_FUN", chunk, offset);
			case OP.LONG_GET_CONTENT_FUN:
				return module.exports.byte2Instruction("LONG_GET_CONTENT_FUN", chunk, offset);

			case OP.JUMP_IF_FALSE:
				return module.exports.jumpInstruction("JUMP_IF_F", chunk, offset, 1);
			case OP.JUMP:
				return module.exports.jumpInstruction("JUMP", chunk, offset, 1);
			case OP.LOOP:
				return module.exports.jumpInstruction("LOOP", chunk, offset, -1);
			case OP.CALL:
				return module.exports.byteInstruction("CALL", chunk, offset);
			case OP.SET_RETURN:
				return module.exports.simpleInstruction("SET_RETURN", offset);
			case OP.RETURN_VALUE:
				return module.exports.simpleInstruction("RETURN_VALUE", offset);
			case OP.RETURN:
				return module.exports.simpleInstruction("RETURN", offset);
			case OP.PREDEF:
				return module.exports.byteInstruction("PREDEF", chunk, offset);
			case OP.TO_INT:
				return module.exports.simpleInstruction("TO_INT", offset);
			case OP.TO_CHAR:
				return module.exports.simpleInstruction("TO_CHAR", offset);
			default:
				console.log(`${format(offset)} ${chunk.code[offset]}`);
				return offset + 1;
		}
	},

	simpleInstruction(name, offset) {
		console.log(`${format(offset)} ${formatInst(name)}`);
		return offset + 1;
	},

	constantInstruction(name, chunk, offset, long) {

		let index = long ? (chunk.code[offset + 1] << 8) | chunk.code[offset + 2] : chunk.code[offset + 1];
		console.log(`${format(offset)} ${formatInst(name)} ${chunk.constants[index]}`);
		return offset + 2;
	},

	byteInstruction(name, chunk, offset) {
		let slot = chunk.code[offset + 1];
		console.log(`${format(offset)} ${formatInst(name)} ${format(slot)}`);
		return offset + 2;
	},

	byte2Instruction(name, chunk, offset) {
		let slot = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
		console.log(`${format(offset)} ${formatInst(name)} ${format(slot)}`);
		return offset + 3;
	},

	jumpInstruction(name, chunk, offset, sign) {
		let jump = (chunk.code[offset + 1] << 8) | chunk.code[offset + 2];
		console.log(`${format(offset)} ${formatInst(name)} -> ${format(offset + 3 + sign * jump)}`);
		return offset + 3;
	},

	predefInstruction(name, chunk, offset) {
		let slot = chunk.code[offset + 1];
		let fun;
		switch (slot) {
			case OP.WRITE: fun = 'write'; break;
			case OP.APPEND: fun = 'append'; break;
			case OP.READ: fun = 'read'; break;
			case OP.SQRT: fun = 'sqrt'; break;
			case OP.ABS: fun = 'abs'; break;
			case OP.FACT: fun = 'fact'; break;
			case OP.SEN: fun = 'sen'; break;
			case OP.COS: fun = 'cos'; break;
			case OP.TAN: fun = 'tan'; break;
			case OP.ASEN: fun = 'asen'; break;
			case OP.ACOS: fun = 'acos'; break;
			case OP.ATAN: fun = 'atan'; break;
			case OP.FLOOR: fun = 'floor'; break;
			case OP.CEILING: fun = 'ceiling'; break;
			case OP.ROUND: fun = 'round'; break;
			default: fun = 'otro'; break;
		}
		console.log(`${format(offset)} ${formatInst(name)} ${fun}`);
		return offset + 2;
	},

}

function format(value, n, p) {
	if (n) {
		if (p) return value.toString().padStart(n, p);
		else return value.toString().padStart(n);
	}
	else return value.toString().padStart(4, 0);
}

function formatInst(value, n) {
	if (n) return value.padEnd(n);
	return value.padEnd(16);
}
