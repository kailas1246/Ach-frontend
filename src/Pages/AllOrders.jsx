import { useEffect, useState } from "react";
import axios from "axios";
import { useNotification } from "../Components/NotificationProvider";

const ProductTable = () => {
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
        setProducts(res.data);
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

    const filteredProducts = products.filter((p) =>
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
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-3xl font-semibold mb-6 text-center sm:text-left">Product List</h1>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
                    <div className="relative w-full sm:w-1/3">
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg shadow text-gray-600 font-medium focus:outline-none focus:ring"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute top-0 left-0 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="10" cy="10" r="7" />
                                <line x1="21" y1="21" x2="15" y2="15" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                {editing && (
                    <div className="bg-blue-50 p-4 mb-6 rounded-lg shadow-inner">
                        <h2 className="font-semibold mb-2">Edit Product</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="p-2 border rounded w-full" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <input className="p-2 border rounded w-full" placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                            <select className="p-2 border rounded w-full" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                                <option value="kg">Kilogram</option>
                                <option value="litre">Litre</option>
                                <option value="piece">Piece</option>
                                <option value="box">Box</option>
                                <option value="Ton">Ton</option>
                            </select>
                            <input className="p-2 border rounded w-full" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.status === "sold"}
                                    onChange={(e) => setForm({ ...form, status: e.target.checked ? "sold" : "not sold" })}
                                />
                                <label className="text-sm text-gray-600">Sold</label>
                            </div>
                        </div>
                        <button onClick={handleUpdate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Update Product
                        </button>
                    </div>
                )}

                {/* Product Table */}
                <div className="w-full overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-200 text-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Quantity</th>
                                <th className="px-4 py-2 text-left">Unit</th>
                                <th className="px-4 py-2 text-left">Remarks</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((prod) => (
                                <tr key={prod._id} className="border-t">
                                    <td className="px-4 py-2">{prod.name}</td>
                                    <td className="px-4 py-2">{prod.quantity}</td>
                                    <td className="px-4 py-2">{prod.unit}</td>
                                    <td className="px-4 py-2">{prod.remarks}</td>
                                    <td className="px-4 py-2 flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${prod.status === "sold" ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span>{prod.status === "sold" ? "Sold" : "Not Sold"}</span>
                                    </td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button onClick={() => handleEdit(prod)} className="text-white font-bold ml-2 p-1 rounded-md bg-blue-600">Edit</button>
                                        <button onClick={() => confirmDelete(prod._id)} className="text-white font-bold p-1 rounded-md bg-red-600">Delete</button>
                                        <button onClick={() => { setIssueProduct(prod); setIssueQty(""); }} className="text-white font-bold p-1 rounded-md bg-yellow-600">Issue</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-gray-500">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Modal */}
            {issueProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Issue Product</h2>
                        <p className="text-gray-600 mb-2">Available: {issueProduct.quantity} {issueProduct.unit}</p>
                        <input
                            type="number"
                            placeholder="Enter quantity to issue"
                            className="w-full p-2 border rounded mb-4"
                            value={issueQty}
                            onChange={(e) => setIssueQty(e.target.value)}
                        />
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIssueProduct(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-800">Cancel</button>
                            <button onClick={handleIssueSubmit} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Issue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductTable;
