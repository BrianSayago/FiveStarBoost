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
    return { success: false, error: 'Acceso no autorizado' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const timezone = formData.get('timezone') as string || 'UTC'

  if (!name || !email) {
    return { success: false, error: 'Nombre y email son obligatorios' }
  }

  const adminSupabase = createAdminClient()

  try {
    // 2. Insert into Hotels
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
      return { success: false, error: 'Error al crear el registro del hotel.' }
    }

    const hotelId = hotel.id

    // 3. Check if user already exists
    let userId: string;
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    const existingUser = users.find((u: any) => u.email === email)

    if (existingUser) {
      userId = existingUser.id
      // For existing users, we just trigger a recovery email which functions as a notification/setup link
      if (process.env.NODE_ENV === 'development') {
        const { data, error } = await adminSupabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password` }
        })
        if (!error && data?.properties?.action_link) {
          console.log('\n\n🟢 MODO DEV - LINK DE RECUPERACIÓN GENERADO:');
          console.log(data.properties.action_link);
          console.log('👆 (Haz CTRL+Click sobre el enlace para simular que abriste el email sin gastar la cuota)\n\n');
        }
      } else {
        await adminSupabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
        })
      }
    } else {
      // Invite new User
      if (process.env.NODE_ENV === 'development') {
        const { data, error } = await adminSupabase.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { hotel_id: hotelId },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
          }
        })
        if (error || !data.user) {
          await adminSupabase.from('hotels').delete().eq('id', hotelId)
          return { success: false, error: error?.message || 'Error al generar la invitación.' }
        }
        console.log('\n\n🟢 MODO DEV - LINK DE INVITACIÓN GENERADO:');
        console.log(data.properties?.action_link);
        console.log('👆 (Haz CTRL+Click sobre el enlace para simular que abriste el email sin gastar la cuota)\n\n');
        userId = data.user.id
      } else {
        const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
          data: { hotel_id: hotelId },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
        })

        if (inviteError || !inviteData.user) {
          // Rollback hotel if invitation fails
          await adminSupabase.from('hotels').delete().eq('id', hotelId)
          console.error('Error inviting user:', inviteError)
          return { success: false, error: inviteError?.message || 'Error al enviar la invitación.' }
        }
        userId = inviteData.user.id
      }
    }

    // 4. Create Profile & Hotel Association
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: userId,
      email: email,
      role: 'OWNER'
    })

    const { error: associationError } = await adminSupabase.from('hotel_users').insert({
      hotel_id: hotelId,
      user_id: userId,
      role: 'OWNER'
    })

    if (profileError || associationError) {
      console.error('Error linking user:', profileError || associationError)
      // We don't rollback everything here as the user is already invited, 
      // but in production you might want more robust handling.
    }

    revalidatePath('/admin')
    return { success: true }

  } catch (err: any) {
    console.error('Unexpected error during hotel creation:', err)
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}

export async function deleteHotel(hotelId: string) {
  const authorized = await isAuthorized()
  if (!authorized) {
    return { success: false, error: 'Acceso no autorizado' }
  }

  if (!hotelId) return { success: false, error: 'Hotel ID is required' }

  const adminSupabase = createAdminClient()

  try {
    // 1. Fetch users belonging to this hotel
    const { data: members, error: membersError } = await adminSupabase
      .from('hotel_users')
      .select('user_id')
      .eq('hotel_id', hotelId)

    if (!membersError && members) {
      for (const member of members) {
        // IMPORTANT: Check if user belongs to other hotels before deleting from Auth
        const { count, error: countError } = await adminSupabase
          .from('hotel_users')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.user_id)
        
        if (!countError && count === 1) {
          // If they only belong to this hotel, it's safe to delete identity
          await adminSupabase.auth.admin.deleteUser(member.user_id)
        } else {
          // just let cascade delete the hotel_users relationship for this hotel
        }
      }
    }

    // 2. Delete the hotel (cascade delete handles hotel_users, profiles etc mapping if FK set up)
    const { error: deleteError } = await adminSupabase.from('hotels').delete().eq('id', hotelId)
    
    if (deleteError) {
      console.error('Error deleting hotel:', deleteError)
      return { success: false, error: 'Error al eliminar el registro del hotel.' }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error during hotel deletion:', err)
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}

export async function resetHotelPassword(hotelId: string, newPassword: string) {
  const authorized = await isAuthorized()
  if (!authorized) return { success: false, error: 'Acceso no autorizado' }

  if (!hotelId || !newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const adminSupabase = createAdminClient()

  try {
    // 1. Fetch the contact_email for this hotel or owners
    const { data: hotelDb } = await adminSupabase.from('hotels').select('contact_email').eq('id', hotelId).single()
    const contactEmail = hotelDb?.contact_email

    // 2. Find who belongs to this hotel
    const { data: mappings } = await adminSupabase.from('hotel_users').select('user_id, role').eq('hotel_id', hotelId)
    
    if (!mappings || mappings.length === 0) {
      return { success: false, error: 'No se encontraron usuarios vinculados a este hotel en la base de datos' }
    }

    // Filter to owners or the main contact
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    
    // Attempt to target specifically the contact_email first
    const targetUserAuth = users?.find(u => u.email === contactEmail)
    let userIdsToUpdate: string[] = []

    if (targetUserAuth && mappings.some(m => m.user_id === targetUserAuth.id)) {
      userIdsToUpdate = [targetUserAuth.id]
    } else {
      // If not matching by email precisely, update anyone who's an 'OWNER'
      const ownerIds = mappings.filter(m => m.role === 'OWNER').map(m => m.user_id)
      userIdsToUpdate = ownerIds.length > 0 ? ownerIds : mappings.map(m => m.user_id)
    }

    if (userIdsToUpdate.length === 0) {
      return { success: false, error: 'No se encontraron usuarios administradores para este hotel' }
    }

    for (const uid of userIdsToUpdate) {
      const { error } = await adminSupabase.auth.admin.updateUserById(uid, { password: newPassword })
      if (error) throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error during password reset:', err)
    return { success: false, error: err.message || 'Error inesperado al reiniciar la contraseña' }
  }
}


/**
 * Staff / User Management Actions
 */

export async function getHotelUsers(hotelId: string) {
  const authorized = await isAuthorized()
  if (!authorized) throw new Error('Unauthorized')

  const adminSupabase = createAdminClient()
  
  // Let's do it in two steps for reliability
  const { data: huData } = await adminSupabase
    .from('hotel_users')
    .select('user_id, role')
    .eq('hotel_id', hotelId)
  
  if (!huData) return []

  const userIds = huData.map(d => d.user_id)
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('*')
    .in('id', userIds)
  
  return profiles?.map(p => ({
    ...p,
    hotel_role: huData.find(hu => hu.user_id === p.id)?.role
  })) || []
}

export async function resetStaffPassword(userId: string) {
  const authorized = await isAuthorized()
  if (!authorized) return { success: false, error: 'Acceso no autorizado' }

  const adminSupabase = createAdminClient()
  
  const { data: user } = await adminSupabase.auth.admin.getUserById(userId)
  if (!user.user?.email) return { success: false, error: 'Usuario no encontrado' }

  if (process.env.NODE_ENV === 'development') {
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.user.email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password` }
    })
    
    if (error) return { success: false, error: error.message }
    
    console.log('\n\n🟢 MODO DEV - LINK DE RECUPERACIÓN GENERADO:');
    console.log(data.properties?.action_link);
    console.log('👆 (Haz CTRL+Click sobre el enlace para simular que abriste el email sin gastar la cuota)\n\n');
  } else {
    const { error } = await adminSupabase.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`
    })

    if (error) return { success: false, error: error.message }
  }
  return { success: true }
}

export async function deleteStaffUser(userId: string) {
  const authorized = await isAuthorized()
  if (!authorized) return { success: false, error: 'Acceso no autorizado' }

  const adminSupabase = createAdminClient()
  
  // Delete from Auth (profiles and hotel_users will cascade if REFERENCES set with ON DELETE CASCADE)
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/admin')
  return { success: true }
}


