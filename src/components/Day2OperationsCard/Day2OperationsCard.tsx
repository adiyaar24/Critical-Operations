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
import { Box } from '@mui/material';

interface WorkflowAction {
  name: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  additionalData?: Record<string, any>; // Additional key-value pairs to append to form data for this action
  additionalParams?: (string | { path: string; key: string; sendAsArray?: boolean })[]; // Per-action metadata paths to include in form data
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
  actions: WorkflowAction[]; // Array of workflow operations to display
  metadataPath?: string; // Root path for metadata extraction (e.g., "metadata.new") - optional
  globalParams?: (string | { path: string; key: string; sendAsArray?: boolean })[]; // Global metadata paths to include in form data for all actions
  autoSelectFirstElement?: boolean; // Auto-select first element of arrays (default: true)
}

export function Day2OperationsCard({
  title = "Day 2 Operations",
  actions,
  metadataPath,
  globalParams,
  autoSelectFirstElement = true
}: Day2OperationsCardProps) {
  const { entity } = useEntity();
  const [loading, setLoading] = useState<string | null>(null);

  // Function to get current state from metadata
  const getCurrentState = (): string | null => {
    // Check metadata.deployment.state first
    let state = resolveMetadataValue('metadata.deployment.state');
    
    // If not found, check metadata.additionalInfo.deployment.state
    if (!state) {
      state = resolveMetadataValue('metadata.additionalInfo.deployment.state');
    }
    
    return state;
  };

  // Function to get state color based on state value
  const getStateColor = (state: string): string => {
    switch (state?.toLowerCase()) {
      case 'provisioning':
        return '#FFA726'; // Yellow/Orange
      case 'active':
        return '#66BB6A'; // Green
      case 'failed':
        return '#EF5350'; // Red
      default:
        return '#9E9E9E'; // Gray for unknown states
    }
  };

  // Function to render state indicator
  const renderStateIndicator = () => {
    const currentState = getCurrentState();
    
    if (!currentState) {
      return null; // Don't render if no state is available
    }

    const stateColor = getStateColor(currentState);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: stateColor,
            mr: 1,
            boxShadow: `0 0 6px ${stateColor}40`
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          Current state: <Box component="span" sx={{ fontWeight: 'bold' }}>{currentState.charAt(0).toUpperCase() + currentState.slice(1).toLowerCase()}</Box>
        </Typography>
      </Box>
    );
  };

  // Function to resolve metadata path dynamically
  const resolveMetadataValue = (path: string): any => {
    if (!entity || !path) return null;
    
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
    
    // Process global parameters (apply to all actions)
    const processParams = (params: (string | { path: string; key: string; sendAsArray?: boolean })[] | undefined) => {
      if (!params) return;
      
      params.forEach(param => {
        let paramPath: string;
        let key: string;
        let sendAsArray = false;
        
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
          // Object format: { path: string; key: string; sendAsArray?: boolean }
          if (param.path.startsWith('catalog:')) {
            // Direct value from catalog.yaml
            const catalogValue = param.path.substring(8);
            formData[param.key] = catalogValue;
            return;
          } else {
            // Metadata path
            paramPath = param.path;
            key = param.key;
            sendAsArray = param.sendAsArray || false;
          }
        }
        
        const paramValue = resolveMetadataValue(paramPath);
        if (paramValue !== null && paramValue !== undefined) {
          let finalValue = paramValue;
          
          // Auto-select first element if it's an array and autoSelectFirstElement is true
          if (autoSelectFirstElement && Array.isArray(paramValue) && paramValue.length > 0) {
            finalValue = paramValue[0];
          }
          
          // Apply sendAsArray flag
          if (sendAsArray && !Array.isArray(finalValue)) {
            formData[key] = [finalValue];
          } else {
            formData[key] = finalValue;
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

  // Get workflow URL from metadata
  const getWorkflowUrl = (): string | null => {
    return resolveMetadataValue('metadata.workflowUrl');
  };

  // Function to handle operation execution
  const handleOperation = async (action: WorkflowAction) => {
    const disableState = getActionDisableState(action);
    if (disableState.disabled) return; // Don't execute if disabled
    
    const workflowUrl = getWorkflowUrl();
    if (!workflowUrl) return; // Don't execute if no workflow URL
    
    const url = buildWorkflowUrl(workflowUrl, action);
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

  // Check if metadata path has data (only if metadataPath is provided)
  const metadataData = metadataPath ? resolveMetadataValue(metadataPath) : {};
  const hasData = !metadataPath || (metadataData && typeof metadataData === 'object' && Object.keys(metadataData).length > 0);

  // Use provided actions
  const actionsToShow = actions || [];

  if (!hasData && metadataPath) {
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
            No workflow actions configured. Please provide <code>actions</code> prop with at least one action.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check if workflowUrl is set in metadata
  const workflowUrl = getWorkflowUrl();
  if (!workflowUrl) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Alert severity="warning">
            <code>metadata.workflowUrl</code> not set. Please set this value in your entity metadata to enable Day 2 Operations.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {title}
            </Typography>
            {renderStateIndicator()}
          </Box>
          
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