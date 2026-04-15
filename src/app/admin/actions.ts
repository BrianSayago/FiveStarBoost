'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Authorization Check function
async function isAuthorized() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const adminEmails = process.env.SUPER_ADMIN_EMAILS
    ? process.env.SUPER_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : []

  if (!adminEmails.includes(user.email?.toLowerCase() || '')) {
    return false
  }

  return true
}

export async function createHotelOnboarding(formData: FormData) {
  // 1. Authorization
  const authorized = await isAuthorized()
  if (!authorized) {
    return { success: false, error: 'Unauthorized Access' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const timezone = formData.get('timezone') as string || 'UTC'

  if (!name || !email || !password) {
    return { success: false, error: 'Name, email and password are required' }
  }

  const adminSupabase = createAdminClient()

  try {
    // 2. Insert into Hotels bypass RLS (using service role)
    const { data: hotel, error: hotelError } = await adminSupabase
      .from('hotels')
      .insert({
        name: name,
        contact_email: email,
        timezone: timezone
      })
      .select('id')
      .single()

    if (hotelError || !hotel) {
      console.error('Error creating hotel:', hotelError)
      return { success: false, error: 'Failed to create hotel record.' }
    }

    const hotelId = hotel.id

    // 3. Create Auth User
    const { data: userData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto confirm so they can login immediately
    })

    if (authError || !userData.user) {
      // Rollback hotel creation if user fails? 
      await adminSupabase.from('hotels').delete().eq('id', hotelId)
      console.error('Error creating user:', authError)
      return { success: false, error: authError?.message || 'Failed to create user account.' }
    }

    // 4. Update App Metadata to bind user to Hotel
    const { error: metaError } = await adminSupabase.auth.admin.updateUserById(
      userData.user.id,
      { app_metadata: { hotel_id: hotelId } }
    )

    if (metaError) {
      console.error('Error updating metadata:', metaError)
      return { success: false, error: 'Failed to link user to hotel.' }
    }

    revalidatePath('/admin')
    return { success: true }

  } catch (err: any) {
    console.error('Unexpected error during hotel creation:', err)
    return { success: false, error: 'Unexpected error occurred.' }
  }
}

export async function deleteHotel(hotelId: string) {
  const authorized = await isAuthorized()
  if (!authorized) {
    return { success: false, error: 'Unauthorized Access' }
  }

  if (!hotelId) return { success: false, error: 'Hotel ID is required' }

  const adminSupabase = createAdminClient()

  try {
    // 1. Delete associated users in Auth
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
    
    if (!usersError && users) {
      const hotelUsers = users.filter((u: any) => 
        u.app_metadata?.hotel_id === hotelId || u.user_metadata?.hotel_id === hotelId
      );
      
      for (const user of hotelUsers) {
        await adminSupabase.auth.admin.deleteUser(user.id);
      }
    } else {
      console.error("Error fetching users for deletion:", usersError);
    }

    // 2. Delete the hotel from DB. Foreign keys have ON DELETE CASCADE
    const { error: deleteError } = await adminSupabase.from('hotels').delete().eq('id', hotelId);
    
    if (deleteError) {
      console.error('Error deleting hotel:', deleteError);
      return { success: false, error: 'Failed to delete hotel database record.' };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error during hotel deletion:', err);
    return { success: false, error: 'Unexpected error occurred.' };
  }
}

export async function resetHotelPassword(hotelId: string, newPassword: string) {
  const authorized = await isAuthorized()
  if (!authorized) return { success: false, error: 'Unauthorized Access' }

  if (!hotelId || !newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const adminSupabase = createAdminClient()

  try {
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers()
    if (usersError || !users) return { success: false, error: 'No se pudieron recuperar los usuarios' }

    const hotelUsers = users.filter((u: any) => 
      u.app_metadata?.hotel_id === hotelId || u.user_metadata?.hotel_id === hotelId
    )

    if (hotelUsers.length === 0) return { success: false, error: 'No se encontró una cuenta de usuario para este hotel' }

    for (const user of hotelUsers) {
      const { error } = await adminSupabase.auth.admin.updateUserById(user.id, { password: newPassword })
      if (error) throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error during password reset:', err)
    return { success: false, error: err.message || 'Error inesperado al reiniciar la contraseña' }
  }
}

