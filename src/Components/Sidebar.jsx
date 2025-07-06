import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    const links = [
        { path: "/add-product", label: "Add Product" },
        { path: "/orders", label: "Current Stock" },
        // { path: "/unsold", label: "Current Stock" },
        // { path: "/sold", label: "Store Issue" },
        { path: "issued-products", label: "Issued Products" },
        { path: "/vehicle-insurance", label: "Vehicle Insurance" },
        { path: "/", label: "Logout" }
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col bg-white text-indigi-700 w-[290px] h-screen fixed top-0 left-0 p-6 z-40">
                <h2 className="text-2xl font-bold mb-6">Inventory Control</h2>
                <nav className="flex flex-col space-y-4">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={` pl-2 py-2 rounded-md hover:text-white hover:bg-indigo-800  ${location.pathname === link.path ? "rounded-md text-white bg-indigo-700 pl-2 py-2" : ""
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden bg-gray-900 text-white flex justify-between items-center px-4 py-3 shadow-md fixed w-full top-0 left-0 z-50">
                <h2 className="text-xl font-bold">Inventory Control</h2>
                <button onClick={() => setOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Sidebar Drawer */}
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
                    <div className="w-64 bg-gray-900 text-white h-full p-6 fixed top-0 left-0 shadow-lg z-50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Menu</h2>
                            <button onClick={() => setOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-4">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`hover:text-blue-400 ${location.pathname === link.path ? "text-blue-400" : ""
                                        }`}
                                    onClick={() => setOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
