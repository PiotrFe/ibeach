import { Component, OnInit, Input } from '@angular/core';
import { Tag } from 'src/app/shared-module/entry/entry.component';
import { LeadershipEntry } from 'src/app/project-list/project-list/project';

export interface StatsEntry {
  client: string;
  days: {
    asked: number;
    got: number;
  };
  tags?: Tag[];
  leadership?: LeadershipEntry[];
}

@Component({
  selector: 'stats-entry',
  templateUrl: './stats-entry.component.html',
  styleUrls: ['./stats-entry.component.scss'],
})
export class StatsEntryComponent implements OnInit {
  @Input() entry!: StatsEntry;
  @Input() sortField!: string;

  constructor() {}

  ngOnInit(): void {}
}
