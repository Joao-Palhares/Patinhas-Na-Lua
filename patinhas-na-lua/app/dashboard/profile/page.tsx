import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function ProfilePageWrapper() {
  const user = await currentUser();
  if (!user) redirect("/");

  // Fetch DB User
  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) redirect("/onboarding");

  return <ProfileForm initialData={dbUser} />;
}
