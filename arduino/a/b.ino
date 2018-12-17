
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

mesure read_value(String type){
  int retry = 0;
  float value;
  mesure medida = mesure(type);
 
  while (retry < 10){
    
    if (type==TYPE_TEMP){
      value=dht.readTemperature();
    } else if (type==TYPE_HUM){
      value=dht.readHumidity();
    } else {
      Serial.print("Sensor type doesnot exist: ");Serial.println(type);
      return medida;
    }
    
    if (!isnan(value)){
      medida.setValue(value);
      medida.setDate(timeClient.getEpochTime());
      Serial.println(medida.getPayload());
      return medida;
    }
    // Wait some time between measurements.
    Serial.println("Bad read from DHT sensor, retry in 1 second.");
    delay(1000);
    retry++;
  }
  Serial.println("Failed to read from DHT sensor!");
  return medida;
}

 
boolean send_results(mesure lectura){
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
      return false;
    }
    else {
      Serial.print(".");
      delay(1000);
      retry++;
    }
  }
  Serial.println("Connected to broker. Sending message.");
  result = mqClient.publish(topic, payload);
  if (!result) {
     Serial.println("Error while sending message.");
  }
  return result;
}
