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
from tqdm import tqdm, tqdm_pandas

if len(sys.argv) != 4:
    sys.exit("Usage: python test_all_cases.py csv-test-file dataset-id label-column-id \n"
             "Example:python test_all_cases.py test_bpi17.csv bpi17 label")

testSet = sys.argv[1]
dataset = sys.argv[2]
label_col = sys.argv[3]

dataset_params = pd.read_json("../data/dataset_params.json", orient="index", typ="series")
test = pd.read_csv('%s' % testSet)

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

with open('../pkl/predictive_monitor_%s_%s.pkl' % (dataset,label_col), 'rb') as f:
    predictive_monitor.models = cPickle.load(f)

nr_unique_cases = len(test.groupby(case_id_col).nunique()) + 1
tqdm_pandas(tqdm(range(1, nr_unique_cases)))
results = test.groupby(case_id_col).progress_apply(predictive_monitor.test)
res = pd.DataFrame({case_id_col:results.index, '%s'%label_col:results.values})
res.to_csv("results_%s_%s.csv"%(dataset,label_col), index=False)
