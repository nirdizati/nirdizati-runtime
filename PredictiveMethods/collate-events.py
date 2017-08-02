"""
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
"""

import sys
import json
from kafka import KafkaProducer, KafkaConsumer

if len(sys.argv) != 4:
    sys.exit("Usage: python {} bootstrap-server:port events-topic prefixes-topic".format(sys.argv[0]))

bootstrap_server, source_topic, destination_topic = sys.argv[1], sys.argv[2], sys.argv[3]

print("Collating events from {} into {}".format(source_topic, destination_topic))
consumer = KafkaConsumer(source_topic, bootstrap_servers=bootstrap_server, auto_offset_reset='earliest')
producer = KafkaProducer(bootstrap_servers=bootstrap_server)

""" This is a map keyed on string-valued sequence_nr and containing sequences of event objects """
cases = {}

""" As events arrive on source_topic, collate case prefixes and forward them on destination_topic """
for message in consumer:
    event       = json.loads(message.value)[-1]
    event_nr    = event.get(u'event_nr')
    sequence_nr = event.get(u'sequence_nr')
    if cases.get(sequence_nr) is None:
	cases[sequence_nr] = []
    cases.get(sequence_nr).append(event)
    producer.send(destination_topic, json.dumps(cases.get(sequence_nr)))
    print("Collated event {} in {}".format(event_nr, sequence_nr))
