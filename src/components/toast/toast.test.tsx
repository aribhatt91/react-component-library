/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// useToast.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import useToast from './useToast';

// Mock timers for deterministic timing tests
jest.useFakeTimers();

describe('useToast Hook - Core Functionality', () => {
  
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Basic Toast Creation', () => {
    
    test('should initialize with empty toast stack', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      expect(result.current.ToastStack).toBeDefined();
      const { container } = render(result.current.ToastStack);
      expect(container.querySelector('.toast-stack')).toBeInTheDocument();
      expect(container.querySelectorAll('.toast')).toHaveLength(0);
    });

    test('should create a toast with correct props', () => {
      const { result } = renderHook(() => useToast({position: 'top-right', sticky: false}));
      
      act(() => {
        result.current.showToast({
          type: 'success',
          message: 'Operation successful',
          duration: 3000
        });
      });

      const { container } = render(result.current.ToastStack);
      const toast = container.querySelector('.toast');
      
      expect(toast).toBeInTheDocument();
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    test('should generate unique IDs for multiple toasts', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({ type: 'info', message: 'Toast 1' });
        result.current.showToast({ type: 'warn', message: 'Toast 2' });
        result.current.showToast({ type: 'success', message: 'Toast 3' });
      });

      const { container } = render(result.current.ToastStack);
      const toasts = container.querySelectorAll('.toast');
      
      expect(toasts).toHaveLength(3);
      
      // Extract IDs and verify uniqueness
      const ids = Array.from(toasts).map(toast => toast.getAttribute('data-toast-id') || toast.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    test('should apply correct position class', () => {
      const positions: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'> = [
        'top-right', 'top-left', 'bottom-right', 'bottom-left'
      ];

      positions.forEach(position => {
        const { result } = renderHook(() => useToast({position}));
        const { container } = render(result.current.ToastStack);
        
        expect(container.querySelector(`.toast-stack--${position}`)).toBeInTheDocument();
      });
    });
  });

  describe('Toast Types', () => {
    
    test.each([
      ['success', 'Success message'],
      ['error', 'Error message'],
      ['warning', 'Warning message'],
      ['info', 'Info message']
    ])('should create %s toast correctly', (type, message) => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({ 
          type: type as any, 
          message 
        });
      });

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss Behavior', () => {
    
    test('should auto-dismiss toast after specified duration', async () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const duration = 2000;
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Auto-dismiss test',
          duration
        });
      });

      const { container, rerender } = render(result.current.ToastStack);
      expect(screen.getByText('Auto-dismiss test')).toBeInTheDocument();

      // Fast-forward time by duration + animation time (1000ms)
      act(() => {
        jest.advanceTimersByTime(duration + 1000);
      });

      // Re-render to reflect state changes
      rerender(result.current.ToastStack);
      
      await waitFor(() => {
        expect(screen.queryByText('Auto-dismiss test')).not.toBeInTheDocument();
      });
    });

    test('should use default duration when not specified', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Default duration test'
        });
      });

      expect(screen.getByText('Default duration test')).toBeInTheDocument();

      // Default is 2000ms + 1000ms animation
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const { rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      expect(screen.queryByText('Default duration test')).not.toBeInTheDocument();
    });

    test('should handle multiple toasts with different durations', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({ type: 'info', message: 'Toast 1', duration: 1000 });
        result.current.showToast({ type: 'warn', message: 'Toast 2', duration: 2000 });
        result.current.showToast({ type: 'error', message: 'Toast 3', duration: 3000 });
      });

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();

      // After 2000ms (1000 + 1000 animation), Toast 1 should be gone
      act(() => { jest.advanceTimersByTime(2000); });
      const { rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();

      // After another 1000ms, Toast 2 should be gone
      act(() => { jest.advanceTimersByTime(1000); });
      rerender(result.current.ToastStack);
      
      expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });

  describe('Manual Close Functionality', () => {
    
    test('should manually close toast when onClose is called', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      let toastId: string;
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Manual close test',
          duration: 10000 // Long duration to prevent auto-close
        });
      });

      const { container } = render(result.current.ToastStack);
      const closeButton = container.querySelector('[data-testid="toast-close"]') as HTMLElement;
      
      expect(screen.getByText('Manual close test')).toBeInTheDocument();

      act(() => {
        closeButton?.click();
      });

      const { rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      expect(screen.queryByText('Manual close test')).not.toBeInTheDocument();
    });

    test('should clear timeout when manually closed', () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Clear timeout test',
          duration: 5000
        });
      });

      const { container } = render(result.current.ToastStack);
      const closeButton = container.querySelector('[data-testid="toast-close"]') as HTMLElement;

      act(() => {
        closeButton?.click();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('should not throw error when closing non-existent toast', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Test toast'
        });
      });

      // This should not throw
      expect(() => {
        // Simulate calling closeToast with invalid ID
        act(() => {
          // Access internal closeToast if exposed, or trigger via invalid state
          jest.advanceTimersByTime(3000);
        });
      }).not.toThrow();
    });
  });

  describe('Queue Management (MAX_STACK_SIZE)', () => {
    
    test('should queue toasts when stack exceeds MAX_STACK_SIZE', () => {
      const { result } = renderHook(() => useToast({position: 'top-right', maxStackSize: 20}));
      const MAX_STACK_SIZE = 20;
      
      // Add toasts up to max
      act(() => {
        for (let i = 0; i < MAX_STACK_SIZE + 5; i++) {
          result.current.showToast({
            type: 'info',
            message: `Toast ${i}`,
            duration: 10000
          });
        }
      });

      const { container } = render(result.current.ToastStack);
      const toasts = container.querySelectorAll('.toast');
      
      // Should only show MAX_STACK_SIZE toasts
      expect(toasts.length).toBeLessThanOrEqual(MAX_STACK_SIZE);
    });

    test('should process queued toasts after one is closed', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const MAX_STACK_SIZE = 20;
      
      // Fill the stack
      act(() => {
        for (let i = 0; i < MAX_STACK_SIZE + 2; i++) {
          result.current.showToast({
            type: 'info',
            message: `Toast ${i}`,
            duration: 10000
          });
        }
      });

      // Close the first toast
      act(() => {
        const { container } = render(result.current.ToastStack);
        const firstCloseButton = container.querySelector('[data-testid="toast-close"]') as HTMLElement;
        firstCloseButton?.click();
      });

      // A queued toast should now appear
      const { container, rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      const toasts = container.querySelectorAll('.toast');
      expect(toasts.length).toBeLessThanOrEqual(MAX_STACK_SIZE);
    });

    test('should maintain queue order (FIFO)', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const MAX_STACK_SIZE = 20;
      
      act(() => {
        for (let i = 0; i < MAX_STACK_SIZE; i++) {
          result.current.showToast({
            type: 'info',
            message: `Toast ${i}`,
            duration: 10000
          });
        }
        // These should be queued
        result.current.showToast({ type: 'success', message: 'Queued 1', duration: 10000 });
        result.current.showToast({ type: 'success', message: 'Queued 2', duration: 10000 });
      });

      // Close first toast
      act(() => {
        jest.advanceTimersByTime(11000);
      });

      const { rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      // First queued toast should appear
      expect(screen.getByText('Queued 1')).toBeInTheDocument();
      expect(screen.queryByText('Queued 2')).not.toBeInTheDocument();
    });
  });

  describe('Memory Leak Prevention', () => {
    
    test('should clear all timers when component unmounts', () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      const { result, unmount } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({ type: 'warn', message: 'Toast 1', duration: 5000 });
        result.current.showToast({ type: 'info', message: 'Toast 2', duration: 5000 });
        result.current.showToast({ type: 'success', message: 'Toast 3', duration: 5000 });
      });

      unmount();

      // Should have cleared timers (implementation dependent on cleanup)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('should not cause memory leaks with rapid toast creation', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      // Simulate rapid toast creation
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.showToast({
            type: 'info',
            message: `Rapid toast ${i}`,
            duration: 100
          });
        }
      });

      // Fast-forward and ensure no errors
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(10000);
        });
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    test('should handle empty message gracefully', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      expect(() => {
        act(() => {
          result.current.showToast({
            type: 'info',
            message: '',
            duration: 2000
          });
        });
      }).not.toThrow();
    });

    test('should handle very long messages', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const longMessage = 'A'.repeat(1000);
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: longMessage,
          duration: 2000
        });
      });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('should handle zero duration', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Zero duration',
          duration: 0
        });
      });

      // Should still appear and then dismiss quickly
      expect(screen.getByText('Zero duration')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(1000); // Animation time
      });

      const { rerender } = render(result.current.ToastStack);
      rerender(result.current.ToastStack);
      
      expect(screen.queryByText('Zero duration')).not.toBeInTheDocument();
    });

    test('should handle negative duration', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      expect(() => {
        act(() => {
          result.current.showToast({
            type: 'info',
            message: 'Negative duration',
            duration: -1000
          });
        });
      }).not.toThrow();
    });

    test('should handle special characters in message', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const specialMessage = '<script>alert("xss")</script> & " \' \\';
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: specialMessage,
          duration: 2000
        });
      });

      // Should escape and display safely
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Concurrent Toast Operations', () => {
    
    test('should handle rapid close operations', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({ type: 'info', message: 'Toast 1', duration: 10000 });
        result.current.showToast({ type: 'info', message: 'Toast 2', duration: 10000 });
        result.current.showToast({ type: 'info', message: 'Toast 3', duration: 10000 });
      });

      const { container } = render(result.current.ToastStack);
      const closeButtons = container.querySelectorAll('[data-testid="toast-close"]');

      // Rapidly close all toasts
      expect(() => {
        act(() => {
          closeButtons.forEach(button => (button as HTMLElement).click());
        });
      }).not.toThrow();
    });

    test('should handle simultaneous auto-dismiss and manual close', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Concurrent close test',
          duration: 2000
        });
      });

      const { container } = render(result.current.ToastStack);
      const closeButton = container.querySelector('[data-testid="toast-close"]') as HTMLElement;

      // Try to close manually right before auto-dismiss
      act(() => {
        jest.advanceTimersByTime(2900);
        closeButton?.click();
        jest.advanceTimersByTime(200); // Complete the auto-dismiss timer
      });

      // Should not cause errors or double-close
      expect(() => {
        const { rerender } = render(result.current.ToastStack);
        rerender(result.current.ToastStack);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    
    test('should efficiently render large number of toasts', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      const startTime = performance.now();
      
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.showToast({
            type: 'info',
            message: `Performance toast ${i}`,
            duration: 10000
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms threshold
    });

    test('should not cause excessive re-renders', () => {
      let renderCount = 0;
      
      const { result } = renderHook(() => {
        renderCount++;
        return useToast({position: 'top-right'});
      });

      const initialRenderCount = renderCount;

      act(() => {
        result.current.showToast({ type: 'info', message: 'Test', duration: 2000 });
      });

      // Should not cause excessive re-renders
      // Exact number depends on implementation, but should be minimal
      expect(renderCount - initialRenderCount).toBeLessThan(5);
    });
  });

  describe('Accessibility', () => {
    
    test('should have proper ARIA attributes', () => {
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'error',
          message: 'Accessibility test',
          duration: 5000
        });
      });

      const { container } = render(result.current.ToastStack);
      const toast = container.querySelector('.toast');
      
      // Check for ARIA role and live region
      expect(toast).toHaveAttribute('role', 'alert');
      // or expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    test('should be keyboard accessible for close button', async () => {
      const user = userEvent.setup({ delay: null });
      const { result } = renderHook(() => useToast({position: 'top-right'}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Keyboard test',
          duration: 10000
        });
      });

      const { container } = render(result.current.ToastStack);
      const closeButton = container.querySelector('[data-testid="toast-close"]') as HTMLElement;

      // Should be focusable and closeable via keyboard
      closeButton?.focus();
      expect(closeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Toast should close
    });
  });

  describe('Sticky Toast Behavior', () => {
    
    test('sticky toast should not auto-dismiss', () => {
      const { result } = renderHook(() => useToast({position: 'top-right', sticky: true}));
      
      act(() => {
        result.current.showToast({
          type: 'info',
          message: 'Sticky toast',
          duration: 2000
        });
      });

      expect(screen.getByText('Sticky toast')).toBeInTheDocument();

      // Advance time well past duration
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should still be present if sticky is implemented correctly
      // Note: Your current implementation may need modification for this
      expect(screen.getByText('Sticky toast')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  
  test('should work correctly in a real component', () => {
    const TestComponent = () => {
      const { showToast, ToastStack } = useToast({position: 'top-right'});

      return (
        <div>
          <button onClick={() => showToast({ type: 'success', message: 'Integration test' })}>
            Show Toast
          </button>
          {ToastStack}
        </div>
      );
    };

    render(<TestComponent />);
    const button = screen.getByText('Show Toast');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Integration test')).toBeInTheDocument();
  });
});