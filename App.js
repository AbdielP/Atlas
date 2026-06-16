import AppNavigator from "./src/navigation/AppNavigator";
import { preloadCountryStates } from "./src/data/countryStore";

preloadCountryStates();

export default function App() {
  return <AppNavigator />;
}
