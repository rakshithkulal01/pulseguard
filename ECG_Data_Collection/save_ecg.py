import serial
import pandas as pd
import time

PORT = "COM5"      # Change according to your Arduino
BAUD = 115200

ser = serial.Serial(PORT, BAUD)

print("Collecting ECG Data...")

samples = []

start = time.time()

DURATION = 60      # seconds

while time.time() - start < DURATION:

    try:
        value = ser.readline().decode().strip()

        if value != "-1":

            samples.append({
                "Time": round(time.time() - start, 3),
                "ECG": int(value)
            })

    except:
        pass

ser.close()

df = pd.DataFrame(samples)

df.to_csv("ECG.csv", index=False)

print("Saved", len(df), "samples.")