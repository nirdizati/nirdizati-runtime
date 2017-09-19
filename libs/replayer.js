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
	fs = require('fs'),
	moment = require('moment'),
	parse = require('csv-parse/lib/sync');

const log = require(appRoot + '/libs/utils/logger.js')(module),
	sender = require(appRoot + '/libs/utils/sender.js');

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
			return log.warn(`Trying to start replayer for ${this.logName} log which is in progress already.`);
		}

		log.info(`\n\nStarting replayer for ${this.logName} log.`);
		this.isRunning = true;
		this._executeCore();
	}

	async _executeCore() {
		log.info(`Event #${this.currentEventNumber + 1}`);

		try {
			await this.send(this.events[this.currentEventNumber]);
		} catch(err) {
			log.error(`\nError during sending event is caught: ${err.message}. Event will be resend again in 10 sec...`);
			return setTimeout(this._executeCore.bind(this), 10000);
		}

		if (this.currentEventNumber + 1 >= this.logLength) {
			log.info(`Execution engine successfully replayed all events.`);
			const restartTime = 30000;

			log.info(`Going to restart replayer for ${this.logName} log in ${restartTime} ms.`);
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
				log.warn(`Events are not in chronological order. Test interval (from config) has been used instead.`);
				timeDiff = this.testInterval;
			}
		}

		return timeDiff;
	}

	async _restart() {
		clearTimeout(this.timer);
		this.isRunning = false;
		this.currentEventNumber = 0;

		const db = require('../db');
		await db.clearFromLog(this.logName);
		this.start();
	}

	pause() {
		clearTimeout(this.timer);
		this.isRunning = false;
		log.info(`Replayer for ${this.logName} has been paused.\n\n`);
	}

	resume() {
		if (this.isRunning) {
			return log.warn(`Trying to resume replayer for ${this.logName} which is in progress.`);
		}

		log.info(`Resuming replayer for ${this.logName} log.`);
		this.isRunning = true;
		this._executeCore();
	}
}

const senderName = sender.defineName();
log.info(`Events will be sent via: ${senderName}. Log name: ${logName}`);

let replayer;

switch(senderName) {
	case 'http':
		replayer = new Replayer(sender.httpSender, logName);
		replayer.start();
		break;
	case 'kafka':
		sender.producer.on('ready', () => {
			replayer = new Replayer(sender.kafkaSender, logName);
			replayer.start();
		});

		sender.producer.on('error', (err) => {
			log.error(err.message);
		});

		break;
	default: throw new Error(`Requested unknown type of sender.`)
}