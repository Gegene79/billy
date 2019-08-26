import gc
import machine
gc.collect()
import utime
gc.collect()
from umqtt.simple import MQTTClient
gc.collect()
import ujson
gc.collect()
import dht
gc.collect()
import network
gc.collect()
from math import isnan
gc.collect()


# Micropython | esp8266 Board
# 0|D3
# 2|D4 (also Led1 but inverse)*
# 4|D2
# 5|D1
# 9|SD2
# 10|SD3
# 12|D6
# 13|D7
# 14|D5
# 15|D8
# 16|D0 (also Led2 but inverse)*
# led = machine.Pin(2, machine.Pin.OUT)

#   Pantalla:
#    ----------------------------------------------
#   |     ^                                         |
#   |     |                                         |
#   |     44                                        |
#   |     |                                         |
#   |                                               |
#   |-----------------------------------------------|
#   |     ^                                         |
#   |     20                                        |
#    -----------------------------------------------

SLEEP_TIME = 600  # 10 minutes
UNIX_TS_CONVERT = 946684800  # necessary to convert 'epoch since 01-01-2000' to 'epoch since 01-01-1970'
DHT_PIN = 12 # D6
LED1_PIN = 2   # D4
# LED2_PIN = 16  # D0
LED1 = machine.Pin(LED1_PIN, machine.Pin.OUT)
# LED2 = machine.Pin(LED2_PIN, machine.Pin.OUT)
RTC = machine.RTC()
DHT = dht.DHT22(machine.Pin(DHT_PIN))
WLAN = network.WLAN(network.STA_IF)
WLAN_AP = network.WLAN(network.AP_IF)
with open('env.json') as fp:
    SECRETS = ujson.loads(fp.read())
    fp.close()
SENSOR_ID = SECRETS['sensor']['name'].upper()
client = MQTTClient(
        client_id=SENSOR_ID,
        server=SECRETS['mqtt']['host'],
        port=SECRETS['mqtt']['port'],
        user=SECRETS['mqtt']['user'],
        password=SECRETS['mqtt']['pass']
    )
WLAN_AP.active(False)

def main():
    temp = float('NaN')
    hum = float('NaN')
    blink_led1()

    while True:

        try:
            DHT.measure()
            temp = DHT.temperature()
            hum = DHT.humidity()

        except Exception as e:
            blink_led1()
            print("Error in main loop: {}".format(str(e)))

        if not isnan(temp) and not isnan(hum):

            topic = "metrics/temperature/casa/{}".format(SECRETS['sensor']['name'].lower())
            msg = "{{\"name\":\"{}\",\"type\":\"temperature\",\"value\":{:.2f}}}" \
                .format(SENSOR_ID, temp)

            topic2 = "metrics/humidity/casa/{}".format(SECRETS['sensor']['name'].lower())
            msg2 = "{{\"name\":\"{}\",\"type\":\"humidity\",\"value\":{:.2f}}}" \
                .format(SENSOR_ID, hum)

            try:
                if connect():
                    if client.connect() == 0:
                        client.publish(topic=topic, msg=msg, qos=1)
                        print("Published {} on topic {}".format(msg, topic))
                        client.publish(topic=topic2, msg=msg2, qos=1)
                        print("Published {} on topic {}".format(msg2, topic2))
                        client.disconnect()

            except Exception as e:
                blink_led1(iterations=3)
                print("Error while connecting and sending message: {}".format(str(e)))

            disconnect()

        utime.sleep(SLEEP_TIME)


def connect():
    """Connect to Wifi Network"""
    WLAN.active(True)
    if not WLAN.isconnected():
        print('Connecting to network')
        WLAN.connect(SECRETS['wifi']['essid'], SECRETS['wifi']['pass'])
        intent = 0
        while not WLAN.isconnected():
            print(".", end="")
            utime.sleep_ms(1000)
            intent = intent + 1
            if intent > 10:
                return False
            else:
                pass
    print('\nConnected. Network config:', WLAN.ifconfig())
    return True


def disconnect():
    '''Disconnect from wifi'''
    WLAN.disconnect()
    WLAN.active(False)


def blink_led1(duration=20, iterations=1):
    """Blink integrated led"""
    i = 0
    while i < iterations:
        i = i + 1
        LED1.off()
        utime.sleep_ms(duration)
        LED1.on()
        utime.sleep_ms(duration)

#
# def blink_led2(duration=20, iterations=1):
#     """Blink integrated led"""
#     i = 0
#     while i < iterations:
#         i = i + 1
#         LED2.off()
#         utime.sleep_ms(duration)
#         LED2.on()
#         utime.sleep_ms(duration)
#

main()
