import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function BreadcrumbNavigation({ items = [], showHome = true }) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-400 mb-4 print:hidden" aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link to={createPageUrl('Dashboard')} className="hover:text-white transition-colors">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-400 hover:text-white">
              <Home className="w-3 h-3" />
            </Button>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-600" />
        </>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-white transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}