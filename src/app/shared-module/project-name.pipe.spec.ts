import { ProjectNamePipe } from './project-name.pipe';

describe('ProjectNamePipe', () => {
  const pipe = new ProjectNamePipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('return empty string if passed undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('return shortened version if name longer than 15 chars', () => {
    const str = 'A pretty long name to test';

    expect(pipe.transform(str)).toBe('A pretty long name');
  });

  it('return full name if shorter than 15 chars', () => {
    const str = 'A short name';

    expect(pipe.transform(str)).toBe(str);
  });
});
