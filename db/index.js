/*
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
*/

'use strict';

const async = require('async'),
	log = require('../libs/utils/log')(module),
	config = require('config'),
	Case = require('./models/case.js'),
	Event = require('./models/event.js'),
	db = {};

db.getSystemState = function(payload, callback) {
	const logName = payload.event.log;

	async.parallel({
			runningCases: (cb) => {
				Case.countByCondition({ finished: false, log: logName }, cb);
			},
			completedCases: (cb) => {
				Case.countByCondition({ finished: true, log: logName }, cb);
			},
			completedEvents: (cb) => {
				Event.countByCondition({log: logName }, cb);
			},
			averageCaseLength: (cb) => {
				Case.fieldAverage('$trace_length', {finished: true, log: logName }, cb);
			},
			averageRunningTime: (cb) => {
				Case.fieldAverage('$duration', {finished: true, log: logName}, cb);
			},
			outcomes: (cb) => {
				const outcomesConfig = config.get(logName)['methods']['outcomes'];
				const outcomes = Object.keys(outcomesConfig);

				async.map(outcomes, _getOutcomeStat(outcomesConfig, logName), (err, stats) => {
					if (err) {
						log.error(`Error during outcomes retrieving: ${err.message}`);
						return cb(err);
					}

					const info = {};
					// order is preserved
					for (let i = 0; i < outcomes.length; i++) {
						info[outcomes[i]] = stats[i];
					}

					return cb(null, info);
				});
			},
			table: (cb) => {
				Case.find({log: logName}, (err, docs) => {
					if (err) {
						log.error(`Error during retrieving all cases: ${err.message}`);
					}
					return cb(err, docs);
				})
			},
			row: (cb) => {
				if (!payload) {
					return cb(null, null);
				}

				Case.find({case_id: payload.event[_getCaseIdField(logName)], log: logName}, (err, doc) => {
					if (err) {
						log.error(`Error during retrieving case : ${err.message}, for payload ${payload}`);
					}
					// TODO handle when not exactly one result
					return cb(err, doc);
				})
			},
			remainingTimeCounts: (cb) => {
				_getDurationCount('$remaining_time', {"finished": false, log: logName}, [null], cb);
			},
			completedCaseDurationCounts: (cb) => {
				_getDurationCount('$duration', {"finished": true, log: logName}, [null], cb);
			},
			runningCaseDurationCounts: (cb) => {
				_getDurationCount('$duration', {"finished": false, log: logName}, [null], cb);
			},
			lengthDistributionCounts: (cb) => {
				Case.aggregate([
						{"$match": {"finished": true, log: logName} },
						{"$group":
							{ "_id": "$trace_length",
								"count": {"$sum": 1 }
							}
						}
					],
					(err, results) => {
						_handleBarChartResults(err, results, [null, 0], cb);
					});
			}
		},
		(err, allResults) =>  {
			allResults.log = logName;
			return callback(err, allResults);
		}
	);
};

function _getOutcomeStat(config, logName) {
	return function(outcome, callback) {
		const property = config[outcome]['property'];

		async.parallel({
			predictedNegative: (cb) => {
				Case.countByCondition({ finished: false, [property]: true, log: logName}, cb);
			},
			predictedPositive: (cb) => {
				Case.countByCondition({ finished: false, [property]: false, log: logName}, cb);
			},
			completedNegative: (cb) => {
				Case.countByCondition({ finished: true, [property]: true, log: logName}, cb);
			},
			completedPositive: (cb) => {
				Case.countByCondition({ finished: true, [property]: false, log: logName}, cb);
			}
		}, (err, outcomes) => {
			return callback(err, {
				['predicted']: [outcomes.predictedNegative, outcomes.predictedPositive],
				['completed']: [outcomes.completedNegative, outcomes.completedPositive]
			});
		});
	}
}

