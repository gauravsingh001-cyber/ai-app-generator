'use client';
import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import '../i18n';
import { useConfigStore } from "../store/configStore";
import { useAuthStore } from "../store/authStore";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Blocks } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const fetchConfig = useConfigStore((state) => state.fetchConfig);
  const config = useConfigStore((state) => state.config);
  const { token, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchConfig();
  }, [fetchConfig]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <html lang="en">
      <body className={inter.className + " bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900"}>
        {mounted ? (
          <>
            <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm transition-all duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                        <Blocks size={20} />
                      </div>
                      <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-900 to-slate-800 bg-clip-text text-transparent tracking-tight">
                        {config?.appName || "AI Platform"}
                      </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
                      {token && config?.entities.map(entity => (
                        <Link key={entity.name} href={`/${entity.name}`} className="px-4 py-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-md transition-all duration-200 capitalize shadow-sm hover:shadow">
                          {entity.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    {token && (
                      <button onClick={handleLogout} className="group flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-red-100">
                        <LogOut size={18} className="transition-transform group-hover:-translate-x-1" /> Logout
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </main>
          </>
        ) : null}
      </body>
    </html>
  );
}
