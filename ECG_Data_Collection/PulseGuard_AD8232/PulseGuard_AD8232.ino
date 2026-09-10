/*
 * =====================================================================
 * PulseGuard - AD8232 Real-Time ECG Acquisition Sketch
 * =====================================================================
 * Target: Arduino Uno / Nano / Mega / ESP32 (compatible)
 * Sensor: AD8232 Single-Lead Heart Rate Monitor
 *
 * Backend Requirement:
 * - Baud Rate: 115200 bps (backend/src/device/serialReader.js)
 * - Sampling Frequency: 100 Hz (1 sample every 10,000 microseconds / 10 ms)
 * - Window: 1000 samples = exactly 10 seconds of Lead II ECG
 * - Delimiter: CRLF ("\r\n") via Serial.println()
 * =====================================================================
 */

// Pin Definitions
const int PIN_ECG_OUTPUT = A0;   // AD8232 OUTPUT connected to Analog Pin A0
const int PIN_LO_PLUS    = 10;   // AD8232 Leads-Off Detection + (LO+)
const int PIN_LO_MINUS   = 11;   // AD8232 Leads-Off Detection - (LO-)

// Sampling Configuration for 100 Hz
const unsigned long SAMPLE_INTERVAL_MICROS = 10000; // 10,000 µs = 10 ms = 100 Hz
unsigned long previousMicros = 0;

void setup() {
  // Initialize hardware serial at 115200 baud matching Node.js serialReader.js
  Serial.begin(115200);

  // Configure Leads-Off detection pins
  pinMode(PIN_LO_PLUS, INPUT);
  pinMode(PIN_LO_MINUS, INPUT);

  // Configure analog reference if necessary (default 5V for Uno/Nano)
  pinMode(PIN_ECG_OUTPUT, INPUT);

  // Wait briefly for serial connection and AD8232 baseline stabilization
  delay(1000);
}

void loop() {
  unsigned long currentMicros = micros();

  // Precise non-blocking timing loop for exactly 100 Hz sampling
  if (currentMicros - previousMicros >= SAMPLE_INTERVAL_MICROS) {
    previousMicros += SAMPLE_INTERVAL_MICROS;

    // Check if electrode leads are disconnected
    bool leadsOff = (digitalRead(PIN_LO_PLUS) == HIGH) || (digitalRead(PIN_LO_MINUS) == HIGH);

    if (leadsOff) {
      // Send non-numeric flag so Node.js serialReader ignores disconnected lead artifacts
      Serial.println("LEADS_OFF");
    } else {
      // Read raw 10-bit ADC value (0 - 1023)
      int rawECG = analogRead(PIN_ECG_OUTPUT);

      // Send raw ADC reading followed by \r\n
      Serial.println(rawECG);
    }
  }
}
