# Day2OperationsCard Usage Example

Here's how to use the updated `Day2OperationsCard` component with the new `additionalParams` feature:

```tsx
<Day2OperationsCard
  title="Day 2 Operations"
  actions={[
    {
      name: 'Update Service',
      url: 'https://app.harness.io/ng/account/YOUR_ACCOUNT/module/idp/create/templates/default/Update_Template',
      color: 'primary',
      variant: 'contained',
      hiddenData: {
        operation_type: 'update',
        priority: 'high'
      }
    }
  ]}
  metadataPath="metadata.additionalInfo.deployment"
  additionalParams={[
    "metadata.system",  // Uses 'system' as key (legacy format)
    "metadata.additionalInfo.abc",  // Uses 'abc' as key (legacy format)
    { path: "spec.owner", key: "team_owner" },  // Uses 'team_owner' as key
    { path: "metadata.namespace", key: "k8s_namespace" }  // Uses 'k8s_namespace' as key
  ]}
/>
```

## What's New

1. **Enhanced `additionalParams` property**: Now supports both legacy string format and new object format with configurable keys
2. **Configurable Keys**: You can now specify custom keys for form data instead of automatically using the last path segment
3. **Backwards Compatibility**: Existing string format still works as before

## How `additionalParams` Works

The `additionalParams` array now supports two formats:

### Legacy String Format
- Each string path is resolved from the entity metadata
- The last segment of the path becomes the key in the form data
- Example: `"metadata.system"` adds a `system` key to the form data

### New Object Format
- Use `{ path: "metadata.path", key: "custom_key" }` to specify custom keys
- The `path` is resolved from entity metadata
- The `key` becomes the key in the form data
- Example: `{ path: "spec.owner", key: "team_owner" }` adds a `team_owner` key

### Priority Order
Form data is merged in this order (later entries override earlier ones for the same key):
1. Base metadata from `metadataPath`
2. Additional parameters from `additionalParams` 
3. Action-specific `hiddenData`

### Example Form Data Output
Given the example above, the form data might look like:
```json
{
  "environment": "production",  // From metadataPath
  "replicas": 3,               // From metadataPath  
  "system": "my-system",       // From "metadata.system"
  "abc": "some-value",         // From "metadata.additionalInfo.abc"
  "team_owner": "platform",    // From spec.owner with custom key
  "k8s_namespace": "default",  // From metadata.namespace with custom key
  "operation_type": "update",  // From hiddenData
  "priority": "high"           // From hiddenData
}
```