"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface PeriodFilterProps {
  onFilterChange: (filters: {
    period: 'day' | 'month' | 'year';
    year: number;
    month?: number;
    day?: number;
  }) => void;
  currentFilters: {
    period: 'day' | 'month' | 'year';
    year: number;
    month?: number;
    day?: number;
  };
}

export default function PeriodFilter({ onFilterChange, currentFilters }: PeriodFilterProps) {
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

  const handlePeriodChange = (period: 'day' | 'month' | 'year') => {
    const newFilters = {
      ...currentFilters,
      period,
      month: period === 'month' || period === 'day' ? currentFilters.month || new Date().getMonth() + 1 : undefined,
      day: period === 'day' ? currentFilters.day || new Date().getDate() : undefined
    };
    onFilterChange(newFilters);
  };

  const handleYearChange = (year: number) => {
    const newFilters = { ...currentFilters, year };
    onFilterChange(newFilters);
  };

  const handleMonthChange = (month: number) => {
    const newFilters = { ...currentFilters, month };
    onFilterChange(newFilters);
  };

  const handleDayChange = (day: number) => {
    const newFilters = { ...currentFilters, day };
    onFilterChange(newFilters);
  };

  const getFilterLabel = () => {
    switch (currentFilters.period) {
      case 'day':
        return `${currentFilters.day}/${currentFilters.month}/${currentFilters.year}`;
      case 'month':
        const monthName = months.find(m => m.value === currentFilters.month)?.label;
        return `${monthName} ${currentFilters.year}`;
      case 'year':
        return currentFilters.year.toString();
      default:
        return 'Período';
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros de Período</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Período */}
            <Select value={currentFilters.period} onValueChange={(period: 'day' | 'month' | 'year') => handlePeriodChange(period)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>

            {/* Ano */}
            <Select value={currentFilters.year.toString()} onValueChange={(val) => handleYearChange(parseInt(val))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mês (apenas para período mensal ou diário) */}
            {(currentFilters.period === 'month' || currentFilters.period === 'day') && (
              <Select value={currentFilters.month?.toString() || ''} onValueChange={(val) => handleMonthChange(parseInt(val))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Dia (apenas para período diário) */}
            {currentFilters.period === 'day' && (
              <Select value={currentFilters.day?.toString() || ''} onValueChange={(val) => handleDayChange(parseInt(val))}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {getFilterLabel()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 



