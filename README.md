# HSML 3D Framework

Renderizador 3D con Three.js y un mini-DOM virtual (HSML) para describir escenas, con entrada unificada para Desktop y WebXR (VR), físicas ligeras, y DevTools embebido.

## Tabla de Contenidos

- Requisitos
- Arranque rápido
- Conceptos HSML
- Raíz hsml y include
- UI básica (text/html/video)
- Navegación sandbox
- Atributos comunes
- Scripts en HSML
- API `dimension`
- Eventos de interacción
- Control del jugador (Desktop/VR)
- Físicas y colisiones
- DevTools
- Carga/Exportación
- Ejemplos

## Requisitos

- Bun v1+ (para el servidor de desarrollo)
- Navegador con WebGL 2 y, opcionalmente, WebXR (para VR)

## Arranque rápido

1) Instalar Bun: `curl -fsSL https://bun.sh/install | bash`

2) Ejecutar el servidor (sirve `public/`):

```bash
bun run dev   # recarga en cambios
# o
bun run start
```

3) Abre `http://localhost:3000`

Scripts en `package.json`:

- `start`: `bun run src/server.ts`
- `dev`: `bun --watch run src/server.ts`

## Conceptos HSML

HSML es un XML ligero para describir el mundo 3D:

- `space`: raíz de la escena
- `group`: agrupador lógico
- `model`: carga GLTF (`src`)
- `box`, `sphere`, `plane`: primitivas
- `text`, `html`: texto renderizado en plano (canvas -> textura)
- `video`: plano con VideoTexture (src/autoplay/loop/muted)
- `light`: `type=ambient|directional|point|hemisphere`
- `audio`: utilidades de audio 3D (vía API)
- `include`: inserta otro HSML dentro del espacio, con transform propio

Ejemplo mínimo:

```xml
<space>
  <light type="ambient" intensity="0.7" />
  <group id="world">
    <plane id="floor" width="200" height="200" color="#2a2a2a" y="0" collider="true" thickness="0.1" />
    <box id="centerCube" width="1" height="1" depth="1" color="#4db6ac" x="0" y="0.5" z="0" />
  </group>
  <script>
    // scripts inline que usan la API 'dimension'
  </script>
</space>
```

## Atributos comunes

- Transform: `x, y, z, rx, ry, rz, scale`
- Material: `color, texture, metalness, roughness, emissive`
- Visibilidad: `visible="true|false"`
- Identidad: `id, class`
- Primitivas:
  - box: `width, height, depth`
  - sphere: `radius`
  - plane: `width, height, thickness`
- UI:
  - text/html: `text` (o `html`), `color`, `font`, `fontsize`, `maxwidth`, `lineheight`, `bg`, `width`, `height`, `unitsperpx`
  - video: `src`, `autoplay`, `loop`, `muted`, `width`, `height`
- `collider="true|box|1|yes|on"`: agrega collider AABB estático

Nota: Cambiar `color` en HSML actualiza el material en vivo.

## Scripts en HSML

- Inline: `<script> ... </script>`
- Externo: `<script src="ruta.js" />`
- Atributo: `<script code="...JS..." />`

Los scripts corren tras construir la escena y exponen la API `dimension`. Si hay errores, se loguean en consola.

## Raíz hsml y include

Formato completo:

```xml
<hsml>
  <head>
    <name>Default</name>
    <meta type="position" x="0" y="0" z="0"/>
    <meta type="scale" x="1" y="1" z="1"/>
    <meta type="rotation" x="0" y="0" z="0"/>
    <state name="greeting" type="string" default="holaaa"/>
    <light type="ambient" intensity="0.7" />
    <light type="directional" intensity="1.2" />
  </head>
  <space>
    <!-- contenido -->
  </space>
</hsml>
```

- `<meta …>` aplica transform al root del `space`.
- `<light>` dentro de `<head>` se inyecta al `space`.
- `<state>` expone `dimension.state[name]` para usar en scripts.
- Abreviado: `<space>…</space>` sigue funcionando.

Includes recursivos:

```xml
<include src="./spaces/casa.hsml" x="-4" y="1" z="-6"/>
```

Dentro de `casa.hsml` puedes anidar más `include` (mesa, tv, etc.).

## UI básica (text/html/video)

Texto/HTML en el espacio (no overlay):

```xml
<text text="Hola mundo" color="#fff" fontsize="48" maxwidth="800" unitsperpx="0.002" x="0" y="1.5" z="-2"/>
<html html="Título<br/>Subtítulo" color="#ffd54f" fontsize="42" bg="#202020" x="0" y="1.2" z="-2"/>
```

- Se recalculan al cambiar atributos (p. ej., `setAttribute('text', 'Nuevo')`).
- `html` interpreta `<br/>` como salto; otros tags se ignoran.

Video en un plano:

```xml
<video src="./media/demo.mp4" autoplay="true" loop="true" muted="true" width="1.6" x="0" y="1" z="-3"/>
```

- Ajusta tamaño por metadata si no fija `width/height`.

## Navegación sandbox

En scripts HSML tienes un `location` similar al navegador (interno al visor):

- `location.href = './spaces/otra.hsml'` — carga otro HSML (actualiza `#level`).
- `location.href = '<space>…</space>'` — carga HSML inline.
- `location.assign(url)` / `location.replace(url)` — como en el navegador (SPA interna).
- `location.reload()` — recarga el último espacio cargado.

## API `dimension`

Construcción/consulta:

