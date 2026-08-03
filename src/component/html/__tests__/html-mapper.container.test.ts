import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from '../html-mapper';
import {
  type ComponentMapping,
  type LiveContainerMapping,
} from '../../mapping/mapping';
import {
  toButton,
  toAnchorButton,
  toFigureContainer,
} from '../../mapping/mapping.container';
import {
  type ImageComponent,
  type TextComponent,
  type AudioComponent,
  type ButtonComponent,
  type RecipeComponent,
  type HTMLTableComponent,
  type ContainerComponent,
  type ColumnsComponent,
  type LiveContainerComponent,
  type LivePostComponent,
  type FigureContainerComponent,
  type GalleryComponent,
  isTextComponent,
  isImageComponent,
  isHTMLTableComponent,
  isButtonComponent,
} from '../../component';
import type { ElementNode } from '../../node/node-helpers';
import type { FeedIssue } from '../../../feed-issue';

function hasMessage(issues: readonly FeedIssue[], message: string): boolean {
  return issues.some((issue) => issue.message === message);
}

describe('Button component', () => {
  test(
    'It should create an button component from a tag',
    { tags: ['unit', 'html'] },
    () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<a
          href="${link}"
          role="button"
          rel="nofollow noopener"
          aria-label="${text}"
          target="_blank">
            ${text}
        </a>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    }
  );

  test(
    'It should create an button component from button tag',
    { tags: ['unit', 'html'] },
    () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<button>
          <a
            href="${link}"
            rel="nofollow noopener"
            aria-label="${text}"
            target="_blank">
              ${text}
          </a>
        </button>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    }
  );

  test(
    'It should create an button component from a tag with button as children',
    { tags: ['unit', 'html'] },
    () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<a
          href="${link}"
          rel="nofollow noopener"
          aria-label="${text}"
          target="_blank">
        <button>
          ${text}
        </button>
        </a>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    }
  );
});

describe('Recipe components', () => {
  test(
    'It should map recipe component from class attribute',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'recipe',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['recipe'],
            },
          ],
        },
      ];
      const content = `
        <div class="recipe top">
            <h4 class="text-lg hidden-xs">
              This is a large text
            </h4>
            <p>Subtitle</p>
        </div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const recipeComponent = components.pop() as RecipeComponent;
      expect(recipeComponent).toBeDefined();
      if (!recipeComponent) {
        return;
      }
      expect(recipeComponent.components[0]!.component).toBe('intro');
      expect(recipeComponent.components[1]!.component).toBe('body');
    }
  );
  test(
    'It should map empty recipe component',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'recipe',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['recipe'],
            },
          ],
        },
      ];
      const content = `
        <div class="recipe"></div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const recipeComponent = components.pop() as RecipeComponent;
      expect(recipeComponent).toBeDefined();
      if (!recipeComponent) {
        return;
      }
      expect(recipeComponent.components.length).toBe(0);
    }
  );
});

describe('Container components', () => {
  test(
    'It should map container component from class attribute',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-container'],
            },
          ],
        },
      ];
      const content = `
        <div class="cmc-container cmc-example">
            <h1>Test</h1>
        </div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const containerComponent = components.pop() as ContainerComponent;
      expect(containerComponent).toBeDefined();
      if (!containerComponent) {
        return;
      }
      expect(containerComponent.components.length).toBe(1);
    }
  );
  test(
    'It should map empty recipe component',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc'],
            },
          ],
        },
      ];
      const content = `
        <div class="cmc"></div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const containerComponent = components.pop() as ContainerComponent;
      expect(containerComponent).toBeDefined();
      if (!containerComponent) {
        return;
      }
      expect(containerComponent.components.length).toBe(0);
    }
  );
});

