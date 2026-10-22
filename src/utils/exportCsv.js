
import { getOrders } from "../api/salesOrders";

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportSalesOrders({
  status = "",
  site = "",
  q = "",
}) {
  const pageSize = 100;

  // Fetch the first page using the current filters.
  const firstPage = await getOrders({
    page: 1,
    pageSize,
    status,
    site,
    q,
  });

  const allOrders = [...firstPage.data];

  // Fetch any remaining pages.
  for (let page = 2; page <= firstPage.totalPages; page++) {
    const result = await getOrders({
      page,
      pageSize,
      status,
      site,
      q,
    });

    allOrders.push(...result.data);
  }

  const columns = [
    ["Order ID", "SalesId"],
    ["Customer", "SalesName"],
    ["Branch", "InventSiteId"],
    ["Order Date", "CreatedDateTime1"],
    ["Status", "SalesStatus"],
    ["Order Amount", "HAR_TotalSOAmount"],
  ];

  const header = columns
    .map(([label]) => escapeCsv(label))
    .join(",");

  const rows = allOrders.map((order) =>
    columns
      .map(([, field]) => {
        let value = order[field] ?? "";

        if (field === "CreatedDateTime1" && value) {
          value = String(value).slice(0, 10);
        }

        return escapeCsv(value);
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\r\n");

  // BOM helps Excel recognise UTF-8 text correctly.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `sales-orders-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return allOrders.length;
}
