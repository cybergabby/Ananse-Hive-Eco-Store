-- Create profiles table (intentionally no trigger for educational purposes)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vulnerable RLS policy - allows users to see other profiles (IDOR vulnerability)
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read access to products
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT 
USING (true);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  discount_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Vulnerable RLS - users can see all orders (IDOR)
CREATE POLICY "Users can view all orders" 
ON public.orders FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items" 
ON public.order_items FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create order items" 
ON public.order_items FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews table (for stored XSS)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Discount codes table (for parameter tampering)
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER CHECK (discount_percent > 0 AND discount_percent <= 100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Vulnerable - anyone can view discount codes
CREATE POLICY "Anyone can view discount codes" 
ON public.discount_codes FOR SELECT 
USING (true);

-- Insert sample products
INSERT INTO public.products (name, description, price, image_url) VALUES
('Classic Canvas Tote', 'Durable organic cotton tote bag perfect for everyday use', 24.99, '/products/tote1.jpg'),
('Hemp Shopping Bag', 'Eco-friendly hemp fiber bag with reinforced handles', 29.99, '/products/tote2.jpg'),
('Recycled Ocean Tote', 'Made from 100% recycled ocean plastic bottles', 34.99, '/products/tote3.jpg'),
('Bamboo Fiber Bag', 'Sustainable bamboo fiber with waterproof lining', 39.99, '/products/tote4.jpg'),
('Organic Jute Tote', 'Natural jute material with cotton handles', 19.99, '/products/tote5.jpg'),
('Cork Leather Bag', 'Vegan cork leather, stylish and sustainable', 44.99, '/products/tote6.jpg');

-- Insert sample discount codes (for educational exploitation)
INSERT INTO public.discount_codes (code, discount_percent) VALUES
('SAVE10', 10),
('SAVE50', 50),
('ADMIN100', 100);