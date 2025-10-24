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
  selector: 'app-dice-12',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-12.component.html',
  styleUrl: './dice-12.component.scss'
})
export class Dice12Component implements AfterViewInit, OnDestroy {
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

    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 1.2;
    const startX = -(cols - 1) * spacing / 2;
    const startZ = -(cols - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * spacing + (Math.random() - 0.5) * 0.2;
      const z = startZ + row * spacing + (Math.random() - 0.5) * 0.2;
      const y = 3 + Math.random() * 0.5;

      const pos = new CANNON.Vec3(x, y, z);
      const dice = this.createDice(pos);

      dice.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const impulse = new CANNON.Vec3((Math.random() - 0.5) * 6, Math.random() * 6 + 3, (Math.random() - 0.5) * 6);
      dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
    }
  }
  
  // #region CREATION DU DÉ
  private createDice(position: CANNON.Vec3): CANNON.Body {
    const t = (1 + Math.sqrt(5)) / 2; // nombre d'or

    // --- 1. Sommets du dodécaèdre régulier ---
    const rawVertices = [
      [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
      [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
      [0, -1 / t, -t], [0, -1 / t, t], [0, 1 / t, -t], [0, 1 / t, t],
      [-1 / t, -t, 0], [-1 / t, t, 0], [1 / t, -t, 0], [1 / t, t, 0],
      [-t, 0, -1 / t], [t, 0, -1 / t], [-t, 0, 1 / t], [t, 0, 1 / t],
    ].map(v => new CANNON.Vec3(v[0], v[1], v[2]));

    // --- 2. Faces (ordre corrigé CCW) ---
    const faces = [
      [0, 16, 2, 10, 8],
      [0, 12, 1, 18, 16],
      [1, 9, 11, 3, 18],
      [3, 13, 2, 16, 18],
      [4, 6, 10, 8, 14],
      [4, 14, 12, 0, 8],
      [5, 7, 15, 19, 9],
      [5, 9, 1, 12, 14],
      [6, 10, 11, 19, 15],
      [6, 15, 7, 17, 10],
      [8, 10, 17, 4, 0],
      [13, 3, 11, 19, 7],
    ];

    // --- 3. Agrandir légèrement la forme physique (évite clipping) ---
    const scale = 1.05;
    const vertices = rawVertices.map(v => new CANNON.Vec3(v.x * scale, v.y * scale, v.z * scale));

    const diceShape = new CANNON.ConvexPolyhedron({ vertices, faces });
    // Auto-correction (si une normale pointe vers l'intérieur)
    diceShape.faceNormals.forEach((n, i) => {
      const center = new CANNON.Vec3();
      faces[i].forEach(idx => center.vadd(vertices[idx], center));
      center.scale(1 / faces[i].length, center);
      if (center.dot(n) > 0) faces[i].reverse();
    });


    const diceMaterial = new CANNON.Material('dice');
    const dice = new CANNON.Body({
      mass: 1,
      shape: diceShape,
      position: new CANNON.Vec3(position.x, position.y + 0.1, position.z),
      material: diceMaterial,
      angularDamping: 0.1,
      linearDamping: 0.1
    });

    this.diceFactory.getWorld().addBody(dice);

    // --- 4. Rendu Three.js ---
    const geometry = new THREE.DodecahedronGeometry(0.5);
    geometry.toNonIndexed();

    const materials = Array.from({ length: 12 }, () =>
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );

    geometry.clearGroups();
    const faceCount = geometry.attributes['position'].count / 3;
    for (let i = 0; i < faceCount; i++) {
      geometry.addGroup(i * 3, 3, Math.floor(i / (faceCount / 12)));
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(position as unknown as THREE.Vector3);
    this.diceFactory.getScene().add(mesh);

    // --- 5. Synchronisation physique/visuelle ---
    this.diceFactory.pushDiceBodies(dice);
    this.diceFactory.pushDiceMeshes(mesh);

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

      console.log('🎲 Résultats D12 :', results, '→ Somme totale :', sum);
    }
  }
  
  private getDiceResultFromBody(dice: CANNON.Body): number {
    // Approximation : on prend la face dont la normale est la plus proche de (0,1,0)
    const normals = [
      new CANNON.Vec3(0,1,0), new CANNON.Vec3(0,-1,0),
      new CANNON.Vec3(1,0,0), new CANNON.Vec3(-1,0,0),
      new CANNON.Vec3(0,0,1), new CANNON.Vec3(0,0,-1),
      new CANNON.Vec3(1,1,0).unit(), new CANNON.Vec3(-1,1,0).unit(),
      new CANNON.Vec3(0,1,1).unit(), new CANNON.Vec3(0,1,-1).unit(),
      new CANNON.Vec3(1,0,1).unit(), new CANNON.Vec3(-1,0,1).unit(),
    ];
    let bestIndex = 0;
    let maxDot = -Infinity;
    const up = new CANNON.Vec3(0,1,0);
    normals.forEach((n, i) => {
      const worldNormal = dice.quaternion.vmult(n);
      const dot = worldNormal.dot(up);
      if (dot > maxDot) { maxDot = dot; bestIndex = i; }
    });
    return bestIndex + 1;
  }

}
