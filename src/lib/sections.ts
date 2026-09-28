export interface IngredientSplit {
  before: string;
  ingredients: string | null;
  after: string;
}

const FENCE = /^ {0,3}(```|~~~)/;
const H2 = /^ {0,3}##(?!#)[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;

/**
 * Rozdělí tělo receptu na část před `## Ingredience`, samotnou sekci (po další `##`)
 * a zbytek. Spojení tří částí je vždy přesně původní text.
 */
export function splitIngredients(body: string): IngredientSplit {
  const lines = body.split(/(?<=\n)/);
  let inFence = false;
  let start = -1;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r?\n$/, '');
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = H2.exec(line);
    if (!m) continue;
    if (start === -1) {
      if (m[1].trim().toLowerCase() === 'ingredience') start = i;
    } else {
      end = i;
      break;
    }
  }

  if (start === -1) return { before: body, ingredients: null, after: '' };
  return {
    before: lines.slice(0, start).join(''),
    ingredients: lines.slice(start, end).join(''),
    after: lines.slice(end).join(''),
  };
}
