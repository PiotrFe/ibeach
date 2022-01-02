import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResizeObserverService {
  private resizeObserver: ResizeObserver = new ResizeObserver((entries) =>
    this._processEntries(entries)
  );

  private subject!: ReplaySubject<number>;
  currentWidth$!: Observable<number>;

  constructor() {}

  registerElem(elem: any) {
    this.resizeObserver.observe(elem);
    this.subject = new ReplaySubject();
    this.currentWidth$ = this.subject.asObservable();
  }

  deregisterElemAndUnsubscribe(elem: any) {
    this.resizeObserver.unobserve(elem);
    this.subject.complete();
  }

  _processEntries(entries: ResizeObserverEntry[]) {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;

      if (width === 0 || height === 0) {
        continue;
      }

      if (width < 720) {
        this.subject.next(1);
      } else if (width >= 720 && width < 800) {
        this.subject.next(2);
      } else if (width >= 800 && width < 950) {
        this.subject.next(3);
      } else if (width >= 950) {
        this.subject.next(4);
      }
    }
  }
}
