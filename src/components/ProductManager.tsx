import React, { useState, useRef } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff,
  UploadCloud,
  Globe,
  Camera,
  Check,
  RotateCcw,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { MenuItem, RecipeItem } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';

import imgCheddar from '../assets/images/burger_cheddar_max_1793901189809.jpg';
import imgSmash from '../assets/images/burger_smash_duplo_1793901184390.jpg';
import imgRustic from '../assets/images/burger_rustic_fries_1793901184681.jpg';
import imgMari from '../assets/images/mari_avatar_1793901183869.jpg';

interface PresetImage {
  label: string;
  category: 'burgers' | 'sides' | 'drinks' | 'desserts';
  url: string;
  source: 'local' | 'web';
}

const PRESET_GALLERY: PresetImage[] = [
  // Burgers
  { label: 'Cheddar Max Artesanal', category: 'burgers', url: imgCheddar, source: 'local' },
  { label: 'Smash Duplo Defumado', category: 'burgers', url: imgSmash, source: 'local' },
  {
    label: 'Burger Clássico com Salada',
    category: 'burgers',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Bacon BBQ Especial',
    category: 'burgers',
    url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Chicken Crispy Empanado',
    category: 'burgers',
    url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },

  // Sides / Porções
  { label: 'Batata Rústica com Alecrim', category: 'sides', url: imgRustic, source: 'local' },
  {
    label: 'Batata Palito Dourada',
    category: 'sides',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Anéis de Cebola (Onion Rings)',
    category: 'sides',
    url: 'https://images.unsplash.com/photo-1639024471287-032f664b4c73?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Nuggets & Iscas Crocantes',
    category: 'sides',
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },

  // Drinks / Bebidas
  {
    label: 'Coca-Cola em Lata Gelada',
    category: 'drinks',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Cerveja Artesanal IPA',
    category: 'drinks',
    url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Chopp com Colarinho Cremoso',
    category: 'drinks',
    url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Suco Natural de Frutas',
    category: 'drinks',
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },

  // Desserts / Sobremesas
  {
    label: 'Milkshake de Nutella & Brownie',
    category: 'desserts',
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
  {
    label: 'Petit Gâteau com Sorvete',
    category: 'desserts',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    source: 'web',
  },
];

export const ProductManager: React.FC = () => {
  const { menuItems, stockItems, addMenuItem, updateMenuItem, deleteMenuItem } = useBurgerSystem();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuItem['category']>('burgers');
  const [price, setPrice] = useState('34.90');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [popular, setPopular] = useState(false);
  const [active, setActive] = useState(true);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  // Image Source Mode: 'upload' (local file), 'url' (internet), 'presets' (galeria)
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setCategory('burgers');
    setPrice('34.90');
    setDescription('');
    setImageUrl(imgCheddar);
    setPopular(false);
    setActive(true);
    setImageError(null);
    setImageTab('upload');
    // default recipe for burger: 1 pão + 1 carne + cheddar
    setRecipeItems([
      { stockItemId: 'stk-pao', quantity: 1 },
      { stockItemId: 'stk-carne', quantity: 1 },
      { stockItemId: 'stk-cheddar', quantity: 0.05 },
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toFixed(2));
    setDescription(item.description);
    setImageUrl(item.imageUrl || '');
    setPopular(!!item.popular);
    setActive(item.active !== false);
    setRecipeItems(item.recipe ? [...item.recipe] : []);
    setImageError(null);
    setImageTab(item.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setModalOpen(true);
  };

  // Client-Side Image Processor (Compress & Convert to Data URL)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecione um arquivo de imagem válido (JPEG, PNG, WebP).');
      return;
    }

    setIsProcessingFile(true);
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensiona para no máximo 800x800 com compressão inteligente
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(compressedDataUrl);
          setIsProcessingFile(false);
        } else {
          setImageUrl(e.target?.result as string);
          setIsProcessingFile(false);
        }
      };
      img.onerror = () => {
        setImageError('Não foi possível processar este arquivo de imagem.');
        setIsProcessingFile(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setImageError('Erro ao ler arquivo do dispositivo.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseFloat(price) || 0;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: name.trim(),
        category,
        price: parsedPrice,
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        popular,
        active,
        recipe: recipeItems.length > 0 ? recipeItems : undefined,
      });
    } else {
      const newItem: MenuItem = {
        id: `burger-${Date.now()}`,
        name: name.trim(),
        category,
        price: parsedPrice,
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        popular,
        active,
        recipe: recipeItems.length > 0 ? recipeItems : undefined,
      };
      addMenuItem(newItem);
    }

    setModalOpen(false);
  };

  const handleAddRecipeIngredient = () => {
    if (stockItems.length === 0) return;
    const firstStockId = stockItems[0].id;
    setRecipeItems((prev) => [...prev, { stockItemId: firstStockId, quantity: 1 }]);
  };

  const handleUpdateRecipeIngredient = (index: number, stockItemId: string, quantity: number) => {
    setRecipeItems((prev) =>
      prev.map((r, i) => (i === index ? { stockItemId, quantity: Math.max(0.01, quantity) } : r))
    );
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleActive = (item: MenuItem) => {
    updateMenuItem({
      ...item,
      active: item.active === false ? true : false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            Cadastro de Sanduíches & Gestão do Cardápio
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Cadastre novos hambúrgueres e porções, adicione fotos do computador/celular ou internet e configure fichas técnicas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Sanduíche / Item</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Todos os Itens' },
          { id: 'burgers', label: '🍔 Burgers Artesanais' },
          { id: 'sides', label: '🍟 Porções & Acompanhamentos' },
          { id: 'drinks', label: '🥤 Bebidas & Chopp' },
          { id: 'desserts', label: '🍨 Sobremesas & Shakes' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isAvailable = item.active !== false;

          return (
            <div
              key={item.id}
              className={`bg-stone-900 border rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                isAvailable ? 'border-stone-800 hover:border-amber-500/40' : 'border-stone-800/50 opacity-60'
              }`}
            >
              <div>
                {/* Product Photo with Badge */}
                <div className="relative h-44 w-full bg-stone-950 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = imgCheddar;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-1">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[10px]">Sem foto cadastrada</span>
                    </div>
                  )}

                  {/* Gradient Shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>

                  {/* Badges on Image */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                      {item.category === 'burgers'
                        ? 'Burger'
                        : item.category === 'sides'
                        ? 'Porção'
                        : item.category === 'drinks'
                        ? 'Bebida'
                        : 'Sobremesa'}
                    </span>
                    {item.popular && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                        <Sparkles className="w-3 h-3 fill-stone-950" />
                        Favorito
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-colors cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                          : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                      }`}
                      title={isAvailable ? 'Desativar item no cardápio' : 'Ativar item no cardápio'}
                    >
                      {isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Price Tag Over Image */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-xl bg-stone-950/90 border border-stone-700/80 text-amber-400 font-mono font-black text-sm shadow-md">
                      R$ {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-stone-100 text-sm leading-snug">{item.name}</h4>
                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {item.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Recipe / Stock Deduction Pill */}
                  {item.recipe && item.recipe.length > 0 ? (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.recipe.length} insumos vinculados ao estoque</span>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <AlertCircle className="w-3.5 h-3.5 text-stone-600" />
                      <span>Sem ficha técnica de estoque</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-stone-950 border-t border-stone-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="flex-1 py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar / Trocar Foto</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Deseja realmente excluir "${item.name}" do cardápio?`)) {
                      deleteMenuItem(item.id);
                    }
                  }}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900 transition-colors cursor-pointer"
                  title="Excluir item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Product with Local File & Internet Upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="font-black text-stone-100 text-base">
                  {editingItem ? 'Editar Produto / Sanduíche' : 'Cadastrar Novo Sanduíche / Item'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Row 1: Name and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-stone-300 font-bold block mb-1">Nome do Item / Sanduíche:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cheddar Bacon Monster"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MenuItem['category'])}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-semibold outline-none focus:border-amber-500"
                  >
                    <option value="burgers">🍔 Burgers</option>
                    <option value="sides">🍟 Porções</option>
                    <option value="drinks">🥤 Bebidas</option>
                    <option value="desserts">🍨 Sobremesas</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price and Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="text-stone-300 font-bold block mb-1">Preço de Venda (R$):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-amber-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="38.90"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-stone-100 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={popular}
                      onChange={(e) => setPopular(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 rounded"
                    />
                    <span>⭐ Destaque Favorito da Casa</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-stone-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>Ativo no Cardápio</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="text-stone-300 font-bold block mb-1">
                  Descrição dos Ingredientes & Sabor (exibido no cardápio e WhatsApp da Mari):
                </label>
                <textarea
                  rows={2}
                  placeholder="Dois blends bovinos 160g, cheddar cremoso artesanal duplo, bacon crocante defumado e maionese secreta da Mari."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              {/* ======================================================== */}
              {/* FOTO DO SANDUÍCHE / ITEM (UPLOAD LOCAL OU INTERNET) */}
              {/* ======================================================== */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
                  <label className="font-extrabold text-stone-200 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Foto do Sanduíche / Porção</span>
                  </label>

                  {/* Image Mode Switcher */}
                  <div className="bg-stone-900 p-1 rounded-xl border border-stone-800 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        imageTab === 'upload'
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Arquivo Local</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        imageTab === 'url'
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Link da Internet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageTab('presets')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        imageTab === 'presets'
                          ? 'bg-amber-500 text-stone-950 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Galeria Pronta</span>
                    </button>
                  </div>
                </div>

                {/* Option A: Local File Upload & Drag & Drop */}
                {imageTab === 'upload' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                          : 'border-stone-700/80 hover:border-amber-500/60 bg-stone-900/50 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-200 text-xs">
                            {isProcessingFile ? 'Processando imagem...' : 'Clique para selecionar foto do computador ou celular'}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Ou arraste o arquivo aqui (JPEG, PNG, WEBP). Compressão automática otimizada para o cardápio.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] flex items-center gap-1 border border-stone-700">
                            <Camera className="w-3 h-3 text-amber-400" />
                            No celular: pode tirar foto na hora
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Option B: Internet URL */}
                {imageTab === 'url' && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-stone-400 text-[11px] block mb-1">
                        Cole o link da imagem da web (URL direta terminando em .jpg, .png, etc.):
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... ou link direto da imagem"
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value);
                            setImageError(null);
                          }}
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-3 pr-20 py-2 text-stone-100 font-mono text-xs outline-none focus:border-amber-500"
                        />
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute right-2 top-1.5 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] rounded-lg cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option C: Presets Gallery */}
                {imageTab === 'presets' && (
                  <div className="space-y-2">
                    <span className="text-stone-400 text-[11px] block">
                      Selecione uma foto de alta resolução com 1 clique para este produto:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {PRESET_GALLERY.map((preset) => {
                        const isSelected = imageUrl === preset.url;
                        return (
                          <div
                            key={preset.label}
                            onClick={() => {
                              setImageUrl(preset.url);
                              setImageError(null);
                            }}
                            className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-stone-950"
                            />
                            <div className="truncate text-left">
                              <p className="font-bold text-[11px] truncate">{preset.label}</p>
                              <span className="text-[9px] text-stone-500 uppercase">{preset.category}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {imageError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Live Image Preview Card */}
                {imageUrl && (
                  <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-950 border border-stone-700 shrink-0 relative">
                        <img
                          src={imageUrl}
                          alt="Pré-visualização"
                          className="w-full h-full object-cover"
                          onError={() => setImageError('Atenção: A imagem não pôde ser carregada pelo navegador.')}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-stone-200 text-xs">Foto Vinculada ao Sanduíche</span>
                        </div>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {imageUrl.startsWith('data:')
                            ? '📁 Foto local processada e salva no dispositivo'
                            : '🌐 Link de imagem da internet'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/40 hover:text-rose-300 text-stone-300 text-xs font-semibold border border-stone-700 hover:border-rose-800 transition-colors cursor-pointer"
                    >
                      Remover Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Ficha Técnica / Baixa de Estoque Automática */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-stone-200 block text-xs">
                      Ficha Técnica & Baixa de Estoque Automática
                    </label>
                    <p className="text-[10px] text-stone-400">
                      Cada venda deste sanduíche desconta automaticamente estes insumos do estoque
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 text-[11px] font-bold rounded-lg border border-stone-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Insumo
                  </button>
                </div>

                {recipeItems.length === 0 ? (
                  <p className="text-[11px] text-stone-500 py-2">
                    Nenhum ingrediente vinculado ainda. Clique em &quot;+ Insumo&quot; para definir a receita.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {recipeItems.map((rec, idx) => {
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-stone-900 p-2 rounded-xl border border-stone-800"
                        >
                          <select
                            value={rec.stockItemId}
                            onChange={(e) =>
                              handleUpdateRecipeIngredient(idx, e.target.value, rec.quantity)
                            }
                            className="bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-stone-100 flex-1 outline-none text-xs"
                          >
                            {stockItems.map((stk) => (
                              <option key={stk.id} value={stk.id}>
                                {stk.name} ({stk.unit})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              step="0.01"
                              value={rec.quantity}
                              onChange={(e) =>
                                handleUpdateRecipeIngredient(
                                  idx,
                                  rec.stockItemId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-stone-100 font-mono text-center outline-none text-xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeIngredient(idx)}
                            className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black cursor-pointer shadow-md"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Sanduíche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
