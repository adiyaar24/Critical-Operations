import React, { useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { 
  Typography, 
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Launch as LaunchIcon
} from '@mui/icons-material';

interface WorkflowAction {
  name: string;
  url: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  hiddenData?: Record<string, any>; // Hidden key-value pairs to append to form data for this action
}

export interface Day2OperationsCardProps {
  title?: string;
  workflowUrl?: string; // Single workflow URL (backwards compatibility)
  actions?: WorkflowAction[]; // Multiple workflow actions
  metadataPath: string; // Root path for metadata extraction (e.g., "metadata.new")
  additionalParams?: (string | { path: string; key: string })[]; // Additional metadata paths to include in form data
  autoSelectFirstElement?: boolean; // Auto-select first element of arrays (default: true)
}

export function Day2OperationsCard({
  title = "Day 2 Operations",
  workflowUrl,
  actions,
  metadataPath,
  additionalParams,
  autoSelectFirstElement = true
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
  const buildFormData = (hiddenData?: Record<string, any>): Record<string, any> => {
    const formData: Record<string, any> = {};
    
    // Extract all key-value pairs from the specified metadata path
    const metadataData = resolveMetadataValue(metadataPath);
    if (metadataData && typeof metadataData === 'object') {
      if (Array.isArray(metadataData)) {
        // If metadataPath points to an array, use the last segment of the path as the key
        const pathSegments = metadataPath.split('.');
        const arrayKey = pathSegments[pathSegments.length - 1] || 'data';
        formData[arrayKey] = metadataData;
      } else {
        // Add all key-value pairs to formData for objects
        Object.entries(metadataData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData[key] = value;
          }
        });
      }
    }
    
    // Add additional parameters if specified
    if (additionalParams) {
      additionalParams.forEach(param => {
        let paramPath: string;
        let key: string;
        
        if (typeof param === 'string') {
          // Legacy format: use the last part of the path as the key
          paramPath = param;
          key = param.split('.').pop() || param;
        } else {
          // New format: use custom key
          paramPath = param.path;
          key = param.key;
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
    }
    
    // Add hidden data specific to this action (will override metadata if same key exists)
    if (hiddenData) {
      Object.entries(hiddenData).forEach(([key, value]) => {
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
  const buildWorkflowUrl = (baseUrl: string, hiddenData?: Record<string, any>): string => {
    const formData = buildFormData(hiddenData);
    const encodedFormData = encodeFormData(formData);
    
    return `${baseUrl}?formData=${encodedFormData}`;
  };

  // Function to handle operation execution
  const handleOperation = async (action: WorkflowAction) => {
    const url = buildWorkflowUrl(action.url, action.hiddenData);
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
            {actionsToShow.map((action, index) => (
              <Grid item xs={12} sm={actionsToShow.length > 2 ? 6 : 12} md={actionsToShow.length > 3 ? 4 : actionsToShow.length > 1 ? 6 : 12} key={index}>
                <Button
                  variant={action.variant || 'contained'}
                  color={action.color || 'primary'}
                  fullWidth
                  startIcon={loading === action.name ? <CircularProgress size={20} /> : <LaunchIcon />}
                  disabled={loading !== null}
                  onClick={() => handleOperation(action)}
                  sx={{ py: 1.5 }}
                >
                  {action.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}