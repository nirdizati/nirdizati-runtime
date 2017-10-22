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

import pandas as pd
import numpy as np

filename = "PurchOrders.csv"  # CSV exported from XES
dataset = "PurchOrders"
dataset_params = pd.read_json("dataset_params.json", orient="index", typ="series")
case_id_col = dataset_params[dataset][u'case_id_col']
timestamp_col = dataset_params[dataset][u'timestamp_col'] # column that indicates completion timestamp
columns_to_remove = ["lifecycle:transition", "(case) variant-index", "(case) variant",
                     "(case) creator", "Variant index", "Variant",
                     "Days_Till_Next_Activity", "Key", "PurchOrder_ID",
                     "Part_ID", "Supplier_Location","concept:name"]

def add_all_columns(group):
    group = group.sort_values(timestamp_col, ascending=True)
    group["event_nr"] = range(1, group.shape[0] + 1)
    group["last"] = "false"
    group["last"].iloc[-1] = "true"

    start_date = group[timestamp_col].iloc[0]
    elapsed = group[timestamp_col] - start_date
    elapsed = elapsed.fillna(0)
    group["elapsed"] = elapsed.apply(lambda x: float(x / np.timedelta64(1, 's')))  # s is for seconds

    end_date = group[timestamp_col].iloc[-1]
    tmp = end_date - group[timestamp_col]
    tmp = tmp.fillna(0)
    group["remtime"] = tmp.apply(lambda x: float(x / np.timedelta64(1, 's')))  # s is for seconds

    dur = group[timestamp_col] - group[timestamp_col].shift(1)
    dur = dur.fillna(0)
    group["duration"] = dur.apply(lambda x: float(x / np.timedelta64(1, 's')))  # s is for seconds

    group["weekday"] = group[timestamp_col].dt.weekday
    group["hour"] = group[timestamp_col].dt.hour

    return group


def get_median_case_duration(data):
    case_durations = data.loc[data["event_nr"] == 1]
    return np.median(case_durations["remtime"])


def assign_label(group, threshold):
    group = group.sort_values(timestamp_col, ascending=True)
    case_duration = group["remtime"].iloc[0]
    group["label"] = "false" if case_duration < threshold else "true"
    return group


def split_data(data, train_ratio):
    # split into train and test using temporal split

    grouped = data.groupby(case_id_col)
    start_timestamps = grouped[timestamp_col].min().reset_index()
    start_timestamps = start_timestamps.sort_values(timestamp_col, ascending=True)
    train_ids = list(start_timestamps[case_id_col])[:int(train_ratio * len(start_timestamps))]
    train = data[data[case_id_col].isin(train_ids)].sort_values(timestamp_col, ascending=True)
    test = data[~data[case_id_col].isin(train_ids)].sort_values(timestamp_col, ascending=True)

    return train, test


# dtypes = {col: "str" for col in ["proctime", "elapsed", "label", "last"]}  # prevent type coercion
data = pd.read_csv(filename, sep=",")
data["Line_Total_Cost"] = data["Line_Total_Cost"].str.replace(',', '')  # in this column, commas were used as a thousands separator
data = data.drop(columns_to_remove, axis=1)
data[timestamp_col] = pd.to_datetime(data[timestamp_col])
data = data.groupby(case_id_col).apply(add_all_columns)

# get median case duration
median_case_duration = get_median_case_duration(data)

# assign class labels
data = data.groupby(case_id_col).apply(assign_label, median_case_duration)

train, test = split_data(data, 0.8)
train.to_csv("train_%s" % filename, sep=",", index=False)
test.to_csv("test_%s" % filename, sep=",", index=False)
