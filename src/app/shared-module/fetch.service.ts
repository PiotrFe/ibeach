import { Injectable } from '@angular/core';
import axios, { AxiosRequestConfig } from 'axios';
import { Person, PersonEditable } from 'src/app/people-list/person';
import { Project } from 'src/app/project-list/project-list/project';

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

  async fetchWeeklyList(
    weekOf: Date,
    pdm?: string,
    submittedOnly?: boolean
  ): Promise<{
    people: Person[];
    status: { pending: string[]; done: string[] };
    lookupTable: Person[];
  }> {
    const weekTs = weekOf.getTime();
    const weekUrl = `${baseUrl}/people/${weekTs}`;
    const finalUrl = pdm
      ? new URL(`${weekUrl}/${encodeURIComponent(pdm)}`)
      : new URL(weekUrl);

    if (submittedOnly) {
      finalUrl.searchParams.append('submitted', 'true');
    }

    try {
      const response = await axios.get(finalUrl.href, {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status === 404) {
        throw new Error('No data');
      }

      const { data, statusSummary, lookupTable } = response.data;

      return {
        people: data.map((person: any) => {
          const { availDate, ...otherProps } = person;
          return {
            ...otherProps,
            availDate: new Date(Date.parse(availDate)),
          };
        }),
        status: statusSummary,
        lookupTable,
      };
    } catch (err: any) {
      throw new Error(err.message);
    }
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

  async submitList(weekOf: Date, pdm: string, data: Person[]): Promise<void> {
    const weekTs = weekOf.getTime();
    const pdmParam = encodeURIComponent(pdm);

    try {
      return await axios.post(
        `${baseUrl}/people/${weekTs}/${pdmParam}/submit`,
        JSON.stringify(data),
        config as AxiosRequestConfig
      );
    } catch (e: any) {
      console.log(e);
      return e.message;
    }
  }

  async fetchProjectList(weekOf: Date): Promise<Project[]> {
    const weekTs = weekOf.getTime();
    const weekUrl = `${baseUrl}/projects/${weekTs}`;

    try {
      const response = await axios.get(weekUrl, {
        validateStatus: (status) => {
          return status < 500;
        },
      });

      if (response.status === 404) {
        throw new Error('No data');
      }

      const { data } = response.data;

      return data.map((entry: any) => {
        const { availDate, ...otherProps } = entry;
        return {
          ...otherProps,
          availDate: new Date(Date.parse(availDate)),
        };
      });
    } catch (err: any) {
      throw new Error(err.message);
    }
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
