import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createPetAction, deletePetAction } from "@/app/admin/clients/actions";
import { PetSize, CoatType } from "@prisma/client";
import Link from "next/link";
import DeleteForm from "@/app/admin/components/delete-form";
import EditPetModal from "./edit-pet-modal";

const SPECIES_ICON_MAP: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  RABBIT: "🐰",
  OTHER: "🐾"
};

// User-friendly labels
const SIZE_LABELS: Record<PetSize, string> = {
  TOY: "Toy (< 5kg)",
  SMALL: "Pequeno (5 - 10kg)",
  MEDIUM: "Médio (11 - 20kg)",
  LARGE: "Grande (21 - 30kg)",
  XL: "XL (31 - 40kg)",
  GIANT: "Gigante (> 40kg)",
};

const COAT_LABELS: Record<CoatType, string> = {
  SHORT: "Pelo Curto",
  MEDIUM: "Pelo Médio",
  LONG: "Pelo Comprido",
};

export default async function MyPetsPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { pets: true }
  });

  if (!dbUser) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">

        {/* LEFT: LIST OF PETS */}
        <div className="space-y-4">
          <h2 className="font-bold text-primary text-lg">Meus Pets Registados</h2>
          {dbUser.pets.map(pet => (
            <div key={pet.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-primary">{pet.name}</h3>
                  <p className="text-sm text-foreground/60">{pet.breed || "Raça não definida"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase bg-primary-light text-primary flex items-center gap-1`}>
                    <span className="text-lg" title={pet.species}>
                      {SPECIES_ICON_MAP[pet.species] || "🐾"}
                    </span>
                    {pet.species === 'DOG' ? 'Cão' : pet.species === 'CAT' ? 'Gato' : 'Coelho'}
                  </span>

                  {/* EDIT BUTTON */}
                  <EditPetModal pet={pet} />

                  {/* DELETE BUTTON */}
                  <DeleteForm
                    id={pet.id}
                    action={deletePetAction}
                    className="ml-2 text-xs font-bold text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition"
                  >
                    Eliminar
                  </DeleteForm>
                </div>
              </div>
              <div className="mt-4 text-sm text-foreground grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded border border-secondary/20">
                  <span className="block text-xs text-foreground/50 uppercase font-bold mb-1">Tamanho</span>
                  <span className="font-medium">{pet.sizeCategory ? SIZE_LABELS[pet.sizeCategory] : "--"}</span>
                </div>
                <div className="bg-white p-2 rounded border border-secondary/20">
                  <span className="block text-xs text-foreground/50 uppercase font-bold mb-1">Pelo</span>
                  <span className="font-medium">{pet.coatType ? COAT_LABELS[pet.coatType] : "--"}</span>
                </div>
              </div>
            </div>
          ))}
          {dbUser.pets.length === 0 && (
            <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500">
              Ainda não adicionou nenhum animal.
            </div>
          )}
        </div>

        {/* RIGHT: ADD PET FORM */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-fit sticky top-20">
          <h2 className="font-bold text-xl text-primary mb-6 flex items-center gap-2">
            Adicionar Novo Pet <span className="text-2xl">🐾</span>
          </h2>

          <form action={createPetAction} className="space-y-5">
            <input type="hidden" name="userId" value={user.id} />

            {/* NAME */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Nome do Pet</label>
              <input
                name="name"
                required
                className="w-full border border-gray-300 p-3 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Ex: Bobby"
              />
            </div>

            {/* SPECIES & GENDER */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Espécie</label>
                <select
                  name="species"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DOG">Cão</option>
                  <option value="CAT">Gato</option>
                  <option value="RABBIT">Coelho</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Sexo</label>
                <select
                  name="gender"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
            </div>

            {/* SIZE & COAT (Highlight these) */}
            <div className="bg-primary-soft/30 p-4 rounded-lg border border-primary/20">
              <p className="text-xs font-bold text-secondary uppercase mb-3">Informações para o Preço</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Tamanho *</label>
                  <select
                    name="sizeCategory"
                    required
                    className="w-full border border-primary/20 p-3 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="text-gray-400">Selecione o tamanho...</option>
                    {Object.entries(SIZE_LABELS).map(([key, label]) => (
                      <option key={key} value={key} className="text-gray-900">{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Tipo de pelo *</label>
                  <select
                    name="coatType"
                    required
                    className="w-full border border-primary/20 p-3 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="text-gray-400">Selecione o pelo...</option>
                    {Object.entries(COAT_LABELS).map(([key, label]) => (
                      <option key={key} value={key} className="text-gray-900">{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BREED (OPTIONAL) */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1">Raça (Opcional)</label>

              <div className="relative">

                <input
                  name="breed"
                  className="w-full border border-gray-300 p-3 pr-10 rounded-lg text-foreground bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Caniche"
                />

                {/* Icon wrapper */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center cursor-help breed-help-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>

                  {/* Tooltip */}
                  <div className="breed-tooltip absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl pointer-events-none opacity-0 invisible transition-all duration-200">
                    <p className="font-bold mb-1 text-white text-sm">Ajuda sobre a Raça:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-300 leading-relaxed">
                      <li>Se não souber ou for mistura, escreva <span className="font-bold text-white">"IND"</span>.</li>
                      <li>Se for raça pura, escreva o nome (ex: <span className="font-bold text-white">"Pitbull"</span>).</li>
                    </ul>

                    <div className="absolute top-full right-2 border-8 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BIRTHDATE */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data Nascimento (Aprox)</label>
              <input
                name="birthDate"
                type="date"
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition shadow-lg mt-2 text-lg">
              Guardar Animal
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}