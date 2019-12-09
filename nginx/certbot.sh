#!/usr/bin/env sh

while :
do
	echo `date`" Renovar Certificados.";
	certbot certonly -v --agree-tos --domains "$DOMAIN" --email "$EMAIL" --no-eff-email --expand --noninteractive --webroot --webroot-path /certbot
	ret=$?;
	if [ $ret=0 ]; 
		then
		echo "Certificados renovados, recargar nginx."
		nginx -s reload
	else
		echo "Error en la renovación de certificados. Logs:"
		cat /etc/letsencrypt/certbot.log
	fi
	sleep 12h;
done;

#if [[ -f "/letsencrypt/live/$DOMAIN/privkey.pem" ]]; then
#    cp -f "/letsencrypt/live/$DOMAIN/privkey.pem" /usr/share/nginx/certificates/privkey.pem
#    cp -f "/letsencrypt/live/$DOMAIN/fullchain.pem" /usr/share/nginx/certificates/fullchain.pem
#fi