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

const BOX_WIDTH = 10;
const BOX_HEIGHT = 50;
const BOX_DEPTH = 10;
const WALL_THICKNESS = 0.1;
const ZOOM_FACTOR = 3;

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
  public lastResults: number[] = [];
  public totalSum = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  private world!: CANNON.World;
  private groundBody!: CANNON.Body;

  private diceBodies: CANNON.Body[] = [];
  private diceMeshes: THREE.Mesh[] = [];

  private animationId: number | null = null;
  private lastCheckTime = 0;
  private resultsLocked = false;

  ngAfterViewInit() {
    this.initThree();
    this.initPhysics();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  // #region INITIALISATION THREE.JS
  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(
      5 * ZOOM_FACTOR,
      5 * ZOOM_FACTOR,
      7 * ZOOM_FACTOR
    );
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(300, 300);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(10, 10, 10);
    this.scene.add(ambient, light);
    
    const planeGeo = new THREE.PlaneGeometry(BOX_WIDTH, BOX_DEPTH);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);
    
    const boxGeo = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const boundary = new THREE.Mesh(boxGeo, boxMat);
    boundary.position.y = BOX_HEIGHT / 2; // centre de la boîte
    this.scene.add(boundary);
  }

  // #region INITIALISATION PHYSIQUE CORRIGÉE
  private initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);

    const wallMaterial = new CANNON.Material('wall');
    const diceMaterial = new CANNON.Material('dice');
    const contact = new CANNON.ContactMaterial(diceMaterial, wallMaterial, {
      friction: 0.3,
      restitution: 0.6
    });
    this.world.addContactMaterial(contact);
    
    // Sol
    const groundShape = new CANNON.Box(new CANNON.Vec3(BOX_WIDTH  / 2, 0.05, BOX_DEPTH / 2));
    this.groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: wallMaterial });
    this.groundBody.position.set(0, -0.05, 0);
    this.world.addBody(this.groundBody);

    // Murs
    const createWallBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
      const wall = new CANNON.Body({ mass: 0, shape, material: wallMaterial });
      wall.position.set(x, y, z);
      this.world.addBody(wall);
    };

    createWallBox(0, BOX_HEIGHT / 2, BOX_DEPTH / 2, BOX_WIDTH, BOX_HEIGHT, WALL_THICKNESS);   // Nord
    createWallBox(0, BOX_HEIGHT / 2, -BOX_DEPTH / 2, BOX_WIDTH, BOX_HEIGHT, WALL_THICKNESS);  // Sud
    createWallBox(BOX_WIDTH / 2, BOX_HEIGHT / 2, 0, WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH);   // Est
    createWallBox(-BOX_WIDTH / 2, BOX_HEIGHT / 2, 0, WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH);  // Ouest

    // Plafond
    const ceilingShape = new CANNON.Box(new CANNON.Vec3(BOX_WIDTH / 2, 0.05, BOX_DEPTH / 2));
    const ceiling = new CANNON.Body({ mass: 0, shape: ceilingShape, material: wallMaterial });
    ceiling.position.set(0, BOX_HEIGHT, 0);
    this.world.addBody(ceiling);
  }

  // #region LANCER N DÉS DYNAMIQUEMENT
  public rollMultipleDice(count: number = 3) {
    // Nettoyage
    for (const mesh of this.diceMeshes) this.scene.remove(mesh);
    for (const body of this.diceBodies) this.world.removeBody(body);
    this.diceBodies = [];
    this.diceMeshes = [];
    this.lastResults = [];
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

    this.world.addBody(dice);

    const loader = new THREE.TextureLoader();
    const materials = [
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-1.png') }),
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-6.png') }),
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-3.png') }),
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-4.png') }),
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-5.png') }),
      new THREE.MeshStandardMaterial({ map: loader.load('assets/dice_6/face-2.png') }),
    ];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, materials);
    this.scene.add(mesh);

    this.diceBodies.push(dice);
    this.diceMeshes.push(mesh);
    return dice;
  }

  // #region DANS L’ANIMATION PRINCIPALE
  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = 1 / 60;
    this.world.step(delta, delta, 3);

    for (let i = 0; i < this.diceBodies.length; i++) {
      const dice = this.diceBodies[i];
      const mesh = this.diceMeshes[i];
      mesh.position.copy(dice.position as unknown as THREE.Vector3);
      mesh.quaternion.copy(dice.quaternion as unknown as THREE.Quaternion);
    }

    const now = performance.now();
    if (now - this.lastCheckTime > 200) this.checkIfDiceStopped();
    this.renderer.render(this.scene, this.camera);
  };

  // #region DÉTECTION DU RÉSULTAT
  private checkIfDiceStopped() {
    if (this.resultsLocked) return;

    const stopped = this.diceBodies.every(
      d => d.velocity.length() < 0.05 && d.angularVelocity.length() < 0.05 && d.position.y < 1.2
    );

    if (stopped) {
      this.resultsLocked = true;
      let sum = 0;

      const results = this.diceBodies.map(d => {
        const value = this.getDiceResultFromBody(d);
        sum += value;
        return value;
      });

      this.ngZone.run(() => {
        this.lastResults = results;
        this.totalSum = sum;
        this.cdr.detectChanges(); // ✅ force Angular à mettre à jour le DOM
      });

      console.log('🎲 Résultats :', results, '→ Somme totale :', sum);
    }
  }

  private getDiceResultFromBody(dice: CANNON.Body): number {
    const faces = [
      { normal: new CANNON.Vec3(0, 1, 0), value: 3 },
      { normal: new CANNON.Vec3(0, -1, 0), value: 4 },
      { normal: new CANNON.Vec3(1, 0, 0), value: 1 },
      { normal: new CANNON.Vec3(-1, 0, 0), value: 6 },
      { normal: new CANNON.Vec3(0, 0, 1), value: 5 },
      { normal: new CANNON.Vec3(0, 0, -1), value: 2 },
    ];

    const up = new CANNON.Vec3(0, 1, 0);
    let best = faces[0];
    let maxDot = -Infinity;

    for (const f of faces) {
      const worldNormal = dice.quaternion.vmult(f.normal);
      const dot = worldNormal.dot(up);
      if (dot > maxDot) {
        maxDot = dot;
        best = f;
      }
    }
    return best.value;
  }
}