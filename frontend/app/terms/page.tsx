import { LegalPageView } from "../legal/LegalPageView";
 
export const metadata = {
  title: "Furnixo",
  description: "The terms and conditions that govern your use of Furnixo.",
};
 
export default function TermsPage() {
  return <LegalPageView slug="terms" />;
}
 