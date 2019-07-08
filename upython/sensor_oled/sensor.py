import gc
from sensor_oled import Screen
gc.collect()
import machine
import utime
import ntptime
from metric import Metric, MetricsBuffer
import urequests
import ujson
gc.collect()
from globals import Const
from sensor_mqtt import Mqtt
SLEEP_TIME = 60  # 60 seconds


def main():
    # check if the device woke from a deep sleep
    if machine.reset_cause() == machine.DEEPSLEEP_RESET:
        print('woke from a deep sleep')
        Const.blink_led1(iterations=3)

    Const.blink_led1()
    Const.blink_led2()
    iteration = 0
    ext_temp = 0.0

    while True:
        Const.connect()

        # Every 60 iterations, update datetime
        if iteration % 60 == 0:
            iteration = 0
            ntptime.settime()
        else:
            iteration = iteration + 1

        # record new Metric
        m = Metric()
        m.measure()
        if m.isvalid():  # Add to buffer
            MetricsBuffer.append(m)

        # Unpile Metrics buffer until it is empty (IndexError raised)
        while True:

            try:
                # Get Metric from buffer
                m = MetricsBuffer.pop()

                # Send temperature measure
                topic = "metrics/temperature/casa/{}".format(Const.name())
                msg = "{{\"name\":\"{}\",\"type\":\"temperature\",\"value\":{:.2f},\"ts\":{:d}}}"\
                    .format(Const.id(), m.temperature(), m.timestamp())
                print("send message " + msg + " on topic " + topic)
                if Mqtt.send_message(topic=topic, message=msg):
                    Const.blink_led1()
                else:
                    MetricsBuffer.append(m)
                    break

                # Send humidity measure
                topic = "metrics/humidity/casa/{}".format(Const.name())
                msg = "{{\"name\":\"{}\",\"type\":\"humidity\",\"value\":{:.2f},\"ts\":{:d}}}"\
                    .format(Const.id(), m.humidity(), m.timestamp())
                if Mqtt.send_message(topic=topic, message=msg):
                    Const.blink_led1()

            except Exception as e:
                if isinstance(e, IndexError):
                    print("Metrics Buffer empty")
                else:
                    print("Error: {}".format(e))
                break

        # Update exterior temperature value
        try:
            print("launch request")
            resp = urequests.get('http://192.168.1.2/api/monitor/temperature/current')
            print("Decode json")
            response = ujson.loads(resp.text)
            print("iterate over records")
            for data in response:
                if data['_id'] == "EXTERIOR":
                    ext_temp = data['value']
                    Const.blink_led2(duration=30, iterations=3)

        except Exception as e:
            print("Error in getting exterior temperature: " + str(e))

        Screen.update_values(main_msg="{:.1f}ºC".format(m.temp),
                             sec_msg="ext: {:.1f}ºC".format(ext_temp))

        utime.sleep(SLEEP_TIME)

        # configure RTC.ALARM0 to be able to wake the device
        # rtc.irq(trigger=rtc.ALARM0, wake=machine.DEEPSLEEP)
        # set RTC.ALARM0 to fire after 10 seconds (waking the device)
        # rtc.alarm(rtc.ALARM0, 10000)
        # put the device to sleep
        # machine.deepsleep()


if __name__ == '__main__':
    main()

