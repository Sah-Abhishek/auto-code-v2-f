import { useState, createContext, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  FileInput,
  BarChart3,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle
} from 'lucide-react';

// Create context for sidebar state
export const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

// Sidebar Provider component
export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = () => {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const operationalItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'work-queue', label: 'Work Queue', icon: ListTodo, path: '/work-queue' },
  ];

  const systemItems = [
    { id: 'document-ingestion', label: 'Document Ingestion', icon: FileInput, path: '/document-ingestion' },
    { id: 'analytics', label: 'Admin & Analytics', icon: BarChart3, path: '/analytics' },
  ];

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive
            ? 'bg-blue-50 text-blue-600 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          } ${isCollapsed ? 'justify-center' : ''}`
        }
        title={isCollapsed ? item.label : ''}
      >
        {({ isActive }) => (
          <>
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            {!isCollapsed && (
              <span className="whitespace-nowrap">{item.label}</span>
            )}
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {item.label}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const SectionLabel = ({ children }) => {
    if (isCollapsed) {
      return (
        <div className="flex justify-center py-2">
          <div className="w-6 h-px bg-slate-200" />
        </div>
      );
    }
    return (
      <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {children}
      </p>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-slate-100 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold text-slate-900 whitespace-nowrap">MedExtractor</span>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all z-10"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-4 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {/* Operational Section */}
        <div>
          <SectionLabel>Operational</SectionLabel>
          <div className="space-y-1">
            {operationalItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* System Section */}
        <div>
          <SectionLabel>System</SectionLabel>
          <div className="space-y-1">
            {systemItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      {/* <div className={`border-t border-slate-100 py-3 ${isCollapsed ? 'px-2' : 'px-3'}`}> */}
      {/*   <NavLink */}
      {/*     to="/settings" */}
      {/*     className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all relative ${isCollapsed ? 'justify-center' : ''}`} */}
      {/*     title={isCollapsed ? 'Settings' : ''} */}
      {/*   > */}
      {/*     <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" /> */}
      {/*     {!isCollapsed && <span>Settings</span>} */}
      {/*     {isCollapsed && ( */}
      {/*       <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"> */}
      {/*         Settings */}
      {/*         <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" /> */}
      {/*       </div> */}
      {/*     )} */}
      {/*   </NavLink> */}
      {/*   <NavLink */}
      {/*     to="/help" */}
      {/*     className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all relative ${isCollapsed ? 'justify-center' : ''}`} */}
      {/*     title={isCollapsed ? 'Help & Support' : ''} */}
      {/*   > */}
      {/*     <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" /> */}
      {/*     {!isCollapsed && <span>Help & Support</span>} */}
      {/*     {isCollapsed && ( */}
      {/*       <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"> */}
      {/*         Help & Support */}
      {/*         <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" /> */}
      {/*       </div> */}
      {/*     )} */}
      {/*   </NavLink> */}
      {/* </div> */}
      {/**/}
      {/* Bottom gradient accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />
    </aside>
  );
};

export default Sidebar;
