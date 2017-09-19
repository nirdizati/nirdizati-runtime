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

const config = require('config'),
	RedisSMQ = require('rsmq');

const log = require('./logger')(module),
	rsmq = new RedisSMQ(config.get('redis.connection'));

function setupQueue(queueName, cb) {
	_deleteQueue(queueName, () => {
		_createQueue(queueName, cb);
	});
}

function _createQueue(queueName, cb) {
	rsmq.createQueue({qname: queueName}, function (err, resp) {
		if (err) {
			log.warn(`Error during ${queueName} creation: ${err.message}`);
			return cb(null); // to continue execution
		}

		if (resp === 1) {
			log.info(`${queueName} created`);
			return cb(null);
		}
	});
}

function _deleteQueue(queueName, cb) {
	rsmq.deleteQueue({qname: queueName}, function (err, resp) {
		if (err) {
			log.warn(`Error during ${queueName} deletion: ${err.message}`);
			return cb(err);
		}

		if (resp === 1) {
			log.info(`${queueName} deleted`);
			return cb(null);
		}
	});
}

module.exports = () => {
	setupQueue(config.get('redis.jobQueue'), () => {});
};