
# Luna Web Framework (v3.2 • Espacios Virtuales)

Renderizador 3D con **Three.js**, un **mini-DOM virtual (HSML)** para describir escenas, y entrada unificada para **Desktop y WebXR (VR)**.
Incluye físicas ligeras, audio posicional gestionado, DevTools avanzados y soporte de **favoritos e inicio persistente**.

---

## Tabla de Contenidos

* Novedades v3.2
* Requisitos
* Arranque rápido
* Conceptos HSML
* Raíz `hsml` y `include`
* UI (`text` / `html` / `video` / `audio`)
* Atributos comunes
* Scripts en HSML
* API `dimension`
* Eventos de interacción
* Control del jugador (Desktop/VR)
* Físicas y colisiones
* DevTools
* Carga, Favoritos e Inicio
* Ejemplos
* Solución de problemas

---

## 🆕 Novedades v3.2

### Motor y DOM Virtual

* Reescritura parcial del **Virtual DOM**:

  * Reindexado en caliente cuando cambian `id` o `class`.
  * Nuevos *dirty sets* por nodo y colisión (actualiza sólo los elementos modificados).
  * `appendChild` e `id/class` ahora actualizan automáticamente los índices.
  * Soporte de **proxy bidireccional** (`vnode ↔ proxy`).

* **Includes dinámicos mejorados**:

  * Se pueden desmontar y recargar (`mount`, `enabled`, `active`).
  * Recarga automática al cambiar el atributo `src` sin reiniciar la escena.
  * Scripts en includes se ejecutan con *overlay temporal* de `data-*` → `dimension.state`.

### DevTools

* **Panel rediseñado** (HTML + CSS integrados en toolbar):

  * **Inspector de árbol virtual HSML** editable en vivo.
  * Botones **Centrar** y **Eliminar** en cada nodo (con parada de audio y desindexado automático).
  * Panel “Estado” con FPS y memoria (actualiza a 4 Hz).
  * Sección inferior colapsable (`#devPanel`) con pestañas *Inspector* / *Estado*.
* Actualización controlada (throttle 100 ms) para evitar sobrecarga.

### Toolbar superior ampliada

* **Entrada directa** (`#urlInput`): permite pegar HSML inline o una URL.
* **Botones**:

  * 📁 Cargar (`folder_open`)
  * 🧰 DevTools (`build`)
  * 💾 Exportar HSML
  * ⭐ Favoritos: agregar / abrir / lista desplegable
  * 🏠 Inicio persistente (`home` + `push_pin`)
  * ⚙️ Opciones: panel para definir o guardar inicio
* **Favoritos persistentes** en `localStorage`.

### Audio y Físicas

* Audio 2D y posicional gestionado automáticamente:

  * Detiene todas las fuentes al cambiar de espacio o eliminar nodos.
  * Soporte de **one-shots** (`dimension.audio.play`) con autolimpieza.
* Colisionadores AABB recalculados sólo en nodos “sucios” (dirty).
* Físicas con control de techo y suelo (`getGroundHeightAt`, `getCeilingHeightAt`).

### WebXR (VR) v3.2

* Locomoción VR basada en **yaw de la cabeza**, con calibración automática y zonas muertas.
* Giro suave con stick derecho (pivot: cabeza).
* Movimiento físico desacoplado del collider, evita “drift”.
* Lectura segura de sticks (`getAxisSafe`) y tolerancias.
* Soporte Quest y OpenXR estable.

### Render y rendimiento

* Límite de DPI dinámico (`DPR_CAP = 1.5`) para rendimiento en VR.
* Reuso de materiales y caché GLTF (`gltfCache`).
* Actualización incremental por “dirty nodes”.

---

## Requisitos

* **Bun v1+** (servidor de desarrollo)
* **Navegador con WebGL 2** y, opcionalmente, **WebXR**

---

## Arranque rápido

1. Instalar Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Ejecutar el servidor:

```bash
bun run dev   # recarga automática
# o
bun run start
```

