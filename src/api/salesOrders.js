const API_URL =
  "https://hiring.harrisons.my/api/mock/sales-orders";

const API_KEY = "hssb-assessment-mock-2026";

export async function getOrders({
  page = 1,
  pageSize = 25,
  status = "",
  site = "",
  q = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (status) params.set("status", status);
  if (site) params.set("site", site);
  if (q.trim()) params.set("q", q.trim());

  const response = await fetch(
    `${API_URL}?${params.toString()}`,
    {
      headers: {
        "x-assessment-key": API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json();
}

export async function getMetadata() {
  const response = await fetch(`${API_URL}/meta`, {
    headers: {
      "x-assessment-key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Metadata API returned ${response.status}`);
  }

  return response.json();
}