import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice6Component } from './dice-6.component';

describe('Dice6Component', () => {
  let component: Dice6Component;
  let fixture: ComponentFixture<Dice6Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice6Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice6Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
