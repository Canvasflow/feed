export interface Component {
  id?: string;
  component: ComponentType;
  errors: Error[];
  warnings: string[];
}

export interface GalleryComponent extends Component {
  component: 'gallery';
  role?: 'default' | 'mosaic';
  animation: 'fade' | 'slide' | 'cube' | 'coverflow' | 'flip';
  images: Array<GalleryImage>;
  caption?: { [key: string]: string } | string;
  direction: 'horizontal' | 'vertical';
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

// export interface ListsComponent extends Component {
//   component: 'body';
//   text: string;
// }

export interface TableComponent extends Component {
  component: 'table';
  headings: Array<any>;
  rows: Array<any>;
}

export interface VideoComponent extends Component {
  component: 'video';
  videourl: string;
  controlsenabled: 'on' | 'off';
  autoplay: 'on' | 'off';
  posterenabled: 'on' | 'off';
  movietype: 'hosted';
  aspectRatio: 'auto';
  imageurl?: string;
  cacheparam?: string;
  caption?: string;
  credit?: string;
}

export interface BlockquoteComponent extends Component {
  component: 'blockquote';
  text: string;
}

export interface TwitterComponent extends Component {
  component: 'twitter';
  height: string;
  fixedheight: 'on' | 'off';
  bleed: 'on' | 'off';
  tweetid: string;
  accountid: string;
}

export interface InstagramComponent extends Component {
  component: 'instagram';
  id: string;
  type: string;
}

export interface YoutubeComponent extends Component {
  component: 'video';
  vidtype: 'youtube';
  params: { id: string };
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
