'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search,
  Filter,
  MapPin,
  X
} from 'lucide-react';
import { BloodType, UrgencyLevel, RequestStatus } from '@/types';

interface FilterState {
  search: string;
  bloodType: BloodType | 'all';
  urgency: UrgencyLevel | 'all';
  status: RequestStatus | 'all';
  maxDistance: number;
  sortBy: 'newest' | 'closest' | 'urgent';
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeCount?: number;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  activeCount = 0
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const t = useTranslations();

  const bloodTypes: (BloodType | 'all')[] = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels: (UrgencyLevel | 'all')[] = ['all', 'low', 'medium', 'high', 'urgent'];
  const statusOptions: (RequestStatus | 'all')[] = ['all', 'active', 'fulfilled', 'cancelled', 'expired'];

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      bloodType: 'all',
      urgency: 'all',
      status: 'all',
      maxDistance: 50,
      sortBy: 'newest'
    };
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    if (key === 'maxDistance') return value !== 50;
    return value !== 'all';
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('common.search')}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters & Advanced Filter Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Tabs */}
        <Tabs
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
          className="w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              {t('bloodRequests.filters.all')}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              {t('bloodRequests.filters.active')}
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs">
              {t('bloodRequests.filters.emergency')}
            </TabsTrigger>
            <TabsTrigger value="nearby" className="text-xs">
              {t('bloodRequests.filters.nearby')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              {t('common.filter')}
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('common.filter')}</SheetTitle>
              <SheetDescription>
                Filtrer les demandes de sang selon vos critères
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Blood Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('bloodRequests.create.bloodType')}
                </label>
                <Select
                  value={filters.bloodType}
                  onValueChange={(value) => handleFilterChange('bloodType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === 'all' ? t('bloodRequests.filters.all') : type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgency Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('bloodRequests.create.urgency')}
                </label>
                <Select
                  value={filters.urgency}
                  onValueChange={(value) => handleFilterChange('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'all'
                          ? t('bloodRequests.filters.all')
                          : t(`bloodRequests.urgency.${level}`)
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Distance maximale: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Trier par
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récent</SelectItem>
                    <SelectItem value="closest">Plus proche</SelectItem>
                    <SelectItem value="urgent">Plus urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
                disabled={activeFiltersCount === 0}
              >
                <X className="h-4 w-4 mr-2" />
                {t('common.clear')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.bloodType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.bloodType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('bloodType', 'all')}
              />
            </Badge>
          )}
          {filters.urgency !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {t(`bloodRequests.urgency.${filters.urgency}`)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('urgency', 'all')}
              />
            </Badge>
          )}
          {filters.maxDistance !== 50 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.maxDistance} km
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('maxDistance', 50)}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      {activeCount > 0 && (
        <p className="text-sm text-gray-600">
          {activeCount} demande{activeCount > 1 ? 's' : ''} trouvée{activeCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}