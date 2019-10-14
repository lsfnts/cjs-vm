const types = {
    NOT_BEGIN: 0,
    NOT_IDEN: 1,
    BAD_TYPE: 2,
    NOT_ARR_SIZE: 3,
    NOT_LPAR: 4,
    NOT_RPAR: 5,
    NOT_LCURL: 6,
    NOT_RCURL: 7,
    NOT_LBRACKET: 8,
    NOT_RBRACKET: 9,
    NOT_IDEN: 10,
    NOT_TYPE: 11,
    NOT_ARROW: 12,
    UNDEFINED: 13,
    NOT_STRING_OP: 14,
    NOT_SEMI: 15
}

module.exports = {
    throwError: function (token, type, idType, valueType) {
        if (type === types.BAD_TYPE) {
            console.log(`${typesString[type]} tipo id: ${idType}, tipo valor: ${valueType} en la linea ${token.line}`);
        } else if (type === types.UNDEFINED){
            console.log(`identificador ${token.value} no definido en la linea ${token.line}`);
        }else {
            console.log(`${typesString[type]} en la linea ${token.line}`)
        }

    },
    errorType: types
}

typesString = [
    'el codigo tiene que empezar con begin',
    'se esperaba un identificador',
    'el tipo del valor no concuerda',
    'se esperaba el tamaño del arreglo (entero)',
    'se esperaba (',
    'se esperaba )',
    'se esperaba {',
    'se esperaba }',
    'se esperaba [',
    'se esperaba ]',
    'se esperaba un identificador',
    'se esperaba un tipo (int|float|char|string|bool)',
    'se esperaba ->',
    'identificador no definido',
    'operador no valido con strings',
    'se esperaba ;'
]

