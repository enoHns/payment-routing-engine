import { z } from 'zod';

const paymentSchema = z.object({
  phone:          z.string().min(8).max(20),
  amount:         z.number().positive(),
  currency:       z.string().length(3),
  idempotencyKey: z.string().uuid().optional(),
  webhookUrl:     z.string().url().optional(),
});

describe('payment Zod schema', () => {
  it('accepts valid payload', () => {
    const r = paymentSchema.safeParse({ phone: '+22997000001', amount: 5000, currency: 'XOF' });
    expect(r.success).toBe(true);
  });

  it('rejects missing amount', () => {
    const r = paymentSchema.safeParse({ phone: '+22997000001', currency: 'XOF' });
    expect(r.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const r = paymentSchema.safeParse({ phone: '+22997000001', amount: -1, currency: 'XOF' });
    expect(r.success).toBe(false);
  });

  it('rejects phone too short', () => {
    const r = paymentSchema.safeParse({ phone: '123', amount: 100, currency: 'XOF' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid uuid idempotencyKey', () => {
    const r = paymentSchema.safeParse({
      phone: '+22997000001', amount: 100, currency: 'XOF', idempotencyKey: 'not-a-uuid',
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid webhookUrl', () => {
    const r = paymentSchema.safeParse({
      phone: '+22997000001', amount: 100, currency: 'XOF', webhookUrl: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });

  it('allows optional idempotencyKey and webhookUrl to be absent', () => {
    const r = paymentSchema.safeParse({ phone: '+22997000001', amount: 100, currency: 'XOF' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.idempotencyKey).toBeUndefined();
      expect(r.data.webhookUrl).toBeUndefined();
    }
  });
});
