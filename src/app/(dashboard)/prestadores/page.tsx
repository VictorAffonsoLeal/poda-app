"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Phone, Building, Star, Search } from "lucide-react";

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
    <section className="w-full max-w-4xl mx-auto flex flex-col">
      <header className="w-full flex items-center mb-6">
        <button onClick={() => router.push("/")} className="text-slate-500 hover:text-emerald-600 mr-4">← Voltar</button>
        <div>
          <h1 className="text-2xl font-bold text-slate-700">Podadores Autorizados</h1>
          <p className="text-sm text-slate-500">Empresas credenciadas pela Prefeitura para serviços particulares.</p>
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-3 border border-slate-200">
        <Search className="text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nome da empresa..." 
          className="w-full bg-transparent border-none focus:outline-none text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <main className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-500">Buscando empresas credenciadas...</div>
        ) : filteredPrestadores.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-slate-600 font-medium">Nenhum podador autorizado encontrado.</p>
            <p className="text-slate-400 text-sm mt-1">Tente buscar por outro nome ou volte mais tarde.</p>
          </div>
        ) : (
          filteredPrestadores.map((prestador) => (
            <div key={prestador.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{prestador.razaoSocial}</h3>
                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold mt-2 border border-emerald-100">
                    <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> 
                    Credenciado
                  </div>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 flex-shrink-0 ml-4">
                  <Building className="w-6 h-6" />
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold w-12 text-slate-500">CNPJ:</span>
                  <span>{prestador.cnpj}</span>
                </div>
                {prestador.contato && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-semibold w-12 text-slate-500">Tel:</span>
                    <a href={`tel:${prestador.contato.replace(/\D/g, '')}`} className="flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                      <Phone className="w-4 h-4" />
                      {prestador.contato}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </section>
  );
}
