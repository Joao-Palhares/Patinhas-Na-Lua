import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard font (optional, but good for special chars)
// We will use standard Helvetica which comes built-in

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  companyTitle: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  companySub: { fontSize: 8, color: '#666', marginBottom: 2 },
  invoiceTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  invoiceMeta: { fontSize: 9, textAlign: 'right', color: '#666' },
  
  section: { flexDirection: 'row', marginBottom: 20 },
  clientBox: { flexGrow: 1, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 4 },
  clientLabel: { fontSize: 8, color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  clientText: { fontSize: 10, marginBottom: 2 },
  
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5, marginBottom: 5, marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  colDesc: { flex: 3 },
  colValue: { flex: 1, textAlign: 'right' },
  
  petDetails: { fontSize: 8, color: '#666', marginTop: 4, marginLeft: 10 },
  
  totals: { marginTop: 20, alignSelf: 'flex-end', width: '40%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#000', paddingVertical: 6, marginTop: 4 },
  totalText: { fontSize: 12, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

// Translation Helpers (Copied from your code)
const SPECIES_MAP: any = { DOG: "Cão", CAT: "Gato", RABBIT: "Coelho", OTHER: "Outro" };
const SIZE_LABELS: any = { TOY: "< 5kg", SMALL: "5-10kg", MEDIUM: "11-20kg", LARGE: "21-30kg", XL: "31-40kg", GIANT: "> 40kg" };
const COAT_LABELS: any = { SHORT: "Curto", MEDIUM: "Médio", LONG: "Comprido", DOUBLE: "Duplo" };

export const InvoiceDocument = ({ invoice }: { invoice: any }) => {
  const pet = invoice.appointment.pet;
  const service = invoice.appointment.service;
  const fees = invoice.appointment.extraFees || [];
  
  const extrasTotal = fees.reduce((acc: number, curr: any) => acc + Number(curr.appliedPrice), 0);
  const servicePrice = Number(invoice.totalAmount) - extrasTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyTitle}>Patinhas na Lua</Text>
            <Text style={styles.companySub}>Estética Animal & Spa</Text>
            <Text style={styles.companySub}>Rua dos Animais Felizes, 123, Lisboa</Text>
            <Text style={styles.companySub}>NIF: 123 456 789</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FATURA / RECIBO</Text>
            <Text style={styles.invoiceMeta}>#{invoice.invoiceNumber || "RASCUNHO"}</Text>
            <Text style={styles.invoiceMeta}>Data: {new Date(invoice.date).toLocaleDateString('pt-PT')}</Text>
            <Text style={styles.invoiceMeta}>Estado: {invoice.status}</Text>
          </View>
        </View>

        {/* CLIENT INFO */}
        <View style={styles.section}>
          <View style={styles.clientBox}>
            <Text style={styles.clientLabel}>Dados do Cliente</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{invoice.user.name}</Text>
            <Text style={styles.clientText}>{invoice.user.address || "Morada não registada"}</Text>
            <Text style={styles.clientText}>{invoice.user.email}</Text>
            <Text style={styles.clientText}>NIF: {invoice.user.nif || "Consumidor Final"}</Text>
          </View>
        </View>

        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>DESCRIÇÃO DO SERVIÇO</Text>
          <Text style={[styles.colValue, { fontWeight: 'bold' }]}>VALOR</Text>
        </View>

        {/* MAIN SERVICE */}
        <View style={styles.tableRow}>
          <View style={styles.colDesc}>
            <Text style={{ fontWeight: 'bold' }}>{service.name}</Text>
            <Text style={styles.petDetails}>• Pet: {pet.name} ({SPECIES_MAP[pet.species] || pet.species})</Text>
            <Text style={styles.petDetails}>• Peso: {SIZE_LABELS[pet.sizeCategory] || "N/A"}</Text>
            {pet.coatType && <Text style={styles.petDetails}>• Pelo: {COAT_LABELS[pet.coatType]}</Text>}
          </View>
          <Text style={styles.colValue}>{servicePrice.toFixed(2)}€</Text>
        </View>

        {/* EXTRAS */}
        {fees.map((fee: any) => (
          <View key={fee.id} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text>{fee.extraFee.name}</Text>
              <Text style={{ fontSize: 7, color: '#888', fontStyle: 'italic' }}>Taxa Adicional</Text>
            </View>
            <Text style={styles.colValue}>{Number(fee.appliedPrice).toFixed(2)}€</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{Number(invoice.subtotal).toFixed(2)}€</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Impostos (IVA):</Text>
            <Text>0.00€</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalText}>TOTAL A PAGAR:</Text>
            <Text style={styles.totalText}>{Number(invoice.totalAmount).toFixed(2)}€</Text>
          </View>
          <Text style={{ textAlign: 'right', fontSize: 8, marginTop: 4, color: '#666' }}>
            Método: {invoice.appointment.paymentMethod}
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Obrigado pela sua preferência! | Patinhas na Lua | Processado por computador</Text>
        </View>

      </Page>
    </Document>
  );
};