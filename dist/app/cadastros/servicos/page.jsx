"use client";
import { useState } from "react";
import { Card, CardBody, CardHeader, Avatar, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { PlusIcon, WrenchScrewdriverIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
export default function PaginaServicos() {
    const [servicos, setServicos] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [servicoEdit, setServicoEdit] = useState(null);
    const [servicoDelete, setServicoDelete] = useState(null);
    const [form, setForm] = useState({ nome: "", tempo_minutos: "" });
    const [erro, setErro] = useState("");
    const [saving, setSaving] = useState(false);
    async function fetchServicos() {
        const { data } = await supabase.from("servicos").select("*").order("criado_em", { ascending: false });
        setServicos(data || []);
    }
    useState(() => { fetchServicos(); }, []);
    function openNovo() {
        setServicoEdit(null);
        setForm({ nome: "", tempo_minutos: "" });
        setErro("");
        setModalOpen(true);
    }
    function openEditar(s) {
        setServicoEdit(s);
        setForm({ nome: s.nome, tempo_minutos: String(s.tempo_minutos) });
        setErro("");
        setModalOpen(true);
    }
    async function salvarServico() {
        setSaving(true);
        setErro("");
        if (!form.nome || !form.tempo_minutos) {
            setErro("Preencha todos os campos obrigatórios.");
            setSaving(false);
            return;
        }
        if (servicoEdit) {
            await supabase.from("servicos").update({ nome: form.nome, tempo_minutos: Number(form.tempo_minutos) }).eq("id", servicoEdit.id);
        }
        else {
            await supabase.from("servicos").insert({ nome: form.nome, tempo_minutos: Number(form.tempo_minutos) });
        }
        setModalOpen(false);
        setSaving(false);
        fetchServicos();
    }
    function openDelete(s) {
        setServicoDelete(s);
        setModalDelete(true);
    }
    async function excluirServico() {
        if (!servicoDelete)
            return;
        await supabase.from("servicos").delete().eq("id", servicoDelete.id);
        setModalDelete(false);
        setServicoDelete(null);
        fetchServicos();
    }
    return (<LayoutCadastros titulo="Serviços">
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6 shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Catálogo de Serviços</h2>
                <p className="text-gray-600 text-sm">Gerencie os serviços oferecidos pela barbearia</p>
              </div>
              <Button color="primary" startContent={<PlusIcon className="w-4 h-4"/>} onClick={openNovo}>Novo Serviço</Button>
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicos.map((servico) => (<Card key={servico.id} className="hover:shadow-lg transition-shadow shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 w-full">
                  <Avatar icon={<WrenchScrewdriverIcon className="w-4 h-4"/>} classNames={{ base: "bg-blue-100", icon: "text-blue-600" }}/>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{servico.nome}</h3>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Tempo: <span className="font-semibold">{servico.tempo_minutos} min</span></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="flat" startContent={<PencilIcon className="w-4 h-4"/>} onClick={() => openEditar(servico)}>Editar</Button>
                  <Button size="sm" color="danger" variant="flat" startContent={<TrashIcon className="w-4 h-4"/>} onClick={() => openDelete(servico)}>Excluir</Button>
                </div>
              </CardBody>
            </Card>))}
        </div>
        {/* Modal Cadastro/Edição */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
          <ModalContent>
            <ModalHeader>{servicoEdit ? "Editar Serviço" : "Novo Serviço"}</ModalHeader>
            <ModalBody>
              <Input label="Nome do Serviço" value={form.nome} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { nome: e.target.value })))} isRequired/>
              <Input label="Tempo de Execução (minutos)" type="number" value={form.tempo_minutos} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { tempo_minutos: e.target.value })))} isRequired min={1}/>
              {erro && <div className="text-red-600 text-sm mt-2">{erro}</div>}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button color="primary" isLoading={saving} onClick={salvarServico}>{servicoEdit ? "Salvar" : "Cadastrar"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Modal Exclusão */}
        <Modal isOpen={modalDelete} onClose={() => setModalDelete(false)} size="sm">
          <ModalContent>
            <ModalHeader>Excluir Serviço</ModalHeader>
            <ModalBody>
              <p>Tem certeza que deseja excluir o serviço <span className="font-semibold">{servicoDelete === null || servicoDelete === void 0 ? void 0 : servicoDelete.nome}</span>?</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={() => setModalDelete(false)}>Cancelar</Button>
              <Button color="danger" onClick={excluirServico}>Excluir</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </LayoutCadastros>);
}
