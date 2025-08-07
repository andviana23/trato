"use client";
import { useState } from 'react';
import { Card, CardBody, Select, SelectItem } from '@nextui-org/react';
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
export default function PeriodFilter({ onFilterChange, currentFilters }) {
    var _a, _b;
    const [isOpen, setIsOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const handlePeriodChange = (period) => {
        const newFilters = Object.assign(Object.assign({}, currentFilters), { period, month: period === 'month' || period === 'day' ? currentFilters.month || new Date().getMonth() + 1 : undefined, day: period === 'day' ? currentFilters.day || new Date().getDate() : undefined });
        onFilterChange(newFilters);
    };
    const handleYearChange = (year) => {
        const newFilters = Object.assign(Object.assign({}, currentFilters), { year });
        onFilterChange(newFilters);
    };
    const handleMonthChange = (month) => {
        const newFilters = Object.assign(Object.assign({}, currentFilters), { month });
        onFilterChange(newFilters);
    };
    const handleDayChange = (day) => {
        const newFilters = Object.assign(Object.assign({}, currentFilters), { day });
        onFilterChange(newFilters);
    };
    const getFilterLabel = () => {
        var _a;
        switch (currentFilters.period) {
            case 'day':
                return `${currentFilters.day}/${currentFilters.month}/${currentFilters.year}`;
            case 'month':
                const monthName = (_a = months.find(m => m.value === currentFilters.month)) === null || _a === void 0 ? void 0 : _a.label;
                return `${monthName} ${currentFilters.year}`;
            case 'year':
                return currentFilters.year.toString();
            default:
                return 'Período';
        }
    };
    return (<Card className="mb-6">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-5 h-5 text-gray-500"/>
            <span className="font-medium text-gray-700">Filtros de Período</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Período */}
            <Select label="Período" selectedKeys={[currentFilters.period]} onSelectionChange={(keys) => {
            const period = Array.from(keys)[0];
            handlePeriodChange(period);
        }} className="w-32">
              <SelectItem key="day" value="day">Dia</SelectItem>
              <SelectItem key="month" value="month">Mês</SelectItem>
              <SelectItem key="year" value="year">Ano</SelectItem>
            </Select>

            {/* Ano */}
            <Select label="Ano" selectedKeys={[currentFilters.year.toString()]} onSelectionChange={(keys) => {
            const year = parseInt(Array.from(keys)[0]);
            handleYearChange(year);
        }} className="w-24">
              {years.map(year => (<SelectItem key={year.toString()} value={year.toString()}>
                  {year}
                </SelectItem>))}
            </Select>

            {/* Mês (apenas para período mensal ou diário) */}
            {(currentFilters.period === 'month' || currentFilters.period === 'day') && (<Select label="Mês" selectedKeys={[((_a = currentFilters.month) === null || _a === void 0 ? void 0 : _a.toString()) || '']} onSelectionChange={(keys) => {
                const month = parseInt(Array.from(keys)[0]);
                handleMonthChange(month);
            }} className="w-32">
                {months.map(month => (<SelectItem key={month.value.toString()} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>))}
              </Select>)}

            {/* Dia (apenas para período diário) */}
            {currentFilters.period === 'day' && (<Select label="Dia" selectedKeys={[((_b = currentFilters.day) === null || _b === void 0 ? void 0 : _b.toString()) || '']} onSelectionChange={(keys) => {
                const day = parseInt(Array.from(keys)[0]);
                handleDayChange(day);
            }} className="w-20">
                {days.map(day => (<SelectItem key={day.toString()} value={day.toString()}>
                    {day}
                  </SelectItem>))}
              </Select>)}
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500"/>
            <span className="text-sm text-gray-600">
              {getFilterLabel()}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>);
}
