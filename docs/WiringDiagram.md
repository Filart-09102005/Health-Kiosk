# Wiring Diagram

**Document Information**
* **Title**: Health Kiosk Wiring & Hardware Specification
* **Version**: 1.0.0
* **Author**: Health Kiosk Engineering Team
* **Project**: Health Kiosk Capstone
* **Firmware Version**: 1.0.0
* **Last Updated**: 2026-07-05
* **Review Status**: Draft

---

## 1. System Overview
The Health Kiosk relies on an Arduino Mega 2560 as the central MCU. It interfaces with four external sensors using I2C, UART, and proprietary digital protocols. 

> [!CAUTION]
> The Arduino Mega 2560 provides limited current on its 5V and 3.3V rails. If the combined peak current of the sensors exceeds ~400mA, an external regulated 5V power supply must be used to prevent MCU brownouts.

## 2. MCU Pin Assignments

| Pin / Port | Function | Connected Component |
| :--- | :--- | :--- |
| **5V** | System Power | HX711, TF-Luna, MLX90614 |
| **3.3V** | Logic Power | MAX30102 |
| **GND** | Common Ground | All Sensors |
| **SDA (Pin 20)** | I2C Data | MLX90614, MAX30102 |
| **SCL (Pin 21)** | I2C Clock | MLX90614, MAX30102 |
| **TX1 (Pin 18)** | UART1 Transmit | TF-Luna RX |
| **RX1 (Pin 19)** | UART1 Receive | TF-Luna TX |
| **D3** | Digital In | HX711 DOUT |
| **D2** | Digital Out | HX711 SCK |

---

## 3. Sensor Specifications

### Temperature (MLX90614)
* **Voltage**: 3.3V or 5V (Match sensor module variant; usually 5V for standard modules, 3.3V for bare IC).
* **Current**: ~2mA
* **Interface**: I2C (Address 0x5A)
* **Pins**: VIN, GND, SDA, SCL
* **Cable Length**: < 20cm (I2C capacitance limits). Use shielded twisted pair if longer.
* **Notes**: I2C pull-up resistors (4.7kΩ) are required. Most breakout boards include them.

### Weight (HX711)
* **Voltage**: 5V (Excitation voltage for load cells)
* **Current**: ~1.5mA
* **Interface**: Custom 2-wire serial
* **Pins**: VCC, GND, DT (D3), SCK (D2)
* **Cable Length**: Load cell leads should be kept as short as possible to prevent analog noise before the ADC. Digital leads (DT/SCK) < 50cm.
* **Notes**: Ensure the load cells are wired in a proper Wheatstone bridge configuration.

### Height (TF-Luna)
* **Voltage**: 5V
* **Current**: ~70mA (Peak 150mA during emission)
* **Interface**: UART (115200 baud)
* **Pins**: 5V, GND, TX (to Mega RX1), RX (to Mega TX1)
* **Cable Length**: UART allows longer cables. < 1 meter is highly reliable.
* **Notes**: Ensure TX connects to RX, and RX connects to TX.

### Heart Rate / SpO₂ (MAX30102)
* **Voltage**: 3.3V (Strict. 5V will destroy the IC logic).
* **Current**: ~1.2mA (Peak 50mA during LED pulses).
* **Interface**: I2C (Address 0x57)
* **Pins**: VIN (3.3V), GND, SDA, SCL
* **Cable Length**: < 15cm. I2C degradation severely impacts this sensor due to high-speed FIFO polling.
* **Notes**: Shares the I2C bus with the MLX90614.

---

## 4. Grounding & Power Budget
* **Star Grounding**: Connect all sensor grounds directly to a central ground point on the MCU or a dedicated ground bus rail to prevent ground loops. Do not daisy-chain ground wires.
* **Power Budget**: 
  * Total peak current: ~205mA. 
  * The Arduino Mega 5V regulator can safely supply this if powered via USB. If powered via VIN (12V barrel jack), the linear regulator will dissipate significant heat. USB power is recommended.
