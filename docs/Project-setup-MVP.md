# Nirdizati Runtime
This is a guide on how to install the basic version of Nirdizati Runtime that does not use Apache Kafka streaming platform.

## Requirements
You will need the following components:
* [Node.js](https://nodejs.org/en/), preferably version 8. If you have several node version installed use [nvm](https://github.com/creationix/nvm) for managing them.
* Python 2.7
* [Docker](https://www.docker.com) to create software containers
* A web browser
 

## Project Setup

First step is to run `npm --loglevel=error install` under main and src folders
(as currently there are two different packages.json for back and front-end) to install all packages. 
It is advisable to run this command after each git pull. Also, run `gulp prod` inside src folder.

Then you need container of mongodb database. For that run a command `docker run --name some-mongo -d -p 27017:27017 mongo`. 
You can replace `some-mongo` as it just a name of a container.

Given the name of the container is `some-mongo`, you can enter to container by running 
`docker exec -it some-mongo mongo dev`. It opens mongo shell inside container and switches to database 'dev'.
You don't need to create a schemas for collection (pattern of one document) as it will be created by the application. 
For detailed syntax of mongodb you may have a look at [documentation](https://docs.some-mongo.com/manual/introduction/).

`docker ps -a` outputs information aboout all containers. If status for some-mongo container is "Exited", run `docker start some_mongo`

If for some reason you would like to remove container, run `docker rm -f container_name`

Execute `docker run --name some-redis -d -p 6379:6379 redis redis-server --appendonly yes` to download redis container 
which is used for message queue mechanism. Again if you want to enter to already running container execute 
`docker exec -it some-redis redis-cli`

If you have production process manager `pm2` installed, you can run `sh deploy.sh` script to start the whole web-application 
including replayers of logs. 

If you don't have pre-trained predictive methods, create them by executing:

```sh
cd $NIRDIZATI_ROOT
cd PredictiveMethods/CaseOutcome
python train.py bpi12 label  # generates predictive_monitor_bpi12_label.pkl
python train.py bpi17 label  # generates predictive_monitor_bpi17_label.pkl
python train.py bpi17 label2  # generates predictive_monitor_bpi17_label2.pkl

cd PredictiveMethods/RemainingTime
python train.py bpi12  # generates predictive_monitor_bpi12.pkl
python train.py bpi17  # generates predictive_monitor_bpi17.pkl
```

If you have production process manager for Node.js [pm2](https://github.com/Unitech/pm2) installed then you can
use `deploy.sh` script for automatic deployment. However, it is more suitable for server deployment with load balancer (using NGINX) 
as it starts several server instances on different ports. If you run them locally, please comment unnecessary ones. 

## Run app
Run `NODE_ENV='development' NODE_PATH=. node server.js` for starting application server. 

Run `NODE_ENV='development' node libs/replayer.js` to start replayer send events to main app server. 

NOTE: In some cases you might need to use `nodejs` instead of `node`.

NOTE: `NODE_ENV='development'` is needed for better logging. On a server it is recommended to us `production` mode 
as it is faster. 

## Configurations (needs to be updated)
You can configure an app by changing `config/default.json` if you use development mode and `config/production.json` 
if you use production mode.

You might need to configure options for `replayer`:

- accelerator (responsible for acceleration speed in comparison to real timestamps)
- test (whether to run events with constant test interval or according to real timestamps)
- testInterval (interval in ms between events in test mode or if difference between events is negative, i.e. log is not sorted be timestamp)

You might need to configure options for `log`:

- path (path to csv file including file itself)
- timeField (name of event timestamp field)
- timeFormat (format for time field. You can check explanation [here](https://momentjs.com/docs/#/parsing/string-format/))
