# Data Annotator for Machine Learning (DAML) run with docker


## Tools used
Please go to [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/) to download the proper docker version for your machine.
- If your machine is **Windows / Mac** you can only use docker desktop, to run the application.
- If your machine is **Linux** you also need to download docker-compose. [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

## Start/End application

- If your machine already installed MongoDB, and you want to use that as the database. you need to download the [docker-compose-host-db.yml](docker-compose-host-db.yml) file and use it to run the DAML application.

  Start the containers:
    ```bash
    docker compose -f docker-compose-host-db.yml up
    ```
  End the containers:
  ```bash
  docker compose -f docker-compose.yml down
  ```

- Else you need to download the [docker-compose.yml](docker-compose.yml) file and use it to run the DAML application.

  Start the containers:
  ```bash
  docker compose -f docker-compose.yml up
  ```
  End the containers:
  ```bash
  docker compose -f docker-compose.yml down
  ```

## More commands
For more commands you can reference here [docker compose commands](https://docs.docker.com/engine/reference/commandline/compose/#child-commands).

## DAML application docker images
[https://hub.docker.com/search?q=vmware-daml-&type=image](https://hub.docker.com/search?q=vmware-daml-&type=image)