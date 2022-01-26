import { ArrayToListPipe } from './array-to-list.pipe';

describe('ArrayToListPipe', () => {
  it('create an instance', () => {
    const pipe = new ArrayToListPipe();
    expect(pipe).toBeTruthy();
  });
});
