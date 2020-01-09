import { resolveOperator } from '../../src/core/phoneResolver';

describe('phoneResolver — Bénin', () => {
  it('resolves MTN prefix 96', () => {
    const result = resolveOperator('96123456', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.country).toBe('BJ');
  });

  it('resolves MTN prefix 97', () => {
    const result = resolveOperator('97456789', 'BJ');
    expect(result.operator).toBe('MTN');
  });

  it('resolves Moov prefix 98', () => {
    const result = resolveOperator('98001234', 'BJ');
    expect(result.operator).toBe('Moov');
  });

  it('resolves Moov prefix 64', () => {
    const result = resolveOperator('64112233', 'BJ');
    expect(result.operator).toBe('Moov');
  });

  it('resolves Celtiis prefix 68', () => {
    const result = resolveOperator('68001122', 'BJ');
    expect(result.operator).toBe('Celtiis');
  });

  it('strips country code +229', () => {
    const result = resolveOperator('+22996123456', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.normalized).toBe('96123456');
  });

  it('strips country code without +', () => {
    const result = resolveOperator('22997001122', 'BJ');
    expect(result.operator).toBe('MTN');
    expect(result.normalized).toBe('97001122');
  });

  it('strips spaces from phone', () => {
    const result = resolveOperator('96 12 34 56', 'BJ');
    expect(result.operator).toBe('MTN');
  });

  it('throws for unknown prefix in known country', () => {
    expect(() => resolveOperator('70000000', 'BJ')).toThrow('Unknown operator');
  });

  it('throws for unsupported country', () => {
    expect(() => resolveOperator('96123456', 'XX')).toThrow('Unsupported country');
  });
});
