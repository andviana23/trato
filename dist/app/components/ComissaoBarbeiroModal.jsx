import { Modal, Avatar, Button } from "@nextui-org/react";
export function ComissaoBarbeiroModal({ isOpen, onClose, nome, avatarUrl, resumo, comissao, ticketMedio, tipos, valoresPorTipo, tipoServicoIcone, totalMinutosMes }) {
    return (<Modal isOpen={isOpen} onClose={onClose} size="md" hideCloseButton>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-2 p-0 overflow-hidden flex flex-col">
          <div className="flex flex-col items-center pt-8 pb-4 px-6 relative">
            <Avatar src={avatarUrl} name={nome} size="xl" className="shadow mb-4"/>
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 text-center mb-1">{nome}</span>
            <span className="inline-block mb-4 text-lg font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded-full px-6 py-2 shadow-md tracking-wide">{resumo.total} serviços realizados</span>
            <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Fechar" tabIndex={0}>
              <span className="text-xl font-bold text-gray-500">×</span>
            </button>
          </div>
          <div className="flex flex-col gap-8 px-6 pb-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Comissão Total</span>
              <span className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow flex flex-col items-center md:items-start">
                <div className="font-semibold mb-4 text-gray-700 dark:text-gray-200 text-lg">Quantidade de Serviços</div>
                <ul className="text-base space-y-4 w-full">
                  {Object.entries(tipos).map(([tipo, qtd]) => (<li key={tipo} className="flex items-center justify-between gap-4 w-full">
                      <span className="flex items-center gap-2">{tipoServicoIcone[tipo]} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200 text-right">{qtd}</span>
                    </li>))}
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 shadow flex flex-col items-center md:items-start">
                <div className="font-semibold mb-4 text-gray-700 dark:text-gray-200 text-lg">Valor por Serviço</div>
                <ul className="text-base space-y-4 w-full">
                  {Object.entries(valoresPorTipo).map(([tipo, valor]) => (<li key={tipo} className="flex items-center justify-between gap-4 w-full">
                      <span className="flex items-center gap-2">{tipoServicoIcone[tipo]} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                      <span className="font-bold text-green-700 dark:text-green-400 text-right">R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </li>))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 my-8">
              <span className="text-base font-semibold text-gray-700 dark:text-gray-200">Ticket Médio Total de Assinatura</span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-center gap-2 mb-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">Minutos Trabalhados</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200 text-lg">{resumo.minutos} min</span>
            </div>
          </div>
          <div className="flex justify-center pb-8 pt-2">
            <Button color="primary" onClick={onClose} className="font-semibold px-10 py-3 rounded-lg shadow-md text-base w-full max-w-xs">Fechar</Button>
          </div>
        </div>
      </div>
    </Modal>);
}
