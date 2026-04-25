import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CourseDetailsDemo from "./pages/CourseDetailsDemo.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/course-details-demo" element={<CourseDetailsDemo />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);