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
	parse = require('csv-parse/lib/sync'),
	fs = require('fs'),
	moment = require('moment'),
	http = require('http'),
	logger = require(appRoot + '/libs/utils/log.js')(module),
	kafka = require('kafka-node'),
	producer = new kafka.Producer(new kafka.Client());

const logName = process.argv[2] || config.get('replayer.log');

class Replayer {
	constructor(sender, logName, units) {
		this.logName = logName;
		this.units = units || 'milliseconds';
		this.send = sender.bind(this);

		// configuration values
		this.timeFormat = config.get(this.logName)['timeFormat'];
		this.timeField = config.get(this.logName)['timeField'];
		this.timeAccelerator = config.get(this.logName)['replayer']['accelerator'];
		this.isTestMode = config.get(this.logName)['replayer']['isTestMode'];
		this.testInterval = config.get(this.logName)['replayer']['testInterval'];
		const logPath = config.get(this.logName)['path'];

		this.events = parse(fs.readFileSync(logPath, 'utf8'), {columns: true});
		this.logLength = this.events.length;

		// Replayer state
		this.currentEventNumber = 0;
		this.timer = null;
		this.isRunning = false
	}

	start() {
		if (this.isRunning) {
			return logger.warn(`Trying to start replayer for ${this.logName} log which is in progress already.`);
		}

		logger.info(`\n\nStarting replayer for ${this.logName} log.`);
		this.isRunning = true;
		this._executeCore();
	}

	async _executeCore() {
		logger.info(`Event #${this.currentEventNumber + 1}`);
		await this.send(this.events[this.currentEventNumber]);

		if (this.currentEventNumber + 1 >= this.logLength) {
			logger.info(`Execution engine successfully replayed all events.`);
			const restartTime = 3000;

			logger.info(`Going to restart replayer for ${this.logName} log in ${restartTime} ms.`);
			this.timer = setTimeout(this._restart.bind(this), restartTime);
			return;
		}

		const timeDiff = this._calculateTimeDifference();
		++this.currentEventNumber;
		this.timer = setTimeout(this._executeCore.bind(this), timeDiff);
	}

	_calculateTimeDifference() {
		let timeDiff;
		const currentEvent = this.events[this.currentEventNumber];
		const nextEvent = this.events[this.currentEventNumber + 1];

		if (this.isTestMode) {
			timeDiff = this.testInterval;
		} else {
			timeDiff = moment(nextEvent[this.timeField], this.timeFormat)
				.diff(moment(currentEvent[this.timeField], this.timeFormat), this.units);

			timeDiff = Math.round(timeDiff/this.timeAccelerator);
			if (timeDiff < 0) {
				logger.warn(`Events are not in chronological order. Test interval (from config) has been used instead.`);
				timeDiff = this.testInterval;
			}
		}

		return timeDiff;
	}

	_restart() {
		clearTimeout(this.timer);
		this.isRunning = false;
		this.currentEventNumber = 0;

		// TODO: clean database
		// right now mimic async call
		setTimeout(this.start.bind(this), 5000);
	}

	pause() {
		clearTimeout(this.timer);
		this.isRunning = false;
		logger.info(`Replayer for ${this.logName} has been paused.\n\n`);
	}

	resume() {
		if (this.isRunning) {
			return logger.warn(`Trying to resume replayer for ${this.logName} which is in progress.`);
		}

		logger.info(`Resuming replayer for ${this.logName} log.`);
		this.isRunning = true;
		this._executeCore();
	}
}

function senderFactory() {
	const senderName = process.env.SENDER_NAME || 'kafka';

	switch(senderName) {
		case 'http': return makeHttpRequest;
		case 'kafka': return sendToKafka;
	}
}

function makeHttpRequest(event) {
	event = JSON.stringify(event);

	return new Promise((resolve, reject) => {
		const req = http.request(
			config.get(this.logName)['replayer']['request'],
			(res) => {
				res.on('data', (chunk) => {
					logger.info(`The following message has been sent: ${event}`);
					return resolve(chunk);
				});
			}
		);

		req.on('error', (err) => {
			logger.error(`The following error has occurred: ${err.message} ${err.stack}`);
			return reject(err);
		});

		req.write(event);
		req.end();
	});
}

function sendToKafka(event) {
	const event = JSON.stringify(event);

	return new Promise((resolve, reject) => {
		logger.info(`Topic events_${this.logName} being sent event: ${event}`);
		producer.send(
			[{ topic: `events_${this.logName}`, messages: [ event ]}],
			(err, data) => {
				if (err) {
					logger.error(`Error sending event: ${err.message}`);
					return reject(err);
				}

				logger.info(`Topic events_${this.logName} received event: ${JSON.stringify(data)}`);
				return resolve(JSON.stringify(data));
			}
		);
	});
}

const sender = senderFactory();
const replayer = new Replayer(sender, logName);
replayer.start();

setTimeout(() => {replayer.pause()}, 2000);
setTimeout(() => {replayer.resume()}, 5000);
