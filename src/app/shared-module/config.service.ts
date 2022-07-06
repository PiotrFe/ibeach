import { Injectable } from '@angular/core';
import { ReplaySubject, Observable, Subscription } from 'rxjs';
import { defaultEmailTemplate } from 'src/app/utils/defaultEmailTemplates';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { DataStoreService } from 'src/app/shared-module/data-store.service';
import { DataStore } from 'src/app/utils/StorageManager';
import { IsOnlineService } from 'src/app/shared-module/is-online.service';

export interface EmailTemplate {
  subject: string;
  content: string;
  contentNoAllocation: string;
}

export interface EmailConfig {
  current: EmailTemplate;
  default: EmailTemplate;
}

export interface Config {
  pdms: string[];
  email: EmailConfig;
}

export interface ConfigChange {
  field: keyof Config;
  value: string | string[] | EmailTemplate;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  _config!: Config;
  _configSubject: ReplaySubject<Config> = new ReplaySubject<Config>();
  onConfig: Observable<Config> = this._configSubject.asObservable();
  subscription!: Subscription;

  constructor(
    private fetch: FetchService,
    private dataStoreService: DataStoreService,
    private isOnlineService: IsOnlineService
  ) {
    this.#init();
  }

  #init() {
    if (!this.isOnlineService.isOnline) {
      const config = this.dataStoreService.getConfig();
      if (!config.email.current.content) {
        config.email.current = defaultEmailTemplate;
        config.email.default = defaultEmailTemplate;
      }
      this.setConfig(config);
      this.subscription = this.dataStoreService.storeData$.subscribe({
        next: (data: DataStore) => {
          this.setConfig(data.config);
        },
      });
    }
  }

  getEmailTemplate(): EmailTemplate {
    return this._config.email.current;
  }

  getPDMs(): string[] {
    return this._config.pdms.map((pdm) => pdm.toLowerCase());
  }

  setConfig(config: Config) {
    const pdms = [...config.pdms].sort();
    this._config = { ...config, pdms };
    this._configSubject.next(this._config);
  }

  updateConfig(changes: ConfigChange[]) {
    if (this.isOnlineService.isOnline) {
      this.#updateConfigOnline(changes);
    } else {
      this.#updateConfigLocally(changes);
    }
  }

  #updateConfigOnline(changes: ConfigChange[]) {
    this.fetch.saveConfig(changes).subscribe({
      next: (updatedConfig: Config) => {
        this._config = updatedConfig;
        this._configSubject.next(updatedConfig);
      },
    });
  }

  #updateConfigLocally(changes: ConfigChange[]) {
    const newConfig = this.dataStoreService.saveChangesToConfig(changes);
    this.setConfig(newConfig);
  }
}
