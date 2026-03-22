# LAM TRÀ - Admin Dashboard

Vite + React + TypeScript admin dashboard for Lam Trà drink shop management system with Supabase integration.

## Features

- 🎨 Modern Light Theme with Blue (#4318FF) and White colors
- 👥 Role-based Access Control (Admin, Manager, Staff)
- 📊 Real-time Dashboard with order statistics
- 🍹 Product management
- 📦 Order management and status tracking
- 👨‍💼 Employee management
- 🔐 Authentication with Supabase
- 🔄 Real-time updates with Supabase channels

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Database & Auth**: Supabase (PostgreSQL)
- **UI Icons**: lucide-react
- **Styling**: Tailwind CSS
- **Font**: Inter

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository
```bash
cd lamtra-admin
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Project Structure

```
src/
├── assets/       - Images and static assets
├── components/   - Reusable React components
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── Card.tsx
│   └── Dashboard.tsx
├── pages/        - Page components
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── Employees.tsx
│   └── Settings.tsx
├── services/     - API and business logic
│   ├── productService.ts
│   ├── orderService.ts
│   └── authService.ts
├── types/        - TypeScript type definitions
├── utils/        - Utility functions and configurations
│   └── supabaseClient.ts
├── App.tsx       - Main application component
├── main.tsx      - Application entry point
└── index.css     - Global styles
```

## Database Schema

### Core Tables
- `branches` - Store locations
- `categories` - Product categories
- `products` - Product listings
- `sizes` - Product sizes
- `toppings` - Product add-ons
- `accounts` - User accounts with roles
- `branchproductstatus` - Product availability per branch

### Order Tables
- `orders` - Order information
- `orderdetails` - Order items

## API Endpoints

All data operations are performed directly via Supabase SDK from the frontend.

### Services

#### Product Service
- `getProducts()` - Fetch all products
- `getProductsByCategory(categoryId)` - Fetch products by category
- `createProduct(product)` - Create new product
- `updateProduct(id, updates)` - Update product
- `deleteProduct(id)` - Delete product

#### Order Service
- `getOrders(branchId?)` - Fetch orders
- `getOrderById(orderId)` - Fetch single order
- `createOrder(order)` - Create new order
- `updateOrderStatus(orderId, status)` - Update order status
- `subscribeToOrders()` - Subscribe to real-time updates

#### Auth Service
- `login(email, password)` - User login
- `logout()` - User logout
- `getCurrentUser()` - Get current user

## Styling

- Light theme with modern design
- 20px border radius for all components
- Blue (#4318FF) as primary color
- White (#FFFFFF) as secondary color
- Responsive design with Tailwind CSS

## Role-Based Features

### Super Admin
- Manage all branches
- View nationwide revenue
- Manage product menu
- Access all features

### Manager
- View only their branch data
- Manage branch employees
- Toggle product availability
- View branch revenue

### Staff
- Receive orders in real-time
- Update order status
- View branch dashboard

## Development

### Code Guidelines

1. **TypeScript First** - Always define types for data structures
2. **Component Separation** - Keep fetch logic in `/services`
3. **Error Handling** - Always wrap API calls in try-catch
4. **Role Awareness** - Check user role before showing sensitive features
5. **Clean Code** - Use semantic HTML and proper naming conventions

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## License

MIT
