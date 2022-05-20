import { Scans } from './Scans';
import {
  Issue,
  IssueGroup,
  ScanState,
  ScanStatus,
  Severity,
  severityRanges
} from './models';
import { TooManyScans, ScanAborted, TimedOut } from './exceptions';
import { delay } from '@sec-tester/core';

export interface ScanOptions {
  id: string;
  scans: Scans;
  pollingInterval?: number;
  timeout?: number;
}

export class Scan {
  public readonly id: string;
  private readonly ACTIVE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.PENDING,
    ScanStatus.RUNNING
  ]);
  private readonly DONE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.DISRUPTED,
    ScanStatus.DONE,
    ScanStatus.FAILED,
    ScanStatus.STOPPED
  ]);
  private readonly scans: Scans;
  private readonly pollingInterval: number;
  private readonly timeout: number | undefined;
  private state: ScanState = { status: ScanStatus.PENDING };

  constructor({ id, scans, timeout, pollingInterval = 5 * 1000 }: ScanOptions) {
    this.scans = scans;
    this.id = id;
    this.pollingInterval = pollingInterval;
    this.timeout = timeout;
  }

  get active(): boolean {
    return this.ACTIVE_STATUSES.has(this.state.status);
  }

  get done(): boolean {
    return this.DONE_STATUSES.has(this.state.status);
  }

  public async issues(): Promise<Issue[]> {
    await this.refreshState();

    return this.scans.listIssues(this.id);
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await delay(this.pollingInterval);

      yield this.refreshState();
    }

    return this.state;
  }

  public async expect(
    expectation: Severity | ((scan: Scan) => unknown)
  ): Promise<void> {
    let timeoutPassed = false;

    const timer: NodeJS.Timeout | undefined = this.timeout
      ? setTimeout(() => (timeoutPassed = true), this.timeout)
      : undefined;

    const predicate = this.createPredicate(expectation);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    for await (const _ of this.status()) {
      const preventFurtherPolling =
        (await predicate()) || this.done || timeoutPassed;

      if (preventFurtherPolling) {
        break;
      }
    }

    if (timer) {
      clearTimeout(timer);
    }

    this.assert(timeoutPassed);
  }

  public async dispose(): Promise<void> {
    try {
      await this.refreshState();

      if (!this.active) {
        await this.scans.deleteScan(this.id);
      }
    } catch {
      // noop
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.refreshState();

      if (this.active) {
        await this.scans.stopScan(this.id);
      }
    } catch {
      // noop
    }
  }

  private assert(timeoutPassed?: boolean) {
    const { status } = this.state;

    if (status === ScanStatus.QUEUED) {
      throw new TooManyScans();
    }

    if (this.done && status !== ScanStatus.DONE) {
      throw new ScanAborted(status);
    }

    if (timeoutPassed) {
      throw new TimedOut(this.timeout ?? 0);
    }
  }

  private async refreshState(): Promise<ScanState> {
    if (!this.done) {
      this.state = await this.scans.getScan(this.id);
    }

    return this.state;
  }

  private createPredicate(
    expectation: Severity | ((scan: Scan) => unknown)
  ): () => unknown {
    return () => {
      try {
        return typeof expectation === 'function'
          ? expectation(this)
          : this.satisfyExpectation(expectation);
      } catch {
        // noop
      }
    };
  }

  private satisfyExpectation(severity: Severity): boolean {
    const issueGroups = this.state.issuesBySeverity ?? [];

    return issueGroups.some(
      (x: IssueGroup) =>
        severityRanges.get(severity)?.includes(x.type) && x.number > 0
    );
  }
}
