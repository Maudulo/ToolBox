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
  selector: 'app-dice-20',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-20.component.html',
  styleUrl: './dice-20.component.scss'
})
export class Dice20Component implements AfterViewInit, OnDestroy {
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
    const spacing = 3;
    const startX = -(cols - 1) * spacing / 2;
    const startZ = -(cols - 1) * spacing / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * spacing + (Math.random() - 0.5);
      const z = startZ + row * spacing + (Math.random() - 0.5);
      const y = 5 + Math.random() * 2;

      const pos = new CANNON.Vec3(x, y, z);
      const dice = this.createDice(pos);

      dice.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const impulse = new CANNON.Vec3((Math.random() - 0.5) * 10, Math.random() * 10 + 5, (Math.random() - 0.5) * 10);
      dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
    }
  }
  
  // #region CREATION DU DÉ
  private createDice(position: CANNON.Vec3): CANNON.Body {
    // Icosaèdre D20 Cannon.js
    const t = (1 + Math.sqrt(5)) / 2;
    const scale = 1; // rayon du D20
    const vertices = [
      [-1,  t,  0], [1,  t,  0], [-1, -t,  0], [1, -t,  0],
      [0, -1,  t], [0,  1,  t], [0, -1, -t], [0,  1, -t],
      [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1],
    ].map(v => new CANNON.Vec3(v[0], v[1], v[2]).scale(scale));

    const faces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];

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

    // Three.js
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.IcosahedronGeometry(scale, 0);
    
    // Faces numérotées 1–20
    const materials = Array.from({ length: 20 }, (_, i) =>
    //   new THREE.MeshStandardMaterial({ map: loader.load(`assets/dice_20/face-${i + 1}.png`) })
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );

    geometry.clearGroups();
    const indexCount = geometry.index ? geometry.index.count : geometry.attributes['position'].count;
    const faceCount = indexCount / 3;
    for (let i = 0; i < faceCount; i++) {
      geometry.addGroup(i * 3, 3, i % materials.length);
    }
    
    const mesh = new THREE.Mesh(geometry, materials);
    this.diceFactory.getScene().add(mesh);

    // Liens
    this.diceFactory.pushDiceMeshes(mesh);
    this.diceFactory.pushDiceBodies(dice);

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

      console.log('🎲 Résultats D20 :', results, '→ Somme totale :', sum);
    }
  }
  
  private getDiceResultFromBody(dice: CANNON.Body): number {
    const normals = [
      new CANNON.Vec3(0,1,0), new CANNON.Vec3(0,-1,0),
      new CANNON.Vec3(1,0,0), new CANNON.Vec3(-1,0,0),
      new CANNON.Vec3(0,0,1), new CANNON.Vec3(0,0,-1),
      new CANNON.Vec3(1,1,0).unit(), new CANNON.Vec3(-1,1,0).unit(),
      new CANNON.Vec3(0,1,1).unit(), new CANNON.Vec3(0,1,-1).unit(),
      new CANNON.Vec3(1,0,1).unit(), new CANNON.Vec3(-1,0,1).unit(),
    ];

    const up = new CANNON.Vec3(0,1,0);

    let bestIndex = 0;
    let maxDot = -Infinity;

    normals.forEach((n,i) => {
      const worldNormal = dice.quaternion.vmult(n);
      const dot = worldNormal.dot(up);
      if(dot>maxDot){
        maxDot=dot;
        bestIndex=i;
      }
    });

    return bestIndex+1;
  }

}
