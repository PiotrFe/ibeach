import { Pipe, PipeTransform } from '@angular/core';
import { type } from 'os';

@Pipe({
  name: 'initials',
})
export class InitialsPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (typeof value === 'undefined') {
      return '';
    }
    const arr = value.split(' ');
    const lastIdx = arr.length - 1;

    if (lastIdx === 0) {
      return arr[0][0];
    }

    return `${arr[0][0]}${arr[lastIdx][0]}`;
  }
}
