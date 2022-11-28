import { Injectable, OnDestroy } from '@angular/core';
import { Observable, pipe, interval, Subject } from 'rxjs';

const hour = 1000 * 60 * 60;

@Injectable({
  providedIn: 'root',
})
export class RefreshNowTsService implements OnDestroy {
  #tsSubject$: Subject<number> = new Subject<number>();
  timestamp$ = this.#tsSubject$.asObservable();
  #timeoutCb: any = () => {
    const ts = Date.now();
    this.#tsSubject$.next(ts);
  };
  timeout: any = setTimeout(this.#timeoutCb, hour);

  constructor() {}

  ngOnDestroy(): void {
    clearTimeout(this.#timeoutCb);
  }
}
