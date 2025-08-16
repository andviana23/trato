"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, Checkbox, Textarea } from "@/components/ui/chakra-adapters";
import dayjs from "dayjs";
import { useUnidade } from "@/components/UnidadeContext";
import { createAgendamento, updateAgendamento, getClientesByUnidade, getProfissionaisByUnidade, getServicosByUnidade } from "@/lib/services/agenda";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string; // YYYY-MM-DD
  editing?: {
    id?: string;
    profissional_id?: string;
    cliente_id?: string | null;
    titulo?: string | null;
    data_inicio?: string;
  } | null;
  defaultProfessionalId?: string;
};

export default function AgendamentoModal({ isOpen, onClose, onSaved, defaultDate, editing, defaultProfessionalId }: Props) {
  const { unidade, setUnidade } = useUnidade();
  const supabase = createClient();

  const [date, setDate] = useState<string>(defaultDate || dayjs().format('YYYY-MM-DD'));
  const [responsavelId, setResponsavelId] = useState<string>(editing?.profissional_id || defaultProfessionalId || "");
  const [clienteId, setClienteId] = useState<string>(editing?.cliente_id || "");
  const [clienteNome, setClienteNome] = useState<string>("");
  const [telefone, setTelefone] = useState<string>("");
  const [servicoId, setServicoId] = useState<string>("");
  const [hora, setHora] = useState<string>(editing ? dayjs(editing.data_inicio).format('HH:mm') : (typeof window !== 'undefined' ? localStorage.getItem('agenda.defaultHour') || '' : ''));
  const [tempo, setTempo] = useState<number>(30);
  const [obs, setObs] = useState<string>("");
  const [recorrencia, setRecorrencia] = useState<boolean>(false);
  const [lembrete, setLembrete] = useState<boolean>(false);
  const [tab, setTab] = useState<'agendar'|'bloquear'|'fila'>('agendar');
  type Profissional = { id: string; nome: string; avatar_url?: string | null };
  type Servico = { id: string; nome: string; tempo_minutos?: number | null };
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoBusca, setServicoBusca] = useState<string>("");
  const [criandoServico, setCriandoServico] = useState<boolean>(false);
  const [novoServicoNome, setNovoServicoNome] = useState<string>("");
  const [novoServicoDuracao, setNovoServicoDuracao] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string; telefone?: string | null }>>([]);

  useEffect(() => {
    setDate(defaultDate || dayjs().format('YYYY-MM-DD'));
    if (typeof window !== 'undefined') {
      const h = localStorage.getItem('agenda.defaultHour');
      if (h) setHora(h);
    }
  }, [defaultDate]);

  useEffect(() => {
    (async () => {
      console.log('Modal de agendamento - Unidade atual:', unidade);
      
      // Buscar profissionais da unidade selecionada
      const profissionaisUnidade = await getProfissionaisByUnidade(unidade);
      console.log('Profissionais encontrados:', profissionaisUnidade.length);
      setProfissionais(profissionaisUnidade);
      
      // Buscar serviços da unidade selecionada
      const servicosUnidade = await getServicosByUnidade(unidade);
      console.log('Serviços encontrados:', servicosUnidade.length);
      setServicos(servicosUnidade);
      
      // Buscar clientes da unidade selecionada
      const clientesUnidade = await getClientesByUnidade(unidade);
      console.log('Clientes encontrados:', clientesUnidade.length);
      setClientes(clientesUnidade);
    })();
  }, [supabase, unidade]);

  const horasDoDia = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h < 20; h++) {
      for (let m = 0; m < 60; m += 10) {
        slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      }
    }
    return slots;
  }, []);

  const handleSave = async () => {
    if (!responsavelId || !date || !hora) return;
    setLoading(true);
    try {
      const inicio = dayjs(`${date} ${hora}:00`).toISOString();
      const fim = dayjs(inicio).add(tempo, 'minute').toISOString();
      const payload: {
        profissional_id: string;
        cliente_id: string | null;
        titulo: string;
        data_inicio: string;
        data_fim: string;
        status: 'confirmado';
        unidade: string;
      } = {
        profissional_id: responsavelId,
        cliente_id: clienteId || null,
        titulo: clienteNome || 'Agendamento',
        data_inicio: inicio,
        data_fim: fim,
        status: 'confirmado' as const,
        unidade: unidade || 'trato',
      };
      if (editing?.id) {
        await updateAgendamento(unidade, editing.id, payload);
      } else {
        await createAgendamento(unidade, payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('Erro ao salvar agendamento', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open:boolean)=>!open&&onClose()}>
      <ModalContent className="w-full max-w-[1200px] p-0">
        <ModalHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant={tab==='agendar' ? 'default' : 'secondary'} onClick={()=>setTab('agendar')}>Novo Agendamento</Button>
              <Button variant={tab==='bloquear' ? 'default' : 'secondary'} onClick={()=>setTab('bloquear')}>Bloquear Agenda</Button>
              <Button variant={tab==='fila' ? 'default' : 'secondary'} onClick={()=>setTab('fila')}>Fila de Espera</Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Unidade:</span>
              <Select 
                value={unidade} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setUnidade(e.target.value);
                }}
                className="min-w-[200px]"
              >
                <option value="Trato de Barbados">Trato de Barbados</option>
                <option value="BARBER BEER SPORT CLUB">BARBER BEER SPORT CLUB</option>
              </Select>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="px-6 py-5">
          {tab==='agendar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna esquerda */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data:</label>
                  <Input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} aria-required />
                </div>
                <div>
                  <label className="text-sm font-medium">Cliente*:</label>
                  <Select value={clienteId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const id = e.target.value; setClienteId(id);
                    const c = clientes.find(x => x.id === id);
                    setClienteNome(c?.nome || ""); setTelefone(c?.telefone || "");
                  }} aria-required>
                    <option value="" disabled>Selecionar cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone*:</label>
                  <Input placeholder="(00) 00000-0000" value={telefone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelefone(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Observações:</label>
                  <Textarea placeholder="Opcional" value={obs} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObs(e.target.value)} rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium">Lembrete:</label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={lembrete} onChange={(e)=>setLembrete(!!e?.target?.checked)} />
                    <span className="text-sm text-muted-foreground">Enviar lembrete via WhatsApp</span>
                  </div>
                  <div className="text-xs text-rose-500 mt-1">Apenas com 12 horas de antecedência!</div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Responsável*:</label>
                  <Select value={responsavelId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResponsavelId(e.target.value)} aria-required>
                    <option value="" disabled>Selecione o profissional</option>
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Serviço*:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Buscar serviço"
                      value={servicoBusca}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServicoBusca(e.target.value)}
                    />
                    <Button variant={criandoServico ? 'secondary' : 'default'} onClick={() => setCriandoServico(v => !v)} className="whitespace-nowrap">
                      {criandoServico ? 'Cancelar' : '+ Criar serviço'}
                    </Button>
                  </div>
                  {!criandoServico && (
                    <Select
                      className="mt-2 w-full"
                      value={servicoId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const id = e.target.value;
                        setServicoId(id);
                        const svc = servicos.find(s => s.id === id);
                        if (svc?.tempo_minutos) setTempo(Number(svc.tempo_minutos));
                      }}
                    >
                      <option value="">Selecione o serviço</option>
                      {servicos
                        .filter((s) => s.nome.toLowerCase().includes(servicoBusca.toLowerCase()))
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </Select>
                  )}
                  {criandoServico && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <Input placeholder="Nome do serviço" value={novoServicoNome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNovoServicoNome(e.target.value)} />
                      </div>
                      <div>
                        <Select value={String(novoServicoDuracao)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNovoServicoDuracao(Number(e.target.value || '30'))}>
                          {[10, 15, 20, 30, 45, 60, 90].map((t) => (
                            <option key={t} value={String(t)}>{t} min</option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Button
                          onClick={async () => {
                            if (!novoServicoNome.trim()) return;
                            const { data, error } = await supabase
                              .from('servicos_avulsos')
                              .insert({ nome: novoServicoNome.trim(), tempo_minutos: novoServicoDuracao })
                              .select('id, nome, tempo_minutos')
                              .single();
                            if (!error && data) {
                                                          const novo = { id: String((data as { id: string }).id), nome: (data as { nome: string }).nome, tempo_minutos: (data as { tempo_minutos: number | null }).tempo_minutos };
                            setServicos((prev) => [...prev, novo]);
                            setServicoId(novo.id);
                            if (novo.tempo_minutos) setTempo(Number(novo.tempo_minutos));
                              setNovoServicoNome('');
                              setNovoServicoDuracao(30);
                              setCriandoServico(false);
                            }
                          }}
                        >
                          Salvar serviço
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Hora*:</label>
                    <Select value={hora} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHora(e.target.value)} aria-required>
                      {horasDoDia.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tempo do Atendimento*:</label>
                    <Select value={String(tempo)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTempo(Number(e.target.value || "0"))}>
                      {[15, 30, 45, 60, 90].map((t) => (
                        <option key={t} value={String(t)}>{t} min</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Recorrência:</label>
                  <Checkbox checked={recorrencia} onChange={(e)=>setRecorrencia(!!e?.target?.checked)} />
                  <span className="text-sm">Sim</span>
                </div>
              </div>
            </div>
          )}

          {tab==='bloquear' && (
            <div className="text-sm text-muted-foreground">Funcionalidade de bloqueio de agenda será adicionada aqui.</div>
          )}
          {tab==='fila' && (
            <div className="text-sm text-muted-foreground">Gerenciamento da fila de espera será adicionado aqui.</div>
          )}
        </ModalBody>
        <ModalFooter className="px-6 py-4 border-t">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button isLoading={loading} onClick={handleSave}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}




