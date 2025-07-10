import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import * as XLSX from "xlsx";

const ProductTable = () => {
    const [products, setProducts] = useState([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
    const [issueProduct, setIssueProduct] = useState(null);
    const [issuedTo, setIssuedTo] = useState("");
    const [issueQuantity, setIssueQuantity] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [issueKg, setIssueKg] = useState("KG")
    const [showIssuePopup, setShowIssuePopup] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [allProviders, setAllProviders] = useState([]);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [remarks, setRemarks] = useState("");

    const fetchUnsoldProducts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`
            );
            setProducts(response.data);

            const uniqueProviders = [...new Set(response.data.map(p => p.name))];
            setAllProviders(uniqueProviders);
        } catch (error) {
            console.error('Error fetching unsold products:', error);
        }
    };



    const handleProviderChange = (provider) => {
        if (provider === 'ALL') {
            if (selectedProviders.length === allProviders.length) {
                setSelectedProviders([]);
            } else {
                setSelectedProviders(allProviders);
            }
        } else {
            setSelectedProviders(prevSelected =>
                prevSelected.includes(provider)
                    ? prevSelected.filter(p => p !== provider)
                    : [...prevSelected, provider]
            );
        }
    };



    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            try {
                await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/import`, jsonData);
                alert("Products imported successfully.");
                fetchUnsoldProducts();
            } catch (err) {
                alert("Failed to import products");
                console.error(err);
            }
        };

        reader.readAsArrayBuffer(file);
    };


    useEffect(() => {
        fetchUnsoldProducts();
    }, []);


    const openIssuePopup = (product) => {
        setIssueProduct(product);
        setIssuedTo("");
        setIssueQuantity("");
        setIssueKg("")
        setRemarks("");
        setIsEditMode(false);
        setShowIssuePopup(true);
    };

    const openEditPopup = (product) => {
        setIssueProduct(product);
        setIssuedTo(product.name);
        setIssueQuantity(product.quantity);
        setIssueKg(product.unit);
        setRemarks(product.remarks || "");
        setIsEditMode(true);
        setShowIssuePopup(true);
    };


    const filteredProducts = products.filter(product => {
        const name = product.name || "";
        const provider = product.provider || "";

        const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(name);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.toLowerCase().includes(searchQuery.toLowerCase());

        // Check if product falls within the date range
        let withinDateRange = true;
        if (startDate) {
            withinDateRange = withinDateRange && new Date(product.date) >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            withinDateRange = withinDateRange && new Date(product.date) <= end;
        }


        return matchesProvider && matchesSearch && withinDateRange;
    });




    const handleDelete = async (productId) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${productId}`);
                fetchUnsoldProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();

        if (!issueProduct || !issuedTo || !issueQuantity || !issueKg) {
            alert("All fields are required.");
            return;
        }

        const payload = {
            name: issuedTo,
            quantity: Number(issueQuantity),
            unit: issueKg,
            remarks: remarks.trim(),
        };

        try {
            if (isEditMode) {
                // Edit mode → update product
                const res = await axios.put(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`,
                    payload
                );
                if (res.status === 200) {
                    alert("Product updated successfully.");
                    fetchUnsoldProducts();
                    setShowIssuePopup(false);
                }
            } else {
                // Issue mode → create issued-product entry
                const issuePayload = {
                    productId: issueProduct._id || "",
                    name: issueProduct.name || "",
                    quantity: Number(issueQuantity),
                    unit: issueProduct.unit || "",
                    issuedTo: issuedTo.trim(),
                    remarks: remarks.trim(),
                    issueDate: issueDate
                };

                const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/issued-products`, issuePayload);
                if (res.status === 201) {
                    alert("Product issued successfully.");
                    fetchUnsoldProducts();
                    setShowIssuePopup(false);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + (error.response?.data?.message || "Action failed"));
        }
    };


const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Products", 14, 16);

    const tableColumn = [
        "SI No.",
        "Name",
        "Quantity",
        "Unit",
        "Provider",
        "Remarks",
        "Status",
        "Date Added"
    ];

    const tableRows = [];

    data.forEach((product, index) => {
        tableRows.push([
            index + 1,
            product.name,
            product.quantity,
            product.unit,
            product.provider,
            product.remarks || '-',
            product.status,
            new Date(product.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });

    doc.save("products.pdf");
};


   const exportToCSV = (data) => {
    const csvData = data.map((product, index) => ({
        "SI No.": index + 1,
        "Name": product.name,
        "Quantity": product.quantity,
        "Unit": product.unit,
        "Provider": product.provider,
        "Remarks": product.remarks || '-',
        "Status": product.status,
        "Date Added": new Date(product.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }));

    const csv = Papa.unparse(csvData);  // PapaParse handles proper escaping
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};




    return (
        <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-6 text-center text-black">Product Inventory</h2>

            {/* Provider Filter Dropdown */}
            <div className="relative inline-block text-left mb-4">
                <button
                    onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                    className="px-4 py-2 bg-white text-black border-2 border-black rounded shadow hover:bg-black hover:text-white"
                >
                    {selectedProviders.length === allProviders.length ? 'All Providers' :
                        selectedProviders.length === 0 ? 'Select Provider(s)' :
                            `${selectedProviders.length} Selected`}
                </button>

                {showProviderDropdown && (
                    <div className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                        <label className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100">
                            <input
                                type="checkbox"
                                className="mr-2"
                                onChange={() => handleProviderChange('ALL')}
                                checked={selectedProviders.length === allProviders.length}
                            />
                            Select All
                        </label>

                        {allProviders.map((provider, index) => (
                            <label
                                key={index}
                                className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                            >
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => handleProviderChange(provider)}
                                    checked={selectedProviders.includes(provider)}
                                />
                                {provider}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border px-2 py-1 rounded-md"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border px-2 py-1 rounded-md"
                    />
                </div>

                <button
                    onClick={() => {
                        setStartDate("");
                        setEndDate("");
                    }}
                    className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-md text-sm"
                >
                    Clear Filter
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                {/* Search Bar */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or provider"
                    className="w-full sm:w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV(filteredProducts)}
                        className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportToPDF(filteredProducts)}
                        className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm"
                    >
                        Export PDF
                    </button>
                    <div className="flex gap-2">
                        <label className="bg-white border-2 hover:border-white hover:bg-black hover:text-white border-black text-black px-4 py-2 rounded-lg text-sm cursor-pointer">
                            Import Excel
                            <input
                                type="file"
                                accept=".xlsx,.xls,.xlsm" // ← Added .xlsm
                                onChange={handleExcelImport}
                                className="hidden"
                            />
                        </label>
                    </div>


                </div>
            </div>


            <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                <table className="min-w-full">
                    <thead className="bg-black text-white">
                        <tr>
                            <th className="py-3 px-4 text-left">SI No.</th>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">Quantity</th>
                            <th className="py-3 px-4 text-left">Unit</th>
                            <th className="py-3 px-4 text-left">Provider</th>
                            <th className="py-3 px-4 text-left">Remarks</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Date Added</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>


                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    No unsold products found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product, index) => (
                                <tr key={index} className="border-b bg-white hover:bg-gray-200">
                                    <td className="px-4">{index + 1}</td>
                                    <td
                                        className="px-4 text-[10px] text-black font-normal"
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        {product.name}
                                    </td>
                                    <td className="px-4">{product.quantity}</td>
                                    <td className="px-4">{product.unit}</td>
                                    <td className="px-4">{product.provider}</td>
                                    <td className="px-4">{product.remarks || '-'}</td>
                                    <td className="px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${product.status.toLowerCase() === 'not sold'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {new Date(product.date).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>

                                    <td className="flex flex-col items-center mt-2 space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                                        <button
                                            onClick={() => openIssuePopup(product)}
                                            className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-sm px-3 py-1 rounded"
                                        >
                                            Issue
                                        </button>
                                        <button
                                            onClick={() => openEditPopup(product)}
                                            className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-sm px-3 py-1 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="bg-white border-2 hover:bg-black hover:text-white border-black text-black text-sm px-3 py-1 rounded"
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

            {/* Issue/Edit Modal */}
            {showIssuePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
                        <h3 className="text-xl font-semibold mb-4">
                            {isEditMode ? "Edit Product" : "Issue Product"}
                        </h3>
                        <form onSubmit={handleIssueSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issued To</label>
                                <input
                                    type="text"
                                    value={issuedTo}
                                    onChange={(e) => setIssuedTo(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter quantity"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unit</label>
                                <select
                                    value={issueKg}
                                    onChange={(e) => setIssueKg(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Select Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="Litre">Litre</option>
                                    <option value="Piece">Piece</option>
                                    <option value="Nos">Nos</option>
                                    <option value="Set">Set</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter remarks (optional)"
                                    rows={3}
                                />
                            </div>


                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowIssuePopup(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
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

export default ProductTable;
