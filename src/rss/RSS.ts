export interface RSS {
  modules?: string[];
  channel?: Channel;
  errors?: Error[];
  warnings?: string[];
}

export interface Channel {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  items?: Item[];
  errors?: Error[];
  warnings?: string[];
}

export interface Item {
  title?: string;
  errors?: Error[];
  warnings?: string[];
}
