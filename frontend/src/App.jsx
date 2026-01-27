import { Container } from "react-bootstrap";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Skills from "./pages/Skills";
import MySkills from "./pages/MySkills";
import Profile from "./pages/Profile";
import Home from "./pages/Home.jsx";
import Recommendations from "./pages/Recommendations.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Container className="py-4 app-page">

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/skills" element={<Skills />} />
          <Route
            path="/my-skills"
            element={
              <ProtectedRoute>
                <MySkills />
              </ProtectedRoute>
            }
          />
          <Route path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

          <Route path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            } />


          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
