DROP POLICY IF EXISTS "Users can create families" ON families;

CREATE POLICY "Users can create families"
    ON families
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
