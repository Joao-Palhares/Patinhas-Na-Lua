"use client";

import { UserButton } from "@clerk/nextjs";
import { User } from "@prisma/client";
import CustomProfileForm from "./custom-profile-form";


export default function UserButtonWrapper({ dbUser }: { dbUser: User }) {
    return (
        <div className="flex items-center gap-4">
            <UserButton
                afterSignOutUrl="/"
                userProfileMode="modal"
            >
                <UserButton.UserProfilePage
                    label="Meus Dados"
                    url="custom-data"
                    labelIcon={<span className="text-lg">📋</span>}
                >
                    <CustomProfileForm initialData={dbUser} />
                </UserButton.UserProfilePage>
                {dbUser.isAdmin && (
                    <UserButton.MenuItems>
                        <UserButton.Link
                            label="Área Admin"
                            labelIcon={<span className="text-lg">🔒</span>}
                            href="/admin/appointments"
                        />
                    </UserButton.MenuItems>
                )}
            </UserButton>
        </div>
    );
}
