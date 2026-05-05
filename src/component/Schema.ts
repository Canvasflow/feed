export interface Thing {
  identifier?: string;
  url?: string;
  name?: string;
  description?: string;
}

export interface CreativeWork extends Thing {
  author?: Person | Organization | { '@id': string };
  thumbnail?: ImageObject;
  thumbnailUrl?: string;
}

export interface MediaObject extends CreativeWork {
  bitrate?: string;
  contentSize?: string;
  contentUrl?: string;
  embedUrl?: string;
}

export interface ImageObject extends MediaObject {
  caption?: MediaObject | string;
  embeddedTextCaption?: string;
  exifData?: string | PropertyValue;
  representativeOfPage?: boolean;
}

export interface Recipe extends CreativeWork {
  '@type': 'Recipe';
  '@id': string;
  datePublished?: string;
  image?: string | string[] | ImageObject;
  recipeYield?: string | string[] | QuantitativeValue;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeIngredient?: Array<string | ItemList | PropertyValue>;
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

export interface ListItem extends Thing {
  '@type':
    | 'HowToStep'
    | 'HowToSection'
    | 'HowToTip'
    | 'HowToDirection'
    | 'HowToItem';
  position?: number;
  numberOfItems?: number;
  text?: string;
  itemListElement?: Array<ListItem>;
}

export interface ItemList extends Thing {
  '@type': 'ItemList';
  name: string;
  itemListElement: Array<string | ListItem | PropertyValue>;
  itemListOrder?: string;
  numberOfItems?: number;
}

export interface PropertyValue extends Thing {
  '@type': 'PropertyValue';
  name: string;
  value: string | number | boolean;
  propertyID?: string;
  maxValue?: number;
  minValue?: number;
  unitCode?: string;
  unitText?: string;
}
