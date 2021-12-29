import { Injectable } from '@angular/core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const config = {
  headers: {
    'Content-Type': 'text/plain',
  },
  responseType: 'text',
};

@Injectable({
  providedIn: 'root',
})
export class FetchService {
  constructor() {}

  async storeMasterList(weekOf: Date, data: string): Promise<Error | void> {
    const weekTs = weekOf.getTime();

    try {
      await axios.post(
        `http://localhost:4000/api/master/${weekTs}`,
        data,
        config as AxiosRequestConfig
      );
    } catch (err: any) {
      throw new Error(err.message || 'Something went wrong. Please try again');
    }
  }
}
