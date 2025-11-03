import { Routes } from '@angular/router';
import { DiceComponent } from './model/dice/dice.component';
import { Dice4Component } from './model/dice/dice-4/dice-4.component';
import { Dice6Component } from './model/dice/dice-6/dice-6.component';
import { Dice8Component } from './model/dice/dice-8/dice-8.component';
import { Dice10Component } from './model/dice/dice-10/dice-10.component';
import { Dice12Component } from './model/dice/dice-12/dice-12.component';
import { Dice20Component } from './model/dice/dice-20/dice-20.component';
import { DiceRollerComponent } from './content/dice-roller/dice-roller.component';

export const routes: Routes = [
    { path: 'dice-roll', component: DiceRollerComponent },
    { path: 'dice', component: DiceComponent },
    { path: 'dice-4', component: Dice4Component },
    { path: 'dice-6', component: Dice6Component },
    { path: 'dice-8', component: Dice8Component },
    { path: 'dice-10', component: Dice10Component },
    { path: 'dice-12', component: Dice12Component },
    { path: 'dice-20', component: Dice20Component },
    { path: '', redirectTo: `/dice-roll`, pathMatch: 'full'},
];
