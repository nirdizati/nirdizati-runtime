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

const bodyParser = require('body-parser'),
	favicon = require('serve-favicon'),
	config = require('config'),
	express = require('express'),
	http = require('http'),
	helmet = require('helmet'),
	path = require('path'),
	webLogger = require('morgan');

const log = require('./libs/utils/logger.js')(module),
	sender = require('./libs/utils/sender'),
	replayerRoutes = require('./routes/replayer'),
	routes = require('./routes/index');

const app = express();

// provides some security protection
app.use(helmet({
	frameguard: {
		action: 'deny' // disallow putting site in iframe to prevent clickjacking attack
	}
}));

if (app.get('env') === 'development') {
	app.use(webLogger('dev'));
} else {
	app.use(webLogger('combined'));
}

app.use(favicon(path.join(__dirname, 'public', 'media', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

// handle routes
app.use('/event', replayerRoutes);
app.use('/', routes);

// produce 404 and forward to error handler
app.use(function(req, res, next) {
	const err = new Error('There is no such route');
	err.status = 404;
	next(err);
});

// no stacktraces leaked to user unless in development environment
app.use(function(err, req, res, next) {
	res.status(err.status || 500).json({
		message: err.message,
		error: (app.get('env') === 'development') ? err : {}
	});
});

// setup server
const server = http.createServer(app),
	port = process.argv[2] || config.get('app.port');

server.listen(port, () => {
	log.info(`Express server listening on port ${port}`);

	if (config.get('app.clean')) { // clean database from previous runs
		require('./libs/utils/dbSetup')();
	}

	const io = require('./libs/socket')(server);

	switch(sender.defineName()) {
		case 'http':
			if (config.get('app.clean')) { // clean queue from previous runs
				require('./libs/utils/queueSetup')();
			}
			require('./libs/queue/jobWorker')(io);
			break;
		case 'kafka':
			require('./libs/queue/jobWorker-kafka')(io);
			break;
		default: throw new Error(`Requested unknown type of sender.`)
	}
});
