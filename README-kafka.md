# Nirdizati Runtime on Kafka #
This branch decouples Nirdizati's predictive methods to run as Kafka processors.  This allows multiple instances of the predictive methods, and distributing them across multiple machines.

## Requirements ##
You will need a web browser and the Dockerized instance of MongoDB from the standard distribution of Nirdizati.

## Project Setup
Download Apache Kafka from ``https://kafka.apache.org`` to a directory of your choice henceforth called `$KAFKA_ROOT`.  Similarly, the root of the Nirdizati checkout will be called `$NIRDIZATI_ROOT`.

You must have a Zookeeper service running at `localhost:2181`.

```sh
cd $KAFKA_ROOT
bin/zookeeper-server-start.sh config/zookeeper.properties
```

You must explicitly enable the deletion of Kafka topics by editing `$KAFKA_ROOT/config/server.properties` and ensuring that it includes `delete.topic.enable=true`.

You must have a Kafka broker running at `localhost:9092`.

```sh
cd $KAFKA_ROOT
bin/kafka-server-start.sh config/server.properties
```

You must install the Kafka client library for Python.

```sh
pip install kafka
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
The following script will create and start the dataflow depicted in Figure 1.

```sh
cd $NIRDIZATI_ROOT
NODE_ENV='development' python deploy-kafka.py localhost:2181 localhost:9092 $KAFKA_ROOT $NIRDIZATI_ROOT
```

Open a web browser to `http://localhost:8080`.

The web browser should begin to show updates.

![Figure 1: Dataflow diagram](dataflow.png)
