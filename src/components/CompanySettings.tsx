import React, { useState } from 'react';
import { Building2, Store, Phone, MapPin, Wifi, QrCode, CheckCircle2, Save } from 'lucide-react';
import { CompanyInfo } from '../types.ts';
import { useBurgerSystem } from '../context/BurgerSystemContext.tsx';

export const CompanySettings: React.FC = () => {
  const { companyInfo, updateCompanyInfo } = useBurgerSystem();
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            Dados Cadastrais da Empresa & Loja
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Informações impressas em comandas térmicas, exibidas no cardápio e nos displays Wi-Fi de mesa
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Salvo com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identificação Jurídica e Comercial */}
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            Identificação do Estabelecimento
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-stone-400 block mb-1">Nome Fantasia (Marca do Cardápio):</label>
              <input
                type="text"
                value={formData.fantasyName}
                onChange={(e) => setFormData({ ...formData, fantasyName: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-bold outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Razão Social:</label>
              <input
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">CNPJ:</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Telefone / WhatsApp Comercial:</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-400 block mb-1">Endereço Completo do Ponto:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Rede Wi-Fi dos Displays de Mesa & QR Code */}
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-sky-400" />
            Wi-Fi dos Clientes (Impresso no QR Code das Mesas)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-stone-400 block mb-1">Nome da Rede Wi-Fi (SSID):</label>
              <input
                type="text"
                value={formData.wifiSsid}
                onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Senha do Wi-Fi:</label>
              <input
                type="text"
                value={formData.wifiPassword}
                onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Chave PIX da Empresa */}
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            Configuração de Recebimento PIX
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-stone-400 block mb-1">Chave PIX Oficial (E-mail, CNPJ ou Telefone):</label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Nome do Favorecido no PIX:</label>
              <input
                type="text"
                value={formData.pixReceiverName}
                onChange={(e) => setFormData({ ...formData, pixReceiverName: e.target.value })}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados da Empresa</span>
          </button>
        </div>
      </form>
    </div>
  );
};
