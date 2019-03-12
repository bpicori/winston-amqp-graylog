/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const Transport = require('winston-transport');
const amqplib = require('amqplib');
const os = require('os');

module.exports = class RabbitTransport extends Transport {
  constructor(opts) {
    super(opts);
    this._uri = opts.rabbitUri;
    this._queue = opts.queue;
    this._isConnected = false;
    this._internalQueue = [];
    this._hostname = opts.hostname || os.hostname();
    this._levels = {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7,
    };
    this._init();
  }

  async _init() {
    try {
      this._transporter = await amqplib.connect(this._uri);
      this._transporter.connection.on('error', err => console.log('AMQP ERROR:', err)).on('close', () => {
        this._isConnected = false;
        return this._init();
      });
      this._isConnected = true;
      this._channel = await this._transporter.createChannel();
      await this._process();
    } catch (err) {
      console.log('Winston Transport Rabbit error');
      setTimeout(this._init.bind(this), 5000);
    }
  }

  async log(level, message, meta, callback) {
    const log = Object.assign({}, meta, { level: this._levels[level], short_message: message, full_message: message }, { host: this._hostname });
    if (this._isConnected) {
      await this._process();
      await this._channel.publish('', this._queue, Buffer.from(this._formatLog(log)));
      this.emit('logged', log);
      callback();
    } else {
      this._saveLog(log);
      callback();
    }
  }

  _formatLog(log) {
    // if log is nested object, format with dot
    const formattedLog = Object.assign({}, log);
    while (Object.values(formattedLog).find(value => typeof value === 'object')) {
      Object.entries(formattedLog).forEach(([k1, v1]) => {
        if (typeof v1 === 'object') {
          Object.entries(v1).forEach(([k2, v2]) => {
            formattedLog[`${k1}.${k2}`] = v2;
          });
          delete formattedLog[k1];
        }
      });
    }
    // all values of logs should be strings
    for (const key in formattedLog) {
      if (Object.prototype.hasOwnProperty.call(formattedLog, key)) {
        formattedLog[key] = formattedLog[key] && formattedLog[key].toString();
      }
    }
    return JSON.stringify(formattedLog);
  }

  async _process() {
    for (const log of this._internalQueue) {
      await this._channel.publish('', this._queue, Buffer.from(this._formatLog(log)));
    }
  }

  _saveLog(log) {
    this._internalQueue.push(log);
    if (this._internalQueue.length > 5000) {
      this._internalQueue.shift();
    }
  }
};
