"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, updateDoc, doc, getDocs, query, where, arrayUnion, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    bairro: ""
  });
  const [treeId, setTreeId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoServico, setTipoServico] = useState("Solicitação de Poda de Árvore");
  const [tipoArea, setTipoArea] = useState("Particular");
  const [risco, setRisco] = useState("Nenhum risco aparente");
  
  // Novas flags
  const [imovelAlugado, setImovelAlugado] = useState(false);
  const [anuenciaProprietario, setAnuenciaProprietario] = useState(false);
  const [cienteCompensacao, setCienteCompensacao] = useState(false);

  const [geolocalizacao, setGeolocalizacao] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const obterLocalizacao = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocalizacao({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
          alert("Localização obtida com sucesso!");
        },
        (error) => {
          console.error(error);
          alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Geolocalização não suportada no seu navegador.");
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (userData && userData.endereco) {
      setFormData(userData.endereco);
    }
  }, [userData]);

  const enviarSolicitacao = async () => {
    if (!user) {
      alert("Você precisa estar logado para enviar uma solicitação.");
      return;
    }

    const justificativa = (document.getElementById('formulario-justificativa') as HTMLTextAreaElement)?.value;

    if (!justificativa) {
        alert('Preencha a justificativa.');
        return;
    }

    if (tipoServico === "Solicitação de Supressão (Corte)" && !cienteCompensacao) {
      alert("Para solicitar supressão, é obrigatório concordar com a compensação ambiental.");
      return;
    }

    if (imovelAlugado && !anuenciaProprietario) {
      alert("Para imóveis alugados, é obrigatório confirmar a anuência do proprietário.");
      return;
    }
    
    setIsLoading(true);

    try {
      const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}`;

      // CHECAGEM DE DUPLICIDADE (Aglutinação)
      let duplicateQuery;
      if (treeId) {
        duplicateQuery = query(collection(db, "solicitacoes"), where("treeId", "==", treeId), where("status", "in", ["Criado", "Em Análise", "Aprovado"]));
      } else {
        duplicateQuery = query(collection(db, "solicitacoes"), where("address", "==", fullAddress), where("status", "in", ["Criado", "Em Análise", "Aprovado"]));
      }

      const duplicateSnapshot = await getDocs(duplicateQuery);

      // 1. Upload das fotos
      const urls: string[] = [];
      if (arquivos.length > 0) {
        for (const arquivo of arquivos) {
          const fileRef = ref(storage, `solicitacoes/${user.uid}/${Date.now()}_${arquivo.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
          const snapshot = await uploadBytes(fileRef, arquivo);
          const url = await getDownloadURL(snapshot.ref);
          urls.push(url);
        }
      }

      if (!duplicateSnapshot.empty) {
        // ENCONTROU DUPLICIDADE! Vamos aglutinar no chamado existente.
        const existingDoc = duplicateSnapshot.docs[0];
        const existingId = existingDoc.id;

        const reforcoEntry = {
          data: new Date().toLocaleDateString('pt-BR'),
          status: existingDoc.data().status, // mantem o status atual
          descricao: `[REFORÇO] Novo pedido registrado para esta árvore. Justificativa do cidadão: ${justificativa}`
        };

        const updatePayload: any = {
          historico: arrayUnion(reforcoEntry),
          solicitantesAdicionais: arrayUnion(user.uid)
        };

        if (urls.length > 0) {
          // Precisamos fazer um workaround porque arrayUnion com muitos itens as vezes é chato,
          // mas como temos as urls prontas, vamos iterar ou usar apply.
          // O arrayUnion suporta multiplos argumentos: arrayUnion(...urls)
          updatePayload.fotos = arrayUnion(...urls);
        }

        await updateDoc(doc(db, "solicitacoes", existingId), updatePayload);
        
        alert(`Identificamos que já existe um chamado em andamento para esta árvore (Protocolo #${existingId}). Sua justificativa e fotos foram anexadas ao processo principal como um REFORÇO para dar mais peso ao pedido!`);
        router.push("/solicitacoes");
        return;
      }

      // 2. SE NÃO TEM DUPLICIDADE: Tentar geocoding se o usuário não obteve via GPS
      let finalGeo = geolocalizacao;
      if (!finalGeo && formData.logradouro) {
        try {
          const query = `${formData.logradouro}, ${formData.numero}, ${formData.bairro}, São José do Rio Preto, SP`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalGeo = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch(e) {}
      }

      const solicitacaoData = {
        userId: user.uid,
        type: tipoServico,
        address: fullAddress,
        cep: formData.cep || "Não informado",
        referencia,
        tipoArea,
        risco,
        treeId: treeId || null,
        imovelAlugado,
        anuenciaProprietario: imovelAlugado ? anuenciaProprietario : null,
        cienteCompensacao: tipoServico === "Solicitação de Supressão (Corte)" ? cienteCompensacao : null,
        geolocalizacao: finalGeo,
        fotos: urls,
        status: 'Criado',
        createdAt: serverTimestamp(),
        historico: [
          {
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'Criado',
            descricao: `Solicitação criada. Justificativa: ${justificativa}`
          }
        ]
      };
      
      const docRef = await addDoc(collection(db, "solicitacoes"), solicitacaoData);
      alert(`Solicitação enviada com sucesso! Protocolo: #${docRef.id}`);
      router.push("/solicitacoes");
    } catch (e) {
      console.error("Erro ao salvar no Firestore: ", e);
      alert('Erro ao enviar a solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
    }
  };

  return (
    <section id="tela-formulario" className="w-full max-w-2xl mx-auto flex flex-col">
         <header className="w-full flex items-center mb-6">
            <button onClick={() => router.push("/")} className="text-slate-500 hover:text-emerald-600 mr-4">← Voltar</button>
            <h1 className="text-2xl font-bold text-slate-700">Nova Solicitação</h1>
        </header>
        <main className="w-full bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Tipo de Serviço</h3>
                    <select value={tipoServico} onChange={e => setTipoServico(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm">
                        <option value="Solicitação de Poda de Árvore">Solicitação de Poda de Árvore</option>
                        <option value="Solicitação de Supressão (Corte)">Solicitação de Supressão (Corte)</option>
                        <option value="Solicitação de Fiscalização de Serviço Realizado">Solicitação de Fiscalização de Serviço Realizado</option>
                    </select>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Tipo de Área</h3>
                    <select value={tipoArea} onChange={e => setTipoArea(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm">
                        <option value="Particular">Particular (Ex: Dentro do meu quintal)</option>
                        <option value="Municipal">Municipal (Ex: Calçada, Praça pública)</option>
                        <option value="Federal">Federal</option>
                        <option value="APP / Rural">APP (Área de Preservação Permanente) ou Rural</option>
                    </select>
                </div>
            </div>

            {tipoArea === "APP / Rural" && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-bold">Atenção: Exigência da CETESB</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Intervenções em árvores localizadas em <strong>Áreas de Preservação Permanente (APP)</strong> ou zonas <strong>Rurais</strong> dependem de autorização prévia e direta do órgão estadual ambiental (<a href="https://cetesb.sp.gov.br" target="_blank" rel="noopener noreferrer" className="underline font-bold">CETESB</a>). O município poderá indeferir este pedido caso a licença estadual não seja apresentada.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`p-4 rounded-xl border ${risco !== 'Nenhum risco aparente' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span> Análise de Risco
                </h3>
                <p className="text-xs text-slate-600 mb-3">Se a árvore apresentar perigo iminente, selecione a opção correta abaixo para priorizarmos o atendimento.</p>
                <select value={risco} onChange={e => setRisco(e.target.value)} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-700">
                    <option value="Nenhum risco aparente">Nenhum risco aparente</option>
                    <option value="Fiação elétrica próxima">Fiação elétrica próxima / enroscada</option>
                    <option value="Risco de queda sobre imóvel/rua">Risco de queda sobre imóvel, carros ou rua</option>
                    <option value="Árvore morta/seca">Árvore morta/seca com perigo de tombamento</option>
                    <option value="Outros riscos estruturais">Outros riscos estruturais graves</option>
                </select>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Endereço do Serviço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-1"><label className="block text-sm font-medium text-slate-600">CEP</label><input type="text" id="formulario-cep" value={formData.cep} className="mt-1 block w-full px-3 py-2 bg-slate-100 border rounded-md text-sm" readOnly /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-600">Logradouro</label><input type="text" id="formulario-logradouro" value={formData.logradouro} className="mt-1 block w-full px-3 py-2 bg-slate-100 border rounded-md text-sm" readOnly /></div>
                    <div><label className="block text-sm font-medium text-slate-600">Número</label><input type="text" id="formulario-numero" value={formData.numero} className="mt-1 block w-full px-3 py-2 bg-slate-100 border rounded-md text-sm" readOnly /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-600">Bairro</label><input type="text" id="formulario-bairro" value={formData.bairro} className="mt-1 block w-full px-3 py-2 bg-slate-100 border rounded-md text-sm" readOnly /></div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-600">Ponto de Referência (Opcional)</label>
                        <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ex: Próximo à padaria central, casa de muro azul..." className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" />
                    </div>
                </div>
                
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-emerald-800">ID da Árvore / Plaqueta (Opcional)</h4>
                    <p className="text-xs text-emerald-600">Se a árvore tiver uma plaqueta de identificação da prefeitura, digite o código aqui.</p>
                  </div>
                  <input type="text" value={treeId} onChange={e => setTreeId(e.target.value)} placeholder="Ex: 84920" className="w-full sm:w-48 px-3 py-2 bg-white border border-emerald-300 rounded-md text-sm font-bold text-slate-700" />
                </div>

                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Geolocalização Exata</h4>
                    <p className="text-xs text-slate-500">Ajude a equipe enviando as coordenadas do seu celular.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={obterLocalizacao}
                    disabled={isGettingLocation || geolocalizacao !== null}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-emerald-600 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {geolocalizacao ? "📍 Capturado com Sucesso" : (isGettingLocation ? "Capturando..." : "📍 Usar Meu GPS")}
                  </button>
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Justificativa</h3>
                <textarea id="formulario-justificativa" rows={4} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" placeholder="Descreva o motivo da sua solicitação..." required></textarea>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Termos e Anuências</h3>
                
                {tipoServico === "Solicitação de Supressão (Corte)" && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-start gap-3">
                    <input type="checkbox" id="check-compensacao" checked={cienteCompensacao} onChange={e => setCienteCompensacao(e.target.checked)} className="mt-1 w-5 h-5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" />
                    <label htmlFor="check-compensacao" className="text-sm text-emerald-900 font-medium cursor-pointer">
                      Estou ciente de que a <strong>Supressão (Corte)</strong> exige compensação ambiental obrigatória (plantio de novas mudas ou doação para o viveiro municipal), conforme estabelecido pela legislação ambiental.
                    </label>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check-alugado" checked={imovelAlugado} onChange={e => setImovelAlugado(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                    <label htmlFor="check-alugado" className="text-sm text-slate-700 font-bold cursor-pointer">O imóvel relacionado ao serviço é alugado?</label>
                  </div>
                  
                  {imovelAlugado && (
                    <div className="pl-6 pt-2 border-t border-slate-200 mt-2 flex items-start gap-3">
                      <input type="checkbox" id="check-anuencia" checked={anuenciaProprietario} onChange={e => setAnuenciaProprietario(e.target.checked)} className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <label htmlFor="check-anuencia" className="text-sm text-slate-700 font-medium cursor-pointer">
                        Declaro ter a <strong>anuência (consentimento) do proprietário</strong> do imóvel para realizar esta solicitação de intervenção na árvore.
                      </label>
                    </div>
                  )}
                </div>
            </div>

             <div>
                <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Fotos</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <div className="text-4xl text-slate-400">📷</div>
                        <div className="flex text-sm text-slate-600">
                            <label htmlFor="upload-arquivo" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                                <span>Carregar um arquivo</span><input id="upload-arquivo" type="file" className="sr-only" multiple onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div><p className="text-xs text-slate-500">PNG, JPG, GIF até 10MB</p>
                    </div>
                </div>
                <div id="lista-arquivos-upload" className="mt-2 text-sm text-slate-600">
                  {arquivos.length > 0 && (
                    <>
                      <strong>Arquivos selecionados:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        {arquivos.map((file, i) => <li key={i}>{file.name}</li>)}
                      </ul>
                    </>
                  )}
                </div>
            </div>
            <button onClick={enviarSolicitacao} disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 font-semibold disabled:opacity-50">
              {isLoading ? "Enviando..." : "Enviar Requerimento"}
            </button>
        </main>
    </section>
  );
}
