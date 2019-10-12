const lineByLine = require('n-readlines');

var tokenGen = require('./lexico');
var params = require('./params');


module.exports = {
	fromFile: function (path) {
		var tokenList = [];
		var liner = new lineByLine(path);
		var lineN = 0;
		while (line = liner.next()) {
			tokenList = tokenList.concat(scanLine(line.toString(), lineN++));
		}
		return tokenList;
	}

}

var ch = '';
var linea = '';
var i = '0';

function scanLine(source, lineN) {
	ch = ' '
	
	var tokens = [];
	i = -1;
	linea = source.toLowerCase();
	var ll = linea.length;
	
	while (i < ll) {
		let token = getToken(lineN)
		if (token) tokens.push(token);
	}
	
	return tokens;
}

function getToken(ln) {
	var token
	var lexeme = '';
	var j = 0;
	while (ch == ' ' || ch == '\t' || ch == '\n' || ch =='\r') {
		ch = linea[++i];
		return;
	}
	if (ch == '\n' || ch =='\r') {
		ch = linea[++i];
		return;
	}
	if (isLetter(ch) || ch == '_') {
		lexeme += ch;
		j = 1;
		ch = linea[++i];
		while (isLetter(ch) || isDigit(ch) || ch == '_')
			if (j < params.MAX_ID) {
				lexeme += ch;
				ch = linea[++i];
			}
		let index = tokenGen.isReservedWord(lexeme);
		if (index >= 0) {
			token = tokenGen.reservedWord(index, ln);
		} else {
			token = tokenGen.iden(lexeme, ln);
		}
	} else if (isDigit(ch)) {
		var isFloat = false;
		lexeme = ch;
		j = 1;
		ch = linea[++i];
		while (isDigit(ch) || ch == '.') {
			if (j < params.MAX_DIGIT) lexeme += ch;
			if (ch == '.') isFloat = true;
			j++;
			ch = linea[++i];
		}

		if (isFloat) {
			token = tokenGen.float(lexeme, ln);
		} else {
			token = tokenGen.integer(lexeme, ln);
		}
	} else if (ch == '"') {
		ch = linea[++i];
		while (ch != '"') {
			lexeme += ch;
			ch = linea[++i];
		}
		token = tokenGen.string(lexeme, ln);
		ch = linea[++i];

	} else if (ch == '\'') {
		ch = linea[++i];
		while (ch != '\'') {
			lexeme += ch;
			ch = linea[++i];
		}
		token = tokenGen.char(lexeme, ln);
		ch = linea[++i];
	} else if (ch == '#') {
		ch = linea[++i];
		while (i < linea.length)
			ch = linea[++i]
		ch = linea[++i];
		return;
	} else {
		if (ch == '<') {
			ch = linea[++i];
			if (ch == '=') {
				token = tokenGen.other('<=', ln);
				ch = linea[++i];
			} else {
				token = tokenGen.specialSymbol('<', ln);
			}
		} else if (ch == '>') {
			ch = linea[++i];
			if (ch == '=') {
				token = tokenGen.other('>=', ln);
				ch = linea[++i];
			} else {
				token = tokenGen.specialSymbol('>', ln);
			}
		} else if (ch == '=') {
			ch = linea[++i];
			if (ch == '=') {
				token = tokenGen.other('==', ln);
				ch = linea[++i];
			} else if (ch == '=>'){
				token = tokenGen.other('=>', ln);
				ch = linea[++i];
			}else {
				token = tokenGen.specialSymbol('=', ln);
			}
		} else if (ch == '|') {
			ch = linea[++i];
			if (ch == '|') {
				token = tokenGen.other('||', ln);
				ch = linea[++i];
			}
		} else if (ch == '&') {
			ch = linea[++i];
			if (ch == '&') {
				token = tokenGen.other('&&', ln);
				ch = linea[++i];

			}
		}
		else {
			token = tokenGen.specialSymbol(ch, ln);
			ch = linea[++i]
		}
	}
	return token;
}

function isLetter(c) {

	if (!(typeof c == 'string')) return false;
	var code = c.charCodeAt(0);
	return (code > 96 && code < 123);
}

function isDigit(c) {
	if (!(typeof c == 'string')) return false;
	var code = c.charCodeAt(0);
	return (code > 47 && code < 58);
}