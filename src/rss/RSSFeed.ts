import type { RSS } from './RSS';

// Aqui pones himalaya y fast-xml
export default class RSSFeed {
  public errors: Error[] = [];
  public warnings: string[] = [];

  public content: string;

  constructor(content: string) {
    this.content = content;
  }

  async validate(): Promise<void> {}

  async build(): Promise<RSS> {
    return {};
  }
}
