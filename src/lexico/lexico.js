
const Type = {
	NULL: 0,
	TOKBEGIN: 1,
	TOKEND: 2,

	TOKTINTEGER: 3,
	TOKTFLOAT: 6,
	TOKTSTRING: 4,
	TOKTCHAR: 51,
	TOKTBOOL: 5,

	INTEGER: 7,
	FLOAT: 11,
	STRING: 8,
	CHAR: 10,
	BOOL: 9,
	TOKTRUE: 12,
	TOKFALSE: 13,

	TOKOR: 14,
	TOKAND: 15,
	TOKIDEN: 16,
	TOKIF: 17,
	TOKELIF: 18,
	TOKELSE: 19,
	TOKFOR: 52,
	TOKWHILE: 20,
	TOKDO: 53,
	TOKRETURN: 21,

	TOKLPAR: 22,
	TOKRPAR: 23,
	TOKSEMI: 24,
	TOKCOMMA: 25,
	TOKSINQOUTE: 26,
	TOKDOUQUOTE: 27,
	TOKLCURL: 28,
	TOKRCURL: 29,
	TOKLBRACKET: 30,
	TOKRBRACKET: 31,
	TOKFUN: 32,
	ARROW: 33,

	SUM: 34,
	SUB: 35,
	MUL: 36,
	DIV: 37,
	POW: 38,
	ASSIGN: 39,
	LESS: 40,
	GREAT: 41,
	EQUAL: 42,
	LESSEQ: 43,
	GREATEQ: 44,
	UNIPLUS: 45,
	UNINEG: 46,
	NOT: 47,
	MOD: 50
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
		var type;
		switch (val) {
			case '<=':
				type = Type.LESSEQ;
				break;
			case '>=':
				type = Type.GREATEQ;
				break;
			case '==':
				type = Type.EQUAL;
				break;
			case '=>':
				type = Type.ARROW;
				break;
			case '||':
				type = Type.TOKOR;
				break;
			case '&&':
				type = Type.TOKAND;
				break;
			default:
				type = Type.NULL;
		}
		return { type: type, value: val, line: line };
	},
	iden: function (val, line) {
		return { type: Type.TOKIDEN, value: val, line: line };
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
	empyToken: function () {
		return { type: Type.NULL, value: '', line: 0 };
	},
	isSameType: function (idType, valueType) {
		switch (idType) {
			case Type.TOKTINTEGER:
				return (valueType == Type.INTEGER);
			case Type.TOKTFLOAT:
				return valueType == Type.FLOAT;
			case Type.TOKTBOOL:
				return (valueType == Type.TOKTRUE || valueType == Type.TOKFALSE);
			case Type.TOKTSTRING:
				return valueType == Type.STRING;
			case Type.TOKTCHAR:
				return valueType == Type.CHAR;
		}
	},
	getValueType: function (idType) {
		switch (idType) {
			case Type.TOKTINTEGER:
				return Type.INTEGER;
			case Type.TOKTFLOAT:
				return Type.FLOAT;
			case Type.TOKTBOOL:
				return Type.BOOL;
			case Type.TOKTSTRING:
				return Type.STRING;
			case Type.TOKTCHAR:
				return Type.CHAR;
		}
	},
	isTypeTok: function (tokType) {
		switch (tokType) {
			case Type.TOKTINTEGER:
			case Type.TOKTFLOAT:
			case Type.TOKTBOOL:
			case Type.TOKTSTRING:
			case Type.TOKTCHAR:
				return true;
			default:
				return false;
		}
	},
	isValue: function (tok) {
		switch (tok.type) {
			case Type.INTEGER:
			case Type.FLOAT:
			case Type.BOOL:
			case Type.STRING:
			case Type.CHAR:
				return true;
			default:
				return false;
		}
	},
	isAlpha: function (tok) {
		return (tok.type == Type.CHAR || tok.type == Type.STRING);
	},
	isNum: function (tok) {
		return (tok.type == Type.INTEGER || tok.type == Type.FLOAT);
	},
	isBool: function (tok) {
		return (tok.type == Type.TOKTRUE || tok.type == Type.TOKFALSE);
	},
	str: function (token) {
		return `${token.value} -> ${token.type}`;
	}
}


//AGREGAR TODOS
const resWordLex = ["begin", "bool", "char", "end", "false", "float", "fun", "if", "int", "return", "string", "true", "while"
];
const resWordTok = [Type.TOKBEGIN, Type.TOKTBOOL, Type.TOKTCHAR, Type.TOKEND, Type.TOKFALSE, Type.TOKTFLOAT, Type.TOKFUN,
Type.TOKIF, Type.TOKTINTEGER, Type.TOKRETURN, Type.TOKTSTRING, Type.TOKTRUE, Type.TOKWHILE];
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

	specialSymbolTok[37] = Type.MOD;
	specialSymbolTok[40] = Type.TOKLPAR;
	specialSymbolTok[41] = Type.TOKRPAR;
	specialSymbolTok[42] = Type.MUL;
	specialSymbolTok[43] = Type.SUM;
	specialSymbolTok[44] = Type.TOKCOMMA;
	specialSymbolTok[45] = Type.SUB;
	specialSymbolTok[47] = Type.DIV;
	specialSymbolTok[59] = Type.TOKSEMI;
	specialSymbolTok[60] = Type.LESS;
	specialSymbolTok[61] = Type.ASSIGN;
	specialSymbolTok[62] = Type.GREAT;

	specialSymbolTok[91] = Type.TOKLBRACKET;
	specialSymbolTok[93] = Type.TOKRBRACKET;
	specialSymbolTok[94] = Type.POW;
	specialSymbolTok[123] = Type.TOKLCURL;
	specialSymbolTok[125] = Type.TOKRCURL;
}
