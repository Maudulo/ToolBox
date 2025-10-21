import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { NgIf } from '@angular/common';
import { DiceFactoryService } from '../dice-factory.service';

@Component({
  selector: 'app-dice-6',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-6.component.html',
  styleUrl: './dice-6.component.scss'
})
export class Dice6Component implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rollSound', { static: false }) rollSoundRef!: ElementRef<HTMLAudioElement>;

  public diceCount = 3;

  private resultsLocked = false;

  constructor(
    private diceFactory: DiceFactoryService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.diceFactory.init(this.canvasRef);
    this.diceFactory.animate();
  }

  ngOnDestroy() {
    if (this.diceFactory.getAnimationId()) cancelAnimationFrame(this.diceFactory.getAnimationId()!);
  }

  getLastResults() { return this.diceFactory.getLastResults() }
  getTotalSum() { return this.diceFactory.getTotalSum() }

  // #region LANCER N DÉS DYNAMIQUEMENT
  public rollMultipleDice(count: number = 3) {
    // Nettoyage
    for (const mesh of this.diceFactory.getDiceMeshes()) this.diceFactory.getScene().remove(mesh);
    for (const body of this.diceFactory.getDiceBodies()) this.diceFactory.getWorld().removeBody(body);
    this.diceFactory.setDiceMeshes([]);
    this.diceFactory.setDiceBodies([]);
    this.diceFactory.setLastResults([])
    this.resultsLocked = false;

    // 🧮 Placement automatique : grille centrée
    const cols = Math.ceil(Math.sqrt(count)); // nb de dés par ligne
    const spacing = 1.2; // écart horizontal/vertical
    const startX = -(cols - 1) * spacing / 2;
    const startZ = -(cols - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Position aléatoire autour d'une grille centrale
      const x = startX + col * spacing + (Math.random() - 0.5) * 0.2;
      const z = startZ + row * spacing + (Math.random() - 0.5) * 0.2;
      const y = 3 + Math.random() * 0.5;

      const pos = new CANNON.Vec3(x, y, z);
      const dice = this.createDice(pos);

      dice.quaternion.setFromEuler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // 💥 Impulsion aléatoire mais contenue
      const impulse = new CANNON.Vec3(
        (Math.random() - 0.5) * 6,
        Math.random() * 6 + 3,
        (Math.random() - 0.5) * 6
      );
      dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
    }

    // 🔊 Son de lancer
    //const sound = this.rollSoundRef?.nativeElement;
    //if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }
  }

  // #region CREATION DU DÉ
  private createDice(position: CANNON.Vec3): CANNON.Body {
    const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const diceMaterial = new CANNON.Material('dice');
    const dice = new CANNON.Body({
      mass: 1,
      shape: diceShape,
      position,
      material: diceMaterial,
      angularDamping: 0.1,
      linearDamping: 0.1
    });

    dice.addEventListener('collide', () => {
      const sound = this.rollSoundRef?.nativeElement;
      if (sound && sound.paused) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    });

    this.diceFactory.getWorld().addBody(dice);

    const loader = new THREE.TextureLoader();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Faces numérotées 1–6
    const materials = Array.from({ length: 6 }, (_, i) =>
      new THREE.MeshStandardMaterial({ map: loader.load(`assets/dice_6/face-${i + 1}.png`) })
    );

    const mesh = new THREE.Mesh(geometry, materials);
    this.diceFactory.getScene().add(mesh);

    this.diceFactory.pushDiceMeshes(mesh);
    this.diceFactory.pushDiceBodies(dice);
    
    return dice;
  }

  // #region DÉTECTION DU RÉSULTAT
  private checkIfDiceStopped() {
    if (this.resultsLocked) return;

    const stopped = this.diceFactory.getDiceBodies().every(
      d => d.velocity.length() < 0.05 && d.angularVelocity.length() < 0.05 && d.position.y < 1.2
    );

    if (stopped) {
      this.resultsLocked = true;
      let sum = 0;

      const results = this.diceFactory.getDiceBodies().map(d => {
        const value = this.getDiceResultFromBody(d);
        sum += value;
        return value;
      });

      this.ngZone.run(() => {
        this.diceFactory.setLastResults(results)
        this.diceFactory.setTotalSum(sum)
        this.cdr.detectChanges();
      });

      console.log('🎲 Résultats D6:', results, '→ Somme totale :', sum);
    }
  }

  private getDiceResultFromBody(dice: CANNON.Body): number {
    const up = new CANNON.Vec3(0, 1, 0);
    
    const normals = [
      new CANNON.Vec3(1, 0, 0),
      new CANNON.Vec3(-1, 0, 0),
      new CANNON.Vec3(0, 1, 0),
      new CANNON.Vec3(0, -1, 0),
      new CANNON.Vec3(0, 0, 1),
      new CANNON.Vec3(0, 0, -1)
    ];

    // const faces = [
    //   { normal: new CANNON.Vec3(0, 1, 0), value: 3 },
    //   { normal: new CANNON.Vec3(0, -1, 0), value: 4 },
    //   { normal: new CANNON.Vec3(1, 0, 0), value: 1 },
    //   { normal: new CANNON.Vec3(-1, 0, 0), value: 6 },
    //   { normal: new CANNON.Vec3(0, 0, 1), value: 5 },
    //   { normal: new CANNON.Vec3(0, 0, -1), value: 2 },
    // ];

    let bestIndex = 0;
    let maxDot = -Infinity;

    normals.forEach((n, i) => {
      const worldNormal = dice.quaternion.vmult(n);
      const dot = worldNormal.dot(up);
      if (dot > maxDot) {
        maxDot = dot;
        bestIndex = i;
      }
    });

    return bestIndex + 1;
  }
}