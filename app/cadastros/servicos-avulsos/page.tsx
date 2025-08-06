"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@nextui-org/react";
import { PlusIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ServicosAvulsosPage() {
  const [servicos, setServicos] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ unidade_id: "", nome: "", tempo_minutos: "", valor: "" });
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnidades();
  }, []);

  useEffect(() => {
    if (unidadeSelecionada) fetchServicos();
  }, [unidadeSelecionada]);

  async function fetchUnidades() {
    const { data } = await supabase.from("unidades").select("id, nome").order("nome");
    setUnidades(data || []);
    if (data && data.length > 0 && !unidadeSelecionada) setUnidadeSelecionada(data[0].id);
  }

  async function fetchServicos() {
    const { data } = await supabase.from("servicos_avulsos").select("*").eq("unidade_id", unidadeSelecionada).order("criado_em", { ascending: false });
    setServicos(data || []);
  }

  function openNovo() {
    setForm({ unidade_id: unidadeSelecionada, nome: "", tempo_minutos: "", valor: "" });
    setErro("");
    setModalOpen(true);
  }

  async function salvarServico() {
    setSaving(true);
    setErro("");
    if (!form.unidade_id || !form.nome || !form.tempo_minutos || !form.valor) {
      setErro("Preencha todos os campos obrigatórios.");
      setSaving(false);
      return;
    }
    await supabase.from("servicos_avulsos").insert({
      unidade_id: form.unidade_id,
      nome: form.nome,
      tempo_minutos: Number(form.tempo_minutos),
      valor: Number(form.valor)
    });
    setModalOpen(false);
    setSaving(false);
    fetchServicos();
  }

  return (
    <LayoutCadastros titulo="Serviços Avulsos">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700">Unidade:</span>
            <Select
              aria-label="Selecionar unidade"
              selectedKeys={unidadeSelecionada ? [unidadeSelecionada] : []}
              onChange={e => setUnidadeSelecionada(e.target.value)}
              className="min-w-[180px]"
            >
              {unidades.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </Select>
          </div>
          <Button color="primary" startContent={<PlusIcon className="w-5 h-5" />} onClick={openNovo} className="w-full md:w-auto text-base font-semibold shadow-lg h-12">Cadastrar Serviço</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {servicos.length === 0 ? (
            <Card className="shadow-md col-span-full">
              <CardBody className="text-center text-gray-400 py-12">Nenhum serviço avulso cadastrado para esta unidade.</CardBody>
            </Card>
          ) : (
            servicos.map((servico: any) => (
              <Card key={servico.id} className="hover:shadow-lg transition-shadow shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 w-full">
                    <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{servico.nome}</h3>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Tempo: <span className="font-semibold">{servico.tempo_minutos} min</span></span>
                    <span className="text-sm text-gray-700">Valor: <span className="font-semibold">R$ {Number(servico.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
      {/* Modal Cadastro */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <ModalContent>
          <ModalHeader>Cadastrar Serviço Avulso</ModalHeader>
          <ModalBody>
            <Select
              label="Unidade da Barbearia"
              selectedKeys={form.unidade_id ? [form.unidade_id] : []}
              onChange={e => setForm(f => ({ ...f, unidade_id: e.target.value }))}
              isRequired
              className="mb-2"
            >
              {unidades.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
              ))}
            </Select>
            <Input label="Nome do Serviço" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} isRequired className="mb-2" />
            <Input label="Tempo de Execução (minutos)" type="number" value={form.tempo_minutos} onChange={e => setForm(f => ({ ...f, tempo_minutos: e.target.value }))} isRequired min={1} className="mb-2" />
            <Input label="Valor do Serviço (R$)" type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} isRequired min={0} step={0.01} className="mb-2" />
            {erro && <div className="text-red-600 text-sm mt-2">{erro}</div>}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" isLoading={saving} onClick={salvarServico}>Cadastrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutCadastros>
  );
} 