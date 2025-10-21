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
  selector: 'app-dice-4',
  imports: [FormsModule, NgIf],
  templateUrl: './dice-4.component.html',
  styleUrl: './dice-4.component.scss'
})
export class Dice4Component implements AfterViewInit, OnDestroy {
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

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.initThree();
    this.initPhysics();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

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

    // Autoriser zoom et rotation
    this.controls.enableZoom = true;
    this.controls.minDistance = 4;   // distance minimale (évite de passer à travers les dés)
    this.controls.maxDistance = 25;  // distance max (évite de trop s’éloigner)
    this.controls.enablePan = true;

    // Point autour duquel la caméra tourne
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
    
    // Zone de lancer visible
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
    for (const mesh of this.diceMeshes) this.scene.remove(mesh);
    for (const body of this.diceBodies) this.world.removeBody(body);
    this.diceBodies = [];
    this.diceMeshes = [];
    this.lastResults = [];
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
    this.world.addBody(dice);

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
        map: loader.load(`assets/dice_4/face-${i + 1}.png`),
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
    this.scene.add(mesh);

    // ---- Lien physique / visuel ----
    this.diceBodies.push(dice);
    this.diceMeshes.push(mesh);

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

    const stopped = this.diceBodies.every(d => d.velocity.length() < 0.05 && d.angularVelocity.length() < 0.05 && d.position.y < 1.2);

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

      console.log('🎲 D4 Résultats :', results, '→ Somme totale :', sum);
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