export function mnt(value: number): string {
  return new Intl.NumberFormat("mn-MN").format(Math.round(value)) + "₮";
}

export function jpy(value: number): string {
  return "¥" + new Intl.NumberFormat("ja-JP").format(Math.round(value));
}

export function kg(grams: number): string {
  return (grams / 1000).toFixed(1) + " кг";
}
