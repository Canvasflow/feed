import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import { type Mapping } from '../mapping/Mapping';
import {
  type TwitterComponent,
  type InstagramComponent,
  type YoutubeComponent,
  type TikTokComponent,
  type DailymotionComponent,
  type VimeoComponent,
} from '../Component';

describe('Instagram component', () => {
  test(
    'It should create an Instagram post component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Max Verstappen (@maxverstappen1)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`post`);
      expect(component.id).toBe(`DKZFL6pIVwo`);
    }
  );

  test(
    'It should create an Instagram reel component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Jake Mourkas (@jakes__junk)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`reel`);
      expect(component.id).toBe(`DLA3R_4SSKy`);
    }
  );

  test(
    'It should create an Instagram tv component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Jake Mourkas (@jakes__junk)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`tv`);
      expect(component.id).toBe(`DLA3R_4SSKy`);
    }
  );

  test(
    'It should create an Instagram post component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/p/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/p/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`post`);
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );

  test(
    'It should create an Instagram tv component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/tv/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/tv/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe('tv');
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );

  test(
    'It should create an Instagram reel component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/reel/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/reel/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe('reel');
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );
});

describe('Twitter Component', () => {
  test(
    'It should create a twitter tweet component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet"><p lang="en" dir="ltr">"He did it!" Jimmie Johnson and Bobby Labonte put on a show in the 2005 Coca-Cola 600 at Charlotte Motor Speedway. <a href="https://t.co/t2j2mXmL3L">pic.twitter.com/t2j2mXmL3L</a></p>&mdash; FOX: NASCAR (@NASCARONFOX) <a href="https://twitter.com/NASCARONFOX/status/1397629106427101185?ref_src=twsrc%5Etfw">May 26, 2021</a></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`NASCARONFOX`);
      expect(component.params.id).toBe(`1397629106427101185`);
    }
  );
  test(
    'It should create a twitter tweet component inside a figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<figure
	        class="wp-block-embed is-type-rich
            is-provider-twitter wp-block-embed-twitter"
        >
	        <div class="wp-block-embed__wrapper">
		        <blockquote class="twitter-tweet" data-width="500" data-dnt="true">
			        <p lang="en" dir="ltr">
                Greetings, Vault Hunters - We need to share that the release of
                Borderlands 4 on Nintendo Switch 2 is being delayed. We do not
                take this decision lightly, but are committed to ensuring we
                deliver the best possible experience to our fans, and the game
                needs additional development…
			        </p>
			        &mdash; Borderlands (@Borderlands)
			        <a
				        href="https://twitter.com/Borderlands/status/1970609156936868102?ref_src=twsrc%5Etfw"
				        >September 23, 2025</a>
		        </blockquote>
		<script
			async
			src="https://platform.twitter.com/widgets.js"
			charset="utf-8"
		></script>
	</div>
</figure>
`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`Borderlands`);
      expect(component.params.id).toBe(`1970609156936868102`);
    }
  );
  test(
    'It should create a twitter tweet component with image',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet">
            <p dir="ltr" lang="en">
                Randy Arozarena's MRI showed mild inflammation -- more than expected.
                With Luke Raley dealing with back issues and Josh Naylor out with a
                wrist injury, the Mariners are placing Arozarena on the injured list.
                They are selecting outfielder Curtis Washington from High-A Everett --…
            </p>
            — Ryan Divish (@RyanDivish)
            <a
                target="_blank"
                href="https://x.com/RyanDivish/status/2067043835797209515?ref_src=twsrc%5Etfw"
                >June 17, 2026</a
            >
        </blockquote>
`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.params.account).toBe(`RyanDivish`);
      expect(component.params.id).toBe(`2067043835797209515`);
    }
  );
  test(
    'It should create a twitter tweet inside a div',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet hawk-ignore" data-lang="en">
    <p lang="en" dir="ltr">
        Samsung Galaxy S26 Series Timeline (South Korea)Unpacked Event:
        February 25Pre-order period: February 26 to March 4Pre-sale period:
        March 5 to March 10Market launch date: March 11
    </p>
    <a href="https://twitter.com/cantworkitout/status/2013951595541913988">January 21, 2026</a>
</blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`cantworkitout`);
      expect(component.params.id).toBe(`2013951595541913988`);
    }
  );
  test(
    'It should create a twitter from an anchor tag in the children',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet hawk-ignore" data-lang="en">
    <p lang="en" dir="ltr">ICYMI: You can now use touch controls on your Mac
        display with Sidecar on iPad! &#128064; pic.twitter.com/KOErLtoZCA<a
            href="https://twitter.com/cantworkitout/status/2064234331434852632"
            data-url="https://twitter.com/cantworkitout/status/2064234331434852632" target="_blank"
            referrerpolicy="no-referrer-when-downgrade" data-hl-processed="none">June 9, 2026</a></p>
</blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`cantworkitout`);
      expect(component.params.id).toBe(`2064234331434852632`);
    }
  );
  test(
    'It should create a x tweet from an iframe',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          src="https://embedly.forbes.com/widgets/media.html?type=text%2Fhtml&amp;key=3ce26dc7e3454db5820ba084d28b4935&amp;schema=twitter&amp;url=https%3A//x.com/delayed3A/status/2018627889923826089&amp;image=">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`delayed3A`);
      expect(component.params.id).toBe(`2018627889923826089`);
    }
  );
  test(
    'It should create a twitter tweet from an iframe',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          src="https://embedly.forbes.com/widgets/media.html?type=text%2Fhtml&amp;key=3ce26dc7e3454db5820ba084d28b4935&amp;schema=twitter&amp;url=https%3A//twitter.com/delayed3A/status/2018627889923826089&amp;image=">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`delayed3A`);
      expect(component.params.id).toBe(`2018627889923826089`);
    }
  );
});

