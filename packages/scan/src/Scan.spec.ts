import 'reflect-metadata';
import { Scan } from './Scan';
import { DefaultScans } from './DefaultScans';
import { ScanStatus, Severity } from './models';
import { instance, mock, reset, verify, when } from 'ts-mockito';

describe('Scan', () => {
  const findArg = <R>(
    args: [unknown, unknown],
    expected: 'function' | 'number'
  ): R => (typeof args[0] === expected ? args[0] : args[1]) as R;

  const useFakeTimers = () => {
    jest.useFakeTimers();

    const mockedImplementation = jest
      .spyOn(global, 'setTimeout')
      .getMockImplementation();

    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((...args: [unknown, unknown]) => {
        // ADHOC: depending on implementation (promisify vs raw), the method signature will be different
        const callback = findArg<(..._: unknown[]) => void>(args, 'function');
        const ms = findArg<number>(args, 'number');
        const timer = mockedImplementation?.(callback, ms);

        jest.runAllTimers();

        return timer as NodeJS.Timeout;
      });
  };

  const id = 'roMq1UVuhPKkndLERNKnA8';
  const mosckedScans = mock<DefaultScans>();
  let scan!: Scan;

  beforeEach(() => {
    scan = new Scan(id, instance(mosckedScans));
  });

  afterEach(() => reset<DefaultScans>(mosckedScans));
  describe('issues', () => {
    it('should call listIssues', async () => {
      when(mosckedScans.listIssues(id)).thenResolve([]);

      await scan.issues();

      verify(mosckedScans.listIssues(id)).once();
    });
  });

  describe('status', () => {
    afterEach(() => jest.useRealTimers());
    it('should call getScan one time', async () => {
      useFakeTimers();
      when(mosckedScans.getScan(id)).thenResolve({
        status: ScanStatus.DONE,
        issuesBySeverity: []
      });

      // eslint-disable-next-line @typescript-eslint/naming-convention
      for await (const _ of scan.status());

      verify(mosckedScans.getScan(id)).once();
    });

    it('should call getScan 3 times', async () => {
      useFakeTimers();
      when(mosckedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: []
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: []
        })
        .thenResolve({
          status: ScanStatus.DONE,
          issuesBySeverity: []
        });

      // eslint-disable-next-line @typescript-eslint/naming-convention
      for await (const _ of scan.status());

      verify(mosckedScans.getScan(id)).thrice();
    });

    it('should call stopScan if getScan throw error', async () => {
      useFakeTimers();
      when(mosckedScans.getScan(id)).thenThrow();
      when(mosckedScans.stopScan(id)).thenResolve();

      // eslint-disable-next-line @typescript-eslint/naming-convention
      for await (const _ of scan.status());

      verify(mosckedScans.stopScan(id)).once;
    });
  });

  describe('waitFor', () => {
    afterEach(() => jest.useRealTimers());
    it('should call getScan one time', async () => {
      useFakeTimers();
      when(mosckedScans.getScan(id)).thenResolve({
        status: ScanStatus.DONE,
        issuesBySeverity: [{ number: 1, type: Severity.HIGH }]
      });

      await scan.waitFor({ expectation: Severity.HIGH });

      verify(mosckedScans.getScan(id)).once();
    });

    it('should call getScan three times', async () => {
      useFakeTimers();
      when(mosckedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.LOW }]
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.LOW }]
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.HIGH }]
        });

      await scan.waitFor({ expectation: Severity.HIGH });

      verify(mosckedScans.getScan(id)).thrice();
    });

    it('should not to throw if timeout passed', async () => {
      useFakeTimers();
      const timeout = 10000;
      when(mosckedScans.getScan(id)).thenResolve({
        status: ScanStatus.RUNNING,
        issuesBySeverity: [{ number: 1, type: Severity.LOW }]
      });

      const promise = scan.waitFor({
        expectation: Severity.HIGH,
        timeout
      });

      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('stop', () => {
    it('should call stopScan', async () => {
      when(mosckedScans.stopScan(id)).thenResolve();

      await scan.stop();

      verify(mosckedScans.stopScan(id)).once();
    });
  });
});
