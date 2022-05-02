import { RepeaterStatus } from '../lib';
import { Event } from '@sec-tester/core';

interface RepeaterStatusEventPayload {
  repeaterId: string;
  status: RepeaterStatus;
}

export class RepeaterStatusEvent extends Event<RepeaterStatusEventPayload> {
  constructor(payload: RepeaterStatusEventPayload) {
    super(payload, 'RepeaterStatusUpdated');
  }
}
