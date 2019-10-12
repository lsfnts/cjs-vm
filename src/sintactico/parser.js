const lex = require('../lexico/lexico');
const err = require('./errores');

const throwError = err.throwError;
const errorType = err.errorType;

var tokens;
var token;
var i;
var typeCache;

var brackets;
module.exports = {
    parse: function (tokenIn) {
        tokens = tokenIn;
        i = -1;
        token = nextToken();
        if (token.type != lex.types.TOKBEGIN) {
            throwError(token, errorType.NOT_BEGIN);
        }
        token = nextToken();
        bloque();
    }
}

function bloque() {
    while (token) {
        switch (token.type) {
            case lex.types.TOKTINTEGER:
            case lex.types.TOKTFLOAT:
            case lex.types.TOKTBOOL:
            case lex.types.TOKTCHAR:
            case lex.types.TOKTSTRING:
                typeCache = token.type;
                token = nextToken();
                if (token.type == lex.types.TOKIDEN) {
                    declareVar(token.value);
                } else throwError(token, errorType.NOT_IDEN);
                break;
            case lex.types.TOKFUN:
                
                token = nextToken();
                if (token.type == lex.types.TOKIDEN) {
                    declareFun(token.value);
                } else throwError(token, errorType.NOT_IDEN);
                break;
            case lex.types.TOKIDEN:
                if (existeVar()) {
                    token = nextToken();
                    if (token.type == lex.types.ASSIGN) {
                        token = nextToken();
                        expression();
                    }
                }
                break;
            case lex.types.TOKIF:
                token = nextToken();
                while (token.type != lex.types.TOKRCURL) token = nextToken();
            default:
                token = nextToken();
        }
    }
}

function declareVar(iden) {
    //PONER declar
    token = nextToken();
    if (token.type == lex.types.ASSIGN) {
        token = nextToken();
        if (lex.isSameType(typeCache, token.type)) {
            //poner(iden, token)
            //asignar
            token = nextToken();
        } else if (lex.isValue) {
            throwError(token, errorType.BAD_TYPE, typeCache, token.type);
        }
    } else if (token.type == lex.types.TOKLBRACKET) {
        token = nextToken();
        if (token.type == lex.types.INTEGER) ponerArreglo(typeCache, token.value);
        else throwError(token, errorType.NOT_ARR_SIZE);
        token = nextToken();
        if (token.type != lex.types.TOKRBRACKET) throwError(token, errorType.NOT_RBRACKET);
    }
    if (token.type == lex.types.TOKSEMICOLON) {
        //poner(iden, token);
        token = nextToken();
    } else throwError(token, errorType.NOT_SEMICOLON);
}

function existeVar() {

}

function declareFun() {
    token = nextToken();
    if (token.type == lex.types.TOKLPAR) {
        token = nextToken();
        do {
            if (token.type == lex.types.TOKRBRACKET) break;
            //MAX ARGS
            if (lex.isTypeTok) typeCache = token.type;
            else throwError(token, errores.NOT_TYPE)

            token = nextToken();
            if (token.type == lex.types.TOKIDEN) declareVar()
            else throwError(token, errorType.NOT_IDEN)

            token = nextToken();
        } while (token.type == lex.types.TOKCOMMA);
        if (token.type == lex.types.ARROW) {
            token = nextToken();
            if (lex.isTypeTok(token)) {
                token = nextToken();
                if (token.type == lex.types.TOKLCURL) {
                    bloque();
                } else throwError(token, errorType.NOT_LPAR)
            } else throwError(token, errorTypes.NOT_TYPE);
        }
    }
}


function expression(isStringExp) {
    if (token.type == lex.types.SUM || token.type == lex.types.SUB) {
        token = nextToken();
        termino(isStringExp);
    } else termino(isStringExp);

    while (token.type == lex.types.SUM || token.type == lex.types.SUB) {
        if (isStringExp) {
            if (token.type == lex.types.SUB) throwError(token, errorType.NOT_STRING_OP);
        }
        token = nextToken();
        termino(isStringExp)
    }

}

function termino(isStringExp) {
    factor(isStringExp)
    while (token.type == lex.types.MUL || token.type == lex.types.DIV) {
        if (isStringExp) throwError(token, errorType.NOT_STRING_OP);
        token = nextToken();
        factor(isStringExp);
    }
}

function factor(isStringExp) {
    poten(isStringExp);
    while (token.type == lex.types.POW) {
        if (isStringExp) throwError(token, errorType.NOT_STRING_OP);
        token = nextToken();
        poten(isStringExp);
    }
}

function poten(isStringExp) {
    if (lex.isValue(token)) {
        if (lex.isLetter(token)) {
            if (isStringExp) return true;
        }
    } else if (token.type == lex.types.TOKIDEN) {
        if (existe(token.value)) {
            //CHECK IF VAR IS LETTER
            token = nextToken();
            if (token = lex.types.TOKLPAR) {
                //COMPROBAR SI ES FUNCION
                token = nextToken();
                if (token.type != lex.types.TOKRPAR) {
                    token = nextToken();
                    expression(isStringExp);
                    while (token.type == lex.types.TOKCOMMA) {
                        token = nextToken();
                        expression(isStringExp);
                    }
                    if (token != lex.types.TOKRPAR) {
                        throwError(token, errorType.NOT_RPAR);
                    }
                }
            }
        } else { throwError(token, errorType.UNDEFINED) }
    } else if (token.type == lex.types.TOKLPAR) {
        token = nextToken();
        expression();
    }
}

function existe() {

}

function nextToken() {
    console.log(tokens[++i]);
    return tokens[i];
}