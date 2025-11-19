# Adding New Components Guide

## 📖 Overview

This guide explains how to add new content types (like login, orders, profile, etc.) to the dynamic content section of the application.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│ new-session-view.tsx                                        │
│ • Manages content section state                             │
│ • Registers RPC handlers (backend → frontend)               │
│ • Controls what content to display                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ content-section.tsx                                         │
│ • Generic container (close button + routing)                │
│ • Routes to appropriate view based on contentType           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
         ┌─────────┴─────────┬─────────────┐
         ↓                   ↓             ↓
   ┌──────────┐      ┌──────────┐   ┌──────────┐
   │ CardsView│      │LoginView │   │OrdersView│
   │          │      │          │   │          │
   │ • Title  │      │ • Form   │   │ • List   │
   │ • Grid   │      │ • Logic  │   │ • Filters│
   │ • Modal  │      │ • RPC    │   │ • RPC    │
   └──────────┘      └──────────┘   └──────────┘
```

---

## 🗂️ File Responsibilities

| File | Responsibility | Contains |
|------|----------------|----------|
| `new-session-view.tsx` | RPC orchestrator | RPC handlers (backend → frontend), content state |
| `content-section.tsx` | Generic container | Close button, content routing |
| `views/[name]-view.tsx` | Self-contained view | UI, title, internal logic, RPC calls (frontend → backend) |

---

## 🚀 Quick Start: Adding a New Component

Follow these **3 simple steps** to add a new component:

### Step 1: Create View Component
📁 Create `components/app/new-ui/views/[name]-view.tsx`

### Step 2: Update ContentSection
📝 Add routing and types to `content-section.tsx`

### Step 3: Add RPC Handler
🔄 Register RPC method in `new-session-view.tsx`

---

## 📝 Detailed Step-by-Step Guide

### Step 1: Create Your View Component

Create a new file: `components/app/new-ui/views/login-view.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';

interface LoginViewProps {
  // Add any props passed from RPC payload
  message?: string;
}

