"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { useUnidade } from "@/components/UnidadeContext";
// Configure o Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const MESES = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];
const ANOS = ['2024', '2025', '2026', '2027', '2028'];
export default function MetasTrato() {
    const [metas, setMetas] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMeta, setEditingMeta] = useState(null);
    const { unidade: unidadeGlobal } = useUnidade();
    const [unidadeModal, setUnidadeModal] = useState(unidadeGlobal);
    const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('');
    // Estado do formulário
    const [form, setForm] = useState({
        barbeiro_id: '',
        mes: '',
        ano: '',
        meta_venda_produto: 0,
        meta_faturamento: 0,
        tipo_bonificacao: 'fixo',
        valor_bonificacao: 0,
        quantidade_produtos: 0, // Adicionado para armazenar a quantidade de produtos
    });
    // Adicione o estado das faixas no início do componente (após o estado do formulário):
    const [faixas, setFaixas] = useState([{ quantidade: 0, bonificacao: 0 }]);
    // Adicione o estado para armazenar as faixas de cada meta
    const [faixasPorMeta, setFaixasPorMeta] = useState({});
    // Estado para barbeiros adicionados e seleção
    const [barbeirosAdicionados, setBarbeirosAdicionados] = useState([]);
    // Estado para tipo de bonificação
    const [tipoBonificacao, setTipoBonificacao] = useState('produtos');
    // Carregar barbeiros da unidade selecionada no modal
    useEffect(() => {
        const unidades = {
            'Trato de Barbados': '244c0543-7108-4892-9eac-48186ad1d5e7',
            'BARBER BEER SPORT CLUB': '87884040-cafc-4625-857b-6e0402ede7d7',
        };
        const unidadeId = unidades[unidadeModal];
        console.log("Buscando barbeiros para unidade:", unidadeModal, unidadeId);
        if (!unidadeId) {
            setBarbeiros([]);
            return;
        }
        async function fetchBarbeiros() {
            const { data, error } = await supabase
                .from('profissionais')
                .select('*')
                .eq('unidade_id', unidadeId)
                .eq('funcao', 'barbeiro');
            if (error) {
                console.error("Erro ao buscar barbeiros:", error);
                setBarbeiros([]);
                return;
            }
            console.log("Barbeiros carregados:", data);
            setBarbeiros(data || []);
        }
        fetchBarbeiros();
    }, [unidadeModal]);
    // Carregar metas
    useEffect(() => {
        fetchMetas();
    }, []);
    // Verificar conexão e tabelas no carregamento
    useEffect(() => {
        async function verificarSistema() {
            try {
                console.log("🔍 Verificando sistema de Metas...");
                // Verificar conexão com Supabase
                // Listar apenas os pagamentos confirmados do mês, com dados completos do cliente
                // Buscar somente pagamentos confirmados no período:
                // Faça a requisição para a API do Asaas usando o endpoint /v3/payments, filtrando:
                // status=CONFIRMED (ou RECEIVED, se necessário)
                // paymentDate[gte]=YYYY-MM-DD (primeiro dia do mês/intervalo)
                // paymentDate[lte]=YYYY-MM-DD (último dia do mês/intervalo)
                // Exemplo de endpoint:
                // bash
                // Copiar
                // Editar
                // https://www.asaas.com/api/v3/payments?status=CONFIRMED&paymentDate[gte]=2025-08-01&paymentDate[lte]=2025-08-31
                // Isso deve retornar apenas os pagamentos confirmados (pagos) no período selecionado.
                // Buscar dados completos do cliente:
                // Para cada pagamento retornado, use o campo customer (ID do cliente).
                // Faça uma segunda requisição na API do Asaas para /v3/customers/{customerId} e obtenha nome, e-mail, etc.
                // Utilize Promise.all para buscar todos os clientes em paralelo e não travar a aplicação.
                // Montar lista final:
                // Monte a lista final da tabela unindo os dados do pagamento (valor, status, data do pagamento, próxima cobrança) + dados completos do cliente (nome, e-mail, etc).
                // Exiba apenas esses clientes na tabela, ou seja, somente quem teve pagamento confirmado no período filtrado.
                // Não inclua clientes que não pagaram no período.
                // Validação:
                // Antes de renderizar, faça um console.log do array final da lista para garantir que cada item tem os dados do pagamento e do cliente.
                // A tabela deve mostrar nome, e-mail, valor pago, status, fonte, data do pagamento e próxima cobrança.
                // Se não houver pagamentos confirmados no mês, mostrar mensagem clara: “Nenhum assinante efetuou pagamento confirmado neste mês.”
                // Resumo técnico:
                // Use o endpoint /v3/payments para filtrar por status=CONFIRMED e intervalo de datas.
                // Use /v3/customers/{customerId} para buscar os dados completos dos clientes listados nos pagamentos.
                // Não mostre outros clientes ou pagamentos fora do período, e não busque toda a base — só o resultado filtrado.
                // Não finalize até garantir que:
                // Só aparecem clientes que realmente pagaram (status CONFIRMED) no mês/período filtrado.
                // Todos os dados do cliente estão sendo exibidos corretamente na tabela.
                // O filtro por mês/período funciona sem erros.
                // Se não souber implementar o fetch duplo (pagamento + cliente), peça ajuda ou explique a limitação antes de finalizar.
                console.log("✅ Conexão com Supabase OK");
                // Verificar tabela de metas
                const { error: errorMetas } = await supabase
                    .from('metas_trato')
                    .select('count')
                    .limit(1);
                if (errorMetas) {
                    console.error("❌ Tabela metas_trato não encontrada:", errorMetas);
                    toast.error("Tabela de Metas não encontrada. Execute o script SQL primeiro.");
                    return;
                }
                console.log("✅ Tabela metas_trato OK");
            }
            catch (error) {
                console.error("❌ Erro ao verificar sistema:", error);
                toast.error("Erro ao verificar sistema");
            }
        }
        verificarSistema();
    }, []);
    async function fetchMetas() {
        const { data } = await supabase
            .from('metas_trato')
            .select(`
        *,
        profissionais!inner(nome)
      `)
            .order('criado_em', { ascending: false });
        if (data) {
            const metasComNome = data.map(meta => {
                var _a;
                return (Object.assign(Object.assign({}, meta), { barbeiro_nome: (_a = meta.profissionais) === null || _a === void 0 ? void 0 : _a.nome }));
            });
            setMetas(metasComNome);
            // Buscar faixas para cada meta
            const faixasObj = {};
            for (const meta of metasComNome) {
                const { data: faixas } = await supabase
                    .from('metas_trato_faixas')
                    .select('*')
                    .eq('meta_id', meta.id);
                faixasObj[meta.id] = faixas || [];
            }
            setFaixasPorMeta(faixasObj);
        }
    }
    // Salvar meta
    async function salvarMeta() {
        if (!barbeirosAdicionados.length || !form.mes || !form.ano) {
            toast.error('Adicione pelo menos um barbeiro e preencha os campos obrigatórios!');
            return;
        }
        if (faixas.length === 0 || faixas.some(f => f.quantidade <= 0 || f.bonificacao <= 0)) {
            toast.error('Adicione pelo menos uma faixa válida!');
            return;
        }
        try {
            for (const b of barbeirosAdicionados) {
                const { data, error } = await supabase
                    .from('metas_trato')
                    .insert(Object.assign(Object.assign({}, form), { barbeiro_id: b.id }))
                    .select();
                if (error)
                    throw error;
                const metaId = data[0].id;
                for (const faixa of faixas) {
                    await supabase.from('metas_trato_faixas').insert({
                        meta_id: metaId,
                        quantidade: faixa.quantidade,
                        bonificacao: faixa.bonificacao,
                        tipo: tipoBonificacao // novo campo
                    });
                }
            }
            toast.success('Meta(s) criada(s) com sucesso!');
            setModalOpen(false);
            setEditingMeta(null);
            resetForm();
            setFaixas([{ quantidade: 0, bonificacao: 0 }]);
            setBarbeirosAdicionados([]);
            setBarbeiroSelecionado('');
            fetchMetas();
        }
        catch (error) {
            console.error('Erro ao salvar meta:', error);
            toast.error('Erro ao salvar meta!');
        }
    }
    // Excluir meta
    async function excluirMeta(id) {
        if (!confirm('Tem certeza que deseja excluir esta meta?'))
            return;
        try {
            const { error } = await supabase
                .from('metas_trato')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            toast.success('Meta excluída com sucesso!');
            fetchMetas();
        }
        catch (error) {
            console.error('Erro ao excluir meta:', error);
            toast.error('Erro ao excluir meta!');
        }
    }
    // Editar meta
    function editarMeta(meta) {
        setEditingMeta(meta);
        setForm({
            barbeiro_id: meta.barbeiro_id,
            mes: meta.mes,
            ano: meta.ano,
            meta_venda_produto: meta.meta_venda_produto,
            meta_faturamento: meta.meta_faturamento,
            tipo_bonificacao: meta.tipo_bonificacao,
            valor_bonificacao: meta.valor_bonificacao,
            quantidade_produtos: meta.quantidade_produtos || 0, // Adicionado para carregar a quantidade de produtos
        });
        setModalOpen(true);
    }
    // Resetar formulário
    function resetForm() {
        setForm({
            barbeiro_id: '',
            mes: '',
            ano: '',
            meta_venda_produto: 0,
            meta_faturamento: 0,
            tipo_bonificacao: 'fixo',
            valor_bonificacao: 0,
            quantidade_produtos: 0, // Resetar a quantidade de produtos
        });
    }
    // Abrir modal para nova meta
    function abrirModalNovaMeta() {
        setEditingMeta(null);
        resetForm();
        setFaixas([{ quantidade: 0, bonificacao: 0 }]);
        setBarbeirosAdicionados([]);
        setBarbeiroSelecionado('');
        setTipoBonificacao('produtos'); // Resetar o tipo de bonificação
        setModalOpen(true);
    }
    // Fechar modal
    function fecharModal() {
        setModalOpen(false);
        setEditingMeta(null);
        resetForm();
    }
    // Obter nome do mês
    function getNomeMes(mes) {
        var _a;
        return ((_a = MESES.find(m => m.value === mes)) === null || _a === void 0 ? void 0 : _a.label) || mes;
    }
    // Agrupamento por barbeiro, mês e ano
    const metasAgrupadas = [];
    const agrupamento = {};
    metas.forEach(meta => {
        var _a;
        if (!meta.id)
            return;
        const key = `${meta.barbeiro_id}_${meta.mes}_${meta.ano}`;
        if (!agrupamento[key]) {
            agrupamento[key] = {
                barbeiro_id: meta.barbeiro_id,
                barbeiro_nome: ((_a = barbeiros.find(b => b.id === meta.barbeiro_id)) === null || _a === void 0 ? void 0 : _a.nome) || meta.barbeiro_nome || '-',
                mes: meta.mes,
                ano: meta.ano,
                metaIds: [meta.id],
                faixasProdutos: [],
                faixasServicos: []
            };
        }
        else {
            agrupamento[key].metaIds.push(meta.id);
        }
        // Adiciona faixas de produtos e serviços desse meta
        const faixas = faixasPorMeta[meta.id] || [];
        agrupamento[key].faixasProdutos.push(...faixas.filter(f => f.tipo === 'produtos'));
        agrupamento[key].faixasServicos.push(...faixas.filter(f => f.tipo === 'servicos'));
    });
    for (const key in agrupamento) {
        metasAgrupadas.push(agrupamento[key]);
    }
    return (<div className="max-w-7xl mx-auto p-4">
      <Toaster />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas - Trato de Barbados</h1>
          <p className="text-gray-600">Gerencie as metas individuais dos barbeiros</p>
        </div>
        <Button onClick={abrirModalNovaMeta} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="w-4 h-4 mr-2"/>
          Adicionar Meta
        </Button>
      </div>


      {/* Cards de metas cadastradas */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">Metas Cadastradas</h3>
        <div className="flex flex-col gap-4">
          {metasAgrupadas.length === 0 && (<div className="text-center text-gray-400 py-8">Nenhuma meta cadastrada.</div>)}
          {/* Cabeçalho da lista */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-2 font-semibold text-gray-700 bg-gray-50 rounded-t-xl">
            <div>Barbeiro</div>
            <div>Período</div>
            <div className="text-green-800">Produtos 🛒</div>
            <div className="text-blue-800">Serviços ✂️</div>
            <div className="text-center">Ações</div>
          </div>
          {metasAgrupadas.map(grupo => (<div key={grupo.barbeiro_id + grupo.mes + grupo.ano} className="bg-white rounded-xl shadow flex flex-col md:grid md:grid-cols-5 gap-4 px-6 py-4 items-center border border-gray-100 hover:shadow-lg transition">
              <div className="font-bold text-gray-900 w-full md:w-auto">{grupo.barbeiro_nome}</div>
              <div className="text-gray-600 w-full md:w-auto">{getNomeMes(grupo.mes)}/{grupo.ano}</div>
              {/* Produtos */}
              <div className="bg-green-50 rounded-lg p-3 w-full md:w-auto min-w-[150px]">
                {grupo.faixasProdutos.length > 0 ? (<ul className="space-y-1">
                    {grupo.faixasProdutos.map((f, idx) => (<li key={idx} className="flex flex-col">
                        <span className="text-gray-700 text-xs">{f.quantidade} un.</span>
                        <span className="font-bold text-green-700 text-base leading-tight">{`R$ ${Number(f.bonificacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                      </li>))}
                  </ul>) : <span className="text-gray-400">-</span>}
              </div>
              {/* Serviços */}
              <div className="bg-blue-50 rounded-lg p-3 w-full md:w-auto min-w-[150px]">
                {grupo.faixasServicos.length > 0 ? (<ul className="space-y-1">
                    {grupo.faixasServicos.map((f, idx) => (<li key={idx} className="flex flex-col">
                        <span className="text-gray-700 text-xs">{f.quantidade} un.</span>
                        <span className="font-bold text-blue-700 text-base leading-tight">{`R$ ${Number(f.bonificacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                      </li>))}
                  </ul>) : <span className="text-gray-400">-</span>}
              </div>
              <div className="flex gap-2 justify-center w-full md:w-auto">
                <Button size="sm" variant="outline" onClick={() => { const metaObj = metas.find(m => m.id === grupo.metaIds[0]); if (metaObj)
            editarMeta(metaObj); }} className="hover:bg-blue-100 focus:ring-2 focus:ring-blue-400">
                  <PencilIcon className="w-4 h-4"/>
                </Button>
                <Button size="sm" variant="outline" onClick={() => excluirMeta(grupo.metaIds[0])} className="text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-400">
                  <TrashIcon className="w-4 h-4"/>
                </Button>
              </div>
            </div>))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Nova Meta Progressiva</h2>
            <p className="text-gray-500 mb-6">Cadastre faixas de bonificação para o barbeiro selecionado.</p>
            <form className="space-y-5" autoComplete="off">
              {/* Unidade e Barbeiros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" htmlFor="unidade">Unidade *</label>
                  <select id="unidade" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={unidadeModal} onChange={e => setUnidadeModal(e.target.value)} required>
                    <option value="">Selecione a unidade</option>
                    <option value="Trato de Barbados">Trato de Barbados</option>
                    <option value="BARBER BEER SPORT CLUB">BARBER BEER SPORT CLUB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" htmlFor="barbeiros">Barbeiros *</label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select id="barbeiro" className="border border-gray-300 rounded-lg px-3 py-2 w-full" value={barbeiroSelecionado} onChange={e => setBarbeiroSelecionado(e.target.value)}>
                        <option value="">Selecione o barbeiro</option>
                        {barbeiros
                .filter(b => !barbeirosAdicionados.some(ad => ad.id === b.id))
                .map(barbeiro => (<option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>))}
                      </select>
                    </div>
                    <button type="button" className="bg-blue-600 text-white rounded-lg px-4 py-2 font-bold hover:bg-blue-700 transition" disabled={!barbeiroSelecionado} onClick={() => {
                const b = barbeiros.find(b => b.id === barbeiroSelecionado);
                if (b && !barbeirosAdicionados.some(ad => ad.id === b.id)) {
                    setBarbeirosAdicionados([...barbeirosAdicionados, b]);
                    setBarbeiroSelecionado('');
                }
            }}>
                      Adicionar
                    </button>
                  </div>
                  {barbeirosAdicionados.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                      {barbeirosAdicionados.map(b => (<span key={b.id} className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm">
                          {b.nome}
                          <button type="button" className="ml-2 text-red-600 hover:text-red-800" onClick={() => setBarbeirosAdicionados(barbeirosAdicionados.filter(ad => ad.id !== b.id))} aria-label={`Remover ${b.nome}`}>
                            ×
                          </button>
                        </span>))}
                    </div>)}
                </div>
              </div>
              {/* Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" htmlFor="mes">Mês *</label>
                  <select id="mes" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={form.mes} onChange={e => setForm(Object.assign(Object.assign({}, form), { mes: e.target.value }))} required>
                    <option value="">Selecione o mês</option>
                    {MESES.map(mes => (<option key={mes.value} value={mes.value}>{mes.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" htmlFor="ano">Ano *</label>
                  <select id="ano" className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={form.ano} onChange={e => setForm(Object.assign(Object.assign({}, form), { ano: e.target.value }))} required>
                    <option value="">Selecione o ano</option>
                    {ANOS.map(ano => (<option key={ano} value={ano}>{ano}</option>))}
                  </select>
                </div>
              </div>
              {/* Tipo de Bonificação */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Tipo de Bonificação *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipoBonificacao" value="produtos" checked={tipoBonificacao === 'produtos'} onChange={() => setTipoBonificacao('produtos')}/>
                    Produtos
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="tipoBonificacao" value="servicos" checked={tipoBonificacao === 'servicos'} onChange={() => setTipoBonificacao('servicos')}/>
                    Serviços
                  </label>
                </div>
              </div>
              {/* Faixas Progressivas */}
              <div>
                <label className="block text-sm font-semibold mb-2">Faixas Progressivas *</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-lg">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Quantidade</th>
                        <th className="p-2 text-left">Bonificação (R$)</th>
                        <th className="p-2 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faixas.map((faixa, idx) => (<tr key={idx} className="border-b">
                          <td className="p-2">
                            <input type="number" min={1} className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={faixa.quantidade} onChange={e => {
                    const novo = [...faixas];
                    novo[idx].quantidade = Number(e.target.value);
                    setFaixas(novo);
                }} aria-label="Quantidade"/>
                          </td>
                          <td className="p-2">
                            <input type="number" min={0} className="border border-gray-300 rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" value={faixa.bonificacao} onChange={e => {
                    const novo = [...faixas];
                    novo[idx].bonificacao = Number(e.target.value);
                    setFaixas(novo);
                }} aria-label="Bonificação"/>
                          </td>
                          <td className="p-2">
                            <button type="button" className="text-red-600 hover:text-red-800 font-semibold" onClick={() => setFaixas(faixas.filter((_, i) => i !== idx))} aria-label="Excluir faixa">
                              Excluir
                            </button>
                          </td>
                        </tr>))}
                      <tr>
                        <td colSpan={3} className="p-2">
                          <button type="button" className="text-blue-600 hover:text-blue-800 font-semibold" onClick={() => setFaixas([...faixas, { quantidade: 0, bonificacao: 0 }])}>
                            + Adicionar faixa
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Botões */}
              <div className="flex gap-2 mt-6">
                <button type="button" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold hover:bg-blue-700 transition" onClick={salvarMeta}>
                  {editingMeta ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" className="flex-1 border border-gray-300 rounded-lg py-2 font-bold text-gray-700 hover:bg-gray-100 transition" onClick={fecharModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
