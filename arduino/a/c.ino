void setup() {

    Serial.begin(115200);
    Serial.println("Initialization.");

    setup_wifi();
    timeClient.begin();
    timeClient.forceUpdate();
    mqClient.setServer(mqttServer, mqttPort);
    dht.begin();
}



void loop() {
    boolean result = false;
    mesure lectura_t(TYPE_TEMP);
    mesure lectura_h(TYPE_HUM);
    
    if (WiFi.status() != WL_CONNECTED){
      setup_wifi();
    }

    timeClient.update();
    
    lectura_t = read_value(TYPE_TEMP);
    if (lectura_t.isValid()) {
      metrics.put(lectura_t);
    }
    lectura_h = read_value(TYPE_HUM);
    if (lectura_h.isValid()) {
      metrics.put(lectura_h);
    }

    while (metrics.hasNext()){
      mesure m = metrics.fetch();
      result = send_results(m);
      if (result) {
        Serial.print("Data sent to ");Serial.println(m.getTopicPath());
        metrics.next();
      } else {
        Serial.print("Unable to send metric to ");Serial.println(m.getTopicPath());
        break;
      }
    }
    
    mqClient.loop();
    
    // wait until next time interval
    delay(INTERVAL);
}
