import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

interface School {
  name: string
  color: string
  label: string
  svg: string
}

@Component({
  selector: 'app-card',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule, JsonPipe, MatButtonModule, MatMenuModule, MatIconModule],
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
  selectedScholl: School = this.allSchool[0]
  cardWidth: number = 350
  cardHeight: number = 500
  itemNumber: number = 2
  cardNumber: number = 3

  printPage() {
    window.print();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault(); // empêche le collage automatique

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const text = clipboardData.getData('text/plain');

    if (text.trim().startsWith('<svg')) {
      this.insertSvg(event.target as HTMLElement, text);
    } else {
      document.execCommand('insertText', false, text);
    }
  }

  insertSvg(target: HTMLElement, svgString: string) {
    const range = window.getSelection()?.getRangeAt(0);
    if (!range) return;

    // Création d'un wrapper autour du SVG
    const wrapper = document.createElement('span');
    wrapper.classList.add('svg-wrapper');
    wrapper.setAttribute('contenteditable', 'false');
    wrapper.innerHTML = svgString;

    range.deleteContents();
    range.insertNode(wrapper);

    // Déplacer le curseur après
    range.setStartAfter(wrapper);
    range.setEndAfter(wrapper);
    range.collapse(false);
  }
}
