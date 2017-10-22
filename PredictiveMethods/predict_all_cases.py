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

import os
import sys
import pandas as pd
from functools import reduce


if len(sys.argv) != 4:
    sys.exit("Usage: python predict_all.py csv-test-file dataset-id label-column-id(s) \n"
             "Example: python predict_all.py test_bpi17.csv bpi17 label,label2")

testSet = sys.argv[1]
dataset = sys.argv[2]
label_cols = sys.argv[3].split(',')

dataset_params = pd.read_json("data/dataset_params.json", orient="index", typ="series")
case_id_col = dataset_params[dataset][u'case_id_col']

# add necessary columns
log = pd.read_csv("data/%s" % testSet)
log['label'] = 0
log['remtime'] = 0
log.to_csv("data/%s" % testSet, index=False)

os.chdir("CaseOutcome/")
print("Started case outcome predictions")
df = []
for label_col in label_cols:
    os.system("python test_all_cases.py ../data/%s %s %s" % (testSet, dataset, label_col))
    df.append(pd.read_csv("results_%s_%s.csv"%(dataset, label_col)))

os.chdir("../RemainingTime/")
print("Started remaining time predictions")
os.system("python test_all_cases.py ../data/%s %s" % (testSet, dataset))
df.append(pd.read_csv("results_%s_remtime.csv" % dataset))

os.chdir("../")
df_merged = reduce(lambda left,right: pd.merge(left,right,on=[case_id_col], how='outer'), df)
df_merged.to_csv("predictions_%s.csv" % dataset, index=False)
