import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { FetchService } from 'src/app/shared-module/fetch.service';

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
  value: string | string[] | EmailConfig;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  _config!: Config;
  _configSubject: ReplaySubject<Config> = new ReplaySubject<Config>();
  onConfig: Observable<Config> = this._configSubject.asObservable();

  constructor(private fetch: FetchService) {
    console.log('RUNNING REAL CONFIG SERVICE');
  }

  setConfig(config: Config): void {
    console.log('RUNNING REAL CONFIG SERVICE');
    this._config = config;
    this._configSubject.next(config);
  }

  updateConfig(changes: ConfigChange[]): void {
    console.log('RUNNING REAL CONFIG SERVICE');
    this.fetch.saveConfig(changes).subscribe({
      next: (updatedConfig: Config) => {
        this._config = updatedConfig;
        this._configSubject.next(updatedConfig);
      },
    });
  }
}