function _getDurationCount(field, condition, restrictedValues, cb) {
	const DAY_IN_MS = 24 * 3600 * 1000;
	Case.aggregate([
			{"$match": condition},
			{"$group": {
				"_id": {
					"$divide": [{
						"$subtract": [
							field,
							{"$mod": [field, DAY_IN_MS]}
						]},
						DAY_IN_MS
					]
				},
				"count": {"$sum": 1 }
			}
			}],
		(err, results) => {
			_handleBarChartResults(err, results, restrictedValues, cb);
		});
}

function _handleBarChartResults(err, results, restrictedValues, cb) {
	if (err) {
		log.error(`Error during calculating aggregation for bar chart: ${err.message}`);
		return cb(err);
	}

	if (!results) {
		log.warn(`Results are missing for aggregation.`);
		return cb(null);
	}

	let response = [];
	results.forEach(function(result) {
		if (!result || restrictedValues.includes(result._id)) {
			return;
		}

		response[result._id] = result.count;
	});

	return cb(err, response);
}

db.handleResults = function(results, callback) {
	const logName = results.payload.event['log'];
	const caseIdField = _getCaseIdField(logName);
	Case.findOne({ case_id: results.payload.event[caseIdField], log: logName }, (err, doc) => {
		if (err) {
			log.error(`Error during finding case in handling results: ${err.message}`);
			return callback(err);
		}

		if (!doc) {
			log.warn(`There is no case in db with id ${results.payload.event[caseIdField]}.`);
			return callback(new Error('There is no appropriate case in db'));
		}

		if (doc.finished === true) {
			log.warn(`Calculations for the results comes after last event. Case id: ${doc['case_id']}.`);
			return callback(new Error('Calculations comes after last event'));
		}

		// need to convert seconds to milliseconds in remaining time
		doc.remaining_time = 1000 * results.remainingTime;
		doc.completion_time = new Date(doc.last_event_time.getTime() + doc.remaining_time);
		doc.duration = doc.completion_time - doc.start_time;

		doc = _handleOutcomes(results.outcomes, doc, logName);

		doc.save((err) => {
			if (err) {
				log.error(`Error during saving case in handle results: ${err.message}`);
			}

			return callback(err);
		});
	});
};

function _handleOutcomes(outcomes, doc, logName) {
	Object.keys(outcomes).forEach(function(outcome) {
		doc[outcome] = outcomes[outcome];
		if (doc[outcome]) {
			const property = config.get(logName)['methods']['outcomes'][outcome]['property'];
			const threshold = config.get(logName)['methods']['outcomes'][outcome]['probabilityThreshold'];
			// under assumption that we have probability of negative class
			doc[property] = doc[outcome] > threshold;
		}
	});

	return doc;
}

db.consumeEvent = function(eventMessage, callback) {
	if (!eventMessage || !eventMessage.hasOwnProperty('last')) {
		log.warn(`Event message does not contain 'last' column: ${eventMessage}`);
		return callback(null);
	}

	// double check to ignore events for completed cases
	const caseIdField = _getCaseIdField(eventMessage['log']);
	Case.findOne({ case_id: eventMessage[caseIdField], log: eventMessage['log'] }, (err, doc) => {
		if (err) {
			log.error(`Error during finding case on consumeEvent: ${err.message}`);
			return callback(err);
		}

		if (doc && doc.finished === true) {
			log.warn(`Received event for completed case. Ignore it.`);
			return callback(null);
		}

		const event = new Event(eventMessage);

		async.series({
				handleEvent: function (cb) {
					if (event['event_nr'] === 1) {
						_handleFirstEvent(event, cb);
					} else {
						_handleEvent(event, cb);
					}
				},
				saveEvent: function(cb) {
					event.save((err) => {
						if (err) {
							log.error(`Error during saving event in consuming event: ${err.message}`);
						}

						return cb(err);
					})
				}
			},
			function(err) {
				return callback(err);
			}
		);
	});
};

