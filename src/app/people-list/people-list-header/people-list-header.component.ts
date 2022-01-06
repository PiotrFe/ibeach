import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HeaderComponent } from 'src/app/shared-module/header/header.component';
import { PAGE_SECTIONS } from '../../app.component';

@Component({
  selector: 'people-list-header',
  templateUrl: './people-list-header.component.html',
  styleUrls: ['./people-list-header.component.scss'],
})
export class PeopleListHeaderComponent
  extends HeaderComponent
  implements OnInit
{
  @Input() displayedIn!: 'SUBMIT' | 'ALLOCATE';

  constructor() {
    super();
  }

  ngOnInit(): void {}
}
