#!/usr/bin/env bash

esptool.py --chip esp32 --port /dev/tty.wchusbserial1410 erase_flash
esptool.py --port /dev/tty.wchusbserial1410 write_flash ../../../../../../Downloads/esp32-idf4-20191220-v1.12.bin

ampy -p /dev/tty.SLAB_USBtoUART put ./font/font_sensor_20.py font_sensor_20.py
ampy -p /dev/tty.SLAB_USBtoUART put ./font/font_sensor_35.py font_sensor_35.py
ampy -p /dev/tty.SLAB_USBtoUART put ./font/writer.py writer.py
ampy -p /dev/tty.SLAB_USBtoUART put ./globals.py globals.py
ampy -p /dev/tty.SLAB_USBtoUART put ./main.py main.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor.py sensor.py
ampy -p /dev/tty.SLAB_USBtoUART put ./metric.py metric.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor_mqtt.py sensor_mqtt.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor_oled.py sensor_oled.py
ampy -p /dev/tty.SLAB_USBtoUART put ./env.json env.json
