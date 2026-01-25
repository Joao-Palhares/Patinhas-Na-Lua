"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProduct, updateProduct } from "./actions";
import { toast } from "sonner";
import ImageUploader from "@/app/components/image-uploader";

type Brand = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  sku: string | null;
  weightKg: number | null;
  targetAge: string | null;
  targetSize: string | null;
  nutritionTable: any;
  images: string[];
  brandId: string;
  isActive: boolean;
  isFeatured: boolean;
};

type ProductFormProps = {
  brands: Brand[];
  product?: Product;
};

const nutritionFields = [
  { key: "protein", label: "Proteína (%)" },
  { key: "fat", label: "Gordura (%)" },
  { key: "fiber", label: "Fibra (%)" },
  { key: "ash", label: "Matéria Inorgânica (%)" },
  { key: "moisture", label: "Humidade (%)" },
  { key: "calcium", label: "Cálcio (%)" },
  { key: "phosphorus", label: "Fósforo (%)" },
];

export default function ProductForm({ brands, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    ingredients: product?.ingredients || "",
    price: product?.price || 0,
    comparePrice: product?.comparePrice || 0,
    stockQty: product?.stockQty || 0,
    sku: product?.sku || "",
    weightKg: product?.weightKg || 0,
    targetAge: product?.targetAge || "",
    targetSize: product?.targetSize || "",
    brandId: product?.brandId || brands[0]?.id || "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  });

  const [images, setImages] = useState<string[]>(product?.images || []);

  const [nutrition, setNutrition] = useState<Record<string, number>>(
    product?.nutritionTable || {}
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNutritionChange = (key: string, value: string) => {
    setNutrition((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.brandId) {
      toast.error("Selecione uma marca");
      return;
    }
    if (form.price <= 0) {
      toast.error("Preço deve ser maior que 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        ingredients: form.ingredients.trim() || undefined,
        price: form.price,
        comparePrice: form.comparePrice || undefined,
        stockQty: form.stockQty,
        sku: form.sku.trim() || undefined,
        weightKg: form.weightKg || undefined,
        targetAge: form.targetAge || undefined,
        targetSize: form.targetSize || undefined,
        nutritionTable: Object.keys(nutrition).length > 0 ? nutrition : undefined,
        images,
        brandId: form.brandId,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      const result = isEdit
        ? await updateProduct(product!.id, data)
        : await createProduct(data);

      if (result.success) {
        toast.success(isEdit ? "Produto atualizado" : "Produto criado");
        router.push("/admin/stock");
      } else {
        toast.error(result.error || "Erro");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back */}
      <Link href="/admin/stock" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Informações Básicas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Dog Junior Classic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
            <select
              name="brandId"
              value={form.brandId}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Código único (opcional)"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Descrição do produto..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredientes</label>
            <textarea
              name="ingredients"
              value={form.ingredients}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Lista de ingredientes..."
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Preço & Stock</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (€) *</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Anterior (€)</label>
            <input
              type="number"
              name="comparePrice"
              value={form.comparePrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Para mostrar desconto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stockQty"
              value={form.stockQty}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              step="0.001"
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Target */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Público-Alvo</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
            <select
              name="targetAge"
              value={form.targetAge}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">Selecionar</option>
              <option value="PUPPY">Cachorro</option>
              <option value="ADULT">Adulto</option>
              <option value="SENIOR">Sénior</option>
              <option value="ALL">Todas as Idades</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
            <select
              name="targetSize"
              value={form.targetSize}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">Selecionar</option>
              <option value="SMALL">Pequeno</option>
              <option value="MEDIUM">Médio</option>
              <option value="LARGE">Grande</option>
              <option value="GIANT">Gigante</option>
              <option value="ALL">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Nutrition */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Tabela Nutricional</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {nutritionFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="number"
                value={nutrition[field.key] || ""}
                onChange={(e) => handleNutritionChange(field.key, e.target.value)}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Imagens do Produto</h2>
        <ImageUploader
          images={images}
          onChange={setImages}
          maxImages={5}
          folder="patinhas-shop-products"
        />
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-800 mb-4">Estado</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Ativo (visível na loja)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Destaque ⭐</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Link href="/admin/stock" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition disabled:opacity-50"
        >
          {isSubmitting ? "A guardar..." : isEdit ? "Guardar Alterações" : "Criar Produto"}
        </button>
      </div>
    </form>
  );
}
