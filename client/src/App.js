import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import SocialEnterprise from "./scenes/socialenterprise";
import Mentors from "./scenes/mentors";
import Analytics from "./scenes/analytics";
import Reports from "./scenes/reports";
import Scheduling from "./scenes/scheduling";
import { Routes, Route } from "react-router-dom";


function App() {
/*  const [backendData, setBackendData] = useState({ users: [] }); // Default to an empty array for 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api") // Make sure to call the backend server correctly
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data); // Set the entire response (with 'users')
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home backendData={backendData} loading={loading} error={error} />}
        />
        <Route path="/reports" element={<Reports />} />
        <Route path="/social-enterprises" element={<SocialEnterprises />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/scheduling" element={<Scheduling />} />
      </Routes>
    </Router>
  );*/
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar />
          <main className="content">
            <Topbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/socialenterprise" element={<SocialEnterprise />} />
              <Route path="/mentors" element={<Mentors />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/scheduling" element={<Scheduling />} />
            </Routes>

          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