describe('Youtube Component', () => {
  test(
    'It should create an Youtube embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="" frameborder="0" height="315" src="https://www.youtube.com/embed/ZrCs3HYxflk?si=8USctaxbSBPyMsBE" title="YouTube video player" width="560"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'ZrCs3HYxflk' });
    }
  );
  test(
    'It should create an Youtube embed component from figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<figure>
          <div>
            <iframe
              loading="lazy"
              title="[DIY] Building a PORTABLE All-in-One PlayStation 5"
              width="500"
              height="281"
              src="https://www.youtube.com/embed/XQ87p2Rhb_A?feature=oembed"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'XQ87p2Rhb_A' });
    }
  );
  test(
    'It should create an Youtube embed component from figure with caption',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<figure>
          <div>
            <iframe
              loading="lazy"
              title="[DIY] Building a PORTABLE All-in-One PlayStation 5"
              width="500"
              height="281"
              src="https://www.youtube.com/embed/XQ87p2Rhb_A?feature=oembed"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
          <figcaption>This is a valid caption</figcaption>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'XQ87p2Rhb_A' });
      expect(component?.caption).toBe('This is a valid caption');
    }
  );
  test(
    'It should create an Youtube embed component from embed.ly',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
            src="https://embedly.forbes.com/widgets/media.html?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&amp;type=text%2Fhtml&amp;schema=youtu&amp;display_name=YouTube&amp;src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'dQw4w9WgXcQ' });
    }
  );
  test(
    'It should create an Youtube embed component from embed.ly with short url',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FF_Rf-ubc8zQ%3Ffeature%3Doembed&display_name=YouTube&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DF_Rf-ubc8zQ&image=https%3A%2F%2Fi.ytimg.com%2Fvi%2FF_Rf-ubc8zQ%2Fhqdefault.jpg&type=text%2Fhtml&schema=youtube" width="500" height="281" scrolling="no" title="YouTube embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'F_Rf-ubc8zQ' });
    }
  );

  test(
    'It should create an Youtube embed component from an anchor tag',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['video-aspect-box'],
            },
          ],
        },
      ];
      const components = HTMLMapper.toComponents(
        `<div class="youtube-video youtube-facade" data-nosnippet="" id="elk-u8zoxUlFo7E">
              <div class="video-aspect-box">
                  <div class="watch-on-iframe-u8zoxUlFo7E" data-yt-video-token="u8zoxUlFo7E"
                      title="Everything David Corenswet Did To Become Superman - YouTube">
                      <span class="youtube-video-title">Everything David Corenswet Did To
                          Become Superman - YouTube</span>
                      <img src="https://img.youtube.com/vi/u8zoxUlFo7E/maxresdefault.jpg"
                          alt="Everything David Corenswet Did To Become Superman - YouTube" data-aspect-ratio="16/9"
                          loading="lazy">
                  </div>
              </div>
              <svg class="play-button" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 234.67 165.33">
                  <path fill="red"
                      d="M229.763 25.817c-2.699-10.162-10.65-18.165-20.748-20.881C190.716 0 117.333 0 117.333 0S43.951 0 25.651 4.936C15.553 7.652 7.6 15.655 4.903 25.817 0 44.236 0 82.667 0 82.667s0 38.429 4.903 56.85C7.6 149.68 15.553 157.681 25.65 160.4c18.3 4.934 91.682 4.934 91.682 4.934s73.383 0 91.682-4.934c10.098-2.718 18.049-10.72 20.748-20.882 4.904-18.421 4.904-56.85 4.904-56.85s0-38.431-4.904-56.85">
                  </path>
                  <path fill="#fff" d="m93.333 117.559 61.333-34.89-61.333-34.894z">
                  </path>
              </svg>
              <a class="watch-on-youtube-u8zoxUlFo7E" href="https://youtu.be/u8zoxUlFo7E" target="_blank"
                  data-url="https://youtu.be/u8zoxUlFo7E" referrerpolicy="no-referrer-when-downgrade"
                  data-hl-processed="none">Watch On <svg class="youtube-logo" xmlns="http://www.w3.org/2000/svg"
                      viewbox="0 0 507.9 113.39">
                      <g fill="#fff">
                          <path
                              d="M64.792 80.99V32.396l42.082 24.297zm93.803-63.285a20.285 20.285 0 0 0-14.32-14.32C131.642 0 80.99 0 80.99 0S30.337 0 17.705 3.385a20.286 20.286 0 0 0-14.32 14.32C0 30.338 0 56.693 0 56.693S0 83.049 3.385 95.68A20.285 20.285 0 0 0 17.705 110c12.632 3.386 63.285 3.386 63.285 3.386s50.652 0 63.285-3.386a20.284 20.284 0 0 0 14.32-14.32c3.385-12.632 3.385-38.988 3.385-38.988s0-26.355-3.385-38.988m94.473 74.326c.887-2.314 1.332-6.098 1.332-11.35V58.556c0-5.097-.445-8.822-1.332-11.178-.888-2.355-2.452-3.533-4.69-3.533-2.163 0-3.69 1.178-4.577 3.533-.888 2.356-1.332 6.081-1.332 11.178V80.68c0 5.25.424 9.035 1.275 11.35.848 2.318 2.392 3.475 4.633 3.475 2.239 0 3.803-1.157 4.691-3.475zm-17.953 11.122c-3.207-2.16-5.486-5.52-6.835-10.079-1.352-4.554-2.027-10.617-2.027-18.185v-10.31c0-7.644.771-13.784 2.316-18.417 1.544-4.633 3.956-8.011 7.24-10.135 3.282-2.123 7.587-3.186 12.916-3.186 5.251 0 9.459 1.082 12.626 3.243 3.165 2.162 5.482 5.542 6.95 10.136 1.466 4.595 2.2 10.715 2.2 18.36v10.31c0 7.567-.714 13.65-2.142 18.243-1.43 4.595-3.747 7.955-6.951 10.077-3.205 2.124-7.548 3.186-13.03 3.186-5.64 0-10.06-1.082-13.263-3.243m248.053-57.981c-.81 1.005-1.352 2.646-1.621 4.923-.272 2.278-.404 5.734-.404 10.367v5.097h11.697V60.46c0-4.555-.155-8.011-.463-10.367-.309-2.355-.868-4.014-1.678-4.98-.812-.966-2.067-1.449-3.766-1.449-1.7 0-2.954.503-3.765 1.506zm-2.025 29.886v3.591c0 4.557.132 7.974.404 10.251.269 2.279.828 3.94 1.68 4.982.849 1.041 2.16 1.564 3.938 1.564 2.392 0 4.035-.927 4.923-2.781.887-1.853 1.37-4.942 1.447-9.268l13.785.812c.077.62.116 1.469.116 2.548 0 6.565-1.795 11.47-5.387 14.712-3.589 3.242-8.669 4.865-15.232 4.865-7.876 0-13.398-2.47-16.564-7.414-3.168-4.94-4.75-12.586-4.75-22.935V63.589c0-10.657 1.641-18.436 4.924-23.342 3.281-4.903 8.9-7.355 16.854-7.355 5.482 0 9.691 1.004 12.626 3.012 2.933 2.01 5 5.137 6.197 9.383 1.197 4.247 1.796 10.117 1.796 17.607v12.163h-26.757m-284.953-1.33-18.187-65.68h15.869l6.37 29.77c1.623 7.339 2.82 13.594 3.591 18.766h.464c.54-3.706 1.738-9.922 3.591-18.65l6.603-29.886h15.869l-18.417 65.68v31.51h-15.754v-31.51M322.115 34.23v71.007h-12.511l-1.39-8.688h-.347c-3.399 6.564-8.496 9.845-15.291 9.845-4.71 0-8.185-1.543-10.425-4.633-2.24-3.087-3.359-7.915-3.359-14.48V34.23h15.985v52.126c0 3.168.348 5.426 1.043 6.776.695 1.353 1.853 2.027 3.475 2.027 1.39 0 2.722-.423 3.996-1.275 1.274-.849 2.22-1.928 2.838-3.241V34.229h15.986m81.995.001v71.007h-12.511l-1.391-8.688h-.345c-3.402 6.564-8.498 9.845-15.292 9.845-4.711 0-8.186-1.543-10.426-4.633-2.24-3.087-3.358-7.915-3.358-14.48V34.23h15.985v52.126c0 3.168.347 5.426 1.041 6.776.696 1.353 1.855 2.027 3.476 2.027 1.391 0 2.723-.423 3.996-1.275 1.275-.849 2.22-1.928 2.839-3.241V34.229h15.985">
                          </path>
                          <path
                              d="M365.552 20.908h-15.87v84.329h-15.637v-84.33h-15.869V8.05h47.376v12.858m76.811 53.636c0 5.174-.215 9.229-.639 12.162-.424 2.937-1.139 5.021-2.143 6.255-1.004 1.236-2.357 1.854-4.053 1.854a7.404 7.404 0 0 1-3.65-.927c-1.12-.618-2.026-1.544-2.722-2.78V50.796c.54-1.93 1.467-3.513 2.78-4.749 1.313-1.234 2.74-1.853 4.285-1.853 1.623 0 2.876.637 3.766 1.91.886 1.275 1.505 3.418 1.853 6.43.348 3.011.523 7.297.523 12.857zm14.652-28.964c-.967-4.478-2.531-7.721-4.692-9.73-2.163-2.007-5.136-3.011-8.919-3.011-2.935 0-5.676.83-8.224 2.49a16.926 16.926 0 0 0-5.908 6.545h-.117l.001-37.416h-15.405v100.777h13.204l1.622-6.717h.347c1.235 2.393 3.088 4.285 5.56 5.675 2.47 1.39 5.213 2.085 8.225 2.085 5.404 0 9.382-2.491 11.931-7.471 2.548-4.982 3.823-12.76 3.823-23.341V64.23c0-7.953-.484-14.17-1.448-18.65">
                          </path>
                      </g>
                  </svg></a>
          </div>`,
        {
          excludes,
        }
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'u8zoxUlFo7E' });
    }
  );
});

