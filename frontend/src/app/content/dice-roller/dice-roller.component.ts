import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DiceType } from '../dice-type';
import { DiceFactoryService } from '../../model/dice/dice-factory.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export const DICE_TYPES: DiceType[] = [
  { name: 'D4', sides: 4, color: 0xff8844 },
  { name: 'D6', sides: 6, color: 0x44ccff },
  { name: 'D8', sides: 8, color: 0x99ff66 },
  { name: 'D10', sides: 10, color: 0xffcc00 },
  { name: 'D12', sides: 12, color: 0xcc66ff },
  { name: 'D20', sides: 20, color: 0xff4444 },
];

@Component({
  selector: 'app-dice-roller',
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './dice-roller.component.html',
  styleUrl: './dice-roller.component.scss'
})
export class DiceRollerComponent implements OnInit {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  diceTypes = DICE_TYPES;
  selectedType: DiceType = DICE_TYPES[1]; // par défaut D6
  count = 1;
  results: number[] = [];

  constructor(public diceFactory: DiceFactoryService) {}

  ngOnInit() {
    this.diceFactory.init(this.canvasRef);
    this.diceFactory.animate();
  }

  launch() {
    this.results = [];
    this.diceFactory.setLastResults([]);

    this.diceFactory.getDiceBodies().length = 0;
    this.diceFactory.getDiceMeshes().length = 0;

    for (let i = 0; i < this.count; i++) {
      this.diceFactory.createDie(this.selectedType);
    }

    this.diceFactory.throwDice();
  }

  get total() {
    return this.results.reduce((sum, r) => sum + r, 0);
  }
}