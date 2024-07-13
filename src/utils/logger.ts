export enum ELogLevel {
  INFO = "INFO",
  DEBUG = "DEBUG",
  ERROR = "ERROR",
  WARN = "WARN"
}

type TLogLevel = ELogLevel;

export class CustomLogger {
  private context: string;
  private showDelta: boolean;
  private lastMessageTime: number;

  constructor(context: string = "", showDeltaTime: boolean = false) {
    // Specify a context or module name that the logger instance is related to
    this.context = context;
    // When set to true, this option will include the time difference (delta) in milliseconds between consecutive logs.
    this.showDelta = showDeltaTime;
  }

  public log(level: TLogLevel, message: string, ...rest: any[]) {
    const now = Date.now();
    const delta = now - (this.lastMessageTime === undefined ? now : this.lastMessageTime);
    this.lastMessageTime = now;

    const parts = [`${level}:`];

    if (this.context) parts.push(`[${this.context}]`);

    if (this.showDelta) parts.push(`${delta}ms`.padEnd(12));

    parts.push(message);

    console.log(parts.join(" "), ...rest);
  }

  public info(message: string, ...rest: any[]) {
    this.log(ELogLevel.INFO, message, ...rest);
  }

  public debug(message: string, ...rest: any[]) {
    this.log(ELogLevel.DEBUG, message, ...rest);
  }

  public error(message: string, ...rest: any[]) {
    this.log(ELogLevel.ERROR, message, ...rest);
  }

  public warn(message: string, ...rest: any[]) {
    this.log(ELogLevel.WARN, message, ...rest);
  }
}

export function createLogger(context: string = "", showTimeDelta: boolean = false) {
  return new CustomLogger(context, showTimeDelta);
}

const log = createLogger();

export default log;
