import { Component, OnInit, Input } from '@angular/core';
import { Person } from '../person';
import { Week } from '../week';

@Component({
  selector: 'person-entry',
  templateUrl: './person-entry.component.html',
  styleUrls: ['./person-entry.component.scss'],
})
export class PersonEntryComponent implements OnInit {
  @Input() person!: Person;

  weekModel: Week = this.person?.week || {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
  };

  weekDaysArr = Object.keys(this.weekModel);

  handleClick(weekDay: string): void {
    this.weekModel[weekDay.toLowerCase() as keyof Week] =
      !this.weekModel[weekDay.toLowerCase() as keyof Week];

    console.log(this.weekModel);
  }

  getClass(weekDay: string): string {
    return this.weekModel[weekDay.toLowerCase() as keyof Week]
      ? 'btn btn-primary'
      : 'btn btn-disabled';
  }

  constructor() {}

  ngOnInit(): void {}
}
