// pages/_app.tsx

import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import type { AppProps } from "next/app"
import { useWebPush } from '@/hooks/useWebPush';
import { useSessionContext } from '@supabase/auth-helpers-react';
function MyApp({ Component, pageProps }: AppProps) {
   const { session } = useSessionContext();
  useWebPush(!!session);
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default MyApp
