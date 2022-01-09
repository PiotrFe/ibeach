import { FirstInitialPipe } from './first-initial.pipe';

describe('FirstInitialPipe', () => {
  it('create an instance', () => {
    const pipe = new FirstInitialPipe();
    expect(pipe).toBeTruthy();
  });
});
