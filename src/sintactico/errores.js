const types = {
    NOT_BEGIN: 0,
    NOT_IDEN: 1,
    BAD_VAR_TYPE: 2,
    NOT_PARAM: 3,
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
    NOT_COMPARISON: 17,
    VAR_EXISTS: 18,
    NOT_ALPHA: 19,
    TOO_VAR: 20,
    VAR_INIT: 21,
    NOT_FUN: 22,
    TOO_MUCH_CODE: 23,
    RET_OUTSIDE: 24,
    NOT_EMPTY_RETURN: 25,
    VOID_FUNCTION: 26,
    NOT_ARRAY: 27,
    NOT_ASIGN: 28,
    NOT_COMMA: 29
}

const valueTypes = new Map;
valueTypes.set(9, 'int');
valueTypes.set(10, 'float');
valueTypes.set(11, 'string');
valueTypes.set(12, 'char');
valueTypes.set(13, 'bool');

module.exports = {
    throwError: function (token, type, idType, exprType) {
        let mes;
        if (type === types.BAD_VAR_TYPE) {
            let expected;
            switch (exprType) {
                case 1:
                    expected = 'int o float';
                    break;
                case 2:
                    expected = 'string o char';
                    break;
                case 3:
                    expected = 'bool';
                    break;
                default:
                    expected = 'otro';
                    break;
            }
            mes = `${typesString[type]} tipo variable: ${valueTypes.get(idType)}, tipo esperado: ${expected}. en la linea ${token.line}`;
        } else if (type === types.UNDEFINED) {
            mes = `identificador ${token.value} no definido en la linea ${token.line}`;
        } else if (type === types.VAR_EXISTS) {
            mes = `identificador ${token.value} ya en uso en el scope actual en la linea ${token.line}`;
        } else if (type === types.NOT_FUN) {
            mes = `${token.value} no es una funcion en la linea ${token.line}`;
        } else {
            mes = `${typesString[type]} en la linea ${token.line}`
        }
        //console.log(mes);
        
        return {message: mes, line_number: token.line};
    },
    errorType: types
}


let typesString = [
    'el codigo tiene que empezar con begin',                //0
    'se esperaba un identificador',                         //1
    'el tipo del valor no concuerda',                       //2
    'se esperaba otro parametro',                           //3
    'se esperaba (',                                        //4
    'se esperaba )',                                        //5
    'se esperaba {',                                        //6
    'se esperaba }',                                        //7
    'se esperaba [',                                        //8
    'se esperaba ]',                                        //9
    'se esperaba un identificador',                         //10
    'se esperaba un tipo (int|float|char|string|bool)',     //11
    'se esperaba ->',                                       //12
    '',                                                     //13
    'operador no valido con strings',                       //14
    'se esperaba ;',                                        //15
    'se esperaba un numero',                                //16
    'se esperaba un operador de comparacion',               //17
    '',                                                     //18
    'se esperaba string o char',                            //19
    'se excedio el maximo de variables',                    //20
    'no se puede leer una variable durante su inicializacion',//21
    '',                                                     //22
    'demasiado codigo dentro de una instruccion de control de flujo',//23
    'return afuera de una funcion',                         //24
    'esta funcion no debe retornar ningun valor',           //25
    'esta funcion no retorna ningun valor',                 //26
    'esa variable no es un arreglo',                        //27
    'no se esta asignando',                                  //28
    'se esperaba , '                                        //29               
]

