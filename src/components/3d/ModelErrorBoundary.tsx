import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallbackName?: string;
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ModelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ModelErrorBoundary] Error loading ${this.props.fallbackName || 'model'}:`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <group name={`fallback-${this.props.fallbackName || 'model'}`}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff4444" wireframe />
          </mesh>
        </group>
      );
    }

    return this.props.children;
  }
}

