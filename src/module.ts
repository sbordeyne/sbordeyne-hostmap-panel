import { PanelPlugin } from '@grafana/data';
import { LayoutMode, PanelOptions, ZoomMode } from './types';
import { HostmapPanel } from './components/HostmapPanel';
import { initPluginTranslations, t } from '@grafana/i18n';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id);


export const plugin = new PanelPlugin<PanelOptions>(HostmapPanel)
  .useFieldConfig({})
  .setPanelOptions((builder) => {
  const category = ['Hostmap'];
  builder
    .addSliderInput({
      path: 'hostsPerRow',
      category,
      name: t('panel.options.hostsPerRow.name', 'Number of hosts displayed per row'),
      description: t('panel.options.hostsPerRow.description', 'Number of hosts to display in each row of the hostmap'),
      defaultValue: 5,
      settings: {
        min: 1,
        max: 20,
        step: 1,
      },
    })
    .addSelect({
      path: 'groupByLabel',
      name: t('panel.options.groupByLabel.name', 'Group by label'),
      category,
      description: t('panel.options.groupByLabel.description', 'Label to group hosts by in the hostmap'),
      defaultValue: '',
      settings: {
        options: [],
        getOptions: async (context) => {
          const labelSet = new Set<string>();
          const dataFrame = context.data[0];
          if (!dataFrame) {
            return [{ value: '', label: t('panel.options.groupByLabel.defaultValueLabel', 'No grouping') }];
          }
          dataFrame.fields.forEach((field) => {
            if (field.labels) {
              Object.keys(field.labels).forEach((label) => {
                labelSet.add(label);
              });
            }
          });
          const options = Array.from(labelSet).map((label) => ({
            value: label,
            label: label,
          }));
          options.unshift({ value: '', label: t('panel.options.groupByLabel.defaultValueLabel', 'No grouping') });
          return options;
        },
      }
    })
    .addNumberInput({
      path: 'hexSpacing',
      category,
      name: t('panel.options.hexSpacing.name', 'Hexagon Spacing'),
      description: t('panel.options.hexSpacing.description', 'Spacing between hexagons in the hostmap'),
      defaultValue: 10,
    })
    .addSelect({
      path: 'zoomMode',
      category,
      name: t('panel.options.zoomMode.name', 'Zoom Mode'),
      description: t('panel.options.zoomMode.description', 'Select the zoom interaction mode'),
      defaultValue: ZoomMode.Cooperative,
      settings: {
        options: [
          { value: ZoomMode.Cooperative, label: t('panel.options.zoomMode.enum.cooperative', 'Cooperative') },
          { value: ZoomMode.Greedy, label: t('panel.options.zoomMode.enum.greedy', 'Greedy') },
        ],
      },
    })
    .addSelect({
      path: 'layoutMode',
      category,
      name: t('panel.options.layoutMode.name', 'Layout Mode'),
      description: t('panel.options.layoutMode.description', 'Select the layout mode for the hostmap'),
      defaultValue: 'wide',
      settings: {
        options: [
          { value: LayoutMode.Wide, label: t('panel.options.layoutMode.enum.wide', 'Wide') },
        ],
      },
    });
});
