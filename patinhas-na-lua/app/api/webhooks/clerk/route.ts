import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the event
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data
    const email = email_addresses[0]?.email_address
    const name = `${first_name || ''} ${last_name || ''}`.trim()
    const phone = phone_numbers[0]?.phone_number

    if (email) {
       console.log(`[Clerk Webhook] Processing user.created for ${email} (Clerk ID: ${id})`);
       
       // 1. Check for Pre-Existing Match
       // We include Soft Deleted users too, just in case they are returning? 
       // Actually, if they are Soft Deleted, we might want to restore them AND update ID.
       // But Prisma `findUnique` ignores soft deleted if we don't have a filter? 
       // No, Prisma standard `findUnique` finds everything unless we added middleware (we haven't).
       
       const existingUser = await db.user.findUnique({
          where: { email }
       });

       if (existingUser) {
           console.log(`[Clerk Webhook] Found existing match: ${existingUser.id} (Status: ${existingUser.status})`);
           
           // If IDs mismatch, we MUST migrate.
           if (existingUser.id !== id) {
               console.log(`[Clerk Webhook] MIGRATING ID: ${existingUser.id} -> ${id}`);
               
               try {
                  // TRANSACTIONAL MIGRATION (Safe for FK constraints)
                  await db.$transaction(async (tx) => {
                      // 1. Move Old User aside (Free up Email and ReferralCode unique constraints)
                      const tempSuffix = `_old_${existingUser.id.substring(0, 5)}`;
                      await tx.user.update({
                          where: { id: existingUser.id },
                          data: {
                              email: `${existingUser.email}${tempSuffix}`,
                              referralCode: existingUser.referralCode ? `${existingUser.referralCode}${tempSuffix}` : undefined
                          }
                      });

                      // 2. Create New User with Clerk ID + Copy Data
                      await tx.user.create({
                          data: {
                              id: id, // The new Clerk ID
                              email: email, // Real Email
                              name: existingUser.name || name, // Keep existing name if present, else use Clerk's
                              phone: existingUser.phone || phone,
                              nif: existingUser.nif,
                              address: existingUser.address,
                              notes: existingUser.notes,
                              
                              isAdmin: existingUser.isAdmin,
                              isSuperAdmin: existingUser.isSuperAdmin,
                              isBlacklisted: existingUser.isBlacklisted,
                              isOfflineUser: false, // Now they are online!
                              status: 'ACTIVE',
                              
                              createdAt: existingUser.createdAt, // Preserve history age
                              
                              facturalusaId: existingUser.facturalusaId,
                              loyaltyPoints: existingUser.loyaltyPoints,
                              billingProfileId: existingUser.billingProfileId,
                              
                              referralCode: existingUser.referralCode, // Keep original code
                              referredById: existingUser.referredById,
                              
                              deletedAt: null // Ensure restored
                          }
                      });

                      // 3. Migrate Relations (Update FKs)
                      // Pets
                      await tx.pet.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Appointments
                      await tx.appointment.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Invoices
                      await tx.invoice.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Coupons
                      await tx.coupon.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Push Subscriptions
                      await tx.pushSubscription.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Audit Logs
                      await tx.auditLog.updateMany({
                          where: { userId: existingUser.id },
                          data: { userId: id }
                      });
                      // Referrals (Users referred by this user)
                      await tx.user.updateMany({
                          where: { referredById: existingUser.id },
                          data: { referredById: id }
                      });

                      // 4. Delete Old User
                      await tx.user.delete({
                          where: { id: existingUser.id }
                      });
                  });

                  await logAudit("SYSTEM", "User", id, `Migrated User ID from ${existingUser.id} to ${id} via Clerk Sign-up`);
                  
               } catch (err) {
                   console.error("[Clerk Webhook] ID Migration Failed:", err);
                   return new Response('Error migrating user ID', { status: 500 });
               }
           } else {
               // IDs match (maybe re-event?), just ensure active
               await db.user.update({
                   where: { id },
                   data: { status: 'ACTIVE', deletedAt: null }
               });
           }
       } else {
           // New User (No offline/invite record found)
           // Create them
           await db.user.create({
               data: {
                   id: id,
                   email: email,
                   name: name,
                   phone: phone,
                   status: 'ACTIVE'
               }
           });
           await logAudit("CREATE", "User", id, "User Signed up via Clerk");
       }
    }
  }

  return new Response('', { status: 200 })
}