describe('Dailymotion Component', () => {
  test(
    'It should create an Dailymotion embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fgeo.dailymotion.com%2Fplayer.html%3Fvideo%3Dx9z6sty%26&display_name=Dailymotion&url=https%3A%2F%2Fwww.dailymotion.com%2Fvideo%2Fx9z6sty&image=https%3A%2F%2Fs1.dmcdn.net%2Fv%2FZzPvs1fWfaf6KsK8h%2Fx240&type=text%2Fhtml&schema=dailymotion" width="480" height="269" scrolling="no" title="Dailymotion embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as DailymotionComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('dailymotion');
      expect(component.params).toEqual({ id: 'x9z6sty' });
    }
  );
});

describe('Vimeo Component', () => {
  test(
    'It should create a Vimeo embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fplayer.vimeo.com%2Fvideo%2F1138248349%3Fapp_id%3D122963&dntp=1&display_name=Vimeo&url=https%3A%2F%2Fvimeo.com%2F1138248349&image=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F2084551378-2d500d442b25ca58722aab3e62d9ca47a8c9ac2e57afe061995a01c8fd71ac92-d_1280%3Fregion%3Dus&type=text%2Fhtml&schema=vimeo" width="500" height="281" scrolling="no" title="Vimeo embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as VimeoComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('vimeo');
      expect(component.params).toEqual({ id: '1138248349' });
    }
  );
});

