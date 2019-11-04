//PANIC FLAG

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
	while (token.type !== TOK.END) {

		instruccion();
	}
	if (token.type === TOK.END);
	else throwError(error.NOT_END);
}
function beginScope() {
	console.log(`begining scope`);
	++symbols.scopeDepth;
}

function endScope() {
	console.log(`ending scope`);

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
		sincronizar2([TOK.SEMI]);
	} else if (token.type === TOK.LCURL) {
		beginScope();
		bloque();
		endScope();
	}
	else {
		simple_instr();
		sincronizar2([TOK.SEMI]);
	}
	sincronizarInicio();
}
function simple_instr() {
	if (token.type === TOK.IDEN) {

		let tokCache = token;
		let v = resolveVar(token.value);
		if (v < 0) {

			throwError(error.UNDEFINED);
		}
		nextToken();
		if (token.type === TOK.ASSIGN) {

			asignacion(v);
			asignVar(tokCache.value);

		} else if (token.type === TOK.LPAR) {
			callFun(v);
		}
		else if (token.type === TOK.LBRACKET) {
			//quiere ser array
		} else {
			throwError(error.NOT_ASSIGN);
			return;
		}
	} else if (lex.isTypeTok(token)) {
		declaracion();
	} else if (token.type === TOK.PRINT) {
		nextToken();
		expresion();
		emitByte(OP.PRINT);
	} else if (token.type === TOK.READ) {
		nextToken();
		//read_instr();
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
			if (peek(1) !== TOK.SEMI) {
				throwError(error.NOT_EMPTY_RETURN);
				sincronizar2([TOK.SEMI])
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
			idenTok = token;

			nextToken();
			if (token.type === TOK.ASSIGN) {
				asignacion(v);
				defineVar(v);
			}
			else {
				emitByte(OP.NULL);
				defineVar(v);
			}
		} else { throwError(error.NOT_IDEN); return }
		if (single) break;
	} while (token.type === TOK.COMMA);

}

function asignacion(v) {
	nextToken();
	expresion(symbols.vars[v].type);
}

function expresion(type) {
	var expr = { INTEGER: 9, FLOAT: 10, STRING: 11, CHAR: 12, BOOL: 13, };
	if (!type) {
		let offset = 1;
		let tokenType = token.type;
		while (tokenType === TOK.LPAR) {
			tokenType = peek(offset).type;
		}
		if (tokenType === TOK.IDEN) {
			let v = resolveVar(token.value);
			if (v < 0) {
				throwError(error.UNDEFINED);
				return;
			} else if (symbols.vars[v].isFun && !symbols.vars[v].type) {
				throwError(error.VOID_FUNCTION);
				return;
			}
			tokenType = symbols.vars[resolveVar(token.value)].type;
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

		nextToken();
	} else if (token.type === TOK.CHAR) {
		emitConstant(token.value.charCodeAt(0));
		nextToken();
	} else if (token.type === TOK.IDEN) {
		if (peek(1).type === TOK.LPAR) {
			let v = resolveVar(token.value);
			nextToken();
			if (symbols.vars[v].type) callFun(v);
			else { throwError(error.RETURN_VOID) }
		} else namedVariable(token.value, 1);

	} else {
		throwError(error.NOT_NUMBER);
		return;
	}
}

function expr_string(type) {
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
		if (peek(1).type === TOK.LPAR) {
			let v = resolveVar(token.value);
			nextToken();
			if (symbols.vars[v].type) callFun(v);
			else { throwError(error.RETURN_VOID) }
		}
		else namedVariable(token.value, 2);
	} else { throwError(error.NOT_ALPHA); return; }
}

function expr_bool() {
	parte_bool();
	while (token.type === TOK.OR || token.type === TOK.AND) {
		nextToken();
		parte_bool();
	}
}

function parte_bool() {

	termino_bool();

	while (lex.isCompOp(token)) {

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
		if (peek(1).type === TOK.LPAR) {
			let v = resolveVar(token.value);
			nextToken();
			if (symbols.vars[v].type) callFun(v);
			else { throwError(error.RETURN_VOID) }
		} else if (!namedVariable(token.value, 3)) expresion();
	} else {
		expresion();
	}
	if (notFlag) emitByte(OP.NOT);
}

function declaracionFuncion() {
	symbols.funVarCount = 0;
	let c = declareFun();
	symbols.funVarSlot = c + 1;
	emitConstant(bytecode.count + 7);
	defineVar(c);

	let funJump = emitJump(OP.JUMP);

	nextToken();
	beginScope();
	isFun = true;
	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	else nextToken();

	let params = 0;

	while (lex.isTypeTok(token)) {
		params += 1;
		let typeCache = token.type;
		nextToken();
		if (token.type === TOK.IDEN) {
			let v = declareVar(typeCache);
			
			symbols.vars[v].depth = symbols.scopeDepth;
		}
		nextToken();
		if (token.type !== TOK.COMMA) break;
		nextToken();
	}
	symbols.vars[c].arity = params;
	if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
	else nextToken();

	if (token.type !== TOK.ARROW) { throwError(error.NOT_ARROW); }
	else nextToken();


	if (lex.isTypeTok(token)) {
		funType = symbols.vars[c].type = lex.getType(token.type);
		nextToken();
	} else if (token.type === TOK.VOID) {
		funType = symbols.vars[c].type = 0;
		nextToken();
	}
	bloque();
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
	sincronizar2([TOK.LCURL]);

	let thenJump = emitJump(OP.JUMP_IF_FALSE);
	//emitByte(OP.POP);
	beginScope();
	bloque();
	endScope();
	let elseJump = emitJump(OP.JUMP);

	patchJump(thenJump);
	//emitByte(OP.POP);
	while (token.type === TOK.ELIF) {

	}

	if (token.type === TOK.ELSE) {
		nextToken();
		beginScope();
		bloque();
		endScope();
		patchJump(elseJump);
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
		if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);

		emitLoop(loopStart);
		loopStart = incrementStart;
		patchJump(bodyJump);
	}
	sincronizar2([TOK.RPAR]);
	nextToken();

	sincronizar2([TOK.LCURL]);
	bloque();
	emitLoop(loopStart);
	if (exitJump !== -1) {
		patchJump(exitJump);
	}
	endScope();
}

