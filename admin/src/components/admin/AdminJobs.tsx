import { useState } from 'react';
import { Search, MoreVertical, X, FileText } from 'lucide-react';

// Componente de Badge de Status seguindo o Guia de UI (Washout Colors + rounded 4px)
const StatusBadge = ({ status }) => {
  const styles = {
    "Concluído": "bg-emerald-50/60 text-emerald-600 border-emerald-100/50",
    "Agendado": "bg-blue-50/60 text-blue-600 border-blue-100/50",
    "Pendente": "bg-amber-50/60 text-amber-600 border-amber-100/50",
    "Cancelado": "bg-red-50/60 text-red-600 border-red-100/50",
  };

  const currentStyle = styles[status] || styles["Pendente"];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default function AdminJobs() {
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados fictícios para a tabela
  const jobs = [
    { id: 1, client: "Ana Silva", type: "Gestante", date: "22 Out 2023", status: "Concluído" },
    { id: 2, client: "Lucas Souza", type: "Newborn", date: "25 Out 2023", status: "Agendado" },
    { id: 3, client: "Mariana Costa", type: "Casamento", date: "02 Nov 2023", status: "Pendente" },
    { id: 4, client: "Roberto Dias", type: "Ensaio Pet", date: "10 Nov 2023", status: "Concluído" },
    { id: 5, client: "Carla Nunes", type: "Formatura", date: "15 Nov 2023", status: "Cancelado" },
    { id: 6, client: "Juliana Lima", type: "Institucional", date: "20 Nov 2023", status: "Agendado" },
    { id: 7, client: "Pedro Rocha", type: "Aniversário", date: "05 Dez 2023", status: "Pendente" },
  ];

  return (
    <div className={`min-h-screen bg-zinc-50 font-sans text-zinc-900 ${isModalOpen ? 'h-screen overflow-hidden' : ''}`}>
      <style>
        {`
          @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .animate-modal-backdrop { animation: modalFadeIn 0.2s ease-out forwards; }
          .animate-modal-content { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}
      </style>

      <main className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Container Principal com arredondamento de 4px (rounded) */}
        <div className="bg-white border border-zinc-200 rounded shadow-sm p-6">

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-6 flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por trabalho ou detalhes do trabalho"
                  className="pl-10 pr-4 py-2 w-[380px] bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-700 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 text-white rounded px-5 py-2.5 font-medium text-[13px] shadow-sm hover:bg-black transition-colors"
              >
                + Novo Trabalho
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-zinc-900 text-[13px] font-semibold border-b border-zinc-200">
                  <th className="py-4 px-6 w-[25%]">Cliente</th>
                  <th className="py-4 px-6 w-[20%]">Tipo de ensaio</th>
                  <th className="py-4 px-6 w-[15%]">Data</th>
                  <th className="py-4 px-6 w-[15%]">Status</th>
                  <th className="py-4 px-6 w-[15%]">Contrato</th>
                  <th className="py-4 px-6 text-center w-[10%]">Acções</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr key={job.id} className="bg-white hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-0 relative">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={`https://i.pravatar.cc/150?u=${job.id}`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                      />
                      <span className="text-[13px] text-zinc-900 font-medium">{job.client}</span>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-zinc-700">{job.type}</td>
                    <td className="py-4 px-6 text-[13px] text-zinc-700">{job.date}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-4 px-6">
                      <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group">
                        <FileText className="w-4 h-4" />
                        <span className="text-[12px] group-hover:underline">Visualizar</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center relative">
                      <button
                        className="text-zinc-400 hover:text-zinc-700 transition-colors outline-none p-1 rounded-md hover:bg-zinc-100"
                        onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                      >
                        <MoreVertical className="w-5 h-5 mx-auto" />
                      </button>
                      {openMenuIndex === index && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuIndex(null)}></div>
                          <div className="absolute top-[50px] right-1/2 translate-x-1/2 w-32 bg-white border border-zinc-200 shadow-md rounded-lg z-50 flex flex-col py-1.5 overflow-hidden">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-t border-l border-zinc-200 rotate-45"></div>
                            <button className="px-5 py-2 text-left text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 relative z-10 bg-white">Editar</button>
                            <button className="px-5 py-2 text-left text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 relative z-10 bg-white">Detalhes</button>
                            <div className="h-px bg-zinc-100 my-1 relative z-10"></div>
                            <button className="px-5 py-2 text-left text-[12px] font-medium text-red-600 hover:bg-red-50 relative z-10 bg-white">Eliminar</button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-zinc-100">
            <button className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 font-medium hover:bg-zinc-100">
              &larr; Anterior
            </button>
            <button className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-[13px] font-medium text-white shadow-md">
              1
            </button>
            <button className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-[13px] font-medium text-zinc-600 hover:bg-zinc-100">
              2
            </button>
            <button className="px-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 font-medium hover:bg-zinc-100">
              Próximo &rarr;
            </button>
          </div>
        </div>
      </main>

      {/* Modal Criar Novo Trabalho */}
      {isModalOpen && (
        <div
          className="fixed inset-0 w-full h-full z-[9999] bg-zinc-900/60 flex items-center justify-center p-4 font-sans animate-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[550px] rounded shadow-2xl flex flex-col animate-modal-content max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 shrink-0">
              <h2 className="text-[16px] font-bold text-zinc-900">Criar novo trabalho</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-all">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-6 overflow-y-auto">
              {/* Cliente */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Cliente <span className="text-zinc-400">*</span></label>
                <p className="text-xs text-zinc-500 mb-1">Quem contratou o serviço</p>
                <input type="text" placeholder="Nome do cliente" className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all" />
              </div>

              {/* Tipo de Ensaio */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Tipo de ensaio <span className="text-zinc-400">*</span></label>
                <p className="text-xs text-zinc-500 mb-1">Define o template de contrato sugerido</p>
                <select defaultValue="" className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all bg-white">
                  <option value="" disabled>Selecione um tipo</option>
                  <option>Gestante</option>
                  <option>Newborn</option>
                  <option>Casamento</option>
                  <option>Ensaio Pet</option>
                  <option>Institucional</option>
                </select>
              </div>

              {/* Data e Horário */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Data e horário <span className="text-zinc-400">*</span></label>
                <p className="text-xs text-zinc-500 mb-1">Quando será o ensaio</p>
                <div className="flex gap-3">
                  <input type="date" className="w-[60%] h-[42px] px-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all" />
                  <input type="time" className="w-[40%] h-[42px] px-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all" />
                </div>
              </div>

              {/* Local */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">Local <span className="text-zinc-400">*</span></label>
                <p className="text-xs text-zinc-500 mb-1">Onde será realizado</p>
                <input type="text" placeholder="Ex: Studio, Parque da Cidade..." className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all" />
              </div>

              {/* Valor e Pagamento */}
              <div className="flex flex-col gap-1 pt-3 border-t border-zinc-100">
                <label className="text-sm font-semibold text-zinc-900">Valor e pagamento</label>
                <p className="text-xs text-zinc-500 mb-1">Pode preencher depois no contrato</p>
                <div className="flex gap-3 mt-1">
                  <div className="w-1/2 flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-zinc-700">Valor total</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                      <input
                        type="text"
                        placeholder="0,00"
                        onInput={(e) => {
                          (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9,.]/g, '');
                        }}
                        className="w-full h-[42px] pl-8 pr-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all"
                      />
                    </div>
                  </div>
                  <div className="w-1/2 flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-zinc-700">Sinal (entrada)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                      <input
                        type="text"
                        placeholder="0,00"
                        onInput={(e) => {
                          (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9,.]/g, '');
                        }}
                        className="w-full h-[42px] pl-8 pr-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Anotações Internas */}
              <div className="flex flex-col gap-1 pt-3 border-t border-zinc-100">
                <label className="text-sm font-semibold text-zinc-900">Anotações internas</label>
                <p className="text-xs text-zinc-500 mb-1">Só o fotógrafo vê isto</p>
                <textarea rows={3} placeholder="Ex: Cliente pediu foco em fotos mais espontâneas..." className="w-full p-4 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-all resize-none"></textarea>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-zinc-200 bg-white rounded-b shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 px-5 py-2.5 rounded transition-all">
                Cancelar
              </button>
              <button className="bg-zinc-900 text-white text-sm font-bold px-6 py-2.5 rounded hover:bg-black transition-all shadow-lg shadow-zinc-200">
                Criar Trabalho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
