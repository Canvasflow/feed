export interface Component {
  id?: string;
  component: ComponentType;
  errors: Error[];
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
}

export interface ImageComponent extends Component {
  component: 'image';
  imageurl: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
}

export interface TextComponent extends Component {
  component: TextType;
  text: string;
}

export interface VideoComponent extends Component {
  url: string;
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
  | 'divider';

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
