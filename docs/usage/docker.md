# Docker

You can run the timelimit server with docker. Here are two example configuration files:

## Important

Watch out to actually rebuild the images and restart the containers after updates (for example using `docker-compose up --build`).

## example docker-compose.yml with included database

```
# change the passwords and use https://docs.docker.com/compose/environment-variables/
# to keep sensitives value in a .env file while using ${VAR_NAME} here instead
version: '3'
services:
  api:
    build: /path/to/the/timelimit/source/code
    environment:
      NODE_ENV: production
      DATABASE_URL: mariadb://timelimit:timelimitpassword@database:3306/timelimit
      PORT: 8080
      MAIL_SENDER: me@my.timelimit.server
      MAIL_TRANSPORT: '{"host": "localhost", "port": 25}'
      ALWAYS_PRO: 'yes'
      # put additional config variables here
    ports:
     - "8080:8080"
    restart: always
    # you can enable logging during testing by commenting this out,
    # but logging is not needed when everything works
    logging:
      driver: none
    links:
    - database
  database:
    image: 'mariadb:10'
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: timelimit
      MYSQL_USER: timelimit
      MYSQL_PASSWORD: timelimitpassword
    volumes:
     - ./database:/var/lib/mysql
    # you can enable logging during testing by commenting this out,
    # but logging is not needed when everything works
    logging:
      driver: none
```

The database files will be saved at the folder which contains the docker-compose.yml.
You should change the passwords.

Docker starts both (TimeLimit and the database) at the same time,
so the TimeLimit server will crash a few times due to the missing database
before it starts working.

## example docker-compose.yml with external databases

```
# change the passwords and use https://docs.docker.com/compose/environment-variables/
# to keep sensitives value in a .env file while using ${VAR_NAME} here instead
version: '3'
services:
  api:
    build: /path/to/the/timelimit/source/code
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@example.com:5432/dbname
      PORT: 8080
      MAIL_SENDER: me@my.timelimit.server
      MAIL_TRANSPORT: '{"host": "localhost", "port": 25}'
      ALWAYS_PRO: 'yes'
      # put additional config variables here
    restart: always
    # you can enable logging during testing by commenting this out,
    # but logging is not needed when everything works
    logging:
      driver: none
    # easy solution to use a database which does not run within docker
    network_mode: "host"
    # otherwise:
    # redirect host port 9000 to guest port 8080 (to allow access to the API)
    # ports:
    #  - "9000:8080"
    # in case the database runs outside of docker and you don't want to use the host network mode, see
    # https://forums.docker.com/t/accessing-host-machine-from-within-docker-container/14248
    # or don't use docker ...
```
