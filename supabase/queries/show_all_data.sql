-- JSON formatında data gösteren alternatif function
CREATE OR REPLACE FUNCTION show_all_tables_data_json()
RETURNS TABLE(output_line text) AS $$
DECLARE
    table_record RECORD;
    row_count INTEGER;
    query_text TEXT;
    json_result JSONB;
BEGIN
    FOR table_record IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        ORDER BY t.table_name
    LOOP
        output_line := '=== TABLE: ' || table_record.table_name || ' ===';
        RETURN NEXT;
        
        -- Schema bilgisi
        SELECT jsonb_agg(
            jsonb_build_object(
                'column', column_name,
                'type', data_type,
                'nullable', is_nullable
            ) ORDER BY ordinal_position
        ) INTO json_result
        FROM information_schema.columns 
        WHERE table_name = table_record.table_name 
            AND table_schema = 'public';
            
        output_line := 'SCHEMA: ' || json_result::text;
        RETURN NEXT;
        
        -- Row count
        query_text := 'SELECT COUNT(*) FROM ' || quote_ident(table_record.table_name);
        EXECUTE query_text INTO row_count;
        output_line := 'ROW COUNT: ' || row_count;
        RETURN NEXT;
        
        -- Data (eğer varsa)
        IF row_count > 0 THEN
            query_text := 'SELECT jsonb_agg(to_jsonb(t.*)) FROM ' || quote_ident(table_record.table_name) || ' t';
            EXECUTE query_text INTO json_result;
            
            output_line := 'DATA: ' || json_result::text;
            RETURN NEXT;
        END IF;
        
        output_line := '';
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function'ı çalıştır
SELECT * FROM show_all_tables_data_json();