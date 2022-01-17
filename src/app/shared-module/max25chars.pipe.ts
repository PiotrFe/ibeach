import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'max25chars',
})
export class Max25charsPipe implements PipeTransform {
  transform(val: string): string {
    if (val.length < 25) {
      return val;
    }

    return `${val.slice(0, 25)}...`;
  }
}
