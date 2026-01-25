import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Providers from "./Provider";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/CommonComponents/Navbar";


const poppins = Poppins({
  weight: ['400', '300', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Task Management",
  description: "Task Management App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className}`}
      >
        <Providers>
          <AuthProvider>
            <Navbar/>
            {children}
          </AuthProvider>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
