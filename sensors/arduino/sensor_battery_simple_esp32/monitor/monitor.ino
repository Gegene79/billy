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
#define DHT22_PIN 17

WiFiClient wifiClient;
PubSubClient mqClient(wifiClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

const char* SSID = "";     //  your network SSID (name)
const char* PASS = "";  // your network password
const char* NAME = "EXTERIOR";  // EMMA_PIERRE, SALON, HABITACION, EXTERIOR
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 0, 0);
IPAddress primaryDNS(8, 8, 8, 8); //optional
IPAddress secondaryDNS(8, 8, 4, 4); //optional
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
const int TIME_TO_SLEEP = 600;       /* 600 Time ESP32 will go to sleep (in seconds) */
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
 
  String toString(metric m){
    return "name: " + String(NAME) + ", type: " + String(TYPES[m.type]) + ", date:" + m.date + ", value: " + m.value;
  }

  boolean readValues(metric* temp, metric* hum){
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
      delay(1000);
      chk = DHT.read22(DHT22_PIN);
    }
    temp->value = (float) DHT.temperature;
    hum->value = (float) DHT.humidity;
    Serial.print("Temperature: ");Serial.print(temp->value);Serial.print("ºC, Humidity: ");Serial.print(hum->value);Serial.println("%");
    return true;
  }

  float readBatteryVoltage(){
    //float value = (150.0f/100.0f) * 3.30f * float(analogRead(ADC_PIN)) / 4096.0f;
    float value = 2.0f * 3.30f * float(analogRead(ADC_PIN)) / 4096.0f;
    Serial.print("Battery voltage: ");Serial.print(value);Serial.println(" V");
    return value;
  }

  String generateTopicPath(metric m) {
    String sname = String(NAME);
    sname.toLowerCase();
    String stype = String(TYPES[m.type]);
    stype.toLowerCase();
    String result = String(TOPIC_BASE) + stype + "/" + String(TOPIC_PATH) + sname;
    return result;
  }
  
  String generatePayload(metric m) {
    String message = "{\"name\":\"" + String(NAME) + "\",\"type\":\"" + TYPES[m.type] + "\",\"value\":" + m.value + "}";
    return message;
  }

  String generatePayload(sensor_status s) {
    String message = "{\"name\":\"" + String(NAME) + "\",\"V\":" + s.Vbat + ",\"boot\":" + s.bootcount + 
                   ",\"up\":" + s.uptime + ",\"dth\":" + s.dth_errors + ",\"mq\":" + s.mq_errors + 
                   ",\"wifi\":" + s.wifi_errors+ ",\"ntp\":" + s.ntp_errors+ ",\"p\":" + s.currentMetric + "}";
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
        delay(200);
        retry++;
      }
    }

    Serial.println("Connected to broker.");
    return true;
  }

  boolean send_results(metric m){
    boolean result = false;
    String payload_s;
    String topic_s;
    char payload[128];
    char topic[50];

    payload_s = generatePayload(m);
    topic_s = generateTopicPath(m);
    payload_s.toCharArray(payload,128);
    topic_s.toCharArray(topic,50);
    
    result = mqClient.publish(topic, payload);
    if (result) { Serial.print("Message sent: ");Serial.println(payload_s);}
    else { Serial.print("Error while sending message: ");Serial.println(payload_s);} 

    return result;
  };

  boolean sendStatus(sensor_status s){
    String payload_s = generatePayload(s);
    char payload[128];
    payload_s.toCharArray(payload,128);
    Serial.print("Sending status: (");Serial.print(payload_s.length());Serial.print(") ");Serial.println(payload_s);
    return mqClient.publish(TOPIC_SENSOR, payload);
  }

  boolean setup_wifi() {
    
    int retries = 0;

    // Necesario para conectarse con IP estatica
    if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
      Serial.println("STA Failed to configure");
    }
    
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
      delay(200);
    }
    Serial.print("\nConnected to ");Serial.print(String(SSID));
    Serial.print(", IP address: ");Serial.println(WiFi.localIP());
    return true;
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
  
  Serial.begin(115200);
  //delay(100); //Take some time to open up the Serial Monitor
  //Serial.print("Boot number: " + String(Status.bootcount));
  
  // Read sensor for humidity and temperature
  metric temp;
  temp.type = temperature;
  metric hum;
  hum.type = humidity;
  readValues(&temp, &hum);
  
  if (setup_wifi()) {
    if (mq_connect()){
      send_results(temp);
      send_results(hum);
      Status.Vbat = readBatteryVoltage();
      sendStatus(Status);
    }
    mqClient.disconnect();
  }

  // prepare and go to sleep
  Serial.print("Going to sleep now for ");Serial.print(TIME_TO_SLEEP);Serial.println("s.");
  Serial.flush();
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);
  esp_sleep_enable_timer_wakeup((uint64_t) TIME_TO_SLEEP * uS_TO_S_FACTOR);
  WiFi.mode(WIFI_OFF);
  btStop();
  
  Status.uptime = Status.uptime + millis(); // update uptime
  esp_deep_sleep_start();
}

void loop() {
  // put your main code here, to run repeatedly. Actually this will never be called because of deepsleep.
}
