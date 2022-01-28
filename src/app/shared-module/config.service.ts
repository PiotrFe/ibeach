import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { FetchService } from 'src/app/shared-module/fetch.service';

export interface Config {
  pdms: string[];
  cc?: string;
}

export interface ConfigChange {
  field: keyof Config;
  value: string | string[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  _config!: Config;
  _configSubject: ReplaySubject<Config> = new ReplaySubject<Config>();
  onConfig: Observable<Config> = this._configSubject.asObservable();

  constructor(private fetch: FetchService) {}

  setConfig(config: Config): void {
    this._config = config;
    this._configSubject.next(config);
  }

  updateConfig(changes: ConfigChange[]): void {
    this.fetch.saveConfig(changes).subscribe({
      next: (updatedConfig: Config) => {
        this._config = updatedConfig;
        this._configSubject.next(updatedConfig);
      },
    });
  }
}
