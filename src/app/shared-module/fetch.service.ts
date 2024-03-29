import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, catchError, Observable } from 'rxjs';
import { Person } from 'src/app/people-list/person';
import { Project } from 'src/app/project-list/project-list/project';
import { AllocationEntry } from 'src/app/shared-module/allocate.service';
import { Config, ConfigChange } from 'src/app/shared-module/config.service';
import { StatsEntry } from 'src/app/stats/stats-entry/stats-entry.component';

// export const baseAuthUrl = 'https://ibeach-api.herokuapp.com';
export const baseAuthUrl =
  'http://node-express-env.eba-nhpwnnsc.eu-central-1.elasticbeanstalk.com';
export const baseUrl = 'http://localhost:3000';

export interface WeeklyData {
  people: Person[];
  statusSummary: { pending: string[]; done: string[] };
  lookupTable: Person[];
  config: Config;
}

@Injectable({
  providedIn: 'root',
})
export class FetchService {
  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.log('An error occured: ', error.error);
    } else {
      console.error(
        `Backend returned code ${error.status}, body was: `,
        error.error
      );
    }

    return throwError(() => error);
  }

  login(name: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${baseAuthUrl}/auth`, {
        name,
        password,
      })
      .pipe(catchError(this.handleError));
  }

  storeMasterList(weekOf: Date, data: any): Observable<unknown> {
    const weekTs = weekOf.getTime();

    return this.http
      .post<any>(`${baseUrl}/master/${weekTs}`, data)
      .pipe(catchError(this.handleError));
  }

  fetchWeeklyList(
    weekOf: Date,
    skipFetchingLookupTable?: boolean,
    submittedOnly?: boolean
  ): Observable<WeeklyData> {
    const weekTs = weekOf.getTime();
    const finalUrl = new URL(`${baseUrl}/people/${weekTs}`);

    finalUrl.searchParams.append('submitted', String(Boolean(submittedOnly)));

    finalUrl.searchParams.append(
      'skiplookup',
      String(Boolean(skipFetchingLookupTable))
    );
    finalUrl.searchParams.append(
      'getconfig',
      String(Boolean(!skipFetchingLookupTable))
    );

    return this.http
      .get<WeeklyData>(finalUrl.href)
      .pipe(catchError(this.handleError));
  }

  saveList(weekOf: Date, pdm: string, data: Person[]): Observable<unknown> {
    const weekTs = weekOf.getTime();
    const pdmParam = encodeURIComponent(pdm);

    return this.http
      .post<Person[]>(`${baseUrl}/people/${weekTs}/${pdmParam}`, data)
      .pipe(catchError(this.handleError));
  }

  submitList(weekOf: Date, pdm: string, data: Person[]): Observable<unknown> {
    const weekTs = weekOf.getTime();
    const pdmParam = encodeURIComponent(pdm);

    return this.http
      .post(`${baseUrl}/people/${weekTs}/${pdmParam}/submit`, data)
      .pipe(catchError(this.handleError));
  }

  fetchProjectList(weekOf: Date): Observable<Project[]> {
    const weekTs = weekOf.getTime();
    const weekUrl = `${baseUrl}/projects/${weekTs}`;

    return this.http.get<Project[]>(weekUrl).pipe(catchError(this.handleError));
  }

  saveProjectList(weekOf: Date, data: Project[]): Observable<unknown> {
    const weekTs = weekOf.getTime();

    return this.http
      .post<Project[]>(`${baseUrl}/projects/${weekTs}`, data)
      .pipe(catchError(this.handleError));
  }

  saveAllocationEntry(weekOf: Date, data: AllocationEntry): Observable<any> {
    const weekTs = weekOf.getTime();

    return this.http
      .patch<any>(`${baseUrl}/allocate/${weekTs}`, data)
      .pipe(catchError(this.handleError));
  }

  fetchContactData(): Observable<any> {
    return this.http
      .get(`${baseUrl}/contacts`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }
  //
  saveConfig(data: ConfigChange[]): Observable<Config> {
    return this.http
      .patch<Config>(`${baseUrl}/config`, data)
      .pipe(catchError(this.handleError));
  }

  fetchHistory(
    dateRange: [Date, Date],
    cstView: boolean
  ): Observable<StatsEntry[]> {
    const url = new URL('/history', `${baseUrl}`);
    url.searchParams.set('from', String(dateRange[0].getTime()));
    url.searchParams.set('to', String(dateRange[1].getTime()));
    url.searchParams.set('cstView', String(Number(cstView)));

    return this.http
      .get<StatsEntry[]>(url.href)
      .pipe(catchError(this.handleError));
  }
}
