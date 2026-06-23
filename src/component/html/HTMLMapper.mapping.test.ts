import { join } from 'path';
import { readFileSync } from 'fs';
import { test, expect, describe, beforeEach } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import {
  type ComponentMapping,
  type Mapping,
  isValidParams,
  isValidMapping,
} from '../mapping/Mapping';
import { type TextComponent, type ContainerComponent } from '../Component';

describe('Mapping', () => {
  test(
    'It should map components using match any with filters any',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'headline',
          match: 'any',
          filters: [
            {
              type: 'tag',
              items: ['h2'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['text-md'],
            },
          ],
        },
        {
          component: 'title',
          match: 'all',
          filters: [
            {
              type: 'attribute',
              key: 'id',
              value: 'title',
            },
          ],
        },
        {
          component: 'text48',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['text-lg'],
            },
          ],
        },
        {
          component: 'subtitle',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['sub-sm'],
            },
          ],
        },
      ];
      const content = `
        <h2>This is a headline</h2>
        <h4 class="text-lg hidden-xs">
          This is a large text
        </h4>
        <p class="sub-sm">Subtitle</p>
        <p class="text-md">Headline</p>
        <h5 id="title">This is a title component</h5>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(5);
      expect(components[0].component).toBe('headline');
      expect(components[1].component).toBe('text48');
      expect(components[2].component).toBe('subtitle');
      expect(components[3].component).toBe('headline');
      expect(components[4].component).toBe('title');
    }
  );

  test(
    'It should map components using match any with filters all',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text33',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['top', 'head'],
            },
          ],
        },
        {
          component: 'text35',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['heading', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="head top primary">Text example</p>
        <p class="heading primary">Text example</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);
      expect(components[0].component).toBe('text33');
      expect(components[1].component).toBe('body');
    }
  );

  test(
    'It should map components using match any with filters equal',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text36',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="story head">Text example</p>
        <p class="head story headline">Text example</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);
      expect(components[0].component).toBe('text36');
      expect(components[1].component).toBe('body');
    }
  );

  test(
    'It should map components using match all with filters any',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text48',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['h2'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['text-lg'],
            },
          ],
        },
        {
          component: 'subtitle',
          match: 'all',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['sub-sm'],
            },
          ],
        },
      ];
      const content = `
        <h2 class="text-lg hidden-xs">
          This is a large text
        </h2>
        <h2>
          This is a large text
        </h2>
        <p class="sub-sm">Subtitle</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('text48');
      expect(components[1].component).toBe('title');
      expect(components[2].component).toBe('subtitle');
    }
  );

  test(
    'It should map components using match all with filters all',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text33',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['h3', 'h2'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['top', 'head'],
            },
          ],
        },
        {
          component: 'text35',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p', 'ol'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['heading', 'story'],
            },
          ],
        },
      ];
      const content = `
        <h3 class="head top primary">Text example</h3>
        <h2 class="head top primary">Text example</h2>
        <h2>Text example</h2>
        <p class="heading story">Text example</p>
        <p class="heading top">Text example</p>
        <ol class="heading story">
          <li>Item 1</li>
        </ol>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(6);
      expect(components[0].component).toBe('text33');
      expect(components[1].component).toBe('text33');
      expect(components[2].component).toBe('title');
      expect(components[3].component).toBe('text35');
      expect(components[4].component).toBe('body');
      expect(components[5].component).toBe('text35');
    }
  );

  test(
    'It should map components using match all with filters equal',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text36',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p'],
            },
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="head story">Text example</p>
        <h1 class="head story headline">Text <span class="teasdsaasdasd">example</span></h1>
        <h3 class="head story">Text example</h3>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('text36');
      expect(components[1].component).toBe('headline');
      expect(components[2].component).toBe('subtitle');
    }
  );

  test(
    'It should map components with match all filters with properties',
    { tags: ['unit', 'html'] },
    () => {
      const properties = {
        styles: [1233, 1111],
        targetElement: '1-col',
      };
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
          properties,
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
      expect(containerComponent.properties).toBe(properties);
    }
  );

  test(
    'It should exclude components based on tags',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['section'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
      ];
      const content = `
        <main>
          <script>console.log('hello world')</script>
          <section>
            <h1>This is a headline that shouldn't show</h1>
          </section>
          <div>
            <p>This text is a body</p>
          </div>
          <footer>
            <p>This text should be displayed</p>
          </footer>
        </main>
      `;
      const components = HTMLMapper.toComponents(content, { excludes });
      expect(components.length).toBe(2);
      const textComponent = components.shift() as TextComponent;
      expect(textComponent).toBeDefined();
      expect(textComponent.component).toBe('body');
    }
  );

  test(
    'It should exclude components based on tags and class',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['section'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['excluded'],
            },
          ],
        },
      ];
      const content = `
        <main>
          <script>console.log('hello world')</script>
          <section>
            <h1>This is a headline that shouldn't show</h1>
          </section>
          <div class="excluded">
            <p>This text is a body</p>
          </div>
          <footer>
            <p>This text should be displayed</p>
          </footer>
        </main>
      `;
      const components = HTMLMapper.toComponents(content, { excludes });
      expect(components.length).toBe(1);
      const textComponent = components.shift() as TextComponent;
      expect(textComponent).toBeDefined();
      expect(textComponent.component).toBe('footer');
    }
  );

  describe('Validation', { tags: ['unit', 'html'] }, () => {
    test('It should return a valid mapping', { tags: ['unit', 'html'] }, () => {
      const mappings = [
        {
          component: 'text36',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p'],
            },
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const excludes = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p'],
            },
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const isValid = isValidParams({
        mappings,
        excludes,
      });
      expect(isValid).toBe(true);
    });

    test(
      'It should throw an invalid null mapping',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = [null];
        const isValid = isValidParams({
          mappings,
        });
        expect(isValid).toBe(false);
      }
    );

    test(
      'It should return that a root mapping is valid',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = {
          match: 'all',
          component: 'body',
          filters: [
            {
              type: 'tag',
              items: ['p'],
            },
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        };
        const isValid = isValidMapping(mappings);
        expect(isValid).toBe(false);
      }
    );

    test(
      'It should throw an invalid null root mapping',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = [{ hello: 'world' }];
        const isValid = isValidMapping({
          mappings,
        });
        expect(isValid).toBe(false);
      }
    );
  });
});

describe('HTML Articles', () => {
  let htmlDirPath: string = '';

  beforeEach(() => {
    htmlDirPath = join(`${process.env.SUPPORT_PATH}`, 'html');
  });

  test(
    `New Apple Intelligence and Siri confirmed by... Google`,
    { tags: ['html', 'unit'] },
    async () => {
      const htmlFilePath = join(
        htmlDirPath,
        `new-apple-intelligence-and-siri-confirmed-by-google.html`
      );
      const htmlContent = readFileSync(htmlFilePath, 'utf-8');
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            value: 'article-body',
          },
        ],
      };

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
              items: ['fancy-box', 'hawk-multi-model-review-container'],
            },
          ],
          properties: {
            is1Col: true,
            styles: [29916],
          },
        },
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['1aside'],
            },
          ],
          properties: {
            is1Col: true,
            styles: [29916],
          },
        },
      ];

      const excludes: Mapping[] = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'attribute',
              key: 'data-component-name',
              value: 'Recirculation:ArticleRiver',
            },
            {
              type: 'attribute',
              key: 'data-component-name',
              value: 'Viafoura:Comments',
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'attribute',
              key: 'id',
              value: 'utility-bar',
            },
            {
              type: 'attribute',
              key: 'id',
              value: 'articleTag',
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: [
                'newsletter-inbodyContent-slice',
                'article-continues-below',
                'comment-widget-loaded',
              ],
            },
          ],
        },
      ];

      const content = HTMLMapper.getRootElement(htmlContent, rootMapping);
      expect(content).toBeTruthy();
      if (!content) {
        return;
      }

      // writeFileSync(rootedNodeFilePath, content, 'utf-8');

      const components = HTMLMapper.toComponents(content, {
        excludes,
        mappings,
      });

      expect(components.length).toBe(117);
    }
  );
});
