import { CommandDispatcher } from './CommandDispatcher';
import { getTypeName } from '../utils';
import { v4 as uuidv4 } from 'uuid';

export abstract class Command<T, R> {
  public readonly expectReply = true;
  public readonly ttl = 10000;
  public readonly type!: string;
  public readonly payload!: T;
  public readonly correlationId!: string;
  public readonly createdAt!: Date;

  protected constructor(
    payload: T,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.payload = payload;

    if (expectReply) {
      this.expectReply = expectReply;
    }

    if (ttl) {
      this.ttl = ttl;
    }

    this.type = type || getTypeName(payload);
    this.correlationId = correlationId || uuidv4();
    this.createdAt = createdAt || new Date();
  }

  public execute(dispatcher: CommandDispatcher): Promise<R | undefined> {
    return dispatcher.execute<T, R>(this);
  }
}
