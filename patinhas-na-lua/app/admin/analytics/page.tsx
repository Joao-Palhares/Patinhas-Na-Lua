import { db } from "@/lib/db";
import { YearlyChart, MonthlyChart } from "./charts";
import Link from "next/link";

// FIX: Define searchParams as a Promise
export default async function AnalyticsPage(props: { 
  searchParams: Promise<{ year?: string }> 
}) {
  // FIX: Await the promise before using it
  const searchParams = await props.searchParams;

  const now = new Date();
  const selectedYear = Number(searchParams?.year) || now.getFullYear();
  const currentMonth = now.getMonth(); 

  // ... (The rest of the code stays exactly the same) ...
  
  // 3. Fetch Data for the SELECTED Year
  const appointments = await db.appointment.findMany({
    where: {
      status: "COMPLETED",
      isPaid: true,
      date: {
        gte: new Date(selectedYear, 0, 1),
        lt: new Date(selectedYear + 1, 0, 1)
      }
    }
  });

  const expenses = await db.expense.findMany({
    where: {
      date: {
        gte: new Date(selectedYear, 0, 1),
        lt: new Date(selectedYear + 1, 0, 1)
      }
    }
  });

  // --- DATA PROCESSING ---
  const yearlyData = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(0, i).toLocaleString('pt-PT', { month: 'short' }),
    income: 0,
    expense: 0
  }));

  const daysInMonth = new Date(selectedYear, currentMonth + 1, 0).getDate();
  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    income: 0,
    expense: 0
  }));

  // Fill Data
  appointments.forEach(app => {
    const month = app.date.getMonth();
    const day = app.date.getDate() - 1;
    const val = Number(app.price);
    yearlyData[month].income += val;
    
    if (selectedYear === now.getFullYear() && month === currentMonth) {
      monthlyData[day].income += val;
    }
  });

  expenses.forEach(exp => {
    const month = exp.date.getMonth();
    const day = exp.date.getDate() - 1;
    const val = Number(exp.amount);
    yearlyData[month].expense += val;

    if (selectedYear === now.getFullYear() && month === currentMonth) {
      monthlyData[day].expense += val;
    }
  });

  // Totals
  const thisMonthTotals = yearlyData[currentMonth];
  const monthlyProfit = thisMonthTotals.income - thisMonthTotals.expense;
  const totalIncome = yearlyData.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = yearlyData.reduce((acc, curr) => acc + curr.expense, 0);
  const totalProfit = totalIncome - totalExpense;
  const monthName = now.toLocaleString('pt-PT', { month: 'long' });

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* HEADER WITH YEAR SELECTOR */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Relatório Financeiro</h1>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <Link 
            href={`/admin/analytics?year=${selectedYear - 1}`}
            className="text-gray-500 hover:text-blue-600 font-bold text-lg"
          >
            ←
          </Link>
          <span className="font-mono text-xl font-bold text-blue-600">{selectedYear}</span>
          <Link 
            href={`/admin/analytics?year=${selectedYear + 1}`}
            className="text-gray-500 hover:text-blue-600 font-bold text-lg"
          >
            →
          </Link>
        </div>
      </div>

      {/* Only show Monthly Breakdown if viewing Current Year */}
      {selectedYear === now.getFullYear() && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2">
            Visão Geral: <span className="text-blue-600">{monthName}</span>
          </h2>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Faturação (Mês)</p>
              <p className="text-3xl font-bold text-green-600">+{thisMonthTotals.income.toFixed(2)}€</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Custos (Mês)</p>
              <p className="text-3xl font-bold text-red-600">-{thisMonthTotals.expense.toFixed(2)}€</p>
            </div>
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${monthlyProfit >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
              <p className="text-sm text-gray-500 font-medium">Lucro Líquido</p>
              <p className={`text-3xl font-bold ${monthlyProfit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {monthlyProfit.toFixed(2)}€
              </p>
            </div>
          </div>
          {/* Daily Graph */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Evolução Diária ({monthName})</h3>
            <MonthlyChart data={monthlyData} />
          </div>
        </div>
      )}

      {/* YEARLY OVERVIEW */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2">
          Visão Anual: {selectedYear}
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Comparativo Mensal</h3>
          <YearlyChart data={yearlyData} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-gray-500 uppercase">Total Anual Faturado</p>
            <p className="text-xl font-bold text-green-700">{totalIncome.toFixed(2)}€</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-gray-500 uppercase">Total Anual Gasto</p>
            <p className="text-xl font-bold text-red-700">{totalExpense.toFixed(2)}€</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-gray-500 uppercase">Lucro Anual</p>
            <p className="text-xl font-bold text-slate-800">{totalProfit.toFixed(2)}€</p>
          </div>
        </div>
      </div>
    </div>
  );
}