- `dimension.create(tag, attrs?, children?)`
- `dimension.appendChild(node)`
- `dimension.remove(nodeOrId)`
- `dimension.find(selector)` — `#id`, `.class`, `tag`
- `dimension.get(id)` — acceso directo por id
- `dimension.getObjectFor(nodeOrId)` — objeto Three.js
- `dimension.refresh()`
- `dimension.toHSML()`, `dimension.importHSML(hsml)`

Eventos (bus global):

- `dimension.on(event, handler)`
- `dimension.off(event, handler)`
- `dimension.emit(event, data)`

Loop:

- `dimension.loop.onUpdate(fn)`
- `dimension.loop.offUpdate(fn)`

Entrada:

- `dimension.input.isDown('KeyW')`
- `dimension.input.pointerLocked()`
- `dimension.input.lockPointer()`, `unlockPointer()`
- `dimension.input.onUse(cb)` — evento de “usar” unificado (click/trigger)

Cámara/controlador:

- `dimension.camera.teleport(x,y?,z)`
- `dimension.camera.setYawPitch(yaw,pitch)`
- `dimension.camera.getYawPitch()`
- `dimension.camera.getPosition()`
- `dimension.controller.enable(bool)`
- `dimension.controller.set(fn)` — reemplazar controlador del jugador

Física/picking:

- `dimension.physics.addBoxCollider(object, sizeVec3)`
- `dimension.physics.clearColliders()`
- `dimension.physics.resolvePlayerXZ(vec3, radius?)`
- `dimension.physics.getGroundHeightAt(x,z)`
- `dimension.physics.pickCenter(far?)`
- `dimension.physics.pickFromController(index=0, far?)`

Audio:

- `dimension.audio.play(url, volume?)` — one‑shot
- `dimension.audio.attachPositional(obj,url,{loop,volume,refDistance})`

Utilidades:

- `dimension.math` (por ejemplo `clamp`)

## Eventos de interacción

“toque” (interacción principal):

- Desktop: click/touch centrado contra el objeto visto
- VR: contacto físico del controlador con el objeto y también trigger del controlador apuntando al objeto

Dónde llega “toque”:

- Al nodo HSML impactado (listeners por nodo, estilo DOM)
- Al bus global (`dimension.on('toque', ...)`)
- A `document` como `CustomEvent('toque', { detail })`

Listeners por nodo (estilo DOM):

```js
const cube = dimension.get('centerCube');
let toggle=false;
cube.addEventListener('toque', ({target})=>{
  target.setAttribute('color', toggle ? '#4db6ac' : '#ff7043');
  toggle = !toggle;
});
```

Listener global:

```js
document.addEventListener('toque', (ev) => {
  const { object, point } = ev.detail;
  // ...
});
```

`input:use` (acción/trigger unificado):

```js
dimension.input.onUse((e)=>{
  const hit = e?.hit || dimension.physics.pickCenter();
  if (!hit) return;
  // Interacción por “usar”
});
```

## Control del jugador (Desktop/VR)

Desktop:

- Click sobre el canvas → captura mouse
- WASD moverse, Shift sprint, Space salto
- R recarga escena

VR:

- Stick izquierdo: mover (dirección de la mirada; sin componente vertical)
- Stick derecho: giro suave
- Trigger: “usar”

Notas:

- Cámara: en Desktop la cámara está a `eyeHeight` local y montada en un `xrRig`
- En VR, la altura la aporta el HMD

## Físicas y colisiones

- Colliders estáticos AABB (recomputados por frame):
  - Usa `collider="true"` en `box`, `sphere`, `plane`
  - `plane` usa `thickness` para “altura” del AABB
- Controlador de jugador:
  - Resuelve XZ con empujes hacia caras/esquinas para impedir atravesar paredes
  - Calcula `groundY` y `ceilingY` por AABB bajo el jugador
  - Aplica gravedad y salto (Desktop) o gravedad (VR)

## DevTools

- Botón DevTools en toolbar:
  - Inspector: ver/editar atributos HSML en vivo
  - Status: FPS, memoria
- Utilidades:
  - Grid y Axes toggles
  - Capturar/Liberar mouse
  - Recargar escena

## Carga/Exportación

- Caja de texto en toolbar:
  - Pega HSML (texto) o URL (fetch), Enter para cargar
- Hash `#level` en URL (autoload):
  - `http://localhost:3000/#level=public/static/main.html`
- Exportar:
  - Botón “Exportar HSML” descarga la escena actual

## Ejemplos

Tocar un cubo para cambiar color (por nodo):

```xml
<space>
  <box id="centerCube" width="1" height="1" depth="1" color="#4db6ac" x="0" y="0.5" z="0"/>
  <script>
    const cube = dimension.get('centerCube');
    let toggle=false;
    cube.addEventListener('toque', ({target})=>{
      target.setAttribute('color', toggle ? '#4db6ac' : '#ff7043');
      toggle = !toggle;
    });
  </script>
</space>
```

Cargar un modelo GLTF y hacerlo “spin”:

```xml
<group>
  <model src="./assets/robot.glb" class="spin" x="0" y="0" z="-2"/>
</group>
```

Teletransportar al jugador:

```js
dimension.camera.teleport(0, 1.7, 4);
```

---

Si necesitas más ejemplos (UI interactiva, múltiples escenas, audio 3D avanzado) o deseas integrar con otra fuente de datos, abre un issue o comenta dónde quieres extender el framework.
