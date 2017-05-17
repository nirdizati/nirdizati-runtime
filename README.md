# VisualPredictiveMonitor
A Visual Framework for Predictive Monitoring of Business Processes


## Requirements
You need to have version of Node.js which supports ES6 (so at least 4.x). Also you need docker to be installed on your machine.


## Project Setup ##
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

## Configurations (need to be updated)##
You can configure an app by changing `config/default.json`.

You might need to configure options for `replayer`:

- accelerator (responsible for acceleration speed in comparison to real timestamps)
- test (whether to run events with constant test interval or according to real timestamps)
- testInterval (interval in ms between events in test mode or if difference between events is negative, i.e. log is not sorted be timestamp)

You might need to configure options for `log`:

- path (path to csv file including file itself)
- timeField (name of event timestamp field)
- timeFormat (format for time field. You can check explanation [here](https://momentjs.com/docs/#/parsing/string-format/))


## Run app ##
Run `NODE_ENV='development' NODE_PATH=. node server.js` for starting application server. 

Run `NODE_ENV='development' node libs/replayer.js` to start replayer send events to main app server. 

NOTE: In some cases you might need to use `nodejs` instead of `node`.

NOTE: `NODE_ENV='development'` is needed for better logging. Also, if you execute in `development` mode, 
then it will drop database and recreate queues for correct script calculation.
