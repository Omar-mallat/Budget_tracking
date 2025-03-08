import Sidebar from "../Components/SideBar";
import Chart from "../Components/Chart";
import RecentTransactions from "../Components/RecentTransaction";
import axios from "axios";
import { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaWallet } from "react-icons/fa";

const Dashboard = () => {
  const userId = 1;
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/dashboard/summary/${userId}`)
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("Error fetching Summary", err));

    axios
      .get(`http://localhost:5000/dashboard/transaction/${userId}`)
      .then((res) => {
        setTransactions(res.data);
        const chartFormat = res.data.map((item) => ({
          month: item.date.substring(0, 7),
          income: item.type === "income" ? item.amount : 0,
          expenses: item.type === "expense" ? item.amount : 0,
        }));
        setChartData(chartFormat);
      })
      .catch((err) => console.error("Error fetching transactions:", err));
  }, [userId]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="w-full p-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-5 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm">Total Income</p>
              <h2 className="text-3xl font-bold">TND {summary.totalIncome}</h2>
            </div>
            <FaArrowUp className="text-4xl" />
          </div>

          <div className="p-5 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm">Total Expenses</p>
              <h2 className="text-3xl font-bold">TND {summary.totalExpenses}</h2>
            </div>
            <FaArrowDown className="text-4xl" />
          </div>

          <div className="p-5 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm">Total Balance</p>
              <h2 className="text-3xl font-bold">TND {summary.totalBalance}</h2>
            </div>
            <FaWallet className="text-4xl" />
          </div>
        </div>

        {/* Income vs Expenses Chart */}
        <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-gray-700">Income vs Expenses</h2>
          <Chart data={chartData} />
        </div>

        {/* Recent Transactions */}
        <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-xl font-bold text-gray-700">Recent Transactions</h2>
          <RecentTransactions transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
