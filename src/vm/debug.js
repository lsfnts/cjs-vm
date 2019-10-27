const OP = require('./opCodes');


module.exports = {
	dissasemble(chunk, name) {
		console.log(`===== ${name} =====`);
		let offset = 0;
		while (offset < chunk.count) {
			offset = module.exports.disassembleInstruction(chunk, offset);
		}
		console.log(`===================`);
	},

	disassembleInstruction(chunk, offset) {
		if (chunk.getLine(offset) === chunk.getLine(offset - 1)) {
			process.stdout.write("   | ");
		} else {
			process.stdout.write(`${format(chunk.getLine(offset), 4)} `);
		}
		switch (chunk.code[offset]) {
			case OP.RETURN:
				return module.exports.simpleInstruction("OP.RETURN", offset);
			case OP.CONSTANT:
				return module.exports.constantInstruction("OP.CONSTANT", chunk, offset);
			case OP.NULL:
				return module.exports.simpleInstruction("OP.NULL", offset);
			case OP.TRUE:
				return module.exports.simpleInstruction("OP.TRUE", offset);
			case OP.FALSE:
				return module.exports.simpleInstruction("OP.FALSE", offset);
			case OP.ADD:
				return module.exports.simpleInstruction("OP.ADD", offset);
			case OP.SUBTRACT:
				return module.exports.simpleInstruction("OP.SUBTRACT", offset);
			case OP.MULTIPLY:
				return module.exports.simpleInstruction("OP.MULTIPLY", offset);
			case OP.DIVIDE:
				return module.exports.simpleInstruction("OP.DIVIDE", offset);
			case OP.EXPONEN:
				return module.exports.simpleInstruction("OP.EXPONEN", offset);
			case OP.NOT:
				return module.exports.simpleInstruction("OP.NOT", offset);
			case OP.EQUAL:
				return module.exports.simpleInstruction("OP.EQUAL", offset);
			case OP.UNEQUAL:
				return module.exports.simpleInstruction("OP.UNEQUAL", offset);
			case OP.LESS:
				return module.exports.simpleInstruction("OP.LESS", offset);
			case OP.LESS_EQ:
				return module.exports.simpleInstruction("OP.LESS_EQ", offset);
			case OP.GREATER:
				return module.exports.simpleInstruction("OP.GREATER", offset);
			case OP.GREATER_EQ:
				return module.exports.simpleInstruction("OP.GREATER_EQ", offset);
			case OP.PRINT:
				return module.exports.simpleInstruction("OP.PRINT", offset);
			case OP.READ:
				return module.exports.simpleInstruction("OP.READ", offset);
			case OP.POP:
				return module.exports.simpleInstruction("OP.POP", offset);
			case OP.POP_N:
				return module.exports.constantInstruction("OP.POP_N", chunk, offset);
			case OP.DEFINE_GLOBAL:
				return module.exports.constantInstruction("OP.DEFINE_GLOBAL", chunk, offset);
			case OP.GET_VAR:
				return module.exports.byteInstruction("OP.GET_VAR", chunk, offset);
			case OP.LONG_GET_VAR:
				return module.exports.byte2Instruction("OP.LONG_GET_VAR", chunk, offset);
			case OP.SET_VAR:
				return module.exports.byteInstruction("OP.SET_VAR", chunk, offset);
			case OP.LONG_SET_VAR:
				return module.exports.byte2Instruction("OP.LONG_SET_VAR", chunk, offset);
			default:
				console.log(`${format(offset)} unknow`);
				return offset + 1;
		}
	},

	simpleInstruction(name, offset) {
		console.log(`${format(offset)} ${formatInst(name)}`);
		return offset + 1;
	},

	constantInstruction(name, chunk, offset) {
		let constant = chunk.code[offset + 1];
		console.log(`${format(offset)} ${formatInst(name)} ${chunk.constants[constant]}`);
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
	}

}

function format(value, n, p) {
	if (n) {
		if (p) return value.toString().padStart(n, p);
		else return value.toString().padStart(n);
	}
	else return value.toString().padStart(4, 0);
}

function formatInst(value) {
	return value.padEnd(12);
}
