"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit, Trash2, Package, X } from "lucide-react";
import { createBrand, updateBrand, deleteBrand } from "../actions";
import { toast } from "sonner";

type Brand = {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  isActive: boolean;
  _count: { products: number };
};

export default function BrandsClient({ brands }: { brands: Brand[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    description: "",
    website: "",
    isActive: true,
  });

  const openNew = () => {
    setEditBrand(null);
    setForm({ name: "", logoUrl: "", description: "", website: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (brand: Brand) => {
    setEditBrand(brand);
    setForm({
      name: brand.name,
      logoUrl: brand.logoUrl || "",
      description: brand.description || "",
      website: brand.website || "",
      isActive: brand.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = editBrand
        ? await updateBrand(editBrand.id, {
            name: form.name.trim(),
            logoUrl: form.logoUrl.trim() || undefined,
            description: form.description.trim() || undefined,
            website: form.website.trim() || undefined,
            isActive: form.isActive,
          })
        : await createBrand({
            name: form.name.trim(),
            logoUrl: form.logoUrl.trim() || undefined,
            description: form.description.trim() || undefined,
            website: form.website.trim() || undefined,
          });

      if (result.success) {
        toast.success(editBrand ? "Marca atualizada" : "Marca criada");
        setShowModal(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Erro");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (brand._count.products > 0) {
      toast.error(`Não é possível eliminar. A marca tem ${brand._count.products} produto(s).`);
      return;
    }
    if (!confirm(`Eliminar "${brand.name}"?`)) return;

    const result = await deleteBrand(brand.id);
    if (result.success) {
      toast.success("Marca eliminada");
      window.location.reload();
    } else {
      toast.error(result.error || "Erro");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/stock" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
        >
          <Plus className="w-4 h-4" />
          Nova Marca
        </button>
      </div>

      {/* Brands List */}
      {brands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Ainda não tem marcas</p>
          <button
            onClick={openNew}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
          >
            Criar Primeira Marca
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${!brand.isActive ? 'opacity-60' : ''}`}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg relative flex-shrink-0">
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain p-2 rounded-lg" />
                ) : (
                  <Package className="w-8 h-8 text-gray-300 absolute inset-0 m-auto" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">{brand.name}</h3>
                  {!brand.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inativo</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{brand._count.products} produto(s)</p>
                {brand.description && (
                  <p className="text-sm text-gray-400 line-clamp-1">{brand.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(brand)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(brand)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">{editBrand ? "Editar Marca" : "Nova Marca"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Ex: Ownat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="https://ownat.com"
                />
              </div>
              {editBrand && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition disabled:opacity-50"
              >
                {isSubmitting ? "A guardar..." : editBrand ? "Guardar" : "Criar Marca"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
