# 🌍 Atlas

Registra los países que has visitado en un globo 3D interactivo, guarda fotos y notas de cada viaje y desbloquea logros a medida que exploras el mundo.

**🔗 Demo:** https://atlas-demo-beta-woad.vercel.app (inicia sesión con Google)

<!-- Agrega aquí una captura o GIF del globo:
![Atlas](docs/screenshot.png)
-->

## Funcionalidades

- **Globo 3D interactivo** — gira, haz zoom y toca un país para marcarlo como *visitado* o *deseado*.
- **Álbum de fotos por país** — sube fotos (comprimidas automáticamente) a la nube.
- **Notas de viaje** — crea, edita y elimina notas por país.
- **15 logros** — se desbloquean automáticamente según países y continentes visitados.
- **Estadísticas** — países visitados, porcentaje del mundo y continentes.
- **Ubicación GPS** — muestra tu posición actual en el globo.
- **Login con Google** — los datos se sincronizan entre web y móvil.

## Tecnologías

| Área | Stack |
|---|---|
| App | React Native + Expo (SDK 54), web y Android |
| 3D | three.js + @react-three/fiber |
| Backend | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| Auth | Google OAuth (web y nativo en Android) |
| Deploy | Vercel (web), EAS Build (Android) |

### Detalles técnicos

- **El globo nunca espera a la red:** los cambios se pintan al instante, se guardan localmente y se sincronizan con Supabase en segundo plano.
- **Seguridad:** cada usuario solo accede a sus datos mediante políticas RLS; en móvil la sesión se guarda cifrada (AES-256 + SecureStore).

## Ejecutar localmente

```bash
npm install
cp .env.example .env.local   # completar con tus credenciales de Supabase y Google
npx expo start               # presiona "w" para abrir en el navegador
```

Notas de desarrollo, estructura de la base de datos y build para Android: [`docs/DESARROLLO.md`](docs/DESARROLLO.md).
