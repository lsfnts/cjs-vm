const types = {
    NOT_BEGIN: 0,
    NOT_IDEN: 1,
    BAD_VAR_TYPE: 2,
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
    NOT_SEMI: 15,
    NOT_NUMBER: 16,
    NOT_COMPARISON: 17
}

const valueTypes = new Map;
valueTypes.set(8, 'int');
valueTypes.set(9, 'float');
valueTypes.set(10, 'string');
valueTypes.set(11, 'char');
valueTypes.set(12, 'bool');

module.exports = {
    throwError: function (token, type, idType, exprType) {
        if (type === types.BAD_VAR_TYPE) {
            let expected;
            switch (exprType) {
                case 1:
                    expected = 'int o float';
                    break;
                case 10:
                    expected = 'string o char';
                case 11:
                    expected = 'char';
                default:
                        expected = 'otro';
                    break;
            }
            console.log(`${typesString[type]} tipo variable: ${valueTypes.get(idType)}, tipo esperado: ${expected}. en la linea ${token.line}`);
        } else if (type === types.UNDEFINED) {
            console.log(`identificador ${token.value} no definido en la linea ${token.line}`);
        } else {
            console.log(`${typesString[type]} en la linea ${token.line}`)
        }

    },
    errorType: types
}

typesString = [
    'el codigo tiene que empezar con begin',                //0
    'se esperaba un identificador',                         //1
    'el tipo del valor no concuerda',                       //2
    'se esperaba el tamaño del arreglo (entero)',           //3
    'se esperaba (',                                        //4
    'se esperaba )',                                        //5
    'se esperaba {',                                        //6
    'se esperaba }',                                        //7
    'se esperaba [',                                        //8
    'se esperaba ]',                                        //9
    'se esperaba un identificador',                         //10
    'se esperaba un tipo (int|float|char|string|bool)',     //11
    'se esperaba ->',                                       //12
    'identificador no definido',                            //13
    'operador no valido con strings',                       //14
    'se esperaba ;',                                        //15
    'se esperaba un numero',                                //16
    'se esperaba un operador de comparacion'                //17
]

