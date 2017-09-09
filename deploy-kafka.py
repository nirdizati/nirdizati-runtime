"""
Copyright (c) 2016-2017 The Nirdizati Project.
This file is part of "Nirdizati".

"Nirdizati" is free software; you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as
published by the Free Software Foundation; either version 3 of the
License, or (at your option) any later version.

"Nirdizati" is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this program.
If not, see <http://www.gnu.org/licenses/lgpl.html>.
"""

from subprocess import call, Popen
from sys import argv, exit
from time import sleep

if len(argv) != 5:
	sys.exit("Usage: python {} zookeeper_server:port bootstrap_server:port kafka_root nirdizati_root".format(argv[0]))

zookeeper_host, kafka_host, kafka_root, nirdizati_root = argv[1], argv[2], argv[3], argv[4]

""" Derived constants """
kafka_topics_sh                 = "{}/bin/kafka-topics.sh".format(kafka_root)
collate_events_py               = "{}/PredictiveMethods/collate-events.py".format(nirdizati_root)
case_outcome_py                 = "{}/PredictiveMethods/CaseOutcome/case-outcome-kafka-processor.py".format(nirdizati_root)
remaining_time_py               = "{}/PredictiveMethods/RemainingTime/remaining-time-kafka-processor.py".format(nirdizati_root)
join_events_with_predictions_py = "{}/PredictiveMethods/join-events-to-predictions.py".format(nirdizati_root)

def delete_topics(topics):
	for topic in topics:
        	return_code = call([kafka_topics_sh, "--zookeeper", zookeeper_host, "--delete", "--topic", topic])
        	if return_code != 0:
			print("Failed to delete {}; return code was {}".format(kafka_root, return_code))

def create_topics(topics):
	for topic in topics:
        	return_code = call([kafka_topics_sh, "--zookeeper", zookeeper_host, "--create", "--topic", topic, "--replication-factor", "1", "--partitions", "1"])
        	if return_code != 0:
                	exit("Failed to create {}; return code was {}".format(topic, return_code))

def create_prediction_processors(dataset, tag, outcomes):
	pids = []
        events_topic      = "events_" + dataset
        prefixes_topic    = "prefixes_" + dataset
        predictions_topic = "predictions_" + dataset
        pids.append(Popen(["python", collate_events_py, kafka_host, events_topic, prefixes_topic]))
	for outcome in outcomes:
		pids.append(Popen(["python", case_outcome_py, kafka_host, prefixes_topic, predictions_topic, tag, outcome["label_col"], outcome["json_key"]]))
	pids.append(Popen(["python", remaining_time_py, kafka_host, prefixes_topic, predictions_topic, tag]))
	pids.append(Popen(["python", join_events_with_predictions_py, kafka_host, prefixes_topic, predictions_topic, "events_with_predictions", str(len(outcomes) + 1)]))
	return pids

def terminate_pids(pids):
	for pid in pids:
		print("Terminate pid " + str(pid))
		pid.terminate()


""" Make sure we have empty Kafka topics. """
kafka_topics = ["events_bpi_12", "events_bpi_17", "prefixes_bpi_12", "prefixes_bpi_17", "predictions_bpi_12", "predictions_bpi_17", "events_with_predictions"]
delete_topics(kafka_topics)
create_topics(kafka_topics)

""" Keep track of all the subprocesses so that we can terminate them when escaping this main loop. """
pids = []
try:
	""" Start the pipeline processors """
	slow = {
		"label_col": "label",
		"json_key":  "slow_probability"
	}
	rejected = {
		"label_col": "label2",
		"json_key": "rejected_probability"
	}
	pids += create_prediction_processors("bpi_12", "bpi12", [slow])
	pids += create_prediction_processors("bpi_17", "bpi17", [slow, rejected])

	""" Start the server, then wait long enough for it to accept HTTP requests from the replayers. """
	pids.append(Popen(["node", "server-kafka.js"]))
	sleep(5)

	""" The server should be accepting HTTP requests by now, so start streaming the log events to it. """
	pids.append(Popen(["node", "libs/replayer.js"]))
	pids.append(Popen(["node", "libs/replayer.js", "bpi_17"]))

	""" Wait forever, i.e. until the process is interrupted. """
	while True:
		sleep(86400)

except EOFError as eofe:
	print("Error ", repr(eofe))
	terminate_pids(pids)

except KeyboardInterrupt as ki:
	print("Interrupt ", repr(ki))
	terminate_pids(pids)

