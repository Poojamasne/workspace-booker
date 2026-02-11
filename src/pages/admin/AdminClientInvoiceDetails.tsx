import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  IndianRupee,
  FileText,
  Download,
  ArrowLeft,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  CalendarDays,
  FileCheck,
  MapPin,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Filter,
  Search,
  BarChart3,
  Send,
  Eye,
  Edit,
  Plus,
  Receipt,
  Printer,
  Copy,
  QrCode,
  Trash2,
  FileSignature,
  CreditCard,
  Shield,
  Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Invoice, InvoiceStatus, Client, PRODUCT_TYPE_LABELS, Product } from '@/types';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PageHeader from '@/components/dashboard/PageHeader';

// Invoice Preview Component with Light Orange and Light Blue Theme
const InvoicePreview = ({ invoice, client }: { invoice: Invoice; client?: Client }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  useEffect(() => {
    const qrData = `INVOICE:${invoice.invoiceNumber}|AMOUNT:${invoice.total}|DATE:${format(new Date(invoice.createdAt), 'dd/MM/yyyy')}`;
    setQrCodeData(qrData);
  }, [invoice]);

  const calculateTaxRate = () => {
    if (invoice.subtotal === 0) return 0;
    return ((invoice.tax / invoice.subtotal) * 100).toFixed(2);
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast.loading('Generating PDF...');
      
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1123]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
      
      toast.dismiss();
      toast.success('Invoice downloaded as PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  const copyToClipboard = async () => {
    const text = `
Invoice #: ${invoice.invoiceNumber}
Date: ${format(new Date(invoice.createdAt), 'dd/MM/yyyy')}
Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
Amount: ₹${invoice.total.toLocaleString('en-IN')}
Status: ${invoice.status}
    `.trim();

    await navigator.clipboard.writeText(text);
    toast.success('Invoice details copied to clipboard');
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Action Buttons - Default styling */}
      <div className="flex flex-wrap gap-3 no-print">
        <Button onClick={generatePDF}>
          <FileText className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={printInvoice}>
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </Button>
        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Details
        </Button>
        <Button variant="outline" onClick={() => toast.info('Share functionality coming soon')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* A4 Invoice Design - Light Orange and Light Blue only */}
      <div
        ref={invoiceRef}
        className="bg-white mx-auto shadow-2xl print:shadow-none"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Light Orange Gradient Header - No dark colors */}
        <div className="relative" style={{ 
          background: 'linear-gradient(135deg, #FFE5D9 0%, #FFF1EB 100%)',
          padding: '25px 30px',
          borderBottom: '2px solid #FFD1C4'
        }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 style={{ 
                fontSize: '42px', 
                fontWeight: '800', 
                color: '#8B4B3C',
                letterSpacing: '-0.5px',
                marginBottom: '5px'
              }}>
                INVOICE
              </h1>
              <p style={{ 
                fontSize: '18px', 
                color: '#B35E4A',
                fontWeight: '500'
              }}>
                #{invoice.invoiceNumber}
              </p>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '15px 25px',
              borderRadius: '12px',
              border: '1px solid #FFD1C4'
            }}>
              <p style={{ fontSize: '14px', color: '#8B4B3C', marginBottom: '5px' }}>
                Date: {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
              </p>
              <p style={{ fontSize: '14px', color: '#8B4B3C' }}>
                Due: {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Company & Client Info Section */}
        <div style={{ padding: '30px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Company Info - Light Blue */}
            <div style={{ 
              padding: '20px',
              background: '#F0F7FA',
              borderRadius: '16px',
              border: '1px solid #D4E8ED'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#B8D9E3',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building className="w-5 h-5" style={{ color: '#3C6E7A' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2C5F6B' }}>ADELINE SPACE HEDS</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#2C5F6B' }} />
                  <span style={{ fontSize: '13px', color: '#3C6E7A' }}>123 Business Street, Mumbai, India</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail className="w-4 h-4" style={{ color: '#2C5F6B' }} />
                  <span style={{ fontSize: '13px', color: '#3C6E7A' }}>contact@adelinspace.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone className="w-4 h-4" style={{ color: '#2C5F6B' }} />
                  <span style={{ fontSize: '13px', color: '#3C6E7A' }}>+91 98765 43210</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award className="w-4 h-4" style={{ color: '#2C5F6B' }} />
                  <span style={{ fontSize: '13px', color: '#3C6E7A' }}>GST: 27AABCC1234F1Z5</span>
                </div>
              </div>
            </div>

            {/* Client Info - Light Orange */}
            <div style={{ 
              padding: '20px',
              background: '#FFF5F0',
              borderRadius: '16px',
              border: '1px solid #FFE4D6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#FFD1C4',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User className="w-5 h-5" style={{ color: '#B35E4A' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#B35E4A' }}>BILL TO</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#8B4B3C' }}>{client?.companyName || 'Client Name'}</p>
                <p style={{ fontSize: '14px', color: '#A55A48' }}>{client?.contactPerson}</p>
                <p style={{ fontSize: '13px', color: '#A55A48' }}>{client?.address}</p>
                <p style={{ fontSize: '13px', color: '#A55A48' }}>{client?.email}</p>
                <p style={{ fontSize: '13px', color: '#A55A48' }}>{client?.phone}</p>
              </div>
            </div>
          </div>

          {/* Status Badge - Light colors */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '8px 20px',
              background: invoice.status === 'paid' ? '#E6F7E6' :
                         invoice.status === 'pending' ? '#FFF4E5' :
                         invoice.status === 'overdue' ? '#FFE5E5' : '#F0F0F0',
              borderRadius: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: invoice.status === 'paid' ? '1px solid #B8E0B8' :
                     invoice.status === 'pending' ? '1px solid #FFD9B3' :
                     invoice.status === 'overdue' ? '1px solid #FFC2C2' : '1px solid #D4D4D4'
            }}>
              {invoice.status === 'paid' && <CheckCircle className="w-4 h-4" style={{ color: '#2E7D32' }} />}
              {invoice.status === 'pending' && <Clock className="w-4 h-4" style={{ color: '#B85C00' }} />}
              {invoice.status === 'overdue' && <AlertCircle className="w-4 h-4" style={{ color: '#C62828' }} />}
              <span style={{ fontSize: '14px', fontWeight: '600', color: 
                invoice.status === 'paid' ? '#2E7D32' :
                invoice.status === 'pending' ? '#B85C00' :
                invoice.status === 'overdue' ? '#C62828' : '#5F5F5F'
              }}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Items Table - Light Blue Header */}
          <div style={{ marginBottom: '30px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #E8F0F5 0%, #D4E8ED 100%)',
                }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#2C5F6B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#2C5F6B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                  <th style={{ padding: '15px 20px', textAlign: 'right', color: '#2C5F6B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price/Unit</th>
                  <th style={{ padding: '15px 20px', textAlign: 'center', color: '#2C5F6B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                  <th style={{ padding: '15px 20px', textAlign: 'right', color: '#2C5F6B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.products.map((product, index) => (
                  <tr key={product.id} style={{ 
                    borderBottom: '1px solid #E5E5E5',
                    background: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                  }}>
                    <td style={{ padding: '15px 20px', color: '#2C5F6B', fontWeight: '600' }}>{String(index + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <p style={{ fontWeight: '600', color: '#333333', marginBottom: '4px' }}>
                        {PRODUCT_TYPE_LABELS[product.type] || product.type}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666666' }}>
                        {product.comments || `${PRODUCT_TYPE_LABELS[product.type] || product.type} service`}
                      </p>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right', color: '#666666' }}>
                      ₹{product.pricePerUnit?.toLocaleString('en-IN') || (product.totalPrice / product.quantity).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <span style={{ 
                        background: '#F5F5F5',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333333'
                      }}>
                        {product.quantity}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: '600', color: '#2C5F6B' }}>
                      ₹{product.totalPrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Payment Info - Light Orange */}
            <div style={{ 
              padding: '20px',
              background: '#FFF5F0',
              borderRadius: '16px',
              border: '1px solid #FFE4D6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: '#FFD1C4',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard className="w-4 h-4" style={{ color: '#B35E4A' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#B35E4A' }}>Payment Information</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8B4B3C' }}>Bank Name:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B3A2E' }}>State Bank of India</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8B4B3C' }}>Account Number:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B3A2E' }}>1234 5678 9012 3456</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8B4B3C' }}>IFSC Code:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B3A2E' }}>SBIN0001234</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8B4B3C' }}>Account Name:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B3A2E' }}>ADELINE SPACE HEDS</span>
                </div>
              </div>
              <div style={{ 
                marginTop: '15px',
                padding: '12px',
                background: '#FFFAF8',
                borderRadius: '8px',
                border: '1px solid #FFE4D6'
              }}>
                <p style={{ fontSize: '12px', color: '#B35E4A' }}>
                  <span style={{ fontWeight: '600' }}>Note:</span> Please mention invoice number {invoice.invoiceNumber} in the payment reference.
                </p>
              </div>
            </div>

            {/* QR Code & Total - Light Blue */}
            <div>
              <div style={{ 
                padding: '20px',
                background: 'linear-gradient(135deg, #E8F0F5 0%, #D4E8ED 100%)',
                borderRadius: '16px',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px', color: '#2C5F6B' }}>Subtotal</span>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#2C5F6B' }}>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px', color: '#2C5F6B' }}>Tax ({calculateTaxRate()}%)</span>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#2C5F6B' }}>₹{invoice.tax.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '2px solid #B8D9E3'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1E3F47' }}>TOTAL</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#1E3F47' }}>₹{invoice.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div style={{ 
                padding: '15px',
                background: '#F0F7FA',
                borderRadius: '16px',
                border: '1px solid #D4E8ED',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px solid #B8D9E3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode className="w-12 h-12" style={{ color: '#2C5F6B' }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1E3F47', marginBottom: '4px' }}>
                    Scan to Pay
                  </p>
                  <p style={{ fontSize: '11px', color: '#3C6E7A' }}>
                    Use any UPI app to scan and pay securely
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Light colors */}
          <div style={{ 
            marginTop: '40px',
            paddingTop: '30px',
            borderTop: '2px solid #E5E5E5'
          }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 2fr',
              gap: '30px',
              alignItems: 'start'
            }}>
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#B35E4A',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Terms & Conditions
                </h4>
                <p style={{ fontSize: '12px', color: '#666666', lineHeight: '1.6' }}>
                  • Payment is due within 30 days from the invoice date<br />
                  • Late payments will incur a 1.5% monthly interest charge<br />
                  • Please include invoice number with payment
                </p>
              </div>
              
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#2C5F6B',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Contact
                </h4>
                <p style={{ fontSize: '12px', color: '#666666', lineHeight: '1.6' }}>
                  accounts@adelinspace.com<br />
                  +91 98765 43210<br />
                  Mon-Fri, 9AM-6PM IST
                </p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#B35E4A',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Authorized Signature
                </h4>
                <div style={{ 
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '2px dashed #FFD1C4',
                  display: 'inline-block',
                  width: '200px'
                }}>
                  <FileSignature className="w-8 h-8" style={{ color: '#B35E4A', marginBottom: '8px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#6B3A2E' }}>Manager, Adeline Space</p>
                  <p style={{ fontSize: '11px', color: '#8B4B3C' }}>Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '30px',
              padding: '20px',
              background: '#FFF5F0',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #FFE4D6'
            }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#B35E4A', marginBottom: '5px' }}>
                Thank you for your business!
              </p>
              <p style={{ fontSize: '13px', color: '#2C5F6B' }}>
                We appreciate your prompt payment and look forward to serving you again.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body * {
              visibility: hidden;
            }
            [ref="${invoiceRef}"] {
              visibility: visible;
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

// Main Component - With default button styling
export default function AdminClientInvoiceDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { invoices: initialInvoices, clients: initialClients } = useData();

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetailView, setInvoiceDetailView] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const client = clients.find(c => c.id === clientId);
  const clientInvoices = invoices.filter(i => i.clientId === clientId);

  const filteredInvoices = clientInvoices.filter(invoice => {
    if (activeTab !== 'all') {
      if (activeTab === 'pending') return invoice.status === 'pending';
      if (activeTab === 'sent') return invoice.status === 'sent';
      if (activeTab === 'paid') return invoice.status === 'paid';
      if (activeTab === 'draft') return invoice.status === 'draft';
      if (activeTab === 'overdue') return invoice.status === 'overdue';
      if (activeTab === 'active') {
        return invoice.status === 'sent' || invoice.status === 'pending';
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const statusMatch = invoice.status.toLowerCase().includes(query);
      const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(query);
      const productMatch = invoice.products.some(p => 
        p.type.toLowerCase().includes(query)
      );
      const amountMatch = invoice.total.toString().includes(query);
      
      return statusMatch || invoiceNumberMatch || productMatch || amountMatch;
    }

    return true;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedInvoices = localStorage.getItem('invoices');
        const storedClients = localStorage.getItem('clients');

        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          setInvoices(parsedInvoices);
        }

        if (storedClients) {
          const parsedClients = JSON.parse(storedClients);
          setClients(parsedClients);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromLocalStorage();
  }, []);

  const stats = {
    totalAmount: clientInvoices.reduce((sum, i) => sum + i.total, 0),
    pending: clientInvoices.filter(i => i.status === 'pending').length,
    sent: clientInvoices.filter(i => i.status === 'sent').length,
    paid: clientInvoices.filter(i => i.status === 'paid').length,
    draft: clientInvoices.filter(i => i.status === 'draft').length,
    overdue: clientInvoices.filter(i => {
      if (i.status !== 'sent' && i.status !== 'pending') return false;
      return new Date(i.dueDate) < new Date();
    }).length,
    active: clientInvoices.filter(i => i.status === 'sent' || i.status === 'pending').length,
    total: clientInvoices.length,
    averageAmount: clientInvoices.length > 0 ? 
      clientInvoices.reduce((sum, i) => sum + i.total, 0) / clientInvoices.length : 0,
    pendingAmount: clientInvoices
      .filter(i => i.status === 'pending' || i.status === 'sent')
      .reduce((sum, i) => sum + i.total, 0),
    paidAmount: clientInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0)
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      paid: {
        icon: CheckCircle,
        label: 'Paid',
        color: 'bg-green-500/10 text-green-700 border-green-200',
        iconColor: 'text-green-600'
      },
      pending: {
        icon: AlertCircle,
        label: 'Pending',
        color: 'bg-amber-500/10 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600'
      },
      sent: {
        icon: Send,
        label: 'Sent',
        color: 'bg-blue-500/10 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600'
      },
      draft: {
        icon: FileText,
        label: 'Draft',
        color: 'bg-gray-500/10 text-gray-700 border-gray-200',
        iconColor: 'text-gray-600'
      },
      overdue: {
        icon: Clock,
        label: 'Overdue',
        color: 'bg-red-500/10 text-red-700 border-red-200',
        iconColor: 'text-red-600'
      }
    };
    return configs[status] || configs.draft;
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const days = differenceInDays(due, new Date());
    
    if (days > 30) return { text: `${Math.floor(days/30)} months`, variant: 'default' as const };
    if (days > 7) return { text: `${days} days`, variant: 'default' as const };
    if (days > 0) return { text: `${days} days`, variant: 'secondary' as const };
    if (days === 0) return { text: 'Due today', variant: 'outline' as const };
    return { text: `${Math.abs(days)} days overdue`, variant: 'destructive' as const };
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    setIsLoading(true);
    try {
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === id) {
          return {
            ...invoice,
            status,
            updatedAt: new Date().toISOString(),
            paidAt: status === 'paid' ? new Date().toISOString() : invoice.paidAt,
            sentAt: status === 'sent' ? new Date().toISOString() : invoice.sentAt
          };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = () => {
    if (!invoiceToDelete) return;

    try {
      const updatedInvoices = invoices.filter(i => i.id !== invoiceToDelete.id);
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownload = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const content = `
INVOICE
=======

Invoice Number: ${invoice.invoiceNumber}
Date: ${format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
Due Date: ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
Status: ${invoice.status.toUpperCase()}

BILL TO
-------
Company: ${client?.companyName || 'N/A'}
Contact: ${client?.contactPerson || 'N/A'}
Email: ${client?.email || 'N/A'}
Phone: ${client?.phone || 'N/A'}
Address: ${client?.address || 'N/A'}

ITEMS
-----
${invoice.products.map(p => 
  `${PRODUCT_TYPE_LABELS[p.type] || p.type}: ${p.quantity} unit(s) @ ₹${p.pricePerUnit?.toLocaleString('en-IN') || (p.totalPrice / p.quantity).toLocaleString('en-IN')}/unit = ₹${p.totalPrice.toLocaleString('en-IN')}`
).join('\n')}

---------------------------------
Subtotal:    ₹${invoice.subtotal.toLocaleString('en-IN')}
Tax:         ₹${invoice.tax.toLocaleString('en-IN')}
---------------------------------
TOTAL:       ₹${invoice.total.toLocaleString('en-IN')}

${invoice.notes ? `\nNotes: ${invoice.notes}` : ''}

---
Generated on ${format(new Date(), 'MMMM d, yyyy')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded as text');
  };

  const handleSendInvoice = (invoice: Invoice) => {
    handleStatusChange(invoice.id, 'sent');
    toast.success(`Invoice sent to ${client?.email}`);
  };

  const handleMarkPaid = (invoice: Invoice) => {
    handleStatusChange(invoice.id, 'paid');
  };

  const handleViewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDetailView(true);
  };

  if (selectedInvoice && invoiceDetailView) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between no-print">
            <Button variant="ghost" onClick={() => setInvoiceDetailView(false)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
            <div className="text-sm text-muted-foreground">
              Client: {client?.companyName}
            </div>
          </div>
          <InvoicePreview invoice={selectedInvoice} client={client} />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout role="admin">
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The client you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/admin/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Invoices
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Breadcrumb and Header - No custom colors */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/invoices')} className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Invoices
            </Button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{client.companyName}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{client.companyName}</h1>
                  <p className="text-muted-foreground mt-1">{client.contactPerson} • {client.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge variant="outline" className="gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {client.address}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/invoices')}>
                Back to All Invoices
              </Button>
              <Button onClick={() => navigate(`/admin/clients/${clientId}`)}>
                <User className="w-4 h-4 mr-2" />
                View Client Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats - Default card styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.total} invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{stats.paidAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.paid} invoices paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ₹{stats.pendingAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.active} awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Invoice</p>
                  <p className="text-2xl font-bold">
                    ₹{Math.round(stats.averageAmount).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Per invoice</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search - Default */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices, amounts, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate(`/admin/clients/${clientId}`)}>
                  <User className="w-4 h-4 mr-2" />
                  Client Details
                </Button>
                <Button variant="outline" onClick={() => navigate(`/admin/agreements/${clientId}`)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Agreements
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">All ({clientInvoices.length})</TabsTrigger>
                  <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
                  <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
                  <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List - Default styling */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  {sortedInvoices.length} invoice{sortedInvoices.length !== 1 ? 's' : ''} found for {client.companyName}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/invoices')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Clients
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : sortedInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery
                    ? 'No invoices match your search criteria'
                    : activeTab === 'all'
                    ? 'This client has no invoices yet.'
                    : `No ${activeTab} invoices found.`}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
                {activeTab !== 'all' && (
                  <Button variant="outline" onClick={() => setActiveTab('all')}>
                    Show All Invoices
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedInvoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  const daysRemaining = getDaysRemaining(invoice.dueDate);

                  return (
                    <Card key={invoice.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      Invoice #{invoice.invoiceNumber}
                                    </h3>
                                    <Badge className={cn("gap-1.5", statusConfig.color)}>
                                      <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.iconColor)} />
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant={daysRemaining.variant} className="gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      {daysRemaining.text}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <CalendarDays className="w-4 h-4" />
                                      Created {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewInvoiceDetails(invoice)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Full Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Quick View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download as Text
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {invoice.status === 'draft' && (
                                      <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Invoice
                                      </DropdownMenuItem>
                                    )}
                                    {(invoice.status === 'sent' || invoice.status === 'pending') && (
                                      <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as Paid
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => {
                                        setInvoiceToDelete(invoice);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Invoice
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">Invoice Date</span>
                                    <span className="font-medium">
                                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">Due Date</span>
                                    <span className="font-medium">
                                      {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Items</Label>
                                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {invoice.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="flex items-center justify-between p-2 bg-muted/10 rounded"
                                      >
                                        <span className="text-sm font-medium">
                                          {PRODUCT_TYPE_LABELS[product.type] || product.type}
                                        </span>
                                        <Badge variant="outline" className="ml-auto mr-2">
                                          {product.quantity}
                                        </Badge>
                                        <span className="text-sm font-semibold">
                                          ₹{product.totalPrice.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Financials</Label>
                                  <div className="bg-primary/5 p-4 rounded-lg">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>₹{invoice.tax.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="font-medium">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                          ₹{invoice.total.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {invoice.notes && (
                                <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm">{invoice.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewInvoiceDetails(invoice)}>
                              <FileText className="w-4 h-4 mr-2" />
                              View Full Invoice
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedInvoice(invoice)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Quick View
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button size="sm" className="flex-1" onClick={() => handleSendInvoice(invoice)} disabled={isLoading}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Invoice
                              </Button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'pending') && (
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleMarkPaid(invoice)} disabled={isLoading}>
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
          {sortedInvoices.length > 0 && (
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {sortedInvoices.length} of {clientInvoices.length} invoices
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Total: ₹{stats.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/invoices')} className="text-muted-foreground hover:text-foreground">
                    View all clients
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog - Default */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {invoiceToDelete && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">Invoice #{invoiceToDelete.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Amount: ₹{invoiceToDelete.total.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {format(new Date(invoiceToDelete.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Quick View Dialog - Default */}
      <Dialog open={!!selectedInvoice && !invoiceDetailView} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Invoice Details</DialogTitle>
              <Button size="sm" onClick={() => handleViewInvoiceDetails(selectedInvoice!)}>
                <FileText className="w-4 h-4 mr-2" />
                View Full Invoice
              </Button>
            </div>
          </DialogHeader>
          {selectedInvoice && (() => {
            const statusConfig = getStatusConfig(selectedInvoice.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">Invoice #{selectedInvoice.invoiceNumber}</h3>
                        <p className="text-muted-foreground text-sm">
                          Created {format(new Date(selectedInvoice.createdAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className={cn("gap-1.5", statusConfig.color)}>
                        <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.iconColor)} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Invoice Date</Label>
                        <p className="font-medium">{format(new Date(selectedInvoice.createdAt), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Due Date</Label>
                        <p className="font-medium">{format(new Date(selectedInvoice.dueDate), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Subtotal</Label>
                        <p className="font-medium">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Total</Label>
                        <p className="font-bold text-lg text-primary">
                          ₹{selectedInvoice.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(selectedInvoice)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download as Text
                      </Button>
                      {selectedInvoice.status === 'draft' && (
                        <Button size="sm" onClick={() => { handleSendInvoice(selectedInvoice); setSelectedInvoice(null); }}>
                          <Send className="w-4 h-4 mr-2" />
                          Send Invoice
                        </Button>
                      )}
                      {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'pending') && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { handleMarkPaid(selectedInvoice); setSelectedInvoice(null); }}>
                          <Check className="w-4 h-4 mr-2" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedInvoice.products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{PRODUCT_TYPE_LABELS[product.type] || product.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.comments || `${PRODUCT_TYPE_LABELS[product.type] || product.type} service`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{product.totalPrice.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.quantity} × ₹{product.pricePerUnit?.toLocaleString('en-IN') || (product.totalPrice / product.quantity).toLocaleString('en-IN')}/unit
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedInvoice.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted/20 p-3 rounded-lg">{selectedInvoice.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}