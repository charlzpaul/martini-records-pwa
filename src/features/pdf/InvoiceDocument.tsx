import React, { useEffect, useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Template, Customer, CanvasLabel, LineItem } from '@/db/models';
import * as dbApi from '@/db/api';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: 'white',
  },
  // Use absolute positioning for canvas elements
  canvasObject: {
    position: 'absolute',
  },
  lineItemTable: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#dfdfdf',
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    backgroundColor: '#f2f2f2',
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    padding: 5,
  },
});

function getLabelValue(label: CanvasLabel, invoice: Invoice): string {
  switch (label.type) {
    case 'Subtotal':
      return `Subtotal: ${invoice.subtotal.toFixed(2)}`;
    case 'Tax':
      return `Tax: ${invoice.taxAmount.toFixed(2)}`;
    case 'Total':
      return `Total: ${invoice.grandTotal.toFixed(2)}`;
    default:
      return label.textValue;
  }
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      if (invoice.customerId) {
        const cust = await dbApi.getCustomerById(invoice.customerId);
        setCustomer(cust);
      }
    }
    loadCustomer();
  }, [invoice.customerId]);

  const paperSize = (template.paperSize === 'Letter' ? 'LETTER' : 'A4') as 'A4' | 'LETTER';

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
                {/* Static Content: Images and Labels */}
                {template.images.map(image => (
                    <Image
                        key={image.id}
                        src={image.base64Data}
                        style={{
                            ...styles.canvasObject,
                            left: image.x,
                            top: image.y,
                            width: image.currentWidth,
                            height: image.currentHeight,
                            opacity: image.opacity,
                        }}
                    />
                ))}
                {template.labels.filter(l => l.isVisible).map(label => (
                    <Text
                        key={label.id}
                        style={{
                            ...styles.canvasObject,
                            left: label.x,
                            top: label.y,
                            fontSize: label.fontSize,
                        }}
                    >
                        {getLabelValue(label, invoice)}
                    </Text>
                ))}

                {/* Dynamic Content: Line Items */}
                <View style={{
                    position: 'absolute',
                    left: 40, // Match page padding
                    right: 40, // Match page padding
                    top: template.lineItemArea.y,
                    height: template.lineItemArea.height,
                }}>
                    <View style={styles.lineItemTable}>
                        {/* Header */}
                        <View style={styles.tableRow}>
                            <Text style={{...styles.tableColHeader, width: '40%'}}>Item</Text>
                            <Text style={styles.tableColHeader}>Quantity</Text>
                            <Text style={styles.tableColHeader}>Rate</Text>
                            <Text style={styles.tableColHeader}>Amount</Text>
                        </View>
                        {/* Rows */}
                        {invoice.lineItems.map((item: LineItem) => (
                            <View key={item.id} style={styles.tableRow}>
                                <Text style={{...styles.tableCol, width: '40%'}}>{item.itemName}</Text>
                                <Text style={styles.tableCol}>{item.qty}</Text>
                                <Text style={styles.tableCol}>${item.rate.toFixed(2)}</Text>
                                <Text style={styles.tableCol}>${item.amount.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                 {/* Customer and Invoice Info can be added here as well */}
                 <View style={{ position: 'absolute', top: 40, left: 40 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{customer?.name}</Text>
                    <Text>{customer?.address}</Text>
                    <Text>{customer?.email}</Text>
                    <Text>{customer?.phone}</Text>
                </View>
                <View style={{ position: 'absolute', top: 40, right: 40, alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Invoice #{invoice.id.substring(0,8)}</Text>
                    <Text>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
                </View>

            </Page>
        </Document>
    );
};
