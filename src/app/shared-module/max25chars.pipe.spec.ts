import { Max25charsPipe } from './max25chars.pipe';

describe('Max25charsPipe', () => {
  const pipe = new Max25charsPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
  it('shorten strings longer than 25 chars', () => {
    const str =
      'A very long string A very long string A very long string A very long string';
    const shortened = `${str.slice(0, 25)}...`;
    expect(pipe.transform(str)).toBe(shortened);
  });
  it('return strings shorter than 25 chars', () => {
    const str = 'A short string';
    expect(pipe.transform(str)).toBe(str);
  });
});
