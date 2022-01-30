import { jsPDF } from 'jspdf';
import { getClosestPastMonday } from './index';

export const exportProjectListToPDF = (elem: HTMLElement): void => {
  console.log(elem);
  const doc = new jsPDF({
    orientation: 'landscape',
    format: 'a4',
    unit: 'pt',
  });
  const date = getClosestPastMonday(new Date());

  const projectList: HTMLElement | null =
    elem.querySelector('.project-content');

  if (!projectList) {
    return;
  }

  const canvasHeight = projectList.scrollHeight + 100;

  // 541
  // 942

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  console.log({
    width,
  });

  doc.html(elem, {
    callback: function (doc) {
      doc.save();
    },
    margin: 5,
    autoPaging: 'text',
    filename: `Client dev ${date.toLocaleDateString()}`,

    html2canvas: {
      windowHeight: canvasHeight * 2,
    },
    // x: 5,
    // y: 5,
  });
};

const pixToPoints = (pix: number): number => {
  return pix + pix * 0.25;
};

const pointsToPix = (points: number): number => {
  return points * 0.5;
};
