import { ElementRef } from '@angular/core';
import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { Week } from 'src/app/shared-module/week-days/week';
import { ContactEntry } from 'src/app/project-list/project-list/project-list.component';
import { remove as removeDiacritics } from 'diacritics';
import { compareTwoStrings } from 'string-similarity';
import { encodeWhitespaces } from 'src/app/utils';
import { EmailTemplate } from 'src/app/shared-module/config.service';

export class Email {
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
  _calString!: string;
  _daysString!: string;
  _chargeCode!: string;

  constructor(private addressBook: ContactEntry[]) {}

  withTo(contacts: string[]) {
    const noDuplArr = Array.from(new Set(contacts));

    this._to = noDuplArr
      .map((person) => getEmail(person, this.addressBook))
      .reduce((acc, item, idx, arr) => {
        if (idx < arr.length - 1) {
          return `${acc}${item};`;
        }

        return `${acc}${item}`;
      }, '');

    this._firstNameString = noDuplArr.reduce((acc, item, idx, arr): string => {
      const fName = item.split(' ')[0];

      if (idx < arr.length - 2) {
        return `${acc}${fName}, `;
      }

      if (idx === arr.length - 2) {
        return `${acc}${fName} and `;
      }

      return `${acc}${fName}`;
    }, '');

    return this;
  }

