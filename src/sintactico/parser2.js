//PANIC FLAG

const lex = require('../lexico/lexico').utils;
const TOK = lex.types;

const err = require('./errores');
const error = err.errorType;

const Symbol = require('./symbols');

const OP = require('../vm/opCodes');
const Bytecode = require('../vm/bytecode');


var tokenList;
var token = lex.emptyToken(0, 0);
var ij;

let compiler = {
	vars: [],
	varCount: 0,
	scopeDepth: -1
};

var bytecode = new Bytecode();

module.exports = {
	parse: function (tokenIn) {

		tokenList = tokenIn;
		ij = -1;
		nextToken();
		programa();
		return bytecode;
	}
}

function programa() {

	if (token.type === TOK.BEGIN) nextToken();
	else throwError(error.NOT_BEGIN);
	bloque();
	if (token.type === TOK.END);
	else throwError(error.NOT_END);
}
function beginScope() {
	compiler.scopeDepth++;
}

function endScope() {
	compiler.scopeDepth--;
	let toPOP = 0;
	while (compiler.varCount > 0 && compiler.vars[compiler.varCount - 1].depth > compiler.scopeDepth) {
		toPOP++;
		compiler.varCount--;
	}
	if (toPOP > 1) emitBytes(OP.POP_N, makeConstant(toPOP));
	else emitByte(OP.POP);
}

function bloque() {
	beginScope();

	if (token.type === TOK.LCURL || token.type === TOK.BEGIN) nextToken();
	else throwError(error.NOT_LCURL);
	while (token.type !== TOK.RCURL && token.type !== TOK.END) {
		instruccion();
	}
	nextToken();
	endScope();
}

function instruccion() {
	if (token.type === TOK.FUN) {
		nextToken();
		//fun
	} else if (token.type === TOK.IF) {
		nextToken();
		if_instr();
	} else if (token.type === TOK.FOR) {
		nextToken();
		for_instr();
	} else if (token.type === TOK.DO) {
		nextToken();
		//dowhile_instr();
	} else if (token.type === TOK.LCURL) {
		//beginScope();
		bloque();
		//endScope();
	}
	else {
		simple_instr();
		if (token.type === TOK.SEMI) {
			nextToken();
		} else throwError(error.NOT_SEMI)
	}
	sincronizar();
}
function simple_instr() {
	if (token.type === TOK.IDEN) {
		let tokCache = token;
		if (resolveVar(token.value) < 0) {
			throwError(error.UNDEFINED);
		}
		nextToken();
		if (token.type === TOK.ASSIGN) {
			asignacion(tokCache);

		} else if (token.type === TOK.LPAR) {
			//quiere ser funcion
		}
		else if (token.type === TOK.LBRACKET) {
			//quiere ser funcion
		} else {
			throwError(error.NOT_ASSIGN);
			return;
		}
	} else if (lex.isTypeTok(token)) {
		declaracion();
	} else if (token.type === TOK.PRINT) {
		nextToken();
		print_instr();
	} else if (token.type === TOK.READ) {
		nextToken();
		//print_instr();
	}
}

function declaracion() {
	console.log('declaracion');
	var typeCache = token.type;
	let idenTok;

	do {
		nextToken();
		if (token.type === TOK.IDEN) {
			if (resolveVar(token.value, true) >= 0) throwError(error.VAR_EXISTS);
			else {
				compiler.vars.push({ name: token.value, depth: -1, type: lex.getType(token.type) });
				compiler.varCount++;
			}
			//if (!Symbol.insert(token.value, lex.getType(typeCache))) throwError(error.VAR_EXISTS);
			/*for (let i = compiler.varCount - 1; i >= 0; i--) {
				let local = compiler.vars[i];
				if (local.depth !== -1 && local.depth < compiler.scopeDepth) {
					break;
				}

				if (token.value === local.name) {
					throwError(error.VAR_EXISTS);
				}
			}*/
			idenTok = token;


			nextToken();
			if (token.type === TOK.ASSIGN) asignacion(idenTok);
			else emitByte(OP.NULL);
			compiler.vars[compiler.varCount - 1].depth = compiler.scopeDepth;
			let slot = resolveVar(idenTok.value);
			if (slot < 256) emitBytes(OP.SET_VAR, slot);
			else emit3Bytes(OP.LONG_SET_VAR, slot);
		} else { throwError(error.NOT_IDEN); return }
	} while (token.type === TOK.COMMA);

}

