-- Add pricing columns to classes table
ALTER TABLE public.classes 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN is_free BOOLEAN DEFAULT true;

-- Create class_purchases table to track individual class purchases
CREATE TABLE public.class_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_access_logs table to track video access
CREATE TABLE public.video_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_part_id UUID NOT NULL REFERENCES public.class_parts(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signed_url_expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.class_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_purchases
CREATE POLICY "Users can view own purchases" 
ON public.class_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" 
ON public.class_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" 
ON public.class_purchases 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete purchases" 
ON public.class_purchases 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for video_access_logs
CREATE POLICY "Users can view own access logs" 
ON public.video_access_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access logs" 
ON public.video_access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert access logs" 
ON public.video_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_class_purchases_user_id ON public.class_purchases(user_id);
CREATE INDEX idx_class_purchases_class_id ON public.class_purchases(class_id);
CREATE INDEX idx_video_access_logs_user_id ON public.video_access_logs(user_id);
CREATE INDEX idx_video_access_logs_class_id ON public.video_access_logs(class_id);
CREATE INDEX idx_video_access_logs_accessed_at ON public.video_access_logs(accessed_at);