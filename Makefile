
.PHONY: all provision si exec exec0 down clean dev front drush info phpcs phpcbf hooksymlink clang cinsp compval watchdogval drupalcheckval behat sniffers tests front behatdl behatdi browser_driver browser_driver_stop statusreportval contentgen kubeinstall kexec
.DEFAULT_GOAL := help
.NOTPARALLEL: kubeinstall deploy

# https://stackoverflow.com/a/6273809/1826109
%:
	@:

# Prepare enviroment variables from defaults
$(shell false | cp -i \.env.default \.env 2>/dev/null)
$(shell false | cp -i \.\/docker\/docker-compose\.override\.yml\.default \.\/docker\/docker-compose\.override\.yml 2>/dev/null)
include .env
export
# Set COMPOSE FILE
ifeq ($(PROJECT_ENV), dev)
	export COMPOSE_FILE=./docker/docker-compose.override.yml
endif

# Get user/group id to manage permissions between host and containers
LOCAL_UID := $(shell id -u)
LOCAL_GID := $(shell id -g)

# Evaluate recursively
CUID ?= $(LOCAL_UID)
CGID ?= $(LOCAL_GID)

# Define network name.
COMPOSE_NET_NAME := $(COMPOSE_PROJECT_NAME)_front

# Execute php container as regular user
php = docker-compose exec -T --user $(CUID):$(CGID) php ${1}
# Execute php container as root user
php-0 = docker-compose exec -T php ${1}

# Execute php container as regular user
node = docker-compose exec -T --user $(CUID):$(CGID) node ${1}
# Execute php container as root user
node-0 = docker-compose exec -T node ${1}

## Full site install from the scratch
all: | provision build si
## Full site install from the scratch
deploy_update: | provision build front update
## Provision enviroment
provision:
# Check if enviroment variables has been defined
ifeq ($(strip $(COMPOSE_PROJECT_NAME)),projectname)
	$(info Project name can not be default, please enter project name.)
	$(eval COMPOSE_PROJECT_NAME = $(strip $(shell read -p "Project name: " REPLY;echo -n $$REPLY)))
	$(shell sed -i -e '/COMPOSE_PROJECT_NAME=/ s/=.*/=$(COMPOSE_PROJECT_NAME)/' .env)
	$(info Please review your project settings and run `make all` again.)
	exit 1
endif

	@echo "COMPOSE_FILE=$(COMPOSE_FILE)"
	make -s down
# @echo "Updating containers..."
# docker-compose pull
	@echo "Build and run containers..."
	docker-compose up -d --remove-orphans

build:
ifeq ($(PROJECT_ENV), dev)
	@echo "PROJECT_ENV=$(PROJECT_ENV)"
	@echo "Installing composer dependencies, including dev ones"
	@if [ -d "web/sites/default" ]; then $(call php-0, chmod +w web/sites/default); fi
	@$(call php, composer install --prefer-dist)
else
	@echo "INSTALL_DEV_DEPENDENCIES set to FALSE or missing from .env"
	@echo "Installing composer dependencies, without dev ones"
	@if [ -d "web/sites/default" ]; then $(call php-0, chmod +w web/sites/default); fi
	@$(call php, composer install --prefer-dist -o --no-dev)
endif

# Execute front container function
front = docker run --rm -u $(CUID):$(CGID) -v $(shell pwd)/web/themes:/work -w /work/custom/$(THEME_NAME) $(IMAGE_FRONT) ${1}

## Build front tasks
front:
	@echo "Building front tasks..."
	docker pull $(IMAGE_FRONT)
	$(call front, npm install)
	$(call front, ./node_modules/.bin/gulp)
	$(call front)

## Build front on local
frontdev:
	@echo "Building front tasks..."
	$(call front, npm install)
	$(call front, ./node_modules/.bin/gulp serve)

## Install drupal
si:
	@echo "Installing from: $(PROFILE_NAME)"
	cp ./settings/settings.php ./web/sites/default/
	$(call php, drush si $(PROFILE_NAME) --config-dir=../config/sync --account-name=$(ADMIN_NAME) --account-mail=$(ADMIN_MAIL) --account-pass=$(ADMIN_PW) -y --site-name="$(SITE_NAME)" --site-mail="$(SITE_MAIL)" -y)

