"use client";
import { Card, CardBody, Progress } from '@nextui-org/react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
export default function FaturamentoCard({ data, loading }) {
    var _a;
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };
    const calculatePercentage = () => {
        var _a, _b;
        if (!((_a = data === null || data === void 0 ? void 0 : data.goal) === null || _a === void 0 ? void 0 : _a.amount) || !((_b = data === null || data === void 0 ? void 0 : data.revenue) === null || _b === void 0 ? void 0 : _b.total))
            return 0;
        return Math.min((data.revenue.total / data.goal.amount) * 100, 100);
    };
    const getStatusColor = () => {
        const percentage = calculatePercentage();
        if (percentage >= 100)
            return 'success';
        if (percentage >= 75)
            return 'warning';
        return 'danger';
    };
    const getStatusIcon = () => {
        const percentage = calculatePercentage();
        if (percentage >= 100)
            return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500"/>;
        if (percentage >= 75)
            return <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-500"/>;
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500"/>;
    };
    return (<Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-green-100 text-sm font-medium">Faturamento Mensal</p>
            <p className="text-3xl font-bold">
              {loading ? '...' : formatCurrency(((_a = data === null || data === void 0 ? void 0 : data.revenue) === null || _a === void 0 ? void 0 : _a.total) || 0)}
            </p>
            {(data === null || data === void 0 ? void 0 : data.goal) && (<div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-200">Meta: {formatCurrency(data.goal.amount)}</span>
                  <span className="text-green-200">
                    {calculatePercentage().toFixed(1)}%
                  </span>
                </div>
                <Progress value={calculatePercentage()} color={getStatusColor()} className="h-2"/>
              </div>)}
          </div>
          <div className="bg-green-400 p-3 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6"/>
          </div>
        </div>
      </CardBody>
    </Card>);
}
