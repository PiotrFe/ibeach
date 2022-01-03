import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from 'src/app/shared-module/header/header.component';

@Component({
  selector: 'project-list-header',
  templateUrl: './project-list-header.component.html',
  styleUrls: ['./project-list-header.component.scss'],
})
export class ProjectListHeaderComponent
  extends HeaderComponent
  implements OnInit
{
  constructor() {
    super();
  }

  ngOnInit(): void {}
}
