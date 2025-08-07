import { Card, CardHeader, CardBody, Avatar, Tooltip } from "@nextui-org/react";
export function ComissaoBarbeiroCard({ nome, avatarUrl, minutos, percentual, comissao, ticketMedio, tipos, tipoServicoIcone, onClick }) {
    return (<Card className="shadow-md rounded-2xl hover:shadow-xl transition-shadow border border-gray-100 flex flex-col justify-between py-2 px-2 md:px-4 mb-2">
      <CardHeader className="flex items-center gap-3 pb-0">
        <Avatar src={avatarUrl} name={nome} size="md" className="shadow"/>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <button className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-100 bg-transparent border border-transparent rounded-lg px-3 py-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer" onClick={onClick} type="button" title="Ver detalhes da comissão" tabIndex={0} style={{ display: 'inline-block', textAlign: 'left' }}>
            {nome}
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {minutos} min • {(percentual * 100).toFixed(1)}% do mês
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-2 space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <span className="text-sm text-gray-500">Comissão</span>
          <span className="text-2xl font-extrabold text-green-700 dark:text-green-400">
            R$ {comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <span className="text-sm text-gray-500">Ticket Médio</span>
          <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(tipos).map(([tipo, qtd]) => (<Tooltip key={tipo} content={`Serviços de ${tipo}`}>
              <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                {tipoServicoIcone[tipo]} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}: <span className="ml-1 font-bold">{qtd}</span>
              </span>
            </Tooltip>))}
        </div>
      </CardBody>
    </Card>);
}