describe('Columns components', () => {
  test(
    'It should map columns component using classes',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-container'],
            },
          ],
        },
        {
          component: 'columns',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-columns'],
            },
          ],
          column: {
            match: 'any',
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['cmc-column'],
              },
            ],
          },
        },
      ];
      const content = `
        <article>
            <div class="cmc-columns">
                <div>
                    <div class="cmc-column">
                      <h1>Column 0</h1>
                    </div>
                </div>
                <div class="cmc-column">
                  Column 1
                </div>
                <div class="cmc-column">
                  <h2>Column 2</h2>
                </div>
                <div class="cmc-column">
                  <img src="example.jpg" alt="image in column 3"/>
                </div>
                <section>
                    <div>
                        <div class="cmc-column">
                          <h3>Column 4</h3>
                        </div>
                    </div>
                </section>
            </div>
        </article>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const columnsComponent = components[0] as ColumnsComponent;
      expect(columnsComponent).toBeDefined();
      if (!columnsComponent) {
        return;
      }
      expect(columnsComponent.columns.length).toBe(5);
    }
  );
});

describe('Live container components', () => {
  test(
    'It should map live container component using classes',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'live_container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['live-container'],
            },
          ],
          post: {
            match: 'any',
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['cmc-post'],
              },
            ],
          },
        },
      ];
      const content = `
        <article>
            <div id="id-example-container" class="live-container">
                <div>
                    <div class="cmc-post">
                      <h1>Column 0</h1>
                    </div>
                </div>
                <div class="cmc-post">
                  Column 1
                </div>
                <div class="cmc-post">
                  <h2>Column 2</h2>
                </div>
                <div class="cmc-post">
                  <img src="example.jpg" alt="image in column 3"/>
                </div>
                <section>
                    <div>
                        <div class="cmc-post">
                          <h3>Column 4</h3>
                        </div>
                    </div>
                </section>
            </div>
        </article>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const columnsComponent = components[0] as LiveContainerComponent;
      expect(columnsComponent).toBeDefined();
      if (!columnsComponent) {
        return;
      }
      expect(columnsComponent.posts.length).toBe(5);
    }
  );
});

describe('Link container components', () => {
  test(
    'It should use anchor tags to map container component',
    { tags: ['unit', 'html'] },
    () => {
      const properties = {
        isText: true,
      };
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text41',
          match: 'any',
          filters: [
            {
              type: 'tag',
              items: ['h1'],
            },
          ],
          properties,
        },
      ];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <div><h1>Test</h1></div>
          <img src="https://example.com/image.jpg"/>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);

      const textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.component).toBe(mappings[0]!.component);
      expect(textComponent.properties).toEqual(mappings[0]!.properties);
      // The anchor is recorded on `link` rather than wrapping the text.
      expect(textComponent.text).toBe('Test');
      expect(textComponent.link?.href).toBe(link);
      expect(textComponent.link?.element?.tag).toBe('a');

      const imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.link).toBe(link);
    }
  );

  test(
    'It should keep audio component that do not use links',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const src =
        'https://embed.podcasts.apple.com/us/podcast/all-bark-no-bite-the-reality-behind-dog-the-bounty-hunter/id1849068807?i=1000761154684';
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <div><h1>Test</h1></div>
          <img src="https://example.com/image.jpg"/>
          <iframe
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameborder="0"
            height="450"
            style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            src="${src}">
          </iframe>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);

      const textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe('Test');
      expect(textComponent.link?.href).toBe(link);

      const imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.link).toBe(link);

      const audioComponent = components[2] as AudioComponent;
      expect(audioComponent).toBeDefined();
      expect(audioComponent.component).toBe('audio');
      expect(audioComponent.url).toBe(src);
      expect(audioComponent.loop).toBe(false);
      expect(audioComponent.autoplay).toBe(true);
      expect(audioComponent.controls).toBe(false);
      expect(audioComponent.muted).toBe(false);
    }
  );

  test(
    'It should record the enclosing anchor on each text component link',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <p>Example</p>
          Hello
          <h1>Headline</h1>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);

      // Every child carries the same anchor on `link`; the text is untouched.
      for (const expected of ['<p>Example</p>', 'Hello', 'Headline']) {
        const textComponent = components.shift() as TextComponent;
        expect(isTextComponent(textComponent)).toBe(true);
        expect(textComponent.text).toBe(expected);
        expect(textComponent.link?.href).toBe(link);
        expect(textComponent.link?.element?.tag).toBe('a');
        expect(textComponent.link?.element?.attributes).toMatchObject({
          href: link,
          target: '_blank',
        });
      }
    }
  );

  test(
    'It should keep the button component wrapped in anchor tags',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <button>View</button>
        </a>`;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);

      let buttonComponent = components[0] as ButtonComponent;
      expect(isButtonComponent(buttonComponent)).toBe(true);
      expect(buttonComponent.link).toBe(link);
    }
  );
});

describe('Figure container component', () => {
  test(
    'It should use figure tag to map figure container component',
    { tags: ['unit', 'html'] },
    () => {
      const caption = 'Example image';
      const tableContent = '<table><thead></thead><tbody></tbody></table>';
      const imagesUrls = [
        'https://example.com/image-1.jpg',
        'https://example.com/image-2.jpg',
      ];
      const content = `
        <figure>
          <img src="${imagesUrls[0]}"/>
          <div><img src="${imagesUrls[1]}"/></div>
          ${tableContent}
          <figcaption>${caption}</figcaption>
        </figure>
      `;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(3);

      let imageComponent = components[0] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[0]);
      expect(imageComponent.caption).toBe(caption);

      imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[1]);
      expect(imageComponent.caption).toBe(caption);

      const htmlTable = components[2] as HTMLTableComponent;
      expect(isHTMLTableComponent(htmlTable)).toBe(true);
      expect(htmlTable.html).toBe(tableContent);
      expect(htmlTable.caption).toBe(caption);
    }
  );
  test(
    'It should use figure tag to map figure container component and ignore invalid components',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const caption = 'Example image';
      const imagesUrls = [
        'https://example.com/image-1.jpg',
        'https://example.com/image-2.jpg',
      ];
      const content = `
        <figure>
          <img src="${imagesUrls[0]}"/>
          <img src="${imagesUrls[1]}"/>
          <h1>Headline</h1>
          <figcaption>Example image</figcaption>
        </figure>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);

      let imageComponent = components[0] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[0]);
      expect(imageComponent.caption).toBe(caption);

      imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[1]);
      expect(imageComponent.caption).toBe(caption);
    }
  );
});

