import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import axios, { AxiosRequestConfig } from 'axios';
import { kill } from 'process';
import { throwError, catchError, retry, Observable, map } from 'rxjs';
import { Person, PersonEditable } from 'src/app/people-list/person';
import { Project } from 'src/app/project-list/project-list/project';

const config = {
  headers: {
    'Content-Type': 'text/plain',
  },
  responseType: 'text',
};

const baseUrl = 'http://localhost:4000/api';

export interface WeeklyData {
  people: Person[];
  statusSummary: { pending: string[]; done: string[] };
  lookupTable: Person[];
}

@Injectable({
  providedIn: 'root',
})
export class FetchService {
  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.log({ error });
    if (error.status === 0) {
      console.log('An error occured: ', error.error);
    } else if (error.status === 404) {
      console.log('An 404 error occured: ', error.error);
      return throwError(() => new Error('No data'));
    } else {
      console.error(
        `Backend return code ${error.status}, body was: `,
        error.error
      );
    }

    return throwError(
      () => new Error('Something went wrong. Please try again')
    );
  }

  storeMasterList(weekOf: Date, data: any): Observable<unknown> {
    const weekTs = weekOf.getTime();

    return this.http
      .post<any>(`${baseUrl}/master/${weekTs}`, data)
      .pipe(catchError(this.handleError));
  }

  fetchWeeklyList(
    weekOf: Date,
    pdm?: string,
    submittedOnly?: boolean
  ): Observable<WeeklyData> {
    const weekTs = weekOf.getTime();
    const weekUrl = `${baseUrl}/people/${weekTs}`;
    const finalUrl = pdm
      ? new URL(`${weekUrl}/${encodeURIComponent(pdm)}`)
      : new URL(weekUrl);

    if (submittedOnly) {
      finalUrl.searchParams.append('submitted', 'true');
    }

    return this.http
      .get<WeeklyData>(finalUrl.href)
      .pipe(catchError(this.handleError));
  }

  async saveList(weekOf: Date, pdm: string, data: Person[]): Promise<void> {
    const weekTs = weekOf.getTime();
    const pdmParam = encodeURIComponent(pdm);

    try {
      return await axios.post(
        `${baseUrl}/people/${weekTs}/${pdmParam}`,
        JSON.stringify(data),
        config as AxiosRequestConfig
      );
    } catch (e: any) {
      console.log(e);
      return e.message;
    }
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

  async saveProjectList(weekOf: Date, data: Project[]): Promise<void> {
    const weekTs = weekOf.getTime();

    try {
      return await axios.post(
        `${baseUrl}/projects/${weekTs}`,
        JSON.stringify(data),
        config as AxiosRequestConfig
      );
    } catch (e: any) {
      console.log(e);
      return e.message;
    }
  }
}
