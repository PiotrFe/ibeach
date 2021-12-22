import { Component, OnInit, Input } from '@angular/core';
import { Person, PersonEntry } from '../person';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent extends PersonEntry implements OnInit {
  @Input() person!: Person;

  constructor() {
    super();
  }

  ngOnInit(): void {}
}