describe('Live container component', () => {
  const liveMapping: LiveContainerMapping = {
    component: 'live_container',
    match: 'any',
    filters: [{ type: 'class', match: 'any', items: ['live-blog'] }],
    post: {
      match: 'any',
      filters: [{ type: 'class', match: 'any', items: ['live-post'] }],
    },
  };
  const params = { mappings: [liveMapping] };

  test(
    'toLiveContainer produces a live_container with mapped posts',
    { tags: ['unit', 'html'] },
    () => {
      const html = `
        <div class="live-blog">
          <article class="live-post" id="post-1"><p>First</p></article>
          <article class="live-post" id="post-2"><p>Second</p></article>
        </div>`;
      const components = HTMLMapper.toComponents(html, params);
      expect(components).toHaveLength(1);
      const container = components[0] as LiveContainerComponent;
      expect(container.component).toBe('live_container');
      expect(container.posts).toHaveLength(2);
      expect(container.errors).toHaveLength(0);
    }
  );

  test(
    'toLiveContainer with zero matching posts records an error',
    { tags: ['unit', 'html'] },
    () => {
      const html = `<div class="live-blog"><p>no posts here</p></div>`;
      const components = HTMLMapper.toComponents(html, params);
      expect(components).toHaveLength(1);
      const container = components[0] as LiveContainerComponent;
      expect(container.component).toBe('live_container');
      expect(container.posts).toHaveLength(0);
      expect(container.errors.length).toBeGreaterThan(0);
    }
  );

  test(
    'mapLivePost maps id, components, and errors per post',
    { tags: ['unit', 'html'] },
    () => {
      const html = `
        <div class="live-blog">
          <article class="live-post" id="entry-42">
            <h2>Post title</h2>
            <p>Body text</p>
          </article>
        </div>`;
      const components = HTMLMapper.toComponents(html, params);
      const container = components[0] as LiveContainerComponent;
      const post = container.posts[0] as LivePostComponent;
      expect(post.component).toBe('live_post');
      expect(post.id).toBe('entry-42');
      expect(post.components.length).toBeGreaterThan(0);
      expect(post.errors).toHaveLength(0);
    }
  );

  test(
    'mapLivePost records an error when the post has no components',
    { tags: ['unit', 'html'] },
    () => {
      const html = `
        <div class="live-blog">
          <article class="live-post"></article>
        </div>`;
      const components = HTMLMapper.toComponents(html, params);
      const container = components[0] as LiveContainerComponent;
      const post = container.posts[0] as LivePostComponent;
      expect(post.errors.length).toBeGreaterThan(0);
    }
  );

  test(
    'live container nested inside a regular container is mapped correctly',
    { tags: ['unit', 'html'] },
    () => {
      const containerMapping: ComponentMapping = {
        component: 'container',
        match: 'any',
        filters: [{ type: 'class', match: 'any', items: ['wrapper'] }],
      };
      const nestedParams = { mappings: [containerMapping, liveMapping] };
      const html = `
        <div class="wrapper">
          <div class="live-blog">
            <article class="live-post" id="p1"><p>Post</p></article>
          </div>
        </div>`;
      const components = HTMLMapper.toComponents(html, nestedParams);
      expect(components).toHaveLength(1);
      const outer = components[0] as ContainerComponent;
      expect(outer.component).toBe('container');
      const inner = outer.components[0] as LiveContainerComponent;
      expect(inner.component).toBe('live_container');
      expect(inner.posts).toHaveLength(1);
    }
  );
});

