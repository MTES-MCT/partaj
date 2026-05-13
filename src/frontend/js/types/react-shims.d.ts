/**
 * Shim for third-party libs whose published types pre-date the React 18
 * children-typing tightening (children no longer implicit on FC props).
 *
 * Each augmentation only adds an optional `children` prop to component prop
 * types that are missing it, which is how those components have always been
 * used at runtime.
 */
import 'react';

// react-router-dom v6+ already types children correctly — no shim needed.
