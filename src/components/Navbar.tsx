'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  Home,
  Heart,
  User,
  History,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Languages
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavbarProps {
  locale: string;
}

export default function Navbar({ locale }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const { user, logout } = useAuth();
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/auth/connexion`);
  };

  const switchLanguage = (newLocale: string) => {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
    setShowLanguageMenu(false);
  };

  const navigation = [
    {
      name: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: Home,
      current: pathname === `/${locale}/dashboard`
    },
    {
      name: t('requests'),
      href: `/${locale}/demandes`,
      icon: Heart,
      current: pathname.startsWith(`/${locale}/demandes`)
    },
    {
      name: t('history'),
      href: `/${locale}/historique`,
      icon: History,
      current: pathname === `/${locale}/historique`
    },
    {
      name: t('notifications'),
      href: `/${locale}/notifications`,
      icon: Bell,
      current: pathname === `/${locale}/notifications`
    },
    {
      name: t('profile'),
      href: `/${locale}/profil`,
      icon: User,
      current: pathname === `/${locale}/profil`
    },
    {
      name: t('settings'),
      href: `/${locale}/parametres`,
      icon: Settings,
      current: pathname === `/${locale}/parametres`
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={`/${locale}/dashboard`} className="flex items-center space-x-2">
              <div className="bg-red-500 p-2 rounded-full">
                <Droplets className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
                DonSang MR
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              >
                <Languages className="h-4 w-4 mr-1" />
                {locale === 'fr' ? 'FR' : 'AR'}
              </Button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border">
                  <button
                    onClick={() => switchLanguage('fr')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      locale === 'fr' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => switchLanguage('ar')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      locale === 'ar' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                    }`}
                  >
                    العربية
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user?.name || 'Utilisateur'}</div>
                <div className="text-gray-500">{user?.bloodType}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Mobile user info and logout */}
            <div className="border-t pt-4 mt-4">
              <div className="px-3 py-2">
                <div className="text-base font-medium text-gray-900">{user?.name || 'Utilisateur'}</div>
                <div className="text-sm text-gray-500">{user?.bloodType}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close language menu when clicking outside */}
      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </nav>
  );
}