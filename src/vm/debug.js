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
				return module.exports.simpleInstruction("OP_RETURN", offset);
			case OP.CONSTANT:
				return module.exports.constantInstruction("OP_CONSTANT", chunk, offset);
			case OP.NULL:
				return module.exports.simpleInstruction("OP_NULL", offset);
			case OP.TRUE:
				return module.exports.simpleInstruction("OP_TRUE", offset);
			case OP.FALSE:
				return module.exports.simpleInstruction("OP_FALSE", offset);
			case OP.ADD:
				return module.exports.simpleInstruction("OP_ADD", offset);
			case OP.SUBTRACT:
				return module.exports.simpleInstruction("OP_SUBTRACT", offset);
			case OP.MULTIPLY:
				return module.exports.simpleInstruction("OP_MULTIPLY", offset);
			case OP.DIVIDE:
				return module.exports.simpleInstruction("OP_DIVIDE", offset);
			case OP.EXPONEN:
				return module.exports.simpleInstruction("OP_EXPONEN", offset);
			case OP.NOT:
				return module.exports.simpleInstruction("OP_NOT", offset);
			case OP.EQUAL:
				return module.exports.simpleInstruction("OP_EQUAL", offset);
			case OP.UNEQUAL:
				return module.exports.simpleInstruction("OP_UNEQUAL", offset);
			case OP.LESS:
				return module.exports.simpleInstruction("OP_LESS", offset);
			case OP.LESS_EQ:
				return module.exports.simpleInstruction("OP_LESS_EQ", offset);
			case OP.GREATER:
				return module.exports.simpleInstruction("OP_GREATER", offset);
			case OP.GREATER_EQ:
				return module.exports.simpleInstruction("OP_GREATER_EQ", offset);
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
