import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './_components/login'; // Ensure the correct path to your login component
import Whiteboard from './_components/whiteboard'; // Your whiteboard component
import Register from './_components/register';
import Logout from './_components/logout';

function App() {
  const [userToken, setUserToken] = useState(null); // State to store the user token

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUserToken(token); // Set the token if it exists
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Route for login */}
        <Route
          path="/"
          element={
            // If the user is already logged in (i.e., token exists), redirect to the whiteboard
           <Login setUserToken={setUserToken} />
          }
        />
        <Route
          path="/login"
          element={
            // If the user is already logged in (i.e., token exists), redirect to the whiteboard
            userToken ? <Navigate to="/whiteboard" /> : <Login setUserToken={setUserToken} />
          }
        />

         {/* Route for registration */}
         <Route
          path="/register"
          element={
            <Register setUserToken={setUserToken} />
          }
        />
        {/* Route for whiteboard */}
        <Route
          path="/whiteboard"
          element={
            // Redirect to login if no userToken is present
            userToken ? <Whiteboard /> : <Navigate to="/login" />
          }
        />

        {/* Logout route */}
        <Route path="/logout" element={<Logout setUserToken={setUserToken} />} />
      </Routes>

    </Router>
  );
}

export default App;
