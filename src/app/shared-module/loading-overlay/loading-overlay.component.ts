import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent implements OnInit {
  @Input() loading: boolean = true;

  constructor() {}

  ngOnInit(): void {}
}
