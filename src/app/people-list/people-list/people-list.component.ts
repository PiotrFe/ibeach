import { Component, OnInit } from '@angular/core';
import { PEOPLE } from '../people';
import { Person } from '../person';
import { getNewWeek } from '../week';

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent implements OnInit {
  people = PEOPLE;
  inEditMode = false;
  newRows: Person[] = [];

  setInEditMode(inEditMode: boolean): void {
    this.inEditMode = inEditMode;
    if (!inEditMode) {
      this.newRows = [];
    }
  }

  addNewRow(): void {
    this.newRows.push({
      name: '',
      skill: '',
      week: getNewWeek(),
      comments: '',
    });
  }

  removeRow(idx: number): void {
    this.newRows = this.newRows.filter((item, index) => index !== idx);
  }

  constructor() {}

  ngOnInit(): void {}
}
