import { FirstInitialPipe } from './first-initial.pipe';

describe('FirstInitialPipe', () => {
  const pipe = new FirstInitialPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('return empty string if invoked with undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('return initial and the last name', () => {
    expect(pipe.transform('John Smith')).toBe('J Smith');
  });

  it('to capitalize the initial', () => {
    expect(pipe.transform('marie Buck')).toBe('M Buck');
  });
});
