import machine
import dht
import network
import ujson
import utime
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

    DHT_PIN = 2    # D4
    LED1_PIN = 2   # D4
    LED2_PIN = 16  # D0
    LED1 = machine.Pin(LED1_PIN, machine.Pin.OUT)
    LED2 = machine.Pin(LED2_PIN, machine.Pin.OUT)
    RTC = machine.RTC()
    DHT = dht.DHT22(machine.Pin(DHT_PIN))
    WLAN = network.WLAN(network.STA_IF)

    def __init__(self):
        with open('env.json') as fp:
            self.SECRETS = ujson.loads(fp.read())
            fp.close()

    def connect(self):
        """Connect to Wifi Network"""
        print("Connect to Wifi...")
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

    def getToken(self):
        """Get token to connect to APIs"""
        pb_headers = {
            'Content-Type': 'application/json'
        }
        data_sent = {"type": "note", "title": title, "body": body}

        resp = urequests.post('http://192.168.1.2/api/users/login', data=json.dumps(data_sent), headers=pb_headers )
        print("Decode json")
        response = ujson.loads(resp.text)
        print("iterate over records")
        for data in response:
            if data['_id'] == "EXTERIOR":
                ext_temp = data['value']
                # Const.blink_led2(duration=30, iterations=3)

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
