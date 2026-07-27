import dotenv from "dotenv";
import mongoose from "mongoose";
import { LegalDocModel } from "../src/models/legal_doc.model";
 
dotenv.config();
 
const STORE_NAME    = "Furnixo";
const STORE_EMAIL   = "support@furnixo.com";
const STORE_PHONE   = "+977 9823867733";
const STORE_ADDRESS = "Kathmandu, Nepal";
const RETURN_WINDOW = "14 days";
 
// ─── Privacy Policy ───────────────────────────────────────────────────────────
const privacyDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  effectiveDate: new Date(),
  intro:
    `At ${STORE_NAME}, we respect your privacy and are committed to protecting your personal information. ` +
    `This Privacy Policy explains how we collect, use, store, and protect the information you share with us when ` +
    `you browse our website, place an order, or otherwise interact with our services. By using ${STORE_NAME}, you agree to the practices described below.`,
  sections: [
    {
      heading: "Information We Collect",
      body:
        `We collect information that you provide directly to us when you create an account, place an order, contact our support team, or subscribe to marketing communications. This includes your full name, email address, phone number, shipping and billing address, and payment-related details. ` +
        `\n\nWe also automatically collect technical information through cookies and similar technologies, including your IP address, device type, browser, pages visited, items viewed, and the time and duration of your visits. This helps us improve site performance and personalise your experience.`,
    },
    {
      heading: "How We Use Your Information",
      body:
        `We use the information collected for the following purposes:` +
        `\n• To process and fulfil your orders, including arranging delivery and handling returns.` +
        `\n• To send you order confirmations, payment receipts, shipping updates, and other transactional communications.` +
        `\n• To respond to your enquiries and provide customer support.` +
        `\n• To improve our products, services, and user experience based on browsing patterns and feedback.` +
        `\n• To send marketing emails about new arrivals, promotions, and exclusive offers — only if you have opted in. You can unsubscribe at any time.` +
        `\n• To detect, prevent, and address fraud, security incidents, or violations of our Terms of Service.`,
    },
    {
      heading: "Sharing Your Information",
      body:
        `We do not sell, rent, or trade your personal information to third parties. We share information only when necessary to operate our business:` +
        `\n• With trusted service providers such as payment processors (Khalti, eSewa), delivery partners, and email services — all of whom are contractually bound to handle your data securely.` +
        `\n• When required by law, court order, or government request.` +
        `\n• In connection with a business transfer, merger, or acquisition, in which case affected users will be notified in advance.`,
    },
    {
      heading: "Cookies and Tracking Technologies",
      body:
        `We use cookies and similar tracking technologies to operate our website, remember your preferences, keep your shopping cart active across sessions, and analyse how visitors use our site. ` +
        `You can choose to disable cookies through your browser settings, but doing so may affect parts of the site that depend on them — such as staying signed in or completing checkout.`,
    },
    {
      heading: "Data Security",
      body:
        `We implement industry-standard security measures to protect your information from unauthorised access, alteration, disclosure, or destruction. Payment transactions are processed through PCI-compliant gateways, and sensitive data such as passwords is encrypted at rest. ` +
        `However, no method of transmission over the internet is entirely secure, and we cannot guarantee absolute security. We encourage you to keep your account credentials confidential.`,
    },
    {
      heading: "Your Rights",
      body:
        `You have the right to:` +
        `\n• Access the personal information we hold about you.` +
        `\n• Request correction of any inaccurate or incomplete information.` +
        `\n• Request deletion of your account and personal data, subject to our legal record-keeping obligations.` +
        `\n• Opt out of marketing communications at any time.` +
        `\n• Withdraw consent for processing where we rely on consent as the legal basis.` +
        `\n\nTo exercise any of these rights, contact us at ${STORE_EMAIL}. We will respond within 30 days.`,
    },
    {
      heading: "Children's Privacy",
      body:
        `${STORE_NAME} is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. ` +
        `If you believe a child has provided us with personal information, please contact us and we will promptly delete it.`,
    },
    {
      heading: "Data Retention",
      body:
        `We retain your personal information only for as long as necessary to fulfil the purposes outlined in this policy, comply with our legal obligations, resolve disputes, and enforce our agreements. ` +
        `Order records are retained for a minimum of 7 years for tax and accounting purposes.`,
    },
    {
      heading: "Changes to This Policy",
      body:
        `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. The "Effective Date" at the top of this page indicates when the policy was last revised. ` +
        `For significant changes, we will notify registered users by email or through a prominent notice on our website. We encourage you to review this policy periodically.`,
    },
    {
      heading: "Contact Us",
      body:
        `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:` +
        `\n\nEmail: ${STORE_EMAIL}` +
        `\nPhone: ${STORE_PHONE}` +
        `\nAddress: ${STORE_ADDRESS}` +
        `\n\nWe aim to respond to all enquiries within 2 business days.`,
    },
  ],
};
 
