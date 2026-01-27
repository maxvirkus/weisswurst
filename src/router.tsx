/**
 * React Router Configuration
 * 
 * Routes:
 * - /          : Landing page (offline mode or create session)
 * - /s/:id     : Participant view (shared session)
 * - /a/:id     : Admin view (with ?key= query param)
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { LandingPage } from './pages/LandingPage';
import { SessionPage } from './pages/SessionPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/offline',
    element: <App />,
  },
  {
    path: '/s/:sessionId',
    element: <SessionPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/a/:sessionId',
    element: <AdminPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
