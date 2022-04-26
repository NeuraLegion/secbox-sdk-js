import {
  ExecuteRequestEventHandler,
  RegisterRepeaterCommand,
  RegisterRepeaterResult,
  RepeaterStatusEvent
} from '../bus';
import { RepeaterStatus } from '../models';
import { Configuration, EventBus, Logger } from '@secbox/core';
import Timer = NodeJS.Timer;

export enum RunningStatus {
  OFF,
  STARTING,
  RUNNING
}

export class Repeater {
  public readonly repeaterId: string;
  public runningStatus = RunningStatus.OFF;

  private readonly bus: EventBus;
  private readonly configuration: Configuration;
  private readonly logger: Logger | undefined;

  private timer?: Timer;

  constructor({
    repeaterId,
    bus,
    configuration
  }: {
    repeaterId: string;
    bus: EventBus;
    configuration: Configuration;
  }) {
    this.repeaterId = repeaterId;
    this.bus = bus;
    this.configuration = configuration;

    const { container } = this.configuration;
    if (container.isRegistered(Logger, true)) {
      this.logger = container.resolve(Logger);
    }

    this.setupShutdown();
  }

  public async start(): Promise<void> {
    if (this.runningStatus !== RunningStatus.OFF) {
      throw new Error('Repeater is already active.');
    }

    this.runningStatus = RunningStatus.STARTING;

    try {
      const res = await this.register();
      if (!res) {
        throw new Error('Error registering repeater.');
      }

      await this.subscribeToEvents();

      await this.schedulePing();

      this.runningStatus = RunningStatus.RUNNING;
    } catch (e) {
      this.runningStatus = RunningStatus.OFF;
      throw e;
    }
  }

  public async stop(): Promise<void> {
    if (this.runningStatus !== RunningStatus.RUNNING) {
      throw new Error('Cannot stop non-running repeater.');
    }

    this.runningStatus = RunningStatus.OFF;

    if (this.timer) {
      clearInterval(this.timer);
    }

    await this.sendStatus('disconnected');
    await this.bus.destroy?.();
  }

  private register(): Promise<RegisterRepeaterResult | undefined> {
    return this.bus.execute(
      new RegisterRepeaterCommand({
        version: this.configuration.version,
        repeaterId: this.repeaterId
      })
    );
  }

  private async subscribeToEvents(): Promise<void> {
    await Promise.all(
      [
        ExecuteRequestEventHandler
        // TODO repeater scripts
      ].map(type => this.bus.register(type))
    );
  }

  private async schedulePing(): Promise<void> {
    await this.sendStatus('connected');
    this.timer = setInterval(() => this.sendStatus('connected'), 10000);
    this.timer.unref();
  }

  private async sendStatus(status: RepeaterStatus): Promise<void> {
    await this.bus.publish(
      new RepeaterStatusEvent({
        status,
        repeaterId: this.repeaterId
      })
    );
  }

  private setupShutdown(): void {
    ['SIGTERM', 'SIGINT', 'SIGHUP'].forEach(event =>
      process.on(event, async () => {
        if (this.runningStatus === RunningStatus.RUNNING) {
          try {
            await this.stop();
          } catch (e) {
            this.logger?.error(e.message);
          }
        }
      })
    );
  }
}
