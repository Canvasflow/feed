export interface Component {
  id?: string;
  component: ComponentType;
  errors: string[];
  warnings: string[];
}

export interface GalleryComponent extends Component {
  component: 'gallery';
  role?: 'default' | 'mosaic';
  animation?: 'fade' | 'slide' | 'cube' | 'coverflow' | 'flip';
  images: Array<GalleryImage>;
  caption?: { [key: string]: string } | string;
  direction?: 'horizontal' | 'vertical';
}

export interface GalleryImage {
  imageurl: string;
  caption?: string;
  link?: string;
  alt?: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface ImageComponent extends Component {
  component: 'image';
  imageurl: string;
  link?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface TextComponent extends Component {
  component: TextType;
  text: string;
}

export interface HTMLTableComponent extends Component {
  component: 'htmltable';
  html: string;
}

export interface VideoComponent extends Component {
  component: 'video';
  url?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  movietype?: 'hosted';
  poster?: string;
  caption?: string;
  credit?: string;
}

export interface RecipeComponent extends Component {
  component: 'recipe';
  recipe?: Recipe;
  url?: string;
  components: Array<Component>;
}

export interface Recipe {
  '@type': 'Recipe';
  name?: string;
  author?: { '@id': string };
  description?: string;
  datePublished?: string;
  image?: string | string[];
  recipeYield?: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<{
    '@type': 'HowToStep';
    text: string;
    name: string;
    url: string;
  }>;
  recipeCategory?: string[];
  recipeCuisine?: string[];
  keywords?: string;
  nutrition?: {
    '@type': 'NutritionInformation';
    servingSize?: string;
    calories?: string;

    carbohydrateContent?: string;
    proteinContent?: string;
    fatContent?: string;
    saturatedFatContent?: string;
    transFatContent?: string;
    sodiumContent?: string;
    fiberContent?: string;
    sugarContent?: string;
    unsaturatedFatContent?: string;
  };
  '@id': string;
  isPartOf?: { '@id': string };
  mainEntityOfPage?: string;
}

export interface ButtonComponent extends Component {
  component: 'button';
  text?: string;
  link?: string;
}

export interface AudioComponent extends Component {
  component: 'audio';
  url: string;
  controls: boolean;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  caption?: string;
  credit?: string;
}

export interface TwitterComponent extends Component {
  component: 'twitter';
  height: string;
  fixedheight: 'on' | 'off';
  bleed: 'on' | 'off';
  params: {
    id?: string;
    account?: string;
  };
}

export interface InstagramComponent extends Component {
  component: 'instagram';
  id: string;
  type: 'post' | 'reel' | 'tv';
}

export interface YoutubeComponent extends VideoComponent {
  vidtype: 'youtube';
  params: { id: string };
}

export interface TikTokComponent extends VideoComponent {
  vidtype: 'tiktok';
  params: { id: string; username: string };
}

export interface InfogramComponent extends Component {
  component: 'infogram';
  params: { id: string; parentUrl: string; src: 'embed' };
}

export interface SpacerComponent extends Component {
  component: 'spacer';
  margin: `margin-${1 | 20 | 50 | 75 | 100}`;
}

export type ComponentType =
  | TextType
  | 'image'
  | 'gallery'
  | 'map'
  | 'video'
  | 'audio'
  | 'button'
  | 'anchor'
  | 'advert'
  | 'custom'
  | 'twitter'
  | 'infogram'
  | 'instagram'
  | 'table'
  | 'tiktok'
  | 'columns'
  | 'container'
  | 'spacer'
  | 'divider'
  | 'htmltable'
  | 'recipe';

export type TextType =
  | 'headline'
  | 'title'
  | 'subtitle'
  | 'intro'
  | 'body'
  | 'crosshead'
  | 'byline'
  | 'blockquote'
  | 'footer'
  | 'imagecaption'
  | `text${TextRange}`;

const validRoleType = new Set([
  'headline',
  'title',
  'subtitle',
  'intro',
  'body',
  'crosshead',
  'byline',
  'blockquote',
  'footer',
  'imagecaption',
]);
for (let i = 1; i <= 60; i++) {
  validRoleType.add(`text${i}`);
}

export function isValidTextRole(role: string): boolean {
  return validRoleType.has(role);
}

export type TextRange = NumericRange<CreateArrayWithLengthX<1>, 61>;

type CreateArrayWithLengthX<
  LENGTH extends number,
  ACC extends unknown[] = [],
> = ACC['length'] extends LENGTH
  ? ACC
  : CreateArrayWithLengthX<LENGTH, [...ACC, 1]>;

type NumericRange<
  START_ARR extends number[],
  END extends number,
  ACC extends number = never,
> = START_ARR['length'] extends END
  ? ACC | END
  : NumericRange<[...START_ARR, 1], END, ACC | START_ARR['length']>;
