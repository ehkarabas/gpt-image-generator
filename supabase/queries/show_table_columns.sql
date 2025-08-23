-- Tüm table'ların column bilgilerini listele
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('_health_check', 'conversations', 'images', 'messages', 'profiles') -- anlık olarak hangi table'lar varsa onları koy buraya
ORDER BY table_name, ordinal_position;