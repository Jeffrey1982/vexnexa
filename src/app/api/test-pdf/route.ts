import { NextRequest, NextResponse } from "next/server";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

// Create styles for the test PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 20,
    color: '#666666',
  }
});

// Simple test PDF component
const TestPDFDocument = () => {
  return React.createElement(Document, {}, [
    React.createElement(Page, {
      key: 'page1',
      size: 'A4',
      style: styles.page
    }, [
      React.createElement(Text, {
        key: 'title',
        style: styles.title
      }, 'PDF Generation Test'),
      React.createElement(Text, {
        key: 'content',
        style: styles.content
      }, 'This is a test PDF to verify the PDF generation system is working correctly. If you can read this, the PDF system is functioning properly.'),
      React.createElement(Text, {
        key: 'timestamp',
        style: styles.timestamp
      }, `Generated: ${new Date().toLocaleString()}`)
    ])
  ]);
};

export async function GET() {
  try {
    console.log("Generating test PDF...");

    const pdfDoc = React.createElement(TestPDFDocument);
    const pdfBuffer = await pdf(pdfDoc as any).toBuffer();

    console.log("Test PDF generated successfully, size:", pdfBuffer.length, "bytes");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"test-pdf-report.pdf\"",
      },
    });

  } catch (error) {
    console.error("Test PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate test PDF", details: error.message },
      { status: 500 }
    );
  }
}