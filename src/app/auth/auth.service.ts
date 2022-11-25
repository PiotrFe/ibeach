import { Injectable } from '@angular/core';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { delay, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn: boolean = true;
  userName: string = '';
  redirectUrl: string | null = null;

  constructor(private fetchService: FetchService) {}

  login(name: string, password: string): Observable<any> {
    return this.fetchService.login(name, password).pipe(
      tap(({ name, authorized }: { name: string; authorized: boolean }) => {
        this.isLoggedIn = authorized;
        this.userName = name;
      })
    );
  }

  logout(): void {
    this.isLoggedIn = false;
  }
}
