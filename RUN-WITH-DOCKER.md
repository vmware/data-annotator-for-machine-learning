# Data Annotator for Machine Learning (DAML) run with docker


## Tools used
Please go to [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/) to download the proper docker version for your machine.
- If your machine is **Windows / Mac** you can only use docker desktop, to run the application.
- If your machine is **Linux** you also need to download docker-compose. [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

## Start application
Before run the application you need to download the [docker-compose.yml](docker-compose.yml) file, and save it to your local machine folder.

You can use below command to create and start the containers.
```bash
docker compose up
```

## End application
You can use below command to stop and remove the containers.
```bash
docker compose down
```

For more commands you can reference here [docker compose commands](https://docs.docker.com/engine/reference/commandline/compose/#child-commands).