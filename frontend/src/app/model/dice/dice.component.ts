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
  selector: 'app-dice',
  imports: [FormsModule, NgIf],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss'
})
export class DiceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rollSound', { static: false }) rollSoundRef!: ElementRef<HTMLAudioElement>;

  public diceSet = '2D6;1D20';
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
    this.renderer.dispose();
  }

  constructor(private ngZone: NgZone) {}

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();

    // Caméra & zoom
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
    const groundShape = new CANNON.Box(new CANNON.Vec3(BOX_WIDTH / 2, 0.05, BOX_DEPTH / 2));
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

  // -----------------------------
  // MAIN ACTION
  // -----------------------------
  initRollMultipleDice() {
    // Nettoyage
    this.diceBodies.forEach(b => this.world.removeBody(b));
    this.diceMeshes.forEach(m => this.scene.remove(m));
    this.diceBodies = [];
    this.diceMeshes = [];
    this.lastResults = [];

    const diceConfig = this.parseDiceSet();

    for (const { sides, count } of diceConfig) {
      for (let i = 0; i < count; i++) {
        this.createDie(sides);
      }
    }
  }

  private parseDiceSet(): { sides: number; count: number }[] {
    const parts = this.diceSet.split(';').map(p => p.trim()).filter(Boolean);
    const result: { sides: number; count: number }[] = [];

    for (const part of parts) {
      const match = part.match(/(\d*)[dD](\d+)/);
      if (match) {
        const count = parseInt(match[1] || '1', 10);
        const sides = parseInt(match[2], 10);
        result.push({ sides, count });
      }
    }
    return result;
  }

  private createDie(sides: number): { mesh: THREE.Mesh, body: CANNON.Body } {
  let geometry: THREE.BufferGeometry;

  switch (sides) {
    case 4:
      geometry = new THREE.TetrahedronGeometry(1);
      break;
    case 6:
      geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      break;
    case 8:
      geometry = new THREE.OctahedronGeometry(1);
      break;
    case 10:
      geometry = new THREE.CylinderGeometry(0.9, 0.9, 0.5, 10);
      break;
    case 12:
      geometry = new THREE.DodecahedronGeometry(1);
      break;
    case 20:
      geometry = new THREE.IcosahedronGeometry(1);
      break;
    default:
      throw new Error(`Unsupported dice type: D${sides}`);
  }

  // 🔧 CORRECTION : on force la géométrie en mode non indexé
  if (geometry.index) {
    geometry = geometry.toNonIndexed();
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(Math.random(), Math.random(), Math.random()),
    metalness: 0.3,
    roughness: 0.6,
  });

  const mesh = new THREE.Mesh(geometry, material);
  this.scene.add(mesh);

  // 🔧 Extraction des sommets et faces corrects
  const position = geometry.attributes['position'];
  const vertices: CANNON.Vec3[] = [];
  const faces: number[][] = [];

  for (let i = 0; i < position.count; i++) {
    vertices.push(new CANNON.Vec3(position.getX(i), position.getY(i), position.getZ(i)));
  }

  for (let i = 0; i < position.count; i += 3) {
    faces.push([i, i + 1, i + 2]);
  }

  // 🧱 Création du corps physique
  const shape = new CANNON.ConvexPolyhedron({ vertices, faces });
  const body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);

  // Position et mouvement aléatoires
  body.position.set((Math.random() - 0.5) * 5, 10 + Math.random() * 5, (Math.random() - 0.5) * 5);
  body.velocity.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
  body.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

  this.world.addBody(body);
  this.diceBodies.push(body);
  this.diceMeshes.push(mesh);

  return { mesh, body };
}


  // -----------------------------
  // RENDER LOOP
  // -----------------------------
  private animate() {
    const timeStep = 1 / 60;

    const loop = () => {
      this.world.step(timeStep);

      for (let i = 0; i < this.diceMeshes.length; i++) {
        this.diceMeshes[i].position.copy(this.diceBodies[i].position as any);
        this.diceMeshes[i].quaternion.copy(this.diceBodies[i].quaternion as any);
      }

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(loop);
    };

    this.ngZone.runOutsideAngular(() => loop());
  }
}