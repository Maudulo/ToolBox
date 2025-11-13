import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface School {
  name: string
  color: string
  label: string
  svg: string
}

@Component({
  selector: 'app-card',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  allSchool: School[] = [
    {name: "Evocation", color: "#d94a4a", label: "ev", svg: ""},
    {name: "Conjuration", color: "#2b8fb7", label: "cj", svg: ""},
    {name: "Abjuration", color: "#3b7a3d", label: "ab", svg: ""},
    {name: "Transmutation", color: "#c77b2b", label: "tr", svg: ""},
    {name: "Nécromancie", color: "#5b3b83", label: "nc", svg: ""},
    {name: "Illusion", color: "#7b5aa2", label: "il", svg: ""},
    {name: "Enchantement", color: "#b24f9b", label: "en", svg: ""},
    {name: "Divination", color: "#3b6fa8", label: "dv", svg: ""},
  ]
  cardWidth: number = 350
  cardHeight: number = 500
}