function _handleFirstEvent(event, callback) {
	const timeField = config.get(event['log'])['timeField'];
	const caseData = {
		case_id: event[_getCaseIdField(event['log'])],
		log: event['log'],
		start_time: event[timeField].getTime(),
		last_event_time: event[timeField].getTime(),
		trace_length: 1,
		current_trace: [event[config.get(event['log'])['eventNameField']]]
	};

	// copy labels for logical outcomes to apply them when last event occur
	const outcomesConfig = config.get(event['log'])['methods']['outcomes'];
	Object.keys(outcomesConfig).forEach(function(name) {
		if (outcomesConfig[name]['type'] === 'logical') {
			const property = outcomesConfig[name]['property'];
			const label = outcomesConfig[name]['label'];
			caseData[label] = event[label];
		}
	});

	const newCase = new Case(caseData);

	newCase.save((err) => {
		if (err) {
			log.error(`Error during saving case in handle first event: ${err.message}`);
			return callback(err);
		}

		if (event['last'] === true) {
			return _handleLastEvent(event, callback);
		}

		return callback(null);
	});
}

function _handleEvent(event, callback) {
	const caseIdField = _getCaseIdField(event['log']);
	const eventNameField = config.get(event['log'])['eventNameField']

	Case.findOne({ case_id: event[caseIdField], log: event['log'] }, (err, doc) => {
		if (err) {
			log.error(`Error during finding case in handle event: ${err.message}`);
			return callback(err);
		}

		if (!doc) {
			log.warn(`There is no case in db with id ${event[caseIdField]} for event ${event[eventNameField]} (in handle event)`);
			return callback(null);
		}

		if (event['last'] === true) {
			return _handleLastEvent(event, callback);
		}

		const timeField = config.get(event['log'])['timeField'];
		doc.last_event_time = event[timeField].getTime();
		doc.trace_length += 1;
		doc.current_trace.push(event[config.get(event['log'])['eventNameField']]);
		doc.save((err) => {
			if (err) {
				log.error(`Error during saving case in handle event: ${err.message}`);
			}

			return callback(err);
		});
	});
}

function _handleLastEvent(event, callback) {
	const caseIdField = _getCaseIdField(event['log']);

	Case.findOne({ case_id: event[caseIdField], log: event['log'] }, (err, doc) => {
		if (err) {
			log.error(`Error during finding case in handle last event: ${err.message}`);
			return callback(err);
		}

		if (!doc) {
			log.warn(`Last event with case id: ${event[caseIdField]} does not have case in database`);
			return callback(null);
		}

		if (doc.finished) {
			log.warn(`The case has already finished. Received repeated last event: ${event[caseIdField]}`);
			return callback(null);
		}

		doc.finished = true;
		const timeField = config.get(event['log'])['timeField'];
		doc.last_event_time = event[timeField].getTime();
		doc.completion_time = event[timeField].getTime();
		doc.duration = doc.completion_time - doc.start_time;
		if (event['event_nr'] !== 1) {
			doc.trace_length += 1;
			doc.current_trace.push(event[config.get(event['log'])['eventNameField']]);
		}

		//apply business rules
		const outcomesConfig = config.get(event['log'])['methods']['outcomes'];
		Object.keys(outcomesConfig).forEach(function(name) {
			const outcome = outcomesConfig[name];
			if (outcome['type'] === 'temporal') {
				doc[outcome['property']] = doc[outcome['criterion']] > outcome['criterionThreshold'];
			} else if (outcome['type'] === 'logical') {
				doc[outcome['property']] = doc[outcome['label']];
			}

			doc[name] = null;
		});

		doc.remaining_events_count = 0;
		doc.path_completion = [];
		doc.remaining_time = null;
		doc.save((err) => {
			if (err) {
				log.error(`Error during saving case in handle last event: ${err.message}`);
			}

			return callback(err);
		});
	});
}

function _getCaseIdField(logName) {
	return config.get(logName)['caseIdField'];
}

module.exports = db;
