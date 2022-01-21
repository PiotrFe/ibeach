import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { FetchService, WeeklyData, baseUrl } from './fetch.service';
import { Person } from 'src/app/people-list/person';
import { Project } from '../project-list/project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import { AllocationEntry } from './allocate.service';

let httpClientSpy: jasmine.SpyObj<HttpClient>;

describe('FetchService', () => {
  let service: FetchService;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', {
      get: of(''),
      post: of(''),
      patch: of(''),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpClientSpy }],
    });
    service = TestBed.inject(FetchService);
    // httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and return weekly data', () => {
    const expectedData = {
      people: [],
      statusSummary: { pending: [], done: [] },
      lookupTable: [],
    };

    httpClientSpy.get.and.returnValue(of(expectedData));

    service.fetchWeeklyList(new Date()).subscribe({
      next(data) {
        expect(data).toEqual(expectedData);
        expect(httpClientSpy.get).toHaveBeenCalled();
      },
    });
  });

  it('should save people list', () => {
    const date = new Date();
    const weekTs = date.getTime();
    const PDM = 'John Smith';
    const pdmParam = encodeURIComponent(PDM);
    const url = `${baseUrl}/people/${weekTs}/${pdmParam}`;
    const data: Person[] = [];

    service.saveList(date, PDM, data).subscribe({
      next() {
        expect(httpClientSpy.post).toHaveBeenCalledOnceWith(url, data);
      },
    });
  });

  it('should submit people list', () => {
    const date = new Date();
    const weekTs = date.getTime();
    const PDM = 'John Smith';
    const pdmParam = encodeURIComponent(PDM);
    const url = `${baseUrl}/people/${weekTs}/${pdmParam}/submit`;
    const data: Person[] = [];

    service.submitList(date, PDM, data).subscribe({
      next() {
        expect(httpClientSpy.post).toHaveBeenCalledOnceWith(url, data);
      },
    });
  });

  it('should fetch projects list', () => {
    const date = new Date();
    const weekTs = date.getTime();
    const url = `${baseUrl}/projects/${weekTs}`;

    service.fetchProjectList(date).subscribe({
      next() {
        expect(httpClientSpy.get).toHaveBeenCalledOnceWith(url);
      },
    });
  });

  it('should save projects list', () => {
    const date = new Date();
    const weekTs = date.getTime();
    const data: Project[] = [];
    const url = `${baseUrl}/projects/${weekTs}`;

    service.saveProjectList(date, data).subscribe({
      next() {
        expect(httpClientSpy.post).toHaveBeenCalledOnceWith(url, data);
      },
    });
  });

  it('should store allocation entry', () => {
    const date = new Date();
    const weekTs = date.getTime();
    const data = { day: 'match' as keyof Week | 'match' };
    const url = `${baseUrl}/allocate/${weekTs}`;

    service.saveAllocationEntry(date, data).subscribe({
      next() {
        expect(httpClientSpy.patch).toHaveBeenCalledOnceWith(url, data);
      },
    });
  });
});

export class FetchServiceStub extends FetchService {
  constructor() {
    const http: jasmine.SpyObj<HttpClient> = jasmine.createSpyObj(
      'HttpClient',
      {
        get: of(''),
        post: of(''),
        patch: of(''),
      }
    );

    super(http);
  }
}