function asignacion(tokIden) {
	console.log('asignacion: ' + tokIden.value);
	//let s; = Symbol.lookup(tokIden.value);
	let s = compiler.vars[resolveVar(tokIden.value)];
	//if (!s) throwError(error.UNDEFINED);
	nextToken();
	console.log(s);


	expresion(s.type);
}

function expresion(type) {
	var expr = { INTEGER: 8, FLOAT: 9, STRING: 10, CHAR: 11, BOOL: 12, };
	if (!type) {
		let offset = 1;
		let tokenType = token.type;
		while (tokenType === TOK.LPAR) {
			tokenType = peek(offset).type;
		}
		if (tokenType === TOK.IDEN) {
			//tokenType = Symbol.lookup(token.value).type;
			if (resolveVar(token.value) < 0) {
				throwError(error.UNDEFINED);
				return;
			}
			tokenType = compiler.vars[resolveVar(token.value)].type;
		}
		switch (tokenType) {
			case TOK.INTEGER: expr_num(expr.INTEGER);
				break;
			case TOK.FLOAT: expr_num(expr.FLOAT);
				break;
			case TOK.STRING: expr_string(expr.STRING);
				break;
			case TOK.CHAR: expr_string(expr.CHAR);
				break;
			case TOK.TRUE: case TOK.FALSE: case TOK.NOT: case TOK.BOOL: expr_bool(expr.BOOL);
				break;
			default:
				break;
		}
	}
	switch (type) {
		case expr.INTEGER: case expr.FLOAT: case expr.CHAR:
			expr_num(type);
			break;
		case expr.STRING:
			expr_string(type);
			break;
		case expr.BOOL:
			expr_bool(type);
			break;
		default:

			break;
	}
}

function expr_num(type) {
	console.log('expr_num');
	factor(type);
	while (token.type === TOK.SUM || token.type === TOK.SUB) {
		let sign = token.type;
		nextToken();
		factor(type);
		switch (sign) {
			case TOK.SUM:
				emitByte(OP.ADD);
				break;
			case TOK.SUB:
				emitByte(OP.SUBTRACT);
				break;
		}
	}
}

function factor(type) {
	potencia(type);
	while (token.type === TOK.MUL || token.type === TOK.DIV || token.type === TOK.MOD) {
		let sign = token.type;
		nextToken();
		potencia(type);
		switch (sign) {
			case TOK.MUL:
				emitByte(OP.MULTIPLY);
				break;
			case TOK.DIV:
				emitByte(OP.DIVIDE);
				break;

			default:
				break;
		}
	}
}

function potencia(type) {
	numero(type);
	let t = 0;
	while (token.type === TOK.POW) {
		++t;
		nextToken();
		numero(type);

	}
	for (let i = 0; i < t; i++) {
		emitByte(OP.EXPONEN);

	}
}

function numero(type) {
	if (token.type === TOK.LPAR) {
		nextToken();
		expr_num(type);
		if (token.type === TOK.RPAR) {

			nextToken();
		}
	} else if (lex.isNum(token)) {
		emitConstant(Number(token.value));
		console.log('numero');

		nextToken();
	} else if (token.type === TOK.CHAR) {
		emitConstant(token.value.charCodeAt(0));
		nextToken();
	} else if (token.type === TOK.IDEN) {
		namedVariable(token.value, 1);

	} else {
		throwError(error.NOT_NUMBER);
		return;
	}
}

function expr_string(type) {
	console.log('expr_string');
	termino_alfa(type);
	while (token.type === TOK.SUM) {
		nextToken();
		termino_alfa(type);
		emitByte(OP.ADD);
	}
}

function termino_alfa(type) {
	if (token.type === TOK.LPAR) {
		nextToken();
		expr_alfa(type);
	} else if (lex.isValue(token)) {
		emitConstant(token.value);
		nextToken();
	} else if (token.type === TOK.IDEN) {
		namedVariable(token.value, 2);
	} else { throwError(error.NOT_ALPHA); return; }
}

function expr_bool() {
	console.log('expr_bool');
	parte_bool();
	while (token.type === TOK.OR || token.type === TOK.AND) {
		nextToken();
		parte_bool();
	}
}

function parte_bool() {

	termino_bool();

	while (lex.isCompOp(token)) {
		console.log(token.value);

		let op = token.type;
		nextToken();
		termino_bool();

		switch (op) {
			case TOK.EQUAL: emitByte(OP.EQUAL); break;
			case TOK.LESS: emitByte(OP.LESS); break;
			case TOK.LESSEQ: emitByte(OP.LESS_EQ); break;
			case TOK.GREAT: emitByte(OP.GREATER); break;
			case TOK.GREATEQ: emitByte(OP.GREATER_EQR); break;
		}
	}
}

