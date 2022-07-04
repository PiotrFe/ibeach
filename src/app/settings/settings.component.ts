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
  EmailConfig,
} from 'src/app/shared-module/config.service';
import { transformArrToListStr } from 'src/app/shared-module/array-to-list.pipe';
import { decodeWhitespaces, encodeWhitespaces } from 'src/app/utils';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeEvent = new EventEmitter();

  configChanges: ConfigChange[] = [];
  email!: EmailConfig;
  emailForm = new FormGroup({
    subject: new FormControl(''),
    content: new FormControl(''),
    contentNoAllocation: new FormControl(''),
  });
  inputContent = new FormControl('');
  inputModalTitle: string = '';
  inputModalType!: null | 'pdms' | 'email';
  pdmArr: string[] = [];
  showInputModal: boolean = false;
  subscription: Subscription = new Subscription();

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    const configSubscr = this.configService.onConfig.subscribe({
      next: (config: Config) => {
        const { pdms, email } = config;
        this.pdmArr = pdms;
        this.email = email;
      },
    });
    this.subscription.add(configSubscr);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  closeSettings(submit: any): void {
    if (submit && this.configChanges.length) {
      this.configService.updateConfig(this.configChanges);
      this.configChanges = [];
    }

    this.closeEvent.emit();
  }

  displayInputModal(showType: string): void {
    if (showType === 'pdm') {
      this.inputContent.setValue(transformArrToListStr(this.pdmArr));
      this.inputModalTitle = 'Edit PDMs';
      this.inputModalType = 'pdms';
    } else if (showType === 'email') {
      if (this.email?.current) {
        this.emailForm.setValue({
          subject: decodeWhitespaces(this.email.current.subject),
          content: decodeWhitespaces(this.email.current.content),
          contentNoAllocation: decodeWhitespaces(
            this.email.current.contentNoAllocation
          ),
        });
      }

      this.inputModalTitle = 'Email Template';
      this.inputModalType = 'email';
    }

    this.showInputModal = true;
  }

  closeInputModal(submitted: any, inputType: string): void {
    let configChange: ConfigChange | null = null;

    if (inputType === 'pdms' && this.inputContent.dirty && submitted) {
      configChange = {
        field: this.inputModalType!,
        value: this._parseInputValue(this.inputContent.value),
      };
    }

    if (inputType === 'email' && this.emailForm.dirty && submitted) {
      configChange = {
        field: this.inputModalType!,
        value: this.emailForm.value,
      };
    }

    this.showInputModal = false;
    this.inputContent.setValue('');
    this.inputModalTitle = '';
    this.inputModalType = null;

    if (!configChange) {
      return;
    }
    this.configChanges.push(configChange);
    this._updateLocalView(configChange);
  }

  restoreEmailToDefault(): void {
    this.emailForm.setValue({
      subject: decodeWhitespaces(this.email?.default?.subject),
      content: decodeWhitespaces(this.email?.default?.content),
      contentNoAllocation: decodeWhitespaces(
        this.email?.default?.contentNoAllocation
      ),
    });
    this.emailForm.markAsDirty();
  }

  _updateLocalView(configChange: ConfigChange): void {
    const { field, value } = configChange;

    if (field === 'pdms') {
      this.pdmArr = value as string[];
      return;
    }

    if (field === 'email') {
      this.email.current = value as EmailTemplate;
    }
  }

  _parseInputValue(value: string): string | string[] {
    if (this.inputModalType === 'pdms') {
      return (this.inputContent.value.split('\n') as string[])
        .filter((entry) => entry.length)
        .map((entry) => entry.trim());
    }
    return value;
  }
}
