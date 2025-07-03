# Electricity Recharge Tracker

A modern web app to track electricity recharges, visualize recharge and cost data, and manage DPDC tokens.

## Features

- **Add Recharge Data**: Enter date, balance, recharged amount, and new balance via a modal form.
- **DPDC Token Parsing**: Paste a DPDC token to auto-fill Energy Cost, VAT, Rebate, and Debt fields.
- **Sortable Table**: Click any column header to sort ascending/descending.
- **Pagination**: View 5 records per page with navigation controls.
- **Charts**: Interactive line and bar charts (powered by Chart.js) show recharge and cost trends.
- **Edit/Delete/Approve/Reject**: Manage each recharge entry with action buttons.
- **Responsive UI**: Clean, modern Bootstrap 5 design, works on desktop and mobile.

## Setup & Usage

1. **Clone or Download** this repository.
2. **Open `index.html`** in your browser. No build step or server required.
3. **Add Data**:
   - Click "Add Recharge Data" to enter a new recharge.
   - Click "Add DPDC Token" to paste a token and auto-fill cost fields.
4. **View & Manage**:
   - Use the table to view, sort, edit, delete, approve, or reject entries.
   - Use the pagination controls to navigate.
   - See charts above the table for quick analytics.

## File Structure

- `index.html` - Main HTML file, includes Bootstrap, Chart.js, and app structure.
- `style.css` - Custom styles for layout, centering, and table/chart appearance.
- `script.js` - All app logic: data handling, table rendering, sorting, pagination, chart updates, and modal logic.
- `README.md` - This file.

## Dependencies
- [Bootstrap 5](https://getbootstrap.com/) (CDN)
- [Bootstrap Icons](https://icons.getbootstrap.com/) (CDN)
- [Chart.js](https://www.chartjs.org/) (CDN)

## Data Storage
- Data is stored in a remote JSONBin (see `BIN_ID` and `API_KEY` in `script.js`).
- You can change to your own JSONBin or adapt for local storage if desired.

## Customization
- Change chart types, colors, or add more analytics in `script.js`.
- Adjust table columns or add new fields as needed.
- Style the app further in `style.css`.

---

**Enjoy tracking your electricity recharges and visualizing your data!** 