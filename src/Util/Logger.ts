import { Logger } from "@nestjs/common";

export class LoggerUtil {
  static log(message: string, context: string, type: string = "log") {
      const time = new Date();

    Logger.log(`${time.toLocaleDateString() + " " + time.toLocaleTimeString()}: ${message}`, context);
  }

  static error(error: Error, context: string) {
    const time = new Date();

    Logger.error(`${time.toLocaleDateString() + " " + time.toLocaleTimeString()}: ${error}`, context);
    return;
  }
}