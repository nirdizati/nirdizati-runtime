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

dataset = sys.argv[1]
label_col = sys.argv[2]

dataset_params = pd.read_json("../../data/dataset_params.json", orient="index", typ="series")
train = pd.read_csv("../../data/train_%s.csv" % dataset, dtype={'%s' % label_col: str}, sep=",", encoding="utf-8")
test = pd.read_csv("../../data/test_%s.csv" % dataset, dtype={'%s' % label_col: str}, sep=",", encoding="utf-8")

case_id_col = dataset_params[dataset][u'case_id_col']
event_nr_col = dataset_params[dataset][u'event_nr_col']
pos_label = dataset_params[dataset][u'CaseOutcome'][label_col][u'pos_label']

static_cols = dataset_params[dataset][u'CaseOutcome'][u'static_cols']
dynamic_cols = dataset_params[dataset][u'CaseOutcome'][u'dynamic_cols']
cat_cols = dataset_params[dataset][u'CaseOutcome'][u'cat_cols']

encoder_kwargs = {"event_nr_col": event_nr_col, "static_cols": static_cols, "dynamic_cols": dynamic_cols,
                  "cat_cols": cat_cols, "oversample_fit": False, "minority_label": "true", "fillna": True,
                  "random_state": 22}

cls_method = dataset_params[dataset][u'CaseOutcome'][label_col][u'cls_method']

if cls_method == "rf":
    cls_kwargs = {"n_estimators": dataset_params[dataset][u'CaseOutcome'][label_col][u'n_estimators'],
                  "max_features": dataset_params[dataset][u'CaseOutcome'][label_col][u'max_features'],
                  "random_state": 22}
elif cls_method == "gbm":
    cls_kwargs = {"n_estimators": dataset_params[dataset][u'CaseOutcome'][label_col][u'n_estimators'],
                  "learning_rate": dataset_params[dataset][u'CaseOutcome'][label_col][u'learning_rate'],
                  "random_state": 22}
else:
    print("Classifier method not known")

predictive_monitor = PredictiveMonitor(event_nr_col=event_nr_col, case_id_col=case_id_col,
                                       label_col=label_col, pos_label=pos_label,
                                       cls_method=cls_method, encoder_kwargs=encoder_kwargs, cls_kwargs=cls_kwargs)

predictive_monitor.train(train)

predictive_monitor.test(test, output_filename="output_%s_%s_%s_%s_%s.csv" % (dataset,label_col,cls_method,cls_kwargs['n_estimators'],cls_kwargs['learning_rate']))
