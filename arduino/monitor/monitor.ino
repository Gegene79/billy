#include <Arduino.h>
#include <TimeLib.h>
#include <WiFi.h>
#include <WiFiUDP.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <DHT.h>
#define USE_SERIAL Serial
#define DHTPIN 15
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
DHT dht(DHTPIN, DHTTYPE);
WiFiClient wifiClient;
PubSubClient mqClient(wifiClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

const char* SSID = "bichito";     //  your network SSID (name)
const char* PASS = "";  // your network password
const char* NAME = "SALON";  // EMMA_PIERRE, SALON, HABITACION
const char* mqttServer = "192.168.1.2";
const int   mqttPort = 980;
const char* mqttUser = "fabien";
const char* mqttPassword = "vivifafa";
const char* TOPIC_BASE = "metrics/";
const char* TOPIC_PATH = "casa/";
enum metric_type { temperature = 0 , humidity = 1 };
const char* types[] = { "temperature", "humidity" };
const int uS_TO_S_FACTOR = 1000000;  /* Conversion factor for micro seconds to seconds */
const uint8_t TIME_TO_SLEEP = 5;        /* Time ESP32 will go to sleep (in seconds) */
RTC_DATA_ATTR int bootCount = 0;
#define LED_PIN 35


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

/*
 * Class created to hold metrics readings
 */
class metric {
  private:
    unsigned long date = NULL;
    metric_type type;
    float value = NULL;
    boolean isValidType = false;
    boolean isValidDate = false;
    boolean isValidValue = false;
    boolean isCommitted = false;

    float readSensor(){
      float value = NULL;
      if (ValidType()){
        if (type == temperature) {
          value = dht.readTemperature();
          Serial.print("Temperature: ");Serial.print(value);Serial.println(" ºC");
        }
        else if (type == humidity) {
          value = dht.readHumidity();
          Serial.print("Humidity: ");Serial.print(value);Serial.println(" %");
        }
        if (!isnan(value)){
          this->isValidValue = true;
        }
      }
      return value;
    }
    
  public:
    metric(metric_type type, unsigned long date, float value) {
      Serial.print("New metric(type,date,value) - ");Serial.println(toString());
      setType(type);
      this->date = date;
      this->isValidDate = true;
      this->value = value;
      this->isValidValue = true;
    }
    
    metric(metric_type type) {
      Serial.print("New metric(");Serial.print(type);Serial.print(") - ");Serial.println(toString());
      setType(type);
    }
    
    metric() {
    }

    String toString(){
      return "name: " + String(NAME) + ", type: " + String(types[this->type]) + ", date:" + this->date + ", value: " + this->value;
    }

    boolean init(metric_type type){
      this->date = NULL;
      this->value = NULL;
      this->isValidType = false;
      this->isValidDate = false;
      this->isValidValue = false;
      this->isCommitted = false;
      return setType(type);
    }

    boolean commit(){
      this->isCommitted = true;
    }
    
    boolean ValidType(){
      return this->isValidType;
    }

    boolean ValidDate(){
      return this->isValidDate;
    }

    boolean ValidValue(){
      return this->isValidValue;
    }
    
    boolean setType(metric_type type){
      this->type = type;
      this->isValidType = true;
      return true;
    }

    boolean setValue(float value){
      this->value = value;
      this->isValidValue = true;
      return true;
    }

    boolean setDate(unsigned long date){
      if (isnan(date) || (date < 1544990730)){
        Serial.print("Invalid date: ");Serial.println(date);
        return false;
      } else {
        this->date = date;
        this->isValidDate = true;
        return true;
      }
    }

    boolean readValue() {
      int retry = 0;
      float value = NULL;
      unsigned long date;

      value = readSensor();
      
      while (!ValidValue()) {
        
        if (retry > 10) {
          Serial.println("Failed to read from DHT sensor!");
          return false;
        }
        // Wait some time between measurements.        
        Serial.println("Bad read from DHT sensor, retry in 1 second.");
        delay(1000);
        retry++;
      }
      this->value = value;
      return true;
    }
    
    boolean retreiveDate() {
      unsigned long date = NULL;
      int retry = 0;
      date = timeClient.getEpochTime();
      
      while (!setDate(date)) {
        Serial.println("Invalid date: trying again.");
        timeClient.forceUpdate();
        delay(1000);
        date = timeClient.getEpochTime();
        if (retry > 10) {
          Serial.println("Failed to retreive date!!");
          return false;
        }
        retry++;
      }
      return true;
    }
    
    boolean isValid() {
      if (ValidDate() && ValidType() && ValidValue()){
        return true;
      }
      return false;
    }

    String getTopicPath() {
      String sname = String(NAME);
      sname.toLowerCase();
      String stype = String(types[this->type]);
      stype.toLowerCase();
      String result = String(TOPIC_BASE) + stype + "/" + String(TOPIC_PATH) + sname;
      return result;
    }
    
    String getPayload() {
      String message = "{\"name\":\"" + String(NAME) + "\",\"type\":\"" + this->type + "\",\"value\":" + this->value + ",\"ts\":" + this->date + "}";
      return message;
    }

    boolean send_results(){
      boolean result = false;
      int retry = 0;
      String payload_s = this->getPayload();
      String topic_s = this->getTopicPath();
      
      char payload[128];
      char topic[50];
      payload_s.toCharArray(payload,128);
      topic_s.toCharArray(topic,50);
      
      Serial.println("Connecting to MQTT broker...");
      mqClient.connect(NAME, NULL, NULL);
      
      while (!mqClient.connected()) {
        
        if (retry >= 10){
          Serial.print("\r\nFailed to connect to MQTT broker. Failed status: ");Serial.println(mqClient.state());
          mqClient.disconnect();
          return false;
        }
        else {
          Serial.print(".");
          delay(1000);
          retry++;
        }
      }
      Serial.print("Connected to broker. Sending message to: ");Serial.print(topic);
      Serial.print(", payload: ");Serial.println(payload);
      result = mqClient.publish(topic, payload);
      if (!result) {
        Serial.print("Error while sending message: ");Serial.println(payload_s);
      } 
      else {
        Serial.print("Message sent: ");Serial.println(payload_s);
      }
      mqClient.disconnect();
      return result;
  }

  float getValue(){
    return this->value;
  }
};

class MetricsBuffer {
  private:
    metric tableau[120];
    int current_measure = 0;
    
  public:
  
    MetricsBuffer() {
      this->current_measure = 0;
    }
    
    metric* fetch() {
      // JGsimpleClass* thisSimpleClass = &arrayInstances[1];
      metric* m = &this->tableau[this->current_measure];
      Serial.print("Fetching metric number ");Serial.print(this->current_measure);
      Serial.print(", metric: ");Serial.println((*m).toString());
      return m;
    }

    metric* fetch_new(metric_type type) {
      // JGsimpleClass* thisSimpleClass = &arrayInstances[1];
      Serial.print("New metric. ");
      metric* m = fetch();
      (*m).init(type);
      return m;
    }

    boolean commit(){
      if (this->current_measure < (sizeof(this->tableau)-1) ) {
        Serial.print("Committing metric number ");Serial.print(this->current_measure);
        Serial.print(", metric: ");Serial.println((this->tableau[this->current_measure]).toString());
        this->current_measure++;
      }
    }
    
    boolean next() {
      if (this->current_measure > 0) {
        this->current_measure--;
        Serial.print("Unpiling, current metric: ");Serial.println(this->current_measure);
        return true;
      }
      return false;
    }
    
    boolean hasNext() {
      if (this->current_measure > 0) {
        return true;
      }
      return false;
    }
};

// Keep metric buffer in RTC memory to survive deep sleep
//RTC_DATA_ATTR MetricsBuffer metrics;


void setup_wifi() {
  
  int retries = 0;
  Serial.print("Connecting to "); Serial.println(String(SSID));
  WiFi.begin(SSID, PASS);
  
  while (WiFi.status() != WL_CONNECTED) {
    
    if (retries >= 20){
      Serial.print("Wifi Status: ");Serial.println(WiFi.status());
      Serial.println("Disconnecting. Next attempt within 10 seconds.");
      WiFi.disconnect();
      delay(10000);
      setup_wifi();
    }
    
    retries++;
    delay(1000);
    Serial.print(".");
  }
  Serial.print("\nConnected to ");Serial.print(String(SSID));
  Serial.print(", IP address: ");Serial.println(WiFi.localIP());
}

void blink(){
  Serial.println("blink.");
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
  digitalWrite(LED_BUILTIN, HIGH);
}

struct metrica{
  unsigned long date;
  metric_type type;
  float value; 
};

metric m(humidity,0,0.0);
RTC_DATA_ATTR metrica m3 = { 0, temperature , 0.0 };

void setup() {
  // put your setup code here, to run once:
  boolean result = false;
  metric* record;
  
  Serial.begin(115200);
  delay(1000); //Take some time to open up the Serial Monitor
  // setup pin 5 as a digital output pin
  pinMode (LED_BUILTIN, OUTPUT);
  
  blink();
  bootCount++;
  Serial.println("Boot number: " + String(bootCount));
  //Print the wakeup reason for ESP32
  //print_wakeup_reason();

  Serial.println("-- Valor al despertar --");
  Serial.println(m.toString());
  Serial.print("Struct: value=");Serial.println(m3.value);
  
  setup_wifi();
  Serial.println("Wait.");
  delay(TIME_TO_SLEEP * 1000);

  blink();
  delay(200);
  blink();
  
  /*
  Serial.println("Disable wifi.");
  WiFi.mode(WIFI_OFF);
  btStop();
  */
  
  
  float VBAT = (150.0f/100.0f) * 3.30f * float(analogRead(34)) / 4096.0f;  // LiPo battery
  Serial.print("Voltage: ");Serial.print(VBAT);Serial.println(" V");
  
  
  dht.begin();

  Serial.println("-- Nuevo valor --");
  m.setValue(bootCount);
  m3.value = bootCount;
  Serial.println(m.toString());
  Serial.print("Struct: value=");Serial.println(m3.value);
  
  //metric m2(temperature);
  //m2.readValue();


  /*
  metric* m = metrics.fetch_new(humidity);
  (*m).readValue();
  
  (*m).retreiveDate();
  if ((*m).isValid()){
    metrics.commit();
  }

  m = metrics.fetch_new(temperature);
  (*m).readValue();
  (*m).retreiveDate();
  if ((*m).isValid()){
    metrics.commit();
  }
  */
  
  /*
  while (metrics.hasNext()){
    metrics.next();
    record = metrics.fetch();
    result = record->send_results();
    if (result) {
      Serial.print("Data sent to ");Serial.println((*record).getTopicPath());
    } else {
      Serial.print("Unable to send metric to ");Serial.println((*record).getTopicPath());
      metrics.commit(); //leave the current metric committed
      break;
    }
  }
  */
  
  blink();
  delay(200);
  blink();
  delay(200);
  blink();

  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_ON);
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  //Serial.println("Setup ESP32 to sleep for every " + String(TIME_TO_SLEEP) + " Seconds");

  Serial.println("-- Valor antes del deep sleep --");
  Serial.println(m.toString());
  Serial.print("Struct: value=");Serial.println(m3.value);
  
  Serial.println("Going to sleep now");
  WiFi.mode(WIFI_OFF);
  btStop();
  Serial.flush();
  
  esp_deep_sleep_start();
  Serial.println("This will never be printed");
}

void loop() {
  // put your main code here, to run repeatedly. Actually this will never be called.
}
