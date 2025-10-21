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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NgIf } from '@angular/common';

const BOX_WIDTH = 20;
const BOX_HEIGHT = 50;
const BOX_DEPTH = 20;
const WALL_THICKNESS = 0.1;
const ZOOM_FACTOR = 3;

@Component({
  selector: 'app-dice-10',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-10.component.html',
  styleUrl: './dice-10.component.scss'
})
export class Dice10Component implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rollSound', { static: false }) rollSoundRef!: ElementRef<HTMLAudioElement>;

  public diceCount = 3;
  public lastResults: number[] = [];
  public totalSum = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

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
    this.camera.position.set(5 * ZOOM_FACTOR, 5 * ZOOM_FACTOR, 7 * ZOOM_FACTOR);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(600, 600);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 25;
    this.controls.enablePan = true;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(10, 10, 10);
    this.scene.add(ambient, light);

    // Sol visuel
    const planeGeo = new THREE.PlaneGeometry(BOX_WIDTH, BOX_DEPTH);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // Zone de lancer
    const boxGeo = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH);
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const boundary = new THREE.Mesh(boxGeo, boxMat);
    boundary.position.y = BOX_HEIGHT / 2;
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
      restitution: 0.6,
    });
    this.world.addContactMaterial(contact);

    // Sol
    const groundShape = new CANNON.Box(new CANNON.Vec3(BOX_WIDTH / 2, 0.05, BOX_DEPTH / 2));
    this.groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: wallMaterial });
    this.groundBody.position.set(0, -0.05, 0);
    this.world.addBody(this.groundBody);

    const createWallBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const shape = new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2));
      const wall = new CANNON.Body({ mass: 0, shape, material: wallMaterial });
      wall.position.set(x, y, z);
      this.world.addBody(wall);
    };

    createWallBox(0, BOX_HEIGHT / 2, BOX_DEPTH / 2, BOX_WIDTH, BOX_HEIGHT, WALL_THICKNESS);
    createWallBox(0, BOX_HEIGHT / 2, -BOX_DEPTH / 2, BOX_WIDTH, BOX_HEIGHT, WALL_THICKNESS);
    createWallBox(BOX_WIDTH / 2, BOX_HEIGHT / 2, 0, WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH);
    createWallBox(-BOX_WIDTH / 2, BOX_HEIGHT / 2, 0, WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH);

    // Plafond
    const ceilingShape = new CANNON.Box(new CANNON.Vec3(BOX_WIDTH / 2, 0.05, BOX_DEPTH / 2));
    const ceiling = new CANNON.Body({ mass: 0, shape: ceilingShape, material: wallMaterial });
    ceiling.position.set(0, BOX_HEIGHT, 0);
    this.world.addBody(ceiling);
  }

  // #region LANCER N DÉS DYNAMIQUEMENT
  public rollMultipleDice(count: number = 3) {
    for (const mesh of this.diceMeshes) this.scene.remove(mesh);
    for (const body of this.diceBodies) this.world.removeBody(body);
    this.diceBodies = [];
    this.diceMeshes = [];
    this.lastResults = [];
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

      dice.quaternion.setFromEuler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const impulse = new CANNON.Vec3(
        (Math.random() - 0.5) * 6,
        Math.random() * 6 + 3,
        (Math.random() - 0.5) * 6
      );
      dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));
    }
  }
  
  // #region CREATION DU DÉ
  private createDice(position: CANNON.Vec3): CANNON.Body {
    // --- Création du mesh THREE ---
    const geometry = new THREE.OctahedronGeometry(1, 0); // on garde D10 visuel
    const loader = new THREE.TextureLoader();

    const materials = Array.from({ length: 10 }, (_, i) =>
      new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() })
    );

    const mesh = new THREE.Mesh(geometry, materials);
    this.scene.add(mesh);

    // --- Sommets et faces D10 corrects pour Cannon.js ---
    const vertices = [
      new CANNON.Vec3(0, 0, 1),
      new CANNON.Vec3(0.894427, 0, 0.447214),
      new CANNON.Vec3(0.276393, 0.850651, 0.447214),
      new CANNON.Vec3(-0.723607, 0.525731, 0.447214),
      new CANNON.Vec3(-0.723607, -0.525731, 0.447214),
      new CANNON.Vec3(0.276393, -0.850651, 0.447214),
      new CANNON.Vec3(0.723607, 0.525731, -0.447214),
      new CANNON.Vec3(-0.276393, 0.850651, -0.447214),
      new CANNON.Vec3(-0.894427, 0, -0.447214),
      new CANNON.Vec3(-0.276393, -0.850651, -0.447214),
      new CANNON.Vec3(0.723607, -0.525731, -0.447214),
      new CANNON.Vec3(0, 0, -1),
    ];

    const faces = [
      [0,1,2],[0,2,3],[0,3,4],[0,4,5],[0,5,1],
      [1,6,2],[2,7,3],[3,8,4],[4,9,5],[5,10,1],
      [6,7,2],[7,8,3],[8,9,4],[9,10,5],[10,6,1],
      [6,11,7],[7,11,8],[8,11,9],[9,11,10],[10,11,6],
    ];

    const diceShape = new CANNON.ConvexPolyhedron({ vertices, faces });

    // --- Body Cannon ---
    const dice = new CANNON.Body({
      mass: 1,
      shape: diceShape,
      position,
      angularDamping: 0.1,
      linearDamping: 0.1,
    });

    // Rotation aléatoire
    dice.quaternion.setFromEuler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Impulsion aléatoire pour lancer le dé
    const impulse = new CANNON.Vec3(
      (Math.random() - 0.5) * 6,
      Math.random() * 6 + 3,
      (Math.random() - 0.5) * 6
    );
    dice.applyImpulse(impulse, new CANNON.Vec3(0, 0, 0));

    this.world.addBody(dice);
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
    this.controls.update();
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
        this.cdr.detectChanges();
      });

      console.log('🎲 Résultats :', results, '→ Somme totale :', sum);
    }
  }
  
  private getDiceResultFromBody(dice: CANNON.Body): number {
    // Normales locales approximatives des 10 faces
    const faces = [
      { normal: new CANNON.Vec3(0, 0.8507, 0.5257), value: 1 },
      { normal: new CANNON.Vec3(0, 0.8507, -0.5257), value: 2 },
      { normal: new CANNON.Vec3(0, -0.8507, 0.5257), value: 3 },
      { normal: new CANNON.Vec3(0, -0.8507, -0.5257), value: 4 },
      { normal: new CANNON.Vec3(0.5257, 0, 0.8507), value: 5 },
      { normal: new CANNON.Vec3(-0.5257, 0, 0.8507), value: 6 },
      { normal: new CANNON.Vec3(0.5257, 0, -0.8507), value: 7 },
      { normal: new CANNON.Vec3(-0.5257, 0, -0.8507), value: 8 },
      { normal: new CANNON.Vec3(0.8507, 0.5257, 0), value: 9 },
      { normal: new CANNON.Vec3(-0.8507, 0.5257, 0), value: 10 },
    ];

    const up = new CANNON.Vec3(0, 1, 0);
    let best = faces[0];
    let maxDot = -Infinity;

    for (const f of faces) {
      // Rotation du dé appliquée à la normale
      const worldNormal = dice.quaternion.vmult(f.normal);
      const dot = worldNormal.dot(up); // projection sur l'axe Y
      if (dot > maxDot) {
        maxDot = dot;
        best = f;
      }
    }
    return best.value;
  }
}
