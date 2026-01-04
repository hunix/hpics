-- Add extended demographic fields to contact_personal_info table
ALTER TABLE contact_personal_info
ADD COLUMN eye_color text,
ADD COLUMN hair_color text,
ADD COLUMN height_cm integer,
ADD COLUMN weight_kg numeric,
ADD COLUMN ethnicity text,
ADD COLUMN religion text,
ADD COLUMN marital_status text,
ADD COLUMN dietary_preferences text[],
ADD COLUMN political_affiliation text,
ADD COLUMN zodiac_sign text,
ADD COLUMN chinese_zodiac text,
ADD COLUMN mbti_type text,
ADD COLUMN handedness text,
ADD COLUMN shoe_size text,
ADD COLUMN clothing_size text;