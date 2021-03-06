import { Component, OnInit, Input } from '@angular/core';
import { Tag } from 'src/app/shared-module/entry/entry.component';

export interface StatsEntry {
  client: string;
  days: {
    asked: number;
    got: number;
  };
  leadership: string[];
  tags?: Tag[];
}

@Component({
  selector: 'stats-entry',
  templateUrl: './stats-entry.component.html',
  styleUrls: ['./stats-entry.component.scss'],
})
export class StatsEntryComponent implements OnInit {
  @Input() entry!: StatsEntry;
  @Input() sortField!: string;

  ratioColor!: number;

  constructor() {}

  ngOnInit(): void {
    if (!this.entry) {
      return;
    }
    this.ratioColor = Math.floor(
      (this.entry.days.got / this.entry.days.asked) * 10
    );
  }
}
