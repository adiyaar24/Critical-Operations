import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { criticalOperationsPlugin, Day2OperationsCard } from '../src/plugin';

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'my-awesome-service',
    namespace: 'production',
    new: {
      source: 'From Ansible AWX',
      ip: '193.333.33.2',
      aditya: '193.333.33.2',
      cool: '193.333.33.2',
      more: '193.333.33.2',
      hello: '193.333.dfd.2'
    },
    additionalInfo: {
      monitoring: {
        dashboard: 'https://grafana.example.com/d/123'
      }
    }
  },
  spec: {
    type: 'service',
    owner: 'team-platform',
    lifecycle: 'production',
  },
};

const DevPage = () => (
  <EntityProvider entity={mockEntity}>
    <div style={{ padding: '20px' }}>
      <h1>Day 2 Operations Plugin Demo</h1>
      
      {/* Single Action Example */}
      <Day2OperationsCard
        title="Single Action (Backwards Compatible)"
        workflowUrl="https://app.harness.io/ng/account/Npsd6WrETY-Baq6iHeOHGw/module/idp/create/templates/default/Simple_Action_Workflow"
        metadataPath="metadata.new"
      />
      
      {/* Multiple Actions Example */}
      <Day2OperationsCard
        title="Multiple Day 2 Actions"
        actions={[
          {
            name: 'Update Service',
            url: 'https://app.harness.io/ng/account/Npsd6WrETY-Baq6iHeOHGw/module/idp/create/templates/default/Update_Service',
            color: 'primary',
            variant: 'contained',
            additionalData: {
              workflow_type: 'update',
              auto_approve: false,
              notification_enabled: true
            }
          },
          {
            name: 'Scale Up',
            url: 'https://app.harness.io/ng/account/Npsd6WrETY-Baq6iHeOHGw/module/idp/create/templates/default/Scale_Service',
            color: 'info',
            variant: 'contained',
            additionalData: {
              workflow_type: 'scale',
              scale_direction: 'up',
              target_replicas: 5
            }
          },
          {
            name: 'Backup',
            url: 'https://app.harness.io/ng/account/Npsd6WrETY-Baq6iHeOHGw/module/idp/create/templates/default/Backup_Service',
            color: 'success',
            variant: 'outlined',
            additionalData: {
              workflow_type: 'backup',
              backup_schedule: 'daily',
              compression: true
            }
          },
          {
            name: 'Delete',
            url: 'https://app.harness.io/ng/account/Npsd6WrETY-Baq6iHeOHGw/module/idp/create/templates/default/Delete_Service',
            color: 'error',
            variant: 'outlined',
            additionalData: {
              workflow_type: 'delete',
              permanent: true,
              backup_before_delete: true
            },
            disableConditions: [
              {
                path: 'metadata.additionalInfo.monitoring.dashboard',
                equals: undefined,
                tooltip: 'Delete disabled - monitoring dashboard not configured'
              }
            ]
          }
        ]}
        metadataPath="metadata.new"
      />
    </div>
  </EntityProvider>
);

createDevApp()
  .registerPlugin(criticalOperationsPlugin)
  .addPage({
    element: <DevPage />,
    title: 'Day 2 Operations Demo',
    path: '/critical-operations'
  })
  .render();
