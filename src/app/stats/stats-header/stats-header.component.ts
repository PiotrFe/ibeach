import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from 'src/app/shared-module/header/header.component';

@Component({
  selector: 'stats-header',
  templateUrl: './stats-header.component.html',
  styleUrls: ['./stats-header.component.scss'],
})
export class StatsHeaderComponent extends HeaderComponent implements OnInit {
  ngOnInit(): void {}
}
