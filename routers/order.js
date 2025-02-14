const express = require("express");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const router = express.Router();
require("dotenv").config();

// Google Sheet ID
const SHEET_ID = process.env.SHEET_ID;

// Google Service Account Authentication
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.SERVICE_ACCOUNT_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Mapping month names to columns
const monthColumnMapping = {
    "January": "I",
    "February": "Q",
    "March": "Y",
    "April": "AG",
    "May": "AO",
    "June": "AW",
    "July": "BE",
    "August": "BM",
    "September": "BU",
    "October": "CC",
    "November": "CK",
    "December": "CS"
};

// Convert Google Sheets serial number to Date
function googleSheetSerialToDate(serial) {
    const baseDate = new Date(1899, 11, 30); // Google Sheets epoch start (Dec 30, 1899)
    return new Date(baseDate.getTime() + serial * 24 * 60 * 60 * 1000);
}

// Order Route
router.post("/order", async (req, res) => {
    console.log("New req to", req.url);
    const { user, choice } = req.body;
    const currentHour = new Date().getHours();
    const isMorning = currentHour < 14; // Morning coffee or chai till 2 pm

    // Correct Date Format: "11 Feb 2025"
    const todayDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replace(",", "");

    console.log("Today date is", todayDate);
    const currentMonth = new Date().toLocaleString("en-GB", { month: "long" });

    try {
        // Load Google Sheet
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log("Spreadsheet loaded successfully");

        // Select the first sheet
        const sheet = doc.sheetsByIndex[0];

        // Get the starting column for this month
        const startColumn = monthColumnMapping[currentMonth];
        if (!startColumn) throw new Error(`Column mapping for ${currentMonth} not found!`);
        console.log(`Using start column: ${startColumn} for ${currentMonth}`);

        // Load all necessary cells in the expected date range
        const range = `${startColumn}1:${startColumn}200`; // Load first 200 rows
        await sheet.loadCells(range);
        console.log("Cells loaded successfully...");

        let todayRowIndex = null;

        // Find row index for today's date
        for (let row = 1; row < 100; row++) {
            let cellValue = sheet.getCell(row, startColumn.charCodeAt(0) - "A".charCodeAt(0)).value;

            if (cellValue) {
                const formattedDate = googleSheetSerialToDate(cellValue).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

                if (formattedDate === todayDate) {
                    console.log("Row found.");
                    todayRowIndex = row;
                    break;
                }
            }
        }

        console.log("Today row is", todayRowIndex);

        if (todayRowIndex === null) {
            console.log("Today's date not found, creating a new row...");
            const newRow = {};
            newRow[startColumn] = todayDate;
            await sheet.addRow(newRow);
            todayRowIndex = sheet.rowCount - 1;
        }

        await sheet.loadCells(); // Ensure cells are loaded before accessing

        console.log(sheet.getCell(todayRowIndex, 17)?.value); // Safe check

        // Column mapping
        const columns = {
            date: 0,
            coffeeMorning: 1,
            coffeeEvening: 2,
            teaMorning: 3,
            teaEvening: 4,
            totalCoffee: 5,
            totalTea: 6
        };

        // Function to get column index
        const getColumnIndex = (colOffset) => startColumn.charCodeAt(0) - "A".charCodeAt(0) + colOffset;

        console.log("Try to find column", getColumnIndex(columns.coffeeMorning));

        const coffeeMorningCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.coffeeMorning));
        const coffeeEveningCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.coffeeEvening));
        const teaMorningCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.teaMorning));
        const teaEveningCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.teaEvening));
        const totalCoffeeCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.totalCoffee));
        const totalTeaCell = sheet.getCell(todayRowIndex, getColumnIndex(columns.totalTea));

        console.log("Total coffee cell", totalCoffeeCell?.value);

        // Function to safely update a cell and wait for completion
        const updateCellSafely = async (cell) => {
            try {
                await sheet.loadCells(); // Ensure the latest data is fetched
                cell.value = (parseInt(cell.value) || 0) + 1;
                await sheet.saveUpdatedCells();
                console.log(`Updated ${cell.address} to ${cell.value}`);
            } catch (err) {
                console.log("Conflict detected, retrying...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await updateCellSafely(cell);
            }
        };

        // Function to safely update total coffee or tea values
        const updateTotalCellSafely = async (morningCell, eveningCell, totalCell) => {
            try {
                await sheet.loadCells(); // Reload latest values
                totalCell.value = (parseInt(morningCell.value) || 0) + (parseInt(eveningCell.value) || 0);
                await sheet.saveUpdatedCells();
                console.log(`Updated ${totalCell.address} to ${totalCell.value}`);
            } catch (err) {
                console.log("Conflict detected, retrying...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await updateTotalCellSafely(morningCell, eveningCell, totalCell);
            }
        };

        // Update coffee or tea counts first, then update total
        if (choice === "coffee") {
            if (isMorning) {
                await updateCellSafely(coffeeMorningCell);
            } else {
                await updateCellSafely(coffeeEveningCell);
            }
        } else if (choice === "tea") {
            if (isMorning) {
                await updateCellSafely(teaMorningCell);
            } else {
                await updateCellSafely(teaEveningCell);
            }
        }

        // **Wait for previous updates to complete before updating totals**
        await sheet.loadCells(); // Ensure the latest values are fetched before calculating totals

        await updateTotalCellSafely(coffeeMorningCell, coffeeEveningCell, totalCoffeeCell);
        await updateTotalCellSafely(teaMorningCell, teaEveningCell, totalTeaCell);

        // Final confirmation log
        console.log("Final total values:");
        console.log("Total Coffee:", totalCoffeeCell.value);
        console.log("Total Tea:", totalTeaCell.value);

        res.status(200).json({ msg: "Order updated successfully in Google Sheet!" });

    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ msg: `Error: ${error.message}` });
    }
});

module.exports = router;
