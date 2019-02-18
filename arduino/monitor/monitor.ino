#include <Arduino.h>
#include <TimeLib.h>
#include <WiFi.h>
#include <WiFiUDP.h>
#include <PubSubClient.h>
#include <NTPClient.h>
// #include <DHT.h>
#include <dht.h>
#define USE_SERIAL Serial
#define ADC_PIN 35

//#define DHTPIN 15
// #define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
//DHT dht(DHTPIN, DHTTYPE);
dht DHT;
#define DHT22_PIN 15

WiFiClient wifiClient;
PubSubClient mqClient(wifiClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

const char* SSID = "";     //  your network SSID (name)
const char* PASS = "";  // your network password
const char* NAME = "EXTERIOR";  // EMMA_PIERRE, SALON, HABITACION, EXTERIOR
const char* MQ_SERVER = "192.168.1.2";
const int   MQ_PORT = 980;
const char* MQ_USER = "";
const char* MQ_PASS = "";
const char* TOPIC_BASE = "metrics/";
const char* TOPIC_SENSOR = "sensors/";
const char* TOPIC_PATH = "casa/";
enum metric_type { temperature = 0 , humidity = 1 , voltage = 2};
const char* TYPES[] = { "temperature", "humidity", "voltage" };
const int uS_TO_S_FACTOR = 1000000;  /* Conversion factor for micro seconds to seconds */
const int TIME_TO_SLEEP = 300;     /* Time ESP32 will go to sleep (in seconds) */
const uint8_t METRICS_BUFFER = 200;
const unsigned long E1979 = 1546297200;
const uint8_t RETRY = 2;
/*
 * Data Structures
 */
  // Holds metric data
  struct metric{
    unsigned long date;
    metric_type type;
    float value;
  };

  // Holds sensor status data
  struct sensor_status{
    unsigned long date;
    uint8_t currentMetric;
    float Vbat;
    unsigned long bootcount;
    unsigned long uptime;
    uint8_t dth_errors;
    uint8_t mq_errors;
    uint8_t wifi_errors;
    uint8_t ntp_errors;
  };
  
/*
 * Data saved in RTC memory (survives deep sleep). Only 8 KB available.
 */
  RTC_DATA_ATTR sensor_status Status = {0,0,0.0,0,0,0,0,0,0};
  RTC_DATA_ATTR metric metrics[METRICS_BUFFER];
  unsigned long currentMillis = 0; // do not survive deep sleep
  

  /*
  Method to print the reason by which ESP32
  has been awaken from sleep
  */
  void print_wakeup_reason(){
    esp_sleep_wakeup_cause_t wakeup_reason;
  
    wakeup_reason = esp_sleep_get_wakeup_cause();
  
    switch(wakeup_reason)
    {
      case 1  : Serial.println("Wakeup caused by external signal using RTC_IO"); break;
      case 2  : Serial.println("Wakeup caused by external signal using RTC_CNTL"); break;
      case 3  : Serial.println("Wakeup caused by timer"); break;
      case 4  : Serial.println("Wakeup caused by touchpad"); break;
      case 5  : Serial.println("Wakeup caused by ULP program"); break;
      default : Serial.println("Wakeup was not caused by deep sleep"); break;
    }
  }

  String toString(metric m){
    return "name: " + String(NAME) + ", type: " + String(TYPES[m.type]) + ", date:" + m.date + ", value: " + m.value;
  }

  String printMetricsBuffer(){
    Serial.println("--- Metrics ---");
      for (uint8_t i=0; i<=Status.currentMetric; i++){
        Serial.print("metric ");Serial.print(i);Serial.print(": ");
        Serial.println(toString(metrics[i]));
      }
      Serial.println("--- fin Metrics ---");
  }

  /*
  float readSensor(metric_type type){
    float value = NULL;
    
    if (type == temperature) {
      value = dht.readTemperature();
      Serial.print("Temperature: ");Serial.print(value);Serial.println(" ºC");
    }
    else if (type == humidity) {
      value = dht.readHumidity();
      Serial.print("Humidity: ");Serial.print(value);Serial.println(" %");
    }
    else if (type == voltage) {
      //float VBAT = (150.0f/100.0f) * 3.30f * float(analogRead(34)) / 4096.0f;  // LiPo battery
      value = (150.0f/100.0f) * 3.30f * float(analogRead(ADC_PIN)) / 4096.0f;
      Serial.print("Battery voltage: ");Serial.print(value);Serial.println(" V");
    }
    return value;
  } */

  boolean readValues(float* result){
    uint8_t retry = 0;
    int chk = DHT.read22(DHT22_PIN);
      
    while (chk != DHTLIB_OK){
      Status.dth_errors++;
      switch (chk) {
        case DHTLIB_OK:  
          Serial.println("DHT: OK"); 
          break;
        case DHTLIB_ERROR_CHECKSUM: 
          Serial.println("DHT: Checksum error."); 
          break;
        case DHTLIB_ERROR_TIMEOUT: 
          Serial.println("DHT: Time out error."); 
          break;
        default: 
          Serial.println("DHT: Unknown error.");
          break;
      }
      if (retry > RETRY){
        Serial.println("DHT: Failed to read from sensor.");
        return false;
      }
      retry++;
      delay(2000);
      chk = DHT.read22(DHT22_PIN);
    }
    result[0] = (float) DHT.temperature;
    result[1] = (float) DHT.humidity;
    Serial.print("Temperature: ");Serial.print(result[0]);Serial.print("ºC, Humidity: ");Serial.print(result[1]);Serial.println("%");
    return true;
  }

  float readBatteryVoltage(){
    float value = (150.0f/100.0f) * 3.30f * float(analogRead(ADC_PIN)) / 4096.0f;
    Serial.print("Battery voltage: ");Serial.print(value);Serial.println(" V");
    return value;
  }
  /*  
  float readValue(metric_type type) {
    int retry = 0;
    float value = NULL;

    value = readSensor(type);
    
    while ((value == NULL) || isnan(value)) {
       
      if (retry > 2) {
        Status.dth_errors++;
        Serial.println("Failed to read from DHT sensor!");
        return value;
      }
      // Wait some time between measurements.        
      Serial.println("Bad read from DHT sensor, retry.");
      delay(2000);
      value = readSensor(type);
      retry++;
    }
    return value;
  }
  */
  String generateTopicPath(metric m) {
    String sname = String(NAME);
    sname.toLowerCase();
    String stype = String(TYPES[m.type]);
    stype.toLowerCase();
    String result = String(TOPIC_BASE) + stype + "/" + String(TOPIC_PATH) + sname;
    return result;
  }
  
  String generatePayload(metric m) {
    String message = "{\"name\":\"" + String(NAME) + "\",\"type\":\"" + TYPES[m.type] + "\",\"value\":" + m.value + ",\"ts\":" + m.date + "}";
    return message;
  }

  String generatePayload(sensor_status s) {
    String message = "{\"name\":\"" + String(NAME) + "\",\"V\":" + s.Vbat + ",\"boot\":" + s.bootcount + 
                   ",\"up\":" + s.uptime + ",\"dth\":" + s.dth_errors + ",\"mq\":" + s.mq_errors + 
                   ",\"wifi\":" + s.wifi_errors+ ",\"ntp\":" + s.ntp_errors+ ",\"p\":" + s.currentMetric + ",\"ts\":" + s.date + "}";
    return message;
  }

  boolean mq_connect(){
    boolean result = false;
    uint8_t retry = 0;
    
    Serial.print("Connecting to MQTT broker "+String(MQ_SERVER)+":"+String(MQ_PORT)+" as ");Serial.println(NAME);
    mqClient.setServer(MQ_SERVER,MQ_PORT);
    mqClient.connect(NAME);
    
    while (!mqClient.connected()) {
      
      if (retry > RETRY){
        Serial.print("\r\nFailed to connect to MQTT broker. Failed status: ");Serial.println(mqClient.state());
        Status.mq_errors++;
        mqClient.disconnect();
        return false;
      }
      else {
        Serial.print(".");
        delay(500);
        retry++;
      }
    };

    Serial.println("Connected to broker.");
    return true;
  }

  boolean send_results(){
    boolean result = false;
    metric m;
    uint8_t retry = 0;
    String payload_s;
    String topic_s;
    char payload[128];
    char topic[50];

    
    
    while(next()){
      Serial.print("metric: ");Serial.println(Status.currentMetric);
      m = metrics[Status.currentMetric];
      payload_s = generatePayload(m);
      topic_s = generateTopicPath(m);
      payload_s.toCharArray(payload,128);
      topic_s.toCharArray(topic,50);
      
      result = mqClient.publish(topic, payload);
      if (!result) {
        Serial.print("Error while sending message: ");Serial.println(payload_s);
        commit(m); // volver a dejar esa metrica
        break;
      } 
      else {
        Serial.print("Message sent: ");Serial.println(payload_s);
      }
    }
    return true;
  };

  boolean sendStatus(sensor_status s){
    String payload_s = generatePayload(s);
    char payload[128];
    payload_s.toCharArray(payload,128);
    Serial.print("Sending status: (");Serial.print(payload_s.length());Serial.print(") ");Serial.println(payload_s);
    return mqClient.publish(TOPIC_SENSOR, payload);
  }

  boolean commit(metric m){

    if ( m.date < E1979 || isnan(m.value)){
      return false;
    }
    
    if (Status.currentMetric < (METRICS_BUFFER-1) ) {
      Serial.print("Committing metric number ");Serial.println(Status.currentMetric);
      Status.currentMetric++;
    }
    return true;
  }
    
  boolean next() {
    if (Status.currentMetric > 0) {
      Status.currentMetric--;
      return true;
    }
    return false;
  }


  boolean setup_wifi() {
    
    int retries = 0;
    Serial.print("Connecting to "); Serial.println(String(SSID));
    WiFi.begin(SSID, PASS);
    
    while (WiFi.status() != WL_CONNECTED) {
      
      if (retries > 10){ // give it time...
        Status.wifi_errors++;
        Serial.println("Could not connect. Next attempt next wake-up.");
        WiFi.disconnect();
        return false;
      }
      Serial.print(".");
      retries++;
      delay(500);
    }
    Serial.print("\nConnected to ");Serial.print(String(SSID));
    Serial.print(", IP address: ");Serial.println(WiFi.localIP());
    return true;
  }

  /*
   * Get NTP datetime using NTPClient lib
   * Saved into RTC variable "date"
   */
  unsigned long getNTPDate(uint8_t _retry) {
    uint8_t retry = 0;
    timeClient.forceUpdate();
    unsigned long newdate = timeClient.getEpochTime();
    Serial.print("NTP date (1er intento): ");Serial.println(newdate);
    
    while (newdate < E1979) {
      Serial.print("Invalid date:");Serial.println(newdate);
      delay(500);
      timeClient.forceUpdate();
      newdate = timeClient.getEpochTime();
      
      if (retry > _retry) {
        Status.ntp_errors++;
        Serial.println("Failed to retreive date!!");
        return NULL;
      }
      retry++;
    }
    Status.date = newdate;
    currentMillis = millis();
    Serial.print("NTP date: ");Serial.println(Status.date);
    return newdate;
  };

  /*
   * Aproximate datetime using millis and RTC-saved datetime
   * Avoids connecting to wifi to retreive NTP datetime
   */
  unsigned long getAproxDate() {
    Status.date = Status.date + round((millis()-currentMillis)/1000);
    currentMillis = millis();
    Serial.print("Aprox date: ");Serial.println(Status.date);
    return Status.date;
  }

  /*
   * Blink builtin LED
   */
  void blink(uint8_t times){
    uint8_t veces = times;
    while (veces > 0) {
      digitalWrite(LED_BUILTIN, LOW);
      delay(200);
      digitalWrite(LED_BUILTIN, HIGH);
      delay(200);
      veces--;
    }
  }


/*
 * Runs once MCU wakes up from deep sleep
 */

void setup() {
  //pinMode (LED_BUILTIN, OUTPUT); // setup pin 5 as a digital output pin

  Status.bootcount++;
  currentMillis = millis();
  Status.date = Status.date + TIME_TO_SLEEP + round(currentMillis/1000);
  
  Serial.begin(115200);
  delay(100); //Take some time to open up the Serial Monitor
  Serial.print("Boot number: " + String(Status.bootcount));Serial.print(", date=");Serial.print(Status.date);Serial.print(", millis=");Serial.println(currentMillis);
  
  if (Status.bootcount == 1){ // on first boot, update hour
    if (setup_wifi()) {
      getNTPDate(10);
      if (mq_connect()){
          Status.Vbat = readBatteryVoltage();
          sendStatus(Status);
        }
        mqClient.disconnect();
    }
  }

  // Read sensor for humidity and temperature
  float results[2];
  readValues(results);
  metrics[Status.currentMetric].type = temperature;
  metrics[Status.currentMetric].value = results[0];
  metrics[Status.currentMetric].date = getAproxDate();
  commit(metrics[Status.currentMetric]);
  
  metrics[Status.currentMetric].type = humidity;
  metrics[Status.currentMetric].value = results[1];
  metrics[Status.currentMetric].date = getAproxDate();
  commit(metrics[Status.currentMetric]);

  if (Status.bootcount % 268 == 0) { // 5 mins x 268 = 24 hours -> every day
      if (setup_wifi()) {
        getNTPDate(RETRY);
        if (mq_connect()){
          send_results();
          Status.Vbat = readBatteryVoltage();
          sendStatus(Status);
        }
        mqClient.disconnect();
      }
  }

  if (Status.bootcount % 6 == 0) { // every 30 mins
      if (setup_wifi()) {
        if (mq_connect()){
          send_results();
          Status.Vbat = readBatteryVoltage();
          sendStatus(Status);
        }
        mqClient.disconnect();
      }
  }

  // prepare and go to sleep
  Serial.print("Going to sleep now for ");Serial.print(TIME_TO_SLEEP);Serial.println("s.");
  Serial.flush();
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);
  esp_sleep_enable_timer_wakeup((uint64_t) TIME_TO_SLEEP * uS_TO_S_FACTOR);
  WiFi.mode(WIFI_OFF);
  btStop();
  
  getAproxDate(); // update date with aproximation
  Status.uptime = Status.uptime + millis(); // update uptime
  esp_deep_sleep_start();
}

void loop() {
  // put your main code here, to run repeatedly. Actually this will never be called because of deepsleep.
}
