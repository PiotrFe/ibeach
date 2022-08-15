import { ProjectEditable } from 'src/app/project-list/project-list/project';
import { WeekEntry } from 'src/app/shared-module/week-days/week';

type csvRow = {
  id: string;
  requestor: string[];
  client: string;
  industry: string;
  type: string;
  mon: WeekEntry[];
  tue: WeekEntry[];
  wed: WeekEntry[];
  thu: WeekEntry[];
  fri: WeekEntry[];
};
type csvRowMap = {
  [key: string]: csvRow;
};

export class AllocationToCSV {
  static #headers = [
    'Leadership',
    'Client',
    'Industry',
    'Type',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
  ];

  static exportDataToCSV(data: ProjectEditable[]): string {
    const csvRowMap: csvRowMap = {};

    for (let project of data) {
      const [key, row] = this.#generateCSVMapRow(project, csvRowMap);
      csvRowMap[key] = row;
    }
    return this.#generateCSV(csvRowMap);
  }

  static #generateCSV(csvRowMap: csvRowMap): string {
    let csv: string = this.#headers.join(',');
    csv += '\n';

    for (let row of Object.values(csvRowMap)) {
      csv += this.#generateCSVRow(row);
      csv += '\n';
    }

    return csv;
  }

  static #generateCSVMapRow(
    project: ProjectEditable,
    csvRowMap: csvRowMap
  ): [key: string, row: csvRow] {
    const { client, type, leadership, week, tags } = project;
    const leadershipStr: string = leadership.reduce((str, entry) => {
      const { name } = entry;
      return `${str}-${name}`;
    }, '');

    const csvEntryKey = `${client}-${type}-${leadershipStr}`;
    let csvEntryRow: csvRow;
    const entryExists = csvEntryKey in csvRowMap;
    const { mon, tue, wed, thu, fri } = week;
    const typeMap = {
      MT: 'Mtg',
      WS: 'Workshop',
      LOP: 'LOP',
      PD: 'PD',
      OTH: 'Oth',
    };

    if (!entryExists) {
      csvEntryRow = {
        id: csvEntryKey,
        client,
        type: typeMap[type as keyof typeof typeMap],
        industry: tags.reduce((str, { type, value }) => {
          if (type.toLowerCase() === 'ind') {
            return str.length ? `${str}, ${value}` : value;
          }
          return str;
        }, ''),
        requestor: leadership.map(({ name }) => name.replace('*', '')),
        mon: [mon],
        tue: [tue],
        wed: [wed],
        thu: [thu],
        fri: [fri],
      };
    } else {
      csvEntryRow = {
        ...csvRowMap[csvEntryKey],
        mon: [...csvRowMap[csvEntryKey].mon, mon],
        tue: [...csvRowMap[csvEntryKey].tue, tue],
        wed: [...csvRowMap[csvEntryKey].wed, wed],
        thu: [...csvRowMap[csvEntryKey].thu, thu],
        fri: [...csvRowMap[csvEntryKey].fri, fri],
      };
    }

    return [csvEntryKey, csvEntryRow];
  }

  static #generateCSVRow(row: csvRow): string {
    const { requestor, client, industry, type, mon, tue, wed, thu, fri } = row;
    let csvStr = '';
    let requestorStr = requestor.sort().join(', ');
    csvStr += `"${requestorStr}",`;
    csvStr += `${client},`;
    csvStr += `${industry},`;
    csvStr += `${type},`;
    csvStr += `"${this.#generateWeekdayString(mon)}",`;
    csvStr += `"${this.#generateWeekdayString(tue)}",`;
    csvStr += `"${this.#generateWeekdayString(wed)}",`;
    csvStr += `"${this.#generateWeekdayString(thu)}",`;
    csvStr += `"${this.#generateWeekdayString(fri)}",`;

    return csvStr;
  }

  static #generateWeekdayString(entries: WeekEntry[]): string {
    const isAllocated = !entries.every((entry) => !entry);

    if (!isAllocated) {
      return 'n/a';
    }
    const nameStr = entries.reduce((str, entry) => {
      if (typeof entry === 'boolean' || str.includes(entry.text)) {
        return str;
      }
      return str.length ? `${str}+${entry.text}` : entry.text;
    }, '');

    const nameStrSorted = nameStr.split('+').sort().join(' + ');

    return nameStrSorted;
  }
}
