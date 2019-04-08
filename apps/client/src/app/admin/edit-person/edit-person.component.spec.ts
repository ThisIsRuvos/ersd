import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditPersonComponent } from './edit-person.component';

describe('AdminEditPersonComponent', () => {
  let component: AdminEditPersonComponent;
  let fixture: ComponentFixture<AdminEditPersonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminEditPersonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEditPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
