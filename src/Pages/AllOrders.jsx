import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const ProductTable = () => {
    const [products, setProducts] = useState([]);
    const [issueProduct, setIssueProduct] = useState(null);
    const [issuedTo, setIssuedTo] = useState("");
    const [issueQuantity, setIssueQuantity] = useState("");
    const [showIssuePopup, setShowIssuePopup] = useState(false);

    const tableRef = useRef();

    useEffect(() => {
        fetchProducts();
    }, []);

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
        setShowIssuePopup(true);
    };

    const closeIssuePopup = () => {
        setShowIssuePopup(false);
        setIssueProduct(null);
        setIssuedTo("");
        setIssueQuantity("");
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        if (!issueProduct || !issuedTo || !issueQuantity) {
            alert("Please fill in all fields");
            return;
        }

        const qty = parseInt(issueQuantity);
        if (isNaN(qty) || qty <= 0) {
            alert("Invalid quantity");
            return;
        }

        if (qty > issueProduct.quantity) {
            alert("Issued quantity exceeds available stock");
            return;
        }

        try {
            // Update product quantity
            await axios.put(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                {
                    ...issueProduct,
                    quantity: issueProduct.quantity - qty,
                }
            );

            // Save issued product
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

            fetchProducts();
            closeIssuePopup();
        } catch (error) {
            console.error("Error issuing product:", error);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.autoTable({
            head: [["Name", "Quantity", "Unit"]],
            body: products.map((product) => [
                product.name,
                product.quantity,
                product.unit,
            ]),
        });
        doc.save("products.pdf");
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(products);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, "products.xlsx");
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Product Table</h1>

            <div className="flex space-x-4 mb-4">
                <button
                    onClick={exportPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                    Export PDF
                </button>
                <button
                    onClick={exportExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    Export Excel
                </button>
            </div>

            <div className="overflow-x-auto" ref={tableRef}>
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Quantity</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Unit</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr
                                key={product._id}
                                className="border-t hover:bg-gray-50 transition duration-150"
                            >
                                <td className="py-3 px-4">{product.name}</td>
                                <td className="py-3 px-4">{product.quantity}</td>
                                <td className="py-3 px-4">{product.unit}</td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => openIssuePopup(product)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Issue
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Issue Product Modal */}
            {showIssuePopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Issue Product</h2>
                        <form onSubmit={handleIssueSubmit}>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Issued To</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded"
                                    value={issuedTo}
                                    onChange={(e) => setIssuedTo(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Quantity</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeIssuePopup}
                                    className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                >
                                    Issue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductTable;