function termino_bool() {
	let notFlag = false
	if (token.type === TOK.NOT) {
		notFlag = true;
		nextToken();
	}

	if (token.type === TOK.LPAR) {
		nextToken();
		expr_bool();
		if (token.type === TOK.RPAR) {

		} else { throwError(error.NOT_RPAR); return }
	} else if (lex.isBool(token)) {
		if (token.type === TOK.TRUE) emitByte(OP.TRUE);
		else emitByte(OP.FALSE);
		nextToken();
	} else if (token.type === TOK.IDEN) {
		if (!namedVariable(token.value, 3)) expresion();
	} else {
		console.log('hola');

		expresion();

	}
	if (notFlag) emitByte(OP.NOT);
}

function print_instr() {
	expresion();
	emitByte(OP.PRINT);
}

function if_instr() {
	console.log('if instruction');
	if (token.type !== TOK.LPAR) { throwError(error.NOT_LPAR); return }
	nextToken();

	expr_bool();
	if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	sincronizar();

	bloque();
	while (token.type === TOK.ELIF) {

	}

	if (token.type === TOK.ELSE) {

	}
}

function for_instr() {
	console.log('for instruction');

	if (token.type !== TOK.LPAR) { throwError(error.NOT_LPAR); return }
	nextToken();

	simple_instr();
	if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	sincronizar();

	expr_bool();
	if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	sincronizar();

	simple_instr();

	if (token.type !== TOK.RPAR) { throwError(error.NOT_RPAR); return }
	nextToken();

	bloque();
}

function nextToken() {
	token = tokenList[++ij];
	console.log(token);

}

function peek(offset) {
	return tokenList[ij + offset];
}

function sincronizar() {
	console.log('sync...');
	//nextToken();
	while (token.type !== TOK.END) {
		if (peek(-1).type === TOK.SEMI) {
			console.log('estabilizado por semi: ' + token.value);
			return;
		}
		switch (token.type) {
			case TOK.RCURL:
			case TOK.FUN:
			case TOK.TYPE_INTEGER: case TOK.TYPE_FLOAT: case TOK.TYPE_STRING: case TOK.TYPE_CHAR: case TOK.TYPE_BOOL:
			case TOK.FOR:
			case TOK.IF:
			case TOK.WHILE:
			case TOK.PRINT:
				console.log('estabilizado: ' + token.value);
				return;
		}
		nextToken();
	}
}

function throwError(id, idType, exprType) {
	err.throwError(token, id, idType, exprType);
}

function emitConstant(value) {
	let address = makeConstant(value);
	if (address < 256) emitBytes(OP.CONSTANT, address);
	else emit3Bytes(OP.LONG_CONSTANT, address);
}
function makeConstant(value) {
	return bytecode.addConstant(value);
}

function namedVariable(name, type) {
	//var s = Symbol.lookup(name);
	if (resolveVar(name) >= 0) {
		s = compiler.vars[resolveVar(name)];

		switch (type) {
			case 1:
				if (!lex.isNum(s)) throwError(error.BAD_VAR_TYPE, s.type, type);
				break;
			case 2:
				if (!lex.isAlpha(s)) throwError(error.BAD_VAR_TYPE, s.type, type);
				break;
			case 3:
				if (!lex.isBool(s)) return false;//throwError(error.BAD_VAR_TYPE, s.type, type);
			default:
				break;
		}
		let slot = resolveVar(name);
		if (slot < 256) emitBytes(OP.GET_VAR, slot);
		else emit3Bytes(OP.LONG_GET_VAR, slot);
	} else {
		throwError(error.UNDEFINED);
	}
	nextToken();
	return true;
}

function resolveVar(name, check) {
	for (let i = compiler.varCount - 1; i >= 0; i--) {
		let local = compiler.vars[i];
		if (name === local.name) {
			if (!check && local.depth == -1) {
				throwError(error.VAR_INIT);
			}
			return i;
		}
	}

	return -1;
}

function emitByte(byte) {
	bytecode.write(byte, token.line);
}

function emitBytes(byte1, byte2) {
	bytecode.write(byte1, token.line);
	bytecode.write(byte2, token.line);
}

function emit3Bytes(byte1, byte23) {
	bytecode.write(byte1, token.line);
	bytecode.write(byte23 >> 8, token.line);
	bytecode.write(byte23, token.line);
}
