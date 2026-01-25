'use client'
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // Lucide React icons

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="bg-white shadow-xs fixed w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-end h-16 items-center">


                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <span>Don't have an account?</span>
                        <Link
                            href="/signup"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Signup
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-800 hover:text-gray-600 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-md">
                    <Link
                        href="/signup"
                        className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition"
                        onClick={() => setIsOpen(false)}
                    >
                        Signup
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
