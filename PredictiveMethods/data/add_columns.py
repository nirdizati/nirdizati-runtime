# this script adds the following necessary attributes to the training and test files
# "event_nr"
# "last" - whether the event is the last in the trace

import glob
import pandas as pd
import numpy as np
import os

#filenames = glob.glob("*.csv")
#filenames = [filename for filename in filenames if os.path.getsize(filename) > 0]

filenames = ["train_bpi12.csv"]
timestamp_col = "time" # column that indicates completion timestamp
#columns_to_remove = ["Brandveilig gebruik (melding)", "Responsible_actor"]
case_id_col = "case_id"

def add_all_columns(group):
    group = group.sort_values(timestamp_col, ascending=True)
    group["event_nr"] = range(1,group.shape[0]+1)
    group["last"] = "false"
    group["last"].iloc[-1] = "true"

    return group

for filename in filenames:
    print(filename)
    dtypes = {col:"str" for col in ["proctime", "elapsed", "label", "last"]} # prevent type coercion
    data = pd.read_csv(filename, sep=",", dtype=dtypes)
    #data = data.drop(columns_to_remove, axis=1)
    data[timestamp_col] = pd.to_datetime(data[timestamp_col])
    data = data.groupby(case_id_col).apply(add_all_columns)
    data.to_csv("%s_remtime"%filename, sep=",", index=False)
