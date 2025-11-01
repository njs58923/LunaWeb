# HSML 3D Framework (v3.1 • optimizado esencial)

Renderizador 3D con Three.js y un mini-DOM virtual (HSML) para describir escenas, con entrada unificada para Desktop y WebXR (VR), físicas ligeras, y DevTools embebido.

## Tabla de Contenidos

* Novedades v3.1
* Requisitos
* Arranque rápido
* Conceptos HSML
* Raíz `hsml` y `include`
* UI básica (`text` / `html` / `video` / `audio`)
* Navegación sandbox
* Atributos comunes
* Scripts en HSML
* API `dimension`
* Eventos de interacción
* Control del jugador (Desktop/VR)
* Físicas y colisiones
* DevTools
* Carga/Exportación
* Ejemplos
* Solución de problemas

## Novedades v3.1

* **VR (Quest) estable**: locomoción usa el **yaw del rig** (no de la cabeza), lectura **segura** de ejes del gamepad y **calibración** de signo del stick izquierdo. Giro suave con stick derecho.
* **Audio con ciclo de vida correcto**:

  * Nuevo tag **`<audio>`** HSML (no confundir con HTML nativo) con `src`, `autoplay`, `loop`, `volume`, `positional`, `refDistance`.
  * Todo el audio (2D/posicional) se **detiene al cambiar de espacio**, al remover nodos o recargar includes.
* **`<head>` enriquecido**:

  * `meta type="spawn"` con `x|y|z|yaw|pitch` para punto/rotación inicial del jugador.
  * `state` inicial: valores accesibles vía `dimension.state`.
  * `light` en `<head>` se inyecta al `space`.
* **Includes más potentes**:

  * Soporte de `<script>` dentro de includes (inline, `code`, o `src`).
  * **State overlay** desde atributos `data-*` del `<include>` hacia `dimension.state` durante la ejecución del script incluido.
* **Texto mejorado**:

  * `unitsperpx` para consistencia de tamaño.
  * Redibujo de canvas de texto sólo cuando cambian atributos relevantes.
* **Físicas “dirty”**:

  * Recalcula AABBs de colliders **sólo cuando el nodo cambia** (mejor rendimiento).
* **Interacción VR optimizada**:

  * Detección de “toque” sólo sobre **objetos interactivos** (nodos con listeners) y prioriza colliders cuando existen.
* **DevTools**:

  * Inspector editable + acciones **Centrar** y **Eliminar** (con parada de audio al eliminar).
  * Panel de estado (FPS, memoria), grid/axes toggles y captura/liberación del mouse.

---

## Requisitos

* Bun v1+ (para el servidor de desarrollo)
* Navegador con WebGL 2 y, opcionalmente, WebXR (para VR)

## Arranque rápido

1. Instalar Bun: `curl -fsSL https://bun.sh/install | bash`
2. Ejecutar el servidor (sirve `public/`):

```bash
bun run dev   # recarga en cambios
# o
bun run start
```

3. Abrí `http://localhost:3000`

Scripts en `package.json`:

* `start`: `bun run src/server.ts`
* `dev`: `bun --watch run src/server.ts`

## Conceptos HSML

HSML es un XML ligero para describir el mundo 3D:

* `space`: raíz de la escena
* `group`: agrupador lógico
* `model`: GLTF (`src`)
* `box`, `sphere`, `plane`: primitivas
* `text`, `html`: texto sobre plano (canvas → textura)
* `video`: plano con VideoTexture (`src/autoplay/loop/muted`)
* `audio`: fuente de audio 2D/posicional (ver UI)
* `light`: `type=ambient|directional|point|hemisphere`
* `include`: inserta otro HSML con su propio transform

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

## Raíz `hsml` y `include`

Formato completo:

```xml
<hsml>
  <head>
    <name>Default</name>
    <meta type="position" x="0" y="0" z="0"/>
    <meta type="scale"    x="1" y="1" z="1"/>
    <meta type="rotation" x="0" y="0" z="0"/>
    <meta type="spawn"    x="0" y="1.7" z="6" yaw="0" pitch="0"/>
    <state name="greeting" type="string" default="holaaa"/>
    <light type="ambient" intensity="0.7" />
    <light type="directional" intensity="1.2" />
  </head>
  <space>
    <!-- contenido -->
  </space>
</hsml>
```

* `<meta …>` aplica transform al root del `space`.
* `<meta type="spawn">` define **posición y orientación inicial** del jugador.
* `<light>` en `<head>` se **inyecta** al `space`.
* `<state>` expone `dimension.state[name]` (con `default`).
* Abreviado: `<space>…</space>` sigue funcionando.

**Includes recursivos**:

```xml
<include src="./spaces/casa.hsml" x="-4" y="1" z="-6" data-owner="alice"/>
```

* Los `<script>` del HSML incluido se ejecutan.
* Los atributos `data-*` del `<include>` se **inyectan temporalmente** en `dimension.state[...]` al ejecutar los scripts del include (overlay), y luego se restauran.

## UI básica (`text` / `html` / `video` / `audio`)

### `text` / `html`

