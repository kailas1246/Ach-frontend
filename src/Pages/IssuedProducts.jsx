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
            head: [["Product Name", "Quantity", "Unit", "Issued To", "issue Date", "Remarks"]],
            body: filteredProducts.map((prod) => [
                prod.name,
                prod.quantity,
                prod.unit,
                prod.issuedTo,
                new Date(prod.issueDate).toLocaleString(),
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
            "issueDate": item.issueDate,
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
                    <h1 className="text-3xl font-bold text-black">Issued Products</h1>
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
                            className="bg-white hover:bg-black hover:text-white border-2 border-black text-black px-4 py-2 rounded-lg text-sm shadow"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={exportIssuedExcel}
                            className="bg-white hover:bg-black hover:text-white border-2 border-black text-black px-4 py-2 rounded-lg text-sm shadow"
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

                {/* Table (styled like AllOrders) */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg max-h-[65vh] overflow-auto">
                    <table className="w-full table-auto text-sm border-collapse">
                        <thead className="bg-black text-white sticky top-0 z-20">
                            <tr>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-12">SI No.</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-1/3">Product Name</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Issued To</th>
                                <th className="py-1 px-2 text-center border-l border-black first:border-l-0 w-16">Quantity</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0 w-20">Unit</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Remarks</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Issued Date</th>
                                <th className="py-1 px-2 text-left border-l border-black first:border-l-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-3 text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((item, idx) => (
                                    <tr key={item._id || idx} className="border-b border-black bg-white hover:bg-gray-200">
                                        <td className="px-2 py-1 border-l border-black first:border-l-0">{idx + 1}</td>
                                        <td className="px-2 py-1 text-black font-normal break-words border-l border-black first:border-l-0 w-1/3" title={item.name} style={{maxWidth: '15ch', whiteSpace: 'normal', overflowWrap: 'break-word'}}>
                                            {item.name}
                                        </td>
                                        <td className="px-2 py-1 border-l border-black">{item.issuedTo}</td>
                                        <td className="px-2 py-1 border-l border-black w-15 text-center">{item.quantity}</td>
                                        <td className="px-2 py-1 border-l border-black w-20">{item.unit}</td>
                                        <td className="px-2 py-1 border-l border-black">{item.remarks || '-'}</td>
                                        <td className="py-1 px-2 whitespace-nowrap border-l border-black">
                                            {item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap border-l border-black">
                                            <div className="inline-flex gap-2 items-center">
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-xs px-2 py-0.5 rounded"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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
