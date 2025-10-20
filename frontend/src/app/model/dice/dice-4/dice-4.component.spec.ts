import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice4Component } from './dice-4.component';

describe('Dice4Component', () => {
  let component: Dice4Component;
  let fixture: ComponentFixture<Dice4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
