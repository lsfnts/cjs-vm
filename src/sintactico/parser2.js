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
var i;

var bytecode = new Bytecode();

module.exports = {
	parse: function (tokenIn) {

		tokenList = tokenIn;
		i = -1;
		nextToken();
		programa();
		return bytecode;
	}
}

function programa() {
	if (token.type === TOK.BEGIN) nextToken();
	else throwError(error.NOT_BEGIN);
	bloque();
	if (token && token.type === TOK.END);
	else throwError(error.NOT_BEGIN);
}

function bloque() {

	if (token.type === TOK.LCURL || token.type === TOK.BEGIN) nextToken();
	else throwError(error.NOT_LCURL);
	while (token.type !== TOK.RCURL && token.type !== TOK.END) {
		instruccion();
	}
	nextToken();
}

function instruccion() {
	if (token.type === TOK.FUN) {
		nextToken();
		//fun
	} else if (token.type === TOK.IF) {
		nextToken();
		//if_instr();
	} else if (token.type === TOK.FOR) {
		nextToken();
		for_instr();
	} else if (token.type === TOK.DO) {
		nextToken();
		//dowhile_instr();
	}
	else {
		simple_instr();
		sincronizar();
		//if (token.type === TOK.SEMI) {
		//	console.log('next inst');
		//	nextToken();
		//} else throwError(error.NOT_SEMI)
	}
}
function simple_instr() {
	if (token.type === TOK.IDEN) {
		let tokCache = token;
		nextToken();
		if (token.type === TOK.ASSIGN) {
			asignacion(tokCache);
		} else if (token.type === TOK.LPAR) {
			//quiere ser funcion
		} else {
			throwError(error.NOT_ASSIGN);
			return;
		}
	} else if (lex.isTypeTok(token)) {
		declaracion();
	} else if (token.type === TOK.PRINT) {
		nextToken();
		//print_instr();
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
			if (!Symbol.insert(token.value, lex.getType(typeCache))) throwError(error.VAR_EXISTS);
			idenTok = token;
			nextToken();
			if (token.type === TOK.ASSIGN) asignacion(idenTok);
		} else { throwError(error.NOT_IDEN); return }
	} while (token.type === TOK.COMMA);

}

function asignacion(tokIden) {
	console.log('asignacion: ' + tokIden.value);
	let s = Symbol.lookup(tokIden.value);
	if (!s)
		throwError(error.UNDEFINED);
	nextToken();

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
			tokenType = Symbol.lookup(token.value).type;
		}
		switch (tokenType) {
			case TOK.INTEGER: expr_num(expr.INTEGER);
				break;
			case TOK.FLOAT: expr_num(expr.FLOAT);
				break;
			case TOK.STRING: expr_string(expr.STRING);
				break;
			case TOK.CHAR: expr_num(expr.CHAR);
				break;
			case TOK.TRUE: case TOK.FALSE: case TOK.NOT: case TOK.BOOL:
				expr_bool(expr.BOOL);
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
		var s = Symbol.lookup(token.value);

		if (s) {
			if (lex.isNum(s)) {
				//variable
			} else if (token.type === TOK.CHAR) {
				//variable
			} else {
				throwError(NOT_NUMBER);
				return;
			}
			nextToken();
		} else {
			throwError(error.UNDEFINED)
			nextToken();
		}

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
		var s = symbol.lookup(token.value);

		if (s) {
			if (lex.isAlpha(s)) {
				s.value = token.value;
			} else {
				throwError(error.BAD_VAR_TYPE, s.type, type);
			}
		} else {
			throwError(error.UNDEFINED);
		}
		nextToken();
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
			case TOK.LESS: emitByte(OP.LESS); console.log('solo menor');break;
			case TOK.LESSEQ: emitByte(OP.LESS_EQ); console.log('menor o igual');
			break;
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
	}else {
		expresion();
		
	}
	if (notFlag) emitByte(OP.NOT);
}

function for_instr() {
	console.log('for instruction');

	if (token.type !== TOK.LPAR) { throwError(error.NOT_LPAR); return }
	nextToken();

	simple_instr();
	sincronizar()

	expr_bool();
	if (token.type == TOK.SEMI) {
		console.log('segundo');
		nextToken();
	}
	else { throwError(error.NOT_SEMI); return }

	simple_instr(true);
	console.log('tercero');

	if (token.type !== TOK.RPAR) { throwError(error.NOT_RPAR); return }
	nextToken();

	bloque();
}

function nextToken() {
	token = tokenList[++i];
	console.log(token);

}

function peek(offset) {
	return tokenList[i + offset];
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
	emitBytes(OP.CONSTANT, makeConstant(value));
}
function makeConstant(value) {
	let constant = bytecode.addConstant(value);
	if (constant > 256) {
		throwError(token, errorType.TOO_CONSTANTS);
		return 0;
	}

	return constant;
}
function emitByte(byte) {
	bytecode.write(byte, token.line);
}

function emitBytes(byte1, byte2) {
	bytecode.write(byte1, token.line);
	bytecode.write(byte2, token.line);
}
