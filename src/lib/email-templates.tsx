/**
 * EMAIL TEMPLATE SYSTEM — Resend compatible, email-safe.
 * --------------------------------------------------------
 * These components generate HTML using table-based layouts, inline styles,
 * and standard email safety rules (600px max width, system fonts).
 * Each includes a plain-text fallback generator.
 */

import React from "react";

const APP_URL = "https://id-preview--9ab587ea-6385-4395-b4d5-486f9e59066f.lovable.app";
const BRAND_COLOR = "#121C2D"; // navy
const ACTION_COLOR = "#0066FF"; // blue/action

interface EmailProps {
  previewText?: string;
  children: React.ReactNode;
}

/** Base Layout - 600px, table-based, inline styles */
export const EmailLayout = ({ previewText, children }: EmailProps) => (
  <div style={{ backgroundColor: "#F9FAFB", padding: "20px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
    {previewText && <div style={{ display: "none", fontSize: "1px", color: "#F9FAFB", lineHeight: "1px", maxHeight: "0px", maxWidth: "0px", opacity: 0, overflow: "hidden" }}>{previewText}</div>}
    <table align="center" border={0} cellPadding={0} cellSpacing={0} width="600" style={{ backgroundColor: "#FFFFFF", margin: "0 auto", borderCollapse: "collapse", borderRadius: "8px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
      {/* Header */}
      <tr>
        <td style={{ padding: "40px 40px 20px 40px" }}>
          <img src={`${APP_URL}/logo-dark.png`} alt="Keyhold" width="120" style={{ display: "block", border: 0 }} />
        </td>
      </tr>
      {children}
      {/* Footer */}
      <tr>
        <td style={{ padding: "40px", backgroundColor: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 8px 0", lineHeight: "1.5" }}>
            Sent by <strong>Keyhold</strong> on behalf of your property manager.
          </p>
          <p style={{ fontSize: "12px", color: "#6B7280", margin: "0", lineHeight: "1.5" }}>
            <a href={`${APP_URL}/settings/notifications`} style={{ color: ACTION_COLOR, textDecoration: "none" }}>Unsubscribe or manage preferences</a> • 
            <a href={`${APP_URL}/support`} style={{ color: ACTION_COLOR, textDecoration: "none", marginLeft: "8px" }}>Help Center</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
);

export const EmailButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <table border={0} cellPadding={0} cellSpacing={0} style={{ margin: "24px 0" }}>
    <tr>
      <td align="center" bgcolor={ACTION_COLOR} style={{ borderRadius: "100px" }}>
        <a href={href} style={{ fontSize: "16px", fontWeight: "bold", color: "#FFFFFF", textDecoration: "none", padding: "12px 32px", display: "inline-block" }}>
          {children}
        </a>
      </td>
    </tr>
  </table>
);

export const EmailH1 = ({ children }: { children: React.ReactNode }) => (
  <h1 style={{ fontSize: "24px", fontWeight: "bold", color: BRAND_COLOR, margin: "0 0 16px 0", lineHeight: "1.2" }}>{children}</h1>
);

export const EmailP = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: "16px", color: "#374151", margin: "0 0 16px 0", lineHeight: "1.6" }}>{children}</p>
);

export const EmailDetail = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginBottom: "8px" }}>
    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}: </span>
    <span style={{ fontSize: "16px", color: BRAND_COLOR }}>{value}</span>
  </div>
);