function while_instr() {
	let loopStart = bytecode.count;
	if (token.type !== TOK.LPAR) throwError(error.NOT_LPAR);
	nextToken();
	expr_bool();
	if (token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
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

function nextToken() {
	token = tokenList[++ij];
	console.log(token);

	//console.log(symbols.vars.map(JSON.stringify));

}

function peek(offset) {
	return tokenList[ij + offset];
}

function sincronizarInicio() {
	while (token.type !== TOK.END) {
		if (peek(-1).type === TOK.SEMI || peek(-1).type === TOK.RCURL) {
			return;
		}
		switch (token.type) {
			case TOK.TYPE_INTEGER: case TOK.TYPE_FLOAT: case TOK.TYPE_STRING: case TOK.TYPE_CHAR: case TOK.TYPE_BOOL:
			case TOK.IDEN: case TOK.IF: case TOK.FOR: case TOK.WHILE: case TOK.DO: case TOK.RETURN: case TOK.LCURL:
			case TOK.FUN: case TOK.PRINT: case TOK.READ:
				return;
		}
		nextToken();
	}
}

function sincronizar2(set) {

	while (token.type !== TOK.END) {
		if (set.includes(token.type)) {
			return;
		}
		nextToken();
	}
}

function throwError(id, idType, exprType) {
	bytecode.setHasError();
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

	let slot = resolveVar(name);
	if (slot >= 0) {
		if (type) {
			switch (type) {
				case 1:
					if (!lex.isNum(symbols.vars[slot])) throwError(error.BAD_VAR_TYPE, s.type, type);
					break;
				case 2:
					if (!lex.isAlpha(symbols.vars[slot])) throwError(error.BAD_VAR_TYPE, s.type, type);
					break;
				case 3:
					if (!lex.isBool(symbols.vars[slot])) return false;//throwError(error.BAD_VAR_TYPE, s.type, type);
				default:
					break;
			}
		}
		if (isFun && slot >= symbols.funVarSlot) {
			slot = slot - symbols.funVarSlot;
			if (slot < 256) emitBytes(OP.GET_VAR_FUN, slot);
			else emit3Bytes(OP.LONG_GET_VAR_FUN, slot);
		} else {
			if (slot < 256) emitBytes(OP.GET_VAR, slot);
			else emit3Bytes(OP.LONG_GET_VAR, slot);
		}
	} else {
		throwError(error.UNDEFINED);
	}
	nextToken();
	return true;
}

function declareVar(type) {
	let r = resolveVar(token.value);
	if (r >= 0 && symbols.vars[r].scope === symbols.scopeDepth) throwError(error.VAR_EXISTS);
	else {
		console.log(`declarando variable: ${token.value}`);

		symbols.vars.push({ name: token.value, depth: -1, type: lex.getType(type) });
		return symbols.varCount++;
	}
}

function declareFun() {
	let r = resolveVar(token.value);
	if (r >= 0 && symbols.vars[r].scope === symbols.scopeDepth) throwError(error.VAR_EXISTS);
	else {
		symbols.vars.push({ name: token.value, depth: -1, type: 0, isFun: true, arity: 0, base: 0 });
		return symbols.varCount++;
	}
}

function callFun(slot) {
	let funcion = symbols.vars[slot];
	if (!funcion.isFun) {
		throwError(error.NOT_FUN);//NOT_FUN
		return;
	}

	let n = funcion.arity;
	while (n-- > 0) {
		nextToken();
		expresion();
		if (n !== 0 && token.type !== TOK.COMMA) throwError(error.NOT_COMMA);
		else if(n === 0 && token.type !== TOK.RPAR) throwError(error.NOT_RPAR);
		
	}
	if (slot < 256) emitBytes(OP.GET_VAR, slot);
	else emit3Bytes(OP.LONG_GET_VAR, slot);
	emitBytes(OP.CALL, funcion.arity);


	nextToken();
}

function defineVar(slot) {
	symbols.vars[slot].depth = symbols.scopeDepth;
	if (isFun) {
		slot = slot - symbols.funVarSlot;
		if (slot < 256) emitBytes(OP.SET_VAR_FUN, slot);
		else emit3Bytes(OP.LONG_SET_VAR_FUN, slot);
	} else {
		if (slot < 256) emitBytes(OP.SET_VAR, slot);
		else emit3Bytes(OP.LONG_SET_VAR, slot);
	}
}


function asignVar(name) {
	let slot = resolveVar(name);

	if (isFun && symbols.vars[slot].scope >= symbols.scopeDepth) {
		slot = slot - symbols.funVarSlot;
		if (slot < 256) emitBytes(OP.SET_VAR_FUN, slot);
		else emit3Bytes(OP.LONG_SET_VAR_FUN, slot);
	}
	if (slot < 256) emitBytes(OP.SET_VAR, slot);
	else emit3Bytes(OP.LONG_SET_VAR, slot);
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
	if (offset > 65535) throeError(error.TOO_MUCH_CODE);

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
