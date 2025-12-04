import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightSearchPage from "./pages/SearchPage";
import FlightResultsPage from "./pages/ResultsPage";
import ReturnResultsPage from "./pages/ReturnResultsPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">

        <main className="pt-16">
          <Routes>
            <Route path="/" element={<FlightSearchPage />} />
            <Route path="/results" element={<FlightResultsPage />} />
            <Route path="/results/return" element={<ReturnResultsPage />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-center py-6 text-gray-400 border-t border-gray-700">
          <p>&copy; 2024 Flight Finder. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

