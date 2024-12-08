import { faker } from '@faker-js/faker';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';

import { AmqpProvisioner, type AmqpChannel, type AmqpConnection, type AmqpGetMessageResult } from '@libs/amqp';
import {
  exchangeName,
  queueNames,
  routingKeys,
  VideoContainer,
  type VideoEncodingRequestedMessage,
} from '@libs/contracts';
import { LoggerFactory } from '@libs/logger';

import { RequestVideoEncodingsAction } from './requestVideoEncodingsAction.js';
import { ConfigFactory, type Config } from '../../config.js';

describe('RequestVideoEncodingsAction', () => {
  let action: RequestVideoEncodingsAction;

  let config: Config;

  let amqpConnection: AmqpConnection;

  let amqpChannel: AmqpChannel;

  beforeEach(async () => {
    config = ConfigFactory.create();

    const logger = LoggerFactory.create({
      appName: config.appName,
      logLevel: config.logLevel,
    });

    const amqpProvisioner = new AmqpProvisioner(logger);

    amqpConnection = await amqpProvisioner.createConnection({
      url: config.amqp.url,
    });

    amqpChannel = await amqpProvisioner.createChannel({
      connection: amqpConnection,
    });

    await amqpProvisioner.createQueue({
      channel: amqpChannel,
      exchangeName,
      queueName: queueNames.encodingRequests,
      pattern: routingKeys.videoEncodingRequested,
      dlqMessageTtl: config.amqp.messageTtl,
    });

    action = new RequestVideoEncodingsAction(amqpChannel, logger, config);

    await amqpChannel.purgeQueue(queueNames.encodingRequests);
  });

  afterEach(async () => {
    await amqpChannel.purgeQueue(queueNames.encodingRequests);

    await amqpConnection.close();
  });

  it('requests video encodings', async () => {
    const videoId = faker.string.uuid();

    const videoContainer = VideoContainer.mp4;

    const location = `/shared/${videoId}.${videoContainer}`;

    await action.execute({
      videoId,
      location,
      videoContainer,
    });

    for (let i = 0; i < config.encoding.artifacts.length; i++) {
      const message = (await amqpChannel.get(queueNames.encodingRequests)) as AmqpGetMessageResult;

      expect(message).not.toBe(false);

      const parsedMessage = JSON.parse(message.content.toString()) as VideoEncodingRequestedMessage;

      expect(parsedMessage.videoId).toEqual(videoId);

      expect(parsedMessage.location).toEqual(location);

      expect(parsedMessage.videoContainer).toEqual(videoContainer);

      expect(config.encoding.artifacts).toContainEqual(parsedMessage.encoding);
    }
  });
});
