const lex = require('../lexico/lexico').utils;
const TOK = lex.types;

const err = require('./errores');
const error = err.errorType;

const OP = require('../vm/opCodes');
const Bytecode = require('../vm/bytecode');


let tokenList;
let token = lex.emptyToken(0, 0);
let ij;

let symbols = {
	vars: [],
	varCount: 0,
	scopeDepth: 0,
	funVarSlot: 0,
};

let isFun = false;
let funType = 0;

let bytecode = new Bytecode();

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
	while (token && token.type !== TOK.END) {

		instruccion();
	}
	if (token.type === TOK.END);
	else throwError(error.NOT_END);
}
function beginScope() {
	++symbols.scopeDepth;
}

function endScope() {
	--symbols.scopeDepth;
	let toPOP = 0;
	while (symbols.varCount > 0 && symbols.vars[symbols.varCount - 1].depth > symbols.scopeDepth) {
		++toPOP;
		symbols.vars.pop();
		--symbols.varCount;
	}

	if (toPOP > 1) emitBytes(OP.POP_N, makeConstant(toPOP));
	else if (toPOP === 1) emitByte(OP.POP);

}

function bloque() {
	if (token.type === TOK.LCURL) nextToken();
	else { throwError(error.NOT_LCURL); sincronizarInicio(); }
	while (token.type !== TOK.RCURL) {

		instruccion();
	}
	nextToken();
}

function instruccion() {
	if (token.type === TOK.FUN) {
		nextToken();
		if (token.type !== TOK.IDEN) {
			throwError(error.NOT_IDEN);
		}
		declaracionFuncion();
	} else if (token.type === TOK.IF) {
		nextToken();
		if_instr();
	} else if (token.type === TOK.FOR) {
		nextToken();
		for_instr();
	} else if (token.type === TOK.WHILE) {
		nextToken();
		while_instr();
	} else if (token.type === TOK.DO) {
		nextToken();
		dowhile_instr();
		if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	} else if (token.type === TOK.LCURL) {
		beginScope();
		bloque();
		endScope();
	} else {
		simple_instr();
		if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	}
	sincronizarInicio();
}
function simple_instr() {
	if (token.type === TOK.IDEN) {

		let tokCache = token;
		let v = isPreDef(token);
		if (!v) v = resolveVar(token.value);
		if (v < 0) {
			throwError(error.UNDEFINED);
			sincronizar2([TOK.SEMI, TOK.RPAR]);
			return;
		}
		if (peek(1).type === TOK.ASIGN) {
			nextToken();
			asignacion(v);
			asignVar(v);
		} else if (peek(1).type === TOK.LPAR) {
			namedVariable(tokCache.value, 0);
			if (predefType) emitByte(OP.POP);
		} else if (peek(1).type === TOK.LBRACKET) {
			nextToken();
			nextToken();
			expresion(9);
			if (token.type !== TOK.RBRACKET) {
				throwError(error.NOT_RBRACKET);
				return;
			}
			nextToken();
			if (token.type === TOK.ASIGN) {
				asignacion(v);
				asignVar(v);
			}
		} else if (peek(1).type === TOK.SEMI) {
			nextToken();
		} else {
			throwError(error.NOT_SEMI);
			nextToken();
		}
	} else if (lex.isTypeTok(token)) {
		declaracion();
	} else if (token.type === TOK.PRINT) {
		nextToken();
		expresion(11);
		emitByte(OP.PRINT);
	} else if (token.type === TOK.READ) {
		read_instr();
	} else if (token.type === TOK.RETURN) {
		if (!isFun) {
			throwError(error.RET_OUTSIDE);
			return;
		} else nextToken();
		if (funType) {

			expresion(funType);
			emitByte(OP.SET_RETURN);
			emitReturn(OP.RETURN_VALUE);
		} else {
			if (peek(1).type !== TOK.SEMI) {
				throwError(error.NOT_EMPTY_RETURN);
				sincronizar2([TOK.SEMI, TOK.RCURL]);
			}
			emitReturn(OP.RETURN);
		}
	}
}

