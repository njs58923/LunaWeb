// Este archivo define la escena principal, la carga del HSML, etc.
import { parseHSML, renderVirtualNode } from "./virtual-dom.js";
import { updateDevPanel } from "./devtool.js";
import { updateCallbacks } from "./dimension.js";   // setUpdate, includes, etc.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export let scene, camera, canvas;
let sceneRoot = null;
let lightingEnabled = true;

export let virtualDOM = null;  // global para todo

export function updateSceneFromVirtual() {
  if (!virtualDOM) return;
  if (sceneRoot) {
    scene.remove(sceneRoot);
  }
  sceneRoot = renderVirtualNode(virtualDOM);
  scene.add(sceneRoot);
}

//////////////////////////////////////////////////////////
// 1) Crear Scene, Camera, Renderer
//////////////////////////////////////////////////////////
canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 40);

scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);
camera.position.set(0,5,20);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

function mainRenderLoop() {
  requestAnimationFrame(mainRenderLoop);
  // Llamar updateCallbacks
  updateCallbacks.forEach(cb => cb());
  renderer.render(scene, camera);
}
mainRenderLoop();

//////////////////////////////////////////////////////////
// 2) Botones de la interfaz
//////////////////////////////////////////////////////////
const urlInput = document.getElementById("urlInput");
const loadButton = document.getElementById("loadButton");
loadButton.addEventListener("click", loadHSML);

const devPanel = document.getElementById("devPanel");
const toggleDevPanelBtn = document.getElementById("toggleDevPanel");
toggleDevPanelBtn.addEventListener("click", () => {
  if (devPanel.style.display === "none" || devPanel.style.display === "") {
    devPanel.style.display = "block";
    toggleDevPanelBtn.textContent = "Ocultar DevTools";
  } else {
    devPanel.style.display = "none";
    toggleDevPanelBtn.textContent = "Mostrar DevTools";
  }
});

const toggleFreeCameraBtn = document.getElementById("toggleFreeCamera");
toggleFreeCameraBtn.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  } else {
    document.exitPointerLock();
  }
});

const toggleLightingBtn = document.getElementById("toggleLighting");
toggleLightingBtn.addEventListener("click", () => {
  lightingEnabled = !lightingEnabled;
  if (lightingEnabled) {
    scene.add(ambientLight);
    toggleLightingBtn.textContent = "Desactivar Iluminación";
  } else {
    scene.remove(ambientLight);
    toggleLightingBtn.textContent = "Activar Iluminación";
  }
});

//////////////////////////////////////////////////////////
// 3) loadHSML
//////////////////////////////////////////////////////////
export function loadHSML() {
  const url = urlInput.value;
  fetch(url)
    .then(r => r.text())
    .then(hsmlString => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(hsmlString, "text/xml");
      const spaceElem = xmlDoc.getElementsByTagName("space")[0];
      if (!spaceElem) {
        console.error("No se encontró <space> en el HSML");
        return;
      }
      // Generar Virtual DOM
      window.virtualDOM = parseHSML(spaceElem);
      // Render
      updateSceneFromVirtual();
      // Actualizar DevTool
      updateDevPanel();
    })
    .catch(e => console.error("Error al cargar HSML:", e));
}