describe('TikTok Component', () => {
  test(
    'It should create a TikTok embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
        </blockquote> `
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    }
  );
  test(
    'It should create a TikTok embed component inside a figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `
        <figure>
          <blockquote
            class="tiktok-embed"
            cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
          </blockquote>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    }
  );
  test(
    'It should create a TikTok embed component inside a div',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `
        <div>
          <blockquote
            class="tiktok-embed"
            cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
          </blockquote>
        </div>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    }
  );
  test(
    'It should return errors for an invalid TikTok URL',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote
        class="tiktok-embed"
        cite="https://www.tiktok.com/invalid-url-format">
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '',
        username: '',
      });
      expect(component.errors.length).toBeGreaterThan(0);
      expect(component.errors[0]).toBe('Invalid TikTok video URL format.');
    }
  );
  test(
    'It should return errors if TikTok cite attribute is missing',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="tiktok-embed"></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '',
        username: '',
      });
      expect(component.errors.length).toBeGreaterThan(0);
      expect(component.errors[0]).toBe('cite attribute is required');
    }
  );
  test(
    'It should create a Tiktok component from embed.ly',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          class="embedly-embed"
          src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.tiktok.com%2Fembed%2Fv2%2F7593022588272561430&display_name=tiktok&url=https%3A%2F%2Fwww.tiktok.com%2F%40rickastleyofficial%2Fvideo%2F7593022588272561430&image=https%3A%2F%2Fp19-common-sign.tiktokcdn-us.com%2Ftos-no1a-p-0037-no%2Fo0RBVFFlD1yfKtXxdpH6AykfhHQEQA40D91JEg%7Etplv-tiktokx-origin.image%3Fdr%3D9636%26x-expires%3D1770382800%26x-signature%3DSub%252FfFdUPmtmCszcGV3IaEFu9NI%253D%26t%3D4d5b0474%26ps%3D13740610%26shp%3D81f88b70%26shcp%3D43f4a2f9%26idc%3Duseast8&type=text%2Fhtml&schema=tiktok"
          width="340"
          height="700"
          scrolling="no"
          title="tiktok embed"
          frameborder="0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture;"
          allowfullscreen="true">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7593022588272561430',
        username: '@rickastleyofficial',
      });
    }
  );
});
