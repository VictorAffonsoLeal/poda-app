"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Mail, 
  Edit3, 
  Save, 
  X, 
  Lock, 
  Loader2, 
  UserCheck 
} from "lucide-react";

const formatCPFOrCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    return digits
      .substring(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .substring(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
};

export default function PerfilPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: ""
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        nome: userData.nome || "",
        cpf: userData.cpf || "",
        cep: userData.endereco?.cep || "",
        logradouro: userData.endereco?.logradouro || "",
        numero: userData.endereco?.numero || "",
        bairro: userData.endereco?.bairro || ""
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldId = e.target.id.replace('perfil-', '');
    let val = e.target.value;
    if (fieldId === 'cpf') {
      val = formatCPFOrCNPJ(val);
    } else if (fieldId === 'cep') {
      val = formatCEP(val);
    }
    setFormData({ ...formData, [fieldId]: val });
  };

  const habilitarEdicaoDados = () => {
    setIsEditing(true);
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    if (userData) {
      setFormData({
        nome: userData.nome || "",
        cpf: userData.cpf || "",
        cep: userData.endereco?.cep || "",
        logradouro: userData.endereco?.logradouro || "",
        numero: userData.endereco?.numero || "",
        bairro: userData.endereco?.bairro || ""
      });
    }
  };

  const salvarDadosPessoais = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, {
        nome: formData.nome,
        cpf: formData.cpf,
        endereco: {
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro
        }
      });
      setIsEditing(false);
      showToast('Dados salvos com sucesso!', 'success');
    } catch (e) {
      console.error("Erro ao atualizar os dados: ", e);
      showToast("Erro ao salvar os dados.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = isEditing 
    ? "w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all placeholder-slate-400" 
    : "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs sm:text-sm outline-none cursor-not-allowed";

  return (
    <section id="tela-meus-dados" className="w-full max-w-2xl mx-auto flex flex-col animate-fadeIn">
        <header className="w-full flex items-center mb-6 justify-between gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => router.push("/")} 
                className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Meus Dados</h1>
                <p className="text-[10px] sm:text-xs text-slate-500">Gerencie suas informações e endereço de contato</p>
              </div>
          </div>
          {!isEditing ? (
            <button 
              id="botao-editar-dados" 
              onClick={habilitarEdicaoDados} 
              className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 py-2 px-3.5 rounded-xl hover:bg-emerald-100 transition-all font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Editar Perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={cancelarEdicao} 
                className="bg-slate-100 text-slate-600 border border-slate-200 py-2 px-3 sm:px-4 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs sm:text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" /> <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button 
                id="botao-salvar-dados" 
                onClick={salvarDadosPessoais} 
                disabled={isLoading}
                className="bg-emerald-600 text-white py-2 px-3 sm:px-4 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-all font-bold text-xs sm:text-sm flex items-center gap-1 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Salvar
                  </>
                )}
              </button>
            </div>
          )}
        </header>

        {/* User Badge / Avatar Card */}
        <div className="w-full bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-5 sm:p-6 text-white mb-6 shadow-md flex items-center gap-4 border border-emerald-900/50">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-inner flex-shrink-0">
            {formData.nome ? formData.nome.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold truncate">{formData.nome || "Cidadão"}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-200 font-medium truncate">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {user?.email}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <UserCheck className="w-2.5 h-2.5" /> Cidadão Cadastrado
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields Card */}
        <main className="w-full bg-white p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
          <fieldset id="fieldset-dados-pessoais" disabled={!isEditing} className="space-y-6">
              
              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="perfil-nome" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      Nome Completo
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-nome" 
                      value={formData.nome} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="perfil-cpf" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      CPF / CNPJ
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-cpf" 
                      value={formData.cpf} 
                      onChange={handleChange} 
                      maxLength={18} 
                      className={inputClass}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      E-mail de Cadastro
                      <Lock className="w-3 h-3 text-slate-400" />
                    </label>
                    <input 
                      type="text" 
                      value={user?.email || ""} 
                      disabled 
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium text-xs sm:text-sm outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Endereço */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Endereço Residencial
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="perfil-cep" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      CEP
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-cep" 
                      value={formData.cep} 
                      onChange={handleChange} 
                      maxLength={9} 
                      className={inputClass}
                      placeholder="00000-000"
                    />
                  </div>
                  
                  <div className="md:col-span-4">
                    <label htmlFor="perfil-logradouro" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      Logradouro
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-logradouro" 
                      value={formData.logradouro} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="Avenida, rua, travessa, etc."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="perfil-numero" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      Número
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-numero" 
                      value={formData.numero} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="Ex: 123"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label htmlFor="perfil-bairro" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-1">
                      Bairro
                      {!isEditing && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input 
                      type="text" 
                      id="perfil-bairro" 
                      value={formData.bairro} 
                      onChange={handleChange} 
                      className={inputClass}
                      placeholder="Nome do bairro"
                    />
                  </div>
                </div>
              </div>
          </fieldset>
        </main>
    </section>
  );
}
