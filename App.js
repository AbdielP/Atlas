import AppNavigator from "./src/navigation/AppNavigator";
import { preloadCountryStates, syncFromSupabase } from "./src/data/countryStore";
import { ensureAnonymousSession } from "./src/lib/auth";

// Pinta el globo con datos locales de inmediato
preloadCountryStates();

// En background: obtiene/crea sesión y luego carga desde Supabase
ensureAnonymousSession()
    .then(() => syncFromSupabase())
    .catch(() => {});

export default function App() {
    return <AppNavigator />;
}
