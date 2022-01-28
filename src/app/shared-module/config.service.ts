import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

export interface Config {
  pdms: string[];
  cc?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  _config!: Config;
  _configSubject: ReplaySubject<Config> = new ReplaySubject<Config>();
  onConfig: Observable<Config> = this._configSubject.asObservable();

  constructor() {}

  setConfig(config: Config): void {
    this._config = config;
    this._configSubject.next(config);
  }
}
