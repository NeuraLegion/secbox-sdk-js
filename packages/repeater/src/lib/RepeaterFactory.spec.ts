import 'reflect-metadata';
import { RepeaterFactory } from './RepeaterFactory';
import { RequestRunnerOptions } from '../request-runner';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration, EventBus } from '@secbox/core';
import {
  anything,
  capture,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';

const resolvableInstance = <T extends object>(m: T): T =>
  new Proxy<T>(instance(m), {
    get(target, prop, receiver) {
      if (
        ['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(
          prop.toString()
        )
      ) {
        return undefined;
      }

      return Reflect.get(target, prop, receiver);
    }
  });

describe('RepeaterFactory', () => {
  const repeaterId = 'fooId';

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();
  const mockedEventBusFactory = mock<EventBusFactory>();
  const mockedRepeaterManager = mock<RepeatersManager>();

  const configuration = instance(mockedConfiguration);

  beforeEach(() => {
    when(mockedContainer.resolve<EventBusFactory>(EventBusFactory)).thenReturn(
      instance(mockedEventBusFactory)
    );
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedContainer.createChildContainer()).thenReturn(
      instance(mockedContainer)
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    when(mockedEventBus.init!()).thenResolve();

    when(mockedEventBusFactory.create(anything())).thenResolve(
      resolvableInstance(mockedEventBus)
    );

    when(mockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });
  });

  afterEach(() => {
    reset<
      | DependencyContainer
      | Configuration
      | EventBus
      | EventBusFactory
      | RepeatersManager
    >(
      mockedContainer,
      mockedConfiguration,
      mockedEventBus,
      mockedEventBusFactory,
      mockedRepeaterManager
    );
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      verify(mockedEventBus.init!()).once();
      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId
      });
    });

    it('should create repeater with given name prefix and description', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description'
      });

      const [arg]: [
        {
          name: string;
          description?: string;
        }
      ] = capture<{
        name: string;
        description?: string;
      }>(mockedRepeaterManager.createRepeater).first();

      expect(arg?.name).toMatch(/^foo/);
      expect(arg?.description).toBe('description');
      expect(res).toBeInstanceOf(Repeater);
    });

    it('should create repeater and apply RequestRunnerOptions', async () => {
      const factory = new RepeaterFactory(configuration);
      when(
        mockedContainer.register(RequestRunnerOptions, anything())
      ).thenReturn();

      const requestRunnerOptions = {
        timeout: 10000,
        maxContentLength: 200,
        reuseConnection: false,
        whitelistMimes: [
          'text/html',
          'text/plain',
          'text/css',
          'text/javascript',
          'text/markdown',
          'text/xml',
          'application/javascript',
          'application/x-javascript',
          'application/json',
          'application/xml',
          'application/x-www-form-urlencoded',
          'application/msgpack',
          'application/ld+json',
          'application/graphql'
        ]
      };

      const res = await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description',
        requestRunnerOptions
      });

      verify(
        mockedContainer.register(
          RequestRunnerOptions,
          objectContaining({
            useValue: requestRunnerOptions
          })
        )
      ).once();

      expect(res).toBeInstanceOf(Repeater);
    });
  });
});