// ─── Button builder edge cases (direct calls) ────────────────────────────────

describe('Button builder edge cases', () => {
  const tags = { tags: ['unit', 'html'] };
  const el = (
    tagName: string,
    children: ElementNode['children'] = [],
    attrs?: { key: string; value: string }[]
  ): ElementNode => ({
    type: 'element',
    tagName,
    children,
    attributes: attrs,
  });
  const text = (content: string) => ({ type: 'text' as const, content });

  test('toButton flags an invalid implementation', tags, () => {
    const c = toButton(el('div'));
    expect(hasMessage(c.errors, 'invalid button implementation')).toBe(true);
  });

  test('toButton flags a button>a without text', tags, () => {
    const node = el('button', [
      el('a', [], [{ key: 'href', value: 'https://example.com' }]),
    ]);
    const c = toButton(node);
    expect(hasMessage(c.errors, 'Button text is required')).toBe(true);
    expect(c.link).toBe('https://example.com');
  });

  test('toButton flags a button>a without href', tags, () => {
    const node = el('button', [el('a', [text('Click')])]);
    const c = toButton(node);
    expect(
      hasMessage(c.errors, 'href attribute is required in a button link')
    ).toBe(true);
  });

  test('toButton warns when a bare button has no link', tags, () => {
    const node = el('button', [text('Press me')]);
    const c = toButton(node);
    expect(c.warnings.length).toBeGreaterThan(0);
    expect(c.text).toBe('Press me');
  });

  test('toAnchorButton flags a missing button text', tags, () => {
    const node = el(
      'a',
      [el('button')],
      [{ key: 'href', value: 'https://example.com' }]
    );
    const c = toAnchorButton(node);
    expect(hasMessage(c.errors, 'Button text is required')).toBe(true);
  });

  test('toAnchorButton flags a missing link', tags, () => {
    const node = el('a', [el('button', [text('Go')])]);
    const c = toAnchorButton(node);
    expect(hasMessage(c.errors, 'Button link is required')).toBe(true);
  });
});

// ─── Container / columns / live empty paths (through HTMLMapper) ─────────────

describe('Container/columns/live empty paths', () => {
  const tags = { tags: ['unit', 'html'] };

  test('columns mapping with no columns records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'columns',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['cmc-columns'] }],
        column: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-column'] }],
        },
      },
    ];
    const content = `<article><div class="cmc-columns">no columns here</div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    expect(
      hasMessage(component!.errors, 'HTML node do not have children')
    ).toBe(true);
  });

  test('live container mapping with no posts records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'live_container',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['live-container'] }],
        post: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-post'] }],
        },
      },
    ];
    const content = `<article><div class="live-container">no posts</div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    expect(
      hasMessage(component!.errors, 'HTML node do not have children')
    ).toBe(true);
  });

  test('live post with no components records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'live_container',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['live-container'] }],
        post: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-post'] }],
        },
      },
    ];
    const content = `<article><div class="live-container"><div class="cmc-post"></div></div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    const live = component as unknown as {
      posts: Array<{ errors: FeedIssue[] }>;
    };
    expect(
      hasMessage(live.posts[0]!.errors, 'post do not have components')
    ).toBe(true);
  });

  test('container mapping still builds with only text content', tags, () => {
    const containerMapping: ComponentMapping = {
      component: 'container',
      match: 'all',
      filters: [{ type: 'class', match: 'any', items: ['cmc-container'] }],
    };
    const content = `<article><div class="cmc-container">just text</div></article>`;
    const components = HTMLMapper.toComponents(content, {
      mappings: [containerMapping],
    });
    expect(components.length).toBeGreaterThan(0);
  });

  test('gallery mapping with no image slides records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'gallery',
        match: 'any',
        filters: [{ type: 'class', match: 'any', items: ['gal'] }],
        slide: {
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['slide'] }],
        },
      },
    ];
    const content = `<div class="gal"><div class="slide"><h2>not an image</h2></div></div>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    const gallery = component as GalleryComponent;
    expect(hasMessage(gallery.errors, 'slides not found in the gallery')).toBe(
      true
    );
  });
});

