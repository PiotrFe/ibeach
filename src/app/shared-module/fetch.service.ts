import { Injectable } from '@angular/core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConnectableObservable } from 'rxjs';
import { Person } from 'src/app/people-list/person';

const config = {
  headers: {
    'Content-Type': 'text/plain',
  },
  responseType: 'text',
};

const baseUrl = 'http://localhost:4000/api';

@Injectable({
  providedIn: 'root',
})
export class FetchService {
  constructor() {}

  async storeMasterList(weekOf: Date, data: string): Promise<Error | void> {
    const weekTs = weekOf.getTime();

    try {
      await axios.post(
        `${baseUrl}/master/${weekTs}`,
        data,
        config as AxiosRequestConfig
      );
    } catch (err: any) {
      throw new Error(err.message || 'Something went wrong. Please try again');
    }
  }

  async fetchWeeklyList(weekOf: Date): Promise<{
    people: Person[];
    status: { pending: string[]; done: string[] };
  }> {
    const weekTs = weekOf.getTime();

    try {
      const response = await axios.get(`${baseUrl}/week/${weekTs}`, {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status === 404) {
        throw new Error('No data');
      }

      const { data, statusSummary } = response.data;

      return {
        people: data.map((person: any) => {
          const { availDate, ...otherProps } = person;
          return {
            ...otherProps,
            availDate: new Date(Date.parse(availDate)),
          };
        }),
        status: statusSummary,
      };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
