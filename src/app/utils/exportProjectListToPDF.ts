import { jsPDF } from 'jspdf';
import { getClosestPastMonday } from './index';

export const exportProjectListToPDF = (elem: HTMLElement): void => {
  const listNode: Node = elem.cloneNode(true);
  const list = document.createElement('div');
  list.appendChild(listNode);

  const icons = list.querySelectorAll('.bi-envelope');
  const buttons = list.querySelectorAll('.btn-primary--light');
  const alerts = list.querySelectorAll(".alert");

  icons.forEach((icon) => {
    icon.parentElement?.removeChild(icon);
  });

  alerts.forEach(alert => {
    alert.parentElement?.removeChild(alert);
  })

  buttons.forEach((button) => {
    button.classList.remove('btn-primary--light');
    button.classList.add('btn-primary--light-printable');
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    format: 'a4',
    unit: 'px',
  });
  const listHeader: HTMLElement | null = elem.querySelector('.entry-header');
  const projectList: HTMLElement | null =
    elem.querySelector('.project-content');

  if (!projectList || !listHeader) {
    return;
  }

  const date = getClosestPastMonday(new Date());
  const elemWidth = projectList.scrollWidth;
  const elemHeight = projectList.scrollHeight;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.html(list, {
    callback: function (doc) {
      doc.save();
    },
    html2canvas: {
      windowHeight: elemHeight * 2,
      scrollY: -window.scrollY,
    },
    margin: [15, 0, 15, 0],
    autoPaging: 'text',
    filename: `Client dev ${date.toLocaleDateString()}`,
    windowWidth: elemWidth,
    width: pageWidth,
  });
};
