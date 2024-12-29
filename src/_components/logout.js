import React from "react";
import { useNavigate } from "react-router-dom";

const Logout = ({ setUserToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");

    // Check if setUserToken is a function, then reset it to null
    if (typeof setUserToken === "function") {
      setUserToken(null);
    } else {
      console.error("setUserToken is not a function");
    }

    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-24 p-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
};

export default Logout;
