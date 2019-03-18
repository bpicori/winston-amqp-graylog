## winston-amqp-graylog

Winston transport for Graylog amqp input.

### Installation

```bash
$ npm install winston
$ npm install winston-amqp-graylog
```

### Usage

```js
const winston = require('winston');
const AmqpTransport = require('winston-amqp-graylog');

const logger = new winston.Logger({
    transports: [
      new AmqpTransport(options)
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
```

### Options
* **rabbitUri:** RabbitMQ url
* **queue:** RabbitMQ queue to process log
* **hostname:** The name of the host (default: os.hostname())
* **level:** Level of the message to send to Graylog


### Log Levels

Winston Level | Graylog2 level
---------------|---------------
emerg          | emergency
alert          | alert
crit           | critical
error          | error
warning        | warning
warn           | warning
notice         | notice
info           | info
debug          | debug