// ─── Terms of Service ─────────────────────────────────────────────────────────
const termsDoc = {
  slug: "terms",
  title: "Terms of Service",
  effectiveDate: new Date(),
  intro:
    `Welcome to ${STORE_NAME}. These Terms of Service ("Terms") govern your use of our website, mobile application, and any services we provide. ` +
    `By accessing or using ${STORE_NAME}, you agree to be bound by these Terms. If you do not agree, please do not use our services.`,
  sections: [
    {
      heading: "Acceptance of Terms",
      body:
        `By creating an account, placing an order, or otherwise using our services, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. ` +
        `These Terms may be updated occasionally, and continued use of ${STORE_NAME} constitutes acceptance of the updated Terms.`,
    },
    {
      heading: "Eligibility",
      body:
        `You must be at least 18 years of age and capable of forming a legally binding contract under applicable law to use ${STORE_NAME}. ` +
        `By using our services, you represent and warrant that you meet these requirements and that all information you provide is accurate and truthful.`,
    },
    {
      heading: "Account Registration",
      body:
        `To place orders, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. ` +
        `Notify us immediately at ${STORE_EMAIL} if you suspect any unauthorised access or security breach. ` +
        `We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse our services.`,
    },
    {
      heading: "Products and Pricing",
      body:
        `We make every effort to display our products and their colours, dimensions, and materials as accurately as possible. However, due to differences in screen settings, actual products may vary slightly from their on-screen representation. ` +
        `\n\nAll prices are listed in Nepalese Rupees (NPR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices at any time without prior notice. The price applicable to your order is the price displayed at the time you complete your purchase.`,
    },
    {
      heading: "Orders and Acceptance",
      body:
        `An order placed through our website is an offer to purchase. We reserve the right to accept or decline any order at our sole discretion. Reasons for declining may include — but are not limited to — product unavailability, errors in product or pricing information, or suspected fraudulent activity. ` +
        `\n\nIf we cancel an order after payment, you will receive a full refund to your original payment method within 5–7 business days.`,
    },
    {
      heading: "Payment",
      body:
        `We accept payments through Khalti, eSewa, and Cash on Delivery (where available). All online payments are processed through secure third-party gateways. ` +
        `${STORE_NAME} does not store your full payment card details on our servers. ` +
        `For Cash on Delivery orders, payment must be made in full to the delivery agent upon receipt of goods.`,
    },
    {
      heading: "Shipping and Delivery",
      body:
        `We deliver across Nepal, with delivery times typically ranging from 2 to 7 business days depending on your location. Shipping fees, if any, are calculated at checkout based on the delivery address. ` +
        `\n\nYou are responsible for providing accurate shipping information. We are not liable for failed deliveries resulting from incorrect addresses or unavailability of the recipient. ` +
        `Risk of loss for products passes to you upon delivery to the address you provided.`,
    },
    {
      heading: "Returns and Refunds",
      body:
        `We offer a ${RETURN_WINDOW} return window from the date of delivery. Items must be in their original condition, unused, and with all original packaging and tags intact to qualify for a refund. ` +
        `\n\nCertain items may be excluded from returns, including custom-made furniture, clearance sale items, and hygiene-sensitive products. ` +
        `\n\nTo initiate a return, log in to your account, go to "My Orders," and submit a return request from the order detail page. Refunds are processed to the original payment method within 5–7 business days after the returned items are received and inspected.`,
    },
    {
      heading: "Intellectual Property",
      body:
        `All content on ${STORE_NAME} — including text, images, graphics, logos, product designs, and software — is the property of ${STORE_NAME} or its licensors and is protected by copyright, trademark, and other intellectual property laws. ` +
        `\n\nYou may not reproduce, distribute, modify, or create derivative works from any of our content without our prior written consent. Personal, non-commercial use of our website (such as browsing and shopping) is permitted.`,
    },
    {
      heading: "User Conduct",
      body:
        `By using ${STORE_NAME}, you agree not to:` +
        `\n• Use our services for any unlawful or fraudulent purpose.` +
        `\n• Interfere with or disrupt the security, integrity, or performance of our website.` +
        `\n• Attempt to gain unauthorised access to any part of our systems or other users' accounts.` +
        `\n• Use automated scripts, bots, scrapers, or any similar tools to access our services.` +
        `\n• Post or transmit any content that is abusive, threatening, defamatory, or otherwise unlawful.` +
        `\n\nViolations may result in account termination and legal action.`,
    },
    {
      heading: "Limitation of Liability",
      body:
        `To the maximum extent permitted by law, ${STORE_NAME} and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising out of or in connection with your use of our services. ` +
        `\n\nOur total liability for any claim arising from these Terms or your use of our services shall not exceed the amount you paid us in the twelve months preceding the claim.`,
    },
    {
      heading: "Indemnification",
      body:
        `You agree to defend, indemnify, and hold harmless ${STORE_NAME}, its affiliates, and its respective officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or related to your violation of these Terms or your misuse of our services.`,
    },
    {
      heading: "Governing Law",
      body:
        `These Terms are governed by and construed in accordance with the laws of Nepal. Any disputes arising out of or relating to these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Kathmandu, Nepal.`,
    },
    {
      heading: "Changes to These Terms",
      body:
        `We reserve the right to modify these Terms at any time. The "Effective Date" at the top of this page indicates when the Terms were last revised. ` +
        `For significant changes, we will provide notice through our website or by email to registered users. Continued use of our services after such changes constitutes acceptance of the updated Terms.`,
    },
    {
      heading: "Contact Us",
      body:
        `For questions about these Terms, please reach out:` +
        `\n\nEmail: ${STORE_EMAIL}` +
        `\nPhone: ${STORE_PHONE}` +
        `\nAddress: ${STORE_ADDRESS}`,
    },
  ],
};
 
// ─── Run seed ─────────────────────────────────────────────────────────────────
async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/furnixo");
  console.log("✅ Mongo connected");
 
  const docs = [privacyDoc, termsDoc];
 
  for (const doc of docs) {
    const r = await LegalDocModel.findOneAndUpdate(
      { slug: doc.slug },
      { $set: doc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Upserted ${r.slug} — ${r.sections.length} sections`);
  }
 
  await mongoose.disconnect();
  console.log("🌱 Legal seed complete");
}
 
run().catch((e) => {
  console.error(e);
  process.exit(1);
});