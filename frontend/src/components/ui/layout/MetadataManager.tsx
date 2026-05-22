import { useLocation } from 'react-router-dom';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { matchRoute } from '@/config/routeMetadata';

export const MetadataManager: React.FC = () => {
  const location = useLocation();
  const meta = matchRoute(location.pathname);
  usePageMetadata(meta.ns, meta.key);
  return null;
};
