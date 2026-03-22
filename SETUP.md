# SETUP GUIDE FOR LAM TRÀ ADMIN DASHBOARD

## Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account and project

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## Database Setup

### Create Tables in Supabase

#### 1. Branches Table
```sql
CREATE TABLE branches (
  branchid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  longitude FLOAT8,
  latitude FLOAT8,
  isactive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Categories Table
```sql
CREATE TABLE categories (
  categoryid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Products Table
```sql
CREATE TABLE products (
  productid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  baseprice INT8,
  imageurl TEXT,
  status VARCHAR(50) DEFAULT 'active',
  categoryid UUID NOT NULL REFERENCES categories(categoryid),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. Sizes Table
```sql
CREATE TABLE sizes (
  sizeid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  additionalprice INT8 DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Toppings Table
```sql
CREATE TABLE toppings (
  toppingid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price INT8,
  imageurl TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. Branch Product Status Table
```sql
CREATE TABLE branchproductstatus (
  branchid UUID NOT NULL REFERENCES branches(branchid),
  productid UUID NOT NULL REFERENCES products(productid),
  status VARCHAR(50) DEFAULT 'available',
  PRIMARY KEY (branchid, productid)
);
```

#### 7. Accounts Table
```sql
CREATE TABLE accounts (
  accountid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'manager', 'staff')),
  branchid UUID REFERENCES branches(branchid),
  employeeid UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. Orders Table
```sql
CREATE TABLE orders (
  orderid VARCHAR(50) PRIMARY KEY,
  totalamount INT8,
  finalamount INT8,
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')),
  branchid UUID NOT NULL REFERENCES branches(branchid),
  orderdate TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. Order Details Table
```sql
CREATE TABLE orderdetails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orderid VARCHAR(50) NOT NULL REFERENCES orders(orderid),
  productid UUID NOT NULL REFERENCES products(productid),
  quantity INT4,
  subtotal INT8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Set Row Level Security (RLS)

Enable RLS on all tables:
```sql
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
```

## Authentication

The application uses Supabase Auth for user authentication. 

### Enable Email/Password Auth in Supabase:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Email provider
3. Configure email templates if needed

## Real-time Features

The application uses Supabase Realtime for:
- Order status updates
- Staff notifications
- Inventory changes

### Enable Realtime in Supabase:
1. Go to Supabase Dashboard > Realtime
2. Enable realtime for specific tables (orders, orderdetails)

## Features Overview

### Dashboard
- View order statistics
- Recent orders display
- Revenue tracking

### Products
- List all products
- Add new products
- Edit product details
- Delete products
- Filter by category

### Orders
- View all orders
- Filter by status
- Update order status
- View order details

### Employees
- Manage staff members
- Assign roles and branches
- View employee status

### Settings
- Configure app settings
- Manage user preferences

## Folder Structure

```
lamtra-admin/
├── src/
│   ├── assets/              # Images, icons
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── Card.tsx         # Card components
│   │   └── Dashboard.tsx    # Dashboard component
│   ├── pages/               # Page components
│   │   ├── Products.tsx     # Products page
│   │   ├── Orders.tsx       # Orders page
│   │   ├── Employees.tsx    # Employees page
│   │   └── Settings.tsx     # Settings page
│   ├── services/            # API services
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   └── authService.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   ├── utils/               # Utilities
│   │   └── supabaseClient.ts # Supabase client
│   ├── App.tsx              # Main component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── index.html               # HTML template
├── package.json             # Dependencies
├── README.md                # Project documentation
├── tailwind.config.js       # Tailwind config
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── postcss.config.js        # PostCSS config
```

## Development Guidelines

### Code Standards
1. **TypeScript First** - Always use TypeScript interfaces
2. **Component Separation** - Keep components focused and reusable
3. **Error Handling** - Use try-catch for async operations
4. **Role-based Access** - Check user roles before rendering features
5. **Naming Conventions** - Use camelCase for variables, PascalCase for components

### Styling
- Use Tailwind CSS utilities
- Follow the color scheme: Blue (#4318FF), White (#FFFFFF)
- Use 20px border radius for components
- Maintain responsive design

### Before Committing
1. Run `npm run build` to ensure no build errors
2. Test all features locally
3. Update documentation if making changes
4. Follow commit message conventions

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
npm run dev -- --port 3001
```

### Supabase Connection Error
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Check network connectivity
- Verify Supabase project is active

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

## Support & Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
