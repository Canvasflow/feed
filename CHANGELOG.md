# CHANGELOG

## 🏷️ 1.15.5

_June 17, 2026_

🐳 CI

- Drop redundant test step since coverage runs the suite, bump to 1.15.5 ([`d57b217`](https://github.com/Canvasflow/feed/commit/d57b217b3373ca6208df4f52fef6cab4966a01c7))

## 🏷️ 1.15.4

_June 17, 2026_

🧪 Tests

- (rss) Skip "The English Home" suite and bump to 1.15.4 ([`65c4782`](https://github.com/Canvasflow/feed/commit/65c47822c5eab548d8e15a556310e638146ed9f5))

## 🏷️ 1.15.3

_June 17, 2026_

✨ Features

- (changelog) Split CI and Build into separate categories ([`3471370`](https://github.com/Canvasflow/feed/commit/34713709e637e3b7d18cacfd3266f9a726f946f1))

🐳 CI

- Render coverage as a formatted summary report ([`c4a7add`](https://github.com/Canvasflow/feed/commit/c4a7add5b58eccd220d1b62ebb0adf703b9bd15b))

## 🏷️ 1.15.2

_June 17, 2026_

✨ Features

- Support viewing coverage in the vitest ui ([`b9bb3c6`](https://github.com/Canvasflow/feed/commit/b9bb3c6c953b7990154de0acd7c904b5d0d54fc7))

🚜 Build & CI

- Report coverage in publish workflow summary ([`d51ac16`](https://github.com/Canvasflow/feed/commit/d51ac160ec6017892cb5205a50366e1fdba02b03))

📝 Docs

- Align docs with typings and link them from the README ([`986a48c`](https://github.com/Canvasflow/feed/commit/986a48c886fffab8c01b46b3c045ea42b56bea75))
- Revise HTML guide and add Mappings and RSS docs ([`d7dcce7`](https://github.com/Canvasflow/feed/commit/d7dcce7fb24b69e7a9d6b40c2831344c2db836dd))
- Add README with usage and scripts reference ([`f21941e`](https://github.com/Canvasflow/feed/commit/f21941e7d6d6c17a35db32439bd17ce76d96252d))

🎨 Style

- Group imports by node, third-party, then project ([`e3a289b`](https://github.com/Canvasflow/feed/commit/e3a289b187d22457ad7cb5e49562b23376c1ae2c))

🧹 Chores

- Upgrade typescript to 6.0.3 ([`f52f4d8`](https://github.com/Canvasflow/feed/commit/f52f4d8257081f899c57b81ec0c67100fc8e416d))
- Remove unused eslint.config.js ([`e1d2665`](https://github.com/Canvasflow/feed/commit/e1d2665f2bb0ed6c6a777e14898be8573488b284))
- Approve fsevents install script and bump to 1.15.2 ([`f0c36da`](https://github.com/Canvasflow/feed/commit/f0c36da65052d73753c736adc592457cad3bac70))

## 🏷️ 1.15.1

_June 17, 2026_

✨ Features

- (changelog) Auto-record hotfix/release sections on merge to main ([`cf02835`](https://github.com/Canvasflow/feed/commit/cf028354727035c9e884a41a0ced141d87575dd7))

🐛 Fixed

- (html) Match twitter status URLs across hosts and bump to 1.15.1 ([`6efd476`](https://github.com/Canvasflow/feed/commit/6efd4763ade1830670cde5394476d8a8381b6df4))

🚜 Build & CI

- Use npm ci for reproducible installs in publish workflow ([`fc484b3`](https://github.com/Canvasflow/feed/commit/fc484b31652045bcb0e377699378a46d27dbf969))

🎨 Style

- (changelog) Apply formatter and fix stale script docstring ([`e8fbf67`](https://github.com/Canvasflow/feed/commit/e8fbf674ae87ccdee53bf95be72ed1321cd6c569))
- (html) Use double quotes in HTMLMapper tests ([`a76f283`](https://github.com/Canvasflow/feed/commit/a76f283d19085a579ac37a5d3016a3f039bf0448))

## 🏷️ 1.15.0

_June 12, 2026_

✨ Features

- (html) Add gallery component support via custom mapping ([`acd193f`](https://github.com/Canvasflow/feed/commit/acd193f23e8fb1c9db057e2cedf8ec859783a554))

## 🏷️ 1.14.2

_June 12, 2026_

🐛 Fixed

- Fix item description ([`ead6a6e`](https://github.com/Canvasflow/feed/commit/ead6a6eea2390b467d5f92f2d6c624e8fe7a8130))

## 🏷️ 1.14.1

_June 12, 2026_

🐛 Fixed

- (rss) Apply HTML tag sanitization to item descriptions ([`41e19dd`](https://github.com/Canvasflow/feed/commit/41e19dde1545cd51263f5d94caaea2255aebdcbb))

## 🏷️ 1.14.0

_June 12, 2026_

✨ Features

- (component) Export inferred types from Mapping schema and refactor Mapping ([`46ffa6f`](https://github.com/Canvasflow/feed/commit/46ffa6fa478c28f92d047a4ce84806f3788b4e2e))

🐛 Fixed

- (rss) Sanitize HTML tags from channel description ([`7de7c3b`](https://github.com/Canvasflow/feed/commit/7de7c3b470be55911a720919e37fb79aa6754ad5))

🚜 Build & CI

- Upgrade actions/checkout and actions/setup-node to v6 ([`b905b55`](https://github.com/Canvasflow/feed/commit/b905b55bc6ddc2f683fb939a786550b3980458e1))
- Upgrade actions/checkout and actions/setup-node to v5 ([`0b521c3`](https://github.com/Canvasflow/feed/commit/0b521c3bc80e0bb641fd934d72331ac3d7d9403d))

## 🏷️ 1.13.1

_June 10, 2026_

🚜 Build & CI

- Upgrade actions/checkout and actions/setup-node to v6 and bump version to 1.13.1 ([`661006b`](https://github.com/Canvasflow/feed/commit/661006be5bc424037a4a822625652f5fdd184edd))

## 🏷️ 1.13.0

_June 10, 2026_

🐛 Fixed

- (component) Find twitter anchor in descendants instead of direct children ([`def238d`](https://github.com/Canvasflow/feed/commit/def238d2b61ec19d515f8771950474f9529c7ed1))
- (rss) Correct validateParams logic and improve test coverage ([`50b314e`](https://github.com/Canvasflow/feed/commit/50b314ed477dd6361708eb35dd209cde5c68ce0f))
- (schema) Replace discriminatedUnion with union for ComponentMappingSchema ([`3a4ea3c`](https://github.com/Canvasflow/feed/commit/3a4ea3c861ccc925705c302dc866c6d94d5890d8))

🚜 Build & CI

- Upgrade actions/setup-node to v4 in test job ([`f861ded`](https://github.com/Canvasflow/feed/commit/f861ded61da057b149aaf55174e05e883cd5ef34))

## 🏷️ 1.12.0

_June 9, 2026_

✨ Features

- (component) Propagate link to button components in link containers ([`afbe1ec`](https://github.com/Canvasflow/feed/commit/afbe1ec31d3a2422c1e82349733bf009b3939807))
- Add format when commiting ([`56b0dd3`](https://github.com/Canvasflow/feed/commit/56b0dd3ab3761822c8e15c18da6d843f16211541))
- (component) Add Zod schemas and typed component/mapping definitions ([`44447c2`](https://github.com/Canvasflow/feed/commit/44447c2065bcf4af6abfec8219d68902aea116ae))
- (build) Switch to ESM-only output ([`e7c80ae`](https://github.com/Canvasflow/feed/commit/e7c80aedd499d615cb06d599fa835ccd3cd3b9f8))
- (toolchain) Migrate vite and vitest to vite-plus ([`458b6d2`](https://github.com/Canvasflow/feed/commit/458b6d2f1ee590365d9ebae8386ae1911c99be41))

🐛 Fixed

- (test) Set VP_VERSION to suppress @vitest/ui version mismatch warning ([`bb5bce1`](https://github.com/Canvasflow/feed/commit/bb5bce1821219a1af4eea24f4c1ba9984a374a17))

🎨 Style

- (component) Fix indentation and import type in Mapping.ts ([`8ebd741`](https://github.com/Canvasflow/feed/commit/8ebd7410848d8add4f782ecb80dbedbd75323130))

## 🏷️ 1.11.7

_June 6, 2026_

✨ Features

- (html) Add support for detecting credit based on classNames ([`722719e`](https://github.com/Canvasflow/feed/commit/722719e84cf35e39dba6d266e56ba48d39a0e269))

## 🏷️ 1.11.6

_June 5, 2026_

✨ Features

- (html) Add support for html property ([`6aa0938`](https://github.com/Canvasflow/feed/commit/6aa0938c0df3c2109c7de701425497b5474459f9))

## 🏷️ 1.11.5

_June 4, 2026_

✨ Features

- (html) Add support for a way to ignore paragraph wrapping ([`caa3048`](https://github.com/Canvasflow/feed/commit/caa3048604f53663369e93139bff1cf87ec0fd12))
- Add support for properties in custom component ([`927d6f5`](https://github.com/Canvasflow/feed/commit/927d6f59b6c9a95d2cb9d97c95fe0a06d65d313d))

## 🏷️ 1.11.4

_June 3, 2026_

✨ Features

- (html) Add support for custom component ([`6f08e1d`](https://github.com/Canvasflow/feed/commit/6f08e1d44d9772283d96b5c8251067e57e742992))
- (html) Add support for detecting youtube from anchor tag ([`b72ddb8`](https://github.com/Canvasflow/feed/commit/b72ddb86b338bcf8c341a4a987e3c6792ee0c5d0))
- (html) Add support for legacy instagram embed API ([`b42d309`](https://github.com/Canvasflow/feed/commit/b42d309ad17978e877b43081279387e758dc7fe1))

🧹 Chores

- Remove comment ([`ad2e9e2`](https://github.com/Canvasflow/feed/commit/ad2e9e2c0bbaa3ff45191ca42d239a158b5b823e))

## 🏷️ 1.11.3

_June 2, 2026_

🐛 Fixed

- Remove env path ([`6ae0788`](https://github.com/Canvasflow/feed/commit/6ae078803040014848ac47f0ca3d59a03377207a))
- (html) Fix filter any and all logic ([`7354100`](https://github.com/Canvasflow/feed/commit/7354100241e04ac2a5a7bf63406762998c39d455))

## 🏷️ 1.11.2

_June 2, 2026_

🧹 Chores

- Update excludes ([`d0df0b1`](https://github.com/Canvasflow/feed/commit/d0df0b18689ee6c9e6cd3ff68ed3a315afa0b4bf))

## 🏷️ 1.11.1

_June 1, 2026_

✨ Features

- Add variable to control download ([`abfe68f`](https://github.com/Canvasflow/feed/commit/abfe68f9a03b3063b56ca31c43dcfcd4b61f696b))
- Add support for headers in link ([`8e888ad`](https://github.com/Canvasflow/feed/commit/8e888ad7346f1e636ebd418045d6417b8380313e))

## 🏷️ 1.11.0

_May 20, 2026_

✨ Features

- Add support for liveCoverageState ([`c96beb7`](https://github.com/Canvasflow/feed/commit/c96beb7d727f5711fb23cb72e334fa1070be02c1))
- (html) Add support for live container ([`f7f0f83`](https://github.com/Canvasflow/feed/commit/f7f0f83e705d5d52afe7657442538b9e86b3cb93))

🧹 Chores

- (rss) Change attribute for cf:liveCoverageState ([`e76031f`](https://github.com/Canvasflow/feed/commit/e76031f8a3a8bb613fa50a67e44a18159f78b726))

## 🏷️ 1.10.1

_May 13, 2026_

✨ Features

- (html) Add support for columns component ([`5266a71`](https://github.com/Canvasflow/feed/commit/5266a710cfc60eb117da38ec9e2c5131903b21e5))

🧹 Chores

- (html) Add documentation for filter columns function ([`29c45cc`](https://github.com/Canvasflow/feed/commit/29c45ccda650717c41604bc6fa01a6a536fcfe49))
- Separate component mapping ([`8768519`](https://github.com/Canvasflow/feed/commit/87685192bc11ac2e34b9b3718b2abfe5620cd99d))

## 🏷️ 1.10.0

_May 12, 2026_

✨ Features

- Add support for element property in html nodes ([`9c3eb1b`](https://github.com/Canvasflow/feed/commit/9c3eb1b2e004559c6154f072c658f74f7edeb22b))
- Add support for element property in iframe nodes ([`3313484`](https://github.com/Canvasflow/feed/commit/3313484512bd06aacd7f8a430b68206c6bb7a1e0))

## 🏷️ 1.9.4

_May 7, 2026_

🐛 Fixed

- Return as component error with invalid IG URL ([`24882c5`](https://github.com/Canvasflow/feed/commit/24882c57015a97dd77258861a20b9b1dcd733f88))

## 🏷️ 1.9.3

_May 5, 2026_

✨ Features

- Add support for extra Schema interfaces ([`92d8cd3`](https://github.com/Canvasflow/feed/commit/92d8cd3935938c6c9bf3cc5fb3328ac0d5b9e14f))

## 🏷️ 1.9.2

_April 24, 2026_

🐛 Fixed

- Fix removal of figure container ([`43ce62e`](https://github.com/Canvasflow/feed/commit/43ce62eb71def97a9e8ac9da92c8b8d2e62aff6a))

## 🏷️ 1.9.1

_April 23, 2026_

🧹 Chores

- Add JSDoc support for Mapping.ts ([`3613a1c`](https://github.com/Canvasflow/feed/commit/3613a1ccd5eb5e1a22779e4a1b02c840e8332789))

## 🏷️ 1.9.0

_April 23, 2026_

✨ Features

- Export functions for the library ([`a1363a8`](https://github.com/Canvasflow/feed/commit/a1363a8be5d03cabe90811d735a15f31836e7fb1))
- (html) Add support for figure container ([`d971142`](https://github.com/Canvasflow/feed/commit/d971142fdd4d78b7ddce4b4241bc51e449571e3a))
- Add validation component functions ([`f5e5e05`](https://github.com/Canvasflow/feed/commit/f5e5e053749589e8772044e11b53093ea19b188a))

🧪 Tests

- Add test for validate figure container ([`62467ac`](https://github.com/Canvasflow/feed/commit/62467ac344dce6ea81a0aad303d80ad31878588f))

🧹 Chores

- Add JSDoc support in Node.ts ([`6a0c07d`](https://github.com/Canvasflow/feed/commit/6a0c07ddb3fd7394808e31030e9c46b2114ddf5d))

## 🏷️ 1.8.0

_April 21, 2026_

✨ Features

- Add support for link container ([`aa5fcaa`](https://github.com/Canvasflow/feed/commit/aa5fcaa3e6133cc06825d8b8346494469096af9c))

🧪 Tests

- Add support for tags in vitest ([`0fe2b4a`](https://github.com/Canvasflow/feed/commit/0fe2b4a38f3a1ca8e861c65b5534aaa4c073a1b6))
- (html) Add test for link container ([`15500c1`](https://github.com/Canvasflow/feed/commit/15500c1220565580dfba18e5d94ff170da327063))

🧹 Chores

- Code cleanup ([`eed486f`](https://github.com/Canvasflow/feed/commit/eed486f7f915c2a4615c00915e740247e0df6956))

## 🏷️ 1.7.5

_April 20, 2026_

✨ Features

- Export Thumbnail ([`b78a060`](https://github.com/Canvasflow/feed/commit/b78a060ce26c24eadc82d2c99dbb055998d97364))

## 🏷️ 1.7.4

_April 20, 2026_

✨ Features

- Export Recipe Comnponent ([`26d8533`](https://github.com/Canvasflow/feed/commit/26d853336939a9c82c1b30e8d554e0a961bd23c8))

## 🏷️ 1.7.3

_April 20, 2026_

🐛 Fixed

- Fix export functions ([`ef1faea`](https://github.com/Canvasflow/feed/commit/ef1faea59766947d9dc1da7fc9f7dba48b832f1a))

## 🏷️ 1.7.2

_April 20, 2026_

🐛 Fixed

- Fix credit for media content ([`83e2ccb`](https://github.com/Canvasflow/feed/commit/83e2ccb772082cd1c99caf1697de27437fe0315c))

## 🏷️ 1.7.1

_April 17, 2026_

🐛 Fixed

- Fix import problems ([`57cb66c`](https://github.com/Canvasflow/feed/commit/57cb66c8d2922f7630a47b9b5b740e2d2f9201cd))

## 🏷️ 1.7.0

_April 17, 2026_

✨ Features

- Add support for apple podcast audio component ([`6ecbf9b`](https://github.com/Canvasflow/feed/commit/6ecbf9b465bf820f6a70b83ef58a03bf9554a8a0))
- Add support for findDescendants function ([`6634385`](https://github.com/Canvasflow/feed/commit/6634385b07d7cb3c20f95c40646f8ab54a3e0640))

🧹 Chores

- Upgrade lock file ([`1072150`](https://github.com/Canvasflow/feed/commit/1072150cb2306ec529417b6a1a40a89f494dc986))
- (html) Refactor functions ([`b0339bd`](https://github.com/Canvasflow/feed/commit/b0339bd89c99c7fcbf77239e64f8f1a34f8526ca))

## 🏷️ 1.6.16

_April 15, 2026_

🐛 Fixed

- Fix single quote to double ([`089793e`](https://github.com/Canvasflow/feed/commit/089793e62d838a8157188ab511a7a3199f1f2684))

🧹 Chores

- Remove logs ([`bd29afe`](https://github.com/Canvasflow/feed/commit/bd29afe143cbedf8112b226072853ccde9832146))

## 🏷️ 1.6.15

_April 15, 2026_

🐛 Fixed

- Fix missing space ([`a122932`](https://github.com/Canvasflow/feed/commit/a1229322b2922eb1c26750d754e151f2bdf98932))

## 🏷️ 1.6.14

_April 14, 2026_

🧹 Chores

- (html) Replace empty space with &nbsp ([`553f243`](https://github.com/Canvasflow/feed/commit/553f24366dae0217ead47f2fe20777b1f219ca37))

## 🏷️ 1.6.13

_April 14, 2026_

🧹 Chores

- (html) Ignore comment type of html ([`733e548`](https://github.com/Canvasflow/feed/commit/733e5489ea63e8a44a01adbead85849e0964ba61))

## 🏷️ 1.6.12

_April 1, 2026_

✨ Features

- Add support for multiple ld+json in recipe ([`5306789`](https://github.com/Canvasflow/feed/commit/53067891a5bcf2b5fc034745cae0e440b55e95d0))

## 🏷️ 1.6.11

_March 31, 2026_

✨ Features

- Bump nodejs version ([`7db4e12`](https://github.com/Canvasflow/feed/commit/7db4e12393c8f54f2976d99d7717b42702239c52))

## 🏷️ 1.6.10

_March 31, 2026_

🐛 Fixed

- Disable process entities and use he ([`8db4249`](https://github.com/Canvasflow/feed/commit/8db42495f60abf23c43b4de08a100d0307249ed6))

## 🏷️ 1.6.9

_March 30, 2026_

🐛 Fixed

- Ignore processing entities ([`a4c51a1`](https://github.com/Canvasflow/feed/commit/a4c51a1a0f50810a00e27178530fec0135bd413c))

## 🏷️ 1.6.8

_March 30, 2026_

🐛 Fixed

- Disable process entities ([`7e1dc3c`](https://github.com/Canvasflow/feed/commit/7e1dc3c49c27fa0e8722f198d8ab14eeaefd65d4))

## 🏷️ 1.6.7

_March 23, 2026_

✨ Features

- Remove required tag content:encoded ([`705ece6`](https://github.com/Canvasflow/feed/commit/705ece638bacb1f76888c5d06cb7780e8ca82408))

## 🏷️ 1.6.6

_March 23, 2026_

✨ Features

- Add support for root mapping ([`9d44402`](https://github.com/Canvasflow/feed/commit/9d44402e11b2827cc8dc35926b6342a151957572))

## 🏷️ 1.6.5

_March 20, 2026_

✨ Features

- Increase the amount of expansions ([`64313b2`](https://github.com/Canvasflow/feed/commit/64313b25a05a3398722494f56d2af21e3e908e64))

## 🏷️ 1.6.4

_March 20, 2026_

🐛 Fixed

- Add support for large entities ([`6b5063d`](https://github.com/Canvasflow/feed/commit/6b5063dc2c9de918e51437ca3756ff2795e49e6f))

## 🏷️ 1.6.3

_March 19, 2026_

✨ Features

- Expose mapping internals ([`34a6fdb`](https://github.com/Canvasflow/feed/commit/34a6fdba1865d87138447d41e8bff8640a3e3968))

🧹 Chores

- (html) Code cleanup ([`b5aadc7`](https://github.com/Canvasflow/feed/commit/b5aadc70e6cb3366fa0c33d269b17293a5cc751a))

## 🏷️ 1.6.2

_March 18, 2026_

✨ Features

- Add support for exclude components ([`e3e0be7`](https://github.com/Canvasflow/feed/commit/e3e0be743d4018185908c207dcb14d84fa6ffeb3))
- (html) Add support for attribute filter ([`4f5f9ca`](https://github.com/Canvasflow/feed/commit/4f5f9ca3b41bb0395a4a7dabb5283ea3acfded49))
- (html) Add support for root element ([`7f224b3`](https://github.com/Canvasflow/feed/commit/7f224b35651ce010740b0382b078bbfdbe14af4f))

🧪 Tests

- (html) Add test for mapping with attributes ([`034231e`](https://github.com/Canvasflow/feed/commit/034231e101fca550ce19a8aa94a9de8a46ed88e0))

## 🏷️ 1.6.1

_March 10, 2026_

🧹 Chores

- Fix commit msg ([`8fc5608`](https://github.com/Canvasflow/feed/commit/8fc56085de3bde3970969c915281dfcf32c54f17))
- Fix pre-commit ([`83ede51`](https://github.com/Canvasflow/feed/commit/83ede51b14ead702b5b42b21fa25a109361311ac))
- Fix husky ([`a5e1114`](https://github.com/Canvasflow/feed/commit/a5e1114a93b4d606fb393ae293d4c413d1bc4bdb))

## 🏷️ 1.6.0

_March 10, 2026_

✨ Features

- Add support for properties in component ([`82bc151`](https://github.com/Canvasflow/feed/commit/82bc1512cb5ef9e30daea5411c3cea3455808d2d))

🧹 Chores

- Fix conflict ([`8952f63`](https://github.com/Canvasflow/feed/commit/8952f630ac0541916cee1d31856eb88b27efdd38))

## 🏷️ 1.5.32

_February 20, 2026_

🐛 Fixed

- (rss) Media content description was not being recognized ([`2c4faf8`](https://github.com/Canvasflow/feed/commit/2c4faf8d51fa8062cbdaafee0adf86a8ee6a77c0))

🧹 Chores

- Upgrade dependencies ([`b033529`](https://github.com/Canvasflow/feed/commit/b033529490ca92c06717c8c9935a652b80a64cf6))

## 🏷️ 1.5.31

_February 9, 2026_

✨ Features

- Add support for container component ([`39fe689`](https://github.com/Canvasflow/feed/commit/39fe68962eaab41be5177af4f3bea5ff45215455))

🧹 Chores

- Fix conflict ([`fdec1ed`](https://github.com/Canvasflow/feed/commit/fdec1ed44a94ae5e516dad64226a3bd4251a8864))

## 🏷️ 1.5.30

_February 6, 2026_

✨ Features

- Add support for custom components ([`69099fc`](https://github.com/Canvasflow/feed/commit/69099fce67d7b1440ff4a288fae7bda3a0a0f35b))

## 🏷️ 1.5.29

_February 6, 2026_

✨ Features

- Add support for custom components ([`715a165`](https://github.com/Canvasflow/feed/commit/715a1656f4d15becfc33bf2eaff9c109a4720d54))

## 🏷️ 1.5.28

_February 5, 2026_

✨ Features

- Add support for tweet in embedly ([`9847496`](https://github.com/Canvasflow/feed/commit/984749689425ed60267720e8ada292048237f285))

## 🏷️ 1.5.27

_February 4, 2026_

✨ Features

- Add support for vimeo component ([`a7c26b6`](https://github.com/Canvasflow/feed/commit/a7c26b6201d9e684f07747ccf6bdadcba5e6671f))

## 🏷️ 1.5.26

_February 4, 2026_

✨ Features

- Add support for TikTok in embedly ([`a66c341`](https://github.com/Canvasflow/feed/commit/a66c341ac38ae2db75399efe4f0d96d3c13575ff))
- Add support for Dailymotion component ([`4bbc64c`](https://github.com/Canvasflow/feed/commit/4bbc64cd12ce67c2a5efbd0590c4835681a213e4))
- (html) Add support for embedly for youtube ([`c18bb89`](https://github.com/Canvasflow/feed/commit/c18bb899b846d814e6e1f426d7531ee6e161092a))

🧹 Chores

- Code cleanup ([`1bd27cb`](https://github.com/Canvasflow/feed/commit/1bd27cb54b2702db804d530615cf444104dc415d))

## 🏷️ 1.5.24

_January 23, 2026_

✨ Features

- (html) Add support for classNames as an array for detecting tweet ([`ec1ba2a`](https://github.com/Canvasflow/feed/commit/ec1ba2ae1dd567ed73943849809893a9fda1e9ec))

🧹 Chores

- Fix conflict ([`543f2a4`](https://github.com/Canvasflow/feed/commit/543f2a4542256c3061d7bdb738ec3ec28c77038f))
- Upgrade dependencies ([`2fcdc95`](https://github.com/Canvasflow/feed/commit/2fcdc95633ee4b9af5a8d8008d0c8bbe9c642b5e))

## 🏷️ 1.5.23

_January 12, 2026_

🐛 Fixed

- Fix caption content ([`87f26d8`](https://github.com/Canvasflow/feed/commit/87f26d837dc4448ba8bc08566694a9385418fd27))

## 🏷️ 1.5.22

_December 30, 2025_

🧹 Chores

- Remove images if multiple elements inside anchor tags ([`0b68c75`](https://github.com/Canvasflow/feed/commit/0b68c75862125f2b4cfee23e510f2934386f3d41))

## 🏷️ 1.5.21

_December 18, 2025_

🐛 Fixed

- Replace invalid links with # ([`8c3e0fd`](https://github.com/Canvasflow/feed/commit/8c3e0fdc2d9c4d8e9ae781cf07a55cfdfef9d905))
- (html) Remove duplicate allowd tags ([`e392449`](https://github.com/Canvasflow/feed/commit/e392449f9ea82a9e04279f6597210a269fba0a00))

## 🏷️ 1.5.20

_December 15, 2025_

✨ Features

- Add support for getting images from html wrappers ([`beafd5a`](https://github.com/Canvasflow/feed/commit/beafd5af097f11636841c168b0c557bd7bad6232))

🐛 Fixed

- Fix linting problem ([`4928e4d`](https://github.com/Canvasflow/feed/commit/4928e4d6519f807e725c28abf3c91e8af15b08cf))

## 🏷️ 1.5.19

_December 11, 2025_

✨ Features

- (html) Add support for headers wrappers for images ([`4cc8e44`](https://github.com/Canvasflow/feed/commit/4cc8e44825d34051881210968a22654907b753fa))

## 🏷️ 1.5.18

_December 4, 2025_

✨ Features

- Add support for extracting images from p tags ([`885f560`](https://github.com/Canvasflow/feed/commit/885f56050ab847f21afcf4a03908cf378ea03ac8))

🧹 Chores

- Merge code in single file ([`62819a9`](https://github.com/Canvasflow/feed/commit/62819a9e2bd969cef46f59ed49385e11698605ad))
- Fix linting errors ([`c263522`](https://github.com/Canvasflow/feed/commit/c263522a62ec1e8727b806211f02b7e7b9ceb46b))

## 🏷️ 1.5.17

_December 3, 2025_

🐛 Fixed

- Skip recipe tests ([`bdb9067`](https://github.com/Canvasflow/feed/commit/bdb90671fc7066e87e335a47d9f216ecbdc1a3e9))

## 🏷️ 1.5.16

_December 3, 2025_

🐛 Fixed

- Fix test for unreachable url ([`e7fd3b9`](https://github.com/Canvasflow/feed/commit/e7fd3b933d23f87ac61c25cb9fe092739ca1a242))

## 🏷️ 1.5.15

_December 3, 2025_

✨ Features

- Add support for categories to be number ([`c535ea1`](https://github.com/Canvasflow/feed/commit/c535ea1c4dd14d4bf9496c15b21a02cbddb94e7a))

## 🏷️ 1.5.14

_November 27, 2025_

✨ Features

- Add support for schema typings ([`a3c0c4b`](https://github.com/Canvasflow/feed/commit/a3c0c4b9c3686b3dc4157a6a483f163af7e351c1))

## 🏷️ 1.5.13

_November 25, 2025_

✨ Features

- Add support for media:description ([`09348c5`](https://github.com/Canvasflow/feed/commit/09348c5cfc822b44b77cea6f29ebd6fc4e57c4b5))

## 🏷️ 1.5.12

_November 25, 2025_

✨ Features

- Add support for html table type ([`99d55f9`](https://github.com/Canvasflow/feed/commit/99d55f9d2520c81604903beae83a3033ac597bca))

## 🏷️ 1.5.11

_November 25, 2025_

✨ Features

- Add support for html table inside a figure ([`47fb261`](https://github.com/Canvasflow/feed/commit/47fb261c3723833fa24979b8539c2a759cc2283d))
- Add support for html table ([`bf721aa`](https://github.com/Canvasflow/feed/commit/bf721aa420a35c0a65669631749955e3d863b2c5))

## 🏷️ 1.5.10

_November 20, 2025_

🐛 Fixed

- Fix vulneravility ([`a76e8e6`](https://github.com/Canvasflow/feed/commit/a76e8e6813a2d75a348a18823929677b1ade496a))

## 🏷️ 1.5.9

_November 20, 2025_

🐛 Fixed

- Remove pubDate date handling ([`7f25d3b`](https://github.com/Canvasflow/feed/commit/7f25d3b8d883fe15e4c9d0af4957478411fe60e2))

## 🏷️ 1.5.8

_November 19, 2025_

🐛 Fixed

- Add allowed tags in figcaption ([`7cbd636`](https://github.com/Canvasflow/feed/commit/7cbd636f3f583ffd8cc458ab227915f8245f853e))

## 🏷️ 1.5.6

_October 23, 2025_

🧹 Chores

- Fix CI ([`78c5b7a`](https://github.com/Canvasflow/feed/commit/78c5b7a78a6b9f3e5d502650c5e0a96982a6a63f))

## 🏷️ 1.5.5

_October 23, 2025_

✨ Features

- Support for recipe ([`1c7de2f`](https://github.com/Canvasflow/feed/commit/1c7de2f41e1aa575f9fe19bfd7521514b3ffdec6))
- Add support for recipe ([`1b9c389`](https://github.com/Canvasflow/feed/commit/1b9c3896acb4004167318bb2e96e724dcf3bfe4d))

🐛 Fixed

- Passing test ([`1015b30`](https://github.com/Canvasflow/feed/commit/1015b308f8001ef815de42e5382986778c60d0b2))

🧹 Chores

- Fix audit problem ([`4285882`](https://github.com/Canvasflow/feed/commit/42858828b24ed4031879e6401bbb351c47252120))

## 🏷️ 1.5.4

_October 22, 2025_

🐛 Fixed

- Ignore processing anchor tags without attributes ([`3065741`](https://github.com/Canvasflow/feed/commit/30657410473baae6dff8103f73f41daa1921e549))

## 🏷️ 1.5.3

_October 20, 2025_

✨ Features

- (updated relative url) Updated relative url ([`a1ef413`](https://github.com/Canvasflow/feed/commit/a1ef41340b34f6aa47d80596570e4a1ee2896c24))
- (updated relative) Relative ([`f61d410`](https://github.com/Canvasflow/feed/commit/f61d410afa817fa933ca71e73491017aaa5ed19e))
- (bump v version relative url) Relative url update ([`a464809`](https://github.com/Canvasflow/feed/commit/a464809aaf0dc57581a8d51e5cec9ddbd4108ad2))
- (updated url validation) Url validation for relatives ([`6bcbe71`](https://github.com/Canvasflow/feed/commit/6bcbe7154c7568676d5791914cafbdbbb6ebe66c))

## 🏷️ 1.5.2

_October 20, 2025_

✨ Features

- Add support for process links in text component ([`7db5cfe`](https://github.com/Canvasflow/feed/commit/7db5cfeb50a35e8bc905b59fe1d6484de35e6026))
- (added ssupport for relative links and tests) Relative links ([`ec1f428`](https://github.com/Canvasflow/feed/commit/ec1f428e2c9c02cf7e9341a020d29e7f953f87a2))

## 🏷️ 1.5.1

_October 17, 2025_

✨ Features

- (html) Add support for relative url ([`5d3a761`](https://github.com/Canvasflow/feed/commit/5d3a7618fa5023ffad705bd89b14a90c2ccdb682))
- (relative urls) Relative urls ([`6d64fde`](https://github.com/Canvasflow/feed/commit/6d64fdef7ad1de0200017cfd66561aef1c5c3c5c))
- Relative urls implementation ([`4864098`](https://github.com/Canvasflow/feed/commit/4864098b8ec32f234e8f70fbd55d79d3916e14ff))
- Add support relative links ([`dd9946c`](https://github.com/Canvasflow/feed/commit/dd9946c5a166056c18c17be1c75105064f4da942))

## 🏷️ 1.5.0

_October 17, 2025_

✨ Features

- (html) Add support for recipe detection ([`e9ace37`](https://github.com/Canvasflow/feed/commit/e9ace376c1850f3492453c783368ae95b34bd9c5))

## 🏷️ 1.4.13

_October 16, 2025_

🐛 Fixed

- Fix linting problem for missing types ([`db7405f`](https://github.com/Canvasflow/feed/commit/db7405f336a24ee19a7bd16656bdc36ea5e3fc76))
- (rss) Fix rss with single item ([`6944db8`](https://github.com/Canvasflow/feed/commit/6944db882b5179c05aa20eb164e8bffa6b0719c3))

## 🏷️ 1.4.12

_October 10, 2025_

🐛 Fixed

- (html) Add support for anchor attributes ([`b1872ee`](https://github.com/Canvasflow/feed/commit/b1872eee9d324be16c046ed34ea41177f0a49ca6))

## 🏷️ 1.4.10

_October 9, 2025_

✨ Features

- (html) Add support for anchor tags at the root as text component ([`18cf286`](https://github.com/Canvasflow/feed/commit/18cf2869dd5523f5cef1f98402dc24dabc6720de))

🧹 Chores

- (html) Remove filter for anchors at the root level ([`71547e9`](https://github.com/Canvasflow/feed/commit/71547e9084e948648044f5c2723b2202b3fb5a9f))

## 🏷️ 1.4.9

_October 8, 2025_

🧹 Chores

- Remove anchor from root ([`b84e784`](https://github.com/Canvasflow/feed/commit/b84e784c8dec1d8265462a87cb39782f92796a82))

## 🏷️ 1.4.8

_October 1, 2025_

♻️ Refactor

- (html) Change error data type and improve error messaging ([`3ff4258`](https://github.com/Canvasflow/feed/commit/3ff42585c4f51755e43843d809e10ebd1d824249))
- Change error data type and improve error messaging ([`f6925a3`](https://github.com/Canvasflow/feed/commit/f6925a3b985718c4330f5357711b6e08659c5ce9))

## 🏷️ 1.4.7

_October 1, 2025_

🎨 Style

- (rss) Improve error and warning messaging for canvasflow modules validation ([`f39113a`](https://github.com/Canvasflow/feed/commit/f39113a16eb33c1f231df67647b6b4f621b16166))

## 🏷️ 1.4.6

_October 1, 2025_

✨ Features

- (html) Add support for anchor links with a as parent ([`a3be036`](https://github.com/Canvasflow/feed/commit/a3be036d199ce75287508236997103d32603e1c4))

## 🏷️ 1.4.5

_September 30, 2025_

✨ Features

- (rss) Add support for origin in relative path media content ([`f769e9c`](https://github.com/Canvasflow/feed/commit/f769e9cd003d58dbdb40293173dfd3dca9fbc8e0))

## 🏷️ 1.4.4

_September 29, 2025_

🧪 Tests

- Add test for adding links in gallery ([`749be96`](https://github.com/Canvasflow/feed/commit/749be963fe7c88439173081c7655279d61a6cb2b))

## 🏷️ 1.4.3

_September 26, 2025_

🧹 Chores

- Add support for typings ([`3fa7115`](https://github.com/Canvasflow/feed/commit/3fa711545024d8f1169c918ee0e51befb44b0ee7))

## 🏷️ 1.4.2

_September 26, 2025_

♻️ Refactor

- Change default component value for h5 and h6 ([`323371b`](https://github.com/Canvasflow/feed/commit/323371b2462e9251d4f51209696497cfedcfbc8e))

## 🏷️ 1.4.1

_September 25, 2025_

🧹 Chores

- Add typing to button component ([`07681f2`](https://github.com/Canvasflow/feed/commit/07681f2a30cdee15089d8e5c154cf49298f36bb9))

## 🏷️ 1.4.0

_September 25, 2025_

✨ Features

- Add support for button component ([`8651a67`](https://github.com/Canvasflow/feed/commit/8651a6717fe39f289e0745e0e6671ac95441404a))

## 🏷️ 1.3.3

_September 24, 2025_

🐛 Fixed

- (html) Twitter container for html component ([`f81bcc1`](https://github.com/Canvasflow/feed/commit/f81bcc17016d0905bcf46d10877843fa5238fb16))

## 🏷️ 1.3.2

_September 23, 2025_

🐛 Fixed

- Disable style tag in html ([`0fd0ee6`](https://github.com/Canvasflow/feed/commit/0fd0ee666ca845139f1652e87fecfe20b2bb9db0))

🧪 Tests

- Add test for ignoring styles ([`50b801e`](https://github.com/Canvasflow/feed/commit/50b801e58bf1d6cde1f634810b8f0a0b5085484a))

## 🏷️ 1.3.1

_September 19, 2025_

🐛 Fixed

- Fix missing export for TikTok component ([`9cf1b41`](https://github.com/Canvasflow/feed/commit/9cf1b41f0924cbd5f28c16c971b5fa6f97a9f312))

## 🏷️ 1.3.0

_September 19, 2025_

✨ Features

- Add support for tiktok component ([`d185f13`](https://github.com/Canvasflow/feed/commit/d185f1352f36873e8068ea9e91945fa2d0e25378))

## 🏷️ 1.2.0

_September 18, 2025_

✨ Features

- Add support for warning about invalide types ([`d459071`](https://github.com/Canvasflow/feed/commit/d459071ba7d22c01059d8750dfffae3da4cdddc7))
- Add support for cf:thumbnail ([`f6113b8`](https://github.com/Canvasflow/feed/commit/f6113b860d256a264b8158770cd83bebd15363f1))

## 🏷️ 1.1.1

_September 17, 2025_

✨ Features

- Add support for using figure as container ([`2312895`](https://github.com/Canvasflow/feed/commit/231289575baebc79a8e3ab8ca1cebdde4ac95aec))

## 🏷️ 1.1.0

_September 15, 2025_

✨ Features

- (rss) Add support for purenews feed ([`0a2cf81`](https://github.com/Canvasflow/feed/commit/0a2cf818fa5a079e3ba5b636482ba5d1a1f19610))
- Extend youtube from video component ([`0181069`](https://github.com/Canvasflow/feed/commit/018106983c6ec826fa83a23e77c1bc6f12db5d71))
- Add fromNode function to map components ([`ee3f38f`](https://github.com/Canvasflow/feed/commit/ee3f38f1cb5b0a12fdb386407a479be7f3fe0756))
- Add support for detecting audio and video from figure element ([`d6c3b03`](https://github.com/Canvasflow/feed/commit/d6c3b03b07fc0c9ec715b9f4e9cb2e57e8ecd117))

🧹 Chores

- Update changelog ([`2b91b63`](https://github.com/Canvasflow/feed/commit/2b91b632d85f5e1b578295367ceb090335fefcdd))

## 🏷️ 1.0.3

_September 11, 2025_

✨ Features

- (rss) Add support for author:email ([`4c01b81`](https://github.com/Canvasflow/feed/commit/4c01b81a15b9880c3fdb974197851fe2f163b2fc))

🧪 Tests

- (rss) Add test for author:email ([`66023f6`](https://github.com/Canvasflow/feed/commit/66023f63d0d4025a9abcf88fbfb42ef9ad103d11))

## 🏷️ 1.0.2

_September 11, 2025_

✨ Features

- (rss) Add support for alt property in images ([`5fcae3c`](https://github.com/Canvasflow/feed/commit/5fcae3c4d25a009cc8613ebe028b28b052b193c2))

## 🏷️ 1.0.1

_September 11, 2025_

✨ Features

- (rss) Add support for atom:author ([`08d874f`](https://github.com/Canvasflow/feed/commit/08d874f15188a88769a77786b8d1687985d75a9a))
- Add support for link in images ([`839b2d1`](https://github.com/Canvasflow/feed/commit/839b2d1795a56a06bc1cd77b4f929de47a93b718))

## 🏷️ 1.0.0

_August 20, 2025_

✨ Features

- (rss) Set default value for cf:isPaid ([`48808f9`](https://github.com/Canvasflow/feed/commit/48808f93da2a9941a7e44429ff1c9c3b045d7e09))
- Add support for cf:isPaid ([`20e00c8`](https://github.com/Canvasflow/feed/commit/20e00c83d5c49eff56f4e0d16ad9ac7a6af1ea5e))

## 🏷️ 0.0.21

_July 23, 2025_

✨ Features

- (rss) Add support for 'atom:updated' in item ([`1b0f589`](https://github.com/Canvasflow/feed/commit/1b0f589180e27c66abd1c736193a2d69268951da))

## 🏷️ 0.0.20

_July 23, 2025_

✨ Features

- Add support for multiple dc:author and dcterms:modified ([`01158c3`](https://github.com/Canvasflow/feed/commit/01158c31f442b3d0870356850a2eb0ac7f4a8377))

## 🏷️ 0.0.19

_July 23, 2025_

✨ Features

- Add support for 'cf:hasAffiliateLinks' and 'cf:isSponsored' in rss ([`7835ad2`](https://github.com/Canvasflow/feed/commit/7835ad2357ec27b8e36aaf3edf300d5df39746ed))

## 🏷️ 0.0.18

_July 9, 2025_

♻️ Refactor

- (html) Remove html tags in caption and credit ([`a684990`](https://github.com/Canvasflow/feed/commit/a6849901cca1d8dc35a6308172b4d7fc23d166f2))

## 🏷️ 0.0.17

_July 3, 2025_

🐛 Fixed

- Add error when channel is empty ([`345a888`](https://github.com/Canvasflow/feed/commit/345a888b34a54783f4ad517a9482dd3b3771c1a4))

🧪 Tests

- (rss) Refactor testings ([`ce98288`](https://github.com/Canvasflow/feed/commit/ce98288835e2aebc899d595ce81d2dde90a8a444))

## 🏷️ 0.0.16

_June 27, 2025_

🐛 Fixed

- (rss) Add support for guid with permalinks ([`9e0b66f`](https://github.com/Canvasflow/feed/commit/9e0b66f9b109f327a08cc20e8426b72f708e9879))

## 🏷️ 0.0.15

_June 26, 2025_

✨ Features

- Add support for zod validation ([`19101ec`](https://github.com/Canvasflow/feed/commit/19101ec9e82855f5a8001d7897d27ca888f52603))
- Remove unused code (params) ([`be38e5c`](https://github.com/Canvasflow/feed/commit/be38e5c43dd6bfbefe18a98125b59b9c16992f08))
- Added support for params on Build ([`7e71053`](https://github.com/Canvasflow/feed/commit/7e7105374ffb10f43a6cb35c7da3c83b8982bee6))

📝 Docs

- Update changelog.md ([`0a717b3`](https://github.com/Canvasflow/feed/commit/0a717b3cbbad6e530dc9c94b78cba7b04cb54984))

🧹 Chores

- Clean zod code ([`a996585`](https://github.com/Canvasflow/feed/commit/a996585cfbd7c90cda3c9e6ccd190a00fa8086ed))

## 🏷️ 0.0.14

_June 25, 2025_

🐛 Fixed

- Fix date tests ([`2bb521c`](https://github.com/Canvasflow/feed/commit/2bb521c4e34ade7d7838ab035cb3117d21d59aca))

## 🏷️ 0.0.13

_June 25, 2025_

✨ Features

- Add support for mapping all with filters equal, any and all ([`03c4548`](https://github.com/Canvasflow/feed/commit/03c4548c0ae63988fb98a9251f29ce3c4cb6ad5e))
- Add support for mapping any with filters equal ([`57a2bdd`](https://github.com/Canvasflow/feed/commit/57a2bdd91e605d9abccdc0704b12fb55dd647d59))
- Add support for mapping any with filters all ([`0c3772a`](https://github.com/Canvasflow/feed/commit/0c3772a8669c664be1fe54d4e578a660f1d8ed25))
- Add support for mapping any with filters any ([`9b27945`](https://github.com/Canvasflow/feed/commit/9b279459e4e7c6a3c4bb4dbe93a0af1622782019))
- Added others exports used on transformer ([`40a8ae8`](https://github.com/Canvasflow/feed/commit/40a8ae89277a20813d5e1d04fb7fb7192750767a))
- Removed unused components ([`d9f7ec7`](https://github.com/Canvasflow/feed/commit/d9f7ec7113bf6d9770873f214e9562d097a88d1d))
- (html) Add support for `audio` component ([`ac7c245`](https://github.com/Canvasflow/feed/commit/ac7c2454da0d6fb487a72ca9546262a0a3970624))
- Add support for video component ([`a1cef82`](https://github.com/Canvasflow/feed/commit/a1cef82dc07c20c4752cd848dbfbcd6642106156))
- (rss) Add support for syndication module ([`7054b5e`](https://github.com/Canvasflow/feed/commit/7054b5e6e61c04dc2268be8d749f3db2cfea65bc))
- (rss) Add support for dublin core module ([`0009b71`](https://github.com/Canvasflow/feed/commit/0009b71062dd76d65282b3e05c28e1f1dbc89acd))
- (rss) Add support for `ttl` ([`a3aa24d`](https://github.com/Canvasflow/feed/commit/a3aa24d71f6538d0c55d58d56cf44f820b1a202f))
- (rss) Add support for `category` in `channel` ([`6808d0a`](https://github.com/Canvasflow/feed/commit/6808d0af6dc0abcac67a0457ea58ae23b3b60a07))
- (rss) Add support for `pubDate` in `channel` ([`ed859d2`](https://github.com/Canvasflow/feed/commit/ed859d2296f8d72d2da5a6e889dd5a613b4f5b10))
- (rss) Add support for `docs` ([`2ce9f89`](https://github.com/Canvasflow/feed/commit/2ce9f898d911de482d88b71134baa792229bd1e5))
- (rss) Add support for `lastBuildDate` ([`d149fa4`](https://github.com/Canvasflow/feed/commit/d149fa4f032d6cc3e272da0e2e9e97fbec72dc62))

♻️ Refactor

- Add regex validation for video id in Youtube components ([`cf56e96`](https://github.com/Canvasflow/feed/commit/cf56e967a80250e3d21328f44eb5a9400e6cf257))
- (html) Code cleanup ([`07b2ae9`](https://github.com/Canvasflow/feed/commit/07b2ae9428c53cfdaa04a009d54e81535c499df2))
- (html) Rename functions for consistencies ([`89a405c`](https://github.com/Canvasflow/feed/commit/89a405c3e0599178b5997feedab8f4ad97c791b6))

🧪 Tests

- (html) Add more test cases ([`0b2eb77`](https://github.com/Canvasflow/feed/commit/0b2eb77f769f6c487a9078c994c346a23e278de5))
- Add test for coverage of invalid rss ([`495f715`](https://github.com/Canvasflow/feed/commit/495f71538222d18e3fbb052236ea5f2f5d46f36e))
- (html) Replace interface in test ([`1add4f5`](https://github.com/Canvasflow/feed/commit/1add4f5662f024f7aafdf1ff3a9fa6592dd4f021))

## 🏷️ 0.0.12

_June 19, 2025_

✨ Features

- (rss) Add support for `image` tag in channe; ([`578a2e6`](https://github.com/Canvasflow/feed/commit/578a2e647ffe9e8f528fe809c22d2106cd5b7db5))
- (html) Add support for gallery ([`d64f495`](https://github.com/Canvasflow/feed/commit/d64f4953cb54f6303489410327e59b2148726bd8))
- Add more feeds for testing ([`b3186d9`](https://github.com/Canvasflow/feed/commit/b3186d96cf8bcacce5a2cb477bd34564e598f0dd))
- Add support for caption and credit from figcaption element ([`abd5470`](https://github.com/Canvasflow/feed/commit/abd54709f18c6a56559a6a888f600167463803ff))
- Add support for `media:group` and `media:content` ([`13261a9`](https://github.com/Canvasflow/feed/commit/13261a9c3e08f85f35b13c5d66b4263926f722ee))
- Added youtube, instagram and twitterteer tests ([`b532e92`](https://github.com/Canvasflow/feed/commit/b532e92c84db9f9a3d92e9fb59806ed881ecb5bc))
- Blockquote process change ([`8370105`](https://github.com/Canvasflow/feed/commit/83701058d07b2407b3961b563d7c7c0c05d0dec9))
- Add support for atomlink ([`0c67b14`](https://github.com/Canvasflow/feed/commit/0c67b14502b64dc9a2c61b4014e5047f503ce423))
- Add support for `atom:link` and `syndication` module ([`28ced53`](https://github.com/Canvasflow/feed/commit/28ced53ff2470a20d127d43ccc17e49ea766e7d1))

🐛 Fixed

- Fix conflict ([`614e26f`](https://github.com/Canvasflow/feed/commit/614e26f3b98e6907318d122bcc681aec2a156117))
- Fix husky run script ([`5a2c25d`](https://github.com/Canvasflow/feed/commit/5a2c25de0c506baf96d621378aba7a31abecbfe6))

🧪 Tests

- Add support for debug task ([`b9b4885`](https://github.com/Canvasflow/feed/commit/b9b4885002ca58d0a306359735b89018be9f401b))
- Add tests for veganfoodandliving ([`a5a1495`](https://github.com/Canvasflow/feed/commit/a5a14955d86997b9a9b61ccc337b42f2a41d0f6a))
- Rename image titles ([`d1d0700`](https://github.com/Canvasflow/feed/commit/d1d070055095f8322e72e5bf0fd1373a26c9fb94))
- Pass image tests ([`7404b9c`](https://github.com/Canvasflow/feed/commit/7404b9ce2de956810537fb5249c780906eeac858))

🧹 Chores

- (rss) Resolve linting problem ([`d9d37bb`](https://github.com/Canvasflow/feed/commit/d9d37bb7670b7289739ef7b86fc2b7b1517a7f3d))
- Rename files to rss ([`bf60fc0`](https://github.com/Canvasflow/feed/commit/bf60fc0bc5998eb5ff49a1807ac7bb47ed01631e))

## 🏷️ 0.0.11

_June 12, 2025_

✨ Features

- Removed unused variables ([`f2e77e3`](https://github.com/Canvasflow/feed/commit/f2e77e3ee8360ceaca378599ee7860823234296d))

## 🏷️ 0.0.9

_June 12, 2025_

✨ Features

- Random change ([`05350e6`](https://github.com/Canvasflow/feed/commit/05350e649b391b8a94ed86b5c9b3f1b7d103ac2f))
- Added component feature ([`3d912ac`](https://github.com/Canvasflow/feed/commit/3d912ac806e687e0cc8d49d7177a8c49c2053fef))
- Add support for `class` as text component attribute ([`95abe0a`](https://github.com/Canvasflow/feed/commit/95abe0a280e3d103094f969fa3e73f24c68d069e))
- Validate text component in their own section ([`b486fa8`](https://github.com/Canvasflow/feed/commit/b486fa8edc401c14f0e973a1078faa015306bb85))
- Add support for attributes in anchor tag ([`1be69cb`](https://github.com/Canvasflow/feed/commit/1be69cbfdd1e18b8c041709c4dbd17bcf42589a3))
- Add support for role validation in text components ([`a2bb5ac`](https://github.com/Canvasflow/feed/commit/a2bb5ac8c79374986c0efd486b1ea6537e9c11ff))
- Add support for text and image component ([`f1e1bb3`](https://github.com/Canvasflow/feed/commit/f1e1bb3ce7d141caca02a36ad80c724355048b8f))
- Enforce conventional commits using husky and commitlint ([`f515108`](https://github.com/Canvasflow/feed/commit/f515108d9e00030bd0d1b3d66a5da8dc5bc544b4))
- Add formatter ([`2bc70ed`](https://github.com/Canvasflow/feed/commit/2bc70edb5d261f6e1894557dd8e658694a545059))
- Add support for `prettier` ([`cf605cc`](https://github.com/Canvasflow/feed/commit/cf605ccd46bb865cc87dd8fdfa3ca77ad016b87c))
- (rss) Add support for linter ([`69c13d3`](https://github.com/Canvasflow/feed/commit/69c13d33cc74136c653f6110f1144ed268c0422c))

🐛 Fixed

- Fix pre-commit command ([`4e489fe`](https://github.com/Canvasflow/feed/commit/4e489fe37c774d43b116d6b913e9468ebffade84))
- (rss) Fix linting errors ([`314776b`](https://github.com/Canvasflow/feed/commit/314776bd659fdf37e214a7f8c0c0e1a239fdc566))

♻️ Refactor

- Extract HTML processing in their own module ([`e83dcca`](https://github.com/Canvasflow/feed/commit/e83dcca101f6536aefd6762c5678e3fd8ab07a3f))
- (rss) Remove console log ([`9fa8f69`](https://github.com/Canvasflow/feed/commit/9fa8f699ddb5f1657f1df954228682e205a088da))
- (rss) Cleanup code ([`994589d`](https://github.com/Canvasflow/feed/commit/994589df44ecf367f40c24f5e51d6c9224b3e3d7))
- (rss) Extract data as it's own object ([`ff743ac`](https://github.com/Canvasflow/feed/commit/ff743ac6917475d763eb7a33663e17e63a3c05b1))

🧪 Tests

- (htmlmapper) Add test for galleries ([`f3bca8f`](https://github.com/Canvasflow/feed/commit/f3bca8f427053aff7ac9ece1950a980f7ca2d1ae))
- Add testing for figure elements ([`71406c3`](https://github.com/Canvasflow/feed/commit/71406c30d08004a7c0fef2327e245198489b72f3))
- Add test for HTML Mapper ([`e51b7f8`](https://github.com/Canvasflow/feed/commit/e51b7f8a6dd47f3caa1c95273ce44da4a787c959))
- (rss) Improve test logic ([`1ce49f0`](https://github.com/Canvasflow/feed/commit/1ce49f0c66e3f14c3801216e01a0c7cb9a9dbfdf))
- (rss) Add support for UI in coverage ([`0db34e8`](https://github.com/Canvasflow/feed/commit/0db34e84cf8a386c074ab437ec6ac60df31d3fbf))
- Add support for test coverage ([`5636936`](https://github.com/Canvasflow/feed/commit/563693625f6f08670311ef8536a1000e01caa055))

🚜 Build & CI

- Replace commit-emoji ([`45050a4`](https://github.com/Canvasflow/feed/commit/45050a42df3a6c550a85e66c2fa12d5a375e3b3d))

📝 Docs

- (hmtlmapper) Add docs for how to process HTML content ([`9a0b691`](https://github.com/Canvasflow/feed/commit/9a0b6916b31ccab46958d066197699f66af3ed00))

🧹 Chores

- (index.html) Remove unused `index.html` file ([`8193c55`](https://github.com/Canvasflow/feed/commit/8193c55c2ba76f4d04ea98c25487bb42c803b6dc))
- Set up Conventional Commits using Husky and commitlint ([`37f9bc8`](https://github.com/Canvasflow/feed/commit/37f9bc877502c907726c390ee6037373f045fdcf))
- U ([`6f08244`](https://github.com/Canvasflow/feed/commit/6f08244f2f471064c947786955caa016ca39e9e3))

## 🏷️ 0.0.8

_May 27, 2025_

🧪 Tests

- (rss) Add support for autocar ([`51c1ede`](https://github.com/Canvasflow/feed/commit/51c1ede02ad4d2046fdb539fcc03e4e9b1b738fe))
- (rss) Add rss tests ([`586d644`](https://github.com/Canvasflow/feed/commit/586d644ef6d0eb7697cfce2aeb461181d7e7989d))

🚜 Build & CI

- Improve ci build steps ([`71e7855`](https://github.com/Canvasflow/feed/commit/71e78550689c89b13a60ba4c40a40cb32325a12f))

## 🏷️ 0.0.6

_May 27, 2025_

🐛 Fixed

- Fix build step github action ([`a4320b5`](https://github.com/Canvasflow/feed/commit/a4320b53c8428e4eb937d1b0baffc258aa921e7c))

## 🏷️ 0.0.5

_May 27, 2025_

⚡️ Performance

- Update package version and remove redundant publish steps ([`0d20b1e`](https://github.com/Canvasflow/feed/commit/0d20b1e06cfee6d6ab985ed233d51b06a0ac34ce))

## 🏷️ 0.0.4

_May 27, 2025_

🧹 Chores

- Remove preinstall ([`2f6af48`](https://github.com/Canvasflow/feed/commit/2f6af480e17dab29a2c5168b67923d14a41a90e7))

## 🏷️ 0.0.3

_May 27, 2025_

🐛 Fixed

- Add support for dist in packing ([`bfde81a`](https://github.com/Canvasflow/feed/commit/bfde81ac88d3213f09dc306144a872a5a1b75a40))

## 🏷️ 0.0.1

_May 27, 2025_

✨ Features

- (.github/workflows/publish.yml) Add GitHub Actions workflow for publishing ([`6355fe2`](https://github.com/Canvasflow/feed/commit/6355fe2bdf5a078345044ac01daafa2b68f45ae8))

📝 Docs

- Add support for husky ([`2751c6c`](https://github.com/Canvasflow/feed/commit/2751c6cbce65d14217b0509b01f7a8a3387b25d9))

🧹 Chores

- Update commitlint ([`b12a510`](https://github.com/Canvasflow/feed/commit/b12a510bfa2ca1e569bf4138627dd1a0674caa41))
- Update commitizen config to use custom config file ([`ddcdf26`](https://github.com/Canvasflow/feed/commit/ddcdf26abf703ebacd45fe516834506cffafd8bc))
- Add commitizen config and setup tests ([`52b8845`](https://github.com/Canvasflow/feed/commit/52b88455a712bb1603a264c8f0c394f560136b84))
- Update prettier ([`8bba72a`](https://github.com/Canvasflow/feed/commit/8bba72a679a88b8dd56efcdb35a0088dec31ac64))
- Add dependencies ([`fd5d31f`](https://github.com/Canvasflow/feed/commit/fd5d31f50359047fb6e4947bfab4f0e905b56f74))
- First commit ([`f81d8a1`](https://github.com/Canvasflow/feed/commit/f81d8a1252ea8eb2c4893eb668106d27b86549c5))
- Initial commit ([`6952121`](https://github.com/Canvasflow/feed/commit/6952121bb717f9572b4efcd48d53906058a0e9de))