```xml
<text text="Hola mundo" color="#fff" fontsize="48" maxwidth="800"
      unitsperpx="0.002" x="0" y="1.5" z="-2"/>

<html html="Título<br/>Subtítulo" color="#ffd54f" fontsize="42" bg="#202020"
      x="0" y="1.2" z="-2"/>
```

* `html` soporta `<br/>` como salto; el resto de tags se filtran (se pinta texto plano).
* Redibuja la textura **sólo cuando cambian** atributos relevantes (`text|html|font|fontsize|maxwidth|lineheight|bg|color|unitsperpx|width|height`).

### `video`

```xml
<video src="./media/demo.mp4" autoplay="true" loop="true" muted="true"
       width="1.6" x="0" y="1" z="-3"/>
```

* Ajusta tamaño por metadata si no fijás `width/height`.
* Puedes actualizar `src/autoplay/loop/muted` en caliente.

### `audio` (HSML)

```xml
<audio src="./media/ambience.ogg" autoplay="true" loop="true"
       positional="true" volume="0.7" refDistance="8" x="0" y="1.5" z="-2"/>
```

* `positional="true"` usa `THREE.PositionalAudio`; si no, `THREE.Audio`.
* **Lifecycle**: al cambiar de espacio, remover nodos o recargar includes, el engine **detiene** todas las fuentes activas.
* **Consejo**: usá el tag HSML `<audio>`. Si ponés un `<audio>` HTML nativo fuera del sistema, el engine no puede gestionarlo.

## Navegación sandbox

En scripts HSML tenés un `location` interno al visor:

* `location.href = './spaces/otra.hsml'` — carga otro HSML (actualiza `#level`)
* `location.href = '<space>…</space>'` — carga HSML inline
* `location.assign(url)` / `location.replace(url)`
* `location.reload()` — recarga el último espacio cargado

## Atributos comunes

* Transform: `x, y, z, rx, ry, rz, scale`
* Material: `color, texture, metalness, roughness, emissive`
* Visibilidad: `visible="true|false"`
* Identidad: `id, class`

Primitivas:

* `box`: `width, height, depth`
* `sphere`: `radius`
* `plane`: `width, height, thickness` (usa `thickness` para AABB)

UI:

* `text/html`: `text|html`, `color`, `font`, `fontsize`, `maxwidth`, `lineheight`, `bg`, `width`, `height`, `unitsperpx`
* `video`: `src`, `autoplay`, `loop`, `muted`, `width`, `height`
* `audio`: `src`, `autoplay`, `loop`, `volume`, `positional`, `refDistance`

Colisión:

* `collider="true|box|1|yes|on"`: agrega **collider AABB estático** (se recalcula cuando el nodo cambia)

## Scripts en HSML

* Inline: `<script> ... </script>`
* Externo: `<script src="ruta.js" />`
* Atributo: `<script code="...JS..." />`

**Orden**: se ejecutan tras construir la escena. En includes, los scripts del documento incluido también corren (con overlay opcional de `dimension.state` desde `data-*`).

## API `dimension`

Construcción/consulta:

* `dimension.create(tag, attrs?, children?)`
* `dimension.appendChild(node)`
* `dimension.remove(nodeOrId)` (detiene audio y remueve objeto)
* `dimension.find(selector)` — `#id`, `.class`, `tag`
* `dimension.get(id)` — acceso por id
* `dimension.getObjectFor(nodeOrId)` — objeto Three.js
* `dimension.refresh()`
* `dimension.toHSML()`, `dimension.importHSML(hsml)`

Eventos (bus global):

* `dimension.on(event, handler)`
* `dimension.off(event, handler)`
* `dimension.emit(event, data)`

Loop:

* `dimension.loop.onUpdate(fn)`
* `dimension.loop.offUpdate(fn)`

Entrada:

* `dimension.input.isDown('KeyW')`
* `dimension.input.pointerLocked()`
* `dimension.input.lockPointer()`, `unlockPointer()`
* `dimension.input.onUse(cb)` — “usar” (click/trigger)

Cámara/controlador:

* `dimension.camera.teleport(x,y?,z)`
* `dimension.camera.setYawPitch(yaw,pitch)`
* `dimension.camera.getYawPitch()`
* `dimension.camera.getPosition()`
* `dimension.controller.enable(bool)`
* `dimension.controller.set(fn)` — reemplazar controlador del jugador

Física/picking:

* `dimension.physics.addBoxCollider(object, sizeVec3)`
* `dimension.physics.clearColliders()`
* `dimension.physics.resolvePlayerXZ(vec3, radius?)`
* `dimension.physics.getGroundHeightAt(x,z)`
* `dimension.physics.pickCenter(far?)`
* `dimension.physics.pickFromController(index=0, far?)`

Audio:

* `dimension.audio.play(url, volume?)` — one-shot
* `dimension.audio.attachPositional(obj,url,{loop,volume,refDistance})`

Utilidades:

* `dimension.math` (ej: `clamp`)

## Eventos de interacción

**`toque`** (interacción principal):

