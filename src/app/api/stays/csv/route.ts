import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { fromZonedTime } from 'date-fns-tz';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: hotels } = await supabase.from('hotels').select('id, timezone, check_in_time, check_out_time').limit(1).single();
    if (!hotels) return NextResponse.json({ error: 'No hotel assigned' }, { status: 403 });
    const hotel_id = hotels.id;
    const hotelTimezone = hotels.timezone || 'America/Argentina/Buenos_Aires';
    const check_in_time = hotels.check_in_time || '15:00';
    const check_out_time = hotels.check_out_time || '11:00';

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: file' },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    const rows = fileContent.split('\n').map(row => row.trim()).filter(row => row.length > 0);
    
    // Check if there are rows beyond header
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or only contains headers' }, { status: 400 });
    }

    // Skip header row
    const dataRows = rows.slice(1);
    const parsedData: any[] = [];
    const emailsToLookup = new Set<string>();

    for (const row of dataRows) {
      // Basic CSV split, assuming no quotes protecting commas for this MVP
      const [name, email, room_number, check_in_date, check_out_date] = row.split(',').map(cell => cell.trim());
      
      if (!name || !email || !check_in_date || !check_out_date) {
        continue; // Skip invalid rows
      }

      // Format assuming YYYY-MM-DD date. Appends standard checkout time and checkin based on hotel config
      // Then securely shifts it to UTC representation according to the Hotel's timezone.
      let finalCheckIn, finalCheckOut;
      try {
        finalCheckIn = fromZonedTime(`${check_in_date}T${check_in_time}:00`, hotelTimezone).toISOString();
        finalCheckOut = fromZonedTime(`${check_out_date}T${check_out_time}:00`, hotelTimezone).toISOString();
      } catch (e) {
        // Fallback natively if user provided a weird date format in the CSV cell
        finalCheckIn = new Date(check_in_date).toISOString();
        finalCheckOut = new Date(check_out_date).toISOString();
      }

      parsedData.push({
        name,
        email,
        room_number: room_number || null,
        check_in_date: finalCheckIn,
        check_out_date: finalCheckOut
      });
      emailsToLookup.add(email);
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found in CSV' }, { status: 400 });
    }

    const uniqueEmailsArray = Array.from(emailsToLookup);

    // 1. Batch Query Existing Guests
    const { data: existingGuests, error: lookupErr } = await supabase
      .from('guests')
      .select('id, email')
      .in('email', uniqueEmailsArray);

    if (lookupErr) {
      console.error('Error looking up batch guests:', lookupErr);
      return NextResponse.json({ error: 'Failed to lookup guests' }, { status: 500 });
    }

    const emailToGuestIdMap = new Map<string, string>();
    const existingEmails = new Set<string>();

    if (existingGuests) {
      for (const guest of existingGuests) {
        emailToGuestIdMap.set(guest.email, guest.id);
        existingEmails.add(guest.email);
      }
    }

    // 2. Batch Insert New Guests
    const guestsToInsert = [];
    // Ensure we don't try to insert the same new email twice if duplicate in CSV
    const newEmailsSeen = new Set<string>();

    for (const data of parsedData) {
      if (!existingEmails.has(data.email) && !newEmailsSeen.has(data.email)) {
        guestsToInsert.push({
          hotel_id,
          name: data.name,
          email: data.email
        });
        newEmailsSeen.add(data.email);
      }
    }

    if (guestsToInsert.length > 0) {
      const { data: insertedGuests, error: insertGuestErr } = await supabaseAdmin
        .from('guests')
        .insert(guestsToInsert)
        .select('id, email');

      if (insertGuestErr) {
        console.error('Error batch inserting guests:', insertGuestErr);
        return NextResponse.json({ error: 'Failed to insert new guests' }, { status: 500 });
      }

      if (insertedGuests) {
        for (const guest of insertedGuests) {
          emailToGuestIdMap.set(guest.email, guest.id);
        }
      }
    }

    // 3. Batch Insert Guest Stays
    const staysToInsert = [];
    let failedRows = 0;

    for (const data of parsedData) {
      const guestId = emailToGuestIdMap.get(data.email);
      if (!guestId) {
        failedRows++;
        continue;
      }

      staysToInsert.push({
        hotel_id,
        guest_id: guestId,
        room_number: data.room_number,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date
      });
    }

    if (staysToInsert.length > 0) {
      const { error: insertStaysErr } = await supabaseAdmin
        .from('guest_stays')
        .insert(staysToInsert);

      if (insertStaysErr) {
        console.error('Error batch inserting stays:', insertStaysErr);
        return NextResponse.json({ error: 'Failed to insert stays' }, { status: 500 });
      }
    }

    return NextResponse.json({
      imported_rows: staysToInsert.length,
      failed_rows: dataRows.length - staysToInsert.length
    });

  } catch (error: any) {
    console.error('CSV ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
