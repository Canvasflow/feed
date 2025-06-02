import type { Component } from './Component';

export interface RSS {
  modules?: string[];
  channel: Channel;
  errors: Error[];
  warnings: string[];
}

export interface Channel {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  items: Item[];
  errors: Error[];
  warnings: string[];
}

export interface Item {
  title?: string;
  'content:encoded'?: string;
  category?: string[];
  guid?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  errors: Error[];
  warnings: string[];
  components: Component[];
}
