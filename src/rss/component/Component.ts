export type Component = ImageComponent | TextComponent | VideoComponent;

export interface ImageComponent {
  imageurl: string;
}

export interface TextComponent {
  text: string;
}

export interface VideoComponent {
  url: string;
}
