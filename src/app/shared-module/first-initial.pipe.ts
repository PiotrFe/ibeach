import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstInitial',
})
export class FirstInitialPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (value === undefined) {
      return '';
    }
    const nameParts = value.split(' ');

    return `${nameParts[0][0]} ${nameParts[nameParts.length - 1]}`;
  }
}
