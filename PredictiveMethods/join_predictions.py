import glob
import os
import sys
import pandas as pd
from functools import reduce

if len(sys.argv) != 4:
    sys.exit("Usage: python test_all.py csv-test-file dataset-id label-column-id(s)")

testSet = sys.argv[1]
dataset = sys.argv[2]
label_col = sys.argv[3]

os.chdir("CaseOutcome/")
print("Started case outcome predictions")
os.system("python test_all.py ../data/%s %s %s" % (testSet, dataset, label_col))
filenamesCO = glob.glob("results_%s_*" % dataset)
filenamesCO = [filename for filename in filenamesCO if os.path.getsize(filename) > 0]
df = []
for x in range(len(filenamesCO)):
    df.append(pd.read_csv(filenamesCO[x]))

os.chdir("../RemainingTime/")
print("Started remaining time predictions")
os.system("python test_all.py ../data/%s %s" % (testSet, dataset))
df.append(pd.read_csv("results_%s_remtime.csv" % dataset))

os.chdir("../")
df_merged = reduce(lambda left,right: pd.merge(left,right,on=['case_id'], how='outer'), df)
df_merged.to_csv("results_merged_%s.csv" % dataset, index=False)
