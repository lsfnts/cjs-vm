const lex = require('../lexico/lexico').utils;
const tokT = lex.types;
const err = require('./errores');

const symbol = require('./symbols');

const throwError = err.throwError;
const errorType = err.errorType;

var tokens;
var token = lex.empyToken(0, 0);
var i;

module.exports = {
	parse: function (tokenIn) {
		tokens = tokenIn;
		i = -1;
		nextToken();
		programa();
	}
}

function programa() {

	if (token.type !== tokT.TOKBEGIN) {
		throwError(token, errorType.NOT_BEGIN);
	}
	bloque();
	if (token.type === tokT.TOKEND) {

	}
}

function bloque() {
	if (token.type === tokT.TOKLCURL || token.type === tokT.TOKBEGIN) {
		nextToken();
		while (token.type !== tokT.TOKRCURL && token.type !== tokT.TOKEND) {
			instruccion();
		}
	} else throwError(token, errorType.NOT_LCURL);
}

function instruccion() {
	if (token.type === tokT.TOKIDEN) {
		var tokCache = token;
		nextToken();
		if (token.type === tokT.ASSIGN) {
			asignacion(tokCache);
		} else if (token.type === tokT.TOKLPAR) {
			//quiere ser funcion
		}
		if (token.type === tokT.TOKSEMI) {

			nextToken()

		} else {
			throwError(token, errorType.NOT_SEMI);
		}
	} else if (lex.isTypeTok(token.type)) {
		declaracion();
		if (token.type === tokT.TOKSEMI) {
			nextToken()
		} else {
			throwError(token, errorType.NOT_SEMI);
		}
	} else if (token.type === tokT.TOKFUN) {
		nextToken();

	} else if (token.type === tokT.TOKIF) {
		nextToken();
		if_instr();
	} else if (token.type === tokT.TOKFOR) {
		nextToken();
		for_instr();
	} else if (token.type === tokT.TOKDO) {
		nextToken();
		dowhile_instr();
	}
}

function declaracion() {
	var tokCache = token;
	nextToken();
	if (token.type === tokT.TOKIDEN) {
		symbol.insert(token.value, lex.getValueType(tokCache.type));
		var tokCache2 = token;
		nextToken();
		if (token.type === tokT.ASSIGN) {
			asignacion(tokCache2);
		} else if (token.type === tokT.TOKSEMI) {
			return
		}
		else {
			throwError(token, errorType.NOT_SEMI);
		}
	} else {
		throwError(token, errorType.NOT_IDEN);
	}

	while (token.type === tokT.TOKCOMMA) {
		console.log('mas vars');
		nextToken();
		if (token.type === tokT.TOKIDEN) {
			symbol.insert(token.value, lex.getValueType(tokCache.type));
			var tokCache2 = token;
			nextToken();
			if (token.type === tokT.ASSIGN) {
				asignacion(tokCache2);
			}
		}
	}
	if (token.type === tokT.TOKSEMI) {
		return
	} else {
		throwError(token, errorType.NOT_SEMI);
	}

}

function asignacion(tokIden) {
	console.log(tokIden.value);
	var s = symbol.lookup(tokIden.value)
	if (!s) {
		throwError(tokIden, errorType.UNDEFINED);
	}
	nextToken();
	expresion();
}

function expresion() {
	var expr = { num: 1, alfa: 2, bool: 3 }
	if (token.type === tokT.TOKLPAR) {
		//llevar cuenta?
		expresion();
	} else {
		switch (token.type) {
			case tokT.INTEGER: case tokT.FLOAT: case tokT.UNIPLUS: case tokT.UNINEG:
				expr_num();
				return 1;
			case tokT.STRING: case tokT.CHAR:
				expr_alfa();
				return 2;
			case tokT.TOKTRUE: case tokT.TOKFALSE: case tokT.NOT: case tokT.BOOL:
				expr_bool();
				return 3;
				break;
			case tokT.TOKIDEN:
				//checar tipo
				expresion()
			default:
				break;
		}
	}
}

function expr_num() {
	factor();
	while (token.type === tokT.SUM || token.type === tokT.SUB) {
		nextToken();
		factor();
	}
}

function factor() {
	potencia();
	while (token.type === tokT.MUL || token.type === tokT.DIV || token.type === tokT.MOD) {
		nextToken();
		potencia();
	}
}

function potencia() {
	numero();
	while (token.type === tokT.POW) {
		nextToken();
		numero();
	}
}

function numero() {
	if (token.type === tokT.TOKLPAR) {
		nextToken();
		expr_num();
	} else if (lex.isNum(token)) {
		nextToken();
	} else if (token.type === tokT.TOKIDEN) {
		var s = symbol.lookup(token.value);

		if (s) {
			if (lex.isNum(s.type)) {
				s.value = token.value;
			} else {

				throwError(token, errorType.BAD_TYPE, s.type, token.type)
			}
		} else {
			throwError(token, errorType.UNDEFINED)
		}
		nextToken();
	} else {
		throwError(token, errorType.NOT_NUMBER);
	}

}

function expr_alfa() {
	termino_alfa();
	while (token.type === tokT.SUM) {
		termino_alfa();
	}
}

function termino_alfa() {
	if (token.type === tokT.TOKLPAR) {
		nextToken();
		expr_alfa();
	} else if (lex.isAlpha) {
		nextToken();
	} else if (token.type === tokT.TOKIDEN) {
		var s = symbol.lookup(tokIden.value);

		if (s) {
			if (lex.isAlpha(s.type)) {
				s.value = token.value;
			} else {
				throwError(token, errorType.BAD_TYPE, s.type, token.type)
			}
		} else {
			throwError(token, errorType.UNDEFINED)
		}
		nextToken();
	} else { throwError(token, errorType.NOT_ALPHA); }
}

function expr_bool() {
	if (token.type === tokT.NOT) {
		nextToken();
	}
	termino_bool();
	while (token.type === tokT.TOKOR || token.type === tokT.TOKAND) {
		termino_bool();
	}
}

function termino_bool() {
	if (token.type === tokT.TOKLPAR) {
		nextToken();
		expr_num();
	} else if (lex.isBool(token)) {
		nextToken();
	} else if (token.type === tokT.TOKIDEN) {
		var s = symbol.lookup(tokIden.value);

		if (s) {
			if (lex.isBool(s.type)) {
				s.value = token.value;
			} else {
				throwError(token, errorType.BAD_TYPE, s.type, token.type)
			}
		} else {
			throwError(token, errorType.UNDEFINED)
		}
		nextToken();
	} else {
		throwError(token, errorType.NOT_BOOL);
	}
}

function if_instr() {
	expr_bool();
	bloque();
	while (token.type === tokT.TOKELIF) {
		nextToken();
		bloque();
	}
	if (token.type === tokT.TOKELSE) {
		nextToken();
		bloque;
	}
}

function for_instr() {
	if (token.type !== tokT.TOKLPAR) {
		throwError(token, errorType.NOT_LPAR)
	}
}

function while_instr() {
	if (token.type !== tokT.TOKLPAR) {
		throwError(token, errorType.NOT_LPAR)
	}
	expr_bool();
	bloque();
}

function dowhile_instr() {
	if (token.type !== tokT.TOKLPAR) {
		throwError(token, errorType.NOT_LPAR)
	}
	expr_bool();
	bloque();
}


function nextToken() {
	token = tokens[++i];
	console.log(token);
}
function nextIs() {
	return token()
}