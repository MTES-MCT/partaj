/**
 * Shim for third-party libs whose published types pre-date the React 18
 * children-typing tightening (children no longer implicit on FC props).
 *
 * Each augmentation only adds an optional `children` prop to component prop
 * types that are missing it, which is how those components have always been
 * used at runtime.
 */
import 'react';

declare module 'react-router' {
  interface MemoryRouterProps {
    children?: import('react').ReactNode;
  }
}

declare module 'react-router-dom' {
  interface BrowserRouterProps {
    children?: import('react').ReactNode;
  }
  interface HashRouterProps {
    children?: import('react').ReactNode;
  }
}
