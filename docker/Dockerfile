FROM tuanhmt/php:7.3-fpm-alpine

# Copy composer json to build download dependencies
COPY ./src/composer.json ./
COPY ./src/composer.lock ./
COPY ./src/RoboFile.php ./

# Download depenedencies
RUN composer update && rm -rf ~/.composer

# Build scss in front-end
COPY --chown=www-data:www-data ./src/web ./web
RUN cd ./web/themes/custom/bycnit_sass && npm install && ./node_modules/.bin/gulp

# Copy codebase
COPY --chown=www-data:www-data ./src/ ./

# Copy default settings file
COPY --chown=www-data:www-data settings.php ./web/sites/default/

# Remove composer caches
RUN composer dump-autoload --no-scripts --no-dev --optimize

WORKDIR /var/www/html
