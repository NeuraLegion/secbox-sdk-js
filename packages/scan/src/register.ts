import { Scans } from './Scans';
import { DefaultScans } from './DefaultScans';
import { ScanFactory } from './ScanFactory';
import { container, DependencyContainer } from 'tsyringe';
import { Configuration } from '@secbox/core';

container.register(Scans, { useClass: DefaultScans });

container.register(ScanFactory, {
  useFactory(childContainer: DependencyContainer) {
    return new ScanFactory(childContainer.resolve(Configuration));
  }
});
