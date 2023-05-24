import { HttpRequest } from '@sectester/bus';

export interface CreateRepeaterRequestPayload {
  name: string;
  description?: string;
}

export interface CreateRepeaterResponsePayload {
  id: string;
}

export class CreateRepeaterRequest extends HttpRequest<
  CreateRepeaterRequestPayload,
  CreateRepeaterResponsePayload
> {
  constructor(payload: CreateRepeaterRequestPayload) {
    super({
      payload,
      url: '/api/v1/repeaters',
      method: 'POST'
    });
  }
}
