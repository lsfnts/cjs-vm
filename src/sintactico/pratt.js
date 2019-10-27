const lex = require('../lexico/lexico').utils;
const tokT = lex.types;
const err = require('./errores');

const symbol = require('./symbols');

const OP = require('../vm/opCodes');
const Bytecode = require('../vm/bytecode');

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
        return bytecode;
    }
}