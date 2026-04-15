-- RLS policies para la tabla hotels

-- Se permite lectura a aquellos cuyo jwt hotel_id concuerde con el id de la fila
CREATE POLICY "Staff can view their hotel info" 
ON hotels FOR SELECT USING ( id::text = (auth.jwt() ->> 'hotel_id') );

-- Se permite actualización a aquellos cuyo jwt hotel_id concuerde con el id de la fila
CREATE POLICY "Staff can edit their hotel info" 
ON hotels FOR UPDATE USING ( id::text = (auth.jwt() ->> 'hotel_id') );
