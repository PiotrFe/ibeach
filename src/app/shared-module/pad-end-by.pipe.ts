import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padEndTo',
})
export class PadEndToPipe implements PipeTransform {
  transform(value: string, padTo: number): string {
    return value.padEnd(padTo, ' ');
  }
}
