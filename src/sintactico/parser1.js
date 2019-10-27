const lex = require('../lexico/lexico').utils;
const tokT = lex.types;
const err = require('./errores');

const symbol = require('./symbols');

const OP = require('../vm/opCodes');
const Bytecode = require('../vm/bytecode');

const throwError = err.throwError;
const errorType = err.errorType;

var tokens;
var token = 0;
var i;

var bytecode = new Bytecode();

module.exports = {
    parse: function (tokenIn) {

        tokens = tokenIn;
        i = -1;
        nextToken();
        programa();
        return bytecode;
    }
}

function programa() {

    if (token.type === tokT.TOKBEGIN) nextToken();
    else throwError(token, errorType.NOT_BEGIN);


    bloque();
    if (token.type !== tokT.TOKEND) {

    }
}

function bloque() {

    if (token.type === tokT.TOKLCURL) {
        console.log('==========inicia bloque============');
        nextToken();
        while (token.type !== tokT.TOKRCURL) {
            instruccion();
        }
        console.log('==========finaliza bloque============');
        nextToken()
    } else throwError(token, errorType.NOT_LCURL);
}

function simple_instr(no_semi) {
    if (token.type === tokT.TOKIDEN) {
        var tokCache = token;
        nextToken();
        if (token.type === tokT.ASSIGN) {
            asignacion(tokCache);
        } else if (token.type === tokT.TOKLPAR) {
            //quiere ser funcion
        }
    } else if (lex.isTypeTok(token.type)) {
        declaracion();

    }
    if (token.type !== tokT.TOKSEMI && !no_semi) { throwError(token, errorType.NOT_SEMI); nextToken() }
    else if (token.type === tokT.TOKSEMI) {
        console.log('next inst');

        nextToken();
    }
}

