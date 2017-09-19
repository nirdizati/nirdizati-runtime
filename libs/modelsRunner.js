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
	async = require('async'),
	config = require('config'),
	execFile = require('child_process').execFile,
	fs = require('fs'),
	tmp = require('tmp');

const log = require('./utils/logger')(module);

tmp.setGracefulCleanup();

module.exports = {
	run: (payload, callback) => {
		tmp.file({dir: appRoot + '/tmp'}, (err, inputFile) => {
			if (err) {
				return callback(err);
			}

			fs.writeFileSync(inputFile, JSON.stringify(payload.prefix));

			const logName = payload.event['log'];
			async.parallel({
					outcomes: (cb) => {
						const outcomesConfig = config.get(logName)['methods']['outcomes'];
						const outcomes = Object.keys(outcomesConfig);

						async.map(outcomes, _calculateOutcome(outcomesConfig, inputFile), (err, calculations) => {
							if (err) {
								log.error(`Error during outcomes calculations: ${err.message}`);
								return cb(err);
							}

							const results = {};
							// order is preserved
							for (let i = 0; i < outcomes.length; i++) {
								results[outcomes[i]] = calculations[i];
							}

							return cb(null, results);
						});
					},
					remainingTime: (cb) => {
						const executable = config.get(logName)['methods']['remainingTime']['executable'];
						const CASE_REMAINING_TIME_PYTHON = appRoot + config.get(logName)['methods']['remainingTime']['wd'];
						const args = config.get(logName)['methods']['remainingTime']['args'];
						args[1] = inputFile;

						_executeModel(executable, args, CASE_REMAINING_TIME_PYTHON, (err, result) => {
							return cb(err, result);
						});
					}
				},
				(err, allResults) =>  {
					fs.unlink(inputFile, () => {});
					return callback(err, allResults);
				}
			);
		});
	}
};

function _calculateOutcome(config, inputFile){
	return function(outcome, callback){
		const directory = appRoot + config[outcome]['wd'];
		const executable = config[outcome]['executable'];
		const args = config[outcome]['args'];
		args[1] = inputFile;

		_executeModel(executable, args, directory, (err, result) => {
			if (typeof result !== 'string' || result === 'NaN') {
				log.warn(`Calculation of ${outcome} gave incorrect result.`);
				return callback(null, null);
			}
			result = parseFloat(result).toFixed(3);
			return callback(err, result);
		});
	}
}

function _executeModel(executable, args, workingDirectory, cb) {
	const options = { cwd: workingDirectory };

	execFile(executable, args, options, (err, stdout, stderr) => {
		return cb(err, stdout.replace(/\n$/, ''));
	});
}
