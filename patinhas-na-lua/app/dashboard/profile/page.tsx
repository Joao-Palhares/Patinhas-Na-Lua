import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomProfileForm from "@/app/components/custom-profile-form";

export default async function ProfilePage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const dbUser = await db.user.findUnique({
        where: { id: user.id }
    });

    if (!dbUser) {
        return <div>Erro ao carregar perfil.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">O Meu Perfil</h1>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <CustomProfileForm initialData={dbUser} />
            </div>
        </div>
    );
}
