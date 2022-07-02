import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IsOnlineService {
  isOnline: boolean = false;

  constructor() {}

  setIsOnline(isOnline: boolean) {
    this.isOnline = isOnline;
  }
}
