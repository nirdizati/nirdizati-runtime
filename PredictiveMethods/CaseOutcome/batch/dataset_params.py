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

case_id_col = {}
event_nr_col = {}
label_col = {}
pos_label = {}

static_cols = {}
dynamic_cols = {}
cat_cols = {}

cls_method = {}
n_estimators = {}
max_features = {}
learning_rate = {}

# BPI12 parameters
dataset = "bpi12"
case_id_col[dataset] = "sequence_nr"
event_nr_col[dataset] = "event_nr"
label_col[dataset] = "label"
pos_label[dataset] = "true"

static_cols[dataset] = ["AMOUNT_REQ"]
dynamic_cols[dataset] = ["proctime", "elapsed", "activity_name", "Resource"]
cat_cols[dataset] = ["activity_name", "Resource"]

cls_method[dataset] = "gbm"
n_estimators[dataset] = 250
max_features[dataset] = 0.4
learning_rate[dataset] = 0.03

# BPI15 parameters
dataset = "bpi15"
case_id_col[dataset] = "sequence_nr"
event_nr_col[dataset] = "event_nr"
label_col[dataset] = "label"
pos_label[dataset] = "true"

static_cols[dataset] = ["Responsible_actor", "SUMleges", "Aanleg", "Bouw",
                        "Brandveilig_melding", "Brandveilig_vergunning", "Handelen_strijd",
                        "Kap", "Milieu_melding", "Milieu_neutraal_wijziging", "Milieu_vergunning",
                        "Monument", "Reclame", "Sloop"]
dynamic_cols[dataset] = ["activity_name", "monitoringResource", "question", "Resource", "duration", "hour"]
cat_cols[dataset] = ["activity_name", "monitoringResource", "question", "Resource", "Responsible_actor"]

cls_method[dataset] = "gbm"
n_estimators[dataset] = 30
learning_rate[dataset] = 0.1

# BPI17 parameters
dataset = "bpi17"
case_id_col[dataset] = "sequence_nr"
event_nr_col[dataset] = "event_nr"
label_col[dataset] = "label2"
pos_label[dataset] = "true"

static_cols[dataset] = ["ApplicationType", "LoanGoal"]
dynamic_cols[dataset] = ["FirstWithdrawalAmount", "NumberOfTerms", "OfferedAmount", "activity_duration",
                         "activity_name", "Resource", "Action", "CreditScore", "EventOrigin", "hour"]
cat_cols[dataset] = ["activity_name", "Resource", "Action", "CreditScore", "EventOrigin",
                     "ApplicationType", "LoanGoal"]

cls_method[dataset] = "gbm"
n_estimators[dataset] = 150
max_features[dataset] = 0.15
learning_rate[dataset] = 0.1
