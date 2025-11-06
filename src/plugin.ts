import { createPlugin, createComponentExtension } from '@backstage/core-plugin-api';

export const criticalOperationsPlugin = createPlugin({
  id: 'critical-operations',
});

export const Day2OperationsCard = criticalOperationsPlugin.provide(
  createComponentExtension({
    name: 'Day2OperationsCard',
    component: {
      lazy: () => 
        import('./components/Day2OperationsCard').then(m => m.Day2OperationsCard),
    },
  }),
);
