import { updateSceneFromVirtual, scene, camera } from './main.js';

/*************************************************
 *  DevTool: ver y editar VirtualNode
 *************************************************/
export function buildTreeHTML(vnode) {
  const li = document.createElement("li");
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.flexWrap = "wrap";
  header.style.alignItems = "center";

  // Tag
  const tagSpan = document.createElement("span");
  tagSpan.textContent = `<${vnode.tag}>`;
  header.appendChild(tagSpan);

  // Atributos editables
  for (const attrName in vnode.attributes) {
    const attrValue = vnode.attributes[attrName];
    const attrLabel = document.createElement("span");
    attrLabel.textContent = ` ${attrName}="`;
    attrLabel.style.marginLeft = "4px";
    const attrInput = document.createElement("span");
    attrInput.contentEditable = true;
    attrInput.classList.add("attrInput");
    attrInput.textContent = attrValue;
    attrInput.addEventListener("blur", () => {
      const newVal = attrInput.textContent.trim();
      vnode.attributes[attrName] = newVal;
      updateSceneFromVirtual(); // re-render
      updateDevPanel();
    });
    attrLabel.appendChild(attrInput);
    const closeQ = document.createElement("span");
    closeQ.textContent = `"`;
    attrLabel.appendChild(closeQ);
    header.appendChild(attrLabel);
  }

  // Botón "Centrar"
  const centerBtn = document.createElement("button");
  centerBtn.classList.add("actionBtn");
  centerBtn.textContent = "Centrar";
  centerBtn.addEventListener("click", e => {
    e.stopPropagation();
    // Buscar el obj en la escena
    scene.traverse(obj => {
      if (obj.userData.key === vnode.key) {
        centerObject(obj);
      }
    });
  });
  header.appendChild(centerBtn);

  // Botón "Eliminar"
  const removeBtn = document.createElement("button");
  removeBtn.classList.add("actionBtn");
  removeBtn.textContent = "Eliminar";
  removeBtn.addEventListener("click", e => {
    e.stopPropagation();
    removeVNodeByKey(window.virtualDOM, vnode.key);
    updateSceneFromVirtual();
    updateDevPanel();
  });
  header.appendChild(removeBtn);

  li.appendChild(header);

  // Hijos
  if (vnode.children.length > 0) {
    const ul = document.createElement("ul");
    vnode.children.forEach(child => {
      const childHTML = buildTreeHTML(child);
      if (childHTML) ul.appendChild(childHTML);
    });
    li.appendChild(ul);
  }
  return li;
}

// Actualizar panel
export function updateDevPanel() {
  const treeView = document.getElementById("treeView");
  treeView.innerHTML = "";
  if (!window.virtualDOM) return;
  const tree = buildTreeHTML(window.virtualDOM);
  if (tree) treeView.appendChild(tree);
}

// Eliminar un nodo recursivamente
export function removeVNodeByKey(root, key) {
  if (!root || !root.children) return false;
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].key === key) {
      root.children.splice(i, 1);
      return true;
    } else {
      if (removeVNodeByKey(root.children[i], key)) return true;
    }
  }
  return false;
}

// Centrar cámara
function centerObject(obj) {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  if (pos.lengthSq() === 0) pos.copy(obj.position);
  camera.position.set(pos.x, pos.y, pos.z + 5);
  camera.lookAt(pos);
}
