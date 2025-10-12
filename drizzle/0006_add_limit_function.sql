-- Custom SQL migration file, put your code below! --

-- Create a table to track weekly limits for each group
CREATE TABLE IF NOT EXISTS "DI_weekly_limits" (
    "id" SERIAL PRIMARY KEY,
    "groupId" INTEGER NOT NULL REFERENCES "DI_group"("id") ON DELETE CASCADE,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "totalLimit" INTEGER NOT NULL DEFAULT 400,
    "usedLimit" INTEGER NOT NULL DEFAULT 0,
    "remainingLimit" INTEGER NOT NULL DEFAULT 400,
    "carriedOverFromPrevious" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("groupId", "weekStart")
);

CREATE INDEX IF NOT EXISTS "weekly_limits_groupId_idx" ON "DI_weekly_limits"("groupId");
CREATE INDEX IF NOT EXISTS "weekly_limits_weekStart_idx" ON "DI_weekly_limits"("weekStart");

-- Function to get or create weekly limit for a group
CREATE OR REPLACE FUNCTION get_or_create_weekly_limit(p_group_id INTEGER, p_date DATE)
RETURNS TABLE(
    id INTEGER,
    groupId INTEGER,
    weekStart DATE,
    weekEnd DATE,
    totalLimit INTEGER,
    usedLimit INTEGER,
    remainingLimit INTEGER,
    carriedOverFromPrevious INTEGER
) AS $$
DECLARE
    v_week_start DATE;
    v_week_end DATE;
    v_previous_week_start DATE;
    v_previous_remaining INTEGER;
    v_total_limit INTEGER;
    v_limit_record RECORD;
BEGIN
    -- Calculate current week boundaries (Sunday to Saturday)
    v_week_start := DATE_TRUNC('week', p_date)::DATE;
    v_week_end := v_week_start + INTERVAL '6 days';
    
    -- Calculate previous week start
    v_previous_week_start := v_week_start - INTERVAL '7 days';
    
    -- Check if limit record exists for current week
    SELECT * INTO v_limit_record
    FROM "DI_weekly_limits"
    WHERE "groupId" = p_group_id
    AND "weekStart" = v_week_start;
    
    -- If record doesn't exist, create it
    IF NOT FOUND THEN
        -- Get remaining limit from previous week
        SELECT COALESCE("remainingLimit", 0) INTO v_previous_remaining
        FROM "DI_weekly_limits"
        WHERE "groupId" = p_group_id
        AND "weekStart" = v_previous_week_start;
        
        -- If no previous week data, default to 0
        v_previous_remaining := COALESCE(v_previous_remaining, 0);
        
        -- Total limit is base 400 + carried over amount
        v_total_limit := 400 + v_previous_remaining;
        
        -- Insert new weekly limit record
        INSERT INTO "DI_weekly_limits" (
            "groupId",
            "weekStart",
            "weekEnd",
            "totalLimit",
            "usedLimit",
            "remainingLimit",
            "carriedOverFromPrevious"
        ) VALUES (
            p_group_id,
            v_week_start,
            v_week_end,
            v_total_limit,
            0,
            v_total_limit,
            v_previous_remaining
        )
        RETURNING * INTO v_limit_record;
    END IF;
    
    -- Return the limit record
    RETURN QUERY
    SELECT 
        v_limit_record.id,
        v_limit_record."groupId",
        v_limit_record."weekStart",
        v_limit_record."weekEnd",
        v_limit_record."totalLimit",
        v_limit_record."usedLimit",
        v_limit_record."remainingLimit",
        v_limit_record."carriedOverFromPrevious";
END;
$$ LANGUAGE plpgsql;

-- Function to update weekly limit after a seed sale
CREATE OR REPLACE FUNCTION update_weekly_limit_after_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_week_start DATE;
    v_current_limit RECORD;
BEGIN
    -- Calculate current week start
    v_week_start := DATE_TRUNC('week', NEW."createdAt")::DATE;
    
    -- Get or create the weekly limit record
    SELECT * INTO v_current_limit
    FROM get_or_create_weekly_limit(NEW."groupId", NEW."createdAt"::DATE);
    
    -- Check if there's enough remaining limit
    IF v_current_limit.remainingLimit < NEW."seedsSold" THEN
        RAISE EXCEPTION 'Insufficient limit. Available: %, Requested: %', 
            v_current_limit.remainingLimit, NEW."seedsSold";
    END IF;
    
    -- Update the weekly limit
    UPDATE "DI_weekly_limits"
    SET 
        "usedLimit" = "usedLimit" + NEW."seedsSold",
        "remainingLimit" = "remainingLimit" - NEW."seedsSold",
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "groupId" = NEW."groupId"
    AND "weekStart" = v_week_start;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for seed sales limit checking and updating
CREATE TRIGGER enforce_and_update_weekly_limit_on_sale
    BEFORE INSERT ON "DI_sale"
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_limit_after_sale();

-- Function to manually rollover limits for all groups (can be called weekly)
CREATE OR REPLACE FUNCTION rollover_weekly_limits()
RETURNS TABLE(
    groupId INTEGER,
    groupName TEXT,
    oldWeekStart DATE,
    oldRemaining INTEGER,
    newWeekStart DATE,
    newTotalLimit INTEGER
) AS $$
DECLARE
    v_current_week_start DATE;
    v_new_week_start DATE;
    v_new_week_end DATE;
    v_group RECORD;
BEGIN
    v_current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    v_new_week_start := v_current_week_start + INTERVAL '7 days';
    v_new_week_end := v_new_week_start + INTERVAL '6 days';
    
    -- For each group, create next week's limit with rollover
    FOR v_group IN 
        SELECT DISTINCT g."id", g."groupName"
        FROM "DI_group" g
    LOOP
        -- This will automatically calculate rollover
        PERFORM get_or_create_weekly_limit(v_group.id, v_new_week_start);
        
        -- Return info about the rollover
        RETURN QUERY
        SELECT 
            v_group.id,
            v_group."groupName",
            curr."weekStart",
            curr."remainingLimit",
            next."weekStart",
            next."totalLimit"
        FROM "DI_weekly_limits" curr
        LEFT JOIN "DI_weekly_limits" next ON next."groupId" = v_group.id 
            AND next."weekStart" = v_new_week_start
        WHERE curr."groupId" = v_group.id
        AND curr."weekStart" = v_current_week_start;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION get_or_create_weekly_limit(INTEGER, DATE) IS 'Gets or creates weekly limit record with automatic rollover from previous week';
COMMENT ON FUNCTION update_weekly_limit_after_sale() IS 'Updates weekly limit after a seed sale and enforces limit constraints';
COMMENT ON FUNCTION rollover_weekly_limits() IS 'Manually triggers rollover of limits for all groups to the next week';