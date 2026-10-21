
import { useEffect, useState } from "react";
import { getOrders, getMetadata } from "./api/salesOrders";
import "./App.css";

function formatMoney(value) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function App() {
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [page, setPage] = useState(1);
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    getMetadata()
      .then(setMetadata)
      .catch((err) => {
        console.error("Metadata request failed:", err);
      });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const data = await getOrders({
          page,
          pageSize: 25,
          site,
          status,
          q: query,
        });

        if (active) setResult(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [page, site, status, query, refreshCount]);

  function resetPageAndSet(setter, value) {
    setPage(1);
    setter(value);
  }

  const summary = result?.summary;
  const orders = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;
  const sites = metadata?.facets?.sites ?? [];
  const statuses = metadata?.facets?.statuses ?? [];

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Sales Order Monitor</h1>
          <p>Branch sales overview</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => setRefreshCount((value) => value + 1)}
        >
          Refresh data
        </button>
      </header>

      <section className="cards">
        <article className="card">
          <p>Total orders</p>
          <h2>{summary?.total_orders ?? "—"}</h2>
        </article>

        <article className="card">
          <p>Open orders</p>
          <h2>{summary?.open_orders ?? "—"}</h2>
        </article>

        <article className="card">
          <p>Invoiced</p>
          <h2>{summary?.invoiced_orders ?? "—"}</h2>
        </article>

        <article className="card">
          <p>Delivered</p>
          <h2>{summary?.delivered_orders ?? "—"}</h2>
        </article>

        <article className="card">
          <p>Cancelled</p>
          <h2>{summary?.cancelled_orders ?? "—"}</h2>
        </article>

        <article className="card">
          <p>Total order value</p>
          <h2>
            {summary
              ? formatMoney(summary.total_order_value)
              : "—"}
          </h2>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Orders</h2>
            <p>
              {result
                ? `${result.total} matching orders`
                : "Waiting for order data"}
            </p>
          </div>
        </div>

        <form
          className="filters"
          onSubmit={(event) => {
            event.preventDefault();
            resetPageAndSet(setQuery, searchInput.trim());
          }}
        >
          <input
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search order, customer or reference"
            aria-label="Search orders"
          />

          <select
            value={site}
            onChange={(event) =>
              resetPageAndSet(setSite, event.target.value)
            }
            aria-label="Filter by site"
          >
            <option value="">All sites</option>
            {sites.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              resetPageAndSet(setStatus, event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.value}
              </option>
            ))}
          </select>

          <button type="submit">Search</button>
        </form>

        {error && (
          <div className="error" role="alert">
            <p>Unable to load orders: {error}</p>
            <button
              className="secondary-button"
              onClick={() => setRefreshCount((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <p className="message" role="status">
            Loading orders...
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="message">
            No orders match your search or filters.
          </p>
        )}

        {!error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order number</th>
                  <th>Customer</th>
                  <th>Site</th>
                  <th>Order date</th>
                  <th>Status</th>
                  <th className="numeric">Amount</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.SalesId}>
                    <td>{order.SalesId}</td>
                    <td>{order.SalesName}</td>
                    <td>{order.InventSiteId}</td>
                    <td>{formatDate(order.CreatedDateTime1)}</td>
                    <td>
                      <span className="status">
                        {order.SalesStatus}
                      </span>
                    </td>
                    <td className="numeric">
                      {formatMoney(order.HAR_TotalSOAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination">
          <button
            className="secondary-button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            className="secondary-button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;

/*import { useEffect, useState } from "react";
import { getOrders } from "./api/salesOrders";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);//react state-stores api response
  const [error, setError] = useState("");//tracks whether request in progress
  const [loading, setLoading] = useState(true);//stores message if request fails
  //when setResult(response) runs, react rerenders the ui with new response

  useEffect(() => {//runs request when component mounts, empty dependency array[] means the effect doesnt rerun just bcs component rerender
    async function loadOrders() {
      try {
        const response = await getOrders({
          page: 1,
          pageSize: 2,
        });

        setResult(response);//when setResult(response) runs, react rerenders the ui with new response
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }//try/catch/finally handle errors and stop showing loading state when request succeeds or fails

    loadOrders();
  }, []);

  if (loading) {
    return <main className="app">Loading orders...</main>;
  }

  if (error) {
    return (
      <main className="app">
        <h1>Could not load orders</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>API response inspector</h1>
      <p>We've received the following data from the API.</p>

      <pre style={{ overflowX: "auto" }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}

export default App;*/