import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createBoltPreviewError, type BoltPreviewError } from '~/types/errors';
import { logStore } from '~/lib/stores/logs';
import { workbenchStore } from '~/lib/stores/workbench';

interface PreviewErrorBoundaryProps {
    children: ReactNode;
    onError?: (error: BoltPreviewError) => void;
}

interface PreviewErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
    constructor(props: PreviewErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error occurred in Preview component', error, errorInfo);
        
        // Convert this error to BoltPreviewError
        const boltError = createBoltPreviewError({
            source: 'preview-iframe',
            subType: 'react-error',
            message: error.message || 'React component error in Preview',
            raw: error.stack || error.toString(),
            stack: error.stack,
            filePath: errorInfo.componentStack ? this.extractFileFromStack(errorInfo.componentStack) : undefined,
        });
        
        // Log to the store
        logStore.logError('Preview React Error', error, {
            errorInfo,
            boltError,
            componentStack: errorInfo.componentStack,
        });
        
        // 🚀 NEW: Trigger alert with Quick Fix button
        workbenchStore.actionAlert.set({
            type: 'error',
            title: 'React Component Error',
            description: error.message || 'A React component crashed during rendering',
            content: `Component crashed in preview.

Error: ${error.message}

Component Stack:
${errorInfo.componentStack || 'No component stack available'}

Error Stack:
${error.stack || 'No error stack available'}`,
            source: 'preview',
        });
        
        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(boltError);
        }
    }

    private extractFileFromStack(componentStack: string): string | undefined {
        const lines = componentStack.split('\n');
        for (const line of lines) {
            const match = line.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
            if (match) {
                return match[2]; // Return the file path
            }
        }
        return undefined;
    }

    render() {
        if (this.state.hasError) {
            // Render a fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-monzed-elements-background-depth-2">
                    <div className="i-ph:warning-circle text-4xl text-red-500 mb-4" />
                    <h2 className="text-lg font-semibold text-monzed-elements-textPrimary mb-2">
                        Preview Error
                    </h2>
                    <p className="text-sm text-monzed-elements-textSecondary mb-4">
                        An error occurred while rendering the preview. Please try refreshing or check the console for more details.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="px-4 py-2 bg-monzed-elements-button-primary-background text-monzed-elements-button-primary-text rounded hover:bg-monzed-elements-button-primary-backgroundHover transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default PreviewErrorBoundary;
