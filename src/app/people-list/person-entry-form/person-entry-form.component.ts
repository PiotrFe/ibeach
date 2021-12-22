import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PersonEntry } from '../person';

@Component({
  selector: 'person-entry-form',
  templateUrl: './person-entry-form.component.html',
  styleUrls: ['./person-entry-form.component.scss'],
})
export class PersonEntryFormComponent extends PersonEntry implements OnInit {
  @Input() idx!: number;
  @Output() deleteEvent = new EventEmitter<number>();

  constructor() {
    super();
  }

  personForm = new FormGroup({
    name: new FormControl(''),
    skill: new FormControl(''),
    comments: new FormControl(''),
  });

  handleDelete(): void {
    this.deleteEvent.emit(this.idx);
  }

  ngOnInit(): void {}
}
