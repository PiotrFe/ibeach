import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';

import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ConfigService,
  Config,
  ConfigChange,
  EmailTemplate,
} from 'src/app/shared-module/config.service';
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
  chargeCode: string = '';
  email!: {
    current: EmailTemplate;
    default: EmailTemplate;
  };
  showInputModal: boolean = false;
  inputModalTitle: string = '';
  inputModalType!: null | 'pdms' | 'cc' | 'email';
  inputContent = new FormControl('');
  emailForm = new FormGroup({
    subject: new FormControl(''),
    content: new FormControl(''),
    contentNoAllocation: new FormControl(''),
  });

  configChanges: ConfigChange[] = [];

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    const configSubscr = this.configService.onConfig.subscribe({
      next: (config: Config) => {
        // TODO: add a check to prevent unnecessary updates
        const { pdms, cc, email } = config;
        this.pdmArr = pdms;
        this.chargeCode = cc ? cc : '';
        this.email = email;
      },
    });
    this.subscription.add(configSubscr);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeSettings(): void {
    if (this.configChanges.length) {
      this.configService.updateConfig(this.configChanges);
      this.configChanges = [];
    }
    this.closeEvent.emit();
  }

  toggleShowInputModal(showType: string): void {
    if (showType === 'pdm') {
      this.inputContent.setValue(transformArrToListStr(this.pdmArr));
      this.inputModalTitle = 'Edit PDMs';
      this.inputModalType = 'pdms';
    } else if (showType === 'chargeCode') {
      this.inputContent.setValue(this.chargeCode);
      this.inputModalTitle = 'Edit CC';
      this.inputModalType = 'cc';
    } else if (showType === 'email') {
      console.log(this.email);
      if (this.email?.current) {
        this.emailForm.setValue({
          subject: this._decodeWhitespaces(this.email.current.subject),
          content: this._decodeWhitespaces(this.email.current.content),
          contentNoAllocation: this._decodeWhitespaces(
            this.email.current.contentNoAllocation
          ),
        });
      }

      this.inputModalTitle = 'Email Template';
      this.inputModalType = 'email';
    }

    this.showInputModal = true;
  }

  closeInputModal(submitted: any): void {
    if (this.inputContent.dirty && submitted) {
      const configChange: ConfigChange = {
        field: this.inputModalType!,
        value: this._parseInputValue(this.inputContent.value),
      };

      this.configChanges.push(configChange);
      this._updateLocalView(configChange);
    }
    this.showInputModal = false;
    this.inputContent.setValue('');
    this.inputModalTitle = '';
    this.inputModalType = null;
  }

  _updateLocalView(configChange: ConfigChange): void {
    const { field, value } = configChange;

    if (field === 'pdms') {
      this.pdmArr = value as string[];
    } else if (field === 'cc') {
      this.chargeCode = value as string;
    }
  }

  _parseInputValue(value: string): string | string[] {
    if (this.inputModalType === 'pdms') {
      return this.inputContent.value.split('\n');
    }
    return value;
  }

  _decodeWhitespaces(str: string): string {
    return str.replace(/%0D%0A/g, '\n');
  }
  _encodeWhitespaces(str: string): string {
    return str.replace(/\n/g, '%0D%0A');
  }
}
