export interface Recipe {
  '@type': 'Recipe';
  '@id': string;
  name?: string;
  author?: Person | Organization | { '@id': string };
  description?: string;
  datePublished?: string;
  image?: string | string[];
  recipeYield?: string | string[] | QuantitativeValue;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<ListItem>;
  recipeCategory?: string[] | string;
  recipeCuisine?: string[] | string;
  keywords?: string;
  nutrition?: NutritionInformation;
  isPartOf?: { '@id': string };
  mainEntityOfPage?: string;
}

export interface Person {
  '@type': 'Person';
  name?: string;
  email?: string;
  url?: string;
  familyName?: string;
  givenName?: string;
}

export interface Organization {
  '@type': 'Organization';
  address?: string;
  email?: string;
  url?: string;
}

export interface QuantitativeValue {
  '@type': 'QuantitativeValue';
  minValue?: number;
  maxValue?: number;
  unitCode?: string;
  unitText?: string;
  value?: string | boolean | number;
  name?: string;
}

export interface NutritionInformation {
  '@type': 'NutritionInformation';
  calories?: string;
  carbohydrateContent?: string;
  cholesterolContent?: string;
  fatContent?: string;
  fiberContent?: string;
  proteinContent?: string;
  saturatedFatContent?: string;
  servingSize?: string;
  sodiumContent?: string;
  sugarContent?: string;
  transFatContent?: string;
  unsaturatedFatContent?: string;
}

export interface ListItem {
  '@type':
    | 'HowToStep'
    | 'HowToSection'
    | 'HowToTip'
    | 'HowToDirection'
    | 'HowToItem';
  position?: number;
  numberOfItems?: number;
  text?: string;
  name?: string;
  url?: string;
  itemListElement?: Array<ListItem>;
}
