// Icon System using Iconsax
import { 
    Add, 
    Trash, 
    Send2, 
    Setting2, 
    Moon, 
    Sun1,
    Code,
    DocumentText,
    Lock,
    Global,
    ArrowDown2,
    CloseCircle,
    TickCircle,
    InfoCircle,
    Folder2,
    Edit2
} from 'iconsax-react';

// Icon size presets
export const ICON_SIZES = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
};

// Export icons with consistent naming
export const Icons = {
    Add,
    Delete: Trash,
    Send: Send2,
    Settings: Setting2,
    Moon,
    Sun: Sun1,
    Code,
    Document: DocumentText,
    Lock,
    Global,
    ChevronDown: ArrowDown2,
    Close: CloseCircle,
    Success: TickCircle,
    Info: InfoCircle,
    Folder: Folder2,
    Edit: Edit2
};

// Helper to get icon component
export function getIcon(name, size = 'md', color = 'currentColor', variant = 'Linear') {
    const IconComponent = Icons[name];
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }
    
    return IconComponent;
}

// Icon wrapper component for inline usage
export function Icon({ name, size = 'md', color, variant = 'Linear', className = '' }) {
    const IconComponent = getIcon(name);
    if (!IconComponent) return null;
    
    const iconSize = typeof size === 'string' ? ICON_SIZES[size] : size;
    
    return IconComponent({ 
        size: iconSize, 
        color: color || 'currentColor',
        variant: variant,
        className: className
    });
}
