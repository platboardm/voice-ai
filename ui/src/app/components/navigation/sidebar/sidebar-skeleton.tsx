import { SkeletonIcon, SkeletonText } from '@carbon/react';
import { cn } from '@/utils';
import { useSidebar } from '@/context/sidebar-context';

function SkeletonNavItem() {
  const { open } = useSidebar();
  return (
    <div className="flex items-center h-10 w-full px-1">
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-8">
        <SkeletonIcon className="!w-5 !h-5" />
      </div>
      {open && (
        <SkeletonText className="!mb-0 flex-1" width="70%" />
      )}
    </div>
  );
}

function SkeletonSection({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNavItem key={i} />
      ))}
    </>
  );
}

export function SidebarSkeleton() {
  const { open } = useSidebar();
  return (
    <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
      <ul>
        <SkeletonSection count={3} />
      </ul>
      <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
        {open && (
          <div className="px-4 py-2">
            <SkeletonText className="!mb-0" width="40%" />
          </div>
        )}
        <ul>
          <SkeletonSection count={5} />
        </ul>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
        {open && (
          <div className="px-4 py-2">
            <SkeletonText className="!mb-0" width="50%" />
          </div>
        )}
        <ul>
          <SkeletonSection count={2} />
        </ul>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
        {open && (
          <div className="px-4 py-2">
            <SkeletonText className="!mb-0" width="45%" />
          </div>
        )}
        <ul>
          <SkeletonSection count={2} />
        </ul>
      </div>
    </nav>
  );
}
