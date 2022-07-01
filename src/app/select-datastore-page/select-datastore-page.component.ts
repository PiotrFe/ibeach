import { Component, OnInit } from '@angular/core';
import { DataStoreService } from 'src/app/shared-module/data-store.service';

@Component({
  selector: 'select-datastore-page',
  templateUrl: './select-datastore-page.component.html',
  styleUrls: ['./select-datastore-page.component.scss'],
})
export class SelectDatastorePageComponent implements OnInit {
  constructor(private dataStoreService: DataStoreService) {}

  ngOnInit(): void {}

  setDataStore(e: any) {
    if (e?.target?.files?.length) {
      this.dataStoreService.setDataStore(e.target.files[0]);
    }
  }
}
