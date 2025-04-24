-- Create daily_verses table
CREATE TABLE IF NOT EXISTS daily_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  verse_key TEXT NOT NULL,
  reflection TEXT NOT NULL,
  theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE daily_verses ENABLE ROW LEVEL SECURITY;

-- Everyone can read daily verses
CREATE POLICY "Allow public read access to daily_verses" 
  ON daily_verses FOR SELECT USING (true);

-- Only authenticated admin users can insert, update, or delete daily verses
CREATE POLICY "Allow admin insert on daily_verses" 
  ON daily_verses FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "Allow admin update on daily_verses" 
  ON daily_verses FOR UPDATE 
  USING (auth.role() = 'authenticated' AND auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "Allow admin delete on daily_verses" 
  ON daily_verses FOR DELETE 
  USING (auth.role() = 'authenticated' AND auth.email() IN (SELECT email FROM admin_users));

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample daily verses data
INSERT INTO daily_verses (date, verse_key, reflection, theme)
VALUES 
  (CURRENT_DATE, '요한복음-3-16', 
   '하나님은 우리를 너무나 사랑하셔서 독생자를 보내주셨습니다. 이것은 단순한 말이 아니라 실제적인 행동으로 보여주신 사랑입니다. 우리가 받을 수 없는 사랑을 베풀어주신 하나님께 감사드립니다.\n\n오늘 하루, 이 사랑을 기억하며 우리도 누군가에게 조건 없는 사랑을 나눠봅시다.',
   '하나님의 사랑'),
   
  (CURRENT_DATE - INTERVAL '1 day', '시편-23-1', 
   '여호와는 나의 목자시니, 내게 부족함이 없으리로다. 이 말씀은 하나님이 우리의 모든 필요를 채우신다는 약속입니다. 때로는 우리가 원하는 것과 필요한 것이 다를 수 있지만, 하나님은 진정으로 우리에게 최선인 것을 알고 계십니다.\n\n오늘 하루, 하나님이 당신의 목자라는 것을 기억하며 그분을 신뢰하는 마음을 가져봅시다.',
   '하나님의 인도하심'),
   
  (CURRENT_DATE - INTERVAL '2 days', '잠언-3-5', 
   '우리의 지혜는 제한적이지만, 하나님의 지혜는 무한합니다. 이 구절은 우리 자신의 이해와 계획에 의존하지 말고 하나님을 온전히 신뢰하라고 권면합니다. 특히 삶이 불확실하고 혼란스러울 때, 이 말씀을 기억해야 합니다.\n\n오늘, 당신이 직면한 결정이나 상황에서 자신의 뜻보다 하나님의 뜻을 구하는 시간을 가져보세요.',
   '신뢰와 인도'),
   
  (CURRENT_DATE - INTERVAL '3 days', '빌립보서-4-13', 
   '그리스도를 통해 우리는 모든 것을 할 수 있습니다. 이 말씀은 우리가 초인적인 능력을 갖게 된다는 뜻이 아니라, 하나님이 우리에게 주신 사명을 감당할 수 있는 힘을 주신다는 의미입니다.\n\n오늘 당신이 직면한 도전 앞에서, 그리스도께서 주시는 힘을 의지해보세요. 어려움 속에서도 그분의 능력이 당신과 함께 합니다.',
   '힘과 용기'),
   
  (CURRENT_DATE - INTERVAL '4 days', '마태복음-11-28', 
   '예수님은 지친 우리를 초대하십니다. 인생의 무게와 짐이 너무 무거울 때, 예수님께 나아가면 참된 쉼을 얻을 수 있습니다. 이 쉼은 단순한 휴식을 넘어서는 영혼의 평안을 의미합니다.\n\n오늘, 잠시 멈추고 예수님의 초대에 응답하는 시간을 가져보세요. 모든 근심과 걱정을 그분께 맡기고 그분의 평안을 경험하세요.',
   '쉼과 평안'),
   
  (CURRENT_DATE - INTERVAL '5 days', '이사야-41-10', 
   '두려움은 우리 모두가 경험하는 감정이지만, 하나님은 우리와 함께 하시며 두려워하지 말라고 말씀하십니다. 그분은 우리를 강하게 하시고, 도우시며, 붙드시겠다고 약속하십니다.\n\n오늘 당신이 두려움을 느낀다면, 이 말씀을 묵상하며 하나님의 임재와 도우심을, 그리고 그분의 공의로운 오른손이 당신을 붙들고 있음을 기억하세요.',
   '두려움 극복'),
   
  (CURRENT_DATE - INTERVAL '6 days', '로마서-8-28', 
   '이 구절은 하나님을 사랑하는 사람들에게 모든 것이 합력하여 선을 이룬다고 약속합니다. 이는 모든 일이 좋게 끝난다는 의미가 아니라, 하나님이 모든 상황을 사용하여 우리의 성장과 성숙을 이끄신다는 뜻입니다.\n\n오늘 당신의 어려운 상황 속에서도, 하나님이 어떻게 그것을 선한 목적을 위해 사용하실지 생각해보세요. 우리가 이해할 수 없는 방식으로도 그분은 일하고 계십니다.',
   '하나님의 계획');

-- Note: Admin user setup 
-- INSERT INTO admin_users (email) VALUES ('your-admin-email@example.com'); 