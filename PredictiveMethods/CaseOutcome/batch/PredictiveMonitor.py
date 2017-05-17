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

from PredictiveModel import PredictiveModel
import numpy as np
import os.path


class PredictiveMonitor():
    def __init__(self, event_nr_col, case_id_col, label_col, encoder_kwargs, cls_kwargs, pos_label=1, cls_method="rf"):

        self.event_nr_col = event_nr_col
        self.case_id_col = case_id_col
        self.label_col = label_col
        self.pos_label = pos_label
        self.cls_method = cls_method
        self.encoder_kwargs = encoder_kwargs
        self.cls_kwargs = cls_kwargs
        self.models = {}
        self.predictions = {}

    def train(self, dt_train, max_events=None):

        max_events = np.max(dt_train[self.event_nr_col]) if max_events is None else max_events
        self.max_events = max_events
        for nr_events in xrange(1, max_events + 1):
            pred_model = PredictiveModel(nr_events=nr_events, case_id_col=self.case_id_col, label_col=self.label_col,
                                         cls_method=self.cls_method,
                                         encoder_kwargs=self.encoder_kwargs, cls_kwargs=self.cls_kwargs)

            pred_model.fit(dt_train)
            self.models[nr_events] = pred_model

    def test(self, dt_test, output_filename=None, outfile_mode='w'):

        results = self._test_single_conf(dt_test)
        self.predictions = results

        if output_filename is not None:
            if not os.path.isfile(output_filename):
                outfile_mode = 'w'
            with open(output_filename, outfile_mode) as fout:
                if outfile_mode == 'w':
                    fout.write("sequence_nr,label,predictions_true,nr_prefixes\n")
                for item in self.predictions:
                    fout.write(
                        "%s,%s,%.4f,%s\n" % (item['case_name'], item['class'], item['prediction'], item['nr_events']))

    def _test_single_conf(self, dt_test):

        results = []
        case_names_unprocessed = set(dt_test[self.case_id_col].unique())
        max_events = min(np.max(dt_test[self.event_nr_col]), np.max(self.models.keys()))

        nr_events = 1

        # make predictions until there is at least one event ahead
        while len(case_names_unprocessed) > 0 and nr_events < max_events:

            # prepare test set
            dt_test = dt_test[dt_test[self.case_id_col].isin(case_names_unprocessed)]
            if len(dt_test[dt_test[self.event_nr_col] >= nr_events]) == 0:  # all cases are shorter than nr_events
                break
            elif nr_events not in self.models:
                nr_events += 1
                continue

            # select relevant model
            pred_model = self.models[nr_events]

            # predict
            predictions_proba = pred_model.predict_proba(dt_test)
            for label_col_idx, label in enumerate(pred_model.cls.classes_):
                if label == self.pos_label:
                    finished_idxs = np.where(predictions_proba[:, label_col_idx] >= 0)
                    for idx in finished_idxs[0]:
                        results.append({"case_name": pred_model.test_case_names.iloc[idx],
                                        "prediction": predictions_proba[idx, label_col_idx],
                                        "class": pred_model.test_y.iloc[idx],
                                        "nr_events": nr_events})

            nr_events += 1

        return (results)
