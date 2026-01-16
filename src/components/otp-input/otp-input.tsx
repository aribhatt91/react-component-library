/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import './otp-input.css';

interface OTPInputProps {
    length: number
    onSubmit: (otp: string) => void
    onValueChange: (otp: string) => void
    ariaLabel?: string
    secure?: boolean
    autoFocus?: boolean
    autoSubmit?: boolean
    error?: string | null
}

const NUMERIC_REGEX = /^[0-9]$/;
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]$/;

function OTInput({
    length=4, 
    onSubmit, 
    onValueChange, 
    ariaLabel = 'One-time password input', 
    secure = false, 
    autoFocus = true,
    autoSubmit = false,
    error = null
}: OTPInputProps) {
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const [ values, setValues ] = useState((new Array(length)).fill(''));

    const isValidInput = useCallback((char: string) => {
        if(!char) return false;
        return NUMERIC_REGEX.test(char);
    }, [length]);

    const getOTPValue = useCallback((): string => {
        return values.join('').trim();
    }, [values]);

    const isOTPComplete = useCallback((): boolean => {
        return values.every(val => val !== '');
    }, [values]);

    useEffect(() => {
        if(autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
        return () => {
            setValues(Array(length).fill(''));
        };
    }, [length]);

    const updateValue = useCallback((index: number, value: string) => {
        setValues(prev => {
            const newValues = [...prev];
            newValues[index] = value;
            
            // Trigger onChange callback
            const otpValue = newValues.join('');
            onValueChange?.(otpValue);
            
            // Check if complete and trigger onComplete
            const isComplete = newValues.every(val => val !== '');
            if (isComplete && autoSubmit) {
                onSubmit?.(otpValue);
            }
            
            return newValues;
        });
    }, [onValueChange, onSubmit, autoSubmit]);

    const handleKeyDown = (key: string, index: number) => {
        key = key?.toLowerCase();
        const inputs = inputRefs.current;
        
        if(key === 'backspace') {
            // Handle Backspace
            if(inputRefs.current[index].value !== '') {
                console.log(index, inputRefs.current[index].value);
                updateValue(index, '');
                //return;
            }
            if(index === length-1) {
                inputs[index-1].focus();
            }else {
                // check if current element/cell is the last filled cell
                const inputValues = inputs.map(i => i.value).slice(index).join('').trim();
                const isLastTyped = inputValues === '';
                if(isLastTyped && index>0) {
                    inputs[index-1].focus();
                }
            }
        }else if(key === 'enter') {
            // Handle Enter key
            if(isOTPComplete()) {
                onSubmit?.(getOTPValue());
            }
        }
    };

    const handleValueChange = (value: string, index: number) => {
        const key = value?.slice(-1);
        //const valueStr = inputRefs.current.map((el: any) => el.value || '').join('');
        if(key && isValidInput(key)) {
            console.log(key);
            updateValue(index, key);
            if(inputRefs.current[index].value !== ''){
                if(index < length-1){
                    inputRefs.current[index+1].focus();
                }else if(index === length-1){
                    inputRefs.current[index].blur();
                }   
            }
        } 
        
    }

    return (
        <div className='otp-input flex' role='group'>
            {
                values.map((value: string, index: number) => (
                    <input 
                        ref={(el: any) => (inputRefs.current[index] = el)}
                        key={`input-${index}`}
                        data-index={index}
                        className={`otp-input-digit ${error ? 'input--error' : ''}`}
                        type={secure && value ? "password" : "text"}
                        inputMode='numeric'
                        value={value}
                        autoComplete="one-time-code"
                        autoCorrect="off"
                        autoCapitalize="off"
                        aria-invalid={!!error}
                        aria-label={`Digit ${index + 1} of ${length}`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e?.target?.value;
                            handleValueChange(value, index);
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            const key = e?.key;
                            console.log(index, key);
                            setTimeout(handleKeyDown, 100, key, index);
                        }}
                        onPaste={(e: any) => {
                            e.preventDefault();
                        }}
                        />
                ))
            }
        </div>
    )
}

export default OTInput