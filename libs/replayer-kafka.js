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

const appRoot = require('app-root-path'),
	config = require('config'),
	csv = require('fast-csv'),
	fs = require('fs'),
	db = require('../db'),
	moment = require('moment'),
	http = require('http'),
	kafka = require('kafka-node'),
	producer = new kafka.Producer(new kafka.Client()),
	log = require(appRoot + '/libs/utils/log.js')(module);

const events = [];
const logName = process.argv[2] || config.get('replayer.log');
const stream = fs.createReadStream(config.get(logName)['path']);

csv.fromStream(stream, {
	headers: true
}).
on('data', (event) => {
	events.push(event);
}).
on('end', () => {
	log.info(`All events have been uploaded. Total number of events in log: ${events.length}`);
	start(events, 'milliseconds');
});

function start(events, units) {
	const timeFormat = config.get(logName)['timeFormat'],
		timeField = config.get(logName)['timeField'],
		timeAccelerator = config.get(logName)['replayer']['accelerator'];

	const logLength = events.length;
        let currentEvent = events[0];
	let timeDiff;
	let i = 0;

	function replay() {
		log.info(`Event #${i}`);
                makeRequest(currentEvent);
                
		if (i >= logLength - 1) {
			log.info(`Execution engine successfully replayed all events.`);
                        i = -1;
			//process.exit(0);
                        require('child_process').spawn('sh', ['~/git/nirdizati-runtime/libs/clean_db.sh'], {stdio: 'inherit'});
		}

		const nextEvent = events[++i];

		if (config.get(logName)['replayer']['isTestMode']) {
			timeDiff = config.get(logName)['replayer']['testInterval'];
		} else {
			timeDiff = moment(nextEvent[timeField], timeFormat).diff(moment(currentEvent[timeField], timeFormat), units);
			timeDiff = Math.round(timeDiff/timeAccelerator);
			if (timeDiff < 0) {
				log.warn(`Events are not in chronological order. Test interval has been used instead.`);
				timeDiff = config.get(logName)['replayer']['testInterval'];
			}
		}

		currentEvent = nextEvent;
		setTimeout(replay, timeDiff);
                //return setTimeout(replay, timeDiff);
	}

	replay();
}

function makeRequest(event) {
        log.info(`Topic events_${logName} being sent event: ${JSON.stringify(event)}`);
	producer.send([{ topic: `events_${logName}`, messages: [ JSON.stringify(event) ]}], function(err, data) {
                        if (err) {
                                log.error(`Error sending event: ${err.message}`);
                        }
                        log.info(`Topic events_${logName} received event: ${JSON.stringify(data)}`); });
}
