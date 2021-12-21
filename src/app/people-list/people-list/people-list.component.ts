import { Component, OnInit } from '@angular/core';
import { PEOPLE } from '../people';

@Component({
  selector: 'people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss'],
})
export class PeopleListComponent implements OnInit {
  people = PEOPLE;

  constructor() {}

  ngOnInit(): void {}
}
