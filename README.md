# Drupal 9 + Reactjs Progressive Decoupled QuickStart
---

- [Drupal 9 + Reactjs Progressive Decoupled QuickStart](#drupal-9--reactjs-progressive-decoupled-quickstart)
  - [Introduction](#introduction)
  - [Prerequisite](#prerequisite)
    - [Environment variables](#environment-variables)
    - [Persistent DB volumn](#persistent-db-volumn)
    - [Change port](#change-port)
  - [Usage](#usage)
  - [Customize \& rebuild Reactjs](#customize--rebuild-reactjs)
  - [Generate demo content](#generate-demo-content)


## Introduction
Drupal QuickStart is starterkit for building a <a href="https://drupal.org/" target="_blank">Drupal</a> + <a href="https://reactjs.org/" target="_blank">Reactjs</a> Progressive Decoupled web application based on Docker.

## Prerequisite

* Install docker for <a href="https://docs.docker.com/install/" target="_blank">Linux</a>, <a href="https://docs.docker.com/docker-for-mac/install/" target="_blank">Mac</a>, <a href="https://docs.docker.com/docker-for-windows/install/" target="_blank">Windows</a>
* Install <a href="https://docs.docker.com/compose/install/" target="_blank">docker compose</a> version 1.21.0 or later
* Install make  for <a href="https://linuxhint.com/install-make-ubuntu/" target="_blank">Linux</a>, <a href="https://stackoverflow.com/questions/32127524/how-to-install-and-use-make-in-windows" target="_blank">Window</a>
* Install <a href="https://docs.npmjs.com/downloading-and-installing-node-js-and-npm" target="_blank">node, npm</a>, <a href="https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable" target="_blank">yarn</a>
* Copy **.env.default** to **.env**, more information about enviroment file can be found <a href="https://docs.docker.com/compose/env-file/" target="_blank">docs.docker.com</a> and following table.
* Copy **docker/docker-compose.override.yml.default** to **docker/docker-compose.override.yml**, update parts you want to overwrite.
  * **docker-compose.yml** contains the base requirements of a working Drupal site. It should not be updated.
* Run `make all` to start everything.

### Environment variables
Take a look to your .env file:
| Variable name   | Description             | Default value |
| --------------- | ----------------------- | ------------- |
| COMPOSE_FILE   | Path to a Compose file(s) | `./docker/docker-compose.yml:./docker/docker-compose.override.yml` |
| COMPOSE_PROJECT_NAME   | Your project name | - |
| PROFILE_NAME   | Profile used for site install | minimal |
| SITE_NAME  | Site name | Example |
| SITE_MAIL  | Site e-mail address | admin@example.com |
| ADMIN_NAME  | Admin username | admin |
| ADMIN_PW  | Admin username | 123456 |
| IMAGE_PHP | Php image to use | `tuanhmt/php:7.4-fpm` |
| IMAGE_NGINX | Image to use for nginx container | `tuanhmt/nginx:1.20-alpine` |
| IMAGE_MARIADB | Image to use for mariadb container | `mariadb:10.3` |
| MYSQL_DATABASE | Database name | `quickstart` |
| MYSQL_HOSTNAME | Database servername | `mariadb` |
| MYSQL_PASSWORD | Database password | `123456` |
| MYSQL_USER | Database username | `quickstart` |
| PROJECT_ENV | Environment mode | `dev` |
| CUID | User ID between host and containers | `1000` |
| CGID | Group ID between host and containers | `1000` |

### Persistent DB volumn

* Update `docker-compose.override.yml`, set
```yaml
mariadb:
  ...
  volumes:
    - db_data:/var/lib/mysql
...
```

### Change port

* Update `docker-compose.override.yml`, set
```yaml
nginx:
  ...
  ports:
    - "8888:80"
...
```

## Usage

* `make` - Show this info.
* `make all` - Full project install from the scratch.
* `make clean` - Totally remove project build folder, files, docker containers and network.
* `make down` - Stop and remove the containers.
* `make si` - Install/reinstall site.
* `make exec` - `docker exec` into php container.
* `make exec0` - `docker exec` into php container as root.
* `make drush [command]` - execute drush command.
* `make composer [command]` - execute composer command.

## Customize & rebuild Reactjs
* Go to `src` folder at `web/modules/custom/react_progressive/js/src` and run `yarn install` && `yarn build`.
## Generate demo content
* Run `make exec` to go into php container
* Run `drush genc 50 --bundles=article` to create 50 demo nodes with type article.
* Login to Drupal with admin role and see the result url: [http://locahost:8888/react-progressive/example](http://localhost:8888/react-progressive/example)