export function LoginView({ message }: LoginViewProps) {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agent) {
      console.warn('⚠️ No agent available');
      return;
    }

    try {
      // Send RPC to backend (frontend → backend)
      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.userLogin',
        payload: JSON.stringify({
          email,
          password,
          action: 'submit',
        }),
      });

      console.log('✅ Login result:', result);
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title Section (optional) */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 z-20">
        <h2 className="text-xl font-bold text-foreground text-center">تسجيل الدخول</h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          {message && (
            <p className="text-muted-foreground text-sm text-center">{message}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              required
            />

            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              دخول
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Key Points:**
- ✅ Self-contained with its own state
- ✅ Controls its own layout and styling
- ✅ Can make RPC calls back to backend
- ✅ Receives data via props (from RPC payload)

---

### Step 2: Update ContentSection

**File:** `components/app/new-ui/content-section.tsx`

#### 2.1 Update the interface:
```tsx
interface ContentSectionProps {
  contentType: 'cards' | 'login' | null;  // ← Add 'login' here
  data: any;
  onClose: () => void;
}
```

#### 2.2 Add the import:
```tsx
import { LoginView } from '@/components/app/new-ui/views/login-view';
```

#### 2.3 Add routing:
```tsx
export function ContentSection({ contentType, data, onClose }: ContentSectionProps) {
  return (
    <div className="bg-background border-border relative h-full w-full overflow-hidden border-l">
      {/* Close button */}
      <motion.button onClick={onClose} ...>
        <X />
      </motion.button>

      {/* Route to appropriate view */}
      {contentType === 'cards' && <CardsView {...data} />}
      {contentType === 'login' && <LoginView {...data} />}  {/* ← Add this line */}
    </div>
  );
}
```

---

### Step 3: Add RPC Handler

**File:** `components/app/new-ui/new-session-view.tsx`

#### 3.1 Update state type:
```tsx
const [contentSection, setContentSection] = useState<{
  isVisible: boolean;
  type: 'cards' | 'login' | null;  // ← Add 'login' here
  data: any;
}>({
  isVisible: false,
  type: null,
  data: null,
});
```

#### 3.2 Register RPC handler:
```tsx
// Add this useEffect after existing RPC handlers
useEffect(() => {
  const handleDisplayLogin = async (data: any): Promise<string> => {
    try {
      console.log('📨 Received displayLogin RPC:', data);

      // Parse payload
      const payload = typeof data.payload === 'string'
        ? JSON.parse(data.payload)
        : data.payload;

      // Validate action field
      if (payload.action !== 'show' && payload.action !== 'hide') {
        console.error('❌ Invalid action:', payload.action);
        return JSON.stringify({
          status: 'error',
          message: 'Invalid action. Use "show" or "hide"',
        });
      }

      if (payload.action === 'show') {
        // Show login view
        setContentSection({
          isVisible: true,
          type: 'login',
          data: {
            message: payload.message || '',
            // Add any other fields from payload
          },
        });

        console.log('✅ Displaying login view');

        return JSON.stringify({
          status: 'success',
          message: 'Login view displayed',
        });
      } else if (payload.action === 'hide') {
        // Hide content section
        setContentSection({
          isVisible: false,
          type: null,
          data: null,
        });

        console.log('👋 Hiding login view');

        return JSON.stringify({
          status: 'success',
          message: 'Login view hidden',
        });
      }

      return JSON.stringify({
        status: 'error',
        message: 'Unknown action',
      });
    } catch (error) {
      console.error('❌ Error processing displayLogin:', error);
      return JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Register the RPC method
  room.localParticipant.registerRpcMethod('client.displayLogin', handleDisplayLogin);
  console.log('🔌 Registered RPC method: client.displayLogin');

  // Cleanup on unmount
  return () => {
    room.localParticipant.unregisterRpcMethod('client.displayLogin');
    console.log('🔌 Unregistered RPC method: client.displayLogin');
  };
}, [room, contentSection]);
```

---

## 📋 Backend RPC Payload Format

When the backend calls your RPC method, use this format:

### Show Login View
```json
{
  "action": "show",
  "message": "Please log in to continue"
}
```

### Hide Login View
```json
{
  "action": "hide"
}
```

---

## ✅ Checklist

When adding a new component, make sure you:

- [ ] Created view component in `views/[name]-view.tsx`
- [ ] Added component export to view file
- [ ] Updated `ContentSection` interface with new type
- [ ] Added import in `content-section.tsx`
- [ ] Added routing case in `ContentSection` component
- [ ] Updated state type in `new-session-view.tsx`
- [ ] Created RPC handler in `new-session-view.tsx`
- [ ] Registered RPC method with `registerRpcMethod()`
- [ ] Added cleanup with `unregisterRpcMethod()`
- [ ] Tested with backend RPC calls
- [ ] Verified close button works
- [ ] Verified slide-in animation works

---

## 🎯 Common Patterns

### Pattern 1: Simple Form View (Login)
```tsx
export function LoginView({ message }: LoginViewProps) {
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    // Send RPC to backend
    await room.localParticipant.performRpc({
      method: 'agent.userLogin',
      payload: JSON.stringify(formData)
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

### Pattern 2: List View (Orders)
```tsx
export function OrdersView({ orders }: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title */}
      <div className="sticky top-0 ...">
        <h2>طلباتي</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {orders.map(order => (
          <OrderItem
            key={order.id}
            order={order}
            onClick={() => setSelectedOrder(order)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Pattern 3: View with Modal (Similar to Cards)
```tsx
export function ProductsView({ products }: ProductsViewProps) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="relative h-full w-full">
      {/* Background grid - blurs when modal open */}
      <motion.div
        animate={{
          opacity: selectedProduct ? 0.3 : 1,
          filter: selectedProduct ? 'blur(4px)' : 'blur(0px)',
        }}
      >
        <ProductGrid
          products={products}
          onProductClick={setSelectedProduct}
        />
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 🔧 Code Templates

### Template: View Component
```tsx
'use client';

import { useState } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';

interface [Name]ViewProps {
  // Add props from RPC payload
}

export function [Name]View({ /* props */ }: [Name]ViewProps) {
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();

  // Your component logic here

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title Section (optional) */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 z-20">
        <h2 className="text-xl font-bold text-foreground text-center">[Title]</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### Template: RPC Handler
```tsx
useEffect(() => {
  const handleDisplay[Name] = async (data: any): Promise<string> => {
    try {
      const payload = typeof data.payload === 'string'
        ? JSON.parse(data.payload)
        : data.payload;

      if (payload.action === 'show') {
        setContentSection({
          isVisible: true,
          type: '[type]',
          data: payload,
        });

        return JSON.stringify({ status: 'success' });
      } else if (payload.action === 'hide') {
        setContentSection({
          isVisible: false,
          type: null,
          data: null,
        });

        return JSON.stringify({ status: 'success' });
      }

      return JSON.stringify({ status: 'error', message: 'Unknown action' });
    } catch (error) {
      return JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  room.localParticipant.registerRpcMethod('client.display[Name]', handleDisplay[Name]);

  return () => {
    room.localParticipant.unregisterRpcMethod('client.display[Name]');
  };
}, [room, contentSection]);
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't: Put business logic in ContentSection
```tsx
// BAD - ContentSection should only route
export function ContentSection({ contentType, data, onClose }) {
  const [email, setEmail] = useState(''); // ❌ Wrong!

  return (
    <div>
      {contentType === 'login' && (
        <input value={email} onChange={...} /> // ❌ Logic in container!
      )}
    </div>
  );
}
```

### ✅ Do: Put business logic in View components
```tsx
// GOOD - View owns its logic
export function LoginView() {
  const [email, setEmail] = useState(''); // ✅ Correct!

  return <input value={email} onChange={...} />;
}
```

---

### ❌ Don't: Forget to add cleanup
```tsx
// BAD - Memory leak!
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.displayLogin', handler);
  // ❌ No cleanup!
}, [room]);
```

### ✅ Do: Always cleanup RPC handlers
```tsx
// GOOD
useEffect(() => {
  room.localParticipant.registerRpcMethod('client.displayLogin', handler);

  return () => {
    room.localParticipant.unregisterRpcMethod('client.displayLogin'); // ✅
  };
}, [room, contentSection]);
```

---

### ❌ Don't: Forget to update TypeScript types
```tsx
// BAD - TypeScript error!
type: 'cards' | null  // ❌ Missing 'login'
```

### ✅ Do: Update all type definitions
```tsx
// GOOD
type: 'cards' | 'login' | null  // ✅ All types included
```

---

## 📁 File Reference

### Files You'll Modify
1. **Create:** `components/app/new-ui/views/[name]-view.tsx`
2. **Modify:** `components/app/new-ui/content-section.tsx`
3. **Modify:** `components/app/new-ui/new-session-view.tsx`

### Files You Won't Touch
- `card-grid.tsx` - Only used by CardsView
- `card-item.tsx` - Only used by CardGrid
- `card-modal.tsx` - Only used by CardsView

---

## 🎓 Quick Example: Adding "Orders" Component

### 1. Create `views/orders-view.tsx`
```tsx
export function OrdersView({ orders }: { orders: any[] }) {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4">
        <h2 className="text-xl font-bold text-center">طلباتي</h2>
      </div>
      <div className="flex-1 p-6 space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4">
            <p>{order.name}</p>
            <p className="text-sm text-muted-foreground">{order.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Update `content-section.tsx`
```tsx
import { OrdersView } from '@/components/app/new-ui/views/orders-view';

interface ContentSectionProps {
  contentType: 'cards' | 'login' | 'orders' | null;  // Add 'orders'
  data: any;
  onClose: () => void;
}

// In the component:
{contentType === 'orders' && <OrdersView {...data} />}
```

### 3. Add RPC handler in `new-session-view.tsx`
```tsx
// Update type
type: 'cards' | 'login' | 'orders' | null;

// Add handler
useEffect(() => {
  const handleDisplayOrders = async (data: any): Promise<string> => {
    const payload = JSON.parse(data.payload);

    if (payload.action === 'show') {
      setContentSection({
        isVisible: true,
        type: 'orders',
        data: { orders: payload.orders }
      });
      return JSON.stringify({ status: 'success' });
    }
    // ... handle hide
  };

  room.localParticipant.registerRpcMethod('client.displayOrders', handleDisplayOrders);
  return () => room.localParticipant.unregisterRpcMethod('client.displayOrders');
}, [room, contentSection]);
```

**Done!** 🎉

---

## 💡 Tips

- **Keep views self-contained** - Each view should work independently
- **Use consistent naming** - `[Name]View` for components, `client.display[Name]` for RPCs
- **Handle errors gracefully** - Always wrap RPC handlers in try/catch
- **Log for debugging** - Use console.log with emojis for easy tracking (📨 🔌 ✅ ❌)
- **Test both show and hide** - Verify your component can be opened and closed
- **Check animations** - Make sure the slide-in/out animations work smoothly

---

## 🆘 Troubleshooting

### Issue: Component doesn't show up
**Check:**
- ✅ RPC handler is registered
- ✅ `contentType` matches exactly (case-sensitive)
- ✅ `contentSection.isVisible` is `true`
- ✅ Import path is correct in `content-section.tsx`

### Issue: TypeScript errors
**Check:**
- ✅ Added new type to all `contentType` declarations
- ✅ State type in `new-session-view.tsx` is updated
- ✅ Props interface in `content-section.tsx` is updated

### Issue: RPC handler not firing
**Check:**
- ✅ Method name matches exactly: `client.display[Name]`
- ✅ Handler is registered in `useEffect`
- ✅ Dependencies array includes `[room, contentSection]`
- ✅ Cleanup function unregisters the method

---

## 📚 Further Reading

- [LiveKit RPC Documentation](https://docs.livekit.io/)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

**Happy coding! 🚀**