/** Template Registry for the Gallery */
export const EMAIL_TEMPLATES = {
  INVITE: {
    subject: "Invite: Join your new home on Keyhold",
    render: (data: { tenantName: string; propertyName: string; inviteUrl: string }) => (
      <EmailLayout previewText={`Hi ${data.tenantName}, your property manager invited you to Keyhold.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Welcome to {data.propertyName}</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>Your property manager is using Keyhold to manage your rental. Join the portal to pay rent, view your lease, and submit maintenance requests.</EmailP>
            <EmailButton href={data.inviteUrl}>Join Tenant Portal</EmailButton>
            <EmailP>See you inside,</EmailP>
            <EmailP>The Keyhold Team</EmailP>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Welcome to ${data.propertyName}!\n\nHi ${data.tenantName},\n\nYour property manager invited you to Keyhold. Join to pay rent and view your lease: ${data.inviteUrl}`,
  },
  RENT_REMINDER: {
    subject: "Reminder: Rent is due soon",
    render: (data: { tenantName: string; amount: string; dueDate: string; address: string; payUrl: string }) => (
      <EmailLayout previewText={`Rent of ${data.amount} for ${data.address} is due on ${data.dueDate}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Rent Reminder</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>This is a friendly reminder that your rent for <strong>{data.address}</strong> is due on <strong>{data.dueDate}</strong>.</EmailP>
            <div style={{ padding: "20px", backgroundColor: "#F3F4F6", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Amount Due" value={data.amount} />
              <EmailDetail label="Due Date" value={data.dueDate} />
            </div>
            <EmailButton href={data.payUrl}>Pay Rent Online</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Rent Reminder\n\nHi ${data.tenantName}, rent of ${data.amount} for ${data.address} is due on ${data.dueDate}.\n\nPay here: ${data.payUrl}`,
  },
  RENT_OVERDUE: {
    subject: "Action Required: Your rent is overdue",
    render: (data: { tenantName: string; amount: string; days: number; address: string; payUrl: string }) => (
      <EmailLayout previewText={`Your rent payment for ${data.address} is ${data.days} days overdue.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Rent Overdue</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>Our records show that your rent payment for <strong>{data.address}</strong> is currently <strong>{data.days} days overdue</strong>. Please settle this as soon as possible to avoid late fees or further action.</EmailP>
            <div style={{ padding: "20px", borderLeft: `4px solid #EF4444`, backgroundColor: "#FEF2F2", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Amount Owed" value={data.amount} />
              <EmailDetail label="Status" value="Overdue" />
            </div>
            <EmailButton href={data.payUrl}>Pay Overdue Balance</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Rent Overdue\n\nHi ${data.tenantName}, your rent for ${data.address} is ${data.days} days overdue. Please pay ${data.amount} immediately: ${data.payUrl}`,
  },
  PAYMENT_RECEIPT: {
    subject: "Receipt: We've received your payment",
    render: (data: { tenantName: string; amount: string; date: string; address: string; receiptUrl: string }) => (
      <EmailLayout previewText={`Thank you for your payment of ${data.amount} for ${data.address}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Payment Received</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>Thank you! We've successfully received your payment for <strong>{data.address}</strong>.</EmailP>
            <div style={{ padding: "20px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Amount Paid" value={data.amount} />
              <EmailDetail label="Date" value={data.date} />
              <EmailDetail label="Address" value={data.address} />
            </div>
            <EmailButton href={data.receiptUrl}>View Full Receipt</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Receipt: Payment Received\n\nHi ${data.tenantName}, thank you for your payment of ${data.amount} for ${data.address} on ${data.date}.`,
  },
  MAINTENANCE_REQUEST: {
    subject: "Confirmed: Maintenance request received",
    render: (data: { tenantName: string; category: string; id: string; address: string; viewUrl: string }) => (
      <EmailLayout previewText={`We've received your ${data.category} request for ${data.address}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Request Received</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>We've received your maintenance request. Our team has been notified and will review it shortly.</EmailP>
            <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Request ID" value={data.id} />
              <EmailDetail label="Category" value={data.category} />
              <EmailDetail label="Address" value={data.address} />
            </div>
            <EmailButton href={data.viewUrl}>Track Progress</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Maintenance Request Received\n\nHi ${data.tenantName}, we received your ${data.category} request (#${data.id}) for ${data.address}. Track it here: ${data.viewUrl}`,
  },
  MAINTENANCE_UPDATE: {
    subject: "Update: Your maintenance request status changed",
    render: (data: { tenantName: string; status: string; id: string; note: string; viewUrl: string }) => (
      <EmailLayout previewText={`Your maintenance request #${data.id} is now ${data.status}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Status Update</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>The status of your maintenance request <strong>#{data.id}</strong> has been updated to <strong>{data.status}</strong>.</EmailP>
            {data.note && (
              <div style={{ padding: "20px", backgroundColor: "#F0F9FF", borderLeft: `4px solid ${ACTION_COLOR}`, borderRadius: "4px", marginBottom: "24px" }}>
                <EmailP><strong>Update from Manager:</strong><br />{data.note}</EmailP>
              </div>
            )}
            <EmailButton href={data.viewUrl}>View Details</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Maintenance Update\n\nHi ${data.tenantName}, your request #${data.id} is now ${data.status}. Update: ${data.note}. View here: ${data.viewUrl}`,
  },
  LEASE_EXPIRING: {
    subject: "Notice: Your lease is expiring soon",
    render: (data: { tenantName: string; expiryDate: string; address: string; actionUrl: string }) => (
      <EmailLayout previewText={`Your lease for ${data.address} expires on ${data.expiryDate}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Lease Expiry Reminder</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>Your lease agreement for <strong>{data.address}</strong> is set to expire on <strong>{data.expiryDate}</strong>.</EmailP>
            <EmailP>Please let us know your intentions regarding renewal by clicking the button below to view your options.</EmailP>
            <EmailButton href={data.actionUrl}>Review Renewal Options</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Lease Expiry\n\nHi ${data.tenantName}, your lease for ${data.address} expires on ${data.expiryDate}. Review options here: ${data.actionUrl}`,
  },
  NOTICE_SERVED: {
    subject: "Important: A formal notice has been served",
    render: (data: { tenantName: string; noticeType: string; address: string; viewUrl: string }) => (
      <EmailLayout previewText={`An important notice (${data.noticeType}) regarding your tenancy has been issued.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Important Tenancy Notice</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>A formal <strong>{data.noticeType}</strong> has been issued for your tenancy at <strong>{data.address}</strong>. Please review this document immediately.</EmailP>
            <div style={{ padding: "20px", border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Notice Type" value={data.noticeType} />
              <EmailDetail label="Issued To" value={data.tenantName} />
            </div>
            <EmailButton href={data.viewUrl}>Review Notice</EmailButton>
            <EmailP style={{ fontSize: "14px", color: "#6B7280" }}>This is a formal communication. If you have questions, please contact your manager directly.</EmailP>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Important Notice Served\n\nHi ${data.tenantName}, a formal ${data.noticeType} has been served for ${data.address}. View here: ${data.viewUrl}`,
  },
  DOCUMENT_SHARED: {
    subject: "New document shared with you",
    render: (data: { tenantName: string; docName: string; sharedBy: string; viewUrl: string }) => (
      <EmailLayout previewText={`${data.sharedBy} shared a document with you: ${data.docName}.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Document Shared</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP><strong>{data.sharedBy}</strong> has shared a new document with you: <strong>{data.docName}</strong>.</EmailP>
            <EmailButton href={data.viewUrl}>View Document</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Document Shared\n\nHi ${data.tenantName}, ${data.sharedBy} shared "${data.docName}" with you. View here: ${data.viewUrl}`,
  },
  TEAM_INVITE: {
    subject: "Invitation: Join a property management team",
    render: (data: { name: string; orgName: string; inviteUrl: string }) => (
      <EmailLayout previewText={`${data.orgName} invited you to join their management team on Keyhold.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Join {data.orgName}</EmailH1>
            <EmailP>Hi {data.name},</EmailP>
            <EmailP>You've been invited to join the <strong>{data.orgName}</strong> team on Keyhold to help manage their property portfolio.</EmailP>
            <EmailButton href={data.inviteUrl}>Accept Invitation</EmailButton>
            <EmailP>If you weren't expecting this invite, you can safely ignore this email.</EmailP>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Team Invite\n\nHi ${data.name}, join ${data.orgName} on Keyhold: ${data.inviteUrl}`,
  },
  PASSWORD_RESET: {
    subject: "Reset your Keyhold password",
    render: (data: { name: string; resetUrl: string }) => (
      <EmailLayout previewText="We received a request to reset your Keyhold password.">
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Reset Password</EmailH1>
            <EmailP>Hi {data.name},</EmailP>
            <EmailP>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</EmailP>
            <EmailButton href={data.resetUrl}>Reset Password</EmailButton>
            <EmailP>If you didn't request this, you can ignore this email. Your password will remain unchanged.</EmailP>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Reset Password\n\nHi ${data.name}, reset your Keyhold password here: ${data.resetUrl}. Link expires in 1 hour.`,
  },
  ONBOARDING: {
    subject: "Welcome to Keyhold! Let's get started",
    render: (data: { name: string; setupUrl: string }) => (
      <EmailLayout previewText="Welcome to Keyhold. Your new command center for property management is ready.">
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>Welcome, {data.name}!</EmailH1>
            <EmailP>We're excited to have you on board. Keyhold helps you manage properties, tenants, and finances with zero friction.</EmailP>
            <EmailP>Ready to set up your first property?</EmailP>
            <EmailButton href={data.setupUrl}>Start Setup Wizard</EmailButton>
            <EmailP>Need help? Reply to this email or visit our Help Center.</EmailP>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Welcome to Keyhold!\n\nHi ${data.name}, we're excited to have you. Start your setup here: ${data.setupUrl}`,
  },
  MONTHLY_DIGEST: {
    subject: "Monthly Summary: How your portfolio performed",
    render: (data: { name: string; month: string; income: string; occupancy: string; viewUrl: string }) => (
      <EmailLayout previewText={`Your monthly performance summary for ${data.month} is ready.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>{data.month} Summary</EmailH1>
            <EmailP>Hi {data.name}, here is a quick look at your portfolio's performance last month.</EmailP>
            <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ marginBottom: "24px" }}>
              <tr>
                <td width="50%" style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px 0 0 8px" }}>
                  <EmailDetail label="Total Income" value={data.income} />
                </td>
                <td width="50%" style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "0 8px 8px 0", borderLeft: "1px solid #E5E7EB" }}>
                  <EmailDetail label="Occupancy" value={data.occupancy} />
                </td>
              </tr>
            </table>
            <EmailButton href={data.viewUrl}>View Full Report</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `Monthly Summary - ${data.month}\n\nHi ${data.name}, income was ${data.income} with ${data.occupancy} occupancy. View report: ${data.viewUrl}`,
  },
  YEARLY_RECEIPT: {
    subject: "Annual Rent Receipt Available",
    render: (data: { tenantName: string; year: string; totalPaid: string; viewUrl: string }) => (
      <EmailLayout previewText={`Your official rent receipt for tax year ${data.year} is ready.`}>
        <tr>
          <td style={{ padding: "0 40px 40px 40px" }}>
            <EmailH1>{data.year} Tax Receipt</EmailH1>
            <EmailP>Hi {data.tenantName},</EmailP>
            <EmailP>Your annual rent receipt for the <strong>{data.year}</strong> tax year is now available for download.</EmailP>
            <div style={{ padding: "20px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", marginBottom: "24px" }}>
              <EmailDetail label="Tax Year" value={data.year} />
              <EmailDetail label="Total Paid" value={data.totalPaid} />
            </div>
            <EmailButton href={data.viewUrl}>Download PDF Receipt</EmailButton>
          </td>
        </tr>
      </EmailLayout>
    ),
    text: (data: any) => `${data.year} Tax Receipt\n\nHi ${data.tenantName}, your tax receipt for ${data.year} is ready. Total paid: ${data.totalPaid}. Download here: ${data.viewUrl}`,
  },
};
