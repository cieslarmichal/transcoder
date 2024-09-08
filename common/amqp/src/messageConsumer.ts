export interface ConsumePayload<Message> {
  readonly message: Message;
  readonly routingKey: string;
}

export interface MessageConsumer<Message = unknown> {
  consume(payload: ConsumePayload<Message>): Promise<void>;
}
