import Sidebar from "../Components/SideBar";
import Chart from"../Components/Chart";
import RecentTransactions from "../Components/RecentTransaction";
import axios from "axios";
import { useState ,useEffect} from "react";
const Dashboard = () => {
  const userId = 1;
  const [summary,setSummary] =useState({totalIncome:0,totalExpenses:0,totalBalance:0});
  const[transactions,setTransactions]=useState([]);
  const [chartData,setChartData]=useState([]);
  useEffect(()=>{
    axios.get(`http://localhost:5000/dashboard/summary/${userId}`)
    .then((res)=>setSummary(res.data))
    .catch((err)=>console.error("Error fetching Summary",err));
    axios.get(`http://localhost:5000/dashboard/transaction/${userId}`)
    .then((res)=>{
      setTransactions(res.data);
      const chartFormat = res.data.map((item)=>({
        month:item.date.substring(0,7),
        income:item.type=="income" ? item.amount:0,
        expenses:item.type=="expense"?item.amount:0,
      }));
      setChartData(chartFormat);
    })
    .catch((err)=>console.error("error fetching transactions:",err))
  },[userId]);
  return (
    <div className="flex h-screen">
    <Sidebar />
    <div className="w-4/5 p-6 bg-gray-50">
      <h1 className="text-2xl font-bold">All Transactions</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 shadow-md rounded-lg text-center">
          <p className="text-gray-500">Total Income</p>
          <h2 className="text-2xl font-bold text-green-500">TND{summary.totalIncome}</h2>
        </div>
        <div className="bg-white p-4 shadow-md rounded-lg text-center">
          <p className="text-gray-500">Total Expenses</p>
          <h2 className="text-2xl font-bold text-red-500">TND{summary.totalExpenses}</h2>
        </div>
        <div className="bg-white p-4 shadow-md rounded-lg text-center">
          <p className="text-gray-500">Total Balance</p>
          <h2 className="text-2xl font-bold text-blue-500">TND{summary.totalBalance}</h2>
        </div>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="mt-8">
        <Chart data={chartData} />
      </div>

      {/* Recent Transactions */}
     <div className="mt-8">
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  </div>
);

};

export default Dashboard;
