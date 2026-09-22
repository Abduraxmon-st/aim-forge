import * as THREE from "three";
import { Engine, type EngineCallbacks } from "../core/engine";
import type { Config, Settings } from "../../domain/models";
import { isTracking } from "../../domain/rules";
type Target = { mesh: THREE.Mesh; born: number; hp: number; phase: number };
export class Engine3D extends Engine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private ray = new THREE.Raycaster();
  private center = new THREE.Vector2(0, 0);
  private targets: Target[] = [];
  private blockers: THREE.Object3D[] = [];
  private sphere = new THREE.SphereGeometry(1, 24, 16);
  private material: THREE.MeshStandardMaterial;
  private yaw = 0;
  private pitch = 0;
  private pendingX = 0;
  private pendingY = 0;
  private velocity = 1;
  private desiredVelocity = 1;
  private nextChange = 0;
  private reactiveX = 0;
  private lastTarget: THREE.Object3D | null = null;
  private lastCompletion = 0;
  protected get is3d() {
    return true;
  }
  constructor(
    canvas: HTMLCanvasElement,
    config: Config,
    settings: Settings,
    callbacks: EngineCallbacks,
  ) {
    super(canvas, config, settings, callbacks);
    const context = canvas.getContext("webgl2", {
      antialias: settings.quality !== "low",
    });
    if (!context) throw new Error("webglUnavailable");
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        antialias: settings.quality !== "low",
      });
    } catch {
      throw new Error("webglUnavailable");
    }
    this.renderer.setClearColor(0x10131c);
    this.scene.fog = new THREE.Fog(0x10131c, 25, 65);
    this.camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 100);
    this.camera.position.set(0, 1.7, 3);
    this.camera.rotation.order = "YXZ";
    this.material = new THREE.MeshStandardMaterial({
      color:
        config.palette === "cyan"
          ? 0x67d5e7
          : config.palette === "amber"
            ? 0xf8c46c
            : 0xb3a0fc,
      roughness: 0.55,
    });
    const light = new THREE.HemisphereLight(0xeeeaff, 0x353b57, 2.3);
    this.scene.add(light);
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(-3, 8, 4);
    this.scene.add(sun);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.2, 70),
      new THREE.MeshStandardMaterial({ color: 0x1e2230, roughness: 1 }),
    );
    floor.position.set(0, -0.6, -20);
    this.scene.add(floor);
    this.blockers.push(floor);
    const grid = new THREE.GridHelper(60, 30, 0x45405b, 0x2e3242);
    grid.position.set(0, -0.49, -15);
    this.scene.add(grid);
    for (const x of [-20, 20]) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(1, 16, 60),
        new THREE.MeshStandardMaterial({ color: 0x242a3a, roughness: 1 }),
      );
      wall.position.set(x, 7, -20);
      this.scene.add(wall);
      this.blockers.push(wall);
    }
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(40, 18, 1),
      new THREE.MeshStandardMaterial({ color: 0x222637 }),
    );
    back.position.set(0, 7, -35);
    this.scene.add(back);
    this.blockers.push(back);
    for (let i = 0; i < config.count; i++) this.spawn();
    const o = { signal: this.abortController.signal };
    document.addEventListener(
      "pointerlockchange",
      () => {
        if (document.pointerLockElement === canvas) {
          if (["ready", "paused"].includes(this.machine.phase)) {
            this.resumePending = false;
            this.message = "";
            this.callbacks.error("");
            this.beginCountdown();
          }
        } else this.pause("pointer");
      },
      o,
    );
    document.addEventListener(
      "pointerlockerror",
      () => {
        this.resumePending = false;
        this.message = "pointerDenied";
        this.callbacks.error("pointerDenied");
        this.publish();
      },
      o,
    );
    document.addEventListener(
      "mousemove",
      (e) => {
        if (
          document.pointerLockElement !== canvas ||
          this.machine.phase !== "running"
        )
          return;
        if (config.smoothing) {
          this.pendingX += e.movementX;
          this.pendingY += e.movementY;
        } else this.rotate(e.movementX, e.movementY);
      },
      o,
    );
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.pause("context");
        this.callbacks.error("contextLost");
      },
      o,
    );
    canvas.addEventListener(
      "webglcontextrestored",
      () => {
        this.message = "contextRestored";
        this.publish();
      },
      o,
    );
    this.ready();
  }
  private rotate(x: number, y: number) {
    const k = (this.config.sensitivity * Math.PI) / 180;
    this.yaw -= x * k;
    this.pitch = Math.max(
      -Math.PI * 0.46,
      Math.min(Math.PI * 0.46, this.pitch - y * k),
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.camera.updateMatrixWorld(true);
  }
  override start() {
    if (!["ready", "paused"].includes(this.machine.phase)) return;
    if (this.config.input !== "mouse") {
      this.callbacks.error("mouseRequired");
      return;
    }
    if (!this.canvas.requestPointerLock) {
      this.callbacks.error("pointerDenied");
      return;
    }
    this.audio.unlock();
    this.resumePending = true;
    this.message = "";
    this.rawInput = false;
    const ordinary = () => {
      this.resumePending = true;
      try {
        const fallback = this.canvas.requestPointerLock();
        if (fallback)
          void fallback.catch(() => this.callbacks.error("pointerDenied"));
      } catch {
        this.callbacks.error("pointerDenied");
      }
    };
    try {
      const options = this.settings.unadjusted
        ? { unadjustedMovement: true }
        : undefined;
      const request = this.canvas.requestPointerLock(options);
      if (request && typeof request.then === "function") {
        void request
          .then(() => {
            this.rawInput = Boolean(options);
          })
          .catch(() => {
            if (options) {
              ordinary();
            } else {
              this.resumePending = false;
              this.callbacks.error("pointerDenied");
            }
          });
      }
    } catch {
      if (this.settings.unadjusted) ordinary();
      else {
        this.resumePending = false;
        this.callbacks.error("pointerDenied");
      }
    }
  }
  override pause(reason: SessionInterruption = "pause") {
    this.pendingX = 0;
    this.pendingY = 0;
    super.pause(reason);
  }
  resize() {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        this.settings.quality === "low"
          ? 1
          : this.settings.quality === "medium"
            ? 1.5
            : 2,
      ),
    );
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / Math.max(1, rect.height);
    this.camera.updateProjectionMatrix();
  }
  private spawn() {
    const size =
      this.config.scenario === "precision-range"
        ? this.config.radius / 85
        : this.config.radius / 42;
    let x = 0,
      y = 2,
      z = -this.config.distance;
    for (let n = 0; n < 120; n++) {
      z =
        this.config.scenario === "precision-range"
          ? -(8 + this.random() * (this.config.distance - 6))
          : -this.config.distance;
      x = (this.random() - 0.5) * Math.abs(z) * 1.1;
      y = 1 + this.random() * Math.abs(z) * 0.35;
      if (
        this.targets.every(
          (t) =>
            Math.hypot(t.mesh.position.x - x, t.mesh.position.y - y) > size * 3,
        )
      )
        break;
    }
    if (isTracking(this.config.scenario)) {
      x = 0;
      y = 3;
    }
    const mesh = new THREE.Mesh(this.sphere, this.material);
    mesh.scale.setScalar(size);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.targets.push({
      mesh,
      born: this.activeMs,
      hp: this.config.scenario === "target-switching" ? 3 : 1,
      phase: this.random() * Math.PI * 2,
    });
    this.scene.updateMatrixWorld(true);
  }
  protected update(dt: number) {
    if (this.config.smoothing) {
      const a = 1 - Math.exp(-dt / 24);
      const x = this.pendingX * a,
        y = this.pendingY * a;
      this.pendingX -= x;
      this.pendingY -= y;
      this.rotate(x, y);
    }
    const t = this.targets[0];
    if (!t) return;
    const time = this.activeMs / 1000,
      speed = this.config.speed / 100;
    if (this.config.scenario === "strafe-tracking") {
      t.mesh.position.x = Math.sin(time * 0.6 * speed) * 7;
      t.mesh.position.y = 2.8 + Math.sin(time * 0.3) * 0.7;
    } else if (this.config.scenario === "reactive-tracking") {
      if (this.activeMs >= this.nextChange) {
        this.desiredVelocity =
          (this.random() > 0.5 ? 1 : -1) * (1 + this.random() * 2) * speed;
        this.nextChange = this.activeMs + 600 + this.random() * 1200;
      }
      if (this.reactiveX > 7)
        this.desiredVelocity = -Math.abs(this.desiredVelocity);
      if (this.reactiveX < -7)
        this.desiredVelocity = Math.abs(this.desiredVelocity);
      this.velocity +=
        (this.desiredVelocity - this.velocity) * (1 - Math.exp(-dt / 160));
      this.reactiveX += (this.velocity * dt) / 1000;
      t.mesh.position.x = this.reactiveX;
      t.mesh.position.y = 3 + Math.sin(time * 0.6) * 1.1;
    }
    this.scene.updateMatrixWorld(true);
  }
  private intersection() {
    this.camera.updateMatrixWorld(true);
    this.scene.updateMatrixWorld(true);
    this.ray.setFromCamera(this.center, this.camera);
    return this.ray.intersectObjects(
      [...this.targets.map((t) => t.mesh), ...this.blockers],
      false,
    )[0];
  }
  protected intersects() {
    const hit = this.intersection();
    return !!hit && this.targets.some((t) => t.mesh === hit.object);
  }
  protected shoot(_now: number) {
    const hit = this.intersection(),
      t = hit && this.targets.find((t) => t.mesh === hit.object);
    if (!t) {
      this.miss();
      return;
    }
    const error =
      this.ray.ray.distanceToPoint(t.mesh.position) / t.mesh.scale.x;
    this.hit(error, this.activeMs - t.born);
    if (this.lastTarget && this.lastTarget !== t.mesh) this.metrics.switches++;
    this.lastTarget = t.mesh;
    t.hp--;
    if (t.hp <= 0) {
      this.metrics.completedTargets++;
      if (this.config.scenario === "target-switching") {
        this.sample(
          this.metrics.switchTimes,
          this.activeMs - this.lastCompletion,
        );
        this.lastCompletion = this.activeMs;
      }
      this.scene.remove(t.mesh);
      this.targets.splice(this.targets.indexOf(t), 1);
      this.spawn();
    }
  }
  protected render(_now: number) {
    this.renderer.render(this.scene, this.camera);
  }
  override destroy() {
    super.destroy();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = Array.isArray(o.material) ? o.material : [o.material];
        m.forEach((x) => x.dispose());
      }
      if (o instanceof THREE.GridHelper) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
    this.sphere.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
type SessionInterruption =
  import("../../domain/models").Session["interruption"];
