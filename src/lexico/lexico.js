
const Type = {
	NULL: '0',
	TOKBEGIN: 'tokBegin',
	TOKEND: 'tokEnd',

	TOKTINTEGER: 'tokTInteger',
	TOKTSTRING: 'tokTString',
	TOKTBOOL: 'tokTBool',
	TOKTCHAR: 'tokTChar',
	TOKTFLOAT: 'tokTFloat',

	INTEGER: 'integer',
	STRING: 'string',
	BOOL: 'bool',
	CHAR: 'char',
	FLOAT: 'float',
	TOKTRUE: 'tokTrue',
	TOKFALSE: 'tokFalse',
	TOKOR: 'tokOr',
	TOKAND: 'tokAnd',
	TOKIDEN: 'tokIden',
	TOKIF: 'tokIf',
	TOKWHILE: 'tokWhile',
	TOKRETURN: 'tokReturn',

	TOKLPAR: 'tokLPar',
	TOKRPAR: 'tokRPar',
	TOKSEMICOLON: 'tokSemicolon',
	TOKCOMMA: 'tokComma',
	TOKSINQOUTE: 'tokSinQoute',
	TOKDOUQUOTE: 'tokDouQoute',
	TOKLCURL: 'tokLCurl',
	TOKRCURL: 'tokRCurl',
	TOKLBRACKET: 'tokLBracket',
	TOKRBRACKET: 'tokRBracket',

	SUM: 'sum',
	SUB: 'sub',
	MUL: 'mul',
	DIV: 'div',
	POW: 'pow',
	ASSIGN: 'assign',
	LESS: 'less',
	GREAT: 'greater',
	EQUAL: 'equal',
	LESSEQ: 'lessEqual',
	GREATEQ: 'greaterEqual',

}

module.exports = {
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
			case '||':
				type = Type.TOKOR;
				break;
			case '&&':
				type = Type.TOKAND;
				break;
			default:
				type = type.NULL;
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
	},
	str: function (token) {
		return `${token.value} -> ${token.type}`;
	}
}


//AGREGAR TODOS
const resWordLex = ["begin", "bool", "char", "end", "false", "float", "if", "int", "return", "string", "true", "while"];
const resWordTok = [Type.TOKBEGIN, Type.TOKTBOOL, Type.TOKTCHAR, Type.TOKEND, Type.TOKFALSE, Type.TOKTFLOAT, Type.TOKIF,
Type.TOKTINTEGER, Type.TOKRETURN, Type.TOKTSTRING, Type.TOKTRUE, Type.TOKWHILE];
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
	
	specialSymbolTok[40] = Type.TOKLPAR;
	specialSymbolTok[41] = Type.TOKRPAR;
	specialSymbolTok[42] = Type.MUL;
	specialSymbolTok[43] = Type.SUM;
	specialSymbolTok[44] = Type.TOKCOMMA;
	specialSymbolTok[45] = Type.SUB;
	specialSymbolTok[47] = Type.DIV;
	specialSymbolTok[59] = Type.TOKSEMICOLON;
	specialSymbolTok[60] = Type.LESS;
	specialSymbolTok[61] = Type.ASSIGN;
	specialSymbolTok[62] = Type.GREAT;

	specialSymbolTok[91] = Type.TOKLBRACKET;
	specialSymbolTok[93] = Type.TOKRBRACKET;
	specialSymbolTok[94] = Type.POW;
	specialSymbolTok[123] = Type.TOKLCURL;
	specialSymbolTok[125] = Type.TOKRCURL;
}
