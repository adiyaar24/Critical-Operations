# Backstage Critical Operations Plugin

🚀 A Backstage plugin that seamlessly integrates Day 2 operations with Harness workflows by automatically pre-filling forms with entity metadata.

## ✨ Features

- 🎯 **Smart Metadata Resolution** - Automatically extracts data from entity metadata paths with flexible path resolution
- 🔗 **Pre-filled Workflow Integration** - Generates URLs that auto-populate Harness workflow forms  
- 🎨 **Multiple Action Support** - Configure multiple operations with custom styling and conditional logic
- 🔒 **Per-Action Data** - Include action-specific data and parameters for granular control
- 📝 **Global & Action Parameters** - Pull metadata from custom paths with configurable keys
- 🔄 **Advanced Array Handling** - Sophisticated array processing with multiple extraction strategies
- 🚫 **Conditional Disabling** - Disable actions based on metadata conditions with tooltips
- ⚡ **Instant Execution** - Direct workflow execution without confirmation dialogs
- 🔧 **Backward Compatibility** - Supports legacy single workflow URL format

## 🚀 Quick Start

### Basic Usage
```tsx
import { Day2OperationsCard } from '@adiyaar/backstage-plugin-critical-operations';

<Day2OperationsCard
  title="Service Operations"
  actions={[
    {
      name: 'Update Service',
      url: 'https://app.harness.io/ng/account/YOUR_ACCOUNT/module/idp/create/templates/default/Update_Template',
      color: 'primary',
      variant: 'contained'
    }
  ]}
  metadataPath="metadata.additionalInfo.deployment"
/>
```

### Advanced Usage with Global Parameters and Conditional Actions
```tsx
<Day2OperationsCard
  title="Infrastructure Operations"
  actions={[
    {
      name: 'Scale Service',
      url: 'https://app.harness.io/.../Scale_Template',
      color: 'success',
      variant: 'contained',
      additionalData: {
        operation_type: 'scale',
        priority: 'high'
      },
      additionalParams: [
        { path: "metadata.additionalInfo.scaling.maxReplicas", key: "max_replicas" }
      ]
    },
    {
      name: 'Delete Service',
      url: 'https://app.harness.io/.../Delete_Template',
      color: 'error',
      variant: 'outlined',
      additionalData: {
        operation_type: 'delete',
        confirmation_required: true
      },
      disableConditions: [{
        path: "metadata.additionalInfo.deployment.environment",
        equals: "production",
        tooltip: "Cannot delete production services"
      }]
    }
  ]}
  metadataPath="metadata.additionalInfo.deployment"
  globalParams={[
    "spec.system",
    "metadata.identifier",
    { path: "spec.owner", key: "team_owner" },
    { path: "metadata.namespace", key: "k8s_namespace" },
    "catalog:component_type"
  ]}
  arrayHandling={{
    extractProperties: true,
    extractionStrategy: "first",
    includeOriginalArrayKey: true
  }}
/>
```

## 📋 API Reference

### Day2OperationsCardProps

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `title` | `string` | `"Day 2 Operations"` | ❌ | Display title for the operations card |
| `workflowUrl` | `string` | - | ❌ | Single workflow URL (legacy support) |
| `actions` | `WorkflowAction[]` | - | ❌ | Array of workflow operations to display |
| `metadataPath` | `string` | - | ✅ | Root path for metadata extraction (e.g., "metadata.new") |
| `globalParams` | `(string \| {path: string, key: string})[]` | - | ❌ | Global metadata paths included in all actions |
| `autoSelectFirstElement` | `boolean` | `true` | ❌ | Auto-select first element from arrays |
| `arrayHandling` | `ArrayHandling` | - | ❌ | Advanced array processing configuration |

### WorkflowAction Interface

```typescript
interface WorkflowAction {
  name: string;                    // Button display name
  url: string;                     // Harness workflow URL
  color?: 'primary' | 'secondary'  // Button color theme
    | 'success' | 'error' 
    | 'info' | 'warning';
  variant?: 'contained'            // Button style variant
    | 'outlined' | 'text';
  additionalData?: Record<string, any>;  // Action-specific data (overrides metadata)
  additionalParams?: (string | { path: string; key: string })[]; // Per-action metadata paths
  disableConditions?: DisableCondition[]; // Conditions to disable this action
  disabledTooltip?: string;        // General tooltip when disabled
}
```

### DisableCondition Interface

```typescript
interface DisableCondition {
  path: string;           // Metadata path to check (e.g., "metadata.deployment.state")
  equals?: any;           // Disable if value equals this
  notEquals?: any;        // Disable if value does not equal this
  in?: any[];            // Disable if value is in this array
  notIn?: any[];         // Disable if value is not in this array
  tooltip?: string;       // Tooltip when disabled due to this condition
}
```

### ArrayHandling Interface

```typescript
interface ArrayHandling {
  extractProperties?: boolean;     // Extract individual properties from array elements
  extractionStrategy?: 'first' | 'last' | 'mostCommon' | 'index'; // Which element to use
  extractionIndex?: number;        // Specific index when strategy is 'index'
  extractOnlyCommonValues?: boolean; // Only extract properties common to all elements
  includeOriginalArrayKey?: boolean; // Include original array key alongside extracted properties
}
```

## 🔧 Configuration Examples

### Entity YAML Setup
Your Backstage entity should have metadata structured like this:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  identifier: service_123
  additionalInfo:
    deployment:
      environment: production
      region: us-east-1
