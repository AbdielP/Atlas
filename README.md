# TODO

## Pendientes generales
- [x] Supabase: crear tablas (visited_countries, photos, achievements) + RLS
- [ ] Supabase: activar Google OAuth
- [x] Instalar `@supabase/supabase-js` y crear cliente (`src/lib/supabase.js`) con sesión cifrada (LargeSecureStore + AES-256)
- [x] Guardar URL y publishable key en `.env.local` (gitignoreado)
- [ ] Pantalla de Login con Google
- [x] Conectar `countryStore` a Supabase (fire-and-forget, sin bloquear el globo)
- [ ] Pantalla de Detalle: tab Fotos (álbum real con expo-image-picker)
- [ ] Pantalla de Detalle: tab Notas (texto libre, guardado en Supabase)
- [ ] Pantalla de Detalle: tab Logros (filtrados por país/continente)
- [ ] Logros: lógica real (evaluar countryStates, desbloquear automático)
- [ ] Estadísticas flotantes en el globo (visibles solo en zoom mínimo)
- [ ] GPS: marcador de ubicación actual con expo-location
- [ ] Perfil: mostrar datos reales del usuario autenticado
- [ ] Paywall modal (límite de fotos Free → Premium) Pwk1U6iticN9v8bN

---

## ▶ Próximo paso recomendado: Google OAuth + Login screen

**Por qué es lo más urgente:**
La auth anónima actual es temporal — si el usuario desinstala la app, pierde todos sus datos. Sin una cuenta real, el Perfil no puede mostrar nombre ni foto, y la app no puede sincronizarse entre dispositivos de forma confiable.

**Qué implica:**
1. Activar Google OAuth en Supabase (Authentication → Providers → Google)
2. Registrar la app en Google Cloud Console para obtener client ID
3. Instalar `expo-auth-session` y configurar el deep link en `app.json`
4. Crear pantalla de Onboarding con botón "Continuar con Google"
5. Modificar `AppNavigator` para mostrar Login si no hay sesión, Tabs si hay sesión
6. Migrar datos de la sesión anónima a la cuenta Google al vincularlas (Supabase soporta esto nativamente con `linkIdentity`)

**Después de Google OAuth, el orden lógico sería:**
- Logros (sin dependencias externas, usa los datos que ya se sincronizan)
- Tab Notas (Supabase ya está listo, es solo UI + un query)
- Tab Fotos (requiere expo-image-picker + Supabase Storage)
- Estadísticas en el globo
- GPS

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
- Auth actual: anónima (temporal) — reemplazar con Google OAuth
- Sesión cifrada en dispositivo con AES-256 + expo-secure-store (LargeSecureStore)
- Credenciales en `.env.local` (nunca en git)

---

## Estrategia de rendimiento (el globo nunca espera IO)

Flujo al marcar un país:
1. **Inmediato** — actualizar estado en memoria + color en Three.js
2. **Async no bloqueante** — escribir en AsyncStorage
3. **Background, fire-and-forget** — upsert a Supabase sin await

Al arrancar la app:
1. Leer AsyncStorage → pintar el globo de inmediato
2. Obtener sesión en background → fetch Supabase → reconciliar y repintar
