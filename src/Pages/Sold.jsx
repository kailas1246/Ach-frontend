import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNotification } from "../Components/NotificationProvider";

const Sold = () => {
  

const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [issueProduct, setIssueProduct] = useState(null);
    const [issuedTo, setIssuedTo] = useState("");
    const [issueQuantity, setIssueQuantity] = useState("");
    const [showIssuePopup, setShowIssuePopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const tableRef = useRef();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        const response = await axios.get(
            `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`
        );
        setProducts(response.data);
    };

    const openIssuePopup = (product) => {
        setIssueProduct(product);
        setIssuedTo("");
        setIssueQuantity("");
        setIsEditMode(false);
        setShowIssuePopup(true);
    };

    const openEditPopup = (product) => {
        setIssueProduct(product);
        setIssuedTo(product.name);
        setIssueQuantity(product.quantity);
        setIsEditMode(true);
        setShowIssuePopup(true);
    };

    const closeIssuePopup = () => {
        setShowIssuePopup(false);
        setIssueProduct(null);
        setIssuedTo("");
        setIssueQuantity("");
        setIsEditMode(false);
    };

    const handleDelete = async (productId) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${productId}`);
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        const qty = parseInt(issueQuantity);
        if (!issuedTo || isNaN(qty) || qty < 0) {
            alert("Please fill all fields correctly.");
            return;
        }

        try {
            if (isEditMode) {
                await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                    {
                        ...issueProduct,
                        name: issuedTo,
                        quantity: qty,
                    }
                );
            } else {
                if (qty > issueProduct.quantity) {
                    alert("Issued quantity exceeds available stock");
                    return;
                }

                await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                    {
                        ...issueProduct,
                        quantity: issueProduct.quantity - qty,
                    }
                );

                await axios.post(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`,
                    {
                        productId: issueProduct._id,
                        name: issueProduct.name,
                        quantity: qty,
                        unit: issueProduct.unit,
                        issuedTo,
                    }
                );
            }

            fetchProducts();
            closeIssuePopup();
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.autoTable({
            head: [["Name", "Quantity", "Unit"]],
            body: filteredProducts.map((product) => [
                product.name,
                product.quantity,
                product.unit,
            ]),
        });
        doc.save("products.pdf");
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredProducts);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, "products.xlsx");
    };





<div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Store</h1>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={exportPDF}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition"
                    >
                        Export PDF
                    </button>
                    <button
                        onClick={exportExcel}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-md transition"
                    >
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="w-full table-auto bg-white">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="text-left px-6 py-3 font-semibold">Product Name</th>
                            <th className="text-left px-6 py-3 font-semibold">Quantity</th>
                            <th className="text-left px-6 py-3 font-semibold">Unit</th>
                            <th className="text-left px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">{product.name}</td>
                                <td className="px-6 py-4">{product.quantity}</td>
                                <td className="px-6 py-4">{product.unit}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button
                                        onClick={() => openIssuePopup(product)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition"
                                    >
                                        Issue
                                    </button>
                                    <button
                                        onClick={() => openEditPopup(product)}
                                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-sm transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-6 text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Popup Modal */}
            {showIssuePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                            {isEditMode ? "Edit Product" : "Issue Product"}
                        </h2>
                        <form onSubmit={handleIssueSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {isEditMode ? "Product Name" : "Issued To"}
                                </label>
                                <input
                                    type="text"
                                    className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={issuedTo}
                                    onChange={(e) => setIssuedTo(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeIssuePopup}
                                    className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isEditMode ? "Update" : "Issue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};




export default Sold;
