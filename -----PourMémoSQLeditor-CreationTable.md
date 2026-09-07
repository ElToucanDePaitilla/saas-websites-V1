CREATE TABLE public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  title_h1 TEXT NOT NULL,
  menu_title TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true NOT NULL,
  is_in_menu BOOLEAN DEFAULT true NOT NULL,
  menu_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(photographer_id, slug)
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.page_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  module_type TEXT NOT NULL,
  order_index INT DEFAULT 0 NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  layout_variant TEXT DEFAULT 'default',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.page_modules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  r2_url TEXT NOT NULL,
  alt_text TEXT,
  width INT,
  height INT,
  file_size INT,
  ai_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;