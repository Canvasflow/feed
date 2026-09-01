import { parseHTML } from 'linkedom';

import type { Recipe } from '../component/schema/recipe-schema';
import { fetchUrl, type FetchOptions } from '../utils/http';

/**
 * Fetch `url` and extract the first LD+JSON `Recipe` found in a
 * `<script type="application/ld+json">` block (top-level or nested in
 * `@graph`). Malformed JSON-LD blocks are skipped rather than thrown, since a
 * page may carry multiple LD+JSON scripts and only one needs to parse.
 *
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<Recipe | null>}
 */
export async function getRecipeFromUrl(
  url: string,
  options: FetchOptions = {}
): Promise<Recipe | null> {
  const html = await fetchUrl(url, options);
  const { document } = parseHTML(html);
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );

  for (const element of scripts) {
    const content = element.textContent;
    if (!content) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }

    const recipe = findRecipe(parsed);
    if (recipe) {
      return recipe;
    }
  }

  return null;
}

function findRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const node = value as { '@type'?: unknown; '@graph'?: unknown };

  if (node['@type'] === 'Recipe') {
    return value as Recipe;
  }

  if (Array.isArray(node['@graph'])) {
    for (const item of node['@graph']) {
      if (item && typeof item === 'object' && item['@type'] === 'Recipe') {
        return item as Recipe;
      }
    }
  }

  return null;
}
