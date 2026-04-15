-- Actualizar la función del Trigger de los correos para que respete el check_in_time del hotel
CREATE OR REPLACE FUNCTION schedule_guest_emails()
RETURNS TRIGGER AS $$
DECLARE
    h_time TIME;
BEGIN
    -- Obtenemos el horario oficial de check-in del hotel. 
    -- Si no tiene uno asignado, por defecto tomamos las 15:00
    SELECT COALESCE(check_in_time::TIME, '15:00'::TIME) INTO h_time
    FROM hotels 
    WHERE id = NEW.hotel_id;

    -- 1. Email de Bienvenida: 1 hora DESPUÉS del horario oficial
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'WELCOME', 'PENDING', 
        (date_trunc('day', NEW.check_in_date) + h_time + INTERVAL '1 hour')::TIMESTAMPTZ
    );

    -- 2. Mitad de estadía (Opcional): Día siguiente al mediodía local
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'STAY_CHECK', 'PENDING', 
        (date_trunc('day', NEW.check_in_date) + INTERVAL '1 day 11 hours')
    );

    -- 3. Pedir la Reseña: 3 horas después del check-out
    INSERT INTO email_events (hotel_id, stay_id, type, status, scheduled_for)
    VALUES (
        NEW.hotel_id, NEW.id, 'REVIEW_REQUEST', 'PENDING', 
        NEW.check_out_date + INTERVAL '3 hours'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
