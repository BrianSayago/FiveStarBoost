"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateHotelSettings(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let hotelId = user.app_metadata?.hotel_id || user.user_metadata?.hotel_id;

  if (!hotelId) {
    const adminEmails = process.env.SUPER_ADMIN_EMAILS
      ? process.env.SUPER_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : [];
    const isSuperAdmin = user && adminEmails.includes(user.email?.toLowerCase() || '');

    if (isSuperAdmin) {
      const { data: firstHotel } = await supabaseAdmin.from('hotels').select('id').limit(1).single();
      if (firstHotel) hotelId = firstHotel.id;
    }

    if (!hotelId) {
      throw new Error("No hotel associated with this user.");
    }
  }

  // 1. Basic URL validation
  let googleReviewLink = formData.get("google_review_link") as string;
  if (googleReviewLink && !googleReviewLink.startsWith("http")) {
    throw new Error("Please enter a valid URL starting with http:// or https://");
  }

  // 2. Initial Data payload
  const updates: Record<string, string> = {
    name: formData.get("name") as string,
    contact_email: formData.get("contact_email") as string,
    contact_phone: formData.get("contact_phone") as string,
    check_in_time: formData.get("check_in_time") as string,
    check_out_time: formData.get("check_out_time") as string,
    google_review_link: googleReviewLink,
  };

  // 3. Handle File Upload if present
  const logoFile = formData.get("logo") as File;
  if (logoFile && logoFile.size > 0) {
    const fileExt = logoFile.name.split('.').pop();
    const filePath = `${hotelId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("hotel-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (!uploadError) {
      // Get the public URL for the newly uploaded logo
      const { data: { publicUrl } } = supabase.storage
        .from("hotel-logos")
        .getPublicUrl(filePath);
        
      updates.logo_url = publicUrl;
    } else {
      console.error("Upload error", uploadError);
      throw new Error(`Error de Storage: ${uploadError.message} (Detalle: ${JSON.stringify(uploadError)})`);
    }
  }

  // 4. Update the Database using the Admin Client to bypass any RLS UPDATE issues
  const { data: updatedHotel, error } = await supabaseAdmin
    .from("hotels")
    .update(updates)
    .eq("id", hotelId)
    .select(); // Ask Supabase to return the row if successful

  if (error) {
    console.error("DB Update error", error);
    throw new Error("Error al guardar la configuración");
  }

  if (!updatedHotel || updatedHotel.length === 0) {
    console.error("Silent RLS failure: 0 rows updated.");
    throw new Error("Tus datos no se guardaron. Falta la política de UPDATE (RLS) en la tabla hotels.");
  }

  // Revalidate the entire dashboard layout to instantly reflect new hotel name and data
  revalidatePath("/", "layout");
  return { success: true };
}
