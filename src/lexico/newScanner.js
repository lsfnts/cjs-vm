"use strict";
var tokenGen = require('./lexico');
var params = require('./params');

class Lexer {
	constructor(max_line, max_digit, max_id) {
		this.max_line = max_line;
		this.max_digit = max_digit;
		this.max_id = max_id;

		this.line = '';
		this.ch = '';
		this.n = 0;
		this.i = 0;
	}
	
	lexLine(line, n) {
		this.line = (line.length() < this.max_line)? line.toLowerCase() : line.substring(0, this.max_line).toLowerCase();
		let tokens = []
		this.i = -1;
	}
}