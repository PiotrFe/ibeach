import { Injectable } from '@angular/core';
import { FetchService } from 'src/app/shared-module/fetch.service';
import { delay, Observable, of, tap } from 'rxjs';

const p = 'mck_clientdev';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn: boolean = true;
  userName: string = '';
  redirectUrl: string | null = null;

  constructor(private fetchService: FetchService) {}

  // login(name: string, password: string): Observable<any> {
  //   return this.fetchService.login(name, password).pipe(
  //     tap(({ name, authorized }: { name: string; authorized: boolean }) => {
  //       this.isLoggedIn = authorized;
  //       this.userName = name;
  //     })
  //   );
  // }

  login(name: string, password: string): Observable<any> {
    return of({ name, authorized: password === p }).pipe(
      tap(({ name, authorized }: { name: string; authorized: boolean }) => {
        this.isLoggedIn = authorized;
        this.userName = name;

        if (!authorized) {
          throw new Error('Unauthorized');
        }
      })
    );
    // return this.fetchService.login(name, password).pipe(
    //   tap(({ name, authorized }: { name: string; authorized: boolean }) => {
    //     this.isLoggedIn = authorized;
    //     this.userName = name;
    //   })
    // );
  }

  logout(): void {
    this.isLoggedIn = false;
  }
}
