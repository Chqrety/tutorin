-- Create the setup function
CREATE OR REPLACE FUNCTION setup_kampuskarirku_database()
RETURNS TEXT AS $$
BEGIN
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Create users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    university TEXT,
    major TEXT,
    semester INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create profiles table
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url TEXT,
    interests TEXT[],
    skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create counselors table
  CREATE TABLE IF NOT EXISTS counselors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    specialization TEXT[],
    years_of_experience INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create consultations table
  CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    counselor_id UUID REFERENCES counselors(id),
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create portfolio_items table
  CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create reviews table
  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    counselor_id UUID REFERENCES counselors(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create posts table
  CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    status TEXT CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create comments table
  CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Add Row Level Security (RLS) policies

  -- Users table policy
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view and edit their own data" ON users
    FOR ALL USING (auth.uid() = id);

  -- Profiles table policy
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
  CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

  -- Counselors table policy
  ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Counselors are viewable by everyone" ON counselors
    FOR SELECT USING (true);
  CREATE POLICY "Only admins can insert/update counselors" ON counselors
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

  -- Consultations table policy
  ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Counselors can view their assigned consultations" ON consultations
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM counselors WHERE id = counselor_id));
  CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users and counselors can update consultations" ON consultations
    FOR UPDATE USING (
      auth.uid() = user_id OR 
      auth.uid() IN (SELECT user_id FROM counselors WHERE id = counselor_id)
    );

  -- Portfolio items table policy
  ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Portfolio items are viewable by everyone" ON portfolio_items
    FOR SELECT USING (true);
  CREATE POLICY "Users can manage their own portfolio items" ON portfolio_items
    FOR ALL USING (auth.uid() = user_id);

  -- Reviews table policy
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);
  CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

  -- Posts table policy
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Published posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'published');
  CREATE POLICY "Users can manage their own posts" ON posts
    FOR ALL USING (auth.uid() = user_id);

  -- Comments table policy
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);
  CREATE POLICY "Users can manage their own comments" ON comments
    FOR ALL USING (auth.uid() = user_id);

  -- Notifications table policy
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view and manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

  RETURN 'Database setup completed successfully';
END;
$$ LANGUAGE plpgsql;

