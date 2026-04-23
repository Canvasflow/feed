import type { Recipe } from './Schema';

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

export interface Component {
  id?: string;
  component: ComponentType;
  properties?: Record<string, unknown>;
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

export function isGalleryComponent(
  object: unknown
): object is GalleryComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'gallery'
  );
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

export function isImageComponent(object: unknown): object is ImageComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    typeof potential.imageurl === 'string' &&
    potential.component === 'image'
  );
}

export interface TextComponent extends Component {
  component: TextType;
  text: string;
}

export function isValidTextRole(role: string): boolean {
  return validRoleType.has(role);
}

export function isTextComponent(object: unknown): object is TextComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    typeof potential.text === 'string' &&
    typeof potential.component === 'string' &&
    isValidTextRole(potential.component)
  );
}

export interface HTMLTableComponent extends Component {
  component: 'htmltable';
  html: string;
  caption?: string;
  credit?: string;
}

export function isHTMLTableComponent(
  object: unknown
): object is HTMLTableComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'htmltable' &&
    typeof potential.html === 'string'
  );
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

export function isVideoComponent(object: unknown): object is VideoComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'video'
  );
}

export interface YoutubeComponent extends VideoComponent {
  vidtype: 'youtube';
  params: { id: string };
}

export function isYoutubeComponent(
  object: unknown
): object is YoutubeComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'youtube'
  );
}

export interface VimeoComponent extends VideoComponent {
  vidtype: 'vimeo';
  params: { id: string };
}

export function isVimeoComponent(object: unknown): object is VimeoComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'vimeo'
  );
}

export interface DailymotionComponent extends VideoComponent {
  vidtype: 'dailymotion';
  params: { id: string };
}

export function isDailymotionComponent(
  object: unknown
): object is DailymotionComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'dailymotion'
  );
}

export interface TikTokComponent extends VideoComponent {
  vidtype: 'tiktok';
  params: { id: string; username: string };
}

export function isTikTokComponent(object: unknown): object is TikTokComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'tiktok'
  );
}

export interface RecipeComponent extends Component {
  component: 'recipe';
  recipe?: Recipe;
  url?: string;
  components: Array<Component>;
}

export function isRecipeComponent(object: unknown): object is RecipeComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'recipe'
  );
}

export interface ContainerComponent extends Component {
  type?: 'link' | 'figure';
  component: 'container';
  components: Array<Component>;
}

export function isContainerComponent(
  object: unknown
): object is ContainerComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'container'
  );
}

export interface LinkContainerComponent extends ContainerComponent {
  type: 'link';
  link?: string;
  attributes?: Map<string, string>;
}

export function isLinkContainerComponent(
  object: unknown
): object is LinkContainerComponent {
  const potential = object as Record<string, unknown>;
  const isValid =
    typeof object === 'object' &&
    object !== null &&
    potential.type === 'link' &&
    potential.component === 'container';
  return isValid;
}

export interface FigureContainerComponent extends ContainerComponent {
  type: 'figure';
  caption?: string;
  credit?: string;
}

export function isFigureContainerComponent(
  object: unknown
): object is FigureContainerComponent {
  const potential = object as Record<string, unknown>;
  const isValid =
    typeof object === 'object' &&
    object !== null &&
    potential.type === 'figure' &&
    potential.component === 'container';
  return isValid;
}

export interface ButtonComponent extends Component {
  component: 'button';
  text?: string;
  link?: string;
}

export function isButtonComponent(object: unknown): object is ButtonComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'button'
  );
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

export function isAudioComponent(object: unknown): object is AudioComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'audio'
  );
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

export function isTwitterComponent(
  object: unknown
): object is TwitterComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'twitter'
  );
}

export interface InstagramComponent extends Component {
  component: 'instagram';
  id: string;
  type: 'post' | 'reel' | 'tv';
}

export function isInstagramComponent(
  object: unknown
): object is InstagramComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'instagram'
  );
}

export interface InfogramComponent extends Component {
  component: 'infogram';
  params: { id: string; parentUrl: string; src: 'embed' };
}

export function isInfogramComponent(
  object: unknown
): object is InfogramComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'infogram'
  );
}

export interface SpacerComponent extends Component {
  component: 'spacer';
  margin: `margin-${1 | 20 | 50 | 75 | 100}`;
}

export function isSpacerComponent(object: unknown): object is SpacerComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'spacer'
  );
}

export interface CustomComponent extends Component {
  component: 'custom';
  content: string;
}

export function isCustomComponent(object: unknown): object is CustomComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'custom'
  );
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
