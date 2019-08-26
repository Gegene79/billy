import gc
from writer import Writer
gc.collect()
import font_sensor_35
gc.collect()
import font_sensor_20
gc.collect()
import machine
gc.collect()
import utime
gc.collect()
from umqtt.simple import MQTTClient
gc.collect()
import ssd1306
gc.collect()
import ujson
gc.collect()
import dht
gc.collect()
import network
gc.collect()
import urequests
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

SLEEP_TIME_1 = 10  # 10 seconds
UNIX_TS_CONVERT = 946684800  # necessary to convert 'epoch since 01-01-2000' to 'epoch since 01-01-1970'
SCL_PIN = 4  # D2
SDA_PIN = 0  # D3
DHT_PIN = 12 # D6
LED1_PIN = 2   # D4
# LED2_PIN = 16  # D0
LED1 = machine.Pin(LED1_PIN, machine.Pin.OUT)
# LED2 = machine.Pin(LED2_PIN, machine.Pin.OUT)
DHT = dht.DHT22(machine.Pin(DHT_PIN))
WLAN = network.WLAN(network.STA_IF)
WLAN_AP = network.WLAN(network.AP_IF)
Token = ""
I2C = machine.I2C(scl=machine.Pin(SCL_PIN), sda=machine.Pin(SDA_PIN))
OLED = ssd1306.SSD1306_I2C(128, 64, I2C, 0x3c)
WRI = Writer(OLED, font_sensor_35)
WRI_BT = Writer(OLED, font_sensor_20)
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
    t = {}
    blink_led1()
    OLED.fill(0)  # 0: black, 1: white

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

                        try:
                            t = ext_temp()
                        except Exception as e:
                            blink_led1(iterations=2)
                            print("Error while getting ext temperature: {}".format(str(e)))

            except Exception as e:
                blink_led1(iterations=3)
                print("Error while connecting and sending message: {}".format(str(e)))

            disconnect()

        for i in range(15):
            if not isnan(temp):
                update_main_area("{:.1f}ºC".format(temp))
            if 'temp' in t:
                update_bottom_area("ext:  {:.1f}ºC ".format(t['temp']))
            utime.sleep(SLEEP_TIME_1)
            if 'ts' in t:
                update_bottom_area("{}/{}  {}:{}  ".format(t['ts'][2], t['ts'][1], t['ts'][3], t['ts'][4]))
            utime.sleep(SLEEP_TIME_2)


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
    """Disconnect from wifi"""
    WLAN.disconnect()
    WLAN.active(False)


def get_token():
    """Get token to connect to APIs"""

    global Token

    headers = {
        'Content-Type': 'application/json'
    }
    data = {
        "user": {
            "email": SECRETS['api']['email'],
            "password": SECRETS['api']['pass']
            }
        }

    resp = urequests.post(SECRETS['api']['base_url']+'/api/users/login', json=data, headers=headers)

    if resp.status_code == 200:
        data = ujson.loads(resp.text)
        Token = data['jwt']
        print('Got token.')
        # blink_led2(duration=30, iterations=3)
    else:
        print("Error while retrieving token: {}: {}".format(str(resp.status_code), resp.text))


def ext_temp():
    global Token
    if Token == "":
        get_token()

    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + Token
    }
    resp = urequests.get(SECRETS['api']['base_url'] + '/api/monitor/temperature/exterior/current', headers=headers)

    if resp.status_code == 200:
        data = ujson.loads(resp.text)
        for linea in data:
            if linea['name'] == "EXTERIOR":
                temp = linea['value']
                ts = utime.localtime(linea['timestamp']-UNIX_TS_CONVERT)
                obj = {'temp': temp, 'ts': ts}
                print("Exterior temperature: {}".format(str(obj)))
                resp.close()
                return obj
        resp.close()
        raise Exception("Exterior Temperature not found in response")

    elif resp.status_code == 401:
        resp.close()
        get_token()
        ext_temp()

    else:
        raise Exception("Received error "+str(resp.status_code)+": "+resp.text)


def update_main_area(msg):
    Writer.set_textpos(OLED, row=0, col=0)
    WRI.printstring(msg)
    OLED.show()


def update_bottom_area(msg):
    Writer.set_textpos(OLED, row=44, col=0)
    WRI_BT.printstring(msg)
    OLED.show()


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