  withCC(names: string[]) {
    const ccList = Array.from(
      new Set(names.map((name) => getEmail(name, this.addressBook)))
    );

    this._cc = ccList.reduce((acc, item, idx, arr) => {
      if (idx < arr.length - 1) {
        return `${acc}${item}, `;
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

  withCalAllocation(week: Week) {
    Object.entries(week).forEach(([key, val]) => {
      if (typeof val !== 'boolean') {
        const day = capitalizeFirst(key);
        const calString = `${day}: ${val.text.split(' ')[0]}%0D%0A`;

        this._calString = this._calString
          ? (this._calString += calString)
          : calString;
      }
    });

    return this;
  }

  withDays(week: Week) {
    const allocatedEntries = Object.values(week)
      .filter((val) => typeof val !== 'boolean')
      .map((entry) => entry.text);
    this._daysString =
      allocatedEntries.length === 5 ? 'Mon-Fri' : getDaysString(week);

    const individuals = Array.from(new Set(allocatedEntries));

    if (individuals.length > 1) {
      this.withCalAllocation(week);
    }

    return this;
  }

  withSubject(subject: string | undefined) {
    const generateSubject = () => {
      this._subject = subject!
        .replace(/\[CLIENT\]/g, `${this._client}`)
        .replace(/\[DAYS\]/g, `${this._daysString ? this._daysString : ''}`)
        .replace(/\(\)/g, '');
    };

    const setFallbackSubject = () => {
      this._subject = `Client development support${
        this._client ? ` - ${this._client}` : ''
      }${this._daysString ? ` (${this._daysString})` : ''}`;
    };

    if (subject) {
      generateSubject();
    } else {
      setFallbackSubject();
    }

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

  withBody(emailBody: EmailTemplate | undefined, withAllocation: boolean) {
    const generateBody = () => {
      if (withAllocation) {
        const body = emailBody!.content
          .replace(/\[FIRST\]/g, `${this._firstNameString}`)
          .replace(/\[CST\]/g, `${this._leadershipString}`)
          .replace(/\[TYPE\]/g, `${this._projectType}`)
          .replace(/\[CLIENT\]/g, `${this._client}`)
          .replace(
            /\n\n\[ALLOCATION\]\n\n/g,
            `${this._calString ? `\n\n${this._calString}\n` : '\n\n'}`
          )
          .replace(
            /\[ALLOCATION\]/g,
            `${this._calString ? `${this._calString}` : ''}` // fallback replace if a user removes spaces under settings
          );

        this._body = encodeWhitespaces(body);
      } else {
        const body = emailBody!.contentNoAllocation
          .replace(/\[CST\]/g, `${this._firstNameString}`)
          .replace(/\[TYPE\]/g, `${this._projectType}`)
          .replace(/\[CLIENT\]/g, `${this._client}`);

        this._body = encodeWhitespaces(body);
      }
    };

    const getFallbackBody = () => {
      const arr = ['a', 'e', 'i', 'o', 'u', 'l'];

      if (withAllocation) {
        const str = `Dear ${
          this._firstNameString
        },%0D%0A%0D%0AI hope you had a nice weekend.%0D%0A%0D%0ACould you support ${
          this._leadershipString
        } in preparing ${
          arr.includes(this._projectType[0].toLowerCase()) ? 'an' : 'a'
        } ${this._projectType} ${
          this._client ? `for ${this._client}` : ''
        }?  The team will be in touch soon with further details. On a timesheet, please use XXX for the time spent on the beach.${
          this._calString ? `%0D%0A%0D%0A${this._calString}` : ''
        }%0D%0A${this._calString ? '' : '%0D%0A'}Best,%0D%0APD Team`;

        this._body = str;
      } else {
        this._body = `Dear ${this._firstNameString},%0D%0A%0D%0AI hope you had a nice weekend.%0D%0A%0D%0AAt the moment we unfortunately do not have anyone who could support the above.  We will get in touch as soon as any beach resources free up.%0D%0A%0D%0ABest,%0D%0APD Team`;
      }
    };

    if (emailBody) {
      generateBody();
    } else {
      getFallbackBody();
    }

    return this;
  }

  build() {
    return new Email(this._to, this._cc, this._bcc, this._subject, this._body);
  }
}

const getEmail = (name: string, addressBook: ContactEntry[]): string => {
  if (!name.length) {
    return '';
  }

  if (!addressBook) {
    return `${name.replace(' ', '_')}@email___not___found.com`;
  }

  const nameCleared = removeDiacritics(name).toLowerCase();

  const entry: ContactEntry | undefined = addressBook.find(
    ({ first, last }) => {
      const nameToCompare = `${first} ${last}`.toLowerCase();

      const coverage = compareTwoStrings(nameCleared, nameToCompare);

      if (coverage > 0.8) {
        return true;
      }
      return false;
    }
  );

  return entry
    ? entry.email
    : `${name.replace(' ', '_')}@email___not___found.com`;
};

export const generateEmail = (
  project: ProjectEditable,
  container: ElementRef,
  addressBook: ContactEntry[],
  emailTemplate?: EmailTemplate
) => {
  const emailBuilder = new EmailBuilder(addressBook);

  const allocationDone = Object.values(project.week).find(
    (val) => typeof val !== 'boolean'
  );

  const email = allocationDone
    ? emailBuilder
        .withTo(
          Object.values(project.week)
            .filter((val) => typeof val !== 'boolean')
            .map((val) => val.text)
        )
        .withCC(project.leadership)
        .withClient(project.client)
        .withProjectType(project.type)
        .withDays(project.week)
        .withSubject(emailTemplate?.subject)
        .withBody(emailTemplate, true)
        .build()
    : emailBuilder
        .withTo(project.leadership)
        .withClient(project.client)
        .withProjectType(project.type)
        .withSubject(emailTemplate?.subject)
        .withBody(emailTemplate, false)
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

  if (email.body) {
    href += `body=${email.body}&`;
  }

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
  container.nativeElement.appendChild(anchor);

  anchor.click();
};

const capitalizeFirst = (str: string): string => {
  if (str === '') {
    return '';
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
};

const getDaysString = (week: Week): string => {
  const arr: (string | boolean)[] = [];
  let str = '';

  Object.entries(week).forEach(([key, val]) => {
    if (typeof val !== 'boolean') {
      arr.push(String(key));
    } else {
      arr.push(false);
    }
  });

  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      if (str === '' || !arr[i - 1] || (arr[i - 1] && !arr[i + 1])) {
        str += capitalizeFirst(arr[i] as string);
      }
      if (arr[i + 1] && !arr[i - 1]) {
        str += '-';
      }
    } else {
      if (arr[i - 1] && i !== arr.length - 1) {
        str += ', ';
      }
    }
  }

  if (str[str.length - 2] === ',') {
    str = str.slice(0, str.length - 2);
  }

  return str;
};