function instruccion() {
    if (token.type === tokT.TOKFUN) {
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
    else simple_instr();
}

function declaracion() {
    console.log('declaracion');
    var tokCache = token;
    nextToken();
    if (token.type === tokT.TOKIDEN) {
        symbol.insert(token.value, lex.getType(tokCache.type));
        var tokCache2 = token;
        nextToken();
        if (token.type === tokT.ASSIGN) asignacion(tokCache2);
    }
    else throwError(token, errorType.NOT_IDEN);

    while (token.type === tokT.TOKCOMMA) {
        nextToken();
        if (token.type === tokT.TOKIDEN) {
            symbol.insert(token.value, lex.getType(tokCache.type));
            var tokCache2 = token;
            nextToken();
            if (token.type === tokT.ASSIGN) {
                asignacion(tokCache2);
            }
        }
    }

}

function asignacion(tokIden) {
    console.log('asignacion');
    console.log(tokIden.value);
    var s = symbol.lookup(tokIden.value)
    if (s) {
        nextToken();

        expresion(s.type);
    } else { throwError(tokIden, errorType.UNDEFINED); nextToken(); }
}

function expresion(type) {
    var expr = { INTEGER: 8, FLOAT: 9, STRING: 10, CHAR: 11, BOOL: 12, };
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
    while (token.type === tokT.SUM || token.type === tokT.SUB) {
        let sign = token.type;
        nextToken();
        factor(type);
        switch (sign) {
            case tokT.SUM:
                emitByte(OP.ADD);
                break;
            case tokT.SUB:
                emitByte(OP.SUBTRACT);
                break;
        }
    }
}

function factor(type) {
    potencia(type);
    while (token.type === tokT.MUL || token.type === tokT.DIV || token.type === tokT.MOD) {
        let sign = token.type;
        nextToken();
        potencia(type);

        switch (sign) {
            case tokT.MUL:
                emitByte(OP.MULTIPLY);
                break;
            case tokT.DIV:
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
    while (token.type === tokT.POW) {
        ++t;
        nextToken();
        numero(type);

    }
    for (let i = 0; i < t; i++) {
        emitByte(OP.EXPONEN);

    }
}

function numero(type) {
    if (token.type === tokT.TOKLPAR) {
        nextToken();
        expr_num(type);
        if (token.type === tokT.TOKRPAR) {
            console.log('cierra');

            nextToken();
        }
    } else if (lex.isNum(token)) {
        emitConstant(Number(token.value));
        nextToken();
    } else if (token.type === tokT.CHAR) {
        emitConstant(token.value.charCodeAt(0));
        nextToken();
    } else if (token.type === tokT.TOKIDEN) {
        var s = symbol.lookup(token.value);

        if (s) {
            console.log(s);

            if (lex.isNum(s)) {
                //variable
            } else if (token.type === tokT.CHAR) {
                //variable
            } else {
                throwError(token, errorType.UNDEFINED)
            }
            nextToken();
        } else {
            throwError(token, errorType.NOT_NUMBER);
            nextToken();
        }

    } else {
        throwError(token, errorType.NOT_NUMBER);
        nextToken();
    }
}

function expr_string(type) {
    console.log('expr_string');
    termino_alfa(type);
    while (token.type === tokT.SUM) {
        nextToken();
        termino_alfa(type);
        emitByte(OP.ADD);
    }
}

function termino_alfa(type) {
    if (token.type === tokT.TOKLPAR) {
        nextToken();
        expr_alfa(type);
    } else if (lex.isValue(token)) {
        emitConstant(token.value);
        nextToken();
    } else if (token.type === tokT.TOKIDEN) {
        var s = symbol.lookup(token.value);

        if (s) {
            if (lex.isAlpha(s)) {
                s.value = token.value;
            } else {
                throwError(token, errorType.BAD_VAR_TYPE, s.type, type);
            }
        } else {
            throwError(token, errorType.UNDEFINED);
        }
        nextToken();
    } else { throwError(token, errorType.NOT_ALPHA); nextToken(); }
}

function expr_bool() {
    console.log('expr_bool');
    termino_bool();
    while (token.type === tokT.TOKOR || token.type === tokT.TOKAND) {
        nextToken();
        termino_bool();
    }
}

function termino_bool() {
    let notFlag = false
    if (token.type === tokT.NOT) {
        notFlag = true;
        nextToken();
    }

    if (token.type === tokT.TOKLPAR) {
        nextToken();
        expr_bool();
        if (token.type === tokT.TOKRPAR) {

        } else throwError(token, errorType.NOT_RPAR);
        nextToken();
    } else if (lex.isBool(token)) {
        if (token.type === tokT.TOKTRUE) emitByte(OP.TRUE);
        else emitByte(OP.FALSE);
        nextToken();
    } else if (token.type === tokT.TOKIDEN) {

        nextToken();
    } else {
        console.log('aqui');

        let op;
        expresionType();
        if (lex.isCompOp(token)) {
            op = token.type;
        } else throwError(token, errorType.NOT_COMPARISON);
        nextToken();
        expresionType();
        switch (op) {
            case tokT.EQUAL: emitByte(OP.EQUAL); break;
            case tokT.LESS: emitByte(OP.LESS); break;
            case tokT.LESSEQ: emitByte(OP.LESS_EQ); break;
            case tokT.GREAT: emitByte(OP.GREATER); break;
            case tokT.GREATEQ: emitByte(OP.GREATER_EQR); break;
        }
    }

    if (notFlag) emitByte(OP.NOT);
}

function if_instr() {
    if (token.type !== tokT.TOKLPAR) throwError(token, errorType.NOT_LPAR);
    nextToken();
    expr_bool();
    if (token.type !== tokT.TOKRPAR) throwError(token, errorType.NOT_RPAR);
    nextToken();
    bloque();
    while (token.type === tokT.TOKELIF) {
        if (token.type !== tokT.TOKLPAR) throwError(token, errorType.NOT_LPAR);
        nextToken();
        expr_bool();
        if (token.type !== tokT.TOKRPAR) throwError(token, errorType.NOT_RPAR);
        nextToken();
        bloque();
    }
    if (token.type === tokT.TOKELSE) {
        nextToken();
        bloque();
    }
}

function for_instr() {
    console.log('for instruction');

    if (token.type !== tokT.TOKLPAR) throwError(token, errorType.NOT_LPAR);
    nextToken();

    simple_instr();
    console.log('primero');

    expr_bool();
    if (token.type == tokT.TOKSEMI) {
        console.log('segundo');
        nextToken();
    }
    else { throwError(token, errorType.NOT_SEMI); }

    simple_instr(true);
    console.log('tercero');

    if (token.type !== tokT.TOKRPAR) throwError(token, errorType.NOT_RPAR);
    nextToken();

    bloque();
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

function expresionType() {
    var expr = { INTEGER: 8, FLOAT: 9, STRING: 10, CHAR: 11, BOOL: 12, };
    let type = token.type;

    let offset = 1;
    while (type === tokT.TOKLPAR) {
        type = peekNext(offset);
    }

    if (token.type === tokT.TOKIDEN) {
        type = symbol.lookup(token.value).type;
    }
    switch (type) {
        case tokT.INTEGER: expr_num(8);
            break;
        case tokT.FLOAT: expr_num(9);
            break;
        case tokT.STRING: expr_string(10);
            break;
        case tokT.CHAR: expr_num(11);
            break;
        case tokT.TOKTRUE: case tokT.TOKFALSE: case tokT.NOT: case tokT.BOOL:
            expr_bool(12);
            return 3;
        default:
            break;
    }
}

function peekNext(offset) {
    token = tokens[i + offset];
}