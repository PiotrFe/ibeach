import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResizeObserverService {
  private resizeObserver: ResizeObserver = new ResizeObserver((entries) =>
    this._processEntries(entries)
  );

  private subject: ReplaySubject<[string, number]> = new ReplaySubject();
  currentWidth$!: Observable<[string, number]>;

  constructor() {}

  registerElem(elem: any) {
    this.resizeObserver.observe(elem);
    this.currentWidth$ = this.subject.asObservable();
  }

  deregisterElemAndUnsubscribe(elem: any) {
    this.resizeObserver.unobserve(elem);
    // this.subject.complete();
    // TODO - remove memory lead here
  }

  _processEntries(entries: ResizeObserverEntry[]) {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      const { id } = entry.target;

      if (width === 0 || height === 0) {
        continue;
      }

      if (width < 720) {
        this.subject.next([id, 1]);
      } else if (width >= 720 && width < 800) {
        this.subject.next([id, 2]);
      } else if (width >= 800 && width < 950) {
        this.subject.next([id, 3]);
      } else if (width >= 950) {
        this.subject.next([id, 4]);
      }
    }
  }
}
