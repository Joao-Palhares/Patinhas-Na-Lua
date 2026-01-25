"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import { createProduct, updateProduct } from "./actions";
import { toast } from "sonner";

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
  { key: "ash", label: "Cinza (%)" },
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
  const [imageUrl, setImageUrl] = useState("");

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

  const addImage = () => {
    if (!imageUrl.trim()) return;
    if (!imageUrl.startsWith("http")) {
      toast.error("URL inválido");
      return;
    }
    setImages((prev) => [...prev, imageUrl.trim()]);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
              step="0.1"
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
        <h2 className="font-bold text-gray-800 mb-4">Imagens</h2>
        
        {/* Current Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 rounded-lg">
                <Image src={url} alt="" fill className="object-contain p-2 rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Image */}
        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL da imagem (Cloudinary, etc.)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Cole URLs de imagens do Cloudinary ou outro serviço de imagens
        </p>
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
