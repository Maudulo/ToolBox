import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice12Component } from './dice-12.component';

describe('Dice12Component', () => {
  let component: Dice12Component;
  let fixture: ComponentFixture<Dice12Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice12Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice12Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
