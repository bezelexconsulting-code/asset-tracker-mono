import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onClose?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
  dismissible?: boolean;
}

const variantStyles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconStyles = {
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400'
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  onClose,
  variant = 'error',
  className,
  dismissible = true
}) => {
  return (
    <div className={cn(
      'border rounded-lg p-4 relative',
      variantStyles[variant],
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className={cn('h-5 w-5', iconStyles[variant])} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">
              {title}
            </h3>
          )}
          <div className={cn('text-sm', { 'mt-2': title })}>
            <p>{message}</p>
            {details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium hover:underline">
                  Show details
                </summary>
                <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-32">
                  {details}
                </pre>
              </details>
            )}
          </div>
        </div>
        {dismissible && onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={cn(
                'inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2',
                variant === 'error' ? 'hover:bg-red-500 focus:ring-red-500' :
                variant === 'warning' ? 'hover:bg-yellow-500 focus:ring-yellow-500' :
                'hover:bg-blue-500 focus:ring-blue-500'
              )}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};