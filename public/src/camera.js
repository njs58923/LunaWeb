import { camera, canvas } from "./main.js";
import * as THREE from "three";

const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

const moveSpeed = 0.2;
const rotationSpeed = 0.002;

document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas) {
    camera.rotation.y -= e.movementX * rotationSpeed;
    camera.rotation.x -= e.movementY * rotationSpeed;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  }
});

function cameraLoop() {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3();
  right.crossVectors(camera.up, forward).normalize();

  if (keys['KeyW']) camera.position.addScaledVector(forward, moveSpeed);
  if (keys['KeyS']) camera.position.addScaledVector(forward, -moveSpeed);
  if (keys['KeyA']) camera.position.addScaledVector(right, moveSpeed);
  if (keys['KeyD']) camera.position.addScaledVector(right, -moveSpeed);

  requestAnimationFrame(cameraLoop);
}
cameraLoop();
