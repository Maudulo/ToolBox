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
  
}
