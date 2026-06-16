// Capa minima para proteger funciones Premium.
//
// Regla de arquitectura:
// - Lo Free no necesita pasar por aqui.
// - Todo feature Premium nuevo debe llamar requirePremium() antes de abrirse,
//   ejecutarse o guardar datos protegidos.
// - Por ahora no hay RevenueCat/backend, asi que isPremium() devuelve false.
//   Cuando exista una validacion real de compra, solo deberia cambiar esta
//   funcion, no cada feature Premium por separado.

export function isPremium() {
    return false;
}

export function requirePremium(onBlocked) {
    if (isPremium()) {
        return true;
    }

    onBlocked?.();

    return false;
}
