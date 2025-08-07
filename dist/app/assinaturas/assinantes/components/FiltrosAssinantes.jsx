"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Input, Select, Button } from "@nextui-org/react";
export default function FiltrosAssinantes(_a) {
    var { periodo, setPeriodo } = _a, props = __rest(_a, ["periodo", "setPeriodo"]);
    return (<div className="flex flex-wrap gap-4 items-end bg-white rounded-xl shadow p-4 mb-4">
      <Select label="Tipo de Pagamento" className="w-48"/>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Período de vencimento</label>
        <Input type="date" value={periodo.dataInicio} onChange={e => setPeriodo(p => (Object.assign(Object.assign({}, p), { dataInicio: e.target.value })))} className="w-36"/>
        <span className="text-gray-500">até</span>
        <Input type="date" value={periodo.dataFim} onChange={e => setPeriodo(p => (Object.assign(Object.assign({}, p), { dataFim: e.target.value })))} className="w-36"/>
      </div>
      <Select label="Status de Vencimento" className="w-48"/>
      <Select label="Ordenar por" className="w-48"/>
      <Button className="bg-red-100 text-red-600 font-semibold">Limpar</Button>
      {/* Chips de filtros ativos, se necessário */}
    </div>);
}
