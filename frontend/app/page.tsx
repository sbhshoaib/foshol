'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {

  Home, Leaf, Calendar, User, CloudRain, ScanLine, TrendingUp, MessageSquare,
  Droplets, Settings, Bell, Sun, ChevronRight, Plus, MapPin, LogOut, Moon,
  X, Check, Image as ImageIcon, CheckCircle2, ArrowLeft, MoreHorizontal, FileText, Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchApi } from '../lib/api';
// Custom Tab Types
type ViewType = 'dashboard' | 'ai' | 'calendar' | 'profile' | 'edit_profile' | 'add_crop' | 'add_task' | 'crop_progress';

export default function FosholApp() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDarkModeLoaded, setIsDarkModeLoaded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const [crops, setCrops] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const fetchedCrops = await fetchApi('/crops', { requireAuth: true });
      setCrops(fetchedCrops);
      
      let allTasks: any[] = [];
      fetchedCrops.forEach((c: any) => {
        if (c.tasks) {
          const cropTasks = c.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            time: t.date,
            tag: c.name,
            done: t.is_completed,
            type: t.type
          }));
          allTasks = [...allTasks, ...cropTasks];
        }
      });
      allTasks.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      fetchDashboardData();
    }
  }, [router]);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Weather Alert', desc: 'Heavy rain expected tomorrow.', time: '10m ago', read: false },
    { id: 2, title: 'Task Reminder', desc: 'Apply fertilizer in Field A.', time: '1h ago', read: false }
  ]);

  const [profileAlert, setProfileAlert] = useState('');

  useEffect(() => {
    // Load initial theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    setIsDarkModeLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDarkModeLoaded) return;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, isDarkModeLoaded]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    try {
      await fetchApi('/logout', { method: 'POST', requireAuth: true });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className={`flex justify-center min-h-screen bg-stone-50 dark:bg-stone-950 items-center font-sans transition-colors duration-300`}>
      <div className="w-full bg-stone-50 dark:bg-stone-900 overflow-hidden flex flex-col min-h-screen relative transition-colors duration-300">

        {/* App Header */}
        <header className="px-5 py-4 bg-emerald-700 dark:bg-emerald-900 text-white flex justify-between items-center z-50 fixed top-0 left-0 right-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">Foshol</h1>
              <p className="text-[10px] text-emerald-200 font-semibold mt-1 tracking-wider uppercase">Smart Agriculture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-emerald-600 dark:bg-emerald-800 hover:bg-emerald-500 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-emerald-600 dark:bg-emerald-800 hover:bg-emerald-500 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-2 border-emerald-600 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex justify-between items-center">
                      <h3 className="font-bold text-stone-900 dark:text-stone-100">Notifications</h3>
                      <button onClick={markAllNotificationsRead} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b border-stone-50 dark:border-stone-700/50 flex gap-3 ${notif.read ? 'opacity-60' : 'bg-emerald-50/50 dark:bg-emerald-900/20'}`}>
                          <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{notif.title}</h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{notif.desc}</p>
                            <span className="text-[10px] text-stone-400 mt-1 block">{notif.time}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 text-center text-sm text-stone-500">No notifications</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Profile Alert */}
        <AnimatePresence>
          {profileAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-4 right-4 z-40 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold">{profileAlert}</span>
              </div>
              <button onClick={() => setProfileAlert('')}><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-stone-50 dark:bg-stone-900 pt-[76px] pb-28">
          <AnimatePresence mode="wait" initial={false}>
            {activeView === 'dashboard' && <DashboardView key="dashboard" crops={crops} tasks={tasks} toggleTask={toggleTask} onViewCropProgress={() => setActiveView('crop_progress')} />}
            {activeView === 'ai' && <AIToolsView key="ai" />}
            {activeView === 'calendar' && <CalendarView key="calendar" tasks={tasks} toggleTask={toggleTask} />}
            {activeView === 'profile' && <ProfileView key="profile" onEdit={() => setActiveView('edit_profile')} onSignOut={handleSignOut} />}
            {activeView === 'edit_profile' && <EditProfileView key="edit_profile" onBack={() => setActiveView('profile')} onSave={() => { setProfileAlert('Profile updated successfully'); setActiveView('profile'); setTimeout(() => setProfileAlert(''), 3000); }} />}
            {activeView === 'add_crop' && <AddCropView key="add_crop" onBack={() => setActiveView('dashboard')} onSave={() => { fetchDashboardData(); setActiveView('dashboard'); }} />}
            {activeView === 'add_task' && <AddTaskView key="add_task" onBack={() => setActiveView('dashboard')} onSave={() => setActiveView('dashboard')} />}
            {activeView === 'crop_progress' && <CropProgressView key="crop_progress" crops={crops} onBack={() => setActiveView('dashboard')} />}
          </AnimatePresence>
        </main>

        {/* FAB Menu */}
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
          <AnimatePresence>
            {showFabMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                className="flex flex-col gap-3 mb-2"
              >
                <FabMenuItem icon={<Sprout className="w-5 h-5" />} label="Add Crop" onClick={() => { setActiveView('add_crop'); setShowFabMenu(false); }} />
                <FabMenuItem icon={<FileText className="w-5 h-5" />} label="Add Task" onClick={() => { setActiveView('add_task'); setShowFabMenu(false); }} />
                <FabMenuItem icon={<Calendar className="w-5 h-5" />} label="Schedule" onClick={() => { setActiveView('calendar'); setShowFabMenu(false); }} />
                <FabMenuItem icon={<MoreHorizontal className="w-5 h-5" />} label="Others" onClick={() => { setShowFabMenu(false); }} />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 transition-transform duration-300 ${showFabMenu ? 'bg-red-500 rotate-45' : 'bg-emerald-600'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        {(activeView === 'dashboard' || activeView === 'ai' || activeView === 'calendar' || activeView === 'profile') && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex justify-around items-end pb-6 pt-3 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-50 rounded-t-3xl transition-colors duration-300">
            <NavItem icon={Home} label="Home" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <NavItem icon={ScanLine} label="AI Tools" isActive={activeView === 'ai'} onClick={() => setActiveView('ai')} />
            <NavItem icon={Calendar} label="Tasks" isActive={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
            <NavItem icon={User} label="Profile" isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} />
          </nav>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Views
// ==========================================

function DashboardView({ crops, tasks, toggleTask, onViewCropProgress }: { crops: any[], tasks: any[], toggleTask: (id: number) => void, onViewCropProgress: () => void }) {
  const [weatherData, setWeatherData] = useState<{ temp: number | null, condition: string, location: string, rainChance3Hr: number | null, rainChanceToday: number | null, loading: boolean, error: string }>({
    temp: null,
    condition: '',
    location: '',
    rainChance3Hr: null,
    rainChanceToday: null,
    loading: true,
    error: ''
  });
  const [showTodayRain, setShowTodayRain] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      // Keep loading as true when geolocation starts
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
          
          if (!apiKey) {
            setWeatherData(prev => ({ ...prev, loading: false, error: 'API Key missing' }));
            return;
          }

          try {
            // Fetch reverse geocoding for a more accurate location name (e.g. Zilla/Upazilla)
            const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
            let locationName = '';
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData && geoData.length > 0) {
                locationName = geoData[0].name;
              }
            }

            // Fetch current weather and the next 24-hour forecast (8 blocks of 3 hours)
            const [weatherRes, forecastRes] = await Promise.all([
              fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
              fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`)
            ]);

            if (!weatherRes.ok) throw new Error('Weather fetch failed');
            const data = await weatherRes.json();
            
            let rainChance3Hr = 0;
            let rainChanceToday = 0;
            if (forecastRes.ok) {
              const forecastData = await forecastRes.json();
              if (forecastData.list && forecastData.list.length > 0) {
                // Next 3 hours
                rainChance3Hr = Math.round(forecastData.list[0].pop * 100);
                // Max chance today (next 24 hrs)
                rainChanceToday = Math.round(Math.max(...forecastData.list.map((item: any) => item.pop)) * 100);
              }
            }

            // Format condition to be more readable
            const condition = data.weather[0].description
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Fallback to data.name if reverse geocoding didn't yield a name
            if (!locationName) locationName = data.name;

            setWeatherData({
              temp: Math.round(data.main.temp),
              condition: condition,
              location: `${locationName}, BD`,
              rainChance3Hr: rainChance3Hr,
              rainChanceToday: rainChanceToday,
              loading: false,
              error: ''
            });
          } catch (err) {
            setWeatherData(prev => ({ ...prev, loading: false, error: 'Failed to fetch weather' }));
          }
        },
        (error) => {
          setWeatherData(prev => ({ ...prev, loading: false, error: 'Location permission denied' }));
        }
      );
    } else {
      setWeatherData(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="p-5 md:p-6 flex flex-col gap-6"
    >
      {/* Weather Widget */}
      <section className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden min-h-[160px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
        
        {weatherData.loading ? (
          <div className="relative z-10 animate-pulse flex flex-col justify-between h-full space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="h-4 w-28 bg-cyan-100/30 rounded-md"></div>
                <div className="h-10 w-24 bg-white/30 rounded-lg"></div>
                <div className="h-4 w-32 bg-cyan-100/30 rounded-md"></div>
              </div>
              <div className="h-12 w-12 bg-yellow-300/30 rounded-full"></div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 flex justify-between items-center border border-white/10">
               <div className="h-4 w-32 bg-cyan-100/30 rounded-md"></div>
               <div className="h-5 w-16 bg-black/10 rounded-lg"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-1.5 text-cyan-100 text-sm font-medium mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {weatherData.location}
                </div>
                <h2 className="text-4xl font-bold mb-1 tracking-tight">
                  {weatherData.temp !== null ? `${weatherData.temp}°C` : '--°C'}
                </h2>
                <p className="text-cyan-100 font-medium text-sm">
                  {weatherData.error ? weatherData.error : weatherData.condition}
                </p>
              </div>
              <Sun className="w-12 h-12 text-yellow-300 drop-shadow-md" />
            </div>
            <div className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center border border-white/10 relative z-10">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CloudRain className="w-4 h-4 text-cyan-100" />
                <span>
                  {showTodayRain 
                    ? (weatherData.rainChanceToday !== null ? weatherData.rainChanceToday : '--') 
                    : (weatherData.rainChance3Hr !== null ? weatherData.rainChance3Hr : '--')}% Rain Chance
                </span>
              </div>
              <button 
                onClick={() => setShowTodayRain(!showTodayRain)}
                className="text-xs bg-black/20 hover:bg-black/30 transition-colors px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider cursor-pointer active:scale-95"
              >
                {showTodayRain ? 'Today' : 'Next 3 Hrs'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Crop Progress */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Crop Progress</h3>
          <button onClick={onViewCropProgress} className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 transition-colors">View All</button>
        </div>
        
        {!crops || crops.length === 0 ? (
            <div className="bg-stone-50 dark:bg-stone-800 rounded-[2rem] p-5 text-center text-stone-500 text-sm">
                No crops added yet.
            </div>
        ) : (
            <div className="flex flex-col gap-4">
              {crops.slice(0, 1).map((crop: any) => {
                  const startDate = new Date(crop.start_date);
                  const today = new Date();
                  const diffTime = today.getTime() - startDate.getTime();
                  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                  
                  const totalDays = crop.phases?.reduce((acc: number, p: any) => acc + p.days_count, 0) || 120;
                  const progressPct = Math.min(100, Math.round((diffDays / totalDays) * 100));
                  
                  return (
                    <div key={crop.id} className={`bg-gradient-to-br ${crop.color_shade || 'from-emerald-600 to-emerald-800'} rounded-[2rem] p-5 shadow-sm border border-stone-100 dark:border-stone-700 transition-colors text-white`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                            <span className="text-2xl">{crop.emoji || '🌾'}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{crop.type}</h4>
                            <p className="text-sm text-white/80 font-medium mt-0.5">{crop.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <span className="block text-xs font-bold text-white/60 uppercase tracking-wider">Timeline</span>
                            <span className="block text-sm font-bold text-white mt-1">Day {diffDays} <span className="text-white/60 text-xs font-medium">of {totalDays}</span></span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden mt-4">
                          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
        )}
      </section>

      {/* Upcoming Tasks */}
      <section>
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Today&apos;s Tasks</h3>
        </div>
        <div className="flex flex-col gap-3">
          {tasks.slice(0, 2).map(task => (
            <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function AIToolsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="p-5 md:p-6"
    >
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">AI Solutions</h2>

      <div className="grid grid-cols-2 gap-4">
        <ToolCard title="Disease Detection" desc="Scan leaves for diseases" icon={<ScanLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" />
        <ToolCard title="Price Prediction" desc="Market price forecasting" icon={<TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />} color="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" />
        <ToolCard title="Fertilizer AI" desc="Smart soil recommendations" icon={<Droplets className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />} color="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800" />
        <ToolCard title="Agri Chatbot" desc="Ask anything about farming" icon={<MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />} color="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800" />
      </div>

      <div className="mt-6 bg-stone-900 dark:bg-stone-950 rounded-[2rem] p-6 relative overflow-hidden text-white shadow-xl">
        <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <ImageIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-xl">Quick Scan</h3>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed">Instantly diagnose plant diseases using your camera and our AI model. Get immediate treatment suggestions.</p>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-5 rounded-xl text-sm w-full shadow-lg shadow-emerald-500/30 transition-colors mt-2 flex items-center justify-center gap-2">
            <ScanLine className="w-4 h-4" /> Open Camera
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CalendarView({ tasks, toggleTask }: { tasks: any[], toggleTask: (id: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="p-5 md:p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Schedule</h2>
      </div>

      {/* Horizontal Calendar */}
      <div className="flex justify-between mb-8">
        {[
          { day: 'Mon', date: '12' },
          { day: 'Tue', date: '13' },
          { day: 'Wed', date: '14', active: true },
          { day: 'Thu', date: '15' },
          { day: 'Fri', date: '16' },
        ].map((d, i) => (
          <div key={i} className={`flex flex-col items-center p-3 rounded-2xl w-[18%] ${d.active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-700'}`}>
            <span className="text-xs font-bold uppercase mb-1">{d.day}</span>
            <span className={`text-lg font-bold ${d.active ? 'text-white' : 'text-stone-900 dark:text-stone-100'}`}>{d.date}</span>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3 px-1">Upcoming Harvest</h3>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-14 h-14 bg-white dark:bg-stone-800 rounded-2xl shadow-sm flex flex-col items-center justify-center border border-amber-100 dark:border-stone-700">
              <span className="text-[10px] font-bold text-amber-500 uppercase">Oct</span>
              <span className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-none mt-0.5">25</span>
            </div>
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-lg">Aman Rice Harvest</h4>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium mt-0.5">Field A • Est. 2 tons</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3 px-1">Today&apos;s Tasks</h3>
          <div className="flex flex-col gap-3">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileView({ onEdit, onSignOut }: { onEdit: () => void, onSignOut: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="p-5 md:p-6"
    >
      <div className="flex flex-col items-center text-center mb-8 pt-4 relative">
        <button onClick={onEdit} className="absolute top-0 right-0 p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm text-stone-500 hover:text-emerald-600 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-28 h-28 bg-stone-200 dark:bg-stone-700 rounded-full border-4 border-white dark:border-stone-800 shadow-lg mb-4 overflow-hidden relative">
          <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <User className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Karim Mia</h2>
        <p className="text-stone-500 dark:text-stone-400 font-medium text-sm flex items-center justify-center gap-1.5 mt-2 bg-stone-100 dark:bg-stone-800 py-1.5 px-4 rounded-full">
          <MapPin className="w-3.5 h-3.5" />
          Natore, Rajshahi
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-stone-800 p-5 rounded-[2rem] border border-stone-100 dark:border-stone-700 text-center shadow-sm">
          <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">4.5</div>
          <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-1">Acres Total</div>
        </div>
        <div className="bg-white dark:bg-stone-800 p-5 rounded-[2rem] border border-stone-100 dark:border-stone-700 text-center shadow-sm">
          <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">3</div>
          <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-1">Active Crops</div>
        </div>
      </div>

      <div className="space-y-3 bg-white dark:bg-stone-800 p-2 rounded-[2rem] border border-stone-100 dark:border-stone-700 shadow-sm">
        <ProfileListItem icon={<User className="w-5 h-5 text-stone-600 dark:text-stone-400" />} label="Personal Details" onClick={onEdit} />
        <ProfileListItem icon={<Bell className="w-5 h-5 text-stone-600 dark:text-stone-400" />} label="Notification Preferences" />
        <ProfileListItem icon={<MessageSquare className="w-5 h-5 text-stone-600 dark:text-stone-400" />} label="Help & Support" />
        <ProfileListItem icon={<LogOut className="w-5 h-5 text-red-500" />} label="Sign Out" isDestructive onClick={onSignOut} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------
// Sub Views (Edit Profile, Add Crop, Add Task)
// ---------------------------------------------------------

function EditProfileView({ onBack, onSave }: { onBack: () => void, onSave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full bg-white dark:bg-stone-900 flex flex-col absolute inset-0 z-30">
      <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Edit Profile</h2>
        <div className="w-10"></div>
      </header>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-stone-800 shadow-sm">
              <User className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white dark:border-stone-800">
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Full Name</label>
            <input type="text" defaultValue="Karim Mia" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Location</label>
            <input type="text" defaultValue="Natore, Rajshahi" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Phone Number</label>
            <input type="tel" defaultValue="+880 1711 223344" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
        </div>
      </div>
      <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
        <button onClick={onSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-colors">
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}

function AddCropView({ onBack, onSave }: { onBack: () => void, onSave: () => void }) {
  const [cropType, setCropType] = useState('Rice');
  const [fieldName, setFieldName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [generationTimeMs, setGenerationTimeMs] = useState(0);
  const loadingTexts = ["AI Analyzing...", "Analyzing your crops...", "Generating Task...", "Generating Schedule..."];
  const [loadingText, setLoadingText] = useState(loadingTexts[0]);

  const handleGenerate = async () => {
    if (!cropType || !startDate) return alert('Please enter crop type and start date.');
    setIsGenerating(true);
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)]);
    }, 800);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cropType, startDate })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      data.phases = data.phases.map((p: any) => ({ ...p, checked: true }));
      setReviewData(data);
      setGenerationTimeMs(Date.now() - startTime);
    } catch (err: any) {
      alert('Generation failed: ' + err.message);
    }
    clearInterval(interval);
    setIsGenerating(false);
  };

  const togglePhase = (index: number) => {
    if (!reviewData) return;
    const newPhases = [...reviewData.phases];
    const toggledPhase = newPhases[index];
    toggledPhase.checked = !toggledPhase.checked;
    
    if (!toggledPhase.checked) {
       const half = Math.floor(toggledPhase.days_count / 2);
       const remainder = toggledPhase.days_count - half;
       
       let prevIdx = index - 1;
       while (prevIdx >= 0 && !newPhases[prevIdx].checked) prevIdx--;
       let nextIdx = index + 1;
       while (nextIdx < newPhases.length && !newPhases[nextIdx].checked) nextIdx++;
       
       if (prevIdx >= 0) newPhases[prevIdx].days_count += half;
       if (nextIdx < newPhases.length) newPhases[nextIdx].days_count += remainder;
    }
    setReviewData({ ...reviewData, phases: newPhases });
  };

  const getEmojiForCrop = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('rice') || t.includes('wheat')) return '🌾';
    if (t.includes('corn')) return '🌽';
    if (t.includes('tomato')) return '🍅';
    if (t.includes('potato')) return '🥔';
    if (t.includes('carrot')) return '🥕';
    if (t.includes('onion')) return '🧅';
    return '🌱';
  };

  const handleConfirmSave = async () => {
     if (!reviewData) return;
     
     let currentDate = new Date(startDate);
     const finalPhases = [];
     const phaseMap: any = {};
     
     for (const p of reviewData.phases) {
         if (p.checked) {
             const phaseStart = new Date(currentDate);
             currentDate.setDate(currentDate.getDate() + p.days_count);
             const phaseEnd = new Date(currentDate);
             
             finalPhases.push({
                 name: p.name,
                 days_count: p.days_count,
                 start_date: phaseStart.toISOString().split('T')[0],
                 end_date: phaseEnd.toISOString().split('T')[0],
                 is_active: true
             });
             phaseMap[p.name] = phaseStart;
         }
     }
     
     const finalTasks = reviewData.tasks.filter((t: any) => reviewData.phases.find((p: any) => p.name === t.phase_name && p.checked)).map((t: any) => {
         const taskDate = new Date(phaseMap[t.phase_name]);
         taskDate.setDate(taskDate.getDate() + t.day_offset);
         return {
             ...t,
             date: taskDate.toISOString().split('T')[0]
         };
     });
     
     try {
         await fetchApi('/crops', {
             method: 'POST',
             requireAuth: true,
             body: JSON.stringify({
                 name: fieldName || cropType,
                 type: cropType,
                 start_date: startDate,
                 color_shade: reviewData.colorShade,
                 emoji: getEmojiForCrop(cropType),
                 phases: finalPhases,
                 tasks: finalTasks
             })
         });
         onSave(); // Close view and potentially trigger a refresh
     } catch(err: any) {
         alert('Failed to save: ' + err.message);
     }
  };

  const daysSinceStart = startDate ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="h-full bg-white dark:bg-stone-900 flex flex-col absolute inset-0 z-30">
      <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Add New Crop</h2>
        <div className="w-10"></div>
      </header>
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-stone-800 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
               <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
               <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{loadingText}</h3>
               <p className="text-stone-500 dark:text-stone-400 text-sm">Please wait while our AI models analyze the best schedule for your crop.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!reviewData ? (
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Crop Type</label>
            <select value={cropType} onChange={e => setCropType(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
              <option>Rice</option>
              <option>Wheat</option>
              <option>Corn</option>
              <option>Tomato</option>
              <option>Potato</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Field Name (Optional)</label>
            <input type="text" value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="e.g. North Field" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Starting Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
        </div>
      ) : (
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {daysSinceStart >= 1 
                  ? `Seems, you have farming the crop since ${daysSinceStart} days. Unselect if any of the steps you dont want to...`
                  : `AI has generated the ideal schedule based on your start date. Unselect any steps you dont want to...`
                }
              </p>
              {generationTimeMs > 0 && (
                <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                  {(generationTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {reviewData.phases.map((phase: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${phase.checked ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700' : 'bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800 opacity-60'}`}>
                <input type="checkbox" checked={phase.checked} onChange={() => togglePhase(idx)} className="mt-1 w-5 h-5 accent-emerald-600 rounded" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">{phase.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{phase.description}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">{phase.days_count} Days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
        {!reviewData ? (
          <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
            {isGenerating ? 'Analyzing with AI...' : 'Analyze & Generate Schedule'}
          </button>
        ) : (
          <button onClick={handleConfirmSave} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
            Confirm & Save Crop
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AddTaskView({ onBack, onSave }: { onBack: () => void, onSave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="h-full bg-white dark:bg-stone-900 flex flex-col absolute inset-0 z-30">
      <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-stone-600 dark:text-stone-300">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Add Task</h2>
        <div className="w-10"></div>
      </header>
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div>
          <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Task Title</label>
          <input type="text" placeholder="e.g. Apply Fertilizer" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Select Field/Crop</label>
          <select className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none">
            <option>Field A (Aman Rice)</option>
            <option>Field B (Boro Rice)</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Date</label>
            <input type="date" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 ml-1">Time</label>
            <input type="time" className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-3.5 text-stone-900 dark:text-stone-100 font-medium focus:outline-none" />
          </div>
        </div>
      </div>
      <div className="p-5 border-t border-stone-100 dark:border-stone-800">
        <button onClick={onSave} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-600/20">
          Create Task
        </button>
      </div>
    </motion.div>
  );
}


// ==========================================
// Reusable Components
// ==========================================

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all relative ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
    >
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl -z-10"
        />
      )}
      <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-emerald-100 dark:fill-emerald-900/50 stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-[1.5]'}`} />
      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`}>{label}</span>
    </button>
  );
}

function TaskCard({ task, onToggle }: { task: any, onToggle: () => void }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'scan': return <ScanLine className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
      default: return <Leaf className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'water': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'scan': return 'bg-purple-50 dark:bg-purple-900/20';
      default: return 'bg-emerald-50 dark:bg-emerald-900/20';
    }
  };

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all cursor-pointer ${task.done ? 'bg-stone-50 dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 opacity-60' : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md'}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBg(task.type)}`}>
        {getIcon(task.type)}
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-[15px] ${task.done ? 'text-stone-500 dark:text-stone-400 line-through' : 'text-stone-900 dark:text-stone-100'}`}>{task.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{task.time}</span>
          <span className="w-1 h-1 bg-stone-300 dark:bg-stone-600 rounded-full"></span>
          <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md uppercase tracking-wider">{task.tag}</span>
        </div>
      </div>
      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-200 dark:border-stone-600'}`}>
        {task.done && <Check className="w-4 h-4" strokeWidth={3} />}
      </div>
    </div>
  );
}

function ToolCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`p-5 rounded-[1.5rem] border ${color} shadow-sm flex flex-col hover:-translate-y-1 transition-transform cursor-pointer`}>
      <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-stone-100 dark:border-stone-700/50">
        {icon}
      </div>
      <h3 className="font-bold text-stone-900 dark:text-stone-100 leading-tight mb-1">{title}</h3>
      <p className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function ProfileListItem({ icon, label, isDestructive = false, onClick }: { icon: React.ReactNode, label: string, isDestructive?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-stone-100 dark:bg-stone-700'}`}>
          {icon}
        </div>
        <span className={`font-bold text-sm ${isDestructive ? 'text-red-500 dark:text-red-400' : 'text-stone-900 dark:text-stone-100'}`}>{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-stone-300 dark:text-stone-600" />
    </button>
  );
}

function FabMenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 justify-end group">
      <span className="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm border border-stone-100 dark:border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
      <div className="w-12 h-12 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-full flex items-center justify-center shadow-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-700 transition-colors">
        {icon}
      </div>
    </button>
  );
}

function CropProgressView({ crops, onBack }: { crops: any[], onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full bg-stone-50 dark:bg-stone-950 flex flex-col absolute inset-0 z-30">
      <header className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Crop Progress</h2>
        <div className="w-10"></div>
      </header>

      <div className="p-5 md:p-8 flex-1 overflow-y-auto space-y-8 pb-32">
        {crops.map((crop, index) => {
          const startDate = new Date(crop.start_date);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          
          const totalDays = crop.phases?.reduce((acc: number, p: any) => acc + p.days_count, 0) || 120;
          const progressPct = Math.min(100, Math.round((diffDays / totalDays) * 100));
          
          let currentPhaseName = 'Sown';
          let nextPhaseName = 'Harvest';
          if (crop.phases && crop.phases.length > 0) {
              let accDays = 0;
              for (let i = 0; i < crop.phases.length; i++) {
                  accDays += crop.phases[i].days_count;
                  if (diffDays <= accDays) {
                      currentPhaseName = crop.phases[i].name;
                      nextPhaseName = i + 1 < crop.phases.length ? crop.phases[i + 1].name : 'Harvest';
                      break;
                  }
              }
          }
          
          return (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${crop.color_shade || 'from-emerald-600 to-emerald-800'} rounded-[2.5rem] p-6 shadow-lg border border-white/10 relative overflow-hidden group max-w-4xl mx-auto w-full text-white`}
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-colors duration-500"></div>

              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-white/20 bg-white/20 backdrop-blur-sm`}>
                      🌾
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{crop.type}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm font-medium text-white/80">
                        <MapPin className="w-4 h-4" /> {crop.name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-white/60 mb-1">Current Stage</p>
                      <p className={`font-bold text-white`}>{currentPhaseName}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-white/60 mb-1">Est. Harvest</p>
                      <p className="font-bold text-white">{totalDays - diffDays > 0 ? `${totalDays - diffDays} days left` : 'Ready'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider font-bold text-white/60">Timeline</span>
                      <span className="block text-lg font-bold mt-1">
                        Day {diffDays} <span className="text-white/60 text-sm font-medium">/ {totalDays}</span>
                      </span>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                      Active
                    </div>
                  </div>

                  <div className="relative h-4 w-full bg-black/30 rounded-full overflow-hidden mb-3 border border-white/10 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                      className={`absolute top-0 left-0 h-full rounded-full bg-white`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-bold text-white/60 uppercase tracking-wider">
                    <span>Sown</span>
                    <span>{nextPhaseName}</span>
                    <span>Harvest</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
