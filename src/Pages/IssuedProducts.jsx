import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const IssuedProductTable = () => {
    const [issuedProducts, setIssuedProducts] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchIssuedProducts();
    }, [startDate, endDate]);

    const fetchIssuedProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`,
                {
                    params: {
                        startDate,
                        endDate,
                    },
                }
            );
            setIssuedProducts(response.data);
        } catch (error) {
            console.error("Error fetching issued products:", error);
        }
    };

    const exportIssuedPDF = () => {
        const doc = new jsPDF();

        autoTable(doc, {
            head: [["Product Name", "Quantity", "Unit", "Issued To", "Issued At"]],
            body: issuedProducts.map((prod) => [
                prod.name,
                prod.quantity,
                prod.unit,
                prod.issuedTo,
                new Date(prod.issuedAt).toLocaleString(),
            ]),
            startY: 20,
        });

        doc.save("issued-products.pdf");
    };



    const exportIssuedExcel = () => {
        const data = issuedProducts.map((item) => ({
            Name: item.name,
            Quantity: item.quantity,
            Unit: item.unit,
            "Issued To": item.issuedTo,
            "Issued At": new Date(item.issuedAt).toLocaleString(),
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Issued Products");
        XLSX.writeFile(workbook, "issued-products.xlsx");
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Issued Products</h1>

            {/* Date Filters */}
            <div className="flex items-center space-x-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border px-3 py-2 rounded"
                    />
                </div>
                <button
                    onClick={() => {
                        setStartDate("");
                        setEndDate("");
                    }}
                    className="mt-5 bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded"
                >
                    Clear Filters
                </button>
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={exportIssuedPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                    Export PDF
                </button>
                <button
                    onClick={exportIssuedExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    Export Excel
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Quantity</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Unit</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Issued To</th>
                            <th className="text-left py-3 px-4 font-semibold text-sm">Issued At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issuedProducts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                                    No issued products found for the selected date range.
                                </td>
                            </tr>
                        ) : (
                            issuedProducts.map((item) => (
                                <tr key={item._id} className="border-t hover:bg-gray-50">
                                    <td className="py-3 px-4">{item.name}</td>
                                    <td className="py-3 px-4">{item.quantity}</td>
                                    <td className="py-3 px-4">{item.unit}</td>
                                    <td className="py-3 px-4">{item.issuedTo}</td>
                                    <td className="py-3 px-4">
                                        {new Date(item.issuedAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default IssuedProductTable;
