import { Component } from '@angular/core';

@Component({
  template: '',
})
export class PageComponent {
  fetching: boolean = false;
  fetchError: string = '';
  noData: boolean = false;

  constructor() {}
}
