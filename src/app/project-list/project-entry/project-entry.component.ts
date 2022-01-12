import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { EntryComponent } from 'src/app/shared-module/entry/entry.component';
import { Project, ProjectEditable } from '../project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import {
  AllocateService,
  AllocationEntry,
} from 'src/app/shared-module/allocate.service';

@Component({
  selector: 'project-entry',
  templateUrl: './project-entry.component.html',
  styleUrls: ['./project-entry.component.scss'],
})
export class ProjectEntryComponent extends EntryComponent implements OnInit {
  project!: ProjectEditable;

  @ViewChild('entryContainer') entryContainer!: ElementRef;

  constructor(
    private allocateService: AllocateService,
    private dragAndDrop: DragAndDropService,
    typeaheadService: TypeaheadService
  ) {
    super(typeaheadService);
  }

  ngOnInit(): void {
    const entry = this.entryData as Project;
    this.project = {
      ...entry,
      inEditMode: false,
    };
  }

  handleEdit(): void {
    this.editEvent.emit(this.id);
  }

  handleDelete(): void {
    this.deleteEvent.emit(this.id);
  }

  onCalendarChange(calendarObj: Week) {
    this.calendarChangeEvent.emit({ calendarObj, id: this.id });
  }

  onAllocation(event: any): void {
    const { id, value, day } = event;
    const allocationEntry: AllocationEntry = {
      person: {
        id,
        value,
      },
      project: {
        id: this.project.id,
        value: this.project.client,
      },
      day,
    };

    this.allocateService.registerAllocation(
      this.referenceDate,
      allocationEntry
    );
  }
  handleDragStart(event: any) {
    this.dragAndDrop.onDragStart(event, this.id, 'match', 'projects');
    return false;
  }

  getFieldClasses(fieldName: string): string {
    const baseClass = `section section-${fieldName} mr-12 flex flex-ver-ctr pl-3`;
    const sortedClass = fieldName === this.sortField ? ' sorted' : '';
    let otherClass = '';

    if (fieldName === 'name') {
      otherClass += ` draggable draggable-projects`;
    }

    if (fieldName === 'comments') {
      otherClass += ` section-comments--project`;
    }

    if (fieldName === 'leadership') {
      otherClass += ` fs-07`;
    }

    // if (this.entryData.daysLeft > 0) {
    //   otherClass += ' droppable droppable-people';
    // }

    return `${baseClass}${sortedClass}${otherClass}`;
  }

  generateEmail() {
    const project = this.entryData as ProjectEditable;
    const allocatedPeople = Array.from(
      new Set(
        Object.values(this.entryData.week)
          .filter((value) => typeof value !== 'boolean')
          .map(({ text }) => getEmail(text))
      )
    );
    const leadership = Array.from(
      new Set(project.leadership.map((name) => getEmail(name)))
    );

    const emailBuilder = new EmailBuilder();

    const email = emailBuilder
      .withTo(allocatedPeople)
      .withCC(leadership)
      .withSubject((this.entryData as ProjectEditable).client)
      .withProjectType(project.type)
      .withClient(project.client)
      .withBody()
      .build();

    let href = `mailto:${email.to}?`;

    if (email.cc) {
      href += `cc=${email.cc}&`;
    }

    if (email.bcc) {
      href += `bcc=${email.bcc}&`;
    }

    if (email.subject) {
      href += `subject=${email.subject}&`;
    }

    console.log(email);

    // if (email.body) {
    //   href += `body=${email.body}&`;
    // }

    if (href[href.length - 1] === '&' || href[href.length - 1] === '?') {
      href = href.slice(0, href.length - 1);
    }

    const anchor: HTMLAnchorElement = document.createElement('a');
    anchor.href = href;
    anchor.style.display = 'none';
    anchor.onclick = () => {
      setTimeout(() => {
        anchor.remove();
      }, 100);
    };
    this.entryContainer.nativeElement.appendChild(anchor);

    anchor.click();
  }
}

const getEmail = (name: string) => {
  if (name === '') {
    return '';
  }
  const nameParts = name.split(' ');

  return `${nameParts[0]}_${nameParts.slice(1).join()}@test.com`;
};

class Email {
  to!: string;
  cc!: string;
  bcc!: string;
  subject!: string;
  body!: string;

  constructor(
    to: string,
    cc: string,
    bcc: string,
    subject: string,
    body: string
  ) {
    this.to = to;
    this.cc = cc;
    this.bcc = bcc;
    this.subject = subject;
    this.body = body;
  }

  getPreview(): any {
    return {
      to: this.to,
      cc: this.cc,
      bcc: this.bcc,
      subject: this.subject,
      body: this.body,
    };
  }
}

class EmailBuilder {
  _to!: string;
  _cc!: string;
  _bcc!: string;
  _subject!: string;
  _body!: string;
  _firstNameString!: string;
  _leadershipString!: string;
  _projectType!: string;
  _client!: string;

  withTo(emails: string[]) {
    this._to = emails.reduce((acc, item, idx, arr) => {
      if (idx < arr.length - 1) {
        return `${acc}${item};`;
      }

      return `${acc}${item}`;
    }, '');

    this._firstNameString = emails
      .map((entry) => entry.split('_')[0])
      .reduce((acc, item, idx, arr): string => {
        if (idx < arr.length - 2) {
          return `${acc}${item}, `;
        }

        if (idx === arr.length - 2) {
          return `${acc}${item} and `;
        }

        return `${acc}${item}`;
      }, '');

    return this;
  }

  withCC(names: string[]) {
    this._cc = names.reduce((acc, item, idx, arr) => {
      if (idx < arr.length - 1) {
        return `${acc}${item};`;
      }

      return `${acc}${item}`;
    }, '');

    this._leadershipString = names
      .map((entry) => entry.split(' ')[0])
      .reduce((acc, item, idx, arr): string => {
        if (idx < arr.length - 2) {
          return `${acc}${item}, `;
        }

        if (idx === arr.length - 2) {
          return `${acc}${item} and `;
        }

        return `${acc}${item}`;
      }, '');

    return this;
  }

  withSubject(client: string) {
    this._subject = `Client development support - ${client}`;

    return this;
  }

  withProjectType(type: string) {
    this._projectType = type;

    return this;
  }

  withClient(client: string) {
    this._client = client;

    return this;
  }

  withBody(content: string | undefined = undefined) {
    if (content) {
      this._body = content;
    } else {
      this._body = `${this._firstNameString},
      I hope you had a nice weekend.
      
      Could you support ${this._leadershipString} in preparing ${
        ['a', 'e', 'i', 'o', 'u', 'l'].includes(this._projectType[0])
          ? 'an'
          : 'a'
      } ${this._projectType} ${
        this._client ? `for ${this._client}` : ''
      } this week? The team will be in touch soon with further details.
      
      Best,
      PD Team`;
    }

    return this;
  }

  build() {
    return new Email(this._to, this._cc, this._bcc, this._subject, this._body);
  }
}
