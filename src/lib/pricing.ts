/**
 * Precios del directorio.
 *
 * El precio por sesión no alcanza para comparar: hay sesiones de 45, 50 y 60
 * minutos, así que dos honorarios parecidos pueden valer cosas distintas. La
 * tarifa por hora los pone en la misma unidad. Se muestra como referencia junto
 * al precio real, nunca en lugar de él, porque lo que se paga es la sesión.
 */

/** Lleva el honorario de la sesión a su equivalente por hora. */
export function hourlyRate(fee: number | null, sessionMinutes: number): number | null {
  if (fee == null || sessionMinutes <= 0) return null;
  return Math.round((fee * 60) / sessionMinutes);
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Una moneda que Intl no reconozca no debería tumbar el listado.
    return `${currency} ${Math.round(amount).toLocaleString("es-AR")}`;
  }
}
