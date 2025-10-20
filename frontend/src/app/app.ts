import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dice4Component } from "./model/dice/dice-4/dice-4.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Dice4Component],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'toolbox';
}
