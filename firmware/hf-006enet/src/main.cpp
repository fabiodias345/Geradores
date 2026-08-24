#include <Arduino.h>

namespace {
constexpr uint32_t SERIAL_BAUD = 115200;
constexpr char FIRMWARE_NAME[] = "geradores-hul/hf-006enet";
constexpr char FIRMWARE_MODE[] = "read-only scaffold";
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(300);

  Serial.println();
  Serial.println(FIRMWARE_NAME);
  Serial.println(FIRMWARE_MODE);
  Serial.println("Modbus DSE7320: aguardando mapa Gencomm oficial");
  Serial.println("Reles e comandos de controle: bloqueados");
}

void loop() {
  delay(1000);
}
