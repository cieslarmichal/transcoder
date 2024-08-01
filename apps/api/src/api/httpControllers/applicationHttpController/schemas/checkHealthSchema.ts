import { type Static, Type } from '@sinclair/typebox';

export const checkHealthResponseBodySchema = Type.Object({
  healthy: Type.Boolean(),
});

export type CheckHealthResponseBody = Static<typeof checkHealthResponseBodySchema>;
