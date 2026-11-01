export function todayString() {
  return new Date().toLocaleDateString('en-CA');
}

export function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}
