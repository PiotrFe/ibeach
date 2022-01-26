import { Component, OnInit } from '@angular/core';
import { ModalWindowComponent } from 'src/app/shared-module/modal-window/modal-window.component';

export interface Config {
  pdms: string[];
}

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
