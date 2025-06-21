import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNotification } from "../Components/NotificationProvider";

const Sold = () => {
  const { addNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "kg", remarks: "", status: "not sold" });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [issueProduct, setIssueProduct] = useState(null);
  const [issueQty, setIssueQty] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products`);
    setProducts(res.data.filter(p => p.status === "sold"));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${deleteId}`);
    setShowDeleteModal(false);
    setDeleteId(null);
    fetchProducts();
    addNotification({ type: 'success', message: 'Product Deleted Successfully!' });
  };

  const handleEdit = (p) => {
    setEditing(p._id);
    setForm(p);
  };

  const handleUpdate = async () => {
    await axios.put(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/products/${editing}`, form);
    setEditing(null);
    setForm({ name: "", quantity: "", unit: "kg", remarks: "", status: "not sold" });
    fetchProducts();
    addNotification({ type: 'success', message: 'Product Edited Successfully!' });
  };

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

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Name", "Quantity", "Unit"]],
      body: filteredProducts.map(p => [p.name, p.quantity, p.unit]),
    });
    doc.save("products.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Store Issue</h1>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <input
            type="search"
            className="w-full md:w-1/3 px-4 py-2 border rounded focus:ring focus:border-blue-500"
            placeholder="Search by product name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-4">
            <button onClick={exportPDF} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
            <button onClick={exportExcel} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Export Excel</button>
          </div>
        </div>

        {editing && (
          <div className="bg-gray-100 border p-4 rounded mb-6">
            <h2 className="font-semibold text-blue-700 mb-4">Edit Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="p-2 border rounded" />
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" className="p-2 border rounded" />
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="p-2 border rounded">
                {["kg", "litre", "piece", "box", "Ton"].map(u => <option value={u} key={u}>{u}</option>)}
              </select>
              <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="p-2 border rounded" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={form.status === "sold"} onChange={e => setForm({ ...form, status: e.target.checked ? "sold" : "not sold" })} />
              <label className="text-sm text-gray-600">Mark as Sold</label>
            </div>
            <button onClick={handleUpdate} className="mt-4 bg-blue-600 text-white p-2 rounded">Save Changes</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 text-left">
              <tr>
                {["Name", "Quantity", "Unit", "Remarks", "Status", "Actions"].map(h => (
                  <th className="px-4 py-3" key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, i) => (
                <tr key={p._id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">{p.unit}</td>
                  <td className="px-4 py-2">{p.remarks}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${p.status === "sold" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      <span className={`w-2 h-2 rounded-full ${p.status === "sold" ? "bg-green-500" : "bg-red-500"}`} />
                      {p.status === "sold" ? "Sold" : "Not Sold"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button onClick={() => handleEdit(p)} className="bg-blue-600 text-white px-3 py-1 rounded">Edit</button>
                    <button onClick={() => confirmDelete(p._id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                    <button onClick={() => { setIssueProduct(p); setIssueQty(""); }} className="bg-yellow-600 text-white px-3 py-1 rounded">Issue</button>
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
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Confirm Deletion</h2>
            <p className="text-gray-600 mb-4">Are you sure?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {issueProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Issue Product</h2>
            <p className="text-sm text-gray-600 mb-4">Available: {issueProduct.quantity} {issueProduct.unit}</p>
            <input
              type="number"
              placeholder="Quantity to issue"
              value={issueQty}
              onChange={e => setIssueQty(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIssueProduct(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={handleIssueSubmit} className="px-4 py-2 bg-yellow-600 text-white rounded">Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sold;
