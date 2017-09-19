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

const log = require('../utils/logger')(module),
	rsmq = new RedisSMQ(config.get('redis.connection'));

module.exports = {
	sendMessage: (payload, queueName) => {
		rsmq.sendMessage({qname: queueName, message: JSON.stringify(payload), delay: 0}, (err) => {
			if (err) {
				log.error(`Error during sending message to ${queueName}: ${err.message}`);
			}
		});
	}
};
