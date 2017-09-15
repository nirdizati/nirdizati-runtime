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

def add_remtime_column(group):
    group = group.sort_values(timestamp_col, ascending=True)
    end_date = group[timestamp_col].iloc[-1]

    tmp = end_date - group[timestamp_col]
    tmp = tmp.fillna(0)
    group["remtime"] = tmp.apply(lambda x: float(x / np.timedelta64(1, 's'))) # s is for seconds

    return group

for filename in filenames:
    print(filename)
    dtypes = {col:"str" for col in ["label", "last"]} # prevent coercion to bool
    data = pd.read_csv(filename, sep=",", dtype=dtypes)
    #data = data.drop(columns_to_remove, axis=1)
    data[timestamp_col] = pd.to_datetime(data[timestamp_col])
    data = data.groupby(case_id_col).apply(add_remtime_column)
    data.to_csv("%s_remtime"%filename, sep=",", index=False)
