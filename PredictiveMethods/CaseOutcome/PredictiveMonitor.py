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

from batch.PredictiveModel import PredictiveModel
import numpy as np


class PredictiveMonitor():
    models = {}

    def __init__(self, event_nr_col, case_id_col, label_col, encoder_kwargs, cls_kwargs, pos_label=1, cls_method="rf"):

        self.event_nr_col = event_nr_col
        self.case_id_col = case_id_col
        self.label_col = label_col
        self.pos_label = pos_label

        self.cls_method = cls_method

        self.encoder_kwargs = encoder_kwargs
        self.cls_kwargs = cls_kwargs

    def train(self, dt_train, max_events=None):

        max_events = np.max(dt_train[self.event_nr_col]) if max_events is None else max_events
        self.max_events = max_events
        for nr_events in xrange(1, max_events):
            pred_model = PredictiveModel(nr_events=nr_events, case_id_col=self.case_id_col, label_col=self.label_col,
                                         cls_method=self.cls_method,
                                         encoder_kwargs=self.encoder_kwargs, cls_kwargs=self.cls_kwargs)

            pred_model.fit(dt_train)
            self.models[nr_events] = pred_model

    def test(self, dt_test):

        nr_events = len(dt_test)

        if nr_events not in self.models:
            print("For this prefix length, a model has not been trained!")
            return None

        # select relevant model
        pred_model = self.models[nr_events]

        # predict
        predictions_proba = pred_model.predict_proba(dt_test)

        for label_col_idx, label in enumerate(pred_model.cls.classes_):
            if label == self.pos_label:
                # output probability of a positive class
                print(np.round(predictions_proba[0, label_col_idx], decimals=3))
