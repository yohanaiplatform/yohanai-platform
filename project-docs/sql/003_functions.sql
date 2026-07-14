CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION core.set_created_defaults()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
END;
$func$;

CREATE OR REPLACE FUNCTION core.soft_delete_record()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
    NEW.deleted_at := now();
    RETURN NEW;
END;
$func$;