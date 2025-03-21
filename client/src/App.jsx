import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from '@/pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Details from './pages/Details';
import LiveTracker from './pages/LiveTracker';
import Cal from './pages/Cal';
import NotionAIDashboard from './pages/notion';
import YourInteractions from './pages/YourInteractions';
import Meet from './pages/Meet';


const App = () => {
  return (
    <TooltipProvider>
      <div className="bg-zinc-900 min-h-screen">
        <Toaster position="bottom-right" richColors />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/details" element={<Details />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tracking" element={<LiveTracker />} />
            <Route path="/calender" element={<Cal />} />
            <Route path="/notion" element={<NotionAIDashboard />} />
            <Route path="/interactions" element={<YourInteractions />} />
            <Route path="/meet" element={<Meet />} />


          </Route>
        </Routes>
      </div>
    </TooltipProvider>
  );
};

export default App;