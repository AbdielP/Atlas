# TODO

## Pendientes generales
- [x] Supabase: crear tablas (visited_countries, photos, achievements) + RLS
- [x] Supabase: activar Google OAuth
- [x] Instalar `@supabase/supabase-js` y crear cliente (`src/lib/supabase.js`) con sesión cifrada (LargeSecureStore + AES-256)
- [x] Guardar URL y publishable key en `.env.local` (gitignoreado)
- [x] Pantalla de Login con Google
- [x] Conectar `countryStore` a Supabase (fire-and-forget, sin bloquear el globo)
- [x] Pantalla de Detalle: tab Fotos (álbum real con expo-image-picker)
- [x] Pantalla de Detalle: tab Notas (notas individuales como tarjetas, CRUD, guardado en Supabase)
- [x] Pantalla de Detalle: tab Logros (filtrados por país/continente)
- [x] Logros: lógica real (15 logros, evaluación automática, toast de notificación)
- [x] Estadísticas flotantes en el globo (visibles solo en zoom mínimo)
- [x] GPS: marcador de ubicación actual con expo-location + botón centrar
- [x] Perfil: mostrar datos reales del usuario autenticado
- [ ] Paywall modal (límite de fotos Free → Premium)

---

### Difícil — varios paquetes + lógica compleja + storage externo
- [x] **Tab Fotos (álbum)** — `expo-image-picker` + `expo-image-manipulator` (compresión a 1080px, calidad 0.7) + Supabase Storage (bucket `photos`, público). Grid de fotos, agregar/eliminar, límite Free (5 por país). Preview en bottom sheet con contador real.
- [ ] **Paywall modal** — detectar límite de fotos Free, mostrar modal Premium sobre cualquier pantalla. En v1 es simulado (`isPremium = false`), pero la lógica de bloqueo debe estar completa.

### Fuera de v1 (documentadas pero no comprometidas)
- Banderas sobre países visitados en el globo
- Nombres de países flotantes
- Collage de fotos al tocar un país
- Temas de color para el globo
- Avatares personalizados
- Estadísticas avanzadas
- Exportación de imágenes/videos
- Widgets
- Activación real de pagos (Apple/Google + RevenueCat)

## Comando arrancar: 
npx expo start --dev-client

## Cómo compilar y probar

### Web (no requiere EAS ni login):
```
npx expo start
```
Abre en el navegador. Google OAuth funciona directo en web.

### Móvil (requiere EAS Build):
Google OAuth en móvil NO funciona con Expo Go. Se necesita un development build (APK).

**Pasos para generar el APK:**
1. Instalar EAS CLI: `npm install -g eas-cli`
2. Loguearse: `eas login` (abre navegador, iniciar sesión con Google, cuenta: yellow26)
3. Compilar: `eas build --profile development --platform android`
   - Compila en la nube (5-10 min, puede ser más en free tier por cola)
   - Al terminar, da un link para descargar el APK
4. Instalar el APK en el celular Android
5. Arrancar el servidor de desarrollo: `npx expo start --dev-client`
6. Abrir la app Atlas en el celular — se conecta al servidor

**Si da error de proyecto no configurado:** correr `eas init` primero.

**Archivo requerido no incluido en git:** `.env.local` con estas 3 variables:
```
EXPO_PUBLIC_SUPABASE_URL=<url del proyecto Supabase>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key de Supabase>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Web Client ID de Google Cloud Console>
```
Los valores reales están en el `.env.local` de la máquina principal. Copiarlos manualmente.

**No se necesita recompilar el APK** cada vez que se cambia código JS — solo cuando se agregan/quitan paquetes nativos. El dev-client carga el código JS desde el servidor local.

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
- `photos` — id, user_id, country_code, storage_path, created_at + Supabase Storage bucket `photos` (público, RLS: owner insert/delete)
- `notes` — id, user_id, country_code (char 2), body (text), created_at, updated_at (múltiples notas por país, sin unique constraint)
- `achievements` — id, user_id, achievement_key, unlocked_at
- RLS activo en las 4 tablas: `user_id = auth.uid()`

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
