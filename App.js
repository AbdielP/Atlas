import { View } from "react-native";
import WorldGlobe from "./src/components/WorldGlobe";
import { preloadCountryStates } from "./src/data/countryStore";

preloadCountryStates();

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <WorldGlobe />
    </View>
  );
}
