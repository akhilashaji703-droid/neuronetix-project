

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>

LiquidCrystal_I2C lcd(0x27, 8, 2);

SoftwareSerial dfPlayerSerial(11, 10);
DFRobotDFPlayerMini dfPlayer;

const int EEG_PIN = A0;    
const int SAMPLING_RATE = 256;  
const int SAMPLE_INTERVAL = 1000000 / SAMPLING_RATE;

float EEGFilter(float input);

unsigned long lastSampleTime = 0;
unsigned long lastLcdUpdate = 0;
const unsigned long LCD_UPDATE_INTERVAL = 200;
float eegValue = 0;
float rawValue = 0;
unsigned long sampleCount = 0;

void setup() {
  Serial.begin(115200);
  
  dfPlayerSerial.begin(9600);
  
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Neuro");
  lcd.setCursor(0, 1);
  lcd.print("Netix");
  delay(500);
  if (dfPlayer.begin(dfPlayerSerial)) {
    dfPlayer.volume(25);
    dfPlayer.play(1);
  }
  
  #if defined(__AVR_ATmega328P__) || defined(__AVR_ATmega168__)
    ADCSRA = (ADCSRA & 0xF8) | 0x04;
  #endif
  
  while (!Serial) {
    ;
  }
  
  Serial.println("BioAmp EEG Ready");
  Serial.print("Sampling Rate: ");
  Serial.print(SAMPLING_RATE);
  Serial.println(" Hz");
  
  delay(2000);
  lcd.clear();
}

void loop() {
  unsigned long currentTime = micros();
  
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;
    
    rawValue = analogRead(EEG_PIN);
    
    eegValue = EEGFilter(rawValue);
    sampleCount++;
    
    Serial.println(eegValue);
  }
  
  if (millis() - lastLcdUpdate >= LCD_UPDATE_INTERVAL) {
    lastLcdUpdate = millis();
    updateLCD();
  }
}

void updateLCD() {
  int displayValue = (int)eegValue;
  
  lcd.setCursor(0, 0);
  lcd.print("EEG:");
  if (abs(displayValue) < 100) lcd.print(" ");
  if (abs(displayValue) < 10) lcd.print(" ");
  lcd.print(displayValue);
  
  lcd.setCursor(0, 1);
  lcd.print(" ");
  lcd.print(SAMPLING_RATE);
  lcd.print("Hz  ");
}

float EEGFilter(float input) {
  float output = input;
  {
    static float z1, z2;
    float x = output - -0.95391350*z1 - 0.25311356*z2;
    output = 0.00735282*x + 0.01470564*z1 + 0.00735282*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - -1.20596630*z1 - 0.60558332*z2;
    output = 1.00000000*x + 2.00000000*z1 + 1.00000000*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - -1.97690645*z1 - 0.97706395*z2;
    output = 1.00000000*x + -2.00000000*z1 + 1.00000000*z2;
    z2 = z1;
    z1 = x;
  }
  {
    static float z1, z2;
    float x = output - -1.99071687*z1 - 0.99086813*z2;
    output = 1.00000000*x + -2.00000000*z1 + 1.00000000*z2;
    z2 = z1;
    z1 = x;
  }
  return output;
}
