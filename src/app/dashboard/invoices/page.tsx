import React from "react";
import styles from "./invoices.module.css";

const companyOptions = [
  { label: "Aginova", value: "aginova" },
  { label: "Global Sensors", value: "global-sensors" },
  { label: "MedTech", value: "medtech" },
];

const daysOpenOptions = [65, 45, 30, 15];

const invoices = Array.from({ length: 7 }).map((_, index) => ({
  invoiceNumber: "10959580",
  orderNumber: "1040 - Shipped",
  shippedAt: "20.08.2025",
  customerName: "Sonitor",
  status: "Not paid",
  daysOpen: 20,
  orderAmount: "$1000",
  releasedInvoices: 1,
  deposit: "--",
  invoiceAmount: "$1000",
  amountDue: "$1000",
  id: index,
}));

const InvoicesPage = () => {
  return (
    <main className={styles.pageWrapper}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>100 Invoices</h1>
          <p className={styles.subtitle}>Last update: 12:42:06</p>
        </div>
        <div className={styles.balances}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceTitle}>Open Invoices &gt;90 days</span>
            <span className={styles.balanceValue}>50</span>
            <span className={styles.balanceCaption}>40 last month</span>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.balanceTitle}>Open Invoices &gt;30 days</span>
            <span className={styles.balanceValue}>40</span>
            <span className={styles.balanceCaption}>10 last month</span>
          </div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.searchContainer}>
          <label htmlFor="invoice-search" className={styles.searchLabel}>
            Search
          </label>
          <input
            id="invoice-search"
            type="search"
            placeholder="Search for report name, sensor ID"
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="company" className={styles.filterLabel}>
              Company
            </label>
            <select id="company" className={styles.select} defaultValue="aginova">
              {companyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="days-open" className={styles.filterLabel}>
              Days Open
            </label>
            <select id="days-open" className={styles.select} defaultValue={65}>
              {daysOpenOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.toggleGroup}>
            <button className={`${styles.toggleButton} ${styles.toggleActive}`}>
              Invoice
            </button>
            <button className={styles.toggleButton}>Order</button>
          </div>
        </div>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Order #</th>
                <th>Status</th>
                <th>When Shipped</th>
                <th>Customer Name</th>
                <th>Invoice Status</th>
                <th>Days Open</th>
                <th>Order Amount</th>
                <th>Released Invoices</th>
                <th>Deposit</th>
                <th>Invoice Amount</th>
                <th>Amount Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.orderNumber.split(" - ")[0]}</td>
                  <td>{invoice.orderNumber.split(" - ")[1]}</td>
                  <td>{invoice.shippedAt}</td>
                  <td>{invoice.customerName}</td>
                  <td>{invoice.status}</td>
                  <td>{invoice.daysOpen}</td>
                  <td>{invoice.orderAmount}</td>
                  <td>{invoice.releasedInvoices}</td>
                  <td>{invoice.deposit}</td>
                  <td>{invoice.invoiceAmount}</td>
                  <td>{invoice.amountDue}</td>
                  <td className={styles.actionCell}>
                    <button className={styles.freezeButton}>Freeze Account</button>
                    <button className={styles.downloadButton}>Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.footer}>
          <div className={styles.rowsPerPage}>
            <span>Rows per page:</span>
            <select className={styles.select} defaultValue={20}>
              {[10, 20, 30, 50].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.pagination}>
            <span>1-30 of 723</span>
            <nav>
              <ul className={styles.paginationList}>
                <li className={styles.paginationItem}>
                  <button className={styles.paginationLink}>1</button>
                </li>
                <li className={styles.paginationItem}>
                  <button className={styles.paginationLink}>2</button>
                </li>
                <li className={styles.paginationItem}>
                  <span className={styles.paginationEllipsis}>...</span>
                </li>
                <li className={styles.paginationItem}>
                  <button className={styles.paginationLink}>61</button>
                </li>
                <li className={styles.paginationItem}>
                  <button className={styles.paginationLink}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default InvoicesPage;


