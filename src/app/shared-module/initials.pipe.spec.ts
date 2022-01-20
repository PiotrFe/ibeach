import { InitialsPipe } from './initials.pipe';

describe('InitialsPipe', () => {
  const pipe = new InitialsPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('to return empty string if arg is undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('to return initial of first and last part of the name', () => {
    expect(pipe.transform('Marie Louse Sun')).toBe('MS');
    expect(pipe.transform('Peter Great')).toBe('PG');
  });
});
