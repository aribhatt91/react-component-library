/* eslint-disable @typescript-eslint/no-unused-vars */
import { LiaInfoCircleSolid, LiaExclamationTriangleSolid, LiaTimesCircleSolid, LiaCheckCircleSolid, LiaTimesSolid   } from 'react-icons/lia';
import './toast.css';

export type ToastType = 'info' | 'warn' | 'success' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type ToastAnimation = 'none' | 'fade' | 'slide' | 'pop';

export interface ToastProps {
    id: string
    type: ToastType
    message: string
    onClose: (id: string) => void
}
const ICON_SIZE = 24
const icons = {
    info: <LiaInfoCircleSolid fontSize={ICON_SIZE}/>,
    warn: <LiaExclamationTriangleSolid fontSize={ICON_SIZE}/>,
    success: <LiaCheckCircleSolid fontSize={ICON_SIZE}/>,
    error: <LiaTimesCircleSolid fontSize={ICON_SIZE}/>
};

function Toast({ id, type='info', message, onClose}: ToastProps) {

    const handleClose = () => {
        onClose(id)
    }

    return (
        <div data-toast-id={id} data-toast-type={type} className={`toast toast--${type}`}>
            <div className='toast__icon'>
                {icons[type]}
            </div>
            <div className='toast__text'>{message}</div>
            <div className='toast__close'>
                <button className='toast__button' onClick={handleClose}>
                    <LiaTimesSolid fontSize={18}/>
                </button>
            </div>
        </div>
    )
}

export default Toast