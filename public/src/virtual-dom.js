import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/*************************************************
 *  VirtualNode
 *************************************************/
export class VirtualNode {
  constructor(tag) {
    this.tag = tag;
    this.attributes = {};
    this.children = [];
    this.key = VirtualNode._keyCounter++;
  }
  setAttribute(attr, value) {
    this.attributes[attr] = value;
  }
  appendChild(child) {
    this.children.push(child);
  }
}
VirtualNode._keyCounter = 1;

/*************************************************
 *  parseHSML(xmlNode):
 *    - Detecta <script src="...">
 *    - Concatena en VirtualNode
 *************************************************/
export function parseHSML(xmlNode) {
  if (!xmlNode || xmlNode.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  if (xmlNode.nodeName === "script") {
    const scriptSrc = xmlNode.getAttribute("src");
    if (scriptSrc) {
      const s = document.createElement("script");
      s.src = scriptSrc;
      document.body.appendChild(s);
    }
    return null;
  }
  const vnode = new VirtualNode(xmlNode.nodeName);
  // Copiar atributos
  for (let i = 0; i < xmlNode.attributes.length; i++) {
    const attr = xmlNode.attributes[i];
    vnode.setAttribute(attr.name, attr.value);
  }
  // Recursivo en hijos
  Array.from(xmlNode.childNodes).forEach(child => {
    const childVNode = parseHSML(child);
    if (childVNode) {
      vnode.appendChild(childVNode);
    }
  });
  return vnode;
}

/*************************************************
 *  Render VirtualNode -> Three.js Object3D
 *************************************************/
export function renderVirtualNode(vnode) {
  let obj;
  if (vnode.tag === "model") {
    obj = new THREE.Object3D();
    const src = vnode.attributes["src"];
    if (src) {
      const loader = new GLTFLoader();
      loader.load(src, gltf => {
        while (obj.children.length > 0) {
          obj.remove(obj.children[0]);
        }
        obj.add(gltf.scene);
      }, undefined, err => console.error("Error al cargar modelo:", src, err));
    }
  } else {
    obj = new THREE.Object3D();
  }
  obj.userData.key = vnode.key;
  applyTransformations(obj, vnode.attributes);
  // hijos recursivos
  vnode.children.forEach(childVNode => {
    obj.add(renderVirtualNode(childVNode));
  });
  return obj;
}

// Aplica transformaciones a un Object3D, en base a attrs
export function applyTransformations(obj, attrs) {
    // scale
    if (attrs["scale"]) {
      const s = parseFloat(attrs["scale"]);
      if (!isNaN(s)) obj.scale.set(s, s, s);
    }
    // position x,y,z
    if (attrs["x"]) {
      const vx = parseFloat(attrs["x"]);
      if (!isNaN(vx)) obj.position.x = vx;
    }
    if (attrs["y"]) {
      const vy = parseFloat(attrs["y"]);
      if (!isNaN(vy)) obj.position.y = vy;
    }
    if (attrs["z"]) {
      const vz = parseFloat(attrs["z"]);
      if (!isNaN(vz)) obj.position.z = vz;
    }
    // px,py,pz
    if (attrs["px"]) {
      const px = parseFloat(attrs["px"]);
      if (!isNaN(px)) obj.position.x = px;
    }
    if (attrs["py"]) {
      const py = parseFloat(attrs["py"]);
      if (!isNaN(py)) obj.position.y = py;
    }
    if (attrs["pz"]) {
      const pz = parseFloat(attrs["pz"]);
      if (!isNaN(pz)) obj.position.z = pz;
    }
  
    // rotationX, rotationY, rotationZ
    if (attrs["rotationX"]) {
      const rx = parseFloat(attrs["rotationX"]);
      if (!isNaN(rx)) obj.rotation.x = rx * (Math.PI/180); 
      // si quieres rotación en grados. O deja "rx" directo si es radianes
    }
    if (attrs["rotationY"]) {
      const ry = parseFloat(attrs["rotationY"]);
      if (!isNaN(ry)) obj.rotation.y = ry * (Math.PI/180);
    }
    if (attrs["rotationZ"]) {
      const rz = parseFloat(attrs["rotationZ"]);
      if (!isNaN(rz)) obj.rotation.z = rz * (Math.PI/180);
    }
  }
  