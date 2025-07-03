import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const IssuedProductTable = () => {
    const [issuedProducts, setIssuedProducts] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchIssuedProducts();
    }, [startDate, endDate]);

    const fetchIssuedProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`,
                { params: { startDate, endDate } }
            );
            setIssuedProducts(response.data);
        } catch (error) {
            console.error("Error fetching issued products:", error);
        }
    };

    const handleDelete = async (id) => {
        const confirm = window.confirm("Are you sure you want to delete this record?");
        if (!confirm) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products/${id}`
            );
            fetchIssuedProducts();
        } catch (error) {
            console.error("Error deleting issued product:", error);
            alert("Failed to delete issued product.");
        }
    };

    const exportIssuedPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Product Name", "Quantity", "Unit", "Issued To", "Issued At", "Remarks"]],
            body: filteredProducts.map((prod) => [
                prod.name,
                prod.quantity,
                prod.unit,
                prod.issuedTo,
                new Date(prod.issuedAt).toLocaleString(),
                prod.remarks || "-",
            ]),

            startY: 20,
        });
        doc.save("issued-products.pdf");
    };

    const exportIssuedExcel = () => {
        const data = filteredProducts.map((item) => ({
            Name: item.name,
            Quantity: item.quantity,
            Unit: item.unit,
            "Issued To": item.issuedTo,
            "Issued At": new Date(item.issuedAt).toLocaleString(),
            Remarks: item.remarks || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Issued Products");
        XLSX.writeFile(workbook, "issued-products.xlsx");
    };

    const filteredProducts = issuedProducts.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.issuedTo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-indigo-700">Issued Products</h1>
                    <p className="text-sm text-gray-500">Track, filter, search and manage issued inventory.</p>
                </div>

                {/* Filters and Export Controls */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name or issued to..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-3">
                        <button
                            onClick={exportIssuedPDF}
                            className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm shadow"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={exportIssuedExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow"
                        >
                            Export Excel
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setSearchQuery("");
                        }}
                        className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full bg-white">
                        <thead className="bg-indigo-600 text-white">
                            <tr>
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Quantity</th>
                                <th className="text-left py-3 px-4">Unit</th>
                                <th className="text-left py-3 px-4">Issued To</th>
                                <th className="text-left py-3 px-4">Issued At</th>
                                <th className="text-left py-3 px-4">Remarks</th>
                                <th className="text-left py-3 px-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 border-b">
                                        <td className="py-3 px-4">{item.name}</td>
                                        <td className="py-3 px-4">{item.quantity}</td>
                                        <td className="py-3 px-4">{item.unit}</td>
                                        <td className="py-3 px-4">{item.issuedTo}</td>
                                        <td className="py-3 px-4">{new Date(item.issuedAt).toLocaleString()}</td>
                                        <td className="py-3 px-4">{item.remarks || "-"}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>

                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IssuedProductTable;
