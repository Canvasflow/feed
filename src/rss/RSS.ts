export interface RSS {
  modules?: string[];
  channels?: Channel[];
}

export interface Channel {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  items?: Item[];
}

export interface Item {
  title?: string;
}
