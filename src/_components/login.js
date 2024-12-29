import React, { useState } from "react";
import axios from "axios";

const Login = ({ setUserToken }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in both username and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        username,
        password,
      });

      if (response.data.token) {
        setUserToken(response.data.token);
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    } catch (err) {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="mt-2">
          Register your account here to click{" "}
          <a className="text-slate-600" href="/register">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
