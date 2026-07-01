import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { DailyBillSummary } from "@/hooks/useDailyBill";
import { formatCurrency } from "./currency";

export const generateDailyBillPDF = async (
  dailyBills: DailyBillSummary[],
  elementId: string = "daily-bills-content"
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found for PDF generation");
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    // Add multiple pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    // Generate filename with date
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Daily-Bills-${dateStr}.pdf`;

    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

export const generateDetailedBillPDF = (
  dailyBills: DailyBillSummary[],
  companyName: string = "POKLEH ENTERPRISE"
) => {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text
  const addText = (
    text: string,
    x: number,
    y: number,
    fontSize: number = 10,
    fontStyle: "normal" | "bold" = "normal",
    color: [number, number, number] = [0, 0, 0]
  ) => {
    pdf.setFont("helvetica", fontStyle);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    pdf.text(text, x, y);
  };

  // Helper to check if we need new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      // Add header on new pages
      addText("POKLEH ENTERPRISE - Daily Bills Report (Continued)", margin, yPosition, 11, "bold");
      yPosition += 8;
    }
  };

  // Header
  addText(companyName, margin, yPosition, 14, "bold", [0, 51, 102]);
  yPosition += 8;
  addText("Daily Bills Report", margin, yPosition, 12, "bold");
  yPosition += 6;
  addText(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition, 9, "normal", [100, 100, 100]);
  yPosition += 10;

  // Summary totals
  const totalBills = dailyBills.length;
  const totalSold = dailyBills.reduce((sum, b) => sum + b.totalSold, 0);
  const totalWasted = dailyBills.reduce((sum, b) => sum + b.totalWasted, 0);
  const totalReduction = dailyBills.reduce((sum, b) => sum + b.totalReduction, 0);
  const totalAmount = dailyBills.reduce((sum, b) => sum + b.totalAmount, 0);

  // Summary box
  pdf.setFillColor(230, 240, 250);
  pdf.rect(margin, yPosition - 2, contentWidth, 18, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 51, 102);

  const col1 = margin + 5;
  const col2 = col1 + 40;
  const col3 = col2 + 40;
  const col4 = col3 + 40;
  const col5 = col4 + 40;

  pdf.text(`Bills: ${totalBills}`, col1, yPosition + 5);
  pdf.text(`Sold: ${totalSold}`, col2, yPosition + 5);
  pdf.text(`Wasted: ${totalWasted}`, col3, yPosition + 5);
  pdf.text(`Reduction: ${totalReduction}`, col4, yPosition + 5);
  pdf.text(`Total: ${formatCurrency(totalAmount)}`, col5, yPosition + 5);

  yPosition += 12;

  // Table for each bill
  dailyBills.forEach((bill, billIndex) => {
    checkNewPage(15);

    // Bill header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    addText(
      `${new Date(bill.date).toLocaleDateString()} | ${bill.truckName}`,
      margin,
      yPosition,
      10,
      "bold"
    );
    yPosition += 6;

    // Table columns for this bill
    const tableStartY = yPosition;
    const colWidths = {
      product: 25,
      sold: 18,
      wasted: 18,
      reduction: 18,
      payable: 18,
      cost: 20,
      amount: 25,
    };

    // Table header
    pdf.setFillColor(200, 200, 200);
    pdf.rect(margin, yPosition - 3, contentWidth, 5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    let tableX = margin + 2;
    pdf.text("Product", tableX, yPosition);
    tableX += colWidths.product;
    pdf.text("Sold", tableX, yPosition);
    tableX += colWidths.sold;
    pdf.text("Wasted", tableX, yPosition);
    tableX += colWidths.wasted;
    pdf.text("Reduction", tableX, yPosition);
    tableX += colWidths.reduction;
    pdf.text("Payable", tableX, yPosition);
    tableX += colWidths.payable;
    pdf.text("Cost/Unit", tableX, yPosition);
    tableX += colWidths.cost;
    pdf.text("Amount (RM)", tableX, yPosition);

    yPosition += 5;

    // Table rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    bill.lines.forEach((line) => {
      tableX = margin + 2;
      pdf.text(line.productType, tableX, yPosition);
      tableX += colWidths.product;
      pdf.text(line.quantitySold.toString(), tableX, yPosition);
      tableX += colWidths.sold;
      pdf.setTextColor(200, 100, 0);
      pdf.text(line.quantityWasted.toString(), tableX, yPosition);
      tableX += colWidths.wasted;
      pdf.setTextColor(0, 128, 0);
      pdf.text(line.wastageReduction.toString(), tableX, yPosition);
      tableX += colWidths.reduction;
      pdf.setTextColor(0, 0, 0);
      pdf.text(line.payableQuantity.toString(), tableX, yPosition);
      tableX += colWidths.payable;
      pdf.text(formatCurrency(line.costPerPax), tableX, yPosition);
      tableX += colWidths.cost;
      pdf.setTextColor(0, 102, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text(formatCurrency(line.payableAmount), tableX, yPosition);
      pdf.setFont("helvetica", "normal");

      yPosition += 4;
    });

    // Bill total line
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition - 2, contentWidth, 4, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    tableX = margin + 80;
    pdf.text(`TOTAL: ${bill.totalPayable} units`, tableX, yPosition);
    tableX = margin + 170;
    pdf.setTextColor(0, 102, 0);
    pdf.text(formatCurrency(bill.totalAmount), tableX, yPosition);

    yPosition += 8;
  });

  // Grand total section
  checkNewPage(15);

  yPosition += 5;
  pdf.setFillColor(0, 51, 102);
  pdf.rect(margin, yPosition - 3, contentWidth, 12, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);

  tableX = margin + 5;
  pdf.text("GRAND TOTAL", tableX, yPosition + 3);
  tableX = margin + 140;
  pdf.text(`${totalBills} Bills | ${totalSold} Sold | ${totalWasted} Wasted | ${totalReduction} Reduction`, tableX, yPosition + 3);

  yPosition += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(0, 102, 0);
  tableX = margin + contentWidth - 70;
  pdf.text(`AMOUNT DUE: ${formatCurrency(totalAmount)}`, tableX, yPosition);

  // Footer
  yPosition = pageHeight - margin - 10;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Generated by Pokleh Enterprise | Page ${pdf.internal.pages.length - 1} of ${pdf.internal.pages.length - 1}`,
    margin,
    yPosition
  );

  // Save PDF
  const dateStr = new Date().toISOString().split("T")[0];
  pdf.save(`Daily-Bills-${dateStr}.pdf`);
};
