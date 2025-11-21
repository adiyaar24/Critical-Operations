# Day2OperationsCard Usage Examples

A comprehensive guide to using the `Day2OperationsCard` component with detailed examples and explanations.

## 📋 Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Configuration](#advanced-configuration)
- [Parameter Types](#parameter-types)
- [Array Handling](#array-handling)
- [Conditional Actions](#conditional-actions)
- [Real-World Scenarios](#real-world-scenarios)
- [Troubleshooting](#troubleshooting)

## Basic Usage

### Simple Single Action

```tsx
import { Day2OperationsCard } from '@adiyaar/backstage-plugin-critical-operations';

<Day2OperationsCard
  title="Service Operations"
  actions={[
    {
      name: 'Deploy Service',
      url: 'https://app.harness.io/ng/account/YOUR_ACCOUNT/module/idp/create/templates/default/Deploy_Template',
      color: 'primary',
      variant: 'contained'
    }
  ]}
  metadataPath="metadata.additionalInfo.deployment"
/>
```

**What this does:**
- Displays a card titled "Service Operations"
- Shows a blue "Deploy Service" button
- Extracts all key-value pairs from `metadata.additionalInfo.deployment`
- Generates a Harness workflow URL with the extracted data

## Advanced Configuration

### Multiple Actions with Global Parameters

```tsx
<Day2OperationsCard
  title="Infrastructure Management"
  metadataPath="metadata.additionalInfo.config"
  globalParams={[
    "metadata.name",                              // Key: name
    "metadata.namespace",                         // Key: namespace  
    { path: "spec.owner", key: "team_owner" },   // Key: team_owner
    { path: "spec.system", key: "system_id" },   // Key: system_id
    "catalog:component_type"                      // Key: component_type (direct value)
  ]}
  autoSelectFirstElement={true}
  actions={[
    {
      name: 'Scale Up',
      url: 'https://app.harness.io/.../Scale_Template',
      color: 'success',
      variant: 'contained',
      additionalData: {
        operation_type: 'scale',
        direction: 'up'
      }
    },
    {
      name: 'Scale Down', 
      url: 'https://app.harness.io/.../Scale_Template',
      color: 'warning',
      variant: 'outlined',
      additionalData: {
        operation_type: 'scale',
        direction: 'down'
      }
    },
    {
      name: 'Restart Service',
      url: 'https://app.harness.io/.../Restart_Template',
      color: 'info',
      variant: 'contained'
    }
  ]}
/>
```

**Key Features Explained:**

- **`globalParams`**: Applied to ALL actions - saves repetition
- **`additionalData`**: Action-specific static data that overrides metadata
- **`autoSelectFirstElement: true`**: Arrays like `spec.system: ["sys1", "sys2"]` become `"sys1"`
- **`catalog:` prefix**: Direct values (not metadata paths)

## Parameter Types

### 1. Global Parameters (`globalParams`)
Applied to ALL actions in the card.

```tsx
globalParams={[
  "metadata.identifier",                        // Uses last path segment as key
  { path: "spec.owner", key: "service_owner" }, // Custom key
  "catalog:service_category"                    // Direct catalog value
]}
```

### 2. Per-Action Parameters (`additionalParams`)  
Applied only to specific actions with optional array conversion.

```tsx
actions={[
  {
    name: 'Update Database',
    url: 'https://...',
    additionalParams: [
      "metadata.database.connectionString",      // Key: connectionString
      { path: "metadata.database.port", key: "db_port" },  // Key: db_port
      { path: "metadata.resourceConfig", key: "entries_update", sendAsArray: true }  // Convert to array
    ],
    additionalData: {
      operation: 'update_schema',
      backup_required: true
    }
  }
]}
```

### 3. Additional Data (`additionalData`)
Static key-value pairs specific to each action.

```tsx
additionalData: {
  operation_type: 'deployment',    // Always includes this
  priority: 'high',               // Always includes this 
  environment: 'production'       // Always includes this
}
```

## Array Handling

Configure how arrays and objects are processed:

### Basic Array Handling

```tsx
// Entity metadata:
// metadata.services = ["api-service", "worker-service", "cache-service"]

// Default behavior (autoSelectFirstElement: true)
globalParams: ["metadata.services"]
// Result: { services: "api-service" }

// Get full array  
autoSelectFirstElement: false
globalParams: ["metadata.services"]
// Result: { services: ["api-service", "worker-service", "cache-service"] }
```

### Converting Objects to Arrays

```tsx
// Entity metadata:
// metadata.resourceConfig = { type: "s3", region: "us-west-2", name: "my-bucket" }

// Default behavior
additionalParams: [{ path: "metadata.resourceConfig", key: "config" }]
// Result: { config: { type: "s3", region: "us-west-2", name: "my-bucket" } }

// With sendAsArray: true
additionalParams: [{ path: "metadata.resourceConfig", key: "entries_update", sendAsArray: true }]
// Result: { entries_update: [{ type: "s3", region: "us-west-2", name: "my-bucket" }] }
```

### Flexible Array Conversion

The `sendAsArray` flag provides fine-grained control over which parameters become arrays:

```tsx
globalParams: [
  "metadata.identifier",  // String value
  { path: "metadata.resourceConfig", key: "entries_update", sendAsArray: true },  // Array conversion
  { path: "spec.owner", key: "team_owner" }  // String value
]

// Results in form data like:
// {
//   "identifier": "my-service",
//   "entries_update": [{ type: "s3", region: "us-west-2" }],
//   "team_owner": "platform-team"
// }
```

## Conditional Actions

Disable actions based on entity metadata conditions:

### Single Condition

```tsx
actions={[
  {
    name: 'Delete Service',
    url: 'https://...',
    color: 'error',
    disableConditions: [{
      path: "metadata.environment",
      equals: "production",
      tooltip: "Cannot delete production services"
    }]
  }
]}
```

### Multiple Conditions

```tsx
disableConditions: [
  {
    path: "metadata.status",
    in: ["archived", "deprecated"], 
    tooltip: "Service is not active"
  },
  {
    path: "spec.lifecycle", 
    notEquals: "experimental",
    tooltip: "Only experimental services can use this operation"
  },
  {
    path: "metadata.replicas",
    equals: 0,
    tooltip: "Service has no running instances"
  }
]
```

#### Condition Types

- **`equals`**: Disable if value equals specified value
- **`notEquals`**: Disable if value does NOT equal specified value
- **`in`**: Disable if value is in the specified array
- **`notIn`**: Disable if value is NOT in the specified array

## Real-World Scenarios

### Scenario 1: Microservices Management

```tsx
// Entity metadata structure:
metadata:
  name: payment-service
  namespace: payments
  additionalInfo:
    deployment:
      replicas: 3
      environment: staging
      resources:
        cpu: "500m"
        memory: "1Gi"
    monitoring:
      enabled: true
      alerts: ["high-cpu", "memory-leak"]
spec:
  owner: team-payments
  system: ["system:fintech/payments"]
```

```tsx
<Day2OperationsCard
  title="Payment Service Operations"
  globalParams={[
    "metadata.name", 
    "metadata.namespace",
    { path: "spec.owner", key: "responsible_team" },
    { path: "spec.system", key: "system_id" }
  ]}
  actions={[
    {
      name: 'Scale Service',
      url: 'https://harness.io/.../scale',
      color: 'primary',
      additionalParams: [
        { path: "metadata.additionalInfo.deployment.resources", key: "current_resources" },
        { path: "metadata.additionalInfo.deployment", key: "entries_update", sendAsArray: true }
      ],
      additionalData: { 
        operation: 'horizontal_scaling' 
      }
    },
    {
      name: 'Update Configuration', 
      url: 'https://harness.io/.../update-config',
      color: 'info',
      additionalData: { 
        operation: 'config_update',
        requires_restart: false 
      }
    },
    {
      name: 'Promote to Production',
      url: 'https://harness.io/.../promote',
      color: 'success', 
      disableConditions: [{
        path: "metadata.additionalInfo.deployment.environment",
        equals: "production",
        tooltip: "Service is already in production"
      }],
      additionalData: {
        operation: 'environment_promotion',
        target_environment: 'production'
      }
    }
  ]}
/>
```

**Generated Form Data:**
```json
{
  "name": "payment-service",
  "namespace": "payments", 
  "responsible_team": "team-payments",
  "system_id": "system:fintech/payments",
  "current_resources": { "cpu": "500m", "memory": "1Gi" },
  "entries_update": [{
    "replicas": 3,
    "environment": "staging",
    "resources": { "cpu": "500m", "memory": "1Gi" }
  }],
  "operation": "horizontal_scaling"
}
```

### Scenario 2: Database Operations

```tsx
// Entity with database configuration array:
metadata:
  additionalInfo:
    databases:
      - name: primary-db
        type: postgresql
        version: "13"
        port: 5432
        ssl: true
      - name: cache-db  
        type: redis
        version: "6"
        port: 6379
        ssl: false
```

```tsx
<Day2OperationsCard
  title="Database Operations"
  globalParams={[
    { path: "metadata.additionalInfo.databases", key: "databases_config", sendAsArray: false }
  ]}
  actions={[
    {
      name: 'Backup Database',
      url: 'https://harness.io/.../backup',
      additionalParams: [
        { path: "metadata.additionalInfo.databases", key: "entries_backup", sendAsArray: true }
      ],
      additionalData: {
        backup_type: 'full',
        compression: true
      }
    },
    {
      name: 'Update SSL Certificate',
      url: 'https://harness.io/.../ssl-update', 
      additionalParams: [
        { path: "metadata.additionalInfo.databases", key: "entries_ssl", sendAsArray: true }
      ],
      disableConditions: [{
        path: "metadata.additionalInfo.databases.0.ssl",
        equals: false,
        tooltip: "SSL is not enabled on primary database"
      }]
    }
  ]}
/>
```

## Troubleshooting

### Common Issues

#### 1. "No metadata found at path"
```tsx
// ❌ Wrong - path doesn't exist
metadataPath="metadata.nonexistent.path"

// ✅ Correct - verify path in entity YAML first
metadataPath="metadata.additionalInfo.deployment"
```

#### 2. Empty form data
```tsx
// ❌ Wrong - empty object or null at metadataPath
metadata:
  additionalInfo:
    deployment: {}

// ✅ Correct - ensure metadata has actual data
metadata:
  additionalInfo:
    deployment:
      environment: production
      replicas: 3
```

#### 3. Arrays not processing correctly
```tsx
// ❌ Wrong - autoSelectFirstElement disabled but expecting single value
autoSelectFirstElement: false
globalParams: ["spec.system"]  // Results in array

// ✅ Correct - enable autoSelectFirstElement for single values  
autoSelectFirstElement: true
globalParams: ["spec.system"]   // Results in first element
```

#### 4. Conditions not working
```tsx
// ❌ Wrong - path doesn't resolve to expected value
disableConditions: [{
  path: "metadata.environment",  // Should be metadata.additionalInfo.deployment.environment
  equals: "production"
}]

// ✅ Correct - full path to the actual value
disableConditions: [{
  path: "metadata.additionalInfo.deployment.environment", 
  equals: "production"
}]
```

### Debug Tips

1. **Check entity metadata**: Verify paths exist in your entity YAML
2. **Use browser devtools**: Inspect generated URLs to see form data
3. **Test with simple config**: Start basic, then add complexity
4. **Verify condition paths**: Ensure disable condition paths resolve correctly

### Data Precedence Reminder

Form data merging order (later overrides earlier):
1. Global parameters from `globalParams`
2. Per-action parameters from `additionalParams`
3. Action-specific `additionalData`

**Array Conversion**: The `sendAsArray` flag is applied during parameter processing, ensuring values are converted before merging.

This allows fine-grained control over what data gets sent to workflows.