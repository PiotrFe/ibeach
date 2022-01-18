import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AllocateSectionComponent } from './allocate-section.component';
import { DragAndDropService } from 'src/app/shared-module/drag-and-drop.service';
import { of } from 'rxjs';

const dragAndDropMock = {
  get onDragAndDrop$() {
    return of({ type: 'dragstart' });
  },
};

describe('AllocateSectionComponent', () => {
  let component: AllocateSectionComponent;
  let fixture: ComponentFixture<AllocateSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllocateSectionComponent],
      providers: [{ provide: DragAndDropService, useValue: dragAndDropMock }],
      imports: [BrowserAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllocateSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
