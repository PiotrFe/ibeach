import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Week } from '../week';
import { Person } from '../person';
import { PEOPLE } from '../people';

@Component({
  selector: 'person-entry-form',
  templateUrl: './person-entry-form.component.html',
  styleUrls: ['./person-entry-form.component.scss'],
})
export class PersonEntryFormComponent implements OnInit {
  constructor() {}

  weekModel: Week = {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
  };

  weekDaysArr = Object.keys(this.weekModel);

  personForm = new FormGroup({
    name: new FormControl(''),
    skill: new FormControl(''),
    comments: new FormControl(''),
  });

  getTypeAhead(key: string): any[] {
    return PEOPLE.map((item) => item[key as keyof Person]);
  }

  getClass(weekDay: string): string {
    return this.weekModel[weekDay.toLowerCase() as keyof Week]
      ? 'btn btn-primary'
      : 'btn btn-disabled';
  }

  handleClick(weekDay: string): void {
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];
  }

  ngOnInit(): void {}
}
