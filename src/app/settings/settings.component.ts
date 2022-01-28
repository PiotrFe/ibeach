import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfigService, Config } from 'src/app/shared-module/config.service';
import { transformArrToListStr } from 'src/app/shared-module/array-to-list.pipe';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeEvent = new EventEmitter();

  subscription: Subscription = new Subscription();
  pdmArr: string[] = [];
  showInputModal: boolean = false;
  inputModalContent: string = '';

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    const configSubscr = this.configService.onConfig.subscribe({
      next: (config: Config) => {
        // TODO: add a check to prevent unnecessary updates
        const { pdms } = config;
        this.pdmArr = pdms;
      },
    });
    this.subscription.add(configSubscr);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeSettings(): void {
    this.closeEvent.emit();
  }

  toggleShowInputModal(showType: string): void {
    if (showType === 'pdm') {
      this.inputModalContent = transformArrToListStr(this.pdmArr);
    }
    this.showInputModal = !this.showInputModal;
  }

  closeInputModal(): void {
    this.showInputModal = false;
    this.inputModalContent = '';
  }
}
