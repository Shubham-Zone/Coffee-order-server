const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");

const FILE_PATH = "orders.xlsx";

// Ensure file exists
if (!fs.existsSync(FILE_PATH)) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");
    sheet.columns = [
        { header: "User", key: "user" },
        { header: "Choice", key: "choice" },
        { header: "Timestamp", key: "timestamp" }
    ];
    workbook.xlsx.writeFile(FILE_PATH);
}

// Endpoint to log order
app.post("/add", async (req, res) => {
    const { user, choice, timestamp } = req.body;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(FILE_PATH);
    const sheet = workbook.getWorksheet("Orders");

    sheet.addRow({ user, choice, timestamp });
    await workbook.xlsx.writeFile(FILE_PATH);

    res.json({ message: "Order logged in Excel!" });
});

app.listen(4000, () => console.log("Excel API running on port 4000"));
