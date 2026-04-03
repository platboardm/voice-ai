import { SidebarIconWrapper } from '@/app/components/navigation/sidebar/sidebar-icon-wrapper';
import { SidebarLabel } from '@/app/components/navigation/sidebar/sidebar-label';
import { SidebarSimpleListItem } from '@/app/components/navigation/sidebar/sidebar-simple-list-item';
import { Purchase } from '@carbon/icons-react';
import { useLocation } from 'react-router-dom';

export function Billing() {
  const location = useLocation();
  const { pathname } = location;
  const currentPath = '/billing';
  return (
    <li>
      <SidebarSimpleListItem
        navigate={currentPath}
        active={pathname.includes(currentPath)}
      >
        <SidebarIconWrapper>
          <Purchase size={20} />
        </SidebarIconWrapper>
        <SidebarLabel>Billing</SidebarLabel>
      </SidebarSimpleListItem>
    </li>
  );
}
