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
  selector: 'app-dice-4',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-4.component.html',
  styleUrl: './dice-4.component.scss'
})
export class Dice4Component implements AfterViewInit, OnDestroy {
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
    for (const mesh of this.diceFactory.getDiceMeshes()) this.diceFactory.getScene().remove(mesh);
    for (const body of this.diceFactory.getDiceBodies()) this.diceFactory.getWorld().removeBody(body);
    this.diceFactory.setDiceMeshes([]);
    this.diceFactory.setDiceBodies([]);
    this.diceFactory.setLastResults([])
    this.resultsLocked = false;

    const spacing = 1.5;
    const startX = -(count - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const pos = new CANNON.Vec3(startX + i * spacing, 3, 0);
      const dice = this.createDice(pos);
      dice.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const impulse = new CANNON.Vec3(
        (Math.random() - 0.5) * 4,
        Math.random() * 6 + 3,
        (Math.random() - 0.5) * 4
      );
      dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
    }
  }

  // #region CREATION DU DÉ
  private createDice(position: CANNON.Vec3): CANNON.Body {
    // ----- PHYSIQUE -----
    const vertices = [
      new CANNON.Vec3(1, 1, 1),
      new CANNON.Vec3(-1, -1, 1),
      new CANNON.Vec3(-1, 1, -1),
      new CANNON.Vec3(1, -1, -1),
    ];
    const faces = [
      [0, 2, 1],
      [0, 1, 3],
      [0, 3, 2],
      [1, 2, 3],
    ];
    const diceShape = new CANNON.ConvexPolyhedron({ vertices, faces });
    const diceMaterial = new CANNON.Material('dice');

    const dice = new CANNON.Body({
      mass: 1,
      shape: diceShape,
      position,
      material: diceMaterial,
      angularDamping: 0.1,
      linearDamping: 0.1,
    });
    this.diceFactory.getWorld().addBody(dice);

    // ----- VISUEL -----
    const loader = new THREE.TextureLoader();
    let geometry: THREE.BufferGeometry = new THREE.TetrahedronGeometry(1);

    // 👉 S'assurer que la géométrie a bien des index
    if (!geometry.index) {
      geometry = geometry.toNonIndexed(); // pas besoin de caster en TetrahedronGeometry
    }

    // 4 textures pour les 4 faces
    const materials = Array.from({ length: 4 }, (_, i) =>
      new THREE.MeshStandardMaterial({
        // map: loader.load(`assets/dice_4/face-${i + 1}.png`),
        color: 0xffffff * Math.random(),
        roughness: 0.5,
        metalness: 0.2,
      })
    );

    geometry.clearGroups();

    const indexCount = geometry.index ? geometry.index.count : geometry.attributes['position'].count;
    const faceCount = indexCount / 3;

    // Associer une texture à chaque face
    for (let i = 0; i < faceCount; i++) {
      geometry.addGroup(i * 3, 3, i % materials.length);
    }

    const mesh = new THREE.Mesh(geometry, materials);
    this.diceFactory.getScene().add(mesh);

    // ---- Lien physique / visuel ----
    this.diceFactory.pushDiceMeshes(mesh);
    this.diceFactory.pushDiceBodies(dice);

    // ---- Son ----
    dice.addEventListener('collide', () => {
      const sound = this.rollSoundRef?.nativeElement;
      if (sound && sound.paused) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    });

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

      console.log('🎲 Résultats D4 ', results, '→ Somme totale :', sum);
    }
  }

  private getDiceResultFromBody(dice: CANNON.Body): number {
    const shape = dice.shapes[0] as CANNON.ConvexPolyhedron;

    // Transforme chaque vertex dans le monde
    const transformed = shape.vertices.map(v => {
      const worldPos = dice.quaternion.vmult(v).vadd(dice.position);
      return worldPos;
    });

    // Trouve le sommet le plus haut
    let maxY = -Infinity;
    let topIndex = 0;
    transformed.forEach((v, i) => {
      if (v.y > maxY) {
        maxY = v.y;
        topIndex = i;
      }
    });

    // Map sommet → valeur du dé (ordre arbitraire, mais cohérent avec la physique)
    const valueMap = [1, 2, 3, 4];
    return valueMap[topIndex];
  }
}