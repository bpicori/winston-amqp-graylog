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
      new AmqpTransport({
        rabbitUri: uri,
        queue,
        level: logLevel,
      })
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
```
