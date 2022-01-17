import { Max25charsPipe } from './max25chars.pipe';

describe('Max25charsPipe', () => {
  it('create an instance', () => {
    const pipe = new Max25charsPipe();
    expect(pipe).toBeTruthy();
  });
});