spec:
  system:
    - system:my-org/my-system
  owner: team-platform
```

### Accessing Nested Data

| Path Configuration | Result | Key in Form Data | Notes |
|---------------------|--------|------------------|--------|
| `"metadata.identifier"` | `"service_123"` | `identifier` | Last path segment as key |
| `"spec.system"` | `"system:my-org/my-system"` | `system` | First element (autoSelect) |
| `{path: "spec.owner", key: "team_owner"}` | `"team-platform"` | `team_owner` | Custom key |
| `"catalog:component_type"` | `"component_type"` | `component_type` | Direct catalog value |
| `metadata.additionalInfo.deployment` | `{environment: "production", region: "us-east-1"}` | Spreads all keys | Object spread |

## 🎛️ Advanced Features

### Parameter Types and Scoping

The component supports three types of parameters:
- **Global Parameters (`globalParams`)**: Applied to all actions
- **Per-Action Parameters (`additionalParams`)**: Specific to individual actions  
- **Additional Data (`additionalData`)**: Static key-value pairs for actions

```typescript
// Global parameters - applied to all actions
globalParams: [
  "spec.system",  // Legacy format
  { path: "spec.owner", key: "team_owner" },  // Custom key
  "catalog:service_type"  // Direct catalog value
]

// Per-action parameters - only for specific actions
actions: [{
  name: "Scale Service",
  url: "https://...",
  additionalParams: [
    { path: "metadata.scaling.maxReplicas", key: "max_replicas" }
  ],
  additionalData: {
    operation_type: "scale",
    priority: "high"
  }
}]
```

### Advanced Array Handling

Configure sophisticated array processing with the `arrayHandling` prop:

```typescript
arrayHandling={{
  extractProperties: true,        // Extract individual properties from array elements
  extractionStrategy: "first",    // Which element: first, last, mostCommon, index
  extractionIndex: 0,            // Specific index when strategy is 'index'
  extractOnlyCommonValues: true, // Only extract properties common to all elements
  includeOriginalArrayKey: true  // Include original array alongside extracted properties
}}
```

**Example**: Entity has `entries: [{ name: "app1", port: 8080 }, { name: "app2", port: 8080 }]`

```typescript
// With extractProperties: true, extractOnlyCommonValues: true
// Result: { entries: [...], port: 8080 }  // 'name' excluded (different values)

// With extractionStrategy: "last"
// Result: { entries: [...], name: "app2", port: 8080 }
```

### Conditional Action Disabling

Disable actions based on entity metadata conditions:

```typescript
disableConditions: [
  {
    path: "metadata.environment",
    equals: "production",
    tooltip: "Cannot delete production services"
  },
  {
    path: "metadata.status",
    in: ["archived", "deprecated"],
    tooltip: "Service is not active"
  },
  {
    path: "spec.lifecycle",
    notEquals: "experimental",
    tooltip: "Only experimental services can use this feature"
  }
]
```

### Data Merge Priority
Form data is merged in this order (later overrides earlier):
1. Base metadata from `metadataPath`  
2. Extracted array properties (if `arrayHandling.extractProperties` is true)
3. Global parameters from `globalParams`
4. Per-action parameters from `additionalParams`
5. Action-specific `additionalData`

### Generated Workflow URLs
The plugin creates URLs in this format:
```
https://app.harness.io/.../templates/My_Template?formData=%7B...%7D
```

Where `formData` contains URL-encoded JSON with all the resolved metadata.

## 🏗️ How It Works

```mermaid
flowchart LR
    A[Entity Metadata] --> B[Extract Base Data]
    C[Additional Params] --> B
    B --> D[Auto-select Arrays]
    D --> E[Merge Hidden Data]
    E --> F[Encode as URL]
    F --> G[Open Harness Workflow]
```

1. **Extract** metadata from the specified `metadataPath`
2. **Process** arrays based on `arrayHandling` configuration
3. **Include** global parameters from `globalParams` 
4. **Include** per-action parameters from `additionalParams`
5. **Merge** with action-specific `additionalData`
6. **Encode** everything as a URL parameter
7. **Launch** the Harness workflow with pre-filled forms

## 🎯 Complete Real-World Example

For a service with this metadata:
```yaml
metadata:
  identifier: payment-service
  additionalInfo:
    deployment:
      replicas: 3
      environment: production
      entries:
        - name: payment-api
          port: 8080
          protocol: http
        - name: payment-worker  
          port: 9090
          protocol: grpc
spec:
  system: ["system:payments/core"]
  owner: team-payments
```

Using this configuration:
```tsx
<Day2OperationsCard
  metadataPath="metadata.additionalInfo.deployment"
  globalParams={[
    "metadata.identifier",
    { path: "spec.owner", key: "team_owner" },
    "catalog:service_type"
  ]}
  arrayHandling={{
    extractProperties: true,
    extractionStrategy: "first",
    extractOnlyCommonValues: false,
    includeOriginalArrayKey: true
  }}
  actions={[{
    name: "Update Service",
    additionalParams: [
      { path: "spec.system", key: "primary_system" }
    ],
    additionalData: {
      operation: "update",
      priority: "normal"
    }
  }]}
/>
```

Results in this form data:
```json
{
  "replicas": 3,
  "environment": "production", 
  "entries": [...],
  "name": "payment-api",
  "port": 8080,
  "protocol": "http",
  "identifier": "payment-service",
  "team_owner": "team-payments",
  "service_type": "service_type",
  "primary_system": "system:payments/core",
  "operation": "update",
  "priority": "normal"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
