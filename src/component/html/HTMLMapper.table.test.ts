import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import { type HTMLTableComponent } from '../Component';

describe('HTMLTable components', () => {
  test(
    'It should create a simple htmltable component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(`
        <table
          id="tablepress-175"
          class="tablepress tablepress-id-175"
          aria-labelledby="tablepress-175-name"
        >
          <thead>
            <tr class="row-1">
              <th class="column-1">Intel HEDT Family</th>
              <th class="column-2">Granite Rapids</th>
              <th class="column-3">Sapphire Rapids Refresh</th>
              <th class="column-4">Sapphire Rapids</th>
              <th class="column-5">Cascade Lake</th>
              <th class="column-6">Skylake</th>
              <th class="column-7">Skylake</th>
              <th class="column-8">Skylake</th>
              <th class="column-9">Broadwell</th>
              <th class="column-10">Haswell</th>
              <th class="column-11">Ivy Bridge</th>
              <th class="column-12">Sandy Bridge</th>
              <th class="column-13">Gulftown</th>
            </tr>
          </thead>
          <tbody class="row-striping row-hover">
            <tr class="row-2">
              <td class="column-1">Process Node</td>
              <td class="column-2">Intel 3</td>
              <td class="column-3">10nm ESF</td>
              <td class="column-4">10nm ESF</td>
              <td class="column-5">14nm++</td>
              <td class="column-6">14nm+</td>
              <td class="column-7">14nm+</td>
              <td class="column-8">14nm+</td>
              <td class="column-9">14nm</td>
              <td class="column-10">22nm</td>
              <td class="column-11">22nm</td>
              <td class="column-12">32nm</td>
              <td class="column-13">32nm</td>
            </tr>
            <tr class="row-3">
              <td class="column-1">Flagship SKU</td>
              <td class="column-2">TBD</td>
              <td class="column-3">
                Xeon W9-3595X<br />
                Xeon W7-2595X
              </td>
              <td class="column-4">
                Xeon W9-3495X<br />
                Xeon W7-2495X
              </td>
              <td class="column-5">Core i9-10980XE</td>
              <td class="column-6">Xeon W-3175X</td>
              <td class="column-7">Core i9-9980XE</td>
              <td class="column-8">Core i9-7980XE</td>
              <td class="column-9">Core i7-6950X</td>
              <td class="column-10">Core i7-5960X</td>
              <td class="column-11">Core i7-4960X</td>
              <td class="column-12">Core i7-3960X</td>
              <td class="column-13">Core i7-980X</td>
            </tr>
            <tr class="row-4">
              <td class="column-1">Max Cores/Threads</td>
              <td class="column-2">86/172?</td>
              <td class="column-3">
                60/120<br />
                26/52
              </td>
              <td class="column-4">
                56/112<br />
                24/48
              </td>
              <td class="column-5">18/36</td>
              <td class="column-6">28/56</td>
              <td class="column-7">18/36</td>
              <td class="column-8">18/36</td>
              <td class="column-9">10/20</td>
              <td class="column-10">8/16</td>
              <td class="column-11">6/12</td>
              <td class="column-12">6/12</td>
              <td class="column-13">6/12</td>
            </tr>
            <tr class="row-5">
              <td class="column-1">Clock Speeds</td>
              <td class="column-2">TBD</td>
              <td class="column-3">4.8 GHz</td>
              <td class="column-4">4.8 GHz</td>
              <td class="column-5">3.00 / 4.80 GHz</td>
              <td class="column-6">3.10/4.30 GHz</td>
              <td class="column-7">3.00/4.50 GHz</td>
              <td class="column-8">2.60/4.20 GHz</td>
              <td class="column-9">3.00/3.50 GHz</td>
              <td class="column-10">3.00/3.50 GHz</td>
              <td class="column-11">3.60/4.00 GHz</td>
              <td class="column-12">3.30/3.90 GHz</td>
              <td class="column-13">3.33/3,60 GHz</td>
            </tr>
            <tr class="row-6">
              <td class="column-1">Max Cache</td>
              <td class="column-2">TBD</td>
              <td class="column-3">105 MB L3</td>
              <td class="column-4">105 MB L3</td>
              <td class="column-5">24.75 MB L3</td>
              <td class="column-6">38.5 MB L3</td>
              <td class="column-7">24.75 MB L3</td>
              <td class="column-8">24.75 MB L3</td>
              <td class="column-9">25 MB L3</td>
              <td class="column-10">20 MB L3</td>
              <td class="column-11">15 MB L3</td>
              <td class="column-12">15 MB L3</td>
              <td class="column-13">12 MB L3</td>
            </tr>
            <tr class="row-7">
              <td class="column-1">Max PCI-Express Lanes (CPU)</td>
              <td class="column-2">128 Gen 5</td>
              <td class="column-3">112 Gen 5</td>
              <td class="column-4">112 Gen 5</td>
              <td class="column-5">44 Gen3</td>
              <td class="column-6">44 Gen3</td>
              <td class="column-7">44 Gen3</td>
              <td class="column-8">44 Gen3</td>
              <td class="column-9">40 Gen3</td>
              <td class="column-10">40 Gen3</td>
              <td class="column-11">40 Gen3</td>
              <td class="column-12">40 Gen2</td>
              <td class="column-13">32 Gen2</td>
            </tr>
            <tr class="row-8">
              <td class="column-1">Chipset Compatiblity</td>
              <td class="column-2">W890</td>
              <td class="column-3">W790</td>
              <td class="column-4">W790</td>
              <td class="column-5">X299</td>
              <td class="column-6">C612E</td>
              <td class="column-7">X299</td>
              <td class="column-8">X299</td>
              <td class="column-9">X99 Chipset</td>
              <td class="column-10">X99 Chipset</td>
              <td class="column-11">X79 Chipset</td>
              <td class="column-12">X79 Chipset</td>
              <td class="column-13">X58 Chipset</td>
            </tr>
            <tr class="row-9">
              <td class="column-1">Socket Compatiblity</td>
              <td class="column-2">LGA 4710?</td>
              <td class="column-3">LGA 4677</td>
              <td class="column-4">LGA 4677</td>
              <td class="column-5">LGA 2066</td>
              <td class="column-6">LGA 3647</td>
              <td class="column-7">LGA 2066</td>
              <td class="column-8">LGA 2066</td>
              <td class="column-9">LGA 2011-3</td>
              <td class="column-10">LGA 2011-3</td>
              <td class="column-11">LGA 2011</td>
              <td class="column-12">LGA 2011</td>
              <td class="column-13">LGA 1366</td>
            </tr>
            <tr class="row-10">
              <td class="column-1">Memory Compatiblity</td>
              <td class="column-2">DDR5-6000?</td>
              <td class="column-3">DDR5-4800</td>
              <td class="column-4">DDR5-4800</td>
              <td class="column-5">DDR4-2933</td>
              <td class="column-6">DDR4-2666</td>
              <td class="column-7">DDR4-2800</td>
              <td class="column-8">DDR4-2666</td>
              <td class="column-9">DDR4-2400</td>
              <td class="column-10">DDR4-2133</td>
              <td class="column-11">DDR3-1866</td>
              <td class="column-12">DDR3-1600</td>
              <td class="column-13">DDR3-1066</td>
            </tr>
            <tr class="row-11">
              <td class="column-1">Max TDP</td>
              <td class="column-2">350W?</td>
              <td class="column-3">350W</td>
              <td class="column-4">350W</td>
              <td class="column-5">165W</td>
              <td class="column-6">255W</td>
              <td class="column-7">165W</td>
              <td class="column-8">165W</td>
              <td class="column-9">140W</td>
              <td class="column-10">140W</td>
              <td class="column-11">130W</td>
              <td class="column-12">130W</td>
              <td class="column-13">130W</td>
            </tr>
            <tr class="row-12">
              <td class="column-1">Launch</td>
              <td class="column-2">2025?</td>
              <td class="column-3">2024</td>
              <td class="column-4">2023</td>
              <td class="column-5">Q4 2019</td>
              <td class="column-6">Q4 2018</td>
              <td class="column-7">Q4 2018</td>
              <td class="column-8">Q3 2017</td>
              <td class="column-9">Q2 2016</td>
              <td class="column-10">Q3 2014</td>
              <td class="column-11">Q3 2013</td>
              <td class="column-12">Q4 2011</td>
              <td class="column-13">Q1 2010</td>
            </tr>
            <tr class="row-13">
              <td class="column-1">Launch Price (Top SKU)</td>
              <td class="column-2">TBD</td>
              <td class="column-3">TBD</td>
              <td class="column-4">$5889</td>
              <td class="column-5">$979 US</td>
              <td class="column-6">~$4000 US</td>
              <td class="column-7">$1979 US</td>
              <td class="column-8">$1999 US</td>
              <td class="column-9">$1700 US</td>
              <td class="column-10">$1059 US</td>
              <td class="column-11">$999 US</td>
              <td class="column-12">$999 US</td>
              <td class="column-13">$999 US</td>
            </tr>
          </tbody>
        </table>

      `);
      expect(components.length).toBe(1);
      const component = components.pop() as HTMLTableComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('htmltable');
      expect(component.id).toBe('tablepress-175');
      expect(component.html).toBeDefined();
    }
  );

  test(
    'It should create a simple htmltable component that is inside a figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(`
        <figure class="wp-block-table table-wrapper">
          <table class="has-fixed-layout tablepress">
            <thead>
              <tr>
                <th>Category</th>
                <th>Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>I/O</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Displays</td>
                <td>
                  <strong>DisplayPort 1.4:</strong><br/>- Up to 4K @ 240Hz or
                  8K@60Hz<br/>- Supports HDR, FreeSync, daisy-chaining<br/><strong>HDMI 2.0:
                  </strong><br/>- Up to 4K @ 120Hz<br/>- Supports HDR, FreeSync, CEC
                </td>
              </tr>
              <tr>
                <td>USB</td>
                <td>
                  - Two USB-A 3.2 Gen 1 (front)<br/>- Two USB-A 2.0 High
                  speed (back)<br/>- One USB-C 3.2 Gen 2 (back)
                </td>
              </tr>
              <tr>
                <td>Networking</td>
                <td>Gigabit ethernet</td>
              </tr>
              <tr>
                <td>LED Strip</td>
                <td>
                  17 individually addressable RGB LEDs for system status and
                  customization
                </td>
              </tr>
              <tr>
                <td><strong>Size &amp; Weight</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Size</td>
                <td>
                  152 mm tall (148 mm without feet), 162.4 mm deep, 156 mm
                  wide
                </td>
              </tr>
              <tr>
                <td>Weight</td>
                <td>2.6 kg</td>
              </tr>
              <tr>
                <td><strong>Software</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Operating System</td>
                <td>SteamOS 3 (Arch-based)</td>
              </tr>
              <tr>
                <td>Desktop</td>
                <td>KDE Plasma</td>
              </tr>
              <tr>
                <td><strong>General</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>CPU</td>
                <td>
                  Semi-custom AMD Zen 4 6C/12T<br/>- Up to 4.8 GHz, 30W TDP
                </td>
              </tr>
              <tr>
                <td>GPU</td>
                <td>
                  Semi-custom AMD RDNA3 28CUs<br/>- 2.45GHz max sustained
                  clock, 110W TDP
                </td>
              </tr>
              <tr>
                <td>RAM</td>
                <td>16GB DDR5 + 8GB GDDR6 VRAM</td>
              </tr>
              <tr>
                <td>Power</td>
                <td>Internal power supply, AC 110-240V</td>
              </tr>
              <tr>
                <td>Storage</td>
                <td>
                  Two models:<br/>- 512GB NVMe SSD<br/>- 2TB NVMe SSD<br/>-
                  Both include a high-speed microSD slot
                </td>
              </tr>
              <tr>
                <td><strong>Connectivity</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Wi-Fi</td>
                <td>2x2 Wi-Fi 6E</td>
              </tr>
              <tr>
                <td>Bluetooth</td>
                <td>Bluetooth 5.3 (dedicated antenna)</td>
              </tr>
              <tr>
                <td>Steam Controller</td>
                <td>Integrated 2.4 GHz Steam Controller wireless adapter</td>
              </tr>
            </tbody>
          </table>
        </figure>`);
      expect(components.length).toBe(1);
      const component = components.pop() as HTMLTableComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('htmltable');
      expect(component.html).toBeDefined();
    }
  );
});
