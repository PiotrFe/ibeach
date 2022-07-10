import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AllocateService } from 'src/app/shared-module/allocate.service';
import { Week } from './week-days/week';

export interface DragAndDropEvent {
  type: 'dragstart' | 'drop';
  draggable?: Element | null;
  droppable?: Element | null;
}

@Injectable({
  providedIn: 'root',
})
export class DragAndDropService {
  _subject: Subject<DragAndDropEvent> = new Subject<DragAndDropEvent>();
  onDragAndDrop$: Observable<DragAndDropEvent> = this._subject.asObservable();

  constructor(private allocateService: AllocateService) {}

  onDragStart(
    event: any,
    elemId: string,
    day: keyof Week | 'match',
    elemType: 'people' | 'projects'
  ) {
    const { target, pageX, pageY } = event;

    const style = window.getComputedStyle(target);
    const originalZIndex = style.zIndex;
    let reapplySort = false;

    if (!target.classList.contains('draggable')) {
      return;
    }

    if (target.classList.contains('sorted')) {
      target.classList.toggle('sorted', false);
      reapplySort = true;
    }

    const node: HTMLElement | null = document.getElementById(target.id);

    if (!node) {
      return;
    }

    const draggable: any = node.cloneNode(true);
    const draggableId = `${target.id}-clone`;
    draggable.id = draggableId;
    document.body.append(draggable);
    const draggableElem = document.getElementById(draggableId);

    if (!draggableElem) {
      return;
    }

    const subject = this._subject;
    const allocationService = this.allocateService;
    const shiftX = event.clientX - target.getBoundingClientRect().left;
    const shiftY = event.clientY - target.getBoundingClientRect().top;

    let lastDroppable: Element | null = null;

    draggable.ondragstart = () => false;
    draggableElem.style.position = 'absolute';
    draggableElem.style.zIndex = '1600';
    draggableElem.style.width = '50px';
    draggableElem.style.minWidth = '50px';
    draggableElem.style.height = '50px';
    draggableElem.style.minHeight = '50px';
    draggableElem.style.left = pageX - shiftX + 'px';
    draggableElem.style.top = pageY - shiftY + 'px';
    draggableElem.style.borderRadius = '150px';
    draggableElem.style.fontSize = '1.3rem';
    draggableElem.style.display = 'flex';
    draggableElem.style.justifyContent = 'center';
    draggableElem.style.alignItems = 'center';
    draggableElem.style.padding = '5px';
    draggableElem.style.margin = '0px';
    // draggableElem.style.backgroundColor = 'rgba(25, 135, 84, 1)';
    draggableElem.style.backgroundColor = 'var(--bs-gray-700)';
    draggableElem.style.color = 'var(--bs-white)';
    draggableElem.innerText = getInitials(draggableElem.innerText);

    draggableElem.classList.add('phase-in');
    draggableElem.classList.remove('droppable');

    if (day === 'match') {
      draggableElem.style.fontWeight = 'bold';
      draggableElem.style.justifyContent = 'center';
      draggableElem.style.color = '#fff';
    }

    target.style.zIndex = '1600';

    this._subject.next({ type: 'dragstart' });

    function onPointerMove(event: any) {
      const { pageX, pageY } = event;
      draggableElem!.style.left = pageX - shiftX + 'px';
      draggableElem!.style.top = pageY - shiftY + 'px';
      const elements: Array<Element> = document.elementsFromPoint(pageX, pageY);

      const inactiveEntry = elements.find((element) => {
        return (
          element.classList.contains('btn-allocated') ||
          element.classList.contains('btn-unavail')
        );
      });

      if (inactiveEntry && inactiveEntry !== draggableElem) {
        if (lastDroppable) {
          lastDroppable.classList.remove('dragging-over');
          lastDroppable = null;
        }
        return;
      }
      const droppable = elements.filter((element) =>
        element.classList.contains('droppable')
      )[0];

      if (!droppable && lastDroppable) {
        lastDroppable.classList.remove('dragging-over');
        lastDroppable = null;
      }

      if (droppable && droppable !== lastDroppable) {
        // if dragging an individual calendar entry and hover over main data entry, no highlighting
        if (
          allocationService.registeredDragEvent?.day &&
          allocationService.registeredDragEvent?.day !== 'match' &&
          droppable.classList.contains('entry-item')
        ) {
          lastDroppable?.classList.remove('dragging-over');
          lastDroppable = null;
          return;
        }

        if (
          droppable.id === 'trash-main' ||
          (droppable.classList.contains('droppable-people') &&
            draggableElem?.classList.contains('draggable-people')) ||
          (droppable.classList.contains('droppable-projects') &&
            draggableElem?.classList.contains('draggable-projects'))
        ) {
          if (lastDroppable) {
            lastDroppable.classList.remove('dragging-over');
          }
          droppable.classList.add('dragging-over');

          lastDroppable = droppable;
        }
      }
    }

    function onPointerUp(event: any) {
      if (reapplySort) {
        target.classList.toggle('sorted', true);
      }
      if (lastDroppable) {
        lastDroppable.classList.remove('dragging-over');
      }
      draggableElem?.classList.add('phase-out');
      draggableElem?.addEventListener('animationend', () => {
        draggableElem.remove();
      });

      target.style.zIndex = originalZIndex;

      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);

      subject.next({
        type: 'drop',
      });

      if (!lastDroppable) {
        allocationService.registerDropEvent({ id: null });
        return;
      }

      if (lastDroppable?.id === 'trash-main') {
        allocationService.registerDropEvent({ id: 'trash-main' });
        return;
      }

      const { entryId, weekDay } = lastDroppable?.classList.contains(
        'cal-entry'
      )
        ? {
            entryId: lastDroppable?.id.split('__')[0],
            weekDay: lastDroppable.textContent,
          }
        : { entryId: lastDroppable?.id, weekDay: 'match' };

      allocationService.registerDropEvent({
        id: entryId as string,
        elemType,
        day: weekDay as keyof Week | 'match',
      });
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    this.allocateService.registerDragEvent({
      id: elemId,
      day,
      elemType,
    });
  }
}

const getInitials = (text: string | null): string => {
  if (!text) {
    return '';
  }
  const arr = text.split(' ');
  if (arr.length === 1) {
    return text[0];
  }

  let lastChar = arr[arr.length - 1][0];

  // if surname was shortened with dots, take the last actual char
  if (lastChar === '.') {
    lastChar = arr[arr.length - 4][0];
  }

  const initials = `${arr[0][0].toUpperCase()}${lastChar.toUpperCase()}`.trim();

  return initials;
};