* Desktop: click/touch centrado contra el objeto visto
* VR: contacto físico del controlador con el objeto y también trigger apuntando

Dónde llega:

* Al nodo HSML impactado (listeners estilo DOM)
* Al bus global (`dimension.on('toque', ...)`)
* A `document` como `CustomEvent('toque', { detail })`

Nodo (estilo DOM):

```js
const cube = dimension.get('centerCube');
let toggle=false;
cube.addEventListener('toque', ({target})=>{
  target.setAttribute('color', toggle ? '#4db6ac' : '#ff7043');
  toggle = !toggle;
});
```

Global:

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
  // ...
});
```

## Control del jugador (Desktop/VR)

**Desktop**

* Click sobre el canvas → captura mouse
* WASD moverse, Shift sprint, Space salto
* R recarga escena

**VR (Quest y otros)**

* Stick izquierdo: mover en función del **yaw del rig** (no de la cabeza)
* Stick derecho: **giro suave**
* Trigger: “usar”
* Lectura **segura** de ejes y **calibración** automática del signo del stick izquierdo (evita inversiones y crasheos)

Notas:

* Desktop: cámara a `eyeHeight` local montada en `xrRig`
* VR: la altura la aporta el HMD; el rig se sincroniza con la cabeza

## Físicas y colisiones

* Colliders estáticos AABB (cajas):

  * `collider="true"` en `box/sphere/plane` (para `plane` se usa `thickness`)
* Controlador:

  * Resuelve XZ empujando hacia caras/esquinas
  * Calcula `groundY` y `ceilingY` por AABB bajo el jugador
  * Aplica gravedad y salto (Desktop) o gravedad (VR)
* **Dirty-update de colliders**: se recalculan sólo cuando el nodo cambia (mejor rendimiento)

## DevTools

* Toolbar:

  * **DevTools**: abre panel
  * **Inspector**: ver/editar atributos HSML en vivo

    * Botón **Centrar**: centra cámara en el objeto
    * Botón **Eliminar**: remueve el nodo (también detiene audio)
  * **Status**: FPS y memoria
  * Toggles: **Grid/Axes**, **Capturar/Liberar mouse**
  * **Recargar** escena (o tecla **R**)

## Carga/Exportación

* Caja de texto en toolbar:

  * Pega HSML inline o URL; Enter para cargar
* Hash `#level` en URL:

  * `http://localhost:3000/#level=public/static/main.html`
* Exportar:

  * “Exportar HSML” descarga la escena actual

## Ejemplos

**1) Tocar un cubo para cambiar color**

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

**2) GLTF con clase `spin`**

```xml
<group>
  <model src="./assets/robot.glb" class="spin" x="0" y="0" z="-2"/>
</group>
```

**3) Teletransportar al jugador**

```js
dimension.camera.teleport(0, 1.7, 4);
```

**4) Espacio “puerta” y HUD de FPS**

```xml
<hsml>
  <space>
    <group class="spin">
      <box id="box" color="#546e7a" y="1"/>
      <text id="text"  text="..." y="1.7"/>
      <text id="text2" text="..." y="1.7" ry="3"/>

      <!-- HUD de FPS en el mundo -->
      <text id="fps" text="FPS: --"
            x="0" y="2.3" z="0"
            fontsize="48" maxwidth="512"
            unitsperpx="0.002" bg="rgba(0,0,0,0.35)"/>
    </group>
  </space>

  <script>
    const { to, title } = dimension.state;

    // Navegación
    const box = dimension.get('box');
    box.addEventListener('toque', () => { location.href = to; });

    // Títulos
    dimension.get('text') .setAttribute('text', title);
    dimension.get('text2').setAttribute('text', title);

    // FPS actualizado ~4 Hz (evita redibujar cada frame)
    let acc = 0, frames = 0;
    dimension.loop.onUpdate((dt) => {
      acc += dt; frames++;
      if (acc >= 0.25) {
        const fps = (frames / acc).toFixed(1);
        dimension.setAttr('fps', 'text', `FPS: ${fps}`);
        acc = 0; frames = 0;
      }
    });
  </script>
</hsml>
```

**5) Audio posicional**

```xml
<audio src="./media/loop.ogg" autoplay="true" loop="true"
       positional="true" volume="0.6" refDistance="6"
       x="1.5" y="1.2" z="-2"/>
```

## Solución de problemas

* **Quest crashea al mover stick izquierdo**
  Asegurate de usar esta versión (v3.1 optimizada): la locomoción toma el yaw del rig, se leen ejes con tolerancia y se calibra el signo del stick izquierdo.
* **Audio que no se detiene al cambiar de espacio**
  Usá el tag HSML `<audio>` (no el `<audio>` HTML nativo). El engine detiene automáticamente todas las fuentes HSML al recargar, remover nodos o includes.
* **Texto caro de renderizar**
  Cambiá el contenido/dimensiones a lo sumo unas veces por segundo (como el ejemplo de FPS). Cada cambio regenera el canvas.
* **Colisiones raras con `plane`**
  Recordá setear `thickness` si usás `collider="true"` para que el AABB tenga altura.
