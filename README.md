# TODO

## Pendientes generales
- [x] Supabase: crear tablas (visited_countries, photos, achievements) + RLS
- [x] Supabase: activar Google OAuth
- [x] Instalar `@supabase/supabase-js` y crear cliente (`src/lib/supabase.js`) con sesión cifrada (LargeSecureStore + AES-256)
- [x] Guardar URL y publishable key en `.env.local` (gitignoreado)
- [x] Pantalla de Login con Google
- [x] Conectar `countryStore` a Supabase (fire-and-forget, sin bloquear el globo)
- [ ] Pantalla de Detalle: tab Fotos (álbum real con expo-image-picker)
- [ ] Pantalla de Detalle: tab Notas (texto libre, guardado en Supabase)
- [x] Pantalla de Detalle: tab Logros (filtrados por país/continente)
- [x] Logros: lógica real (15 logros, evaluación automática, toast de notificación)
- [ ] Estadísticas flotantes en el globo (visibles solo en zoom mínimo)
- [ ] GPS: marcador de ubicación actual con expo-location
- [x] Perfil: mostrar datos reales del usuario autenticado
- [ ] Paywall modal (límite de fotos Free → Premium)

---

## ▶ Próximo paso recomendado: Tab Notas

**Por qué es lo más óptimo ahora:**
Supabase ya está conectado y funcionando. Es solo UI (TextInput + botón guardar) y un upsert a una tabla nueva `notes`. No requiere paquetes nuevos ni configuración externa.

**Qué implica:**
1. Crear tabla `notes` en Supabase (id, user_id, country_code, body, updated_at) + RLS
2. UI en el tab Notas de CountryDetailScreen: TextInput multilínea + guardado automático
3. Cargar nota al abrir el detalle, guardar al salir o con debounce

**Después de Notas, el orden lógico sería:**
- Tab Fotos (requiere expo-image-picker + Supabase Storage)
- Estadísticas flotantes en el globo
- GPS (expo-location)
- Paywall modal

---

## Logros (15 implementados)

| Key | Nombre | Requisito |
|---|---|---|
| `first_country` | Primer destino | 1 país visitado |
| `5_countries` | Viajero novato | 5 países |
| `10_countries` | Trotamundos | 10 países |
| `25_countries` | Ciudadano del mundo | 25 países |
| `50_countries` | Leyenda viajera | 50 países |
| `first_wishlist` | Soñador | 1 país en wishlist |
| `10_wishlist` | Lista de sueños | 10 en wishlist |
| `2_continents` | Intercontinental | 2 continentes |
| `3_continents` | Explorador continental | 3 continentes |
| `5_continents` | Viajero global | 5 continentes |
| `6_continents` | Planeta desbloqueado | 6 continentes |
| `south_america` | Alma latina | 3 países de América Latina |
| `europe` | Eurotrip | 5 países de Europa |
| `asia` | Ruta asiática | 3 países de Asia |
| `africa` | Safari completo | 3 países de África |

- Evaluación reactiva al marcar/desmarcar países
- Una vez desbloqueado, no se revoca
- Toast animado al desbloquear (banner oscuro + trofeo, 3s, con cola)
- Sincronización a Supabase en background
- Tab Logros en detalle de país filtra por relevancia (globales + región del país)

---

## Base de datos (Supabase)

### Tablas creadas
- `visited_countries` — id, user_id, country_code (char 2, alpha-2), status ('visitado'/'wishlist'), visited_at
- `photos` — id, user_id, country_code, storage_path, created_at
- `achievements` — id, user_id, achievement_key, unlocked_at
- RLS activo en las 3 tablas: `user_id = auth.uid()`

### Notas de implementación
- El app usa alpha-3 (cca3) internamente; se mapea a alpha-2 al leer/escribir en Supabase
- El app usa `"visited"` internamente; se mapea a `"visitado"` al leer/escribir en Supabase
- Auth: Google OAuth (web via expo-auth-session, móvil via @react-native-google-signin nativo)
- Sesión cifrada en dispositivo con AES-256 + expo-secure-store (LargeSecureStore), en web usa AsyncStorage
- Credenciales en `.env.local` (nunca en git)
- Expo Go NO funciona para Google OAuth en móvil — requiere development build via EAS Build

---

## Estrategia de rendimiento (el globo nunca espera IO)

Flujo al marcar un país:
1. **Inmediato** — actualizar estado en memoria + color en Three.js
2. **Async no bloqueante** — escribir en AsyncStorage
3. **Background, fire-and-forget** — upsert a Supabase sin await

Al arrancar la app:
1. Leer AsyncStorage → pintar el globo de inmediato
2. Obtener sesión en background → fetch Supabase → reconciliar y repintar

---

## Build y testing

- **Web**: `npx expo start` → funciona directo con Google OAuth
- **Móvil**: `eas build --profile development --platform android` → instalar APK → `npx expo start --dev-client`
- **EAS project**: `@yellow26/atlas`
