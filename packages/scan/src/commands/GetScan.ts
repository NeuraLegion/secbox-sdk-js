import { ScanState } from '../models';
import { HttpRequest } from '@sec-tester/bus';

export class GetScan extends HttpRequest<undefined, ScanState> {
  constructor(id: string) {
    super({
      url: `/api/v1/scans/${id}`,
      payload: undefined
    });
  }
}
