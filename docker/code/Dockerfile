FROM tuanhmt/php:7.3-fpm-alpine

ARG THEME_NAME=false
ARG PROJECT_ENV=dev

RUN mkdir -p /data
RUN mkdir -p /data/private

WORKDIR /data

ADD composer.json composer.json
ADD composer.lock composer.lock
COPY patches /data/patches

RUN if [ $PROJECT_ENV != "dev" ] ; then \
    composer install --prefer-dist -o --no-dev; \
    rm -rf /root/.composer; \
else \
    composer install --prefer-dist -o; \
    rm -rf /root/.composer; \
fi;

# COPY --chown=1000:1000 ./ /data/
WORKDIR /var/www/html
COPY scripts /data/scripts
COPY --chown=1000:1000 oauth_keys /data/oauth_keys
COPY settings /data/settings
COPY config /data/config
COPY web/modules/custom /data/web/modules/custom
COPY web/themes/custom /data/web/themes/custom
COPY samlconfig/config /data/vendor/simplesamlphp/simplesamlphp/config
COPY samlconfig/metadata /data/vendor/simplesamlphp/simplesamlphp/metadata
ADD settings/settings.php /data/web/sites/default/settings.php
ADD settings/services_prod.yml /data/web/sites/default/services.yml

WORKDIR /data/web/themes/custom/$THEME_NAME

RUN if [ $THEME_NAME != false ] ; then \
    npm install && ./node_modules/.bin/gulp; \
    rm -rf ./node_modules; \
else \
    rm -rf ./node_modules; \
fi;

WORKDIR /var/www/html
