# Nirdizati Runtime
The Runtime component of Nirdizati provides a **dashboard-based predictive process monitoring engine**.
The [dashboard](http://dashboard.nirdizati.org) is updated periodically based on incoming streams of events.
However, unlike classical monitoring dashboards, Nirdizati does not focus on showing the current state of business process executions, but also their future state (e.g. when will each case finish).

<p align="center">
  <img alt="Nirdizati main user view" src="https://raw.githubusercontent.com/nirdizati/nirdizati-runtime/master/docs/nirdizati-runtime-UI.png">
</p>


## Quick Overview
The dashboard provides a list of both currently ongoing cases as well as completed cases.
For each case, it is also possible to visualize a range of summary statistics including the number of events in the case, its starting time and the time when the latest event in the case has occurred.
For the ongoing cases, Nirdizati Runtime provides the predicted values of the performance indicators the user wants to predict.
For completed cases, instead, it shows the actual values of the indicators.
In addition to the table view, the dashboard offers other visualization options, such as pie charts for case outcomes and bar charts for case durations.
For a more detailed description of the user interface, please refer to [this page](https://github.com/nirdizati/nirdizati-runtime/blob/master/docs/UI-Description.md).


## Who is this for?
Typical users of the Runtime component are process workers and operational managers.
They can set some process performance targets and subscribe to a stream of warnings and alerts generated whenever these targets are predicted to be violated.
Thus, Nirdizati will hopefully help them make informed, data-driven decisions to get a better control of the process executions.
This is especially beneficial for business processes where process participants have more leeway to make corrective actions (for example, in a lead management process).


## How do you make the predictions?
On the backend, Nirdizati uses predictive models pre-trained using data about historical process execution.
These models are based on the methods published in the past couple of years:
* [Complex Symbolic Sequence Encodings for Predictive Monitoring of Business Processes](https://eprints.qut.edu.au/87229/1/BPM2014.pdf) In Proceedings of BPM'2015 ([source code](https://github.com/annitrolla/Sequence-Encodings-for-Predictive-Monitoring))
* [Predictive Business Process Monitoring with Structured and Unstructured Data](https://kodu.ut.ee/~dumas/pubs/bpm2016predictivemonitoring.pdf) In Proceedings of BPM'2016 ([source code](https://github.com/irhete/PredictiveMonitoringWithText))
* [A Web-Based Tool For Predictive Process Analytics](http://nirdizati.org/wp-content/uploads/thesis_Nirdizati_training.pdf) Master's thesis of Kerwin Jorbina ([source code](https://github.com/nirdizati/nirdizati-training-frontend))

The latter work resulted in the creation of our sister project, [Nirdizati Training](http://training.nirdizati.com/). 


## Project setup
If you want to install Nirdizati Runtime on your server, please follow these steps:
* [Deploying a standard version](https://github.com/nirdizati/nirdizati-runtime/blob/master/docs/Project-setup-Kafka.md), powered by [Apache Kafka](https://kafka.apache.org)
* [Deploying a minimum viable version](https://github.com/nirdizati/nirdizati-runtime/blob/master/docs/Project-setup-MVP.md)


## Development
The Runtime component of Nirdizati is a joint effort by the [Software Engineering Research Group](http://sep.cs.ut.ee) of the University of Tartu and the [Business Process Management research group](https://www.qut.edu.au/research/research-projects/bpm) of Queensland University of Technology.
The development is maintained by [Andrii Rozumnyi](https://www.linkedin.com/in/rozumnyi), Simon Raboczi, [Ilya Verenich](https://www.linkedin.com/in/verenich), [Marcello La Rosa](http://www.marcellolarosa.com/) and [Marlon Dumas](http://kodu.ut.ee/~dumas), among others.
Credits also go to Alireza Ostovar, Dmitriy Velichko, Anastasiia Babash and Alexey Golovin.


## Contributing
Nirdizati’s development team welcomes contributions from universities and companies, as well as from interested individuals!
Good pull requests, such as patches, improvements, and new features, are a fantastic help.
They should remain focused in scope and avoid containing unrelated commits.
Please **ask first** if somebody else is already working on this or the core developers think your feature is in-scope for Nirdizati Runtime.
Generally, always have a related issue with discussions for whatever you are including.

