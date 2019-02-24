# crear un indice con todas las opciones por defecto:
curl -X PUT http://petitbilly:982/sensors

# Opcione para definir el mapping de un indice:
{
    "mappings" : {
        "_doc" : {
            "properties" : {
                "field1" : { "type" : "text" }
            }
        }
    }
}
