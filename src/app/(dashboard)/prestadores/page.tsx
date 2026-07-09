"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Phone, Building, Star, Search, ArrowLeft, ShieldCheck, ClipboardList } from "lucide-react";

export default function PrestadoresPage() {
  const router = useRouter();
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPrestadores = async () => {
      try {
        const q = query(collection(db, "prestadores"), where("status", "==", "Ativo"));
        const querySnapshot = await getDocs(q);
        
        const prestadoresArray: any[] = [];
        querySnapshot.forEach((doc) => {
          prestadoresArray.push({ id: doc.id, ...doc.data() });
        });
        
        setPrestadores(prestadoresArray);
      } catch (error) {
        console.error("Erro ao buscar prestadores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrestadores();
  }, []);

  const filteredPrestadores = prestadores.filter(p => 
    p.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col animate-fadeIn">
      <header className="w-full flex items-center mb-6 border-b border-slate-200 pb-4">
        <button 
          onClick={() => router.push("/")} 
          className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Podadores Autorizados</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Empresas e profissionais credenciados pela Prefeitura para serviços particulares</p>
        </div>
      </header>

      {/* Styled Search Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl shadow-sm mb-6 flex items-center gap-3 border border-slate-200/80 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
        <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nome da empresa..." 
          className="w-full bg-transparent border-none focus:outline-none text-slate-700 text-xs sm:text-sm font-medium placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Grid */}
      <main className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500 text-sm font-semibold animate-pulse">
            Buscando empresas credenciadas...
          </div>
        ) : filteredPrestadores.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200/60 space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700">Nenhum prestador encontrado</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Não encontramos nenhuma empresa credenciada com este nome. Tente digitar outro termo.
            </p>
          </div>
        ) : (
          filteredPrestadores.map((prestador) => (
            <div 
              key={prestador.id} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-350 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">{prestador.razaoSocial}</h3>
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 px-2.5 py-1 rounded-xl text-[10px] font-extrabold mt-2 border border-emerald-100 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" /> 
                      Credenciado SMA
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50/50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                    <span className="font-bold w-12 text-slate-400 uppercase text-[10px] tracking-wider">CNPJ:</span>
                    <span className="font-semibold text-slate-700">{prestador.cnpj}</span>
                  </div>
                  {prestador.contato && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                      <span className="font-bold w-12 text-slate-400 uppercase text-[10px] tracking-wider">Contato:</span>
                      <span className="font-semibold text-slate-700">{prestador.contato}</span>
                    </div>
                  )}
                </div>
              </div>

              {prestador.contato && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <a 
                    href={`tel:${prestador.contato.replace(/\D/g, '')}`} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Phone className="w-4 h-4" /> Ligar para Empresa
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </section>
  );
}
