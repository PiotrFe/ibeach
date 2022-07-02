import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  OnDestroy,
} from '@angular/core';
import {
  DragAndDropService,
  DragAndDropEvent,
} from 'src/app/shared-module/drag-and-drop.service';
import { Subscription } from 'rxjs';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'allocate-section',
  templateUrl: './allocate-section.component.html',
  styleUrls: ['./allocate-section.component.scss'],
  animations: [
    trigger('insertRemoveTrigger', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('180ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('180ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class AllocateSectionComponent implements OnInit, OnDestroy {
  @ViewChild('peopleSide') peopleSide!: ElementRef;
  @ViewChild('dragHandle') dragHandle!: ElementRef;
  @ViewChild('projectSide') projectSide!: ElementRef;

  @Input() referenceDate: Date = new Date();

  dragging: boolean = false;
  subsciption: Subscription = new Subscription();

  constructor(private dragAndDrop: DragAndDropService) {}

  ngOnInit(): void {
    const ddSubscription = this.dragAndDrop.onDragAndDrop$.subscribe({
      next: (event: DragAndDropEvent) => {
        if (event.type === 'dragstart') {
          this.dragging = true;
        }
        if (event.type === 'drop') {
          this.dragging = false;
        }
      },
    });

    this.subsciption.add(ddSubscription);
  }

  ngOnDestroy(): void {
    this.subsciption.unsubscribe();
  }

  onDragHandleClick(e: any) {
    const { x: originalX } = e;
    const peopleSide = this.peopleSide.nativeElement;
    const projectSide = this.projectSide.nativeElement;
    const peopleStyle = window.getComputedStyle(peopleSide);
    const projectStyle = window.getComputedStyle(projectSide);
    const originalPeopleWidth = parseFloat(
      peopleStyle.getPropertyValue('width')
    );
    const originalProjectWidth = parseFloat(
      projectStyle.getPropertyValue('width')
    );

    const onPointerMove = (e: any) => {
      const { x: newX } = e;
      const xOffset = newX - originalX;
      const newPeopleWidth = originalPeopleWidth + xOffset;
      const newProjectWidth = originalProjectWidth - xOffset;

      peopleSide.style.width = `${newPeopleWidth}px`;
      projectSide.style.width = `${newProjectWidth}px`;
    };

    const onPointerUp = (e: any) => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }
}
