import { ArrowUpRight } from 'lucide-react';
import { APP_STORE_URL } from '../lib/site';
export function StoreLink({label}: {label:string}) {
  return <a className="button store-link" href={APP_STORE_URL} rel="noopener noreferrer" target="_blank"><svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.08-.48-3.23 0-1.44.62-2.2.44-3.06-.35C2.8 15.25 3.5 7.6 9.05 7.32c1.34.07 2.26.75 3.03.8 1.15-.24 2.25-.94 3.48-.85 1.48.12 2.6.71 3.34 1.77-3.06 1.83-2.33 5.85.48 6.98-.56 1.48-1.29 2.95-2.33 4.26ZM12.03 7.25C11.87 4.99 13.71 3.13 15.83 3c.29 2.61-2.36 4.57-3.8 4.25Z"/></svg>{label}<ArrowUpRight size={18} aria-hidden="true" /></a>;
}
