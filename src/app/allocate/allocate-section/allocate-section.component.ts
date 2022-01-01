import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'allocate-section',
  templateUrl: './allocate-section.component.html',
  styleUrls: ['./allocate-section.component.scss'],
})
export class AllocateSectionComponent implements OnInit {
  @ViewChild('peopleSide') peopleSide!: ElementRef;
  @ViewChild('dragHandle') dragHandle!: ElementRef;
  @ViewChild('projectSide') projectSide!: ElementRef;

  constructor() {}

  ngOnInit(): void {}

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
