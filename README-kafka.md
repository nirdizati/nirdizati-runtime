# Nirdizati Runtime on Kafka #
This branch decouples Nirdizati's predictive methods to run as Kafka processors.  This allows multiple instances of the predictive methods, and distributing them across multiple machines.

## Requirements ##
You will need at least 11 terminal sessions, a web browser, and the Dockerized instances of MongoDB and Redis from the standard distribution of Nirdizati.

## Project Setup
Download Apache Kafka from ``https://kafka.apache.org`` to a directory of your choice henceforth called `$KAFKA_ROOT`.  Similarly, the root of the Nirdizati checkout will be called `$NIRDIZATI_ROOT`.

You must have a Zookeeper service running at `localhost:2181`.

```sh
cd $KAFKA_ROOT
bin/zookeeper-server-start.sh config/zookeeper.properties
```

You must have a Kafka broker running at `localhost:9092`.

```sh
cd $KAFKA_ROOT
bin/kafka-server-start.sh config/server.properties
```

Create the topics using (for instance) the following command lines:

```sh
cd $KAFKA_ROOT
bin/kafka-topics.sh --zookeeper localhost:2181 --create --topic bpi_12 --replication-factor 1 --partitions 1
bin/kafka-topics.sh --zookeeper localhost:2181 --create --topic bpi_17 --replication-factor 1 --partitions 1
bin/kafka-topics.sh --zookeeper localhost:2181 --create --topic predictions --replication-factor 1 --partitions 1
bin/kafka-topics.sh --zookeeper localhost:2181 --create --topic events_with_predictions --replication-factor 1 --partitions 1
```

Train the predictive methods:

```sh
cd $NIRDIZATI_ROOT
cd PredictiveMethods/CaseOutcome
python train.py bpi12 label  # generates predictive_monitor_bpi12_label.cpickle
python train.py bpi17 label  # generates predictive_monitor_bpi17_label.cpickle
python train.py bpi17 label2  # generates predictive_monitor_bpi17_label2.cpickle

cd PredictiveMethods/RemainingTime
python train.py bpi12 label  # generates predictive_monitor_bpi12_label.cpickle
python train.py bpi17 label  # generates predictive_monitor_bpi17_label.cpickle
```

## Run app ##

Launch the Kafka processors for the predictive methods using a separate terminal session for each of the following command lines:

```sh
cd $NIRDIZATI_ROOT
python PredictiveMethods/join-events-to-predictions.py localhost:9092 bpi_12 bpi_17 predictions events_with_predictions

cd PredictiveMethods/CaseOutcome
python case-outcome-kafka-processor.py bpi12 label localhost:9092 bpi_12 predictions
python case-outcome-kafka-processor.py bpi17 label localhost:9092 bpi_17 predictions
python case-outcome-kafka-processor.py bpi17 label2 localhost:9092 bpi_17 predictions

cd PredictiveMethods/RemainingTime
python remaining-time-kafka-processor.py bpi12 localhost:9092 bpi_12 predictions
python remaining-time-kafka-processor.py bpi17 localhost:9092 bpi_17 predictions
```

Launch the web UI using the following command line:

```sh
cd $NIRDIZATI_ROOT
NODE_ENV='development' NODE_PATH=. node server-kafka.js
```

Open a web browser to `http://localhost:8080`.

Replay the logs, each in a separate terminal session:

```sh
cd $NIRDIZATI_ROOT
NODE_ENV='development' node libs/replayer.js
NODE_ENV='development' node libs/replayer.js bpi_17
```

The web browser should begin to show updates.

![Dataflow diagram](dataflow.pdf)

## Utilities ##
You can monitor the `predictions` topic using the following command line:

```sh
cd $KAFKA_ROOT
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic predictions --from-beginning
```

There's no easy way to purge topics, other than deleting them and recreating them.
You must explicitly enable deletion by editing `$KAFKA_ROOT/config/server.properties` and ensuring that it includes `delete.topic.enable=true`.
The topics can then be deleted as follows:

```sh
cd $KAFKA_ROOT
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic bpi_12
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic bpi_17
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic predictions
bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic events_with_predictions
```
