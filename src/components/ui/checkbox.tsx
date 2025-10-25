import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    const handleDivClick = () => {
      if (inputRef.current) {
        inputRef.current.click()
      }
    }

    // Используем внутренний ref и пробрасываем внешний
    React.useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          ref={inputRef}
          checked={checked ?? false}
          onChange={handleChange}
          {...props}
        />
        <div
          onClick={handleDivClick}
          className={cn(
            'h-5 w-5 shrink-0 rounded border border-primary ring-offset-background',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:bg-primary peer-checked:text-primary-foreground',
            'flex items-center justify-center cursor-pointer transition-colors',
            className
          )}
        >
          {checked && <Check className="h-4 w-4" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
