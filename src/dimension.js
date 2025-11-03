import { VirtualNode } from "./virtual-dom.js";

import { updateSceneFromVirtual, updateDevPanel } from "./src/main.js";

// "includes" global para tus scripts
window.includes = [];

// Callbacks que se llaman cada frame
export const updateCallbacks = [];
window.setUpdate = function(cb) {
  updateCallbacks.push(cb);
};

// Emulación del "dimension" que usan tus scripts externos
window.dimension = {
  createElement(tag) {
    // Creamos el VirtualNode base
    const vnode = new VirtualNode(tag);

    // Creamos un pseudo-objeto para manipularlo (src, position, rotation, setAttribute, etc.)
    const pseudo = {
      _vnode: vnode,         // referencia interna al nodo virtual
      collider: false,
      rigidbody: false,

      // Atributo "src" (en <model>)
      get src() {
        return vnode.attributes["src"];
      },
      set src(val) {
        vnode.attributes["src"] = val;
        updateSceneFromVirtual();
        updateDevPanel();
      },

      // Emulación de "position"
      position: { x: 0, y: 0, z: 0 },
      // Emulación de "rotation"
      rotation: { x: 0, y: 0, z: 0 },

      // setAttribute(k,v)
      setAttribute(k, v) {
        vnode.setAttribute(k, v);
        updateSceneFromVirtual();
        updateDevPanel();
      },
    };

    // Proxy para "position"
    const posProxy = new Proxy(pseudo.position, {
      set(target, prop, value) {
        Reflect.set(target, prop, value);
        if (["x","y","z"].includes(prop)) {
          // Guardar en atributos; por consistencia, puedes usar "x"/"y"/"z" directos
          vnode.attributes[prop] = value;
          updateSceneFromVirtual();
          updateDevPanel();
        }
        return true;
      }
    });
    pseudo.position = posProxy;

    // Proxy para "rotation"
    const rotProxy = new Proxy(pseudo.rotation, {
      set(target, prop, value) {
        Reflect.set(target, prop, value);
        if (["x","y","z"].includes(prop)) {
          // Almacenar en atributos; usaremos rotationX, rotationY, rotationZ
          if (prop === "x") vnode.attributes["rotationX"] = value;
          if (prop === "y") vnode.attributes["rotationY"] = value;
          if (prop === "z") vnode.attributes["rotationZ"] = value;
          updateSceneFromVirtual();
          updateDevPanel();
        }
        return true;
      }
    });
    pseudo.rotation = rotProxy;

    return pseudo;
  },

  appendChild(child, parent = null) {
    if (!child || !child._vnode) return;
    if (!parent) {
      // Añadir al root del virtual DOM
      if (window.virtualDOM) {
        window.virtualDOM.children.push(child._vnode);
      }
    } else if (parent._vnode) {
      parent._vnode.children.push(child._vnode);
    }
    updateSceneFromVirtual();
    updateDevPanel();
  },
};
