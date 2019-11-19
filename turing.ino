#include <LiquidCrystal_I2C.h>

#include <Button.h>


#include <Wire.h>
#include <LiquidCrystal_I2C.h>

//Constantes y tipos
LiquidCrystal_I2C  lcd(0x27, 2, 1, 0, 4, 5, 6, 7);

Button button1(8);  //modo 1, 1
Button button2(9);  //modo 2, 0
Button button3(10); //      , ' '
Button button4(11); //      , <-
Button button5(12); //      , terminar


const int ledPin =  13;
const int intervalo = 500;
const int estados_maximos = 20;
const int cinta_max = 64;


char cinta[cinta_max];
int l = 0;
int cp = 0;
int state = 0;

bool input = true;
bool program1 = false;
bool program2 = false;

void setup() {
  button1.begin();
  button2.begin();
  button3.begin();
  button4.begin();
  button5.begin();

  //cinta[l++] = ' ';

  lcd.begin (16, 2); //16 x 2
  lcd.setBacklightPin(3, POSITIVE);
  lcd.setBacklight(LOW);
  lcd.setBacklight(HIGH);
}

void loop() {
  lcd.clear();

  if (input) {
    lcd.blink();
    readInput();
  }

  printCinta();

  if (program1) {
    turing1();
  }

  delay(20);
}

void printCinta() {
  lcd.setCursor(0, 0);
  for (int i = 0; i < l; i++) {
    lcd.print(cinta[i]);
  }
}

void readInput() {
  if (button1.pressed()) {
    cinta[l++] = '1';
  }
  if (button2.pressed()) {
    cinta[l++] = '0';
  }

  if (button3.pressed()) {
    cinta[l++] = ' ';
  }
  if (button4.pressed()) {
    cinta[l--] = ' ';
  }
  if (button5.pressed()) {
    input = false;
    program1 = true;
  }
}

void turing1() {
  lcd.blink();
  char c = cinta[cp];
  lcd.setCursor(0, 1);
  lcd.print("estado ");
  lcd.print(0);
  lcd.setCursor(cp, 0);
  delay(1000);
  while (c == '0' || c == '1') {
    switch (state) {
      case 0:
        switch (c) {
          case '0':
            state = 2;
            break;
          case '1':
            state = 1;
            break;
        }
        cp += 1;
        break;
      case 1:
        switch (c) {
          case '0':
            state = 3;
            break;
          case '1':
            state = 0;
            break;
        }
        cp += 1;
        break;
      case 2:
        switch (c) {
          case '0':
            state = 0;
            break;
          case '1':
            state = 3;
            break;
        }
        cp += 1;
        break;
      case 3:
        switch (c) {
          case '0':
            state = 1;
            break;
          case '1':
            state = 2;
            break;
        }
        cp += 1;
        break;
    }
    lcd.setCursor(0, 1);
    lcd.print("estado ");
    lcd.print(state);
    lcd.setCursor(cp, 0);
    delay(1000);
    c = cinta[cp];
  }
  lcd.clear();
  if (state == 0) {
    lcd.print("aceptado");
  } else {
    lcd.print("rechazado");
  }
  delay(2000);
  program1 = false;
}
