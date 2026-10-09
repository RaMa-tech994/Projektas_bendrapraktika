export function isValidRating(value: number): boolean { return Number.isInteger(value) && value >= 1 && value <= 10; }
export function validateListTitle(value: string): string | null { const title = value.trim(); return title.length < 1 ? 'Pavadinimas negali būti tuščias.' : title.length > 80 ? 'Pavadinimas negali viršyti 80 simbolių.' : null; }
export function isMovieStatus(value: string): value is 'planned' | 'watching' | 'watched' { return value === 'planned' || value === 'watching' || value === 'watched'; }
