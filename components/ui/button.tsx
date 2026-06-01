import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-white text-black hover:bg-gray-200',
      outline: 'border border-gray-700 text-white hover:bg-gray-900',
      ghost: 'text-gray-400 hover:text-white hover:bg-gray-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    }

    const sizes = {
      sm: 'px-3 py-1 text-sm rounded',
      md: 'px-4 py-2 text-base rounded',
      lg: 'px-6 py-3 text-lg rounded',
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
