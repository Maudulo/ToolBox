import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice10Component } from './dice-10.component';

describe('Dice10Component', () => {
  let component: Dice10Component;
  let fixture: ComponentFixture<Dice10Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice10Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
