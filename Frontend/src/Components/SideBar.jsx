import { FaChartPie, FaWallet, FaMoneyBillWave, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const Sidebar = () => {
  const navigate = useNavigate();
  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/");
  }
  return (
    <div className="w-1/3 bg-gray-100 h-screen p-5 flex flex-col">
      <div className="flex items-center space-x-3">
        <img src="user.png" alt="User" className="rounded-full w-36" />
        <div>
          <h2 className="font-bold text-lg">Omar</h2>
          <p className="text-sm text-gray-500">Your Money</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col space-y-4">
        <a href="/dashboard" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <FaChartPie /> <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <FaWallet /> <span>View Transactions</span>
        </a>
        <a href="/incomes" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <FaMoneyBillWave /> <span>Incomes</span>
        </a>
        <a href="/expenses" className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded">
          <FaMoneyBillWave /> <span>Expenses</span>
        </a>
      </nav>

      <button onClick={handleSignOut} className="mt-auto flex items-center cursor-pointer space-x-2 text-red-500">
        <FaSignOutAlt /> <span>Sign Out</span>
      </button>
    </div>
  );
};

export default Sidebar;
