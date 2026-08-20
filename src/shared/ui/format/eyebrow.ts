/**
 * Substitutes the `{city}` slot of a hero eyebrow template with the browsed
 * city. Eyebrows are set in caps, so the name is uppercased.
 */
export function withCity(template: string, cityName: string): string {
  return template.replace('{city}', cityName.toUpperCase());
}
