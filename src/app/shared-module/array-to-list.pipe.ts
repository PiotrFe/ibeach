import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arrayToList',
})
export class ArrayToListPipe implements PipeTransform {
  transform(value: string[]): string {
    return transformArrToListStr(value);
  }
}

export const transformArrToListStr = (arr: string[]): string => {
  if (!arr.length) {
    return '';
  }

  return arr.reduce((acc, elem, idx, arr): string => {
    if (idx < arr.length - 1) {
      return `${acc}${elem}\n`;
    }
    return `${acc}${elem}`;
  }, '') as string;
};
