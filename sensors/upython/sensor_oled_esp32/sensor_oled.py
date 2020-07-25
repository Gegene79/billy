import machine
import ssd1306
from writer import Writer
import font_sensor_35
import font_sensor_20

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


class OledScreen():
    """Clase para gestionar la pantalla OLED"""

    SCL_PIN = 4  # D2
    SDA_PIN = 0  # D3

    def __init__(self):
        self.I2C = machine.I2C(scl=machine.Pin(self.SCL_PIN), sda=machine.Pin(self.SDA_PIN))
        self.OLED = ssd1306.SSD1306_I2C(128, 64, self.I2C, 0x3c)
        self.wri = Writer(self.OLED, font_sensor_35)
        self.wri_bottom = Writer(self.OLED, font_sensor_20)

    def clear_screen(self):
        self.OLED.fill(0)  # 0: black, 1: white
        self.OLED.show()

    def update_main_area(self, msg):
        Writer.set_textpos(self.OLED, row=0, col=0)
        self.wri.printstring(msg)
        # self.wri.printstring("{:.1f}".format(self.main_metric.hum) + '%')
        self.OLED.show()

    def update_bottom_area(self, msg):
        Writer.set_textpos(self.OLED, row=44, col=0)
        self.wri_bottom.printstring(msg)
        self.OLED.show()

    def update_values(self, main_msg, sec_msg):
        self.clear_screen()
        self.update_main_area(main_msg)
        self.update_bottom_area(sec_msg)


Screen = OledScreen()
