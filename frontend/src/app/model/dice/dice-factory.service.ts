import { ElementRef, Injectable, ViewChild } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BOX_WIDTH = 20;
const BOX_HEIGHT = 50;
const BOX_DEPTH = 20;
const WALL_THICKNESS = 0.1;
const ZOOM_FACTOR = 3;

@Injectable({
  providedIn: 'root'
})
export class DiceFactoryService {
  private canvas!: HTMLCanvasElement;
  
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

  init(canvasRef: ElementRef<HTMLCanvasElement>) {
    this.canvas = canvasRef.nativeElement;
    this.initThree();
    this.initPhysics();
  }

  getScene() { return this.scene; }
  getWorld() { return this.world; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getAnimationId() { return this.animationId; }

  getLastResults() { return this.lastResults; }
  setLastResults(lastResults: number[]) { this.lastResults = lastResults; }

  getTotalSum() { return this.totalSum; }
  setTotalSum(totalSum: number) { this.totalSum = totalSum; }

  getDiceBodies() { return this.diceBodies; }
  setDiceBodies(dice: CANNON.Body[]) { this.diceBodies = dice; }
  pushDiceBodies(dice: CANNON.Body) { this.diceBodies.push(dice); }

  getDiceMeshes() { return this.diceMeshes; }
  setDiceMeshes(mesh: THREE.Mesh[]) { this.diceMeshes = mesh; }
  pushDiceMeshes(mesh: THREE.Mesh) { this.diceMeshes.push(mesh); }

  controlUpdate() { this.controls.update() }

  // #region INITIALISATION THREE.JS
  private initThree() {
    const canvas = this.canvas;
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

  // #region DANS L’ANIMATION PRINCIPALE
  public animate = () => {
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
    // if (now - this.lastCheckTime > 200) this.checkIfDiceStopped();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  createDie(type: { sides: number; color: number }) {
    const size = 1; // taille de base

    // --- 1. Géométrie selon le type ---
    const geometry = this.createGeometry(type.sides, size);
    const material = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.5,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position aléatoire initiale
    mesh.position.set(
      (Math.random() - 0.5) * 5,
      BOX_HEIGHT - 10,
      (Math.random() - 0.5) * 5
    );
    this.scene.add(mesh);

    // --- 2. Corps physique Cannon ---
    const shape = this.createPhysicsShape(type.sides, size);
    const body = new CANNON.Body({
      mass: 1,
      shape,
      material: new CANNON.Material('dice'),
    });

    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    body.angularVelocity.set(
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10
    );

    this.world.addBody(body);
    this.diceMeshes.push(mesh);
    this.diceBodies.push(body);
  }

  throwDice() {
    for (let i = 0; i < this.diceBodies.length; i++) {
      const body = this.diceBodies[i];
      body.velocity.set(
        (Math.random() - 0.5) * 10,
        -5,
        (Math.random() - 0.5) * 10
      );
      body.angularVelocity.set(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );
    }

    // Vérifier quand les dés s'arrêtent
    setTimeout(() => this.computeResults(), 3000);
  }

  private computeResults() {
    const results: number[] = [];

    for (let i = 0; i < this.diceBodies.length; i++) {
      const body = this.diceBodies[i];
      const result = this.getDieResult(body);
      results.push(result);
    }

    this.lastResults = results;
    this.totalSum = results.reduce((a, b) => a + b, 0);
  }

  // Simplifié pour l’instant (à raffiner selon l’orientation du dé)
  private getDieResult(body: CANNON.Body): number {
    return Math.floor(Math.random() * 6) + 1; // stub temporaire
  }

  private createGeometry(sides: number, size: number): THREE.BufferGeometry {
    switch (sides) {
      case 4: return new THREE.TetrahedronGeometry(size);
      case 6: return new THREE.BoxGeometry(size, size, size);
      case 8: return new THREE.OctahedronGeometry(size);
      // case 10: return new THREE.Geometry(); // à remplacer par un modèle 3D custom
      case 12: return new THREE.DodecahedronGeometry(size);
      case 20: return new THREE.IcosahedronGeometry(size);
      default: return new THREE.BoxGeometry(size, size, size);
    }
  }

  private createPhysicsShape(sides: number, size: number): CANNON.Shape {
    // Tu peux utiliser le même polyèdre que pour Three.js
    switch (sides) {
      case 4: {
        const { vertices, faces } = this.getPolyhedronVertices(4);
        return new CANNON.ConvexPolyhedron({ vertices, faces });
      }
      case 6: {
        return new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
      }
      case 8: {
        const { vertices, faces } = this.getPolyhedronVertices(8);
        return new CANNON.ConvexPolyhedron({ vertices, faces });
      }
      case 12: {
        const { vertices, faces } = this.getPolyhedronVertices(12);
        return new CANNON.ConvexPolyhedron({ vertices, faces });
      }
      case 20: {
        const { vertices, faces } = this.getPolyhedronVertices(20);
        return new CANNON.ConvexPolyhedron({ vertices, faces });
      }
      default: return new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
    }
  }
  
  // ============================================================
  // UTILITAIRES POUR CRÉER DES POLYÈDRES RÉGULIERS POUR CANNON
  // ============================================================
  private getPolyhedronVertices(sides: number): { vertices: CANNON.Vec3[]; faces: number[][] } {
    switch (sides) {
      case 4: // Tetrahedron
        return this.buildPolyhedron([
          [1, 1, 1],
          [-1, -1, 1],
          [-1, 1, -1],
          [1, -1, -1],
        ], [
          [0, 1, 2],
          [0, 3, 1],
          [0, 2, 3],
          [1, 3, 2],
        ]);

      case 8: // Octahedron
        return this.buildPolyhedron([
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ], [
          [0, 2, 4],
          [2, 1, 4],
          [1, 3, 4],
          [3, 0, 4],
          [0, 5, 2],
          [2, 5, 1],
          [1, 5, 3],
          [3, 5, 0],
        ]);

      case 12: // Dodecahedron
        const t = (1 + Math.sqrt(5)) / 2;
        const r = 1 / t;
        return this.buildPolyhedron([
          [-1, -1, -1],
          [-1, -1, 1],
          [-1, 1, -1],
          [-1, 1, 1],
          [1, -1, -1],
          [1, -1, 1],
          [1, 1, -1],
          [1, 1, 1],
          [0, -r, -t],
          [0, -r, t],
          [0, r, -t],
          [0, r, t],
          [-r, -t, 0],
          [-r, t, 0],
          [r, -t, 0],
          [r, t, 0],
          [-t, 0, -r],
          [t, 0, -r],
          [-t, 0, r],
          [t, 0, r],
        ], [
          [0, 8, 4, 14, 12],
          [0, 12, 2, 10, 16],
          [0, 16, 1, 9, 8],
          [1, 9, 5, 14, 4],
          [1, 4, 8, 0, 16],
          [2, 10, 6, 17, 16],
          [2, 12, 3, 13, 10],
          [3, 13, 7, 15, 11],
          [3, 11, 9, 1, 16],
          [4, 14, 5, 19, 18],
          [5, 9, 11, 15, 19],
          [6, 17, 7, 13, 3],
        ]);

      case 20: // Icosahedron
        const X = 0.525731112119133606;
        const Z = 0.850650808352039932;
        return this.buildPolyhedron([
          [-X, 0, Z], [X, 0, Z], [-X, 0, -Z], [X, 0, -Z],
          [0, Z, X], [0, Z, -X], [0, -Z, X], [0, -Z, -X],
          [Z, X, 0], [-Z, X, 0], [Z, -X, 0], [-Z, -X, 0]
        ], [
          [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
          [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
          [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
          [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
        ]);

      default:
        return this.buildPolyhedron([], []);
    }
  }

  private buildPolyhedron(points: number[][], faces: number[][]): { vertices: CANNON.Vec3[]; faces: number[][] } {
    const vertices = points.map(p => new CANNON.Vec3(p[0], p[1], p[2]));
    return { vertices, faces };
  }

}
