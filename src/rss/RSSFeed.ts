import { XMLParser } from 'fast-xml-parser';
import type { RSS, Channel } from './RSS';

// Aqui pones himalaya y fast-xml
export default class RSSFeed {
  public errors: Error[] = [];
  public warnings: string[] = [];

  public content: string;
  public data: any;

  constructor(content: string) {
    this.content = content;
    const parser = new XMLParser();
    this.data = parser.parse(content);
  }

  async validate(): Promise<void> {
    if (!this.data.rss) {
      this.errors.push(new Error('rss missing at root level'));
      return;
    }

    if (!this.data.rss.channel) {
      this.errors.push(new Error('channel property missing in rss'));
      return;
    }
  }

  async build(): Promise<RSS> {
    const rss: RSS = {
      errors: [],
      warnings: [],
      channel: this.processChannel(this.data.rss.channel),
    };

    return rss;
  }

  private processChannel(channel: any): Channel {
    const { title } = channel;

    return {
      title,
    };
  }
}
