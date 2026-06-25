import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import {
  type ComponentMapping,
  type LiveContainerMapping,
} from '../mapping/Mapping';
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
  isTextComponent,
  isImageComponent,
  isHTMLTableComponent,
  isButtonComponent,
} from '../Component';

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
      expect(recipeComponent.components[0].component).toBe('intro');
      expect(recipeComponent.components[1].component).toBe('body');
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
      expect(textComponent.component).toBe(mappings[0].component);
      expect(textComponent.properties).toEqual(mappings[0].properties);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Test</a>`
      );

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
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Test</a>`
      );

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
    'It should keep the text components wrapped in anchor tags',
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

      let textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank"><p>Example</p></a>`
      );

      textComponent = components[1] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Hello</a>`
      );

      textComponent = components[2] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Headline</a>`
      );
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
    filters: [{ type: 'class', items: ['live-blog'] }],
    post: {
      match: 'any',
      filters: [{ type: 'class', items: ['live-post'] }],
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
        filters: [{ type: 'class', items: ['wrapper'] }],
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