// ─── Link container reduce paths (through HTMLMapper) ────────────────────────

describe('Link container reduce paths', () => {
  const tags = { tags: ['unit', 'html'] };

  test(
    'records the anchor and its attributes on a text component link',
    tags,
    () => {
      const link = 'https://example.org';
      const content = `<a href="${link}" target="_blank"><div><h1>Heading</h1></div></a>`;
      const [component] = HTMLMapper.toComponents(content, { mappings: [] });
      const textComponent = component as TextComponent;
      expect(textComponent.text).toBe('Heading');
      expect(textComponent.link?.href).toBe(link);
      expect(textComponent.link?.element).toEqual({
        tag: 'a',
        attributes: { href: link, target: '_blank' },
      });
    }
  );

  test('applies the link to a wrapped image component', tags, () => {
    const content = `<a href="https://example.org" target="_blank"><div><h1>x</h1></div><img src="a.jpg" /></a>`;
    const components = HTMLMapper.toComponents(content, { mappings: [] });
    const image = components.find((c) => 'imageurl' in c) as ImageComponent;
    expect(image.link).toBe('https://example.org');
  });

  test(
    'applies the link to a wrapped button without its own link',
    tags,
    () => {
      const content = `<a href="https://example.org" target="_blank"><div><h1>x</h1></div><div><button>Press</button></div></a>`;
      const components = HTMLMapper.toComponents(content, { mappings: [] });
      const button = components.find((c) => isButtonComponent(c)) as
        | ButtonComponent
        | undefined;
      expect(button).toBeDefined();
      expect(button?.link).toBe('https://example.org');
    }
  );
});

// ─── toFigureContainer direct paths ─────────────────────────────────────────

describe('toFigureContainer direct paths', () => {
  const tags = { tags: ['unit', 'html'] };
  const el = (
    tagName: string,
    children: ElementNode['children'] = [],
    attrs: { key: string; value: string }[] = []
  ): ElementNode => ({
    type: 'element',
    tagName,
    children,
    attributes: attrs,
  });
  const text = (content: string) => ({ type: 'text' as const, content });

  test('extracts credit from class-credit node inside figcaption', tags, () => {
    const node = el('figure', [
      el('img', [], [{ key: 'src', value: 'a.jpg' }]),
      el('figcaption', [
        el('div', [text('Caption text')]),
        el('div', [text('Credit text')], [{ key: 'class', value: 'credit' }]),
      ]),
    ]);
    const c = toFigureContainer(node) as FigureContainerComponent;
    expect(c.credit).toContain('Credit text');
    expect(c.caption).not.toContain('Credit text');
  });

  test('extracts credit from class-credit sibling of figcaption', tags, () => {
    const node = el('figure', [
      el('img', [], [{ key: 'src', value: 'a.jpg' }]),
      el('figcaption', [el('div', [text('Caption text')])]),
      el('div', [text('Sibling credit')], [{ key: 'class', value: 'credit' }]),
    ]);
    const c = toFigureContainer(node) as FigureContainerComponent;
    expect(c.credit).toContain('Sibling credit');
  });

  test(
    'credit nested deeper than direct figcaption child is stripped',
    tags,
    () => {
      const node = el('figure', [
        el('img', [], [{ key: 'src', value: 'a.jpg' }]),
        el('figcaption', [
          el('div', [
            el('span', [text('Caption')]),
            el(
              'div',
              [text('Deep credit')],
              [{ key: 'class', value: 'credit' }]
            ),
          ]),
        ]),
      ]);
      const c = toFigureContainer(node) as FigureContainerComponent;
      expect(c.credit).toContain('Deep credit');
      expect(c.caption).not.toContain('Deep credit');
    }
  );
});