3. Abrí en tu navegador: [http://localhost:3000](http://localhost:3000)

Scripts (`package.json`):

* `start`: `bun run src/server.ts`
* `dev`: `bun --watch run src/server.ts`

---

## Conceptos HSML

HSML es un **XML simplificado** para describir mundos 3D:

* `space`: raíz de la escena.
* `group`: agrupador lógico.
* `model`: GLTF (`src`).
* `box`, `sphere`, `plane`: primitivas.
* `text`, `html`: texto renderizado sobre plano (canvas → textura).
* `video`: plano con VideoTexture (`src/autoplay/loop/muted`).
* `audio`: fuente de audio 2D o posicional.
* `light`: `type=ambient|directional|point|hemisphere`.
* `include`: inserta otro HSML con su propio transform.

Ejemplo mínimo:

```xml
<space>
  <light type="ambient" intensity="0.7" />
  <group id="world">
    <plane width="200" height="200" color="#2a2a2a" y="0" collider="true" thickness="0.1"/>
    <box id="centerCube" width="1" height="1" depth="1" color="#4db6ac" y="0.5" />
  </group>
</space>
```

---

## Raíz `hsml` y `include`

```xml
<hsml>
  <head>
    <meta type="spawn" x="0" y="1.7" z="6" yaw="0" pitch="0"/>
    <state name="greeting" default="hola"/>
    <light type="ambient" intensity="0.7"/>
  </head>
  <space>
    <!-- contenido -->
  </space>
</hsml>
```

* `<meta>` aplica transform inicial.
* `<state>` se expone como `dimension.state[name]`.
* `<light>` dentro de `<head>` se inyecta automáticamente.
* `<include>` ahora puede tener:

  * `mount`, `enabled`, `active`: montado condicional.
  * `data-*`: overlay temporal hacia `dimension.state`.

---

## UI (`text`, `html`, `video`, `audio`)

* `text` / `html` reescritos con **canvas wrapping** automático y `unitsperpx`.
* Redibuja sólo al cambiar atributos relevantes.
* `video` usa `VideoTexture` y se ajusta por metadata.
* `audio` (HSML):

  * Gestionado por el motor.
  * Soporta `positional`, `loop`, `refDistance`, `volume`.
  * Se detiene automáticamente al recargar, remover o cambiar espacio.

---

## Atributos comunes

| Tipo        | Atributos                                        |         |   |     |                                |
| ----------- | ------------------------------------------------ | ------- | - | --- | ------------------------------ |
| Transform   | `x, y, z, rx, ry, rz, scale`                     |         |   |     |                                |
| Material    | `color, texture, metalness, roughness, emissive` |         |   |     |                                |
| Visibilidad | `visible="true                                   | false"` |   |     |                                |
| Identidad   | `id, class`                                      |         |   |     |                                |
| Colisión    | `collider="true                                  | box     | 1 | yes | on"`, `thickness`(para`plane`) |

---

## Scripts en HSML

Formas admitidas:

* `<script> ... </script>` — inline
* `<script code="..."/>` — atributo
* `<script src="./script.js"/>` — externo

Los scripts de includes se ejecutan en sandbox con `dimension`, `location` y `state`.

---

## API `dimension`

```js
dimension.create(tag, attrs?, children?)
dimension.appendChild(node)
dimension.remove(nodeOrId)
dimension.find(selector)
dimension.get(id)
dimension.refresh()
dimension.importHSML(xml)
dimension.toHSML()
```

Eventos:

```js
dimension.on('toque', fn)
dimension.emit('toque', data)
```

Cámara y jugador:

```js
dimension.camera.teleport(x, y, z)
dimension.controller.set(fn)
dimension.controller.enable(false)
```

Físicas y picking:

```js
dimension.physics.resolvePlayerXZ(vec3, radius)
dimension.physics.pickCenter(far?)
```

Audio:

```js
dimension.audio.play(url, volume)
dimension.audio.attachPositional(obj, url, opts)
```

---

## Control del jugador

### Desktop

* **WASD**, **Shift** sprint, **Space** salto.
* Click: captura el mouse.
* `R`: recarga escena.

### VR

* Stick izquierdo: moverse (según **yaw de la cabeza**).
* Stick derecho: **giro suave** alrededor de la cabeza.
* Trigger: acción principal.
* Detección segura de ejes + calibración automática.

---

## Físicas y colisiones

* AABB estáticos calculados por objeto.
* Actualización *dirty* sólo en nodos modificados.
* `resolveCollisionsXZ` empuja sobre caras y esquinas.
* `getGroundHeightAt` / `getCeilingHeightAt` detectan piso y techo.
* Soporte de gravedad y salto (desktop).

---

## DevTools

* **Panel persistente (`#devPanel`)**:

  * Inspector editable del árbol virtual HSML.
  * Botones “Centrar” y “Eliminar” por nodo.
  * Estado: FPS, memoria.
* **Toggles rápidos**: Grid, Ejes, Mouse, Luz, Recargar.
* Actualización diferida para evitar lag.

---

## Carga, Favoritos e Inicio

* Caja de texto (`#urlInput`): pegar HSML o URL.
* Botones:

  * ⭐ Agregar/Abrir favorito.
  * 🏠 Definir inicio persistente.
  * ⚙️ Panel de opciones con guardado.
* Estado persistente en `localStorage`.

---

## Ejemplo básico

```xml
<space>
  <box id="cubo" color="#4db6ac" collider="true" />
  <script>
    const c = dimension.get('cubo');
    c.addEventListener('toque', () => {
      const color = c.getAttribute('color') === '#4db6ac' ? '#ff7043' : '#4db6ac';
      c.setAttribute('color', color);
    });
  </script>
</space>
```

---

## Solución de problemas

* **No se detiene el audio** → asegurate de usar `<audio>` HSML, no HTML.
* **Include no se actualiza** → revisá `mount="true"` y `src` correcto.
* **Texto se redibuja constantemente** → sólo cambia `text` cuando sea necesario.
* **VR con sticks invertidos** → calibración automática aplicada (v3.2).
