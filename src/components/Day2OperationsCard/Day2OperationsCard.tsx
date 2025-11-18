import React, { useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { 
  Typography, 
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Launch as LaunchIcon
} from '@mui/icons-material';

interface WorkflowAction {
  name: string;
  url: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  additionalData?: Record<string, any>; // Additional key-value pairs to append to form data for this action
  additionalParams?: (string | { path: string; key: string })[]; // Per-action metadata paths to include in form data
  disableConditions?: {
    path: string; // Path to metadata value to check (e.g., "metadata.deployment.state")
    equals?: any; // Disable if value equals this
    notEquals?: any; // Disable if value does not equal this
    in?: any[]; // Disable if value is in this array
    notIn?: any[]; // Disable if value is not in this array
    tooltip?: string; // Tooltip message to show when button is disabled due to this condition
  }[];
  disabledTooltip?: string; // General tooltip when button is disabled (used if condition doesn't have specific tooltip)
}

export interface Day2OperationsCardProps {
  title?: string;
  workflowUrl?: string; // Single workflow URL (backwards compatibility)
  actions?: WorkflowAction[]; // Multiple workflow actions
  metadataPath: string; // Root path for metadata extraction (e.g., "metadata.new")
  globalParams?: (string | { path: string; key: string })[]; // Global metadata paths to include in form data for all actions
  autoSelectFirstElement?: boolean; // Auto-select first element of arrays (default: true)
  arrayHandling?: {
    extractProperties?: boolean; // Whether to extract individual properties from array elements for global field pre-population
    extractionStrategy?: 'first' | 'last' | 'mostCommon' | 'index'; // Which element to use for extraction
    extractionIndex?: number; // Specific index to use when strategy is 'index'
    extractOnlyCommonValues?: boolean; // Only extract properties that are the same across all elements
    includeOriginalArrayKey?: boolean; // Whether to include the original array key (e.g., "entries") alongside entries_* keys
  };
}

export function Day2OperationsCard({
  title = "Day 2 Operations",
  workflowUrl,
  actions,
  metadataPath,
  globalParams,
  autoSelectFirstElement = true,
  arrayHandling
}: Day2OperationsCardProps) {
  const { entity } = useEntity();
  const [loading, setLoading] = useState<string | null>(null);

  // Function to resolve metadata path dynamically
  const resolveMetadataValue = (path: string): any => {
    if (!entity) return null;
    
    const keys = path.split('.');
    let current: any = entity;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  };

  // Function to build form data from entity metadata
  const buildFormData = (action: WorkflowAction): Record<string, any> => {
    const formData: Record<string, any> = {};
    
    // Extract all key-value pairs from the specified metadata path
    const metadataData = resolveMetadataValue(metadataPath);
    if (metadataData && typeof metadataData === 'object') {
      if (Array.isArray(metadataData)) {
        // If metadataPath points to an array, use the last segment of the path as the key
        const pathSegments = metadataPath.split('.');
        const arrayKey = pathSegments[pathSegments.length - 1] || 'data';
        
        // Include original array key if configured to do so (default: true for backward compatibility)
        if (arrayHandling?.includeOriginalArrayKey !== false) {
          formData[arrayKey] = metadataData;
        }
        
        // Handle array property extraction based on configuration
        if (arrayHandling?.extractProperties && metadataData.length > 0) {
          let elementToExtract: any = null;
          
          // Determine which element to extract properties from
          switch (arrayHandling.extractionStrategy) {
            case 'first':
              elementToExtract = metadataData[0];
              break;
            case 'last':
              elementToExtract = metadataData[metadataData.length - 1];
              break;
            case 'index':
              if (arrayHandling.extractionIndex !== undefined && arrayHandling.extractionIndex < metadataData.length) {
                elementToExtract = metadataData[arrayHandling.extractionIndex];
              }
              break;
            case 'mostCommon':
              // Implementation for most common values would go here
              elementToExtract = metadataData[0]; // Fallback to first
              break;
            default:
              elementToExtract = metadataData[0]; // Default to first
          }
          
          // Extract properties from the selected element
          if (elementToExtract && typeof elementToExtract === 'object') {
            Object.entries(elementToExtract).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                let shouldExtract = true;
                
                // If extractOnlyCommonValues is true, check if all elements have the same value
                if (arrayHandling.extractOnlyCommonValues) {
                  shouldExtract = metadataData.every(item => 
                    item && typeof item === 'object' && item[key] === value
                  );
                }
                
                if (shouldExtract) {
                  formData[key] = value;
                }
              }
            });
          }
        }
      } else {
        // Add all key-value pairs to formData for objects
        Object.entries(metadataData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData[key] = value;
          }
        });
      }
    }
    
    // Process global parameters (apply to all actions)
    const processParams = (params: (string | { path: string; key: string })[] | undefined) => {
      if (!params) return;
      
      params.forEach(param => {
        let paramPath: string;
        let key: string;
        
        if (typeof param === 'string') {
          // Handle both catalog.yaml values and metadata paths
          if (param.startsWith('catalog:')) {
            // Direct value from catalog.yaml: "catalog:someValue"
            const catalogValue = param.substring(8); // Remove "catalog:" prefix
            key = catalogValue;
            formData[key] = catalogValue;
            return;
          } else {
            // Metadata path: use the last part of the path as the key
            paramPath = param;
            key = param.split('.').pop() || param;
          }
        } else {
          // Object format: { path: string; key: string }
          if (param.path.startsWith('catalog:')) {
            // Direct value from catalog.yaml
            const catalogValue = param.path.substring(8);
            formData[param.key] = catalogValue;
            return;
          } else {
            // Metadata path
            paramPath = param.path;
            key = param.key;
          }
        }
        
        const paramValue = resolveMetadataValue(paramPath);
        if (paramValue !== null && paramValue !== undefined) {
          // Auto-select first element if it's an array and autoSelectFirstElement is true
          if (autoSelectFirstElement && Array.isArray(paramValue) && paramValue.length > 0) {
            formData[key] = paramValue[0];
          } else {
            formData[key] = paramValue;
          }
        }
      });
    };

    // Add global parameters (apply to all actions)
    processParams(globalParams);
    
    // Add per-action parameters (specific to this action)
    processParams(action.additionalParams);
    
    // Add additional data specific to this action (will override metadata and params if same key exists)
    if (action.additionalData) {
      Object.entries(action.additionalData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData[key] = value;
        }
      });
    }
    
    // CRITICAL FIX: Ensure component_name is always an array for component entities
    if (formData.source === 'component' && formData.component_name && !Array.isArray(formData.component_name)) {
      formData.component_name = [formData.component_name];
    }
      

    // Map resourceConfig to entries_* format for component entities
    if (formData.source === 'component' && formData.action && metadataData && !Array.isArray(metadataData)) {
      const action = formData.action;
      const entriesKey = `entries_${action}`;
      
      // Use the entire metadataData (resourceConfig) as the array element
      formData[entriesKey] = [metadataData];
    }
    
    return formData;
  };

  // Function to encode form data for URL
  const encodeFormData = (data: Record<string, any>): string => {
    const jsonString = JSON.stringify(data);
    return encodeURIComponent(jsonString);
  };

  // Function to build workflow URL
  const buildWorkflowUrl = (baseUrl: string, action: WorkflowAction): string => {
    const formData = buildFormData(action);
    const encodedFormData = encodeFormData(formData);
    
    return `${baseUrl}?formData=${encodedFormData}`;
  };

  // Function to check if action should be disabled and get tooltip
  const getActionDisableState = (action: WorkflowAction): { disabled: boolean; tooltip?: string } => {
    if (!action.disableConditions) return { disabled: false };
    
    for (const condition of action.disableConditions) {
      const value = resolveMetadataValue(condition.path);
      let conditionMet = false;
      
      // Check equals condition
      if (condition.equals !== undefined) {
        conditionMet = value === condition.equals;
      }
      // Check notEquals condition
      else if (condition.notEquals !== undefined) {
        conditionMet = value !== condition.notEquals;
      }
      // Check in condition
      else if (condition.in !== undefined) {
        conditionMet = condition.in.includes(value);
      }
      // Check notIn condition
      else if (condition.notIn !== undefined) {
        conditionMet = !condition.notIn.includes(value);
      }
      
      if (conditionMet) {
        return { 
          disabled: true, 
          tooltip: condition.tooltip || action.disabledTooltip || 'Action not available'
        };
      }
    }
    
    return { disabled: false };
  };

  // Function to handle operation execution
  const handleOperation = async (action: WorkflowAction) => {
    const disableState = getActionDisableState(action);
    if (disableState.disabled) return; // Don't execute if disabled
    
    const url = buildWorkflowUrl(action.url, action);
    executeOperation(url, action.name);
  };

  const executeOperation = (url: string, actionName: string) => {
    setLoading(actionName);
    window.open(url, '_blank');
    
    // Simulate some loading time for UX
    setTimeout(() => {
      setLoading(null);
    }, 1000);
  };

  // Check if metadata path has data
  const metadataData = resolveMetadataValue(metadataPath);
  const hasData = metadataData && typeof metadataData === 'object' && Object.keys(metadataData).length > 0;

  // Determine which actions to show
  const actionsToShow: WorkflowAction[] = [];
  
  if (actions && actions.length > 0) {
    // Use provided actions
    actionsToShow.push(...actions);
  } else if (workflowUrl) {
    // Backwards compatibility: single workflow URL
    actionsToShow.push({
      name: 'Open Workflow',
      url: workflowUrl,
      color: 'primary',
      variant: 'contained'
    });
  }

  if (!hasData) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Alert severity="info">
            No metadata found at path: <code>{metadataPath}</code>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (actionsToShow.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Alert severity="warning">
            No workflow actions configured. Please provide either <code>workflowUrl</code> or <code>actions</code> prop.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            {title}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {actionsToShow.map((action, index) => {
              const disableState = getActionDisableState(action);
              const isDisabled = loading !== null || disableState.disabled;
              
              const buttonElement = (
                <Button
                  variant={action.variant || 'contained'}
                  color={action.color || 'primary'}
                  fullWidth
                  startIcon={loading === action.name ? <CircularProgress size={20} /> : <LaunchIcon />}
                  disabled={isDisabled}
                  onClick={() => handleOperation(action)}
                  sx={{ py: 1.5 }}
                >
                  {action.name}
                </Button>
              );
              
              return (
                <Grid item xs={12} sm={actionsToShow.length > 2 ? 6 : 12} md={actionsToShow.length > 3 ? 4 : actionsToShow.length > 1 ? 6 : 12} key={index}>
                  {disableState.disabled && disableState.tooltip ? (
                    <Tooltip title={disableState.tooltip} arrow>
                      <span>
                        {buttonElement}
                      </span>
                    </Tooltip>
                  ) : (
                    buttonElement
                  )}
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}