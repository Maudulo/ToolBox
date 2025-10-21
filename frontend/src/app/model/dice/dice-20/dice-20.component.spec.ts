import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice20Component } from './dice-20.component';

describe('Dice20Component', () => {
  let component: Dice20Component;
  let fixture: ComponentFixture<Dice20Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice20Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice20Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
