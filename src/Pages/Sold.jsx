import { useEffect, useState } from "react";
import axios from "axios";
import { useNotification } from "../Components/NotificationProvider";

const Sold = () => {
    const { addNotification } = useNotification();
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: "", quantity: "", unit: "kg", remarks: "", status: "not sold" });
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [issueProduct, setIssueProduct] = useState(null);
    const [issueQty, setIssueQty] = useState("");

    const fetchProducts = async () => {
        const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`);
        const unsold = res.data.filter(p => p.status === "sold");
        setProducts(unsold);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const handleDelete = async () => {
        await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${deleteId}`);
        setShowModal(false);
        setDeleteId(null);
        fetchProducts();
        addNotification({ type: 'success', message: 'Product Deleted Successfully!' });
    };

    const handleEdit = (product) => {
        setEditing(product._id);
        setForm(product);
    };

    const handleUpdate = async () => {
        await axios.put(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${editing}`, form);
        setEditing(null);
        setForm({ name: "", quantity: "", unit: "kg", remarks: "", status: "not sold" });
        fetchProducts();
        addNotification({ type: 'success', message: 'Product Edited Successfully!' });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleIssueSubmit = async () => {
        const qty = parseFloat(issueQty);
        if (isNaN(qty) || qty <= 0) {
            return addNotification({ type: 'error', message: 'Enter a valid quantity.' });
        }
        if (qty > parseFloat(issueProduct.quantity)) {
            return addNotification({ type: 'error', message: 'Issued quantity exceeds available quantity.' });
        }

        const updatedProduct = {
            ...issueProduct,
            quantity: parseFloat(issueProduct.quantity) - qty,
        };

        await axios.put(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${issueProduct._id}`, updatedProduct);
        setIssueProduct(null);
        setIssueQty("");
        fetchProducts();
        addNotification({ type: 'success', message: 'Product Issued Successfully!' });
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Sold Products</h1>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="search"
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
                        placeholder="Search by product name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Edit Form */}
                {editing && (
                    <div className="bg-gray-100 border border-blue-200 p-4 rounded-lg mb-6">
                        <h2 className="font-semibold mb-4 text-blue-700">Edit Product</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="p-2 border rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="p-2 border rounded" placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                            <select className="p-2 border rounded" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                                <option value="kg">Kilogram</option>
                                <option value="litre">Litre</option>
                                <option value="piece">Piece</option>
                                <option value="box">Box</option>
                                <option value="Ton">Ton</option>
                            </select>
                            <input className="p-2 border rounded" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox"
                                checked={form.status === "sold"}
                                onChange={(e) => setForm({ ...form, status: e.target.checked ? "sold" : "not sold" })}
                            />
                            <label className="text-sm text-gray-600">Mark as Sold</label>
                        </div>
                        <button onClick={handleUpdate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse rounded-md overflow-hidden">
                        <thead className="bg-gray-100 text-left">
                            <tr className="text-sm text-gray-700">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Remarks</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((prod, idx) => (
                                <tr key={prod._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-4 py-2">{prod.name}</td>
                                    <td className="px-4 py-2">{prod.quantity}</td>
                                    <td className="px-4 py-2">{prod.unit}</td>
                                    <td className="px-4 py-2">{prod.remarks}</td>
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${prod.status === "sold" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                            <span className={`w-2 h-2 rounded-full ${prod.status === "sold" ? "bg-green-500" : "bg-red-500"}`}></span>
                                            {prod.status === "sold" ? "Sold" : "Not Sold"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center space-x-2">
                                        <button onClick={() => handleEdit(prod)} className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Edit</button>
                                        <button onClick={() => confirmDelete(prod._id)} className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Delete</button>
                                        <button onClick={() => { setIssueProduct(prod); setIssueQty(""); }} className="px-3 py-1 text-sm text-white bg-yellow-600 rounded hover:bg-yellow-700">Issue</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-2">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-4">Are you sure you want to delete this product?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Modal */}
            {issueProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-2">Issue Product</h2>
                        <p className="text-sm text-gray-600 mb-4">Available: {issueProduct.quantity} {issueProduct.unit}</p>
                        <input
                            type="number"
                            placeholder="Quantity to issue"
                            value={issueQty}
                            onChange={(e) => setIssueQty(e.target.value)}
                            className="w-full p-2 border rounded mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIssueProduct(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button onClick={handleIssueSubmit} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Issue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sold;
