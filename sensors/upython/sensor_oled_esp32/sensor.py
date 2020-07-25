import gc
from sensor_oled import Screen
gc.collect()
from globals import Const
gc.collect()
import machine
import utime
import ntptime
gc.collect()
from metric import Metric, MetricsBuffer
gc.collect()

from sensor_mqtt import Mqtt
SLEEP_TIME_1 = 10  # 10 seconds
SLEEP_TIME_2 = 5   #  5 seconds


def main():
    # check if the device woke from a deep sleep
    if machine.reset_cause() == machine.DEEPSLEEP_RESET:
        print('woke from a deep sleep')
        Const.blink_led1(iterations=3)

    Const.blink_led1()
    Const.blink_led2()
    iteration = 0
    ext_temp = {}

    while True:

        iteration = 0

        # record new Metric
        m = Metric()
        m.measure()
        if m.isvalid():  # Add to buffer
            MetricsBuffer.append(m)

        # connect to wifi and update datetime
        if Const.connect():
            ntptime.settime()

            # Unpile Metrics buffer until it is empty (IndexError raised)
            while True:

                try:
                    # Get Metric from buffer
                    m = MetricsBuffer.pop()
                    gc.collect()

                    # Send temperature measure
                    topic = "metrics/temperature/casa/{}".format(Const.name())
                    msg = "{{\"name\":\"{}\",\"type\":\"temperature\",\"value\":{:.2f},\"ts\":{:d}}}"\
                        .format(Const.id(), m.temperature(), m.timestamp())
                    print("send message " + msg + " on topic " + topic)
                    if Mqtt.send_message(topic=topic, message=msg):
                        print("Temperature message sent.")
                        # Const.blink_led1()
                    else:
                        MetricsBuffer.append(m)
                        break

                    # Send humidity measure
                    topic = "metrics/humidity/casa/{}".format(Const.name())
                    msg = "{{\"name\":\"{}\",\"type\":\"humidity\",\"value\":{:.2f},\"ts\":{:d}}}"\
                        .format(Const.id(), m.humidity(), m.timestamp())
                    if Mqtt.send_message(topic=topic, message=msg):
                        print("Humidity message sent.")
                        # Const.blink_led1()

                except Exception as e:
                    if isinstance(e, IndexError):
                        print("Metrics Buffer empty")
                    else:
                        print("Error: {}".format(e))
                    break

            # Update exterior temperature value
            try:
                ext_temp = Const.ext_temp()

            except Exception as e:
                print("Error in getting exterior temperature: " + str(e))

            Screen.update_values(main_msg="{:.1f}ºC".format(m.temp),
                                 sec_msg="ext: {:.1f}ºC".format(ext_temp))

            Const.disconnect()

        # Update screen
        while iteration < 5:
            # Every 2 iterations, update bottom area
            if iteration % 2 == 0:
                Screen.update_bottom_area(ext_temp['temp'])
                utime.sleep(SLEEP_TIME_1)
            else:
                Screen.update_bottom_area(ext_temp['ts'])
                utime.sleep(SLEEP_TIME_2)
            iteration += 1

        gc.collect()


        # configure RTC.ALARM0 to be able to wake the device
        # rtc.irq(trigger=rtc.ALARM0, wake=machine.DEEPSLEEP)
        # set RTC.ALARM0 to fire after 10 seconds (waking the device)
        # rtc.alarm(rtc.ALARM0, 10000)
        # put the device to sleep
        # machine.deepsleep()


if __name__ == '__main__':
    main()

