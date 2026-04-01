# Premium UI Components

A collection of premium, animated UI components built with Framer Motion and Tailwind CSS.

## Components

### GlassCard
Premium glassmorphism card with hover effects.

```jsx
import { GlassCard } from './ui';

<GlassCard 
  hover={true}
  glow={false}
  onClick={() => {}}
  className="p-4"
>
  Content here
</GlassCard>
```

**Props:**
- `hover` (boolean): Enable hover lift effect (default: true)
- `glow` (boolean): Enable glow effect on hover (default: false)
- `onClick` (function): Click handler
- `className` (string): Additional CSS classes

---

### PremiumButton
Gradient button with smooth animations.

```jsx
import { PremiumButton } from './ui';

<PremiumButton 
  variant="gradient"
  size="md"
  icon="add"
  onClick={() => {}}
>
  Click Me
</PremiumButton>
```

**Props:**
- `variant`: 'primary' | 'ghost' | 'gradient' | 'pill'
- `size`: 'sm' | 'md' | 'lg'
- `icon` (string): Material icon name
- `iconPosition`: 'left' | 'right'
- `disabled` (boolean): Disable button
- `onClick` (function): Click handler

---

### PremiumInput
Glass-style input with focus glow.

```jsx
import { PremiumInput } from './ui';

<PremiumInput 
  label="Email"
  type="email"
  placeholder="Enter email"
  icon="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Props:**
- `label` (string): Input label
- `type` (string): Input type
- `placeholder` (string): Placeholder text
- `icon` (string): Material icon name
- `value` (string): Input value
- `onChange` (function): Change handler
- `error` (string): Error message

---

### PremiumDropdown
Animated dropdown with glass effect.

```jsx
import { PremiumDropdown } from './ui';

<PremiumDropdown 
  label="Font Family"
  value={font}
  options={[
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
  ]}
  onChange={(value) => setFont(value)}
/>
```

**Props:**
- `label` (string): Dropdown label
- `value` (string): Selected value
- `options` (array): Array of { value, label }
- `onChange` (function): Change handler
- `placeholder` (string): Placeholder text

---

### PremiumSlider
Animated slider with gradient track.

```jsx
import { PremiumSlider } from './ui';

<PremiumSlider 
  label="Font Size"
  value={fontSize}
  onChange={(e) => setFontSize(e.target.value)}
  min={8}
  max={72}
  unit="px"
/>
```

**Props:**
- `label` (string): Slider label
- `value` (number): Current value
- `onChange` (function): Change handler
- `min` (number): Minimum value
- `max` (number): Maximum value
- `step` (number): Step increment
- `showValue` (boolean): Show current value
- `unit` (string): Unit suffix

---

### PremiumTab
Animated tab with gradient underline.

```jsx
import { PremiumTab } from './ui';

<PremiumTab 
  tabs={[
    { value: 'tab1', label: 'Tab 1', icon: 'home' },
    { value: 'tab2', label: 'Tab 2', icon: 'settings' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Props:**
- `tabs` (array): Array of { value, label, icon? }
- `activeTab` (string): Currently active tab value
- `onTabChange` (function): Tab change handler

---

## Usage Example

```jsx
import { 
  GlassCard, 
  PremiumButton, 
  PremiumInput,
  PremiumSlider 
} from './ui';

function MyComponent() {
  const [fontSize, setFontSize] = useState(16);
  
  return (
    <GlassCard className="p-6 space-y-4">
      <PremiumInput 
        label="Name"
        placeholder="Enter name"
      />
      
      <PremiumSlider 
        label="Font Size"
        value={fontSize}
        onChange={(e) => setFontSize(e.target.value)}
        min={8}
        max={72}
        unit="px"
      />
      
      <PremiumButton 
        variant="gradient"
        icon="save"
        onClick={handleSave}
      >
        Save
      </PremiumButton>
    </GlassCard>
  );
}
```

## Design Tokens

All components use the design tokens defined in:
- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/src/index.css` - CSS custom properties

## Animation Settings

Default spring animation:
```js
{
  type: "spring",
  stiffness: 300,
  damping: 20
}
```

## Browser Support

- Chrome/Edge (Chromium) ✅
- Firefox ✅
- Safari ✅
- IE11 ⚠️ (graceful degradation)
