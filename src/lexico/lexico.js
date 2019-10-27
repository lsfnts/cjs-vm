
const Type = {
	NULL: 0,
	BEGIN: 1,
	END: 2,

	TYPE_INTEGER: 3,
	TYPE_FLOAT: 4,
	TYPE_STRING: 5,
	TYPE_CHAR: 6,
	TYPE_BOOL: 7,

	INTEGER: 8,
	FLOAT: 9,
	STRING: 10,
	CHAR: 11,
	BOOL: 12,
	TRUE: 13,
	FALSE: 14,

	IDEN: 17,
	IF: 18,
	ELIF: 19,
	ELSE: 20,
	FOR: 21,
	WHILE: 22,
	DO: 23,
	RETURN: 24,

	LPAR: 25,
	RPAR: 26,
	SEMI: 27,
	COMMA: 28,
	SINQOUTE: 29,
	DOUQUOTE: 30,
	LCURL: 31,
	RCURL: 32,
	LBRACKET: 33,
	RBRACKET: 34,
	FUN: 35,
	ARROW: 36,
	PRINT: 37,
	READ: 38,

	SUM: 39,
	SUB: 40,
	MUL: 41,
	DIV: 42,
	POW: 43,
	ASSIGN: 44,
	LESS: 45,
	GREAT: 46,
	EQUAL: 47,
	UNEQUAL: 48,
	LESSEQ: 49,
	GREATEQ: 50,
	OR: 15,
	AND: 16,
	NOT: 51,
	MOD: 52
}

module.exports.gens = {
	specialSymbol: function (c, line) {
		if (!specialSymbolTok[0]) initializeSpecialSymbols();
		return { type: specialSymbolTok[c.charCodeAt(0)], value: c, line: line }
	},
	isReservedWord: function (value) {
		return binarySearchResWord(value);
	},
	reservedWord: function (id, line) {
		return { type: resWordTok[id], value: resWordLex[id], line: line };
	},
	other: function (val, line) {
		let type;
		switch (val) {
			case '==': type = Type.EQUAL; break;
			case '!=': type = Type.UNEQUAL; break;
			case '<=': type = Type.LESSEQ; break;
			case '>=': type = Type.GREATEQ; break;
			case '=>': type = Type.ARROW; break;
			case '||': type = Type.OR; break;
			case '&&': type = Type.AND; break;
			default: type = Type.NULL;
		}
		return { type: type, value: val, line: line };
	},
	iden: function (val, line) {
		return { type: Type.IDEN, value: val, line: line };
	},
	integer: function (val, line) {
		return { type: Type.INTEGER, value: val, line: line };
	},
	float: function (val, line) {
		return { type: Type.FLOAT, value: val, line: line };
	},
	string: function (val, line) {
		return { type: Type.STRING, value: val, line: line };
	},
	char: function (val, line) {
		return { type: Type.CHAR, value: val, line: line };
	}
}

module.exports.utils = {
	types: Type,
	emptyToken: function () {
		return { type: Type.NULL, value: '', line: 0 };
	},
	getType: function (idType) {
		switch (idType) {
			case Type.TYPE_INTEGER: return Type.INTEGER;
			case Type.TYPE_FLOAT: return Type.FLOAT;
			case Type.TYPE_BOOL: return Type.BOOL;
			case Type.TYPE_STRING: return Type.STRING;
			case Type.TYPE_CHAR: return Type.CHAR;
		}
	},
	isTypeTok: function (tok) {
		switch (tok.type) {
			case Type.TYPE_INTEGER: case Type.TYPE_FLOAT: case Type.TYPE_BOOL: case Type.TYPE_STRING: case Type.TYPE_CHAR:
				return true;
			default:
				return false;
		}
	},
	isValue: function (tok) {
		switch (tok.type) {
			case Type.INTEGER: case Type.FLOAT: case Type.BOOL: case Type.STRING: case Type.CHAR:
				return true;
			default:
				return false;
		}
	},
	isAlpha: function (tok) {
		return (tok.type === Type.CHAR || tok.type === Type.STRING);
	},
	isNum: function (tok) {
		return (tok.type === Type.INTEGER || tok.type === Type.FLOAT || tok.type === Type.CHAR);
	},
	isBool: function (tok) {
		return (tok.type === Type.BOOL || tok.type === Type.TRUE || tok.type === Type.FALSE);
	},
	isCompOp: function (tok) {
		switch (tok.type) {
			case Type.LESS: case Type.GREAT: case Type.EQUAL: case Type.UNEQUAL: case Type.LESSEQ: case Type.GREATEQ:
				return true;
			default:
				return false;
		}
	},
	str: function (token) {
		return `${token.value} -> ${token.type}`;
	}
}
//AGREGAR break
const resWordLex = ['begin', 'bool', 'char', 'cjprint','cjread' , 'do', ' elif', 'else', 'end', 'false', 'float', 'for', 'fun', 'if', 'int', 'return', 'string', 'true', 'while'];
const resWordTok = [Type.BEGIN, Type.TYPE_BOOL, Type.TYPE_CHAR, Type.PRINT, Type.READ, Type.DO, Type.ELIF, Type.ELSE, Type.END, Type.FALSE, Type.TYPE_FLOAT, Type.FOR, Type.FUN,
Type.IF, Type.TYPE_INTEGER, Type.RETURN, Type.TYPE_STRING, Type.TRUE, Type.WHILE];

var specialSymbolTok = new Array(128).fill(0);

function binarySearchResWord(value) {
	var left = 0, right = resWordLex.length - 1, middle = Math.floor((right + left) / 2);

	while (resWordLex[middle] != value && left < right) {

		if (value < resWordLex[middle]) {
			right = middle - 1;
		} else if (value > resWordLex[middle]) {
			left = middle + 1;
		}
		middle = Math.floor((right + left) / 2);
	}

	return (resWordLex[middle] != value) ? -1 : middle;
}

function initializeSpecialSymbols() {
	specialSymbolTok[0] = true;

	specialSymbolTok[33] = Type.NOT;
	specialSymbolTok[37] = Type.MOD;
	specialSymbolTok[40] = Type.LPAR;
	specialSymbolTok[41] = Type.RPAR;
	specialSymbolTok[42] = Type.MUL;
	specialSymbolTok[43] = Type.SUM;
	specialSymbolTok[44] = Type.COMMA;
	specialSymbolTok[45] = Type.SUB;
	specialSymbolTok[47] = Type.DIV;
	specialSymbolTok[59] = Type.SEMI;
	specialSymbolTok[60] = Type.LESS;
	specialSymbolTok[61] = Type.ASSIGN;
	specialSymbolTok[62] = Type.GREAT;

	specialSymbolTok[91] = Type.LBRACKET;
	specialSymbolTok[93] = Type.RBRACKET;
	specialSymbolTok[94] = Type.POW;
	specialSymbolTok[123] = Type.LCURL;
	specialSymbolTok[125] = Type.RCURL;
}
