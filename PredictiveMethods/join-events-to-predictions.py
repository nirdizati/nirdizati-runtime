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

import sys
import json
from kafka import KafkaProducer, KafkaConsumer

def fupdate(lhs, rhs):
    result = lhs
    result.update(rhs)
    return result

def reformat(x):
    y = {"payload":{"event":{}}}
    y["payload"]["event"].update(x)
    del y["payload"]["event"]["predictions"]
    y["remainingTime"] = x["predictions"]["remainingTime"]
    y["outcomes"] = { "slow_probability": x["predictions"]["label"] }
    if x["predictions"].get("label2") is not None:
        y["outcomes"]["rejected_probability"] = x["predictions"]["label2"]
    return y

if len(sys.argv) != 6:
    sys.exit("Usage: python join-events-to-predictions.py bootstrap-server:port events-topic predictions-topic events-with-predictions-topic prediction-quorum")

bootstrap_server, events, predictions, destination_topic, prediction_quorum = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])

consumer = KafkaConsumer(group_id='join({},{})'.format(events,predictions), bootstrap_servers=bootstrap_server, auto_offset_reset='earliest')
consumer.subscribe(topics=[events, predictions])
producer = KafkaProducer(bootstrap_servers=bootstrap_server)

cases = {}

""" Read from the Kafka topic """
for message in consumer:
    latest = {
        events: lambda x: x[-1],
        predictions: lambda x: x
    }.get(message.topic)(json.loads(message.value))

    log         = latest["log"]
    sequence_nr = latest["sequence_nr"]
    event_nr    = latest["event_nr"]

    if cases.get(log) is None:
        cases[log] = { sequence_nr: { event_nr: latest }}
    elif cases.get(log).get(sequence_nr) is None:
        cases[log][sequence_nr] = { event_nr: latest }
    elif cases.get(log).get(sequence_nr).get(event_nr) is None:
        cases[log][sequence_nr][event_nr] = latest
    else:
        if "predictions" in cases[log][sequence_nr][event_nr]:
            oldPredictions = cases[log][sequence_nr][event_nr]["predictions"]
        else:
            oldPredictions = {}
        cases[log][sequence_nr][event_nr].update(latest)
        if "predictions" in latest:
            cases[log][sequence_nr][event_nr]["predictions"] = fupdate(oldPredictions, latest["predictions"])
        if "_id" in cases[log][sequence_nr][event_nr] and len(cases[log][sequence_nr][event_nr]["predictions"]) == prediction_quorum:
            result = json.dumps(reformat(cases[log][sequence_nr][event_nr]))
            print(result)
            print
            producer.send(destination_topic, result)
            cases[log][sequence_nr] = { k:v for k,v in cases[log][sequence_nr].iteritems() if k > event_nr }
            if cases[log][sequence_nr] == {}:
                del cases[log][sequence_nr]
