#include <Arduino.h>
#include <TimeLib.h>
#include <ESP8266WiFi.h>
#include <WiFiUDP.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <DHT.h>
#define USE_SERIAL Serial
#define DHTPIN D1
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
DHT dht(DHTPIN, DHTTYPE);
WiFiClient wifiClient;
PubSubClient mqClient(wifiClient);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);
const char* SSID = "bichito";     //  your network SSID (name)
const char* PASS = "vivifafa";  // your network password
const char* NAME = "SALON";  // EMMA_PIERRE, SALON, HABITACION
const char* mqttServer = "192.168.1.2";
const int   mqttPort = 980;
const char* mqttUser = "fabien";
const char* mqttPassword = "vivifafa";
const char* TOPIC_BASE = "metrics/";
const String TYPE_TEMP = "temperature";
const String TYPE_HUM = "humidity";
const char* TOPIC_PATH = "casa/";
const long  INTERVAL = 60 * 1000; //60 seconds

class metric {
  private:
    unsigned long date = NULL;
    String type;
    float value = NULL;
    String topic;
    boolean isValidType = false;
    boolean isValidDate = false;
    boolean isValidValue = false;
    boolean isCommitted = false;

    float readSensor(){
      float value = NULL;
      if (ValidType()){
        if (type == TYPE_TEMP) {
          value = dht.readTemperature();
        }
        else if (type == TYPE_HUM) {
          value = dht.readHumidity();
        }
        if (!isnan(value)){
          this->isValidValue = true;
        }
      }
      return value;
    }

    void setTopic(String type){
      String b = String(NAME);
      b.toLowerCase();
      String a = String(TOPIC_BASE) + this->type + "/" + String(TOPIC_PATH) + b;
      this->topic = a;
      Serial.print("topic: ");Serial.println(this->topic);
    }
    
  public:
    metric(String type, unsigned long date, float value) {
      Serial.print("New metric(type,date,value) - ");Serial.println(toString());
      setType(type);
      this->date = date;
      this->isValidDate = true;
      this->value = value;
      this->isValidValue = true;
    }
    
    metric(String type) {
      Serial.print("New metric(type) - ");Serial.println(toString());
      setType(type);
    }
    
    metric() {
    }

    String toString(){
      return "name: " + String(NAME) + ", type: " + this->type + ", date:" + this->date + ", value: " + this->value;
    }

    boolean init(String type){
      this->date = NULL;
      this->value = NULL;
      this->topic = "";
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
    
    boolean setType(String type){
      if ((type==TYPE_TEMP) || (type==TYPE_HUM)){
        this->type = type;
        this->isValidType = true;
        setTopic(type);
        return true;
      }
      else {
        Serial.print("Sensor type does not exist: ");Serial.println(type);
        this->isValidType = false;
        return false;
      }
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
      return this->topic;
    }
    
    String getPayload() {
      String message = "{\"name\":\"" + String(NAME) + "\",\"type\":\"" + this->type + "\",\"value\":" + this->value + ",\"ts\":" + this->date + "}";
      return message;
    }
};

class messageBuffer {
  private:
    metric tableau[120];
    int current_measure = 0;
    
  public:
  
    messageBuffer() {
      this->current_measure = 0;
    }
    
    metric* fetch() {
      // JGsimpleClass* thisSimpleClass = &arrayInstances[1];
      metric* m = &this->tableau[this->current_measure];
      Serial.print("Fetching metric number ");Serial.print(this->current_measure);
      Serial.print(", metric: ");Serial.println((*m).toString());
      return m;
    }

    metric* fetch_new(String type) {
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

messageBuffer metrics;

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
};
 
boolean send_results(metric lectura){
  boolean result = false;
  int retry = 0;
  String payload_s = lectura.getPayload();
  String topic_s = lectura.getTopicPath();
  
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

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("Initialization.");

  setup_wifi();
  timeClient.begin();
  timeClient.forceUpdate();
  mqClient.setServer(mqttServer, mqttPort);
  dht.begin();
}

void loop() {
  // put your main code here, to run repeatedly:
  boolean result = false;
  metric* record;
  
  if (WiFi.status() != WL_CONNECTED){
    setup_wifi();
  }

  timeClient.update();

  metric* m = metrics.fetch_new(TYPE_HUM);
  (*m).readValue();
  (*m).retreiveDate();
  if ((*m).isValid()){
    metrics.commit();
  }

  m = metrics.fetch_new(TYPE_TEMP);
  (*m).readValue();
  (*m).retreiveDate();
  if ((*m).isValid()){
    metrics.commit();
  }
  
  while (metrics.hasNext()){
    metrics.next();
    record = metrics.fetch();
    result = send_results((*record));
    if (result) {
      Serial.print("Data sent to ");Serial.println((*record).getTopicPath());
    } else {
      Serial.print("Unable to send metric to ");Serial.println((*record).getTopicPath());
      metrics.commit(); //leave the current metric committed
      break;
    }
  }
  
  mqClient.loop();
  
  // wait until next time interval
  delay(INTERVAL);
}
