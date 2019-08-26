import gc
import machine
import dht
gc.collect()
import network
import ujson
import utime
gc.collect()
import urequests


# Micropython | Board
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


class Constant:
    """Clase para gestionar el wifi, las variables de entorno y el sensor DHT"""

    DHT_PIN = 10    # SD2
    LED1_PIN = 2   # D4
    LED2_PIN = 16  # D0
    LED1 = machine.Pin(LED1_PIN, machine.Pin.OUT)
    LED2 = machine.Pin(LED2_PIN, machine.Pin.OUT)
    RTC = machine.RTC()
    DHT = dht.DHT22(machine.Pin(DHT_PIN))
    WLAN = network.WLAN(network.STA_IF)
    WLAN_AP = network.WLAN(network.AP_IF)
    Token = ""

    def __init__(self):
        self.WLAN_AP.active(False)
        with open('env.json') as fp:
            self.SECRETS = ujson.loads(fp.read())
            fp.close()

    def connect(self):
        """Connect to Wifi Network"""
        self.WLAN.active(True)
        if not self.WLAN.isconnected():
            print('connecting to network...')
            self.WLAN.connect(self.SECRETS['wifi']['essid'], self.SECRETS['wifi']['pass'])
            intent = 0
            while not self.WLAN.isconnected():
                print(".", end="")
                utime.sleep_ms(1000)
                intent = intent + 1
                if intent > 10:
                    return False
                else:
                    pass
        print('\nConnected. Network config:', self.WLAN.ifconfig())
        return True

    def disconnect(self):
        self.WLAN.disconnect()
        self.WLAN.active(False)

    def get_token(self):
        """Get token to connect to APIs"""
        headers = {
            'Content-Type': 'application/json'
        }
        data = {
            "user": {
                "email": self.SECRETS['api']['email'],
                "password": self.SECRETS['api']['pass']
                }
            }

        resp = urequests.post(self.SECRETS['api']['base_url']+'/api/users/login', json=data, headers=headers)

        if resp.status_code == 200:
            data = ujson.loads(resp.text)
            self.Token = data['jwt']
            print('Got token.')
            Const.blink_led2(duration=30, iterations=3)
        else:
            print("Error "+str(resp.status_code)+": "+resp.text)

    def ext_temp(self):
        if self.Token == "":
            self.get_token()

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + self.Token
        }
        resp = urequests.get(self.SECRETS['api']['base_url'] + '/api/monitor/temperature/exterior/current', headers=headers)

        if resp.status_code == 200:
            data = ujson.loads(resp.text)
            print("iterate over records")
            for linea in data:
                if linea['name'] == "EXTERIOR":
                    temp = linea['value']
                    ts = linea['ts']
                    obj = {'temp': temp, 'ts': ts}
                    print("Exterior temperature: "+str(obj))
                    resp.close()
                    gc.collect()
                    return obj
            resp.close()
            raise Exception("Exterior Temperature not found in response")

        elif resp.status_code == 401:
            self.get_token()
            self.ext_temp()
            gc.collect()

        else:
            raise Exception("Received error "+str(resp.status_code)+": "+resp.text)

    def blink_led1(self, duration=20, iterations=1):
        """Blink integrated led"""
        i = 0
        while i < iterations:
            i = i + 1
            self.LED1.off()
            utime.sleep_ms(duration)
            self.LED1.on()
            utime.sleep_ms(duration)

    def blink_led2(self, duration=20, iterations=1):
        """Blink integrated led"""
        i = 0
        while i < iterations:
            i = i + 1
            self.LED2.off()
            utime.sleep_ms(duration)
            self.LED2.on()
            utime.sleep_ms(duration)

    def name(self):
        """Return sensor name in lower case"""
        return self.SECRETS['sensor']['name'].lower()

    def id(self):
        """Return sensor name in lower case"""
        return self.SECRETS['sensor']['name'].upper()

    def is_wifi_connected(self):
        return self.WLAN.isconnected()

    def wifi_status(self):
        return self.WLAN.status()


Const = Constant()
