import { useEffect, useState } from 'react';

function App() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/assets')
      .then((res) => res.json())
      .then((data) => {
        setAssets(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch assets:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>IT Asset Management</h2>
      {loading ? (
        <p>Loading assets from database...</p>
      ) : assets.length === 0 ? (
        <p>No assets found in the database.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: '#f2f2f2', textAlign: 'left' }}>
              <th>ID</th>
              <th>Asset Name</th>
              <th>Asset Code</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.asset_name}</td>
                <td>{item.asset_code}</td>
                <td>{item.category}</td>
                <td>{item.status}</td>
                <td>{item.assigned_to || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;