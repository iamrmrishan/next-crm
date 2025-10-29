import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Rendering', () => {
    it('should render with default variant and size', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-slot', 'button')
    })

    it('should render with custom text content', () => {
      render(<Button>Custom Button Text</Button>)
      
      expect(screen.getByRole('button', { name: 'Custom Button Text' })).toBeInTheDocument()
    })

    it('should render as disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      expect(button).toBeDisabled()
    })
  })

  describe('Variant Props', () => {
    it('should render with default variant classes', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button', { name: 'Default' })
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render with destructive variant classes', () => {
      render(<Button variant="destructive">Destructive</Button>)
      
      const button = screen.getByRole('button', { name: 'Destructive' })
      expect(button).toHaveClass('bg-destructive', 'text-white')
    })

    it('should render with outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button', { name: 'Outline' })
      expect(button).toHaveClass('border', 'bg-background', 'shadow-xs')
    })

    it('should render with secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button', { name: 'Secondary' })
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render with ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      
      const button = screen.getByRole('button', { name: 'Ghost' })
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should render with link variant classes', () => {
      render(<Button variant="link">Link</Button>)
      
      const button = screen.getByRole('button', { name: 'Link' })
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('Size Variations', () => {
    it('should render with default size classes', () => {
      render(<Button>Default Size</Button>)
      
      const button = screen.getByRole('button', { name: 'Default Size' })
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('should render with small size classes', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button', { name: 'Small' })
      expect(button).toHaveClass('h-8', 'px-3')
    })

    it('should render with large size classes', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button', { name: 'Large' })
      expect(button).toHaveClass('h-10', 'px-6')
    })

    it('should render with icon size classes', () => {
      render(<Button size="icon">Icon</Button>)
      
      const button = screen.getByRole('button', { name: 'Icon' })
      expect(button).toHaveClass('size-9')
    })

    it('should render with icon-sm size classes', () => {
      render(<Button size="icon-sm">Icon SM</Button>)
      
      const button = screen.getByRole('button', { name: 'Icon SM' })
      expect(button).toHaveClass('size-8')
    })

    it('should render with icon-lg size classes', () => {
      render(<Button size="icon-lg">Icon LG</Button>)
      
      const button = screen.getByRole('button', { name: 'Icon LG' })
      expect(button).toHaveClass('size-10')
    })
  })

  describe('ClassName Merging', () => {
    it('should merge custom className with default classes', () => {
      render(<Button className="custom-class">Custom Class</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom Class' })
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('bg-primary') // Default variant class should still be present
    })

    it('should merge className with variant and size classes', () => {
      render(
        <Button variant="outline" size="lg" className="border-red-500">
          Custom Border
        </Button>
      )
      
      const button = screen.getByRole('button', { name: 'Custom Border' })
      expect(button).toHaveClass('border-red-500')
      expect(button).toHaveClass('border') // Outline variant class
      expect(button).toHaveClass('h-10') // Large size class
    })
  })

  describe('AsChild Prop', () => {
    it('should render as a different element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveAttribute('data-slot', 'button')
    })

    it('should apply button classes to child element when asChild is true', () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <div>Custom Element</div>
        </Button>
      )
      
      const element = screen.getByText('Custom Element')
      expect(element).toHaveClass('bg-destructive', 'h-10')
      expect(element).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role by default', () => {
      render(<Button>Accessible Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Accessible Button' })
      expect(button).toBeInTheDocument()
    })

    it('should support aria-label attribute', () => {
      render(<Button aria-label="Close dialog">×</Button>)
      
      const button = screen.getByRole('button', { name: 'Close dialog' })
      expect(button).toHaveAttribute('aria-label', 'Close dialog')
    })

    it('should support aria-describedby attribute', () => {
      render(<Button aria-describedby="help-text">Submit</Button>)
      
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should have focus-visible classes for keyboard navigation', () => {
      render(<Button>Focus Test</Button>)
      
      const button = screen.getByRole('button', { name: 'Focus Test' })
      expect(button).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50')
    })
  })

  describe('Props Forwarding', () => {
    it('should forward standard button props', () => {
      render(<Button type="submit" name="submit-btn">Submit</Button>)
      
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('name', 'submit-btn')
    })

    it('should forward data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>)
      
      const button = screen.getByRole('button', { name: 'Test' })
      expect(button).toHaveAttribute('data-testid', 'custom-button')
    })
  })
})