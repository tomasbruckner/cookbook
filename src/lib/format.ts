export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatServings(n: number): string {
  return n >= 1 && n <= 4 ? `${n} porce` : `${n} porcí`;
}
