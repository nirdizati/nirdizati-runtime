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
import batch.dataset_params as dataset_params
import cPickle

dataset = sys.argv[1]

train = pd.read_csv("../data/train_%s.csv" % dataset, sep=",", encoding="utf-8")

case_id_col = dataset_params.case_id_col[dataset]
event_nr_col = dataset_params.event_nr_col[dataset]

static_cols = dataset_params.static_cols[dataset]
dynamic_cols = dataset_params.dynamic_cols[dataset]
cat_cols = dataset_params.cat_cols[dataset]

encoder_kwargs = {"event_nr_col": event_nr_col, "static_cols": static_cols, "dynamic_cols": dynamic_cols,
                  "cat_cols": cat_cols, "fillna": True, "random_state": 22}

cls_method = dataset_params.cls_method[dataset]

if cls_method == "rf":
    cls_kwargs = {"n_estimators": dataset_params.n_estimators[dataset],
                  "random_state": 22}
elif cls_method == "gbm":
    cls_kwargs = {"n_estimators": dataset_params.n_estimators[dataset],
                  "learning_rate": dataset_params.learning_rate[dataset],
                  "random_state": 22}
else:
    print("Classifier method not known")

predictive_monitor = PredictiveMonitor(event_nr_col=event_nr_col, case_id_col=case_id_col,
                                       cls_method=cls_method, encoder_kwargs=encoder_kwargs, cls_kwargs=cls_kwargs)

predictive_monitor.train(train)

models = predictive_monitor.models

with open('predictive_monitor_%s.cpickle' % dataset, 'wb') as f:
    cPickle.dump(models, f, protocol=2)
