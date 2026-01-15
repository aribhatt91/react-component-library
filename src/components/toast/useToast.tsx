/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastAnimation, ToastPosition, ToastProps, ToastType } from "./toast";
import Toast from "./toast";

const MAX_STACK_SIZE = 20;
const MIN_DURATION = 3000;

interface UseToastProps {
    position: ToastPosition
    sticky?: boolean
    animate?: ToastAnimation
    maxStackSize?: number
}
const useToast = ({position = 'top-right', sticky = false, animate = 'slide', maxStackSize = MAX_STACK_SIZE}: UseToastProps) => {
    const [ toasts, setToasts ] = useState<any[]>([]);
    const [ queue, setQueue ] = useState<any[]>([]);

    const closeTimersRef = useRef<Map<string, any>>(new Map());
    const toastsRef = useRef<ToastProps[]>([]);
    const queueRef = useRef<any[]>([]);

    // Keep refs in sync
    useEffect(() => {
        toastsRef.current = toasts;
    }, [toasts]);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    const closeToast = useCallback((id: string) => {
        console.log('closeToast::', id);
        
        // Clear the timer
        const timer = closeTimersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
        }
        closeTimersRef.current.delete(id);

        // Remove the toast
        setToasts(prev => prev.filter(toast => toast.id !== id));

        // Process queue if there are waiting toasts
        if (queueRef.current.length > 0) {
            const nextToast = queueRef.current[0];
            setQueue(prev => prev.slice(1));
            if(showToast){
                showToast(nextToast);
            }
        }
    }, []);

    const showToast = useCallback(({ type = 'info', message, duration = MIN_DURATION }: { type: ToastType, message: string, duration?: number }) => {
        if (toastsRef.current.length >= maxStackSize) {
            setQueue(prev => [...prev, { type, message, duration }]);
            return;
        }

        const id: string = Date.now().toString() + Math.random(); // Better unique ID
        const timer = sticky ? null : setTimeout(() => closeToast(id), duration + 500);
        
        closeTimersRef.current.set(id, timer);

        setToasts(prev => [
            ...prev,
            {
                id,
                type,
                message,
                onClose: closeToast
            }
        ]);
    }, [closeToast, position, sticky]);

    

    const ToastStack = toasts && toasts.length ? (
        <div className={`toast-stack toast-stack--${position} toast-animate-${animate}`}>
            {toasts.map((toast: ToastProps) => <Toast key={toast.id} {...toast} />)}
        </div>
    ) : (<div className={`toast-stack toast-stack--${position} hidden`}></div>);

    return { showToast, ToastStack };

}

export default useToast;