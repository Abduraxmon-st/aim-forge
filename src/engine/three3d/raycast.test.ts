import { it, expect } from "vitest";
import {
  Scene,
  PerspectiveCamera,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  MeshBasicMaterial,
  Raycaster,
  Vector2,
} from "three";
it("center ray resolves the nearest blocker before a target", () => {
  const scene = new Scene(),
    camera = new PerspectiveCamera(75, 1, 0.1, 100);
  const target = new Mesh(new SphereGeometry(1), new MeshBasicMaterial());
  target.position.z = -10;
  const wall = new Mesh(new BoxGeometry(5, 5, 1), new MeshBasicMaterial());
  wall.position.z = -5;
  scene.add(target, wall);
  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const ray = new Raycaster();
  ray.setFromCamera(new Vector2(0, 0), camera);
  expect(ray.intersectObjects([target, wall], false)[0].object).toBe(wall);
  wall.position.x = 10;
  scene.updateMatrixWorld(true);
  expect(ray.intersectObjects([target, wall], false)[0].object).toBe(target);
  target.geometry.dispose();
  wall.geometry.dispose();
});
