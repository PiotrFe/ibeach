import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'select-datastore-page',
  templateUrl: './select-datastore-page.component.html',
  styleUrls: ['./select-datastore-page.component.scss'],
})
export class SelectDatastorePageComponent implements OnInit {
  @Output() newDatastoreEvent = new EventEmitter<File>();

  constructor() {}

  ngOnInit(): void {}

  setDataStore(e: any) {
    if (e?.target?.files?.length) {
      console.log(e.target.files[0]);
      this.newDatastoreEvent.emit(e.target.files[0]);
    }
  }
}
