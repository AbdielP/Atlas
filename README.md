# TODO

## Pendientes generales
- [ ] Supabase: crear tablas (visited_countries, photos, achievements, notes) + RLS
- [ ] Supabase: activar Google OAuth
- [ ] Instalar `@supabase/supabase-js` y crear cliente (`src/lib/supabase.js`)
- [ ] Guardar URL y anon key en `.env`
- [ ] Pantalla de Login con Google
- [ ] Conectar `countryStore` a Supabase (fire-and-forget, sin bloquear el globo)
- [ ] Pantalla de Detalle: tab Fotos (álbum real con expo-image-picker)
- [ ] Pantalla de Detalle: tab Notas (texto libre, guardado en Supabase)
- [ ] Pantalla de Detalle: tab Logros (filtrados por país/continente)
- [ ] Logros: lógica real (evaluar countryStates, desbloquear automático)
- [ ] Estadísticas flotantes en el globo (visibles solo en zoom mínimo)
- [ ] GPS: marcador de ubicación actual con expo-location
- [ ] Perfil: mostrar datos reales del usuario autenticado
- [ ] Paywall modal (límite de fotos Free → Premium) Pwk1U6iticN9v8bN

---

## Base de datos (Supabase)

### 1. Crear tablas en Supabase
- `visited_countries` — id, user_id, country_code (cca3), status (visited/wishlist), updated_at
- `photos` — id, user_id, country_code, storage_path, created_at
- `achievements` — id, user_id, achievement_key, unlocked_at
- `notes` — id, user_id, country_code, body, updated_at
- Activar RLS en las 4 tablas: cada usuario solo lee/escribe sus propios registros (`user_id = auth.uid()`)

### 2. Configurar autenticación
- Habilitar Google OAuth en Supabase Auth (panel → Authentication → Providers)
- Instalar `@supabase/supabase-js`
- Crear `src/lib/supabase.js` con el cliente (URL + anon key desde variables de entorno)
- Crear pantalla de Onboarding/Login con botón "Continuar con Google"
- Agregar Stack raíz en AppNavigator: Login → Tabs (solo si no hay sesión activa)

### 3. Conectar visited_countries (prioridad alta)
- En `countryStore.js`: después del write a AsyncStorage, hacer upsert a Supabase en background (fire-and-forget, sin await en el hilo del UI)
- Al iniciar app: cargar AsyncStorage primero (rápido, ya funciona), luego en background fetch de Supabase y reconciliar diferencias
- En caso de conflicto: Supabase gana (es la fuente de verdad); AsyncStorage es solo caché offline

### 4. Conectar el resto de tablas
- Fotos: al implementar álbum, subir a Supabase Storage + insertar fila en `photos`
- Logros: al desbloquear, insertar en `achievements`
- Notas: al guardar nota de país, upsert en `notes`

---

## Estrategia de rendimiento (no bloquear el pintado del globo)

El globo se pinta cambiando un material de Three.js en memoria — es instantáneo y nunca debe esperar IO.

Flujo correcto al marcar un país:
1. **Inmediato** — actualizar estado en memoria + color en Three.js (ya funciona así)
2. **Inmediato async** — escribir en AsyncStorage (no bloquea, ya funciona así)
3. **Background, fire-and-forget** — upsert a Supabase SIN await en el handler de UI

```
// countryStore.js — patrón a seguir
export async function setCountryStateAndPersist(iso, state) {
    setCountryState(iso, state);          // síncrono, instantáneo
    await persistCountryStates();         // AsyncStorage, no bloquea UI
    syncToSupabase(iso, state);           // fire-and-forget, sin await
}

function syncToSupabase(iso, state) {
    // No se awaita — corre en background
    supabase.from("visited_countries").upsert({ ... }).then(...).catch(console.warn);
}
```

Al arrancar la app (en `preloadCountryStates`):
1. Leer AsyncStorage → mostrar todo de inmediato (0 lag perceptible)
2. En background: fetch Supabase → reconciliar y actualizar colores en el globo sin freeze

---

## Pendientes de auth antes de conectar DB
- Obtener URL y anon key del proyecto Supabase
- Guardarlos en `.env` (nunca hardcodear en el código)
- Configurar `app.json` para exponer variables de entorno a Expo (`expo-constants` o `@env`)
