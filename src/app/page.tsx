'use client';

import React, { useState, useEffect } from 'react';
import {
  getSavedSetupItems,
  saveSetupItems,
  getSavedExpenses,
  saveExpenses,
  getSavedServices,
  saveServices,
  getSavedVehicles,
  saveVehicles,
  getSavedStaff,
  saveStaff,
  getSavedSettings,
  saveSettings,
  getSavedSession,
  clearSession,
  pullServerDatabase,
  getSavedTheme,
  saveTheme,
  applyTheme,
  ThemeMode,
  getSavedInventory,
  saveInventory,
  getSavedParkingRecords,
  saveParkingRecords,
  KEYS,
} from '@/lib/storage';
import { SetupItem, Expense, ServiceItem, Vehicle, StaffMember, AppSettings, AuthUser, InventoryItem, ParkingRecord } from '@/types';
import { Sidebar, TabKey, AnalyticsSectionKey, VehicleSectionKey } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { MobileAppDock } from '@/components/layout/MobileAppDock';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { AnalyticsDashboard } from '@/components/modules/AnalyticsDashboard';
import { CashierCommand } from '@/components/modules/CashierCommand';
import { GarageModule } from '@/components/modules/GarageModule';
import { VehiclesModule } from '@/components/modules/VehiclesModule';
import { StaffModule } from '@/components/modules/StaffModule';
import { SetupModule } from '@/components/modules/SetupModule';
import { ExpensesModule } from '@/components/modules/ExpensesModule';
import { InventoryModule } from '@/components/modules/InventoryModule';
import { SystemDocsModule } from '@/components/modules/SystemDocsModule';
import { SettingsModule } from '@/components/modules/SettingsModule';
import { CheckCircle2, LayoutDashboard, Monitor, Car, Users, DollarSign, Settings, Tv, Layers, Wrench, Menu } from 'lucide-react';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('cashier');
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSectionKey>('overview');
  const [vehicleSection, setVehicleSection] = useState<VehicleSectionKey>('registry');
  const [selectedCashierBay, setSelectedCashierBay] = useState<number | undefined>(undefined);

  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSavedSettings());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleTheme = (forcedTheme?: any) => {
    // Strictly validate forcedTheme so SyntheticEvents from onClick do not corrupt themeMode
    const explicitTheme: ThemeMode | undefined =
      forcedTheme === 'dark' || forcedTheme === 'light' ? forcedTheme : undefined;
    const nextTheme: ThemeMode = explicitTheme || (themeMode === 'dark' ? 'light' : 'dark');
    setThemeMode(nextTheme);
    saveTheme(nextTheme);
    applyTheme(nextTheme);
    const updatedSettings = { ...settings, themeMode: nextTheme };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    showNotification(
      nextTheme === 'dark'
        ? '🌙 دۆخی تاریک (Dark Mode) بە سەرکەوتوویی چالاک کرا.'
        : '☀️ دۆخی ڕووناک (Light Mode) بە سەرکەوتوویی چالاک کرا.'
    );
  };

  const reloadAllData = () => {
    setSetupItems(getSavedSetupItems());
    setExpenses(getSavedExpenses());
    setServices(getSavedServices());
    setVehicles(getSavedVehicles());
    setStaff(getSavedStaff());
    setInventory(getSavedInventory());
    setParkingRecords(getSavedParkingRecords());
    setSettings(getSavedSettings());
  };

  useEffect(() => {
    const savedTheme = getSavedTheme();
    setThemeMode(savedTheme);
    applyTheme(savedTheme);

    reloadAllData();

    // Pull from central server database (Cross-device sync)
    pullServerDatabase().then((synced) => {
      if (synced) {
        reloadAllData();
      }
    });

    const session = getSavedSession();
    if (session && session.currentUser) {
      setCurrentUser(session.currentUser);
    }
    setIsLoadingSession(false);

    // Cross-tab real-time sync via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || Object.values(KEYS).includes(e.key)) {
        reloadAllData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Online & Offline notification handlers
    const handleOnline = () => {
      showNotification('📶 ئینتەرنێت پەیدابووەوە: داتاکان بە سەرکەوتوویی لەگەڵ سێرڤەر هاوکات کران (Synced).');
      pullServerDatabase().then((synced) => {
        if (synced) reloadAllData();
      });
    };
    const handleOffline = () => {
      showNotification('⚠️ ئینتەرنێت پچڕا: سیستەم بە تەواوی لەسەر ئامێرەکەت بەردەوامە بە دۆخی ئۆفلاین (Offline Mode).');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enforce role-based access for cashier
  useEffect(() => {
    if (currentUser?.role === 'cashier' && !['cashier', 'vehicles', 'docs'].includes(activeTab)) {
      setActiveTab('cashier');
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    showNotification('بە سەرکەوتوویی لە سیستەم چوویتە دەرەوە.');
  };

  // Update handlers
  const handleUpdateSetupItems = (items: SetupItem[]) => {
    setSetupItems(items);
    saveSetupItems(items);
  };

  const handleUpdateExpenses = (items: Expense[]) => {
    setExpenses(items);
    saveExpenses(items);
  };

  const handleUpdateInventory = (items: InventoryItem[]) => {
    setInventory(items);
    saveInventory(items);
  };

  const handleUpdateVehicles = (items: Vehicle[]) => {
    setVehicles(items);
    saveVehicles(items);
  };

  const handleUpdateStaff = (items: StaffMember[]) => {
    setStaff(items);
    saveStaff(items);
  };

  const handleUpdateServices = (items: ServiceItem[]) => {
    setServices(items);
    saveServices(items);
  };

  const handleUpdateSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const handleUpdateParkingRecords = (records: ParkingRecord[]) => {
    setParkingRecords(records);
    saveParkingRecords(records);
  };

  // Calculations for top header
  let totalRevenue = 0;
  (vehicles || []).forEach((v) => {
    (v.washHistory || []).forEach((w) => {
      totalRevenue += w?.price || 0;
    });
  });

  // Include today's parking revenue
  const todayDateStr = new Date().toISOString().slice(0, 10);
  (parkingRecords || []).forEach((p) => {
    if (p.entryTime.slice(0, 10) === todayDateStr && p.paymentStatus === 'paid') {
      totalRevenue += p.fee || 0;
    }
  });

  const activeCarsInBay = (vehicles || []).filter((v) => v?.currentBay).length;
  const parkedCarsCount = (parkingRecords || []).filter(
    (p) => p.status === 'parked' || p.status === 'washing'
  ).length;
  const freeReadyCount = (vehicles || []).filter(
    (v) => (v?.currentCycleWashes || 0) >= (settings?.washesNeededForFree || 4)
  ).length;
  const expiredVehiclesCount = (vehicles || []).filter((v) => {
    const lastDate = v?.lastVisitDate || v?.registeredDate;
    if (!lastDate) return false;
    const diff = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    return diff > (settings?.expiryDaysLimit || 15);
  }).length;
  const lowInventoryCount = (inventory || []).filter(
    (item) => (item?.quantity || 0) <= (item?.minAlertLevel || 0)
  ).length;

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">سیستەم ئامادە دەکرێت...</span>
        </div>
      </div>
    );
  }

  // Render Full Screen PIN Login if no active session
  if (!currentUser) {
    return (
      <LoginScreen
        settings={settings}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showNotification(`بەخێربێیت ${user.name}`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-[#0B1120] text-slate-900 flex overflow-x-hidden max-w-full w-full font-sans" dir="rtl">
      {/* Modern Responsive Right-Side Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeAnalyticsSection={analyticsSection}
        onAnalyticsSectionChange={setAnalyticsSection}
        activeVehicleSection={vehicleSection}
        onVehicleSectionChange={setVehicleSection}
        carWashName={settings.carWashName}
        activeCarsCount={activeCarsInBay}
        parkedCarsCount={parkedCarsCount}
        setupCount={setupItems.length}
        freeReadyCount={freeReadyCount}
        expiredCount={expiredVehiclesCount}
        lowInventoryCount={lowInventoryCount}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        userRole={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentTheme={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden min-w-0 max-w-full w-full bg-[#F4F6FA] dark:bg-[#0B1120] transition-colors">
        <TopHeader
          totalRevenue={totalRevenue}
          activeCarsInBay={activeCarsInBay}
          staffPin={settings.staffPin}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          carWashName={settings.carWashName}
          vehicles={vehicles}
          currentUser={currentUser}
          onLogout={handleLogout}
          currentTheme={themeMode}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => {
            if (currentUser.role === 'admin') {
              setActiveTab('settings');
            } else {
              showNotification('⚠️ تەنها بەڕێوەبەر دەسەڵاتی دەستکاری ڕێکخستنەکانی هەیە.');
            }
          }}
          onSelectVehicle={(v) => {
            setActiveTab('vehicles');
            showNotification(`سەیارەی ${v.ownerName} (${v.plate.type === 'unified' ? v.plate.number : v.plate.oldNumber}) هەڵبژێردرا.`);
          }}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce border border-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </div>
        )}

        {/* Native Mobile Bottom Navigation App Dock (Mobile & Tablet) */}
        <MobileAppDock
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCarsInBay={activeCarsInBay}
          parkedCarsCount={parkedCarsCount}
          freeReadyCount={freeReadyCount}
          setupCount={setupItems.length}
          lowInventoryCount={lowInventoryCount}
          userRole={currentUser.role}
          carWashName={settings.carWashName}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-2 sm:p-4 w-full max-w-full min-w-0 overflow-x-hidden pb-28 lg:pb-6">
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              setupItems={setupItems}
              expenses={expenses}
              vehicles={vehicles}
              staff={staff}
              services={services}
              settings={settings}
              activeSection={analyticsSection}
              onSectionChange={setAnalyticsSection}
              onReloadData={reloadAllData}
              onNotify={showNotification}
              onNavigateTab={(tab, sub) => {
                setActiveTab(tab);
                if (tab === 'vehicles' && typeof sub === 'string') {
                  setVehicleSection(sub as VehicleSectionKey);
                }
                if (tab === 'cashier' && typeof sub === 'number') {
                  setSelectedCashierBay(sub);
                }
              }}
            />
          )}

          {activeTab === 'cashier' && (
            <CashierCommand
              vehicles={vehicles}
              services={services}
              staff={staff}
              settings={settings}
              initialBay={selectedCashierBay}
              onUpdateVehicles={handleUpdateVehicles}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'garage' && (
            <GarageModule
              parkingRecords={parkingRecords}
              onUpdateParkingRecords={handleUpdateParkingRecords}
              vehicles={vehicles}
              onUpdateVehicles={handleUpdateVehicles}
              services={services}
              staff={staff}
              settings={settings}
              onNotify={showNotification}
              onNavigateToCashier={(bay) => {
                if (typeof bay === 'number') {
                  setSelectedCashierBay(bay);
                }
                setActiveTab('cashier');
              }}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesModule
              vehicles={vehicles}
              settings={settings}
              services={services}
              staff={staff}
              activeSection={vehicleSection}
              onSectionChange={setVehicleSection}
              onUpdateVehicles={handleUpdateVehicles}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'staff' && (
            <StaffModule
              staff={staff}
              vehicles={vehicles}
              settings={settings}
              onUpdateStaff={handleUpdateStaff}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'setup' && (
            <SetupModule
              setupItems={setupItems}
              settings={settings}
              onUpdateSetupItems={handleUpdateSetupItems}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesModule
              expenses={expenses}
              settings={settings}
              onUpdateExpenses={handleUpdateExpenses}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryModule
              inventory={inventory}
              onUpdateInventory={handleUpdateInventory}
              onNotify={showNotification}
            />
          )}

          {activeTab === 'docs' && <SystemDocsModule />}

          {activeTab === 'settings' && (
            <SettingsModule
              settings={settings}
              services={services}
              onUpdateSettings={handleUpdateSettings}
              onUpdateServices={handleUpdateServices}
              onNotify={showNotification}
              onDataImported={reloadAllData}
              currentTheme={themeMode}
              onToggleTheme={handleToggleTheme}
            />
          )}
        </main>
      </div>
    </div>
  );
}
