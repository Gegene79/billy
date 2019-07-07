#!/usr/bin/env bash

 esptool.py --port /dev/tty.SLAB_USBtoUART write_flash --flash_size=detect -fm dio 0 ../../Downloads/esp8266-20190125-v1.10.bin

ampy -p /dev/tty.SLAB_USBtoUART put ./font/font_sensor_20.py font_sensor_20.py
ampy -p /dev/tty.SLAB_USBtoUART put ./font/font_sensor_35.py font_sensor_35.py
ampy -p /dev/tty.SLAB_USBtoUART put ./globals.py globals.py
ampy -p /dev/tty.SLAB_USBtoUART put ./main.py main.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor.py sensor.py
ampy -p /dev/tty.SLAB_USBtoUART put ./metric.py metric.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor_mqtt.py sensor_mqtt.py
ampy -p /dev/tty.SLAB_USBtoUART put ./sensor_oled.py sensor_oled.py
ampy -p /dev/tty.SLAB_USBtoUART put ./env.json env.json