## Update Drupal
update:
	@echo "Updating from: $(PROJECT_INSTALL)"
	@$(call php, drush cr)
	@$(call php, drush updb -y)
	@$(call php, drush cim -y)
	@$(call php, drush cr)
	@$(call php, chown -R 1000:1000 oauth_keys)
	@$(call php, chmod 755 oauth_keys)
	@$(call php, chmod 600 oauth_keys/private.key)
	@$(call php, chmod 600 oauth_keys/public.key)

## Run shell in PHP container as regular user
exec:
	docker-compose exec --user $(CUID):$(CGID) php sh

## Run shell in PHP container as root
exec0:
	docker-compose exec php ash

down:
	@echo "Removing network & containers for $(COMPOSE_PROJECT_NAME)"
	@docker-compose down -v --remove-orphans --rmi local

## Validate codebase with phpcs sniffers to make sure it conforms https://www.drupal.org/docs/develop/standards
phpcs:
	@echo "Phpcs validation..."
	$(call php, ./vendor/bin/robo job:coding-standards)

## Fix codebase according to Drupal standards https://www.drupal.org/docs/develop/standards
phpcbf:
	@echo "CS fixing..."
	$(call php, ./vendor/bin/phpcs -i)
	$(call php, ./vendor/bin/robo job:coding-standards-fixer)

## Testing & Report
phpunit:
	@echo "Unittest & reports..."
	$(call php, ./vendor/bin/robo job:unit-tests)

coverage-report:
	@echo "Coverage & reports..."
	$(call php, ./vendor/bin/robo job:coverage-report)
	# $(call php, sed -i 's+/var/www/html+/srv/data/jenkins/jobs/archi-test-php/workspace+g' artifacts/phpunit/coverage.xml)

DIRS = web/core web/libraries web/modules/contrib web/profiles/contrib web/sites web/themes/contrib vendor

## Totally remove project build folder, docker containers and network
clean: info
ifneq ($(shell docker-compose ps -q php),'')
	$(eval SCAFFOLD = $(shell docker-compose exec -T --user $(CUID):$(CGID) php composer run-script list-scaffold-files | grep -P '^(?!>)'))
	@for i in $(SCAFFOLD); do if [ -e "web/$$i" ]; then echo "Removing web/$$i..."; rm -rf web/$$i; fi; done
endif
	make -s down
	@for i in $(DIRS); do if [ -d "$$i" ]; then echo "Removing $$i..."; docker run --rm -v $(shell pwd):/mnt $(IMAGE_PHP) sh -c "rm -rf /mnt/$$i"; fi; done
ifeq ($(shell docker-compose config --services | grep mysql),mysql)
	@if [ -d $(MYSQL_DATADIR) ]; then echo "Removing mysql data $(MYSQL_DATADIR) ..."; docker run --rm -v $(shell pwd):/mnt/2rm $(IMAGE_PHP) sh -c "rm -rf /mnt/2rm/$(DB_DATA_DIR)"; fi
endif

## Enable development mode and disable caching
dev:
	@echo "Dev tasks..."
	$(call php-0, chmod +w web/sites/default)
	@echo "Enabling devel module."
	@$(call php, drush -y -q en devel devel_generate)
	@echo "Change site mode to dev."
	@$(call php-0, ./vendor/bin/drupal site:mode dev)
	@$(call php, drush cr)

## Enable development mode and disable caching
prod:
	@echo "Prod tasks..."
	$(call php-0, chmod +w web/sites/default)
	@echo "Disable dev modules."
	@$(call php, drush -y -q pmu devel devel_generate)
	@echo "Change site mode to prod."
	@$(call php-0, ./vendor/bin/drupal site:mode prod -vvv)
	@$(call php, drush cr)

## Run drush command in PHP container. To pass arguments use double dash: "make drush dl devel -- -y"
drush:
	$(call php, $(filter-out "$@",$(MAKECMDGOALS)))
	$(info "To pass arguments use double dash: "make drush dl devel -- -y"")

composer:
	$(call php, $(filter-out "$@",$(MAKECMDGOALS)))
	$(info "To pass arguments use double dash: "make composer require ..."")