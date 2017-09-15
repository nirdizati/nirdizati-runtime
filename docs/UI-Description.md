For the demonstration purposes, the Nirdizati dashboard is currently processing two pre-defined event streams corresponding to the  [BPIC'2012 and BPIC'2017](https://www.win.tue.nl/bpi/doku.php?id=2017:challenge). Both logs originate from a financial institute and pertain to a loan application process. For the 2012 BPIC, we are using a classification model to predict whether the case duration will be within a certain threshold and a regression model to predict the remaining cycle time of an ongoing case. In addition, for the 2017 BPIC, we predict whether a customer will accept a loan offer via a classification model. All the predictions are updated automatically as new events arrive.

<p align="center">
  <b>Detail view:</b><br>
<img src="http://kodu.ut.ee/~ilyav/img/main-view.png" width="480">
</p>

<p align="center">
  <b>Case duration diagram:</b><br>
<img src="http://kodu.ut.ee/~ilyav/img/case-duration.png" width="480">
</p>

<p align="center">
  <b>Case outcome diagrams:</b><br>
<img src="http://kodu.ut.ee/~ilyav/img/outcomes.png" width="480">
</p>

The Detail view lists both currently ongoing cases as well as and already completed ones. For all process cases, we display descriptive statistics such as the number of elapsed events, the list of elapsed events in a given case (this field is hidden by default), case start time and the time of the latest event completion. For ongoing cases, additionally we estimate the predicted completion time, predicted case duration, the probability of a case to be "slow", i.e to take more time than a certain threshold and the probability of a case to be rejected, meaning that a customer will not accept the loan offer (only relevant for the 2017 BPI). For completed cases, instead, we show the actual completion time, actual case duration, and the actual case outcome, i.e whether the case has been "slow" and whether it has been rejected.

The Outcomes tab visualizes binary case outcomes for three types of cases: ongoing (outcome is predicted), completed (outcome is actual) and historical (over the dataset that was used to train the predictive models). As the models are currently only retrained once, the latter diagram is static.

The Case duration tab shows a histogram of case duration among ongoing and completed cases.

The Remaining time tab shows a histogram of remaining cycle time for ongoing process cases. Similarly, on the Case length tab, you will find case lengths in terms of the number of events.

The buttons in just above the Detail view table allow users to toggle pagination and table/list view, as well as to choose which columns to display and to export the current table to a file. The latter can be used to conveniently produce tailor-made statistics and visualizations not currently offered in the tool.