function declaracion(single) {
	var typeCache = token.type;
	let idenTok;

	do {
		nextToken();
		if (token.type === TOK.IDEN) {
			let v = declareVar(typeCache);
			emptyVar(typeCache);
			emitBytes(OP.DEFINE_VAR, v);
			idenTok = token;

			nextToken();
			if (token.type === TOK.LBRACKET) {
				nextToken();
				symbols.vars[v].isArray = true;
				if (token.type !== TOK.RBRACKET) {
					expresion(9);
				}
				if (token.type !== TOK.RBRACKET) {
					throwError(error.NOT_RBRACKET);
				}
				emptyVar(typeCache);
				nextToken();
				if (token.type !== TOK.SEMI) {
					throwError(error.NOT_SEMI);
				}
			}
			else if (token.type === TOK.ASIGN) asignacion(v);
			else emptyVar(typeCache);
			defineVar(v);

		} else { throwError(error.NOT_IDEN); return }
		if (single) break;
	} while (token.type === TOK.COMMA);
}

function asignacion(v) {
	nextToken();
	expresion(symbols.vars[v].type);
}

function expresion(type) {
	var tok = { INTEGER: 9, FLOAT: 10, STRING: 11, CHAR: 12, BOOL: 13, };
	if (!type) {
		let offset = 0;
		let tokCache = peek(offset++);
		while (tokCache) {

			if (tokCache.type === TOK.IDEN) {
				let v = isPreDef(tokCache);
				if (v) { type = predefType(v); break }
				else v = resolveVar(tokCache.value);
				if (v < 0) {
					throwError(error.UNDEFINED);
					nextToken();
					return;
				} else if (symbols.vars[v].isFun && !symbols.vars[v].type) {
					throwError(error.VOID_FUNCTION);
					nextToken();
					return;
				} else { type = symbols.vars[v].type; break }
			}
			else if (lex.isValue(tokCache)) {
				type = tokCache.type;
				break;
			}
			else if (tokCache.type == TOK.SEMI || tokCache.type == TOK.RPAR)
				tokCache = peek(offset++);
		}
	}
	switch (type) {
		case tok.INTEGER:
			expr_num(type);
			//to int
			break;
		case tok.FLOAT:
			expr_num(type);
			break;
		case tok.CHAR:
			expr_alpha(type);
			//to char
			break;
		case tok.STRING:
			expr_alpha(type);
			break;
		case tok.BOOL: case 14: case 15:
			expr_bool(type);
			break;
		default:

			break;
	}
}

