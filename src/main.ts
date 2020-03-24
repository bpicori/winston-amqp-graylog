import { Channel, connect, Connection } from 'amqplib';
import * as os from 'os';
import Transport from 'winston-transport';

export class AmqpTransport extends Transport {
  private readonly uri: string;

  private readonly queue: string;

  private isConnected: boolean;

  private readonly internalQueue: any[];

  private readonly hostname: string;

  private readonly levels: { emerg: number; debug: number; crit: number; alert: number; warning: number; error: number; notice: number; info: number };

  private transporter: Connection;

  private channel: Channel;

  constructor(opts: { rabbitUri: string, queue: string, level: string, hostname?: string } & { [key: string]: any }) {
    opts.name = 'AmqpTransport';
    super(opts);
    this.uri = opts.rabbitUri;
    this.queue = opts.queue;
    this.isConnected = false;
    this.internalQueue = [];
    this.hostname = opts.hostname || os.hostname();
    this.levels = {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7,
    };
    this.init();
  }

  public async init() {
    try {
      this.transporter = await connect(this.uri);
      this.transporter.on('error', (err) => console.log('AMQP ERROR:', err)).on('close', () => {
        this.isConnected = false;
        return this.init();
      });
      this.isConnected = true;
      this.channel = await this.transporter.createChannel();
      // await this._process();
    } catch (err) {
      console.log(' error');
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      setTimeout(this.init.bind(this), 5000);
    }
  }

  public async log({ level, message, ...meta }: any, callback: any) {
    const log = {
      ...meta, level: this.levels[level], short_message: message, full_message: message, host: this.hostname,
    };
    if (this.isConnected) {
      await this.process();
      await this.channel.publish('', this.queue, Buffer.from(AmqpTransport.formatLog(log)));
      this.emit('logged', log);
      callback();
    } else {
      this.saveLog(log);
      callback();
    }
  }

  public static formatLog(log) {
    // if log is nested object, format with dot
    const formattedLog = { ...log };
    while (Object.values(formattedLog).find((value) => typeof value === 'object')) {
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

  private async process() {
    const p: any[] = [];
    for (const log of this.internalQueue) {
      p.push(this.channel.publish('', this.queue, Buffer.from(AmqpTransport.formatLog(log))));
    }
    return Promise.all(p);
  }

  private saveLog(log) {
    this.internalQueue.push(log);
    if (this.internalQueue.length > 5000) {
      this.internalQueue.shift();
    }
  }
}
