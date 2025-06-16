import type { Component } from '../component/Component';

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
  'atom:link'?: {
    href?: string;
    rel?: string;
    type?: string;
  };
  'sy:updateFrequency'?: string;
  'sy:updatePeriod'?: string;
}

export interface Item {
  title?: string;
  'content:encoded'?: string;
  category?: string[];
  guid?: string;
  link?: string;
  description?: string;
  enclosure: Enclosure[];
  pubDate?: string;
  errors: Error[];
  warnings: string[];
  components: Component[];
}

export interface Enclosure {
  length: number;
  type: string;
  url: string;
}
