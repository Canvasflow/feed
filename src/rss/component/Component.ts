export type Component = ImageComponent | TextComponent;

export interface ImageComponent {
    imageurl: string;
}

export interface TextComponent {
    text: string;
}