/**
 * monitor.ino
 *
 *  Created on: 03.07.2016 by Fabien
 *
 */


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
const char* NAME = "HABITACION";
const char* mqttServer = "192.168.1.2";
const int   mqttPort = 980; 
const char* mqttUser = "fabien";
const char* mqttPassword = "vivifafa";
const char* TOPIC_BASE = "metrics/";
const String TYPE_TEMP = "temperature";
const String TYPE_HUM = "humidity";
const char* TOPIC = "casa/habitacion";
const long  INTERVAL = 60*1000; //60 seconds

/*
 * MESURE CLASS DEFINITION
 */
class mesure {
  private:
    unsigned long date;
    String type;
    float value;
    String topic;
 
  public:
    mesure(String type, unsigned long date, float value) {
      this->type = type;
      this->date = date;
      this->value = value;
    }

    mesure(String type) {
      this->type = type;
    }

    mesure() {
    }

    void setDate(unsigned long date){
      this->date=date;
    }

    void setValue(float value){
      this->value=value;
    }
    
    boolean isValid() {
      if ((this->type != TYPE_TEMP) && (this->type != TYPE_HUM)){
        Serial.print("Type is invalid: ");Serial.println(this->type);
        return false;
      }
      
      if (isnan(this->value)){
        Serial.print("Value is NaN: ");Serial.println(this->value);
        return false;
      }
      if ( isnan(this->date) || (this->date < 1544990730) ) {
        Serial.print("Date is NaN or < 1544990730 : ");Serial.println(this->date);
        return false;
      }
      return true;
    }

    String getTopicPath(){
      String topic = String(TOPIC_BASE) + this->type + "/" + String(TOPIC);
      return topic;
    }

    String getPayload(){
      String message = "{\"name\": \""+String(NAME)+"\", \"type\": \""+this->type+"\", \"value\": "+this->value+", \"timestamp\": "+this->date+" }";
      return message;
    }
};


class messageBuffer {
  private:
    mesure tableau[120];
    int current_measure = 0;
 
  public:
    messageBuffer() {
      this->current_measure = 0;
    }

    boolean put(mesure m){
      if (this->current_measure < sizeof(this->tableau)-1) {
        this->tableau[this->current_measure] = m;
        this->current_measure++;
        return true;
      }
      return false;
    }

    mesure pop(){
      mesure m = this->tableau[this->current_measure];
      if (this->current_measure > 0){
        this->current_measure--;
      }
      return m;
    }

    mesure fetch(){
      mesure m = this->tableau[this->current_measure];
      return m;
    }

    boolean next(){
      if (this->current_measure > 0){
        this->current_measure--;
        return true;
      }
      return false;
    }

    boolean hasNext(){
      if (this->current_measure > 0){
        return true;
      }
      return false;
    }
};

messageBuffer metrics;
