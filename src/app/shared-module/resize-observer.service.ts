import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResizeObserverService {
  private resizeObserver: ResizeObserver = new ResizeObserver((entries) =>
    this._processEntries(entries)
  );

  private subject: Subject<[string, number]> = new Subject();
  currentWidth$: Observable<[string, number]> = this.subject.asObservable();

  constructor() {}

  registerElem(elem: any) {
    this.resizeObserver.observe(elem);
  }

  deregisterElem(elem: any) {
    this.resizeObserver.unobserve(elem);
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

export class ResizeObserverServiceMock extends ResizeObserverService {
  override currentWidth$!: Observable<[string, number]>;

  constructor() {
    super();
  }

  override registerElem() {}

  override deregisterElem() {}

  override _processEntries() {}
}
