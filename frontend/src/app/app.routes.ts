import { Routes } from '@angular/router';
import { Dice4Component } from './model/dice/dice-4/dice-4.component';
import { Dice6Component } from './model/dice/dice-6/dice-6.component';

export const routes: Routes = [
    { path: 'dice-4', component: Dice4Component },
    { path: 'dice-6', component: Dice6Component },
    { path: '', redirectTo: `/dice-4`, pathMatch: 'full'},
];
