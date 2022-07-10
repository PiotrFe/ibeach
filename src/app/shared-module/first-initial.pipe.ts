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

    return nameParts.length === 1
      ? nameParts[0]
      : `${nameParts[0][0].toUpperCase()} ${nameParts.slice(1).join(' ')}`;
  }
}
