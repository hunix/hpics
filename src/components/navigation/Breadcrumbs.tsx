import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { navigationItems } from '@/lib/navigationConfig';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

  // Find matching navigation item
    const currentNavItem = navigationItems.find(item => item.url === location.pathname);
    
    if (currentNavItem) {
      // Add parent category
      breadcrumbs.push({
        label: currentNavItem.category.charAt(0).toUpperCase() + currentNavItem.category.slice(1),
        path: '#',
        isCurrentPage: false,
      });
      
      breadcrumbs.push({
        label: currentNavItem.title,
        path: currentNavItem.url,
        isCurrentPage: true,
      });
    } else {
      // Fallback: build from path parts
      let currentPath = '';
      pathParts.forEach((part, index) => {
        currentPath += `/${part}`;
        const navItem = navigationItems.find(item => item.url === currentPath);
        breadcrumbs.push({
          label: navItem?.title || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
          path: currentPath,
          isCurrentPage: index === pathParts.length - 1,
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0 || location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
    >
      <Link 
        to="/dashboard" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path + index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          {crumb.isCurrentPage || crumb.path === '#' ? (
            <span 
              className={cn(
                "truncate max-w-[150px] sm:max-w-none",
                crumb.isCurrentPage && "text-foreground font-medium"
              )}
            >
              {crumb.label}
            </span>
          ) : (
            <Link 
              to={crumb.path}
              className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
