import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

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

  constructor() {}

  onPointerDown(event: any) {
    const { target, pageX, pageY } = event;

    const style = window.getComputedStyle(target);
    const originalZIndex = style.zIndex;

    if (!target.classList.contains('draggable')) {
      return;
    }
    const node: HTMLElement | null = document.getElementById(target.id);

    if (!node) {
      return;
    }
    const draggable: any = node.cloneNode(true);
    const draggableId = `${target.id}-clone`;
    draggable.id = `${target.id}-clone`;

    const shiftX = event.clientX - target.getBoundingClientRect().left;
    const shiftY = event.clientY - target.getBoundingClientRect().top;
    const subject = this._subject;

    document.body.append(draggable);
    const draggableElem = document.getElementById(draggableId);
    let lastDroppable: Element | null = null;

    if (!draggableElem) {
      return;
    }

    draggable.ondragstart = () => false;
    draggableElem.style.position = 'absolute';
    draggableElem.style.zIndex = '1600';
    draggableElem.style.width = '50px';
    draggableElem.style.height = '50px';
    draggableElem.style.left = pageX - shiftX + 'px';
    draggableElem.style.top = pageY - shiftY + 'px';
    draggableElem.style.borderRadius = '150px';
    draggableElem.textContent = getInitials(draggableElem.textContent);
    draggableElem.style.fontSize = '1.2rem';

    target.style.zIndex = '1600';

    this._subject.next({ type: 'dragstart' });

    function onPointerMove(event: any) {
      const { pageX, pageY } = event;
      draggableElem!.style.left = pageX - shiftX + 'px';
      draggableElem!.style.top = pageY - shiftY + 'px';
      const elements: Array<Element> = document.elementsFromPoint(pageX, pageY);

      const droppable = elements.filter((element) =>
        element.classList.contains('droppable')
      )[0];

      if (!droppable && lastDroppable) {
        lastDroppable.classList.remove('dragging-over');
        lastDroppable = null;
      }

      if (droppable && droppable !== lastDroppable) {
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
        draggable: target,
        droppable: lastDroppable,
      });
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
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

  return `${text[0].toUpperCase()} ${text[text.length - 1].toUpperCase()}`;
};
