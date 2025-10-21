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
    // --- Cannon.js : créer la forme ConvexPolyhedron ---
    const baseGeometry = new THREE.DodecahedronGeometry(0.5); // D12 de rayon 0.5
    const nonIndexed = baseGeometry.toNonIndexed(); // Pour Cannon.js, non indexé

    // Récupérer les vertices
    const vertices: CANNON.Vec3[] = [];
    const pos = nonIndexed.attributes['position'].array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      vertices.push(new CANNON.Vec3(pos[i], pos[i + 1], pos[i + 2]));
    }

    // Créer les faces (triplets de sommets)
    const faces: number[][] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      faces.push([i, i + 1, i + 2]);
    }

    const diceShape = new CANNON.ConvexPolyhedron({ vertices, faces });

    const diceMaterial = new CANNON.Material('dice');
    const dice = new CANNON.Body({
      mass: 1,
      shape: diceShape,
      position,
      material: diceMaterial,
      angularDamping: 0.1,
      linearDamping: 0.1
    });
    this.diceFactory.getWorld().addBody(dice);

    // --- Three.js : créer le mesh pour l’affichage ---
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.DodecahedronGeometry(0.5); // Géométrie Three.js normale

    geometry.toNonIndexed();

    // Créer des matériaux aléatoires pour les faces
    const materials = Array.from({ length: 12 }, () =>
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );

    // Assigner un groupe par face
    geometry.clearGroups();
    const faceCount = geometry.attributes['position'].count / 3;
    for (let i = 0; i < faceCount; i++) {
      geometry.addGroup(i * 3, 3, Math.floor(i / (faceCount / 12)));
    }

    const mesh = new THREE.Mesh(geometry, materials);
    this.diceFactory.getScene().add(mesh);

    // Liens physique / visuel
    this.diceFactory.pushDiceBodies(dice);
    this.diceFactory.pushDiceMeshes(mesh);

    // Son à la collision
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
