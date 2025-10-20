import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dice6Component } from "./model/dice/dice-6/dice-6.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Dice6Component],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'toolbox';
}
