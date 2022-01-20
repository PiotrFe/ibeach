import {
  ComponentFixture,
  TestBed,
  tick,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { TypeaheadService } from 'src/app/shared-module/typeahead.service';

import { EntryComponent, Tag } from './entry.component';

const TAG_VALUE = 'tag_value';
const tag: Tag = {
  type: 'ind',
  value: TAG_VALUE,
};

const ID = 'abc';
const stubTypeahead = {
  getTypeahead() {},
  getTagByVal(str: string) {
    return tag;
  },
};

describe('EntryComponent', () => {
  let component: EntryComponent;
  let fixture: ComponentFixture<EntryComponent>;
  let spyObj: jasmine.SpyObj<EntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntryComponent],
      providers: [{ provide: TypeaheadService, useValue: stubTypeahead }],
    }).compileComponents();
  });

  beforeEach(() => {
    spyObj = jasmine.createSpyObj('EntryComponent', [
      'setShowTag',
      'onTagSubmit',
      'onTagDelete',
    ]);
    fixture = TestBed.createComponent(EntryComponent);
    component = fixture.componentInstance;
    component.id = ID;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit tagChangeEvent when tag submitted', () => {
    component.tagInput.setValue(TAG_VALUE);
    spyOn(component.tagChangeEvent, 'emit');

    component.onTagSubmit('entry');

    expect(component.tagChangeEvent.emit).toHaveBeenCalledWith({
      id: component.id,
      value: tag.value,
      type: tag.type,
      action: 'add',
    });
  });

  it('should emit tagChangeEvent when tag deleted', () => {
    spyOn(component.tagChangeEvent, 'emit');
    component.onTagDelete('tagVal', 'entry');

    expect(component.tagChangeEvent.emit).toHaveBeenCalledWith({
      id: component.id,
      value: 'tagVal',
      type: '',
      action: 'remove',
    });
  });

  it('should emit collapse event when collapsed', () => {
    const collapsed = false;
    spyOn(component.collapseEvent, 'emit');

    component.handleCollapse();
    component.isCollapsed = collapsed;

    expect(component.collapseEvent.emit).toHaveBeenCalledWith({
      id: component.id,
      collapsed: !component.isCollapsed,
    });
  });
});