function expr_num(type) {
	factor(type);
	while (token.type === TOK.SUM || token.type === TOK.SUB) {
		let op = token.type;
		nextToken();
		factor(type);
		switch (op) {
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
		let op = token.type;
		nextToken();
		potencia(type);
		switch (op) {
			case TOK.MUL:
				emitByte(OP.MULTIPLY);
				break;
			case TOK.DIV:
				emitByte(OP.DIVIDE);
				break;
			case TOK.MOD:
				emitByte(OP.MOD);
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
	let negFlag = false;
	if (token.type === TOK.SUB) {
		negFlag = true;
		nextToken();
	}
	if (token.type === TOK.LPAR) {
		nextToken();
		expr_num(type);
		if (token.type !== TOK.RPAR) {
			throwError(error.NOT_RPAR);
		} else nextToken();

	} else if (lex.isNum(token)) {
		emitConstant(Number(token.value));

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
	if (negFlag) emitByte(OP.NEGATE);
}

function expr_alpha(type) {
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
		expr_alpha(type);
		if (token.type !== TOK.RPAR) {
			throwError(error.NOT_RPAR);
		} else nextToken();
	} else if (lex.isValue(token)) {
		emitConstant(token.value);
		nextToken();
	} else if (token.type === TOK.IDEN) {
		namedVariable(token.value, 2);
	} else { throwError(error.NOT_ALPHA); return; }
}

function expr_bool() {
	parte_bool();
	while (token.type === TOK.OR || token.type === TOK.AND) {
		let op = token.type;
		nextToken();
		parte_bool();
		switch (op) {
			case TOK.OR:
				emitByte(OP.OR);
				break;
			case TOK.AND:
				emitByte(OP.AND);
				break;
		}
	}
}

function parte_bool() {
	termino_bool();
	while (lex.isCompOp(token)) {
		let op = token.type;
		nextToken();
		termino_bool();

		switch (op) {
			case TOK.LESS: emitByte(OP.LESS); break;
			case TOK.LESSEQ: emitByte(OP.LESS_EQ); break;
			case TOK.EQUAL: emitByte(OP.EQUAL); break;
			case TOK.UNEQUAL: emitByte(OP.UNEQUAL); break;
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
		if (token.type !== TOK.RPAR) { throwError(error.NOT_RPAR); return }
		nextToken();
	} else if (lex.isBool(token)) {
		if (token.type === TOK.TRUE) emitByte(OP.TRUE);
		else emitByte(OP.FALSE);
		nextToken();
	} /*else if (token.type === TOK.IDEN) {
		namedVariable(token.value, 0);
	}*/ else {
		expresion();
	}
	if (notFlag) emitByte(OP.NOT);
}

function declaracionFuncion() {
	symbols.funVarCount = 0;
	let c = declareFun();
	emitByte(OP.ZERO);
	emitBytes(OP.DEFINE_VAR, c);
	symbols.funVarSlot = c + 1;
	emitConstant(bytecode.count + 7);
	defineVar(c);

	let funJump = emitJump(OP.JUMP);

	nextToken();
	beginScope();
	isFun = true;
	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	else nextToken();

	let params = [];

	while (lex.isTypeTok(token)) {
		let typeCache = token.type;
		params.push(lex.getType(typeCache));
		nextToken();
		if (token.type === TOK.IDEN) {
			let v = declareVar(typeCache);
			emitBytes(OP.DEFINE_PARAM, 0);
			nextToken();
			if (token.type === TOK.LBRACKET) {
				symbols.vars[v].isArray = true;
				nextToken();
				if (token.type !== TOK.RBRACKET) {
					throwError(error.NOT_RBRACKET); return;
				} nextToken();
			}
			symbols.vars[v].depth = symbols.scopeDepth;
		}
		//declaracion(true);
		if (token.type !== TOK.COMMA) break;
		nextToken();
	}
	symbols.vars[c].params = params;
	if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
	else nextToken();

	if (token.type !== TOK.ARROW) { throwError(error.NOT_ARROW); }
	else nextToken();


	if (lex.isTypeTok(token)) {
		funType = symbols.vars[c].type = lex.getType(token.type);
		nextToken();
		if (token.type === TOK.LBRACKET) {
			symbols.vars[c].isArray = true;
			nextToken();
			if (token.type !== TOK.RBRACKET) {
				throwError(error.NOT_RBRACKET); return;
			}
			nextToken();
		}
	} else if (token.type === TOK.VOID) {
		funType = symbols.vars[c].type = 0;
		nextToken();
	} else { throwError(error.NOT_TYPE); return }
	bloque();


	if (funType) {
		emptyVar(funType);
		emitByte(OP.SET_RETURN);
		emitReturn(OP.RETURN_VALUE);
	} else { emitReturn(OP.RETURN) }
	endScope();
	isFun = false;
	funType = false;
	patchJump(funJump)
}

function if_instr() {
	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	else nextToken();

	expr_bool();
	if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
	else nextToken();

	let thenJump = emitJump(OP.JUMP_IF_FALSE);

	beginScope();
	bloque();
	endScope();
	let elseJumps = [];
	elseJumps.push(emitJump(OP.JUMP));

	patchJump(thenJump);

	while (token.type === TOK.ELIF) {
		nextToken();
		if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
		else nextToken();

		expr_bool();
		if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
		else nextToken();

		let thenJump = emitJump(OP.JUMP_IF_FALSE);

		beginScope();
		bloque();
		endScope();
		elseJumps.push(emitJump(OP.JUMP));

		patchJump(thenJump);
	}

	if (token.type === TOK.ELSE) {
		nextToken();
		beginScope();
		bloque();
		endScope();
	}
	for (const jump of elseJumps) {
		patchJump(jump);
	}
}

function for_instr() {
	beginScope();
	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	nextToken();

	simple_instr();
	if (token.type !== TOK.SEMI) throwError(error.NOT_SEMI);
	nextToken();

	let loopStart = bytecode.count;

	let exitJump = -1;
	if (token.type !== TOK.SEMI) {
		expr_bool();
		exitJump = emitJump(OP.JUMP_IF_FALSE);
	}
	nextToken();

	if (token.type !== TOK.RPAR) {
		let bodyJump = emitJump(OP.JUMP);

		let incrementStart = bytecode.count;
		simple_instr();
		if (token.type !== TOK.RPAR) {
			throwError(error.NOT_RPAR);
			sincronizarInicio()
		} else nextToken();
		emitLoop(loopStart);
		loopStart = incrementStart;
		patchJump(bodyJump);
	} else nextToken();

	bloque();
	emitLoop(loopStart);
	if (exitJump !== -1) {
		patchJump(exitJump);
	}
	endScope();
}

function while_instr() {
	let loopStart = bytecode.count;
	if (token.type !== TOK.LPAR) { throwError(error.NOT_LPAR); return }
	nextToken();
	expr_bool();
	if (token.type !== TOK.RPAR) { throwError(error.NOT_RPAR); return }
	nextToken();

	let exitJump = emitJump(OP.JUMP_IF_FALSE);
	beginScope();
	bloque();
	endScope();

	emitLoop(loopStart);

	patchJump(exitJump);
}

function dowhile_instr() {
	let loopStart = bytecode.count;

	beginScope();
	bloque();
	endScope();

	if (token.type !== TOK.WHILE) throwError(error.NOT_LPAR);
	nextToken();

	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	nextToken();
	expr_bool();
	if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
	nextToken();

	let exitJump = emitJump(OP.JUMP_IF_FALSE);
	emitLoop(loopStart);

	patchJump(exitJump);
}

function read_instr() {
	nextToken();
	if (token.type === TOK.IDEN) {
		let name = token.value;
		nextToken();
		if (token.type === TOK.LBRACKET) {
			nextToken()
			expresion(9);
			if (token.type !== TOK.RBRACKET) { throwError(error.NOT_RBRACKET); return }
			nextToken();
		}
		//int:9, float:10, string:11, char:12, bool:13
		let slot = resolveVar(name);
		emitConstant(name);
		emitBytes(OP.READ, symbols.vars[slot].type);
		asignVar(slot);
	}
}

function nextToken() {
	token = tokenList[++ij];
	console.log(token);
}

function peek(offset) {
	return tokenList[ij + offset];
}

function sincronizarInicio() {
	while (token) {
		switch (token.type) {
			case TOK.TYPE_INTEGER: case TOK.TYPE_FLOAT: case TOK.TYPE_STRING: case TOK.TYPE_CHAR: case TOK.TYPE_BOOL:
			case TOK.IDEN: case TOK.IF: case TOK.FOR: case TOK.WHILE: case TOK.DO: case TOK.RETURN: case TOK.LCURL:
			case TOK.FUN: case TOK.PRINT: case TOK.READ: case TOK.END: case TOK.RCURL: case TOK.END:
				return;
		}
		nextToken();
	}
}

function sincronizar2(set) {
	while (token) {
		if (set.includes(token.type)) {
			return;
		}
		nextToken();
	}
}

function isPreDef(token) {
	let preDefs = ['',/*1*/ 'write', 'append', 'read', /*4*/'sqrt', 'abs', 'fact', /*7*/ 'ln', 'sen',
		'cos', 'tan', 'asen', 'acos', 'atan', 'floor', 'ceiling', 'round', /*17*/ 'length', 'split',
		'substring','at',/*21*/'size', /*22*/'tostring'];

	let size = preDefs.length;
	for (let i = 1; i < size; ++i) {
		if (token.value === preDefs[i]) {
			return i;
		}
	}
}

function predefType(slot) {
	switch (slot) {
		case 5: case 6: case 14: case 15: case 16: case 17: case 21:
			return 9;
		case 4: case 7: case 8: case 9: case 10: case 11: case 12: case 13:
			return 10;
		case 3: case 18: case 19: case 22:
			return 11;
		case 20:
			return 12;
		default:
			return 0;
	}
}
function predefParams(slot) {
	if (slot <= 2) {
		return [11, 11];
	} else if (slot === 3) {
		return [11, 9];
	} else if (slot <= 6) {
		return [9];
	} else if (slot <= 16) {
		return [10];
	} else if (slot === 17) {
		return [11];
	} else if (slot === 18) {
		return [11, 12];
	} else if (slot === 19) {
		return [11, 9, 9];
	} else if (slot === 20) {
		return [11, 9];
	} else if (slot <= 22) {
		return [0];
	}
}
function throwError(id, idType, exprType) {
	bytecode.setHasError();
	bytecode.errors.push(err.throwError(token, id, idType, exprType));
}

function namedVariable(name, type) {
	let slot = isPreDef(token);
	let vari;
	if (slot) {
		vari = { name: token.value, depth: -1, type: predefType(slot), isFun: true, params: predefParams(slot), predef: true }
		if (slot === 17) vari.isArray = true;
	} else {
		slot = resolveVar(name);
		vari = symbols.vars[slot];
	}
	if (slot < 0) {
		throwError(error.UNDEFINED);
		nextToken();
	} else {
		if (type) {
			switch (type) {
				case 1:
					if (!lex.isNum(vari)) throwError(error.BAD_VAR_TYPE, vari.type, type);
					break;
				case 2:
					if (!lex.isAlpha(vari)) throwError(error.BAD_VAR_TYPE, vari.type, type);
					break;
				case 3:
					if (!lex.isBool(vari)) throwError(error.BAD_VAR_TYPE, s.type, type);
				default:
					break;
			}
		}
		nextToken();
		if (token.type === TOK.LPAR) {
			callFun(vari, slot);
		}
		else if (token.type === TOK.LBRACKET) {
			if (!symbols.vars[slot].isArray) {
				throwError(error.NOT_ARRAY); return
			}
			nextToken();
			expresion(9);
			if (token.type !== TOK.RBRACKET) { throwError(error.NOT_RBRACKET); return }
			if (isFun && slot >= symbols.funVarSlot) {
				slot = slot - symbols.funVarSlot;
				if (slot < 256) emitBytes(OP.GET_CONTENT_FUN, slot);
				else emit3Bytes(OP.LONG_GET_CONTENT_FUN, slot);
			} else {
				if (slot < 256) emitBytes(OP.GET_CONTENT, slot);
				else emit3Bytes(OP.LONG_GET_CONTENT, slot);
			}
			nextToken();
		} else {
			if (isFun && slot >= symbols.funVarSlot) {
				slot = slot - symbols.funVarSlot;
				if (slot < 256) emitBytes(OP.GET_VAR_FUN, slot);
				else emit3Bytes(OP.LONG_GET_VAR_FUN, slot);
			} else {
				if (slot < 256) emitBytes(OP.GET_VAR, slot);
				else emit3Bytes(OP.LONG_GET_VAR, slot);
			}
		}
	}
}

function declareVar(type) {
	let r = resolveVar(token.value);
	if (r >= 0 && symbols.vars[r].scope === symbols.scopeDepth) throwError(error.VAR_EXISTS);
	else {
		symbols.vars.push({ name: token.value, depth: -1, type: lex.getType(type) });
		emitConstant(token.value);
		return symbols.varCount++;
	}
}

function declareFun() {
	let r = resolveVar(token.value);
	if (r >= 0 && symbols.vars[r].scope === symbols.scopeDepth) throwError(error.VAR_EXISTS);
	else {
		symbols.vars.push({ name: token.value, depth: -1, type: 0, isFun: true, params: [] });
		emitConstant(token.value);
		return symbols.varCount++;
	}
}

function emptyVar(type) {
	switch (type) {
		case TOK.TYPE_INTEGER: case TOK.TYPE_FLOAT:
			emitByte(OP.ZERO);
			break;
		case TOK.TYPE_STRING: case TOK.TYPE_CHAR:
			emitByte(OP.EMPTY_STRING);
			break;
		case TOK.TYPE_BOOL:
			emitByte(OP.FALSE);
			break;
	}
}

function callFun(funcion, slot) {
	if (!funcion.isFun) {
		throwError(error.NOT_FUN);//NOT_FUN
		return;
	}
	nextToken();

	let n = funcion.params.length;
	for (let i = 0; i < n; ++i) {
		if (token.type === TOK.RPAR) throwError(error.NOT_PARAM);
		expresion(funcion.params[i]);
		if (token.type === TOK.COMMA) nextToken();
		else if (i !== (n - 1)) throwError(error.NOT_COMMA);
	}
	if (token.type !== TOK.RPAR) {
		throwError(error.NOT_RPAR);
		sincronizar2([TOK.SEMI]);
		return;
	}
	else nextToken();
	if (funcion.predef) {
		emitConstant(slot);
		emitBytes(OP.PREDEF, funcion.params.length)
	} else {
		if (slot < 256) emitBytes(OP.GET_VAR, slot);
		else emit3Bytes(OP.LONG_GET_VAR, slot);
		emitBytes(OP.CALL, funcion.params.length);
	}
	for (let i = 0; i < n; ++i) {
	}
}

function defineVar(slot) {
	symbols.vars[slot].depth = symbols.scopeDepth;
	if (symbols.vars[slot].isArray) asignArray(slot);
	else asignVar(slot);
	//emitConstant(symbols.vars[slot].name);
}


function asignVar(slot) {
	if (symbols.vars[slot].isArray) {
		if (isFun && symbols.vars[slot].scope >= symbols.scopeDepth) {
			slot = slot - symbols.funVarSlot;
			if (slot < 256) emitBytes(OP.SET_CONTENT_FUN, slot);
			else emit3Bytes(OP.LONG_SET_CONTENT_FUN, slot);
		} else {
			if (slot < 256) emitBytes(OP.SET_CONTENT, slot);
			else emit3Bytes(OP.LONG_SET_CONTENT, slot);
		}
	}
	else {
		if (isFun && symbols.vars[slot].scope >= symbols.scopeDepth) {
			slot = slot - symbols.funVarSlot;
			if (slot < 256) emitBytes(OP.SET_VAR_FUN, slot);
			else emit3Bytes(OP.LONG_SET_VAR_FUN, slot);
		} else {
			if (slot < 256) emitBytes(OP.SET_VAR, slot);
			else emit3Bytes(OP.LONG_SET_VAR, slot);
		}
	}
}

function asignArray(slot) {
	if (isFun && symbols.vars[slot].scope >= symbols.scopeDepth) {
		slot = slot - symbols.funVarSlot;
		if (slot < 256) emitBytes(OP.SET_ARRAY_FUN, slot);
		else emit3Bytes(OP.LONG_SET_ARRAY_FUN, slot);
	}
	if (slot < 256) emitBytes(OP.SET_ARRAY, slot);
	else emit3Bytes(OP.LONG_SET_ARRAY, slot);
}

function resolveVar(name) {
	for (let i = symbols.varCount - 1; i >= 0; i--) {
		let local = symbols.vars[i];
		if (name === local.name) {
			if (local.depth === -1) {
				throwError(error.VAR_INIT);
			}
			return i;
		}
	}
	return -1;
}

function emitJump(byte) {
	emitByte(byte);
	emitByte(0);
	emitByte(0);
	return bytecode.count - 2;
}

function emitLoop(loopStart) {
	emitByte(OP.LOOP);

	let offset = bytecode.count - loopStart + 2;
	if (offset > 65535) throwError(error.TOO_MUCH_CODE);

	emitByte(offset >> 8);
	emitByte(offset);
}

function patchJump(offset) {
	// -2 to adjust for the bytecode for the jump offset itself.
	let jump = bytecode.count - 2 - offset;

	if (jump > 65535) {
		throwWrror(error.TOO_MUCH_CODE);
	}

	bytecode.code[offset] = (jump >> 8);
	bytecode.code[offset + 1] = jump;
}

function emitReturn(byte) {
	let toPOP = 0;
	let count = symbols.varCount;
	while (symbols.vars[--count].depth > symbols.scopeDepth - 1) {
		++toPOP;
	}

	if (toPOP > 1) emitBytes(OP.POP_N, makeConstant(toPOP));
	else if (toPOP === 1) emitByte(OP.POP);
	bytecode.write(byte, token.line);
}

function emitConstant(value) {
	let address = makeConstant(value);
	if (address < 256) emitBytes(OP.CONSTANT, address);
	else emit3Bytes(OP.LONG_CONSTANT, address);
}
function makeConstant(value) {
	return bytecode.addConstant(value);
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
