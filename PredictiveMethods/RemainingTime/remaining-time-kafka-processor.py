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

from PredictiveMonitor import PredictiveMonitor
import pandas as pd
import sys
import cPickle
import json
from kafka import KafkaProducer, KafkaConsumer
from StringIO import StringIO

if len(sys.argv) != 5:
    sys.exit("Usage: python {} bootstrap-server:port events-topic predictions-topic dataset-name".format(sys.argv[0]))

bootstrap_server, events_topic, predictions_topic, dataset = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

dataset_params = pd.read_json("../data/dataset_params.json", orient="index", typ="series")

consumer = KafkaConsumer(events_topic, group_id='remainingTime({})'.format(dataset), bootstrap_servers=bootstrap_server, auto_offset_reset='earliest')
producer = KafkaProducer(bootstrap_servers=bootstrap_server)

""" Read from the Kafka topic """
for message in consumer:
    jsonValue = json.loads(message.value)

    s = StringIO(json.dumps(jsonValue))
    test = pd.read_json(s, orient='records')
    s.close()

    case_id_col = dataset_params[dataset][u'case_id_col']
    event_nr_col = dataset_params[dataset][u'event_nr_col']

    static_cols = dataset_params[dataset][u'RemainingTime'][u'static_cols']
    dynamic_cols = dataset_params[dataset][u'RemainingTime'][u'dynamic_cols']
    cat_cols = dataset_params[dataset][u'RemainingTime'][u'cat_cols']

    encoder_kwargs = {"event_nr_col": event_nr_col, "static_cols": static_cols, "dynamic_cols": dynamic_cols,
                      "cat_cols": cat_cols, "fillna": True, "random_state": 22}

    cls_method = dataset_params[dataset][u'RemainingTime'][u'cls_method']

    if cls_method == "rf":
        cls_kwargs = {"n_estimators": dataset_params[dataset][u'RemainingTime'][u'n_estimators'],
                      "max_features": dataset_params[dataset][u'RemainingTime'][u'max_features'],
                      "random_state": 22}
    elif cls_method == "gbm":
        cls_kwargs = {"n_estimators": dataset_params[dataset][u'RemainingTime'][u'n_estimators'],
                      "learning_rate": dataset_params[dataset][u'RemainingTime'][u'learning_rate'],
                      "random_state": 22}
    else:
        print("Classifier method not known")

    predictive_monitor = PredictiveMonitor(event_nr_col=event_nr_col, case_id_col=case_id_col,
                                           cls_method=cls_method, encoder_kwargs=encoder_kwargs, cls_kwargs=cls_kwargs)

    with open('PredictiveMethods/RemainingTime/predictive_monitor_%s.pkl' % dataset, 'rb') as f:
        predictive_monitor.models = cPickle.load(f)

    outcome = predictive_monitor.test(test)
    output = {
        "log":         jsonValue[-1]["log"],
        "case_id": jsonValue[-1]["case_id"],
        "event_nr":    jsonValue[-1]["event_nr"],
        "predictions": {
            "remainingTime": outcome
        }
    }
    print(json.dumps(output))
    producer.send(predictions_topic, json.dumps(output))
