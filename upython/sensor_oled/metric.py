
import utime
import ucollections
from globals import Const
MAX_BUFFER = 200
UNIX_TS_CONVERT = 946684800  # necessary to convert epoch since 01-01-2000 to epoch since 01-01-1970


class Metric:
    """Clase que gestiona metricas de temperatura y humedad"""

    def __init__(self):
        # if not isinstance(metric_type,self.Type):
        #    raise ValueError(f'expecting enum for type')
        # self.type = metric_type
        self.temp = float('NaN')
        self.hum = float('NaN')
        self.ts = 0
        self.unix_ts = 0

    def measure(self):
        try:
            print("Measure temperature and humidity")
            Const.DHT.measure()
            self.temp = Const.DHT.temperature()
            self.hum = Const.DHT.humidity()
            self.ts = utime.time()
            self.unix_ts = self.ts + UNIX_TS_CONVERT
            print(str(self))
        except Exception as e:
            print("Error while measuring: {}. Metric content: {}".format(e, self))

    def __str__(self):
        return "Metric temp={:.2f}, hum={:.2f}, ts={:d}, unix_ts={:d}, dt={}"\
            .format(self.temp, self.hum, self.ts, self.unix_ts, self.datetime())

    def isvalid(self):
        if self.temp == float('NaN') or self.hum == float('NaN') or self.unix_ts < 1562476593:
            print("Metric invalid")
            return False
        else:
            return True

    def temperature(self):
        return self.temp

    def humidity(self):
        return self.hum

    def timestamp(self):
        return self.unix_ts

    def datetime(self):
        t = utime.localtime(self.ts)  # (year, month, mday, hour, minute, second, weekday, yearday)
        return '{:04d}/{:02d}/{:02d}T{:02d}:{:02d}:{:02d}Z'.format(t[0], t[1], t[2], t[3], t[4], t[5])


class Metrics:
    """Buffer that holds Metrics instances"""

    def __init__(self):
        self.metrics_buffer = ucollections.deque((), MAX_BUFFER, 1)

    def append(self, m):
        try:
            self.metrics_buffer.append(m)
        except IndexError as e:
            print("Metrics buffer full: {}".format(e))

    def pop(self):
        return self.metrics_buffer.popleft()


MetricsBuffer = Metrics()
