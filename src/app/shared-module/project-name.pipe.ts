import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'projectName',
})
export class ProjectNamePipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (value === undefined) {
      return '';
    }

    if (value.length > 15) {
      let returnVal = '';
      let arr = value.split(' ');
      let i = 0;

      while (returnVal.length <= 15) {
        returnVal += `${arr[i]} `;
        i++;
      }
      return returnVal.slice(0, returnVal.length - 1);
    }

    return value;
  }
}
