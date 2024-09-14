export interface ConsumePayload {
  readonly message: unknown;
  readonly routingKey: string;
}

export interface MessageConsumer {
  consume(payload: ConsumePayload): Promise<void>;
}
