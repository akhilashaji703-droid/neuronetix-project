import serial.tools.list_ports

def find_arduino_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        device = port.device.lower()
        # Match macOS, Linux, Windows
        if (
            "cu.usbmodem" in device or
            "tty.usbmodem" in device or
            "usbserial" in device or
            "ttyusb" in device or
            "ttyacm" in device
        ):
            return port.device
    return None

SERIAL_PORT = find_arduino_port()
SERIAL_BAUD_RATE = 115200