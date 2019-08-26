from globals import Const
from umqtt.simple import MQTTClient


class MQTT():
    """Clase que gestiona el envío de metricas"""

    def __init__(self):

        self.client = MQTTClient(
            client_id=Const.id(),
            server=Const.SECRETS['mqtt']['host'],
            port=Const.SECRETS['mqtt']['port'],
            user=Const.SECRETS['mqtt']['user'],
            password=Const.SECRETS['mqtt']['pass']
        )

    def send_message(self, message, topic):
        """Publish message to MQTT topic"""
        if Const.is_wifi_connected():
            if self.client.connect() == 0:
                # self.client.publish(topic=topic.encode('ascii'), msg=message.encode('ascii'), qos=1)
                self.client.publish(topic=topic, msg=message, qos=1)
                print("Published {} on topic {}".format(message, topic))
                self.client.disconnect()
                return True
            else:
                print("Could not connect to MQTT topic {}".format(topic))
                return False
        else:
            print("Not connected to wifi {}".format(Const.wifi_status()))
            return False


Mqtt = MQTT()
