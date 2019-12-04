echo "certbot certonly \
        --config-dir /letsencrypt \
		--agree-tos \
		--domains "$DOMAIN" \
		--email "$EMAIL" \
        --no-eff-email \
		--expand \
		--noninteractive \
		--webroot \
		--webroot-path /certbot" \
	    || true

if [[ -f "/letsencrypt/live/$DOMAIN/privkey.pem" ]]; then
    cp -f "/letsencrypt/live/$DOMAIN/privkey.pem" /usr/share/nginx/certificates/privkey.pem
    cp -f "/letsencrypt/live/$DOMAIN/fullchain.pem" /usr/share/nginx/certificates/fullchain.pem
fi