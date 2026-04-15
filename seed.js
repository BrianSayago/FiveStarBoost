require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🚀 Iniciando Prueba E2E Automática...');
  const hotelEmail = 'demo_e2e@tu-saas.com';
  const hotelPassword = 'Password123!';
  
  console.log('1. Creando identidad de usuario hotelero...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: hotelEmail, password: hotelPassword, email_confirm: true });
  let userId = authData?.user?.id;
  if(authError && authError.message.includes('registered')) {
    const { data: users } = await supabase.auth.admin.listUsers();
    userId = users.users.find(u => u.email === hotelEmail).id;
  }
  
  console.log('2. Creando el Hotel en Base de Datos...');
  const { data: hotelData, error: hotelErr } = await supabase.from('hotels').insert({
    name: 'Hotel Premium Vercel Test',
    contact_email: hotelEmail,
    check_in_time: '14:00',
    check_out_time: '11:00'
  }).select('id').single();
  const hotelId = hotelData.id;
  
  await supabase.auth.admin.updateUserById(userId, { user_metadata: { hotel_id: hotelId } });
  
  console.log('3. Ingresando tu contacto como huésped...');
  const { data: guestData } = await supabase.from('guests').insert({
    name: 'Brian Sayago', email: 'bsayagoa@gmail.com', hotel_id: hotelId
  }).select('id').single();
  
  console.log('4. Armando una estadía en el Pasado (Check-out atrasado)...');
  const pastIn = new Date(Date.now() - 48*60*60*1000).toISOString();
  const pastOut = new Date(Date.now() - 6*60*60*1000).toISOString(); // Hace 6 horas!
  
  const { data: stayData } = await supabase.from('guest_stays').insert({
    guest_id: guestData.id, hotel_id: hotelId, room_number: 'SUITE-V.I.P',
    check_in_date: pastIn, check_out_date: pastOut, status: 'CHECKED_OUT'
  }).select('*').single();
  
  console.log('\n=======================================');
  console.log('✅ PRUEBA COMPLETADA CON ÉXITO');
  console.log('Hotel:', 'Hotel Premium Vercel Test');
  console.log('Email Hotel:', hotelEmail);
  console.log('Pass Hotel:', hotelPassword);
  console.log('Acción requerida: Para acelerar la prueba de Mails, ve a n8n y dale al botón \'Play\' del nodo de Obtener Datos. El sistema notará que tu estadía cerró hace 6h y te mandará el mail de encuesta.');
  process.exit(0);
}